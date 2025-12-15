"""Voice Agent - Smart voice command processing with Gemini."""
import json
import logging
import re
from typing import Optional

from app.models.product import Product
from app.services.ai.llm_provider import get_llm_provider
from .base import BaseAgent, AgentContext, AgentResponse, Intent

logger = logging.getLogger(__name__)


class VoiceAgent(BaseAgent):
    """
    Smart voice command agent that:
    1. Uses Gemini to transcribe audio and parse intent in one request
    2. Matches products from database
    3. Returns ACTIONS (navigate, add to cart) not explanations
    """

    VOICE_SYSTEM_PROMPT = """Kamu adalah parser perintah suara untuk toko jus JuiceQu.
Tugasmu adalah mengubah perintah suara user menjadi ACTION yang bisa dieksekusi.

PRODUK TERSEDIA:
{products_list}

TUGAS:
1. Pahami maksud user (meski ada typo/salah ucap)
2. Tentukan ACTION yang tepat
3. Cocokkan dengan produk di database (pilih yang paling sesuai)
4. SELALU isi "products" array dengan nama produk EXACT dari database

OUTPUT FORMAT (JSON ONLY, NO OTHER TEXT):
{{
    "action": "add_to_cart" | "navigate_product" | "navigate_page" | "search" | "clear_cart" | "checkout",
    "products": [
        {{
            "name": "nama produk EXACT dari database (WAJIB untuk add_to_cart dan navigate_product)",
            "quantity": 1,
            "size": "medium"
        }}
    ],
    "destination": "/menu" | "/cart" | "/checkout",
    "search_query": "query pencarian",
    "message": "pesan singkat (max 10 kata)"
}}

RULES:
- action "add_to_cart": tambah produk ke keranjang, WAJIB isi products[]
- action "navigate_product": user mau lihat/tahu tentang produk, WAJIB isi products[] dengan 1 produk yang dituju
- action "navigate_page": user mau ke halaman tertentu (menu/cart/checkout)
- action "search": user cari produk, isi search_query
- message harus SINGKAT: "2x Acai Bowl ditambahkan" atau "Menuju Avocado Coffee Smoothie"

PENTING: Output HANYA JSON, tanpa penjelasan lain!"""

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.llm_provider = get_llm_provider()

    @property
    def name(self) -> str:
        return "VoiceAgent"

    async def process(self, context: AgentContext) -> AgentResponse:
        """Process voice command with LLM understanding."""
        try:
            products = self._get_all_products()
            products_list = self._format_products_list(products)

            system_prompt = self.VOICE_SYSTEM_PROMPT.format(products_list=products_list)

            llm_response = await self._call_llm(system_prompt, context.user_input)
            action_data = self._parse_llm_response(llm_response)

            if not action_data:
                return self._fallback_response(context)

            return self._build_action_response(action_data, products, context)

        except Exception as e:
            logger.error("VoiceAgent error: %s", e)
            return self._fallback_response(context)

    async def process_audio(
        self,
        audio_data: bytes,
        context: AgentContext,
    ) -> AgentResponse:
        """Process audio directly with Gemini STT + intent parsing."""
        try:
            products = self._get_all_products()
            products_context = self._format_products_list(products)

            result = await self.llm_provider.transcribe_and_parse_voice_command(
                audio_data=audio_data,
                products_context=products_context,
                language=context.locale or "id",
            )

            if "error" in result:
                logger.error("Voice command processing error: %s", result["error"])
                return self._fallback_response(context)

            transcription = result.get("transcription", "")
            action_data = {
                "action": result.get("action"),
                "products": result.get("products", []),
                "destination": result.get("destination"),
                "search_query": result.get("search_query"),
                "message": result.get("message", ""),
            }

            response = self._build_action_response(action_data, products, context)
            response.data = response.data or {}
            response.data["transcription"] = transcription

            return response

        except Exception as e:
            logger.error("Voice audio processing error: %s", e)
            return self._fallback_response(context)

    def _get_all_products(self) -> list[Product]:
        """Get all available products."""
        return (
            self.db.query(Product)
            .filter(Product.is_available == True, Product.is_deleted == False)
            .order_by(Product.order_count.desc().nullslast())
            .all()
        )

    def _format_products_list(self, products: list[Product]) -> str:
        """Format products for LLM context."""
        lines = []
        for p in products:
            info = f"- {p.name} (ID: {p.id}, Rp {p.base_price:,.0f})"
            if p.description:
                info += f" - {p.description}"
            if p.health_benefits:
                info += f" | Manfaat: {p.health_benefits}"
            lines.append(info)
        return "\n".join(lines)

    async def _call_llm(self, system_prompt: str, user_input: str) -> str:
        """Call LLM for parsing text input."""
        result = await self.llm_provider.chat_completion(
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_input},
            ],
            temperature=0.3,
            max_tokens=300,
        )

        return result.get("content", "")

    def _parse_llm_response(self, llm_response: str) -> Optional[dict]:
        """Parse LLM JSON response."""
        if not llm_response:
            return None

        try:
            json_match = re.search(r"\{[\s\S]*\}", llm_response)
            if json_match:
                return json.loads(json_match.group())
        except json.JSONDecodeError as e:
            logger.error("JSON parse error: %s", e)

        return None

    def _build_action_response(
        self,
        action_data: dict,
        products: list[Product],
        context: AgentContext,
    ) -> AgentResponse:
        """Build response based on parsed action."""
        action = action_data.get("action", "")
        message = action_data.get("message", "Perintah diproses")

        if action == "add_to_cart":
            product_items = action_data.get("products", [])
            order_items = []

            for item in product_items:
                product_name = item.get("name", "")
                quantity = item.get("quantity", 1)
                size = item.get("size", "medium")

                matched_product = self._find_product(product_name, products)

                if matched_product:
                    image_url = matched_product.hero_image or matched_product.thumbnail_image

                    order_items.append({
                        "product_id": matched_product.id,
                        "product_name": matched_product.name,
                        "quantity": quantity,
                        "size": size,
                        "unit_price": matched_product.base_price,
                        "total_price": matched_product.base_price * quantity,
                        "image_url": image_url,
                    })

            if order_items:
                return AgentResponse(
                    success=True,
                    message=message,
                    intent=Intent.ADD_TO_CART,
                    order_items=order_items,
                    should_add_to_cart=True,
                )

        elif action == "navigate_product":
            product_items = action_data.get("products", [])
            matched = None

            if product_items:
                product_name = product_items[0].get("name", "")
                matched = self._find_product(product_name, products)

            if not matched:
                for product in products:
                    if product.name.lower() in message.lower():
                        matched = product
                        break

            if matched:
                return AgentResponse(
                    success=True,
                    message=message,
                    intent=Intent.NAVIGATE,
                    destination=f"/products/{matched.id}",
                    should_navigate=True,
                )
            else:
                return AgentResponse(
                    success=True,
                    message=message,
                    intent=Intent.NAVIGATE,
                    destination="/menu",
                    should_navigate=True,
                )

        elif action == "navigate_page":
            destination = action_data.get("destination", "/menu")
            return AgentResponse(
                success=True,
                message=message,
                intent=Intent.NAVIGATE,
                destination=destination,
                should_navigate=True,
            )

        elif action == "search":
            query = action_data.get("search_query", "")
            return AgentResponse(
                success=True,
                message=message,
                intent=Intent.SEARCH,
                destination=f"/menu?search={query}",
                should_navigate=True,
                data={"search_query": query},
            )

        elif action == "checkout":
            return AgentResponse(
                success=True,
                message=message,
                intent=Intent.CHECKOUT,
                destination="/checkout",
                should_navigate=True,
            )

        elif action == "clear_cart":
            return AgentResponse(
                success=True,
                message=message,
                intent=Intent.CLEAR_CART,
                data={"clear_cart": True},
            )

        return self._fallback_response(context)

    def _find_product(self, name: str, products: list[Product]) -> Optional[Product]:
        """Find product by name with fuzzy matching."""
        if not name:
            return None

        name_lower = name.lower()

        for p in products:
            if p.name.lower() == name_lower:
                return p

        for p in products:
            if name_lower in p.name.lower() or p.name.lower() in name_lower:
                return p

        name_words = set(name_lower.split())
        best_match = None
        best_score = 0

        for p in products:
            product_words = set(p.name.lower().split())
            matches = len(name_words & product_words)
            if matches > best_score:
                best_score = matches
                best_match = p

        return best_match if best_score > 0 else None

    def _fallback_response(self, context: AgentContext) -> AgentResponse:
        """Fallback when parsing fails."""
        message = (
            "Maaf, tidak dapat memproses. Coba: 'beli Acai Bowl' atau 'lihat menu'"
            if context.locale == "id"
            else "Sorry, couldn't process. Try: 'buy Acai Bowl' or 'show menu'"
        )
        return AgentResponse(
            success=False,
            message=message,
            intent=Intent.INQUIRY,
        )
