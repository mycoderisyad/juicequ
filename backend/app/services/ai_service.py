"""
AI Service for JuiceQu - Handles Kolosal AI integration, RAG pipeline, and voice processing.
"""
import html
import json
import logging
import re
import time
import uuid
from datetime import datetime
from typing import Any, Dict, List, Optional, Tuple

import httpx
from sqlalchemy.orm import Session

from app.config import settings
from app.core.exceptions import BadRequestException, ExternalServiceException
from app.models.ai_interaction import AIInteraction, InteractionStatus, InteractionType
from app.models.product import Product, ProductSize
from app.models.user import User
from app.services.ai.stt_service import STTService

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
    """
    Sanitize user input before sending to AI to prevent prompt injection.
    
    Args:
        user_input: Raw user input
        max_length: Maximum allowed length
        
    Returns:
        Sanitized user input
    """
    if not user_input:
        return ""
    
    # Truncate to max length
    user_input = user_input[:max_length]
    
    # Remove potential prompt injection patterns
    for pattern in DANGEROUS_PROMPT_PATTERNS:
        user_input = re.sub(pattern, "[FILTERED]", user_input)
    
    # Remove excessive newlines/whitespace (could be used to hide injections)
    user_input = re.sub(r'\n{3,}', '\n\n', user_input)
    user_input = re.sub(r'\s{5,}', ' ', user_input)
    
    # Remove null bytes and other control characters (except newline/tab)
    user_input = re.sub(r'[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]', '', user_input)
    
    return user_input.strip()


def sanitize_ai_response(response: str) -> str:
    """
    Sanitize AI response - returns clean plain text.
    Frontend will handle formatting.
    
    Args:
        response: Raw AI response
        
    Returns:
        Clean plain text response
    """
    if not response:
        return ""
    
    # Remove any HTML tags that might have been included
    sanitized = re.sub(r'<[^>]+>', '', response)
    
    # Remove excessive whitespace
    sanitized = re.sub(r'\n{3,}', '\n\n', sanitized)
    sanitized = re.sub(r' {2,}', ' ', sanitized)
    
    # Remove any potentially dangerous patterns
    dangerous_patterns = [
        r'<\s*script',
        r'javascript\s*:',
        r'on\w+\s*=',
        r'<\s*iframe',
        r'<\s*object',
        r'<\s*embed',
        r'<\s*link',
        r'<\s*style',
        r'<\s*meta',
        r'<\s*base',
        r'data\s*:',
        r'vbscript\s*:',
    ]
    
    for pattern in dangerous_patterns:
        sanitized = re.sub(pattern, '', sanitized, flags=re.IGNORECASE)
    
    return sanitized


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
        # Initialize RAG service for semantic search
        from app.services.ai.rag_service import RAGService
        self.rag_service = RAGService(db)
        self.stt_service = STTService(settings.gcp_speech_credentials if settings.gcp_speech_credentials else None)

    async def chat(
        self,
        user_input: str,
        user_id: Optional[str] = None,
        session_id: Optional[str] = None,
        locale: str = "id",
        conversation_history: Optional[List[Dict[str, str]]] = None,
    ) -> Dict[str, Any]:
        """
        Process text chat with AI using RAG pipeline.

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

        # Security: Sanitize user input to prevent prompt injection
        sanitized_input = sanitize_user_input(user_input)
        
        # Create interaction record
        interaction = AIInteraction(
            session_id=session_id,
            user_id=user_id,
            interaction_type=InteractionType.CHAT,
            status=InteractionStatus.ACTIVE,
            user_input=sanitized_input,  # Store sanitized input
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

            # Get all available products for context
            all_products = self._get_all_products()
            context_text = self._format_products_for_context(all_products)

            # Build system prompt with order capabilities
            system_prompt = self._build_system_prompt_with_ordering(user_context, context_text, locale, all_products)

            # Build messages with conversation history
            messages = [{"role": "system", "content": system_prompt}]
            
            # Add conversation history if provided (also sanitize historical messages)
            if conversation_history:
                for msg in conversation_history[-10:]:  # Keep last 10 messages for context
                    role = msg.get("role", "user")
                    content = msg.get("content", "")
                    # Sanitize user messages from history
                    if role == "user":
                        content = sanitize_user_input(content)
                    messages.append({
                        "role": role,
                        "content": content
                    })
            
            # Add current user message (already sanitized)
            messages.append({"role": "user", "content": sanitized_input})

            # Call Kolosal AI
            start_time = time.time()
            ai_response = await self._call_kolosal_ai(messages, locale)
            response_time_ms = int((time.time() - start_time) * 1000)

            response_content = ai_response.get("content", "")
            
            # Check if fallback response already includes featured_products
            fallback_featured = ai_response.get("featured_products")
            fallback_intent = ai_response.get("intent")
            
            # Parse the response to detect order intent and extract order data
            intent, order_data, clean_response = self._parse_order_response(response_content, all_products, locale)
            
            # Use fallback intent if available
            if fallback_intent:
                intent = fallback_intent
            
            # Security: Sanitize AI response to prevent XSS
            clean_response = sanitize_ai_response(clean_response)

            # Update interaction record
            interaction.ai_response = clean_response
            interaction.context_used = json.dumps([{"products": len(all_products)}])
            interaction.response_time_ms = response_time_ms
            interaction.model_used = settings.kolosal_model
            interaction.detected_intent = intent
            interaction.status = InteractionStatus.COMPLETED
            interaction.completed_at = datetime.utcnow()

            self.db.commit()

            # Check for product recommendation/listing intent
            featured_products = fallback_featured
            if not featured_products and self._should_show_products(sanitized_input, clean_response, locale):
                featured_products = self._get_featured_products_for_response(sanitized_input, locale)
                if featured_products:
                    intent = "recommendation"
                    # Clean response - remove any HTML tags that might have been added
                    clean_response = self._generate_clean_text_response(sanitized_input, featured_products, locale)

            return {
                "response": clean_response,
                "session_id": session_id,
                "context_used": None,
                "response_time_ms": response_time_ms,
                "intent": intent,
                "order_data": order_data,
                "show_checkout": order_data is not None and len(order_data.get("items", [])) > 0,
                "featured_products": featured_products,
            }

        except Exception as e:
            logger.error(f"Error in AI chat: {str(e)}")
            interaction.status = InteractionStatus.ERROR
            interaction.ai_response = f"Error: {str(e)}"
            self.db.commit()
            raise ExternalServiceException("AI service", str(e))

    def _get_all_products(self) -> List[Product]:
        """Get all available products from database."""
        return (
            self.db.query(Product)
            .filter(Product.is_available == True)
            .order_by(Product.order_count.desc())
            .all()
        )

    def _format_products_for_context(self, products: List[Product]) -> str:
        """Format products as context for AI."""
        product_list = []
        for p in products:
            product_list.append(
                f"- ID: {p.id} | Name: {p.name} | Price: Rp {p.base_price:,.0f} | "
                f"Description: {p.description or 'No description'} | "
                f"Category: {p.category.name if p.category else 'N/A'}"
            )
        return "\n".join(product_list)

    def _build_system_prompt_with_ordering(
        self, user_context: str, context_text: str, locale: str, products: List[Product]
    ) -> str:
        """Build system prompt for AI with ordering capabilities."""
        
        language = "Indonesian" if locale == "id" else "English"
        
        if locale == "id":
            return f"""Kamu adalah JuiceQu Assistant, asisten AI untuk toko jus yang bisa membantu pelanggan memesan.

KEMAMPUAN:
- Membantu pelanggan mencari jus berdasarkan preferensi
- Memberikan informasi tentang produk, bahan, dan manfaat kesehatan
- MEMPROSES PESANAN dari percakapan natural

DAFTAR PRODUK TERSEDIA:
{context_text}

CARA MEMPROSES PESANAN:
Ketika pelanggan ingin memesan (misal: "beli acai mango 2", "pesan berry blast", "mau checkout"), 
kamu HARUS merespons dengan format khusus ini:

[ORDER_DATA]
{{"items": [{{"product_id": "ID_PRODUK", "name": "NAMA", "quantity": JUMLAH, "size": "medium"}}], "notes": "catatan jika ada"}}
[/ORDER_DATA]

LALU berikan pesan konfirmasi yang ramah.

ATURAN PENTING:
1. Selalu gunakan product_id yang TEPAT dari daftar produk di atas
2. Jika produk tidak ditemukan, minta klarifikasi
3. Default size adalah "medium" kecuali pelanggan minta ukuran lain (small/large)
4. Selalu konfirmasi pesanan sebelum proses checkout
5. Jika pelanggan bilang "lanjut checkout", "proses pesanan", atau sejenisnya, ulangi order data terakhir

{user_context}

Ingat: Selalu respons dalam Bahasa Indonesia dan sangat ramah!"""
        else:
            return f"""You are JuiceQu Assistant, an AI assistant for a juice store that can help customers order.

CAPABILITIES:
- Help customers find juice based on preferences
- Provide information about products, ingredients, and health benefits
- PROCESS ORDERS from natural conversation

AVAILABLE PRODUCTS:
{context_text}

HOW TO PROCESS ORDERS:
When a customer wants to order (e.g., "buy acai mango 2", "order berry blast", "want to checkout"), 
you MUST respond with this special format:

[ORDER_DATA]
{{"items": [{{"product_id": "PRODUCT_ID", "name": "NAME", "quantity": AMOUNT, "size": "medium"}}], "notes": "notes if any"}}
[/ORDER_DATA]

THEN provide a friendly confirmation message.

IMPORTANT RULES:
1. Always use the EXACT product_id from the product list above
2. If product not found, ask for clarification
3. Default size is "medium" unless customer asks for different size (small/large)
4. Always confirm order before checkout
5. If customer says "proceed to checkout", "process order", or similar, repeat the last order data

{user_context}

Remember: Always respond in English and be very friendly!"""

    def _parse_order_response(
        self, response: str, products: List[Product], locale: str
    ) -> Tuple[Optional[str], Optional[Dict[str, Any]], str]:
        """
        Parse AI response to extract order data.
        
        Returns:
            Tuple of (intent, order_data, clean_response)
        """
        intent = "inquiry"
        order_data = None
        clean_response = response

        # Try to extract ORDER_DATA block
        order_match = re.search(r'\[ORDER_DATA\](.*?)\[/ORDER_DATA\]', response, re.DOTALL)
        
        if order_match:
            try:
                order_json = order_match.group(1).strip()
                parsed_order = json.loads(order_json)
                
                # Build order data with full product details
                order_items = []
                subtotal = 0.0
                
                for item in parsed_order.get("items", []):
                    product_id = item.get("product_id", "")
                    product_name = item.get("name", "")
                    quantity = item.get("quantity", 1)
                    size_str = item.get("size", "medium").lower()
                    
                    # Find the product
                    product = None
                    for p in products:
                        if p.id == product_id or p.name.lower() == product_name.lower():
                            product = p
                            break
                    
                    # Fuzzy match if not found
                    if not product:
                        for p in products:
                            if product_name.lower() in p.name.lower() or p.name.lower() in product_name.lower():
                                product = p
                                break
                    
                    if product:
                        size = ProductSize.MEDIUM
                        if size_str == "small":
                            size = ProductSize.SMALL
                        elif size_str == "large":
                            size = ProductSize.LARGE
                        
                        unit_price = product.get_price(size)
                        total_price = unit_price * quantity
                        subtotal += total_price
                        
                        order_items.append({
                            "product_id": product.id,
                            "product_name": product.name,
                            "quantity": quantity,
                            "size": size_str,
                            "unit_price": unit_price,
                            "total_price": total_price,
                            "image_url": product.image_url or product.thumbnail_image,
                            "description": product.description,
                        })
                
                if order_items:
                    intent = "order"
                    tax = subtotal * 0.1  # 10% tax
                    order_data = {
                        "items": order_items,
                        "subtotal": subtotal,
                        "tax": tax,
                        "total": subtotal + tax,
                        "notes": parsed_order.get("notes"),
                    }
                
                # Remove ORDER_DATA block from response
                clean_response = re.sub(r'\[ORDER_DATA\].*?\[/ORDER_DATA\]', '', response, flags=re.DOTALL).strip()
                
            except json.JSONDecodeError as e:
                logger.warning(f"Failed to parse order JSON: {e}")
        
        # If no order data but response seems like order confirmation, try to detect from text
        if not order_data:
            order_keywords_id = ["pesan", "beli", "order", "mau", "checkout", "bayar"]
            order_keywords_en = ["buy", "order", "purchase", "checkout", "pay"]
            keywords = order_keywords_id if locale == "id" else order_keywords_en
            
            if any(keyword in response.lower() for keyword in keywords):
                # Try to extract product mentions from response
                order_items = self._extract_products_from_text(response, products, locale)
                if order_items:
                    intent = "order"
                    subtotal = sum(item["total_price"] for item in order_items)
                    tax = subtotal * 0.1
                    order_data = {
                        "items": order_items,
                        "subtotal": subtotal,
                        "tax": tax,
                        "total": subtotal + tax,
                        "notes": None,
                    }
        
        return intent, order_data, clean_response

    def _extract_products_from_text(
        self, text: str, products: List[Product], locale: str
    ) -> List[Dict[str, Any]]:
        """Extract product orders from natural text."""
        order_items = []
        text_lower = text.lower()
        
        for product in products:
            product_name_lower = product.name.lower()
            
            # Check if product name is mentioned
            if product_name_lower in text_lower:
                # Try to find quantity
                quantity = 1
                # Pattern: "2 acai mango" or "acai mango 2" or "acai mango x2"
                patterns = [
                    rf'(\d+)\s*(?:x\s*)?{re.escape(product_name_lower)}',
                    rf'{re.escape(product_name_lower)}\s*(?:x\s*)?(\d+)',
                ]
                for pattern in patterns:
                    match = re.search(pattern, text_lower)
                    if match:
                        quantity = int(match.group(1))
                        break
                
                unit_price = product.get_price(ProductSize.MEDIUM)
                order_items.append({
                    "product_id": product.id,
                    "product_name": product.name,
                    "quantity": quantity,
                    "size": "medium",
                    "unit_price": unit_price,
                    "total_price": unit_price * quantity,
                    "image_url": product.image_url or product.thumbnail_image,
                    "description": product.description,
                })
        
        return order_items

    def _should_show_products(self, user_input: str, ai_response: str, locale: str) -> bool:
        """
        Check if we should display featured products based on user query.
        """
        user_lower = user_input.lower()
        
        # Keywords that indicate user wants to see products
        product_keywords_id = [
            "bestseller", "best seller", "terlaris", "paling laris", "populer", "popular",
            "rekomendasi", "rekomendasikan", "sarankan", "menu", "produk", "pilihan",
            "apa yang ada", "apa saja", "lihat", "tampilkan", "favorit", "favorite",
            "top", "terbaik", "enak", "sehat", "segar", "rendah gula", "rendah kalori"
        ]
        product_keywords_en = [
            "bestseller", "best seller", "popular", "recommendation", "recommend",
            "suggest", "menu", "products", "options", "what do you have", "show me",
            "favorite", "top", "best", "delicious", "healthy", "fresh", "low sugar", "low calorie"
        ]
        
        keywords = product_keywords_id if locale == "id" else product_keywords_en
        
        return any(keyword in user_lower for keyword in keywords)

    def _get_featured_products_for_response(
        self, user_input: str, locale: str, limit: int = 4
    ) -> Optional[List[Dict[str, Any]]]:
        """
        Get featured products based on user query.
        """
        user_lower = user_input.lower()
        
        # Determine which products to show
        products = []
        
        # Check for bestseller/popular request
        bestseller_keywords = ["bestseller", "best seller", "terlaris", "paling laris", "populer", "popular", "top", "favorit", "favorite"]
        if any(kw in user_lower for kw in bestseller_keywords):
            products = (
                self.db.query(Product)
                .filter(Product.is_available == True)
                .order_by(Product.order_count.desc())
                .limit(limit)
                .all()
            )
        
        # Check for healthy options
        healthy_keywords = ["sehat", "healthy", "rendah gula", "low sugar", "rendah kalori", "low calorie", "diet"]
        if any(kw in user_lower for kw in healthy_keywords):
            products = (
                self.db.query(Product)
                .filter(Product.is_available == True, Product.calories < 200)
                .order_by(Product.calories.asc())
                .limit(limit)
                .all()
            )
        
        # Default: get popular products
        if not products:
            products = (
                self.db.query(Product)
                .filter(Product.is_available == True)
                .order_by(Product.order_count.desc(), Product.average_rating.desc())
                .limit(limit)
                .all()
            )
        
        if not products:
            return None
        
        # Build featured products list
        featured = []
        for p in products:
            # Get valid image URL (filter out CSS classes like 'bg-rose-500')
            image_url = None
            thumbnail_url = p.thumbnail_image
            
            # Check if image_url is a valid path/URL (not a CSS class)
            if p.hero_image and (p.hero_image.startswith('/') or p.hero_image.startswith('http')):
                image_url = p.hero_image
            elif p.thumbnail_image and (p.thumbnail_image.startswith('/') or p.thumbnail_image.startswith('http')):
                image_url = p.thumbnail_image
            elif p.image_url and (p.image_url.startswith('/') or p.image_url.startswith('http')):
                image_url = p.image_url
            
            featured.append({
                "id": p.id,
                "name": p.name,
                "description": p.description,
                "price": float(p.base_price),
                "image_url": image_url,
                "thumbnail_url": thumbnail_url if thumbnail_url and (thumbnail_url.startswith('/') or thumbnail_url.startswith('http')) else None,
                "category": p.category.name if p.category else None,
                "calories": p.calories,
                "is_bestseller": (p.order_count or 0) > 10,  # Considered bestseller if > 10 orders
                "order_count": p.order_count or 0,
            })
        
        return featured

    def _generate_clean_text_response(
        self, user_input: str, products: List[Dict[str, Any]], locale: str
    ) -> str:
        """
        Generate clean text response for product recommendations.
        Products will be displayed separately as cards in frontend.
        """
        user_lower = user_input.lower()
        
        # Bestseller response
        bestseller_keywords = ["bestseller", "best seller", "terlaris", "paling laris", "populer", "popular", "top", "favorit", "favorite"]
        if any(kw in user_lower for kw in bestseller_keywords):
            if locale == "id":
                return f"Berikut {len(products)} produk terlaris kami! Klik salah satu untuk melihat detail atau langsung tambahkan ke pesanan. 🧃"
            else:
                return f"Here are our top {len(products)} bestsellers! Click any to see details or add directly to your order. 🧃"
        
        # Healthy options response  
        healthy_keywords = ["sehat", "healthy", "rendah gula", "low sugar", "rendah kalori", "low calorie", "diet"]
        if any(kw in user_lower for kw in healthy_keywords):
            if locale == "id":
                return f"Ini {len(products)} pilihan sehat untuk Anda! Semua rendah kalori dan dibuat dari bahan-bahan segar. 🥗"
            else:
                return f"Here are {len(products)} healthy choices for you! All low-calorie and made with fresh ingredients. 🥗"
        
        # Default recommendation response
        if locale == "id":
            return f"Ini {len(products)} rekomendasi untuk Anda! Tertarik dengan yang mana? Anda bisa langsung pesan dengan bilang, misalnya: 'Beli [nama produk] 1' 😊"
        else:
            return f"Here are {len(products)} recommendations for you! Which one interests you? You can order directly by saying, for example: 'Buy [product name] 1' 😊"

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
        """
        return await self.rag_service.retrieve_context(query, limit)

    def _build_system_prompt(self, user_context: str, context_text: str, locale: str = "id") -> str:
        """Build system prompt for AI with context (legacy, for non-ordering interactions)."""
        return self._build_system_prompt_with_ordering(user_context, context_text, locale, [])

    async def _call_kolosal_ai(self, messages: List[Dict[str, str]], locale: str = "id") -> Dict[str, Any]:
        """Call Kolosal AI API with messages."""
        # Check if API key is configured
        if not settings.kolosal_api_key:
            logger.warning("Kolosal API key not configured - using fallback response")
            return self._get_fallback_response(messages, locale)
        
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
                return self._get_fallback_response(messages, locale)

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
            return self._get_fallback_response(messages, locale)

        except httpx.RequestError as e:
            logger.error(f"Request error calling Kolosal AI: {str(e)}")
            return self._get_fallback_response(messages, locale)
        except Exception as e:
            logger.error(f"Unexpected error calling Kolosal AI: {str(e)}")
            return self._get_fallback_response(messages, locale)

    def _get_fallback_response(self, messages: List[Dict[str, str]], locale: str = "id") -> Dict[str, Any]:
        """Generate a fallback response when AI is unavailable."""
        user_message = ""
        for msg in messages:
            if msg.get("role") == "user":
                user_message = msg.get("content", "").lower()
                break
        
        # Get products for potential order processing
        products = self._get_all_products()
        
        # Check if this is an order request
        order_keywords_id = ["beli", "pesan", "order", "mau beli", "checkout"]
        order_keywords_en = ["buy", "order", "purchase", "i want", "checkout"]
        keywords = order_keywords_id if locale == "id" else order_keywords_en
        
        is_order = any(keyword in user_message for keyword in keywords)
        
        if is_order and products:
            # Try to extract products from the message
            order_items = self._extract_products_from_text(user_message, products, locale)
            
            if order_items:
                # Build order confirmation response
                if locale == "id":
                    items_text = ", ".join([f"{item['quantity']}x {item['product_name']}" for item in order_items])
                    total = sum(item['total_price'] for item in order_items)
                    response = f"Baik, pesanan Anda: {items_text}. Total: Rp {total:,.0f}. Klik tombol Checkout di bawah untuk melanjutkan pembayaran!"
                else:
                    items_text = ", ".join([f"{item['quantity']}x {item['product_name']}" for item in order_items])
                    total = sum(item['total_price'] for item in order_items)
                    response = f"Great, your order: {items_text}. Total: Rp {total:,.0f}. Click the Checkout button below to proceed with payment!"
                
                subtotal = sum(item['total_price'] for item in order_items)
                tax = subtotal * 0.1
                
                return {
                    "content": response,
                    "intent": "order",
                    "order_data": {
                        "items": order_items,
                        "subtotal": subtotal,
                        "tax": tax,
                        "total": subtotal + tax,
                        "notes": None,
                    }
                }
        
        # Check for product listing requests (bestseller, recommendations, etc)
        product_listing_keywords = ["bestseller", "best seller", "terlaris", "paling laris", "populer", "popular", 
                                   "rekomendasi", "recommend", "saran", "menu", "pilihan", "sehat", "healthy"]
        if any(keyword in user_message for keyword in product_listing_keywords):
            featured_products = self._get_featured_products_for_response(user_message, locale)
            if featured_products:
                clean_response = self._generate_clean_text_response(user_message, featured_products, locale)
                return {
                    "content": clean_response,
                    "intent": "recommendation",
                    "featured_products": featured_products,
                }
        
        # Language-specific fallback responses
        if locale == "en":
            if any(word in user_message for word in ["halo", "hai", "hi", "hello"]):
                return {"content": "Hello! Welcome to JuiceQu! How can I help you today? You can ask me about our products or place an order directly by saying something like 'I want to buy Berry Blast'!"}
            elif any(word in user_message for word in ["harga", "price", "cost", "how much"]):
                return {"content": "Our juice prices start from Rp 15,000. Please check our menu to see all options and complete pricing! You can also order directly through this chat."}
            else:
                return {"content": "Thank you for contacting JuiceQu! I can help you browse our menu and place orders. Just tell me what you'd like to buy, for example: 'I want 2 Acai Mango'!"}
        else:
            if any(word in user_message for word in ["halo", "hai", "hi", "hello"]):
                return {"content": "Halo! Selamat datang di JuiceQu! Ada yang bisa saya bantu? Anda bisa bertanya tentang produk kami atau langsung pesan dengan bilang 'Saya mau beli Berry Blast'!"}
            elif any(word in user_message for word in ["harga", "price", "berapa"]):
                return {"content": "Harga jus kami mulai dari Rp 15.000. Silakan cek menu kami untuk melihat semua pilihan! Anda juga bisa pesan langsung lewat chat ini."}
            else:
                return {"content": "Terima kasih sudah menghubungi JuiceQu! Saya bisa membantu Anda melihat menu dan memesan. Cukup bilang apa yang mau dibeli, contoh: 'Beli Acai Mango 2'!"}

    async def _transcribe_audio(self, audio_data: bytes) -> str:
        """
        Transcribe audio data using Google Cloud Speech-to-Text.

        Args:
            audio_data: Binary audio data

        Returns:
            Transcribed text
        """
        # Use the STT service for transcription
        return await self.stt_service.transcribe(audio_data, language="id-ID")

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
        
        # Get product info
        product = self.db.query(Product).filter(Product.id == product_id).first()
        if not product:
            raise BadRequestException(f"Product {product_id} not found")
        
        # TODO: Implement actual AI image generation
        # For now, return a placeholder response
        # In production, this would:
        # 1. Decode base64 image
        # 2. Send to AI image generation service (e.g., Stable Diffusion API)
        # 3. Compose user image with product image
        # 4. Upload to GCS
        # 5. Return public URL
        
        generation_time = int((time.time() - start_time) * 1000)
        
        logger.info(f"Fotobooth generation placeholder for user {user_id}, product {product_id}")
        
        # Placeholder return - in production, replace with actual generated image URL
        return {
            "image_url": f"https://storage.googleapis.com/juicequ-assets/fotobooth/{user_id}_{product_id}_{int(time.time())}.jpg",
            "product_name": product.name,
            "generation_time_ms": generation_time,
        }

    async def close(self):
        """Close HTTP client and STT service."""
        await self.kolosal_client.aclose()
        await self.stt_service.close()
        await self.rag_service.close()
