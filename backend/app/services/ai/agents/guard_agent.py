"""
Guard Agent - Filters off-topic requests and ensures domain focus.
Rejects questions unrelated to the juice store.
"""
import re
from .base import BaseAgent, AgentContext, AgentResponse, Intent


class GuardAgent(BaseAgent):
    """
    Guards against off-topic requests.
    Ensures AI only responds to juice store related queries.
    Now also allows health/nutrition questions related to juice benefits.
    """
    
    # Off-topic patterns that should be rejected
    OFF_TOPIC_PATTERNS = [
        # Programming/Technical
        r"\b(python|javascript|java|coding|programming|code|debug|error|bug|function|class|variable|loop|array|database|sql|api|html|css|react|vue|angular)\b",
        r"\b(compile|runtime|syntax|algorithm|data structure|framework|library|npm|pip|git|github)\b",
        
        # Academic subjects (not health related)
        r"\b(matematika|math|fisika|physics|kimia|chemistry|sejarah|history|geografi|geography)\b",
        r"\b(rumus|formula|teori|theory|hitung|calculate|soal|problem|ujian|exam|tugas|homework|pr|assignment)\b",
        
        # Unrelated topics
        r"\b(politik|political|agama|religion|sara|gambling|judi|porn|xxx|hack|crack|cheat)\b",
        r"\b(cuaca|weather|berita|news|gosip|gossip|selebriti|celebrity)\b",
        
        # General knowledge that's not store-related
        r"\b(siapa presiden|who is president|capital of|ibukota|negara mana|which country)\b",
        r"\b(translate|terjemahkan|artinya apa|meaning of)\b",
    ]
    
    # Store-related keywords that indicate valid queries
    STORE_KEYWORDS = [
        # Products
        "jus", "juice", "smoothie", "bowl", "acai", "berry", "mango", "tropical",
        "buah", "fruit", "minuman", "drink", "sehat", "healthy", "segar", "fresh",
        
        # Store operations
        "beli", "buy", "pesan", "order", "harga", "price", "menu", "produk", "product",
        "keranjang", "cart", "checkout", "bayar", "payment", "delivery", "pengiriman",
        
        # Store info
        "juicequ", "toko", "store", "jam buka", "opening", "lokasi", "location",
        "promo", "diskon", "discount", "member", "poin", "point",
        
        # AI assistant
        "rekomendasi", "recommend", "saran", "suggest", "favorit", "favorite",
        "terlaris", "bestseller", "populer", "popular",
    ]
    
    # Health/wellness keywords - ALLOWED topics (related to juice/fruits)
    HEALTH_KEYWORDS = [
        # Nutrition
        "nutrisi", "nutrition", "gizi", "vitamin", "mineral", "protein",
        "karbohidrat", "carbohydrate", "serat", "fiber", "lemak", "fat",
        "kalori", "calorie", "kkal", "kcal",
        
        # Health benefits
        "khasiat", "manfaat", "benefit", "kebaikan", "fungsi",
        "antioksidan", "antioxidant", "imun", "immune", "imunitas", "immunity",
        "detox", "detoksifikasi", "cleanse",
        
        # Conditions & wellness
        "diet", "sehat", "healthy", "kesehatan", "health", "wellness",
        "stamina", "energi", "energy", "lelah", "tired", "capek",
        "pencernaan", "digestion", "metabolisme", "metabolism",
        "kulit", "skin", "rambut", "hair", "kecantikan", "beauty",
        
        # Allergies & warnings
        "alergi", "allergy", "allergen", "intoleransi", "intolerance",
        "aman", "safe", "bahaya", "danger", "peringatan", "warning",
        "diabetes", "gula darah", "blood sugar", "kolesterol", "cholesterol",
        
        # Tips & recipes
        "tips", "resep", "recipe", "cara buat", "how to make", "cara membuat",
        "kombinasi", "combination", "campuran", "mix",
    ]
    
    # Greetings are always allowed
    GREETING_PATTERNS = [
        r"^(halo|hai|hi|hello|hey|selamat\s+(pagi|siang|sore|malam)|good\s+(morning|afternoon|evening))[\s!?.]*$",
        r"^(apa kabar|how are you|gimana|what's up)[\s!?.]*$",
        r"^(terima kasih|thanks|thank you|makasih)[\s!?.]*$",
    ]
    
    @property
    def name(self) -> str:
        return "GuardAgent"
    
    async def process(self, context: AgentContext) -> AgentResponse:
        """Check if query is within domain scope."""
        user_input = context.user_input.lower().strip()
        
        # Always allow greetings
        for pattern in self.GREETING_PATTERNS:
            if re.search(pattern, user_input, re.IGNORECASE):
                return AgentResponse(
                    success=True,
                    message="",
                    intent=Intent.GREETING,
                    data={"allowed": True, "reason": "greeting"},
                )
        
        # Check if query contains store-related keywords
        has_store_context = any(kw in user_input for kw in self.STORE_KEYWORDS)
        
        # Check if query contains health-related keywords
        has_health_context = any(kw in user_input for kw in self.HEALTH_KEYWORDS)
        
        # Check for off-topic patterns
        for pattern in self.OFF_TOPIC_PATTERNS:
            if re.search(pattern, user_input, re.IGNORECASE):
                # If it also has store or health context, allow it
                if has_store_context or has_health_context:
                    intent = Intent.HEALTH_INQUIRY if has_health_context else Intent.INQUIRY
                    return AgentResponse(
                        success=True,
                        message="",
                        intent=intent,
                        data={"allowed": True, "reason": "has_valid_context"},
                    )
                
                # Reject off-topic query
                return AgentResponse(
                    success=False,
                    message=self._get_rejection_message(context),
                    intent=Intent.OFF_TOPIC,
                    data={"allowed": False, "reason": "off_topic"},
                )
        
        # Allow if has health context - route to health inquiry
        if has_health_context:
            return AgentResponse(
                success=True,
                message="",
                intent=Intent.HEALTH_INQUIRY,
                data={"allowed": True, "reason": "health_topic"},
            )
        
        # Allow if has store context or is a general inquiry
        return AgentResponse(
            success=True,
            message="",
            intent=context.detected_intent or Intent.INQUIRY,
            data={"allowed": True, "reason": "allowed"},
        )
    
    def _get_rejection_message(self, context: AgentContext) -> str:
        """Get polite rejection message."""
        if context.locale == "id":
            return (
                "Maaf, saya adalah asisten JuiceQu dan hanya bisa membantu tentang:\n"
                "🍹 Produk jus, smoothie, dan bowl\n"
                "🥗 Nutrisi dan manfaat buah/sayur\n"
                "💪 Tips kesehatan terkait jus\n"
                "🛒 Pemesanan produk\n\n"
                "Ada yang bisa saya bantu tentang topik di atas?"
            )
        else:
            return (
                "Sorry, I'm JuiceQu's assistant and can only help with:\n"
                "🍹 Juice, smoothie, and bowl products\n"
                "🥗 Nutrition and fruit/vegetable benefits\n"
                "💪 Health tips related to juice\n"
                "🛒 Product ordering\n\n"
                "Can I help you with any of these topics?"
            )

