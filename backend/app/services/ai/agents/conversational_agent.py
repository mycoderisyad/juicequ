"""
Conversational Agent - Handles natural language conversations using LLM.
Provides natural, helpful responses about health, nutrition, and juice benefits.
"""
import logging
from typing import Optional

from sqlalchemy.orm import Session

from app.models.product import Product
from app.config import settings
from .base import BaseAgent, AgentContext, AgentResponse, Intent

logger = logging.getLogger(__name__)


class ConversationalAgent(BaseAgent):
    """
    Handles natural conversations about:
    - Health and nutrition questions
    - Juice benefits and properties
    - Allergy information
    - Wellness tips related to juice
    
    Uses Kolosal LLM to generate natural, helpful responses.
    """
    
    # System prompt for the LLM
    SYSTEM_PROMPT_ID = """Kamu adalah penjual jus di toko JuiceQu. Jawablah seperti sedang ngobrol langsung dengan pelanggan - ramah, santai, dan antusias!

GAYA BICARA:
- Gunakan bahasa sehari-hari yang natural, seperti ngobrol biasa
- Boleh pakai kata-kata seperti "Wah", "Nih", "Kak", "yuk", "loh"
- Jangan terlalu formal atau kaku
- Tunjukkan antusiasme tentang jus dan kesehatan

YANG BOLEH DIBAHAS:
- Manfaat buah, sayur, dan jus untuk kesehatan
- Nutrisi, vitamin, mineral dalam produk
- Tips kesehatan terkait konsumsi jus
- Alergi dan bahan-bahan produk
- Rekomendasi produk sesuai kebutuhan pelanggan

YANG TIDAK BOLEH:
- Jangan bahas programming, politik, agama, atau topik tidak terkait
- Jika ditanya topik itu, bilang dengan santai: "Wah kak, itu di luar keahlian aku nih. Tapi kalau soal jus dan kesehatan, siap bantu!"

CARA MENJAWAB:
- Ringkas tapi informatif (2-3 paragraf pendek)
- Gunakan baris baru untuk memisahkan ide
- Di akhir, rekomendasikan produk yang cocok dari daftar ini:

{products_context}

FORMAT REKOMENDASI:
Setelah menjelaskan, tawarkan produk dengan format:

"Kalau mau coba, ada **Nama Produk** (Rp XX.XXX) - [alasan singkat kenapa cocok]"

Contoh respons yang bagus:
"Wah bagus banget kak mau jaga imun! Vitamin C memang penting banget untuk daya tahan tubuh. Buah-buahan kayak jeruk, berry, dan kiwi kaya vitamin C loh.

Kalau mau coba, ada **Berry Blast** (Rp 25.000) - ini favorit pelanggan buat boost imunitas karena tinggi antioksidan!"

INGAT: Kamu penjual jus yang ramah, bukan robot. Ngobrol aja santai!"""

    SYSTEM_PROMPT_EN = """You are a juice seller at JuiceQu store. Answer like you're chatting directly with a customer - friendly, casual, and enthusiastic!

SPEAKING STYLE:
- Use natural everyday language, like a casual conversation
- Feel free to use expressions like "Hey", "So", "Actually", "you know"
- Don't be too formal or stiff
- Show enthusiasm about juice and health

TOPICS YOU CAN DISCUSS:
- Benefits of fruits, vegetables, and juice for health
- Nutrition, vitamins, minerals in products
- Health tips related to juice consumption
- Allergies and product ingredients
- Product recommendations based on customer needs

OFF-LIMITS:
- Don't discuss programming, politics, religion, or unrelated topics
- If asked about those, casually say: "Hey, that's a bit outside my expertise! But if it's about juice and health, I'm your person!"

HOW TO ANSWER:
- Concise but informative (2-3 short paragraphs)
- Use line breaks to separate ideas
- At the end, recommend a suitable product from this list:

{products_context}

RECOMMENDATION FORMAT:
After explaining, offer a product like this:

"If you wanna try, we have **Product Name** (Rp XX,XXX) - [brief reason why it's suitable]"

Example of a good response:
"That's awesome you want to boost your immunity! Vitamin C is super important for your immune system. Fruits like oranges, berries, and kiwi are packed with vitamin C.

If you wanna try, we have **Berry Blast** (Rp 25,000) - it's a customer favorite for immune boost because it's high in antioxidants!"

REMEMBER: You're a friendly juice seller, not a robot. Just chat casually!"""

    @property
    def name(self) -> str:
        return "ConversationalAgent"
    
    async def process(self, context: AgentContext) -> AgentResponse:
        """Process queries with natural LLM response."""
        try:
            # Get products context for the LLM
            products_context = self._get_products_context()
            
            # Select system prompt based on locale
            system_prompt = (
                self.SYSTEM_PROMPT_ID if context.locale == "id" 
                else self.SYSTEM_PROMPT_EN
            ).format(products_context=products_context)
            
            # Build conversation messages
            messages = self._build_messages(system_prompt, context)
            
            # Call LLM for natural response
            response_text = await self._call_llm(messages)
            
            # Parse LLM response to extract mentioned product names
            # Then query DB for those exact products with images
            featured_products = self._extract_products_from_response(response_text)
            
            return AgentResponse(
                success=True,
                message=response_text,
                intent=context.detected_intent or Intent.INQUIRY,
                featured_products=featured_products,
            )
            
        except Exception as e:
            logger.error(f"[ConversationalAgent] Error: {e}")
            return AgentResponse(
                success=False,
                message=self._get_fallback_message(context),
                intent=Intent.INQUIRY,
            )
    
    def _get_products_context(self) -> str:
        """Get product information for LLM context."""
        products = (
            self.db.query(Product)
            .filter(Product.is_available == True, Product.is_deleted == False)
            .order_by(Product.order_count.desc().nullslast())
            .limit(20)  # Get more products for better recommendations
            .all()
        )
        
        if not products:
            return "Tidak ada produk tersedia saat ini."
        
        context_lines = []
        for p in products:
            # Build comprehensive product info for LLM
            parts = [f"- **{p.name}** (Rp {p.base_price:,.0f})"]
            
            if p.description:
                parts.append(f"  Deskripsi: {p.description}")
            
            if p.ingredients:
                parts.append(f"  Bahan: {p.ingredients}")
            
            if p.health_benefits:
                parts.append(f"  Manfaat: {p.health_benefits}")
            
            if p.calories:
                parts.append(f"  Kalori: {p.calories} kal")
            
            if p.order_count and p.order_count > 10:
                parts.append(f"  (Populer - sudah dipesan {p.order_count}x)")
            
            context_lines.append("\n".join(parts))
        
        return "\n\n".join(context_lines)
    
    def _build_messages(self, system_prompt: str, context: AgentContext) -> list:
        """Build messages array for LLM."""
        messages = [{"role": "system", "content": system_prompt}]
        
        # Add conversation history if available
        if context.conversation_history:
            for msg in context.conversation_history[-6:]:  # Last 6 messages
                messages.append({
                    "role": msg.get("role", "user"),
                    "content": msg.get("content", "")
                })
        
        # Add current user input
        messages.append({"role": "user", "content": context.user_input})
        
        return messages
    
    async def _call_llm(self, messages: list) -> str:
        """Call Kolosal LLM for response."""
        import httpx
        
        if not settings.kolosal_api_key:
            logger.warning("Kolosal API key not configured")
            return self._get_generic_health_response()
        
        try:
            async with httpx.AsyncClient(
                base_url=settings.kolosal_api_base,
                headers={
                    "Authorization": f"Bearer {settings.kolosal_api_key}",
                    "Content-Type": "application/json",
                },
                timeout=30.0,
            ) as client:
                response = await client.post(
                    "/chat/completions",
                    json={
                        "model": settings.kolosal_model,
                        "messages": messages,
                        "temperature": 0.7,
                        "max_tokens": 500,
                    },
                )
                
                if response.status_code != 200:
                    logger.error(f"Kolosal API error: {response.status_code}")
                    return self._get_generic_health_response()
                
                data = response.json()
                
                if "choices" in data and len(data["choices"]) > 0:
                    content = data["choices"][0].get("message", {}).get("content", "")
                    if content:
                        # CRITICAL: Filter out system prompt leaks
                        # If response contains system prompt fragments, return fallback
                        prompt_leak_indicators = [
                            "IDENTITAS KAMU",
                            "GAYA BICARA:",
                            "YANG BOLEH DIBAHAS:",
                            "YANG TIDAK BOLEH:",
                            "CARA MENJAWAB:",
                            "FORMAT REKOMENDASI:",
                            "MANDATORY RULES:",
                            "HOW TO ANSWER:",
                            "SPEAKING STYLE:",
                            "{products_context}",
                        ]
                        
                        if any(indicator in content for indicator in prompt_leak_indicators):
                            logger.error("LLM response contains system prompt leak - filtering")
                            return self._get_generic_health_response()
                        
                        return content
                
                return self._get_generic_health_response()
                
        except Exception as e:
            logger.error(f"LLM call error: {e}")
            return self._get_generic_health_response()
    
    def _get_relevant_products(self, user_input: str, limit: int = 3) -> list:
        """Get products relevant to the user's query."""
        user_lower = user_input.lower()
        
        # Keywords mapping to product search
        keyword_mappings = {
            "imun": ["berry", "vitamin", "citrus", "jeruk", "orange"],
            "immune": ["berry", "vitamin", "citrus", "orange"],
            "energi": ["banana", "protein", "oat", "mango"],
            "energy": ["banana", "protein", "oat", "mango"],
            "stamina": ["banana", "protein", "spinach"],
            "diet": ["green", "detox", "rendah kalori", "low"],
            "detox": ["green", "detox", "cleanse"],
            "kulit": ["vitamin c", "berry", "carrot", "wortel"],
            "skin": ["vitamin c", "berry", "carrot"],
            "pencernaan": ["fiber", "serat", "papaya", "pepaya"],
            "digestion": ["fiber", "papaya", "pineapple"],
            "antioksidan": ["berry", "acai", "blueberry"],
            "antioxidant": ["berry", "acai", "blueberry"],
        }
        
        search_terms = []
        for keyword, terms in keyword_mappings.items():
            if keyword in user_lower:
                search_terms.extend(terms)
        
        if not search_terms:
            # Default: return bestsellers
            products = (
                self.db.query(Product)
                .filter(Product.is_available == True, Product.is_deleted == False)
                .order_by(Product.order_count.desc().nullslast())
                .limit(limit)
                .all()
            )
        else:
            # Search for relevant products
            from sqlalchemy import or_
            
            conditions = []
            for term in search_terms:
                conditions.append(Product.name.ilike(f"%{term}%"))
                conditions.append(Product.description.ilike(f"%{term}%"))
                conditions.append(Product.ingredients.ilike(f"%{term}%"))
            
            products = (
                self.db.query(Product)
                .filter(
                    Product.is_available == True,
                    Product.is_deleted == False,
                    or_(*conditions)
                )
                .order_by(Product.order_count.desc().nullslast())
                .limit(limit)
                .all()
            )
            
            # Fallback to bestsellers if no match
            if not products:
                products = (
                    self.db.query(Product)
                    .filter(Product.is_available == True, Product.is_deleted == False)
                    .order_by(Product.order_count.desc().nullslast())
                    .limit(limit)
                    .all()
                )
        
        return [self._format_product(p) for p in products]
    
    def _format_product(self, product: Product) -> dict:
        """Format product for response."""
        image_url = None
        if product.hero_image and (product.hero_image.startswith('/') or product.hero_image.startswith('http')):
            image_url = product.hero_image
        elif product.thumbnail_image and (product.thumbnail_image.startswith('/') or product.thumbnail_image.startswith('http')):
            image_url = product.thumbnail_image
        
        return {
            "id": product.id,
            "name": product.name,
            "description": product.description,
            "price": float(product.base_price),
            "image_url": image_url,
            "calories": product.calories,
            "ingredients": product.ingredients,
        }
    
    def _get_generic_health_response(self) -> str:
        """Fallback response when LLM is unavailable."""
        return (
            "Jus buah segar sangat baik untuk kesehatan! Buah-buahan mengandung "
            "vitamin, mineral, dan antioksidan yang penting untuk tubuh. "
            "Untuk rekomendasi yang lebih spesifik, silakan lihat menu produk kami "
            "atau tanyakan tentang produk tertentu yang Anda minati!"
        )
    
    def _extract_products_from_response(self, llm_response: str, limit: int = 3) -> list:
        """
        Parse LLM response to extract product names mentioned.
        Then query database for those exact products with images.
        
        Products are typically mentioned in **bold** format like:
        - **Mixed Berries Smoothie Bowl**
        - **Green Goddess Smoothie Bowl**
        """
        import re
        
        # Extract product names from **bold** text in LLM response
        bold_pattern = r'\*\*([^*]+)\*\*'
        mentioned_names = re.findall(bold_pattern, llm_response)
        
        if not mentioned_names:
            # No bold products found, return empty
            return []
        
        # Clean up extracted names (remove price info if accidentally included)
        cleaned_names = []
        for name in mentioned_names:
            # Remove price patterns like "(Rp 25.000)" or "(Rp 25,000)"
            clean_name = re.sub(r'\s*\(Rp[\s\d.,]+\)', '', name).strip()
            if clean_name and len(clean_name) > 2:
                cleaned_names.append(clean_name)
        
        if not cleaned_names:
            return []
        
        # Query database for products matching these names
        from sqlalchemy import or_
        
        conditions = []
        for name in cleaned_names[:5]:  # Limit to first 5 names
            # Try exact match first, then partial match
            conditions.append(Product.name.ilike(name))
            conditions.append(Product.name.ilike(f"%{name}%"))
        
        products = (
            self.db.query(Product)
            .filter(
                Product.is_available == True,
                Product.is_deleted == False,
                or_(*conditions)
            )
            .limit(limit)
            .all()
        )
        
        # If no exact matches, try fuzzy matching with individual words
        if not products and cleaned_names:
            word_conditions = []
            for name in cleaned_names[:3]:
                # Split name into words and search for each
                words = name.split()
                for word in words:
                    if len(word) > 3:  # Only significant words
                        word_conditions.append(Product.name.ilike(f"%{word}%"))
            
            if word_conditions:
                products = (
                    self.db.query(Product)
                    .filter(
                        Product.is_available == True,
                        Product.is_deleted == False,
                        or_(*word_conditions)
                    )
                    .order_by(Product.order_count.desc().nullslast())
                    .limit(limit)
                    .all()
                )
        
        return [self._format_product(p) for p in products]
    
    def _get_fallback_message(self, context: AgentContext) -> str:
        """Get fallback message on error."""
        if context.locale == "id":
            return (
                "Maaf, saya mengalami kendala teknis. "
                "Silakan coba lagi atau tanyakan tentang produk spesifik kami!"
            )
        return (
            "Sorry, I'm experiencing technical difficulties. "
            "Please try again or ask about our specific products!"
        )
