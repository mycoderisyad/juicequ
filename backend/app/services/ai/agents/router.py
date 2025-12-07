"""
Intent Router Agent - Detects user intent from natural language.
Uses pattern matching and semantic understanding.
"""
import re
from typing import Optional

from sqlalchemy.orm import Session

from .base import BaseAgent, AgentContext, AgentResponse, Intent


class IntentRouterAgent(BaseAgent):
    """
    Routes user input to appropriate agent based on detected intent.
    Uses multi-layer intent detection:
    1. Exact pattern matching for common commands
    2. Keyword-based classification
    3. Semantic analysis for complex queries
    """
    
    # Intent patterns - Indonesian and English
    INTENT_PATTERNS = {
        Intent.GREETING: [
            r"^(halo|hai|hi|hello|hey|selamat\s+(pagi|siang|sore|malam)|good\s+(morning|afternoon|evening))[\s!?.]*$",
        ],
        Intent.ADD_TO_CART: [
            # "beli/pesan/tambah X ke keranjang"
            r"\b(beli|pesan|order|mau|tambah(?:kan|in)?|masuk(?:kan|in)?|add|buy|purchase|want)\b.*\b(keranjang|cart)\b",
            # "keranjang tambah X"
            r"\b(keranjang|cart)\b.*\b(tambah|masuk|add)\b",
            # "beli/pesan 2 berry blast" (with quantity or product name)
            r"\b(beli|pesan|order|mau beli|mau pesan)\s+\d*\s*(?:buah|porsi|pcs|x)?\s*\w+",
            # "tambah produk terlaris/termurah ke keranjang"
            r"\b(tambah|masuk)\w*\s+.*?(terlaris|termurah|termahal|bestseller|populer).*?(keranjang|cart)",
        ],
        Intent.REMOVE_FROM_CART: [
            r"\b(hapus|hilangkan|buang|remove|delete)\b.*\b(dari\s*)?(keranjang|cart)\b",
            r"\b(keranjang|cart)\b.*\b(hapus|remove)\b",
        ],
        Intent.CLEAR_CART: [
            r"\b(kosongkan|hapus\s*semua|clear|bersihkan)\s*(keranjang|cart|pesanan)?\b",
            r"\b(keranjang|cart)\b.*\b(kosong|clear|hapus\s*semua)\b",
        ],
        Intent.CHECKOUT: [
            r"\b(checkout|check\s*out|bayar|pembayaran|proses\s*pesanan|selesaikan|lanjut\s*bayar)\b",
        ],
        Intent.NAVIGATE: [
            r"\b(ke|buka|lihat|tampilkan|pergi|go\s*to|open|show|navigate)\s*(halaman\s*)?(beranda|home|menu|produk|cart|keranjang|checkout|about|tentang|chat)\b",
        ],
        Intent.SEARCH: [
            r"\b(cari|carikan|search|find|temukan)\s+(.+)",
        ],
        Intent.RECOMMENDATION: [
            r"\b(rekomendasi|rekomendasikan|sarankan|saran|suggest|recommend)\b",
            r"\b(apa\s+yang|what).*(enak|bagus|good|best|laris|populer|popular)",
            r"\b(mau|want|ingin)\s+(yang|something)\s+(enak|segar|sehat|murah|mahal)\b",
            r"(paling|yang)\s+(laris|populer|popular|bestseller|favorit|murah|mahal|sehat)",
            r"\b(terlaris|bestseller|termurah|termahal|terpopuler)\b",
            r"(laris|populer|popular|bestseller|favorit|favorite)",
        ],
        Intent.HEALTH_INQUIRY: [
            # Benefits/nutrition questions - expanded to catch more patterns
            r"\b(manfaat|khasiat|benefit|kebaikan|fungsi)\b",
            r"\b(vitamin|nutrisi|gizi|nutrition)\s+(apa|yang|untuk|dalam)?\b",
            r"\b(alergi|allergy|allergen)\b",
            r"\b(aman|safe)\s+(untuk|buat|bagi|gak|tidak)?",
            r"\b(tips|resep|recipe)\s*(sehat|jus|juice|diet|detox)?",
            r"(bagus|baik)\s+(untuk|buat|bagi)\s+(kesehatan|kulit|rambut|imun|metabolisme|tubuh|badan)",
            r"\b(sehat|healthy)\s+(untuk|buat|bagi|gak|tidak)",
            r"\b(kandungan|content|gizi dalam)\b",
        ],
    }
    
    # Keywords for intent classification
    INTENT_KEYWORDS = {
        Intent.ADD_TO_CART: {
            "id": ["beli", "pesan", "order", "mau", "tambah", "masukkan", "masukin", "tambahin"],
            "en": ["buy", "order", "purchase", "want", "add", "get"],
        },
        Intent.RECOMMENDATION: {
            "id": ["rekomendasi", "saran", "pilihan", "favorit", "terlaris", "bestseller", 
                   "best seller", "populer", "top", "terbaik", "enak", "murah", "termurah", 
                   "mahal", "termahal", "sehat", "segar", "rendah kalori", "rendah gula", 
                   "diet", "laris", "paling laku"],
            "en": ["recommend", "suggestion", "favorite", "bestseller", "best seller", 
                   "popular", "top", "best", "delicious", "cheap", "cheapest", "expensive", 
                   "healthy", "fresh", "low calorie", "low sugar", "diet"],
        },
        Intent.PRODUCT_INFO: {
            # Only keep product-specific keywords, NOT health/nutrition keywords
            "id": ["apa itu", "jelaskan", "info", "detail", "bahan", "kalori", "harga",
                   "berapa", "ukuran", "size", "gambar", "foto"],
            "en": ["what is", "explain", "info", "detail", "ingredient", "calorie",
                   "price", "how much", "size", "image", "photo"],
        },
        Intent.INQUIRY: {
            "id": ["jam buka", "lokasi", "alamat", "delivery", "pengiriman", "promo", "diskon",
                   "pembayaran", "metode bayar"],
            "en": ["opening hours", "location", "address", "delivery", "shipping", "promo", 
                   "discount", "payment", "payment method"],
        },
        Intent.HEALTH_INQUIRY: {
            "id": ["manfaat", "khasiat", "kebaikan", "fungsi", "vitamin", "mineral", "gizi",
                   "nutrisi", "alergi", "intoleransi", "aman untuk", "bahaya", "efek samping",
                   "tips sehat", "resep", "detox", "imun", "imunitas", "pencernaan", 
                   "metabolisme", "antioksidan", "stamina", "energi", "kulit", "rambut"],
            "en": ["benefit", "function", "vitamin", "mineral", "nutrition", "allergy",
                   "intolerance", "safe for", "danger", "side effect", "health tips", 
                   "recipe", "detox", "immune", "immunity", "digestion", "metabolism",
                   "antioxidant", "stamina", "energy", "skin", "hair"],
        },
    }
    
    # Product-related keywords that indicate order intent
    PRODUCT_CONTEXT_KEYWORDS = {
        "id": ["jus", "juice", "smoothie", "bowl", "acai", "berry", "mango", "tropical",
               "green", "detox", "protein", "vitamin"],
        "en": ["juice", "smoothie", "bowl", "acai", "berry", "mango", "tropical",
               "green", "detox", "protein", "vitamin"],
    }
    
    # Price/quantity indicators
    QUANTITY_PATTERNS = [
        r"\b(\d+)\s*(buah|pcs|gelas|cup|porsi)?\b",
        r"\b(satu|dua|tiga|empat|lima|one|two|three|four|five)\b",
    ]
    
    @property
    def name(self) -> str:
        return "IntentRouter"
    
    async def process(self, context: AgentContext) -> AgentResponse:
        """Detect intent from user input."""
        user_input = context.user_input.lower().strip()
        locale = context.locale
        
        # Layer 1: Exact pattern matching
        for intent, patterns in self.INTENT_PATTERNS.items():
            for pattern in patterns:
                if re.search(pattern, user_input, re.IGNORECASE):
                    return self._create_response(intent, context)
        
        # Layer 2: Keyword-based classification with context
        detected_intent = self._classify_by_keywords(user_input, locale, context)
        if detected_intent:
            return self._create_response(detected_intent, context)
        
        # Layer 3: Check for product mentions with action context
        if self._has_product_context(user_input, locale):
            if self._has_order_action(user_input, locale):
                return self._create_response(Intent.ADD_TO_CART, context)
            elif self._has_recommendation_context(user_input, locale):
                return self._create_response(Intent.RECOMMENDATION, context)
            else:
                return self._create_response(Intent.PRODUCT_INFO, context)
        
        # Default to inquiry for general questions
        return self._create_response(Intent.INQUIRY, context)
    
    def _classify_by_keywords(
        self, 
        user_input: str, 
        locale: str,
        context: AgentContext
    ) -> Optional[Intent]:
        """Classify intent based on keyword presence."""
        lang_key = "id" if locale == "id" else "en"
        
        # Check recommendation keywords first (higher priority for natural queries)
        rec_keywords = self.INTENT_KEYWORDS[Intent.RECOMMENDATION][lang_key]
        if any(kw in user_input for kw in rec_keywords):
            # Check if user also wants to add to cart
            order_keywords = self.INTENT_KEYWORDS[Intent.ADD_TO_CART][lang_key]
            if any(kw in user_input for kw in order_keywords):
                # "beli yang murah" -> wants to add cheapest to cart
                return Intent.ADD_TO_CART
            return Intent.RECOMMENDATION
        
        # Check order keywords
        order_keywords = self.INTENT_KEYWORDS[Intent.ADD_TO_CART][lang_key]
        if any(kw in user_input for kw in order_keywords):
            return Intent.ADD_TO_CART
        
        # Check health inquiry keywords (NEW)
        health_keywords = self.INTENT_KEYWORDS[Intent.HEALTH_INQUIRY][lang_key]
        if any(kw in user_input for kw in health_keywords):
            return Intent.HEALTH_INQUIRY
        
        # Check product info keywords
        info_keywords = self.INTENT_KEYWORDS[Intent.PRODUCT_INFO][lang_key]
        if any(kw in user_input for kw in info_keywords):
            return Intent.PRODUCT_INFO
        
        # Check inquiry keywords
        inquiry_keywords = self.INTENT_KEYWORDS[Intent.INQUIRY][lang_key]
        if any(kw in user_input for kw in inquiry_keywords):
            return Intent.INQUIRY
        
        return None
    
    def _has_product_context(self, user_input: str, locale: str) -> bool:
        """Check if input mentions product-related terms."""
        lang_key = "id" if locale == "id" else "en"
        keywords = self.PRODUCT_CONTEXT_KEYWORDS[lang_key]
        return any(kw in user_input for kw in keywords)
    
    def _has_order_action(self, user_input: str, locale: str) -> bool:
        """Check if input has order action words."""
        lang_key = "id" if locale == "id" else "en"
        keywords = self.INTENT_KEYWORDS[Intent.ADD_TO_CART][lang_key]
        return any(kw in user_input for kw in keywords)
    
    def _has_recommendation_context(self, user_input: str, locale: str) -> bool:
        """Check if input asks for recommendations."""
        lang_key = "id" if locale == "id" else "en"
        keywords = self.INTENT_KEYWORDS[Intent.RECOMMENDATION][lang_key]
        return any(kw in user_input for kw in keywords)
    
    def _create_response(self, intent: Intent, context: AgentContext) -> AgentResponse:
        """Create response with detected intent."""
        context.detected_intent = intent
        
        # Extract entities based on intent
        entities = self._extract_entities(context.user_input, intent, context.locale)
        context.extracted_entities = entities
        
        return AgentResponse(
            success=True,
            message=f"Detected intent: {intent.value}",
            intent=intent,
            data={"entities": entities},
        )
    
    def _extract_entities(self, user_input: str, intent: Intent, locale: str) -> dict:
        """Extract relevant entities from user input."""
        entities = {}
        user_lower = user_input.lower()
        
        # Extract quantity
        for pattern in self.QUANTITY_PATTERNS:
            match = re.search(pattern, user_lower)
            if match:
                qty_str = match.group(1)
                # Convert word numbers to digits
                word_to_num = {
                    "satu": 1, "dua": 2, "tiga": 3, "empat": 4, "lima": 5,
                    "one": 1, "two": 2, "three": 3, "four": 4, "five": 5,
                }
                entities["quantity"] = word_to_num.get(qty_str, int(qty_str) if qty_str.isdigit() else 1)
                break
        
        # Extract size preferences
        if any(s in user_lower for s in ["kecil", "small", "s"]):
            entities["size"] = "small"
        elif any(s in user_lower for s in ["besar", "large", "l"]):
            entities["size"] = "large"
        else:
            entities["size"] = "medium"
        
        # Extract price preference
        if any(p in user_lower for p in ["murah", "termurah", "cheap", "cheapest", "budget"]):
            entities["price_preference"] = "cheapest"
        elif any(p in user_lower for p in ["mahal", "termahal", "expensive", "premium"]):
            entities["price_preference"] = "most_expensive"
        
        # Extract category preference
        if any(c in user_lower for c in ["sehat", "healthy", "diet", "rendah kalori", "low calorie"]):
            entities["category_preference"] = "healthy"
        elif any(c in user_lower for c in ["terlaris", "bestseller", "best seller", "best-seller", 
                                            "populer", "popular", "favorit", "favorite", "laris",
                                            "paling laku", "top", "terbaik"]):
            entities["category_preference"] = "bestseller"
        elif any(c in user_lower for c in ["segar", "fresh", "dingin", "cold"]):
            entities["category_preference"] = "fresh"
        
        # Extract navigation destination
        if intent == Intent.NAVIGATE:
            nav_map = {
                "beranda": "/", "home": "/", "utama": "/",
                "menu": "/menu", "produk": "/menu", "products": "/menu",
                "keranjang": "/cart", "cart": "/cart",
                "checkout": "/checkout", "bayar": "/checkout",
                "tentang": "/about", "about": "/about",
                "chat": "/chat",
            }
            for key, dest in nav_map.items():
                if key in user_lower:
                    entities["destination"] = dest
                    break
        
        return entities

