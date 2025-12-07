"""
Order Agent - Handles cart operations and ordering.
Understands natural language orders and manages cart state.
"""
import re
from typing import Optional

from sqlalchemy.orm import Session

from app.models.product import Product, ProductSize
from .base import BaseAgent, AgentContext, AgentResponse, Intent


class OrderAgent(BaseAgent):
    """
    Handles all order-related operations:
    - Adding products to cart (with natural language understanding)
    - Removing products from cart
    - Clearing cart
    - Checkout navigation
    """
    
    # Product name variations mapping
    PRODUCT_ALIASES = {
        "acai": ["acai", "asai", "acay"],
        "berry": ["berry", "beri"],
        "mango": ["mango", "mangga"],
        "smoothie": ["smoothie", "smuti", "smudi"],
        "bowl": ["bowl", "bol"],
        "tropical": ["tropical", "tropis"],
        "green": ["green", "hijau"],
        "detox": ["detox", "detoks"],
    }
    
    @property
    def name(self) -> str:
        return "OrderAgent"
    
    async def process(self, context: AgentContext) -> AgentResponse:
        """Process order-related requests."""
        intent = context.detected_intent
        
        if intent == Intent.ADD_TO_CART:
            return await self._handle_add_to_cart(context)
        elif intent == Intent.REMOVE_FROM_CART:
            return await self._handle_remove_from_cart(context)
        elif intent == Intent.CLEAR_CART:
            return await self._handle_clear_cart(context)
        elif intent == Intent.CHECKOUT:
            return await self._handle_checkout(context)
        else:
            return await self._handle_add_to_cart(context)
    
    async def _handle_add_to_cart(self, context: AgentContext) -> AgentResponse:
        """Handle add to cart requests with smart product matching."""
        user_input = context.user_input.lower()
        entities = context.extracted_entities
        
        # Check if user wants product by criteria (cheapest, bestseller, etc.)
        price_pref = entities.get("price_preference")
        category_pref = entities.get("category_preference")
        
        products_to_add = []
        
        # Extract how many products user wants (e.g., "2 buah produk terlaris")
        product_count = self._extract_product_count(user_input)
        
        if price_pref or category_pref:
            # User wants to add products by criteria
            criteria_products = self._get_product_by_criteria(
                price_pref, 
                category_pref, 
                count=product_count
            )
            
            quantity_each = entities.get("quantity", 1)
            size = entities.get("size", "medium")
            
            for product in criteria_products:
                products_to_add.append({
                    "product": product,
                    "quantity": quantity_each,
                    "size": size,
                })
        
        # If no criteria match, try to find product by name
        if not products_to_add:
            products_to_add = self._extract_products_from_input(user_input, entities)
        
        if not products_to_add:
            # No product found - suggest recommendations
            return AgentResponse(
                success=False,
                message=self._get_locale_text(
                    context,
                    "Produk tidak ditemukan. Mau saya rekomendasikan produk terlaris?",
                    "Product not found. Would you like me to recommend our bestsellers?"
                ),
                intent=Intent.ADD_TO_CART,
            )
        
        # Build order items
        order_items = []
        total_price = 0
        
        for item in products_to_add:
            product = item["product"]
            quantity = item["quantity"]
            size_str = item["size"]
            
            # Always use base_price for consistency with frontend display
            # Size-based pricing should only apply at checkout if needed
            unit_price = product.base_price
            item_total = unit_price * quantity
            total_price += item_total
            
            # Get image URL
            image_url = None
            if product.hero_image and (product.hero_image.startswith('/') or product.hero_image.startswith('http')):
                image_url = product.hero_image
            elif product.thumbnail_image and (product.thumbnail_image.startswith('/') or product.thumbnail_image.startswith('http')):
                image_url = product.thumbnail_image
            elif product.image_url and (product.image_url.startswith('/') or product.image_url.startswith('http')):
                image_url = product.image_url
            
            order_items.append({
                "product_id": product.id,
                "product_name": product.name,
                "quantity": quantity,
                "size": size_str,
                "unit_price": unit_price,
                "total_price": item_total,
                "image_url": image_url,
                "description": product.description,
            })
        
        # Build response message
        if len(order_items) == 1:
            item = order_items[0]
            message = self._get_locale_text(
                context,
                f"Siap! {item['quantity']}x {item['product_name']} (Rp {item['total_price']:,.0f}) ditambahkan ke keranjang.",
                f"Done! {item['quantity']}x {item['product_name']} (Rp {item['total_price']:,.0f}) added to cart."
            )
        else:
            items_text = ", ".join([f"{i['quantity']}x {i['product_name']}" for i in order_items])
            message = self._get_locale_text(
                context,
                f"Siap! {items_text} ditambahkan ke keranjang. Total: Rp {total_price:,.0f}",
                f"Done! {items_text} added to cart. Total: Rp {total_price:,.0f}"
            )
        
        return AgentResponse(
            success=True,
            message=message,
            intent=Intent.ADD_TO_CART,
            order_items=order_items,
            should_add_to_cart=True,
            data={
                "subtotal": total_price,
                "tax": total_price * 0.1,
                "total": total_price * 1.1,
            },
        )
    
    async def _handle_remove_from_cart(self, context: AgentContext) -> AgentResponse:
        """Handle remove from cart requests."""
        user_input = context.user_input.lower()
        
        # Extract product name to remove
        remove_patterns = [
            r"\b(hapus|hilangkan|buang|remove|delete)\s+(.+?)(?:\s+dari|\s+from)?\s*(keranjang|cart)?$",
            r"\b(keranjang|cart)\b.*\b(hapus|remove)\s+(.+)$",
        ]
        
        product_name = None
        for pattern in remove_patterns:
            match = re.search(pattern, user_input, re.IGNORECASE)
            if match:
                product_name = match.group(2).strip()
                break
        
        if not product_name:
            return AgentResponse(
                success=False,
                message=self._get_locale_text(
                    context,
                    "Produk mana yang ingin dihapus dari keranjang?",
                    "Which product would you like to remove from cart?"
                ),
                intent=Intent.REMOVE_FROM_CART,
            )
        
        return AgentResponse(
            success=True,
            message=self._get_locale_text(
                context,
                f'Menghapus "{product_name}" dari keranjang...',
                f'Removing "{product_name}" from cart...'
            ),
            intent=Intent.REMOVE_FROM_CART,
            data={"remove_product_name": product_name},
        )
    
    async def _handle_clear_cart(self, context: AgentContext) -> AgentResponse:
        """Handle clear cart requests."""
        return AgentResponse(
            success=True,
            message=self._get_locale_text(
                context,
                "Keranjang dikosongkan!",
                "Cart cleared!"
            ),
            intent=Intent.CLEAR_CART,
            data={"clear_cart": True},
        )
    
    async def _handle_checkout(self, context: AgentContext) -> AgentResponse:
        """Handle checkout navigation."""
        return AgentResponse(
            success=True,
            message=self._get_locale_text(
                context,
                "Mengarahkan ke halaman checkout...",
                "Navigating to checkout..."
            ),
            intent=Intent.CHECKOUT,
            destination="/checkout",
            should_navigate=True,
        )
    
    def _get_product_by_criteria(
        self, 
        price_pref: Optional[str], 
        category_pref: Optional[str],
        count: int = 1
    ) -> list[Product]:
        """Get products based on user criteria. Returns list of products."""
        query = self.db.query(Product).filter(
            Product.is_available == True,
            Product.is_deleted == False
        )
        
        results = []
        
        if price_pref == "cheapest":
            results = query.order_by(Product.base_price.asc()).limit(count).all()
        elif price_pref == "most_expensive":
            results = query.order_by(Product.base_price.desc()).limit(count).all()
        elif category_pref == "bestseller":
            results = query.order_by(Product.order_count.desc().nullslast()).limit(count).all()
        elif category_pref == "healthy":
            results = query.filter(Product.calories < 200).order_by(Product.calories.asc()).limit(count).all()
        
        return results
    
    def _extract_products_from_input(
        self, 
        user_input: str, 
        entities: dict
    ) -> list[dict]:
        """Extract products mentioned in user input."""
        products = self._get_all_products()
        found_products = []
        matched_product_ids = set()
        
        quantity = entities.get("quantity", 1)
        size = entities.get("size", "medium")
        
        # Sort products by name length (longer names first) to match more specific products first
        products_sorted = sorted(products, key=lambda p: len(p.name), reverse=True)
        
        for product in products_sorted:
            # Skip if already matched
            if product.id in matched_product_ids:
                continue
                
            product_name_lower = product.name.lower()
            
            # Direct full name match (highest priority)
            if product_name_lower in user_input:
                found_products.append({
                    "product": product,
                    "quantity": self._extract_quantity_for_product(user_input, product_name_lower, quantity),
                    "size": size,
                })
                matched_product_ids.add(product.id)
                continue
            
            # Check for unique identifying words (not common words like "smoothie", "juice")
            common_words = {"smoothie", "juice", "jus", "bowl", "fresh", "segar"}
            product_words = product_name_lower.split()
            unique_words = [w for w in product_words if len(w) > 3 and w not in common_words]
            
            if unique_words:
                # All unique words must be present for a match
                matches = sum(1 for word in unique_words if word in user_input)
                if matches == len(unique_words):
                    found_products.append({
                        "product": product,
                        "quantity": self._extract_quantity_for_product(user_input, product_name_lower, quantity),
                        "size": size,
                    })
                    matched_product_ids.add(product.id)
                    continue
            
            # Check aliases only if no unique words matched
            for alias_key, aliases in self.PRODUCT_ALIASES.items():
                if alias_key in product_name_lower:
                    # Check if alias AND at least one other unique word is present
                    if any(alias in user_input for alias in aliases):
                        other_unique = [w for w in product_words if w != alias_key and len(w) > 3 and w not in common_words]
                        if other_unique and any(w in user_input for w in other_unique):
                            found_products.append({
                                "product": product,
                                "quantity": quantity,
                                "size": size,
                            })
                            matched_product_ids.add(product.id)
                            break
        
        return found_products
    
    def _extract_quantity_for_product(
        self, 
        user_input: str, 
        product_name: str, 
        default: int = 1
    ) -> int:
        """Extract quantity specific to a product mention."""
        # Pattern: "2 acai mango" or "acai mango 2"
        patterns = [
            rf'(\d+)\s*(?:x\s*)?{re.escape(product_name)}',
            rf'{re.escape(product_name)}\s*(?:x\s*)?(\d+)',
            rf'(\d+)\s*(?:x\s*)?(?:buah|pcs|gelas)?\s*{re.escape(product_name)}',
        ]
        
        for pattern in patterns:
            match = re.search(pattern, user_input)
            if match:
                return int(match.group(1))
        
        return default
    
    def _get_all_products(self) -> list[Product]:
        """Get all available products."""
        return (
            self.db.query(Product)
            .filter(Product.is_available == True, Product.is_deleted == False)
            .all()
        )
    
    def _extract_product_count(self, user_input: str) -> int:
        """
        Extract how many products user wants from the input.
        E.g., "2 buah produk terlaris" -> 2
              "dua produk termurah" -> 2
              "tiga item paling laris" -> 3
        """
        # Number words mapping
        number_words = {
            "satu": 1, "one": 1,
            "dua": 2, "two": 2,
            "tiga": 3, "three": 3,
            "empat": 4, "four": 4,
            "lima": 5, "five": 5,
        }
        
        # Pattern: digit followed by product-related words
        digit_pattern = r'(\d+)\s*(?:buah|porsi|pcs|macam|jenis|item|produk|product)?'
        match = re.search(digit_pattern, user_input)
        if match:
            count = int(match.group(1))
            if 1 <= count <= 10:  # Reasonable limit
                return count
        
        # Pattern: number word followed by product-related words
        for word, num in number_words.items():
            if re.search(rf'\b{word}\b\s*(?:buah|porsi|pcs|macam|jenis|item|produk|product)?', user_input):
                return num
        
        return 1  # Default to 1 product

