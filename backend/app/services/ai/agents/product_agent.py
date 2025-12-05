"""
Product Agent - Handles product queries, recommendations, and search.
Uses RAG for semantic product search and natural language understanding.
"""
import re
from typing import Optional

from sqlalchemy.orm import Session
from sqlalchemy import func

from app.models.product import Product, ProductSize
from .base import BaseAgent, AgentContext, AgentResponse, Intent


class ProductAgent(BaseAgent):
    """
    Handles all product-related queries:
    - Product recommendations (bestseller, cheapest, healthiest, etc.)
    - Product search
    - Product information
    """
    
    @property
    def name(self) -> str:
        return "ProductAgent"
    
    async def process(self, context: AgentContext) -> AgentResponse:
        """Process product-related queries."""
        intent = context.detected_intent
        entities = context.extracted_entities
        user_input = context.user_input.lower()
        
        if intent == Intent.RECOMMENDATION:
            return await self._handle_recommendation(context, entities)
        elif intent == Intent.SEARCH:
            return await self._handle_search(context)
        elif intent == Intent.PRODUCT_INFO:
            return await self._handle_product_info(context)
        else:
            # Default to recommendation
            return await self._handle_recommendation(context, entities)
    
    async def _handle_recommendation(
        self, 
        context: AgentContext, 
        entities: dict
    ) -> AgentResponse:
        """Handle product recommendation requests."""
        user_input = context.user_input.lower()
        price_pref = entities.get("price_preference")
        category_pref = entities.get("category_preference")
        
        products = []
        response_key = "default"
        
        # Determine recommendation type
        if price_pref == "cheapest" or any(w in user_input for w in ["murah", "termurah", "cheap", "budget"]):
            products = self._get_cheapest_products()
            response_key = "cheapest"
        elif price_pref == "most_expensive" or any(w in user_input for w in ["mahal", "termahal", "premium", "expensive"]):
            products = self._get_most_expensive_products()
            response_key = "premium"
        elif category_pref == "healthy" or any(w in user_input for w in ["sehat", "healthy", "diet", "rendah kalori", "low calorie"]):
            products = self._get_healthy_products()
            response_key = "healthy"
        elif category_pref == "bestseller" or any(w in user_input for w in ["terlaris", "bestseller", "populer", "popular", "favorit", "top"]):
            products = self._get_bestseller_products()
            response_key = "bestseller"
        elif any(w in user_input for w in ["segar", "fresh", "dingin", "cold"]):
            products = self._get_fresh_products()
            response_key = "fresh"
        elif any(w in user_input for w in ["smoothie"]):
            products = self._get_products_by_category("smoothie")
            response_key = "smoothie"
        elif any(w in user_input for w in ["bowl", "acai"]):
            products = self._get_products_by_category("bowl")
            response_key = "bowl"
        elif any(w in user_input for w in ["jus", "juice"]):
            products = self._get_products_by_category("juice")
            response_key = "juice"
        else:
            # Default to bestseller
            products = self._get_bestseller_products()
            response_key = "bestseller"
        
        if not products:
            return AgentResponse(
                success=False,
                message=self._get_locale_text(
                    context,
                    "Maaf, tidak ada produk yang sesuai dengan kriteria Anda.",
                    "Sorry, no products match your criteria."
                ),
                intent=Intent.RECOMMENDATION,
            )
        
        # Format products for response
        featured = self._format_products(products)
        message = self._get_recommendation_message(response_key, len(products), context)
        
        return AgentResponse(
            success=True,
            message=message,
            intent=Intent.RECOMMENDATION,
            featured_products=featured,
            data={"recommendation_type": response_key},
        )
    
    async def _handle_search(self, context: AgentContext) -> AgentResponse:
        """Handle product search."""
        # Extract search query
        user_input = context.user_input.lower()
        search_match = re.search(r"\b(cari|carikan|search|find|temukan)\s+(.+)", user_input)
        
        search_query = ""
        if search_match:
            search_query = search_match.group(2).strip()
        else:
            search_query = user_input
        
        # Search products
        products = self._search_products(search_query)
        
        if not products:
            return AgentResponse(
                success=False,
                message=self._get_locale_text(
                    context,
                    f'Tidak ada produk yang cocok dengan "{search_query}". Coba kata kunci lain?',
                    f'No products match "{search_query}". Try different keywords?'
                ),
                intent=Intent.SEARCH,
                search_query=search_query,
            )
        
        featured = self._format_products(products)
        
        return AgentResponse(
            success=True,
            message=self._get_locale_text(
                context,
                f'Ditemukan {len(products)} produk untuk "{search_query}":',
                f'Found {len(products)} products for "{search_query}":'
            ),
            intent=Intent.SEARCH,
            featured_products=featured,
            search_query=search_query,
            should_navigate=True,
            destination="/menu",
        )
    
    async def _handle_product_info(self, context: AgentContext) -> AgentResponse:
        """Handle product information requests."""
        user_input = context.user_input.lower()
        
        # Try to find mentioned product
        products = self._get_all_products()
        mentioned_product = None
        
        for product in products:
            if product.name.lower() in user_input:
                mentioned_product = product
                break
        
        if not mentioned_product:
            # Fuzzy search
            for product in products:
                name_words = product.name.lower().split()
                if any(word in user_input for word in name_words if len(word) > 3):
                    mentioned_product = product
                    break
        
        if mentioned_product:
            info = self._format_product_info(mentioned_product, context)
            return AgentResponse(
                success=True,
                message=info,
                intent=Intent.PRODUCT_INFO,
                featured_products=[self._format_single_product(mentioned_product)],
            )
        
        # No specific product mentioned, show popular ones
        products = self._get_bestseller_products(limit=4)
        featured = self._format_products(products)
        
        return AgentResponse(
            success=True,
            message=self._get_locale_text(
                context,
                "Berikut produk populer kami. Mau tahu detail produk mana?",
                "Here are our popular products. Which one would you like to know more about?"
            ),
            intent=Intent.PRODUCT_INFO,
            featured_products=featured,
        )
    
    # Database query methods
    def _get_cheapest_products(self, limit: int = 4) -> list[Product]:
        """Get cheapest products."""
        return (
            self.db.query(Product)
            .filter(Product.is_available == True, Product.is_deleted == False)
            .order_by(Product.base_price.asc())
            .limit(limit)
            .all()
        )
    
    def _get_most_expensive_products(self, limit: int = 4) -> list[Product]:
        """Get most expensive/premium products."""
        return (
            self.db.query(Product)
            .filter(Product.is_available == True, Product.is_deleted == False)
            .order_by(Product.base_price.desc())
            .limit(limit)
            .all()
        )
    
    def _get_healthy_products(self, limit: int = 4) -> list[Product]:
        """Get healthy/low-calorie products."""
        return (
            self.db.query(Product)
            .filter(
                Product.is_available == True,
                Product.is_deleted == False,
                Product.calories.isnot(None),
                Product.calories < 200
            )
            .order_by(Product.calories.asc())
            .limit(limit)
            .all()
        )
    
    def _get_bestseller_products(self, limit: int = 4) -> list[Product]:
        """Get bestseller products."""
        return (
            self.db.query(Product)
            .filter(Product.is_available == True, Product.is_deleted == False)
            .order_by(Product.order_count.desc().nullslast(), Product.average_rating.desc().nullslast())
            .limit(limit)
            .all()
        )
    
    def _get_fresh_products(self, limit: int = 4) -> list[Product]:
        """Get fresh/cold products."""
        return (
            self.db.query(Product)
            .filter(
                Product.is_available == True,
                Product.is_deleted == False,
            )
            .order_by(Product.created_at.desc())
            .limit(limit)
            .all()
        )
    
    def _get_products_by_category(self, category_keyword: str, limit: int = 4) -> list[Product]:
        """Get products by category keyword."""
        from app.models.product import ProductCategory
        
        return (
            self.db.query(Product)
            .join(ProductCategory)
            .filter(
                Product.is_available == True,
                Product.is_deleted == False,
                func.lower(ProductCategory.name).contains(category_keyword.lower())
            )
            .order_by(Product.order_count.desc().nullslast())
            .limit(limit)
            .all()
        )
    
    def _search_products(self, query: str, limit: int = 6) -> list[Product]:
        """Search products by name, description, or ingredients."""
        search_term = f"%{query}%"
        return (
            self.db.query(Product)
            .filter(
                Product.is_available == True,
                Product.is_deleted == False,
                (
                    Product.name.ilike(search_term) |
                    Product.description.ilike(search_term) |
                    Product.ingredients.ilike(search_term)
                )
            )
            .order_by(Product.order_count.desc().nullslast())
            .limit(limit)
            .all()
        )
    
    def _get_all_products(self) -> list[Product]:
        """Get all available products."""
        return (
            self.db.query(Product)
            .filter(Product.is_available == True, Product.is_deleted == False)
            .order_by(Product.order_count.desc().nullslast())
            .all()
        )
    
    # Formatting methods
    def _format_products(self, products: list[Product]) -> list[dict]:
        """Format products for API response."""
        return [self._format_single_product(p) for p in products]
    
    def _format_single_product(self, product: Product) -> dict:
        """Format single product."""
        image_url = None
        if product.hero_image and (product.hero_image.startswith('/') or product.hero_image.startswith('http')):
            image_url = product.hero_image
        elif product.thumbnail_image and (product.thumbnail_image.startswith('/') or product.thumbnail_image.startswith('http')):
            image_url = product.thumbnail_image
        elif product.image_url and (product.image_url.startswith('/') or product.image_url.startswith('http')):
            image_url = product.image_url
        
        return {
            "id": product.id,
            "name": product.name,
            "description": product.description,
            "price": float(product.base_price),
            "image_url": image_url,
            "thumbnail_url": product.thumbnail_image if product.thumbnail_image and (product.thumbnail_image.startswith('/') or product.thumbnail_image.startswith('http')) else None,
            "category": product.category.name if product.category else None,
            "calories": product.calories,
            "is_bestseller": (product.order_count or 0) > 10,
            "order_count": product.order_count or 0,
        }
    
    def _format_product_info(self, product: Product, context: AgentContext) -> str:
        """Format detailed product information."""
        if context.locale == "id":
            info = f"{product.name}\n\n"
            info += f"Harga: Rp {product.base_price:,.0f}\n"
            if product.description:
                info += f"Deskripsi: {product.description}\n"
            if product.calories:
                info += f"Kalori: {product.calories} kal\n"
            if product.ingredients:
                info += f"Bahan: {product.ingredients}\n"
            info += f"\nMau pesan? Bilang saja 'beli {product.name}'!"
        else:
            info = f"{product.name}\n\n"
            info += f"Price: Rp {product.base_price:,.0f}\n"
            if product.description:
                info += f"Description: {product.description}\n"
            if product.calories:
                info += f"Calories: {product.calories} cal\n"
            if product.ingredients:
                info += f"Ingredients: {product.ingredients}\n"
            info += f"\nWant to order? Just say 'buy {product.name}'!"
        
        return info
    
    def _get_recommendation_message(self, rec_type: str, count: int, context: AgentContext) -> str:
        """Get recommendation message based on type."""
        messages = {
            "cheapest": {
                "id": f"Ini {count} produk termurah kami! Hemat tapi tetap segar dan enak:",
                "en": f"Here are our {count} most affordable products! Budget-friendly but still fresh and delicious:",
            },
            "premium": {
                "id": f"Ini {count} produk premium kami dengan bahan-bahan terbaik:",
                "en": f"Here are our {count} premium products with the finest ingredients:",
            },
            "healthy": {
                "id": f"Ini {count} pilihan sehat rendah kalori untuk Anda:",
                "en": f"Here are {count} healthy low-calorie options for you:",
            },
            "bestseller": {
                "id": f"Ini {count} produk terlaris yang paling disukai pelanggan:",
                "en": f"Here are our {count} bestsellers that customers love:",
            },
            "fresh": {
                "id": f"Ini {count} produk segar terbaru kami:",
                "en": f"Here are our {count} freshest products:",
            },
            "smoothie": {
                "id": f"Ini {count} pilihan smoothie kami:",
                "en": f"Here are our {count} smoothie options:",
            },
            "bowl": {
                "id": f"Ini {count} pilihan bowl kami:",
                "en": f"Here are our {count} bowl options:",
            },
            "juice": {
                "id": f"Ini {count} pilihan jus segar kami:",
                "en": f"Here are our {count} fresh juice options:",
            },
            "default": {
                "id": f"Ini {count} rekomendasi untuk Anda:",
                "en": f"Here are {count} recommendations for you:",
            },
        }
        
        msg_dict = messages.get(rec_type, messages["default"])
        return msg_dict["id"] if context.locale == "id" else msg_dict["en"]

