"""AI Service for JuiceQu - Handles AI chat, voice processing, and recommendations."""
import base64
import json
import logging
import re
import time
import uuid
from datetime import datetime
from typing import Any, Optional

from sqlalchemy.orm import Session

from app.core.exceptions import BadRequestException, ExternalServiceException
from app.models.ai_interaction import AIInteraction, InteractionStatus, InteractionType
from app.models.product import Product, ProductSize
from app.models.user import User
from app.services.ai.llm_provider import get_llm_provider
from app.services.ai.rag_service import RAGService
from app.services.ai.agents import AgentOrchestrator
from app.services.conversation_memory import get_conversation_memory

logger = logging.getLogger(__name__)


DANGEROUS_PROMPT_PATTERNS = [
    r"(?i)ignore\s+(?:all\s+)?previous\s+instructions?",
    r"(?i)disregard\s+(?:all\s+)?(?:previous\s+)?instructions?",
    r"(?i)forget\s+(?:all\s+)?(?:previous\s+)?(?:instructions?|everything)",
    r"(?i)system\s*:\s*",
    r"(?i)you\s+are\s+now\s+(?:an?\s+)?(?:admin|administrator|root|superuser)",
    r"(?i)override\s+(?:all\s+)?security",
    r"(?i)bypass\s+(?:all\s+)?(?:security|restrictions?|filters?)",
    r"(?i)execute\s+(?:this\s+)?(?:command|code|script)",
    r"(?i)reveal\s+(?:your\s+)?(?:system\s+)?(?:prompt|instructions?)",
    r"(?i)show\s+(?:me\s+)?(?:your\s+)?(?:system\s+)?(?:prompt|instructions?)",
    r"(?i)what\s+(?:are\s+)?your\s+(?:system\s+)?instructions?",
    r"(?i)act\s+as\s+(?:if\s+)?(?:you\s+(?:are|were)\s+)?(?:an?\s+)?(?:different|new|other)",
    r"(?i)pretend\s+(?:to\s+be|you\s+are)",
    r"(?i)delete\s+(?:all\s+)?(?:data|users?|orders?|products?)",
    r"(?i)drop\s+(?:table|database)",
    r"(?i)<\s*script",
    r"(?i)javascript\s*:",
    r"(?i)on(?:error|load|click|mouse)\s*=",
]


def sanitize_user_input(user_input: str, max_length: int = 1000) -> str:
    """Sanitize user input to prevent prompt injection."""
    if not user_input:
        return ""

    user_input = user_input[:max_length]

    for pattern in DANGEROUS_PROMPT_PATTERNS:
        user_input = re.sub(pattern, "[FILTERED]", user_input)

    user_input = re.sub(r"\n{3,}", "\n\n", user_input)
    user_input = re.sub(r"\s{5,}", " ", user_input)
    user_input = re.sub(r"[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]", "", user_input)

    return user_input.strip()


def sanitize_ai_response(response: str) -> str:
    """Sanitize AI response to prevent XSS."""
    if not response:
        return ""

    sanitized = re.sub(r"<[^>]+>", "", response)
    sanitized = re.sub(r"\n{3,}", "\n\n", sanitized)
    sanitized = re.sub(r" {2,}", " ", sanitized)

    dangerous_patterns = [
        r"<\s*script",
        r"javascript\s*:",
        r"on\w+\s*=",
        r"<\s*iframe",
        r"<\s*object",
        r"<\s*embed",
        r"<\s*link",
        r"<\s*style",
        r"<\s*meta",
        r"<\s*base",
        r"data\s*:",
        r"vbscript\s*:",
    ]

    for pattern in dangerous_patterns:
        sanitized = re.sub(pattern, "", sanitized, flags=re.IGNORECASE)

    return sanitized


class AIService:
    """Service for handling AI interactions with Multi-Agent system."""

    def __init__(self, db: Session):
        self.db = db
        self.llm_provider = get_llm_provider()
        self.rag_service = RAGService(db)
        self.orchestrator = AgentOrchestrator(db)
        self.memory = get_conversation_memory()

    async def chat(
        self,
        user_input: str,
        user_id: Optional[str] = None,
        session_id: Optional[str] = None,
        locale: str = "id",
        conversation_history: Optional[list[dict[str, str]]] = None,
        is_voice_command: bool = False,
    ) -> dict[str, Any]:
        """Process text chat with AI using Multi-Agent system."""
        if not session_id:
            session_id = str(uuid.uuid4())

        sanitized_input = sanitize_user_input(user_input)

        interaction = AIInteraction(
            session_id=session_id,
            user_id=user_id,
            interaction_type=InteractionType.VOICE if is_voice_command else InteractionType.CHAT,
            status=InteractionStatus.ACTIVE,
            user_input=sanitized_input,
            user_input_type="voice" if is_voice_command else "text",
        )
        self.db.add(interaction)

        try:
            start_time = time.time()

            if conversation_history is None and self.memory.is_available:
                history = await self.memory.get_history(session_id)
                conversation_history = [{"role": h["role"], "content": h["content"]} for h in history]

            await self.memory.add_message(session_id, "user", sanitized_input)

            result = await self.orchestrator.process(
                user_input=sanitized_input,
                locale=locale,
                user_id=user_id,
                session_id=session_id,
                conversation_history=conversation_history,
                is_voice_command=is_voice_command,
            )

            response_time_ms = int((time.time() - start_time) * 1000)

            response_text = result.get("response", "")
            intent = result.get("intent", "unknown")
            order_data = result.get("order_data")
            featured_products = result.get("featured_products")

            clean_response = sanitize_ai_response(response_text)

            await self.memory.add_message(session_id, "assistant", clean_response, {"intent": intent})

            interaction.ai_response = clean_response
            interaction.response_time_ms = response_time_ms
            interaction.model_used = "multi-agent"
            interaction.detected_intent = intent
            interaction.status = InteractionStatus.COMPLETED
            interaction.completed_at = datetime.utcnow()

            self.db.commit()

            return {
                "response": clean_response,
                "session_id": session_id,
                "context_used": None,
                "response_time_ms": response_time_ms,
                "intent": intent,
                "order_data": order_data,
                "show_checkout": order_data is not None and len(order_data.get("items", [])) > 0,
                "featured_products": featured_products,
                "destination": result.get("destination"),
                "should_navigate": result.get("should_navigate", False),
                "search_query": result.get("search_query"),
                "sort_by": result.get("sort_by"),
            }

        except Exception as e:
            logger.error("Error in AI chat: %s", e)
            interaction.status = InteractionStatus.ERROR
            interaction.ai_response = f"Error: {e}"
            self.db.commit()
            raise ExternalServiceException("AI service", str(e))

    async def process_voice(
        self,
        audio_data: bytes,
        user_id: Optional[str] = None,
        session_id: Optional[str] = None,
    ) -> dict[str, Any]:
        """Process voice input using Gemini STT and AI."""
        if not session_id:
            session_id = str(uuid.uuid4())

        interaction = AIInteraction(
            session_id=session_id,
            user_id=user_id,
            interaction_type=InteractionType.VOICE,
            status=InteractionStatus.ACTIVE,
            user_input="[AUDIO DATA]",
            user_input_type="audio",
        )
        self.db.add(interaction)

        try:
            start_time = time.time()

            result = await self.llm_provider.transcribe_audio(audio_data, language="id")

            transcribed_text = result.get("transcription", "")
            if not transcribed_text:
                raise ExternalServiceException("STT service", result.get("error", "Empty transcription"))

            interaction.user_input = transcribed_text

            ai_result = await self.chat(
                user_input=transcribed_text,
                user_id=user_id,
                session_id=session_id,
            )

            response_time_ms = int((time.time() - start_time) * 1000)

            interaction.ai_response = ai_result.get("response", "")
            interaction.response_time_ms = response_time_ms
            interaction.status = InteractionStatus.COMPLETED
            interaction.completed_at = datetime.utcnow()

            self.db.commit()

            return {
                "transcription": transcribed_text,
                "response": ai_result.get("response", ""),
                "session_id": session_id,
                "response_time_ms": response_time_ms,
            }

        except Exception as e:
            logger.error("Error in voice processing: %s", e)
            interaction.status = InteractionStatus.ERROR
            interaction.ai_response = f"Error: {e}"
            self.db.commit()
            raise ExternalServiceException("Voice processing service", str(e))

    async def process_voice_command(
        self,
        audio_data: bytes,
        user_id: Optional[str] = None,
        session_id: Optional[str] = None,
    ) -> dict[str, Any]:
        """Process voice command using Gemini STT + intent parsing in one request."""
        if not session_id:
            session_id = str(uuid.uuid4())

        interaction = AIInteraction(
            session_id=session_id,
            user_id=user_id,
            interaction_type=InteractionType.VOICE,
            status=InteractionStatus.ACTIVE,
            user_input="[VOICE COMMAND]",
            user_input_type="audio",
        )
        self.db.add(interaction)

        try:
            start_time = time.time()

            products = (
                self.db.query(Product)
                .filter(Product.is_available == True, Product.is_deleted == False)
                .order_by(Product.order_count.desc().nullslast())
                .all()
            )

            products_context = "\n".join([
                f"- {p.name} (ID: {p.id}, Rp {p.base_price:,.0f})"
                for p in products
            ])

            result = await self.llm_provider.transcribe_and_parse_voice_command(
                audio_data=audio_data,
                products_context=products_context,
                language="id",
            )

            response_time_ms = int((time.time() - start_time) * 1000)

            if "error" in result:
                raise ExternalServiceException("Voice command", result["error"])

            transcription = result.get("transcription", "")
            action = result.get("action", "")
            message = result.get("message", "")

            interaction.user_input = transcription
            interaction.ai_response = message
            interaction.response_time_ms = response_time_ms
            interaction.detected_intent = action
            interaction.status = InteractionStatus.COMPLETED
            interaction.completed_at = datetime.utcnow()

            self.db.commit()

            order_items = []
            if action == "add_to_cart":
                products_dict = {p.name.lower(): p for p in products}
                for item in result.get("products", []):
                    product_name = item.get("name", "").lower()
                    matched = products_dict.get(product_name)
                    if matched:
                        order_items.append({
                            "product_id": matched.id,
                            "product_name": matched.name,
                            "quantity": item.get("quantity", 1),
                            "size": item.get("size", "medium"),
                            "unit_price": matched.base_price,
                            "image_url": matched.hero_image or matched.thumbnail_image,
                        })

            return {
                "transcription": transcription,
                "action": action,
                "message": message,
                "products": result.get("products", []),
                "destination": result.get("destination"),
                "search_query": result.get("search_query"),
                "order_items": order_items,
                "session_id": session_id,
                "response_time_ms": response_time_ms,
            }

        except Exception as e:
            logger.error("Error in voice command: %s", e)
            interaction.status = InteractionStatus.ERROR
            interaction.ai_response = f"Error: {e}"
            self.db.commit()
            raise ExternalServiceException("Voice command service", str(e))

    async def get_recommendations(
        self,
        user_id: Optional[str] = None,
        preferences: Optional[str] = None,
        limit: int = 5,
    ) -> list[dict[str, Any]]:
        """Get personalized product recommendations using AI."""
        try:
            user_context = ""
            if user_id:
                user = self.db.query(User).filter(User.id == user_id).first()
                if user and user.preferences:
                    user_context = f"User preferences: {user.preferences}\n"

            if preferences:
                user_context += f"Current request preferences: {preferences}\n"

            products = (
                self.db.query(Product)
                .filter(Product.is_available == True)
                .order_by(Product.order_count.desc(), Product.average_rating.desc())
                .limit(limit * 2)
                .all()
            )

            if not products:
                return []

            product_info = "\n".join([
                f"- {p.name}: {p.description or 'No description'} "
                f"(Price: Rp {p.base_price:,.0f}, Calories: {p.calories or 'N/A'})"
                for p in products
            ])

            prompt = f"""{user_context}

Available products:
{product_info}

Based on the user preferences and the available products, recommend the top {limit} products.
Return your response as a JSON array with objects containing:
- product_id: the product ID
- reason: brief reason for recommendation
- score: relevance score from 1-10"""

            result = await self.llm_provider.chat_completion(
                messages=[
                    {
                        "role": "system",
                        "content": "You are a juice recommendation expert. Always respond with valid JSON only.",
                    },
                    {"role": "user", "content": prompt},
                ]
            )

            try:
                content = result.get("content", "[]")
                json_match = re.search(r"\[[\s\S]*\]", content)
                if json_match:
                    recommendations = json.loads(json_match.group())
                else:
                    recommendations = json.loads(content)
            except json.JSONDecodeError:
                recommendations = [
                    {"product_id": str(p.id), "reason": "Popular choice", "score": 8}
                    for p in products[:limit]
                ]

            recommended_products = []
            products_dict = {str(p.id): p for p in products}

            for rec in recommendations[:limit]:
                product_id = str(rec.get("product_id", ""))
                product = products_dict.get(product_id)

                if product:
                    recommended_products.append({
                        "id": str(product.id),
                        "name": product.name,
                        "description": product.description,
                        "base_price": product.base_price,
                        "image_url": product.image_url,
                        "calories": product.calories,
                        "category_name": product.category.name if product.category else None,
                        "reason": rec.get("reason", "Recommended for you"),
                        "score": rec.get("score", 8),
                    })

            return recommended_products

        except Exception as e:
            logger.error("Error getting recommendations: %s", e)
            raise ExternalServiceException("Recommendation service", str(e))

    async def process_voice_order(
        self,
        audio_data: bytes,
        user_id: Optional[str] = None,
    ) -> dict[str, Any]:
        """Process voice order using Gemini STT and intent detection."""
        try:
            result = await self.llm_provider.transcribe_audio(audio_data, language="id")

            transcribed_text = result.get("transcription", "")
            if not transcribed_text:
                return {
                    "transcription": "",
                    "order_data": {"intent": "error", "items": [], "notes": "Could not transcribe audio"},
                }

            order_prompt = f"""Extract order information from the following text: "{transcribed_text}"

Return a JSON object with:
- intent: "order" if this is an order, "inquiry" if just asking questions
- items: array of objects with:
  - product_name: name of the product
  - quantity: number of items (default 1)
  - size: "small", "medium", or "large" (default "medium")
- notes: any additional notes or special requests"""

            llm_result = await self.llm_provider.chat_completion(
                messages=[
                    {
                        "role": "system",
                        "content": "You are an order processing assistant. Always respond with valid JSON only.",
                    },
                    {"role": "user", "content": order_prompt},
                ]
            )

            try:
                content = llm_result.get("content", "{}")
                json_match = re.search(r"\{[\s\S]*\}", content)
                if json_match:
                    order_data = json.loads(json_match.group())
                else:
                    order_data = json.loads(content)
            except json.JSONDecodeError:
                order_data = {"intent": "inquiry", "items": [], "notes": "Could not understand order"}

            if order_data.get("intent") == "order":
                items = order_data.get("items", [])
                matched_items = []

                for item in items:
                    product_name = item.get("product_name", "").lower()
                    quantity = item.get("quantity", 1)
                    size = item.get("size", "medium")

                    product = (
                        self.db.query(Product)
                        .filter(
                            Product.is_available == True,
                            Product.name.ilike(f"%{product_name}%"),
                        )
                        .first()
                    )

                    if product:
                        size_enum = ProductSize.MEDIUM
                        if size == "small":
                            size_enum = ProductSize.SMALL
                        elif size == "large":
                            size_enum = ProductSize.LARGE

                        matched_items.append({
                            "product_id": str(product.id),
                            "product_name": product.name,
                            "quantity": quantity,
                            "size": size,
                            "price": product.get_price(size_enum),
                        })

                order_data["items"] = matched_items

            return {
                "transcription": transcribed_text,
                "order_data": order_data,
            }

        except Exception as e:
            logger.error("Error processing voice order: %s", e)
            raise ExternalServiceException("Voice order service", str(e))

    async def generate_fotobooth(
        self,
        user_id: str,
        product_id: int,
        image_data: str,
        style: str = "natural",
    ) -> dict[str, Any]:
        """Generate AI Fotobooth image combining user selfie with product."""
        start_time = time.time()

        product = self.db.query(Product).filter(Product.id == product_id).first()
        if not product:
            raise BadRequestException(f"Product {product_id} not found")

        try:
            image_bytes = base64.b64decode(image_data)
        except Exception:
            raise BadRequestException("Invalid image data")

        generated_image = await self.llm_provider.generate_photobooth(
            user_image_data=image_bytes,
            product_name=product.name,
        )

        generation_time = int((time.time() - start_time) * 1000)

        if generated_image:
            result_base64 = base64.b64encode(generated_image).decode("utf-8")
            return {
                "image_data": result_base64,
                "product_name": product.name,
                "generation_time_ms": generation_time,
            }

        return {
            "image_url": f"https://storage.googleapis.com/juicequ-assets/fotobooth/{user_id}_{product_id}_{int(time.time())}.jpg",
            "product_name": product.name,
            "generation_time_ms": generation_time,
        }

    async def get_chat_history(self, session_id: str) -> list[dict[str, Any]]:
        """Get chat history for a session."""
        return await self.memory.get_history(session_id)

    async def clear_chat_history(self, session_id: str) -> bool:
        """Clear chat history for a session."""
        return await self.memory.clear_session(session_id)

    async def close(self) -> None:
        """Close resources."""
        await self.llm_provider.close()
        await self.rag_service.close()
        await self.memory.close()
