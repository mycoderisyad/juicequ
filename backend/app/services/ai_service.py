"""
AI Service for JuiceQu - Handles Kolosal AI integration, RAG pipeline, and voice processing.
"""
import json
import logging
import time
import uuid
from datetime import datetime
from typing import Any, Dict, List, Optional, Tuple

import httpx
from sqlalchemy.orm import Session

from app.config import settings
from app.core.exceptions import BadRequestException, ExternalServiceException
from app.models.ai_interaction import AIInteraction, InteractionStatus, InteractionType
from app.models.product import Product
from app.models.user import User

logger = logging.getLogger(__name__)


class AIService:
    """Service for handling AI interactions with Kolosal AI and ChromaDB."""

    def __init__(self, db: Session):
        self.db = db
        self.kolosal_client = httpx.AsyncClient(
            base_url=settings.kolosal_api_base,
            headers={
                "Authorization": f"Bearer {settings.kolosal_api_key}",
                "Content-Type": "application/json",
            },
            timeout=30.0,
        )
        # Initialize ChromaDB client (simplified for now)
        self.chroma_client = None  # Will be initialized when needed

    async def chat(
        self,
        user_input: str,
        user_id: Optional[str] = None,
        session_id: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Process text chat with AI using RAG pipeline.

        Args:
            user_input: User's text message
            user_id: Optional user ID for personalization
            session_id: Session ID for conversation context

        Returns:
            Dictionary with AI response and metadata
        """
        if not session_id:
            session_id = str(uuid.uuid4())

        # Create interaction record
        interaction = AIInteraction(
            session_id=session_id,
            user_id=user_id,
            interaction_type=InteractionType.CHAT,
            status=InteractionStatus.ACTIVE,
            user_input=user_input,
            user_input_type="text",
        )
        self.db.add(interaction)

        try:
            # Get user context if available
            user_context = ""
            if user_id:
                user = self.db.query(User).filter(User.id == user_id).first()
                if user and user.preferences:
                    user_context = f"User preferences: {user.preferences}\n"

            # Retrieve relevant product information using RAG
            context_chunks = await self._retrieve_context(user_input)
            context_text = "\n".join([chunk["text"] for chunk in context_chunks])

            # Build system prompt
            system_prompt = self._build_system_prompt(user_context, context_text)

            # Call Kolosal AI
            start_time = time.time()
            ai_response = await self._call_kolosal_ai(
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_input},
                ]
            )
            response_time_ms = int((time.time() - start_time) * 1000)

            # Update interaction record
            interaction.ai_response = ai_response.get("content", "")
            interaction.context_used = json.dumps(context_chunks)
            interaction.response_time_ms = response_time_ms
            interaction.model_used = settings.kolosal_model
            interaction.status = InteractionStatus.COMPLETED
            interaction.completed_at = datetime.utcnow()

            self.db.commit()

            return {
                "response": ai_response.get("content", ""),
                "session_id": session_id,
                "context_used": context_chunks,
                "response_time_ms": response_time_ms,
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
        Process voice input using Google Cloud Speech-to-Text and AI.

        Args:
            audio_data: Binary audio data
            user_id: Optional user ID for personalization
            session_id: Session ID for conversation context

        Returns:
            Dictionary with transcribed text and AI response
        """
        if not session_id:
            session_id = str(uuid.uuid4())

        # Create interaction record
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
            # Transcribe audio using Google Cloud Speech-to-Text
            transcribed_text = await self._transcribe_audio(audio_data)

            # Update interaction with transcribed text
            interaction.user_input = transcribed_text

            # Process the transcribed text with AI
            ai_result = await self.chat(
                user_input=transcribed_text,
                user_id=user_id,
                session_id=session_id,
            )

            # Update interaction with AI response
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
            # Get user context if available
            user_context = ""
            if user_id:
                user = self.db.query(User).filter(User.id == user_id).first()
                if user and user.preferences:
                    user_context = f"User preferences: {user.preferences}\n"
            
            if preferences:
                user_context += f"Current request preferences: {preferences}\n"

            # Get popular products as candidates
            products = (
                self.db.query(Product)
                .filter(Product.is_available == True)
                .order_by(Product.order_count.desc(), Product.average_rating.desc())
                .limit(limit * 2)  # Get more candidates for AI to choose from
                .all()
            )

            if not products:
                return []

            # Format product information for AI
            product_info = "\n".join(
                [
                    f"- {p.name}: {p.description or 'No description'} (Price: ${p.base_price}, Calories: {p.calories or 'N/A'})"
                    for p in products
                ]
            )

            # Build recommendation prompt
            recommendation_prompt = f"""
            {user_context}
            
            Available products:
            {product_info}
            
            Based on the user preferences and the available products, recommend the top {limit} products.
            Return your response as a JSON array with objects containing:
            - product_id: the product ID
            - reason: brief reason for recommendation
            - score: relevance score from 1-10
            """

            # Call Kolosal AI
            ai_response = await self._call_kolosal_ai(
                messages=[
                    {
                        "role": "system",
                        "content": "You are a juice recommendation expert. Always respond with valid JSON only.",
                    },
                    {"role": "user", "content": recommendation_prompt},
                ]
            )

            # Parse AI response
            try:
                recommendations = json.loads(ai_response.get("content", "[]"))
            except json.JSONDecodeError:
                # Fallback to simple recommendations if JSON parsing fails
                recommendations = [
                    {
                        "product_id": p.id,
                        "reason": "Popular choice",
                        "score": 8,
                    }
                    for p in products[:limit]
                ]

            # Get full product details for recommended items
            recommended_products = []
            for rec in recommendations[:limit]:
                product = next((p for p in products if p.id == rec.get("product_id")), None)
                if product:
                    recommended_products.append(
                        {
                            "id": product.id,
                            "name": product.name,
                            "description": product.description,
                            "base_price": product.base_price,
                            "image_url": product.image_url,
                            "calories": product.calories,
                            "category_name": product.category.name if product.category else None,
                            "reason": rec.get("reason", "Recommended for you"),
                            "score": rec.get("score", 8),
                        }
                    )

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
            # Transcribe audio
            transcribed_text = await self._transcribe_audio(audio_data)

            # Extract order intent using AI
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

            ai_response = await self._call_kolosal_ai(
                messages=[
                    {
                        "role": "system",
                        "content": "You are an order processing assistant. Always respond with valid JSON only.",
                    },
                    {"role": "user", "content": order_prompt},
                ]
            )

            # Parse AI response
            try:
                order_data = json.loads(ai_response.get("content", "{}"))
            except json.JSONDecodeError:
                order_data = {"intent": "inquiry", "items": [], "notes": "Could not understand order"}

            # If intent is order, try to match product names
            if order_data.get("intent") == "order":
                items = order_data.get("items", [])
                matched_items = []

                for item in items:
                    product_name = item.get("product_name", "").lower()
                    quantity = item.get("quantity", 1)
                    size = item.get("size", "medium")

                    # Find matching product
                    product = (
                        self.db.query(Product)
                        .filter(
                            Product.is_available == True,
                            Product.name.ilike(f"%{product_name}%"),
                        )
                        .first()
                    )

                    if product:
                        matched_items.append(
                            {
                                "product_id": product.id,
                                "product_name": product.name,
                                "quantity": quantity,
                                "size": size,
                                "price": product.get_price(size),
                            }
                        )

                order_data["items"] = matched_items

            return {
                "transcription": transcribed_text,
                "order_data": order_data,
            }

        except Exception as e:
            logger.error(f"Error processing voice order: {str(e)}")
            raise ExternalServiceException("Voice order service", str(e))

    async def _retrieve_context(self, query: str, limit: int = 5) -> List[Dict[str, Any]]:
        """
        Retrieve relevant context from ChromaDB based on query.

        Args:
            query: User query to find context for
            limit: Maximum number of context chunks to retrieve

        Returns:
            List of context chunks with text and metadata
        """
        # For now, return product information as context
        # In a full implementation, this would use ChromaDB
        products = (
            self.db.query(Product)
            .filter(Product.is_available == True)
            .order_by(Product.order_count.desc())
            .limit(limit)
            .all()
        )

        return [
            {
                "text": f"{p.name}: {p.description or 'No description'}. Price: ${p.base_price}. Ingredients: {p.ingredients or 'N/A'}",
                "metadata": {"product_id": p.id, "name": p.name},
            }
            for p in products
        ]

    def _build_system_prompt(self, user_context: str, context_text: str) -> str:
        """Build system prompt for AI with context."""
        return f"""
        You are JuiceQu Assistant, a helpful AI assistant for a juice store.

        Your role:
        - Help customers find the perfect juice based on their preferences
        - Provide information about ingredients, nutrition, and health benefits
        - Make personalized recommendations
        - Answer questions about products and orders

        Guidelines:
        - Be friendly, enthusiastic, and informative
        - Keep responses concise but helpful
        - Focus on health benefits and natural ingredients
        - If you don't know something, admit it honestly
        - Never provide medical advice, just general wellness information

        {user_context}

        Product context:
        {context_text}

        Remember to respond in Indonesian as that's the primary language of the customers.
        """

    async def _call_kolosal_ai(self, messages: List[Dict[str, str]]) -> Dict[str, Any]:
        """Call Kolosal AI API with messages."""
        # Check if API key is configured
        if not settings.kolosal_api_key:
            logger.warning("Kolosal API key not configured - using fallback response")
            return self._get_fallback_response(messages)
        
        try:
            response = await self.kolosal_client.post(
                "/chat/completions",
                json={
                    "model": settings.kolosal_model,
                    "messages": messages,
                    "temperature": 0.7,
                    "max_tokens": 500,
                },
            )

            if response.status_code != 200:
                logger.error(f"Kolosal AI error: {response.status_code} - {response.text}")
                # Return fallback response instead of failing
                return self._get_fallback_response(messages)

            data = response.json()
            
            # Parse OpenAI-compatible response format
            # Format: {"choices": [{"message": {"role": "assistant", "content": "..."}}]}
            if "choices" in data and len(data["choices"]) > 0:
                choice = data["choices"][0]
                if "message" in choice:
                    return {"content": choice["message"].get("content", "")}
                elif "text" in choice:
                    return {"content": choice["text"]}
            
            # Fallback if response format is different
            if "content" in data:
                return {"content": data["content"]}
            
            logger.warning(f"Unexpected AI response format: {data}")
            return self._get_fallback_response(messages)

        except httpx.RequestError as e:
            logger.error(f"Request error calling Kolosal AI: {str(e)}")
            return self._get_fallback_response(messages)
        except Exception as e:
            logger.error(f"Unexpected error calling Kolosal AI: {str(e)}")
            return self._get_fallback_response(messages)

    def _get_fallback_response(self, messages: List[Dict[str, str]]) -> Dict[str, Any]:
        """Generate a fallback response when AI is unavailable."""
        user_message = ""
        for msg in messages:
            if msg.get("role") == "user":
                user_message = msg.get("content", "").lower()
                break
        
        # Simple keyword-based fallback responses
        if any(word in user_message for word in ["halo", "hai", "hi", "hello"]):
            return {"content": "Halo! Selamat datang di JuiceQu! Apa yang bisa saya bantu hari ini? Kami punya berbagai pilihan jus segar dan smoothie yang lezat!"}
        elif any(word in user_message for word in ["rekomendasi", "recommend", "saran"]):
            return {"content": "Untuk rekomendasi, kami sarankan mencoba Berry Blast atau Tropical Paradise! Keduanya sangat populer dan menyegarkan. Mau coba yang mana?"}
        elif any(word in user_message for word in ["harga", "price", "berapa"]):
            return {"content": "Harga jus kami mulai dari Rp 15.000. Silakan cek menu kami untuk melihat semua pilihan dan harga lengkap!"}
        elif any(word in user_message for word in ["sehat", "health", "diet"]):
            return {"content": "Semua produk kami dibuat dari buah-buahan segar tanpa pengawet! Untuk pilihan rendah gula, coba Green Detox atau Fresh Citrus."}
        else:
            return {"content": "Terima kasih sudah menghubungi JuiceQu! Silakan cek menu kami untuk melihat berbagai pilihan jus segar. Ada yang bisa saya bantu?"}

    async def _transcribe_audio(self, audio_data: bytes) -> str:
        """
        Transcribe audio data using Google Cloud Speech-to-Text.

        Args:
            audio_data: Binary audio data

        Returns:
            Transcribed text
        """
        # For now, return a placeholder
        # In a full implementation, this would use Google Cloud Speech-to-Text
        logger.warning("Audio transcription not implemented - returning placeholder")
        return "[Audio transcription would appear here]"

    async def close(self):
        """Close HTTP client."""
        await self.kolosal_client.aclose()
