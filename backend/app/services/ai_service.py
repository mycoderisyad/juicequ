"""
AI Service for JuiceQu - Handles AI chat, voice processing, and recommendations.
Uses Multi-Agent architecture for intelligent, context-aware responses.
"""
import json
import logging
import re
import time
import uuid
from datetime import datetime
from typing import Any, Dict, List, Optional

from sqlalchemy.orm import Session

from app.config import settings
from app.core.exceptions import BadRequestException, ExternalServiceException
from app.models.ai_interaction import AIInteraction, InteractionStatus, InteractionType
from app.models.product import Product, ProductSize
from app.models.user import User
from app.services.ai.kolosal_client import KolosalClient
from app.services.ai.rag_service import RAGService
from app.services.ai.stt_service import STTService
from app.services.ai.agents import AgentOrchestrator

logger = logging.getLogger(__name__)


# Security: Patterns for prompt injection detection
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
    
    user_input = re.sub(r'\n{3,}', '\n\n', user_input)
    user_input = re.sub(r'\s{5,}', ' ', user_input)
    user_input = re.sub(r'[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]', '', user_input)
    
    return user_input.strip()


def sanitize_ai_response(response: str) -> str:
    """Sanitize AI response to prevent XSS."""
    if not response:
        return ""
    
    sanitized = re.sub(r'<[^>]+>', '', response)
    sanitized = re.sub(r'\n{3,}', '\n\n', sanitized)
    sanitized = re.sub(r' {2,}', ' ', sanitized)
    
    dangerous_patterns = [
        r'<\s*script', r'javascript\s*:', r'on\w+\s*=',
        r'<\s*iframe', r'<\s*object', r'<\s*embed',
        r'<\s*link', r'<\s*style', r'<\s*meta',
        r'<\s*base', r'data\s*:', r'vbscript\s*:',
    ]
    
    for pattern in dangerous_patterns:
        sanitized = re.sub(pattern, '', sanitized, flags=re.IGNORECASE)
    
    return sanitized


class AIService:
    """Service for handling AI interactions with Multi-Agent system."""

    def __init__(self, db: Session):
        self.db = db
        self.kolosal = KolosalClient()
        self.rag_service = RAGService(db)
        self.stt_service = STTService(
            settings.gcp_speech_credentials if settings.gcp_speech_credentials else None
        )
        self.orchestrator = AgentOrchestrator(db)

    async def chat(
        self,
        user_input: str,
        user_id: Optional[str] = None,
        session_id: Optional[str] = None,
        locale: str = "id",
        conversation_history: Optional[List[Dict[str, str]]] = None,
    ) -> Dict[str, Any]:
        """
        Process text chat with AI using Multi-Agent system.

        Args:
            user_input: User's text message
            user_id: Optional user ID for personalization
            session_id: Session ID for conversation context
            locale: Language locale (id/en)
            conversation_history: Previous conversation messages

        Returns:
            Dictionary with AI response and metadata
        """
        if not session_id:
            session_id = str(uuid.uuid4())

        sanitized_input = sanitize_user_input(user_input)
        
        interaction = AIInteraction(
            session_id=session_id,
            user_id=user_id,
            interaction_type=InteractionType.CHAT,
            status=InteractionStatus.ACTIVE,
            user_input=sanitized_input,
            user_input_type="text",
        )
        self.db.add(interaction)

        try:
            start_time = time.time()
            
            result = await self.orchestrator.process(
                user_input=sanitized_input,
                locale=locale,
                user_id=user_id,
                session_id=session_id,
                conversation_history=conversation_history,
            )
            
            response_time_ms = int((time.time() - start_time) * 1000)
            
            response_text = result.get("response", "")
            intent = result.get("intent", "unknown")
            order_data = result.get("order_data")
            featured_products = result.get("featured_products")
            
            clean_response = sanitize_ai_response(response_text)

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
            logger.error(f"Error in AI chat: {str(e)}")
            interaction.status = InteractionStatus.ERROR
            interaction.ai_response = f"Error: {str(e)}"
            self.db.commit()
            raise ExternalServiceException("AI service", str(e))

    async def process_voice(
        self,
        audio_data: bytes,
        user_id: Optional[str] = None,
        session_id: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Process voice input using Speech-to-Text and AI.

        Args:
            audio_data: Binary audio data
            user_id: Optional user ID for personalization
            session_id: Session ID for conversation context

        Returns:
            Dictionary with transcribed text and AI response
        """
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
            transcribed_text = await self.stt_service.transcribe(audio_data, language="id-ID")
            interaction.user_input = transcribed_text

            ai_result = await self.chat(
                user_input=transcribed_text,
                user_id=user_id,
                session_id=session_id,
            )

            interaction.ai_response = ai_result.get("response", "")
            interaction.status = InteractionStatus.COMPLETED
            interaction.completed_at = datetime.utcnow()

            self.db.commit()

            return {
                "transcription": transcribed_text,
                "response": ai_result.get("response", ""),
                "session_id": session_id,
                "response_time_ms": ai_result.get("response_time_ms", 0),
            }

        except Exception as e:
            logger.error(f"Error in voice processing: {str(e)}")
            interaction.status = InteractionStatus.ERROR
            interaction.ai_response = f"Error: {str(e)}"
            self.db.commit()
            raise ExternalServiceException("Voice processing service", str(e))

    async def get_recommendations(
        self,
        user_id: Optional[str] = None,
        preferences: Optional[str] = None,
        limit: int = 5,
    ) -> List[Dict[str, Any]]:
        """
        Get personalized product recommendations using AI.

        Args:
            user_id: Optional user ID for personalization
            preferences: Optional preference string
            limit: Maximum number of recommendations

        Returns:
            List of recommended products with details
        """
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

            prompt = f"""
{user_context}

Available products:
{product_info}

Based on the user preferences and the available products, recommend the top {limit} products.
Return your response as a JSON array with objects containing:
- product_id: the product ID
- reason: brief reason for recommendation
- score: relevance score from 1-10
"""

            ai_response = await self.kolosal.chat_completion(
                messages=[
                    {
                        "role": "system",
                        "content": "You are a juice recommendation expert. Always respond with valid JSON only.",
                    },
                    {"role": "user", "content": prompt},
                ]
            )

            try:
                recommendations = json.loads(ai_response.get("content", "[]"))
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
            logger.error(f"Error getting recommendations: {str(e)}")
            raise ExternalServiceException("Recommendation service", str(e))

    async def process_voice_order(
        self,
        audio_data: bytes,
        user_id: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Process voice order using speech-to-text and AI intent detection.

        Args:
            audio_data: Binary audio data
            user_id: Optional user ID

        Returns:
            Dictionary with extracted order items and confirmation
        """
        try:
            transcribed_text = await self.stt_service.transcribe(audio_data, language="id-ID")

            order_prompt = f"""
Extract order information from the following text: "{transcribed_text}"

Return a JSON object with:
- intent: "order" if this is an order, "inquiry" if just asking questions
- items: array of objects with:
  - product_name: name of the product
  - quantity: number of items (default 1)
  - size: "small", "medium", or "large" (default "medium")
- notes: any additional notes or special requests
"""

            ai_response = await self.kolosal.chat_completion(
                messages=[
                    {
                        "role": "system",
                        "content": "You are an order processing assistant. Always respond with valid JSON only.",
                    },
                    {"role": "user", "content": order_prompt},
                ]
            )

            try:
                order_data = json.loads(ai_response.get("content", "{}"))
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
            logger.error(f"Error processing voice order: {str(e)}")
            raise ExternalServiceException("Voice order service", str(e))

    async def generate_fotobooth(
        self,
        user_id: str,
        product_id: int,
        image_data: str,
        style: str = "natural",
    ) -> Dict[str, Any]:
        """
        Generate AI Fotobooth image combining user selfie with product.
        
        Args:
            user_id: User ID
            product_id: Product to feature in fotobooth
            image_data: Base64 encoded user image
            style: Image style (natural/vibrant/artistic)
        
        Returns:
            Dict with image_url, product_name, generation_time_ms
        """
        start_time = time.time()
        
        product = self.db.query(Product).filter(Product.id == product_id).first()
        if not product:
            raise BadRequestException(f"Product {product_id} not found")
        
        generation_time = int((time.time() - start_time) * 1000)
        
        logger.info(f"Fotobooth generation placeholder for user {user_id}, product {product_id}")
        
        return {
            "image_url": f"https://storage.googleapis.com/juicequ-assets/fotobooth/{user_id}_{product_id}_{int(time.time())}.jpg",
            "product_name": product.name,
            "generation_time_ms": generation_time,
        }

    async def close(self):
        """Close HTTP client and services."""
        await self.kolosal.close()
        await self.stt_service.close()
        await self.rag_service.close()
