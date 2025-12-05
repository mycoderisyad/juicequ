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
    """
    
    # Off-topic patterns that should be rejected
    OFF_TOPIC_PATTERNS = [
        # Programming/Technical
        r"\b(python|javascript|java|coding|programming|code|debug|error|bug|function|class|variable|loop|array|database|sql|api|html|css|react|vue|angular)\b",
        r"\b(compile|runtime|syntax|algorithm|data structure|framework|library|npm|pip|git|github)\b",
        
        # Academic subjects
        r"\b(matematika|math|fisika|physics|kimia|chemistry|biologi|biology|sejarah|history|geografi|geography)\b",
        r"\b(rumus|formula|teori|theory|hitung|calculate|soal|problem|ujian|exam|tugas|homework|pr|assignment)\b",
        
        # Unrelated topics
        r"\b(politik|political|agama|religion|sara|gambling|judi|porn|xxx|hack|crack|cheat)\b",
        r"\b(cuaca|weather|berita|news|gosip|gossip|selebriti|celebrity)\b",
        
        # General knowledge that's not store-related
        r"\b(siapa presiden|who is president|capital of|ibukota|negara mana|which country)\b",
        r"\b(translate|terjemahkan|artinya|meaning of)\b",
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
        
        # Check for off-topic patterns
        for pattern in self.OFF_TOPIC_PATTERNS:
            if re.search(pattern, user_input, re.IGNORECASE):
                # If it also has store context, allow it (e.g., "harga berry blast berapa")
                if has_store_context:
                    return AgentResponse(
                        success=True,
                        message="",
                        intent=Intent.INQUIRY,
                        data={"allowed": True, "reason": "has_store_context"},
                    )
                
                # Reject off-topic query
                return AgentResponse(
                    success=False,
                    message=self._get_rejection_message(context),
                    intent=Intent.OFF_TOPIC,
                    data={"allowed": False, "reason": "off_topic"},
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
                "Maaf, saya adalah asisten JuiceQu yang hanya bisa membantu "
                "hal-hal terkait produk jus dan layanan toko kami. "
                "Ada yang bisa saya bantu tentang menu atau pesanan Anda?"
            )
        else:
            return (
                "Sorry, I'm JuiceQu's assistant and can only help with "
                "matters related to our juice products and store services. "
                "Is there anything I can help you with about our menu or your order?"
            )

