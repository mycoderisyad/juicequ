"""
Navigation Agent - Handles page navigation requests.
"""
from .base import BaseAgent, AgentContext, AgentResponse, Intent


class NavigationAgent(BaseAgent):
    """Handles navigation requests to different pages."""
    
    # Navigation destination mapping
    DESTINATIONS = {
        # Indonesian
        "beranda": "/",
        "home": "/",
        "utama": "/",
        "menu": "/menu",
        "produk": "/menu",
        "daftar produk": "/menu",
        "daftar menu": "/menu",
        "keranjang": "/cart",
        "cart": "/cart",
        "checkout": "/checkout",
        "pembayaran": "/checkout",
        "bayar": "/checkout",
        "tentang": "/about",
        "about": "/about",
        "chat": "/chat",
        "ai chat": "/chat",
        "asisten": "/chat",
        # English
        "products": "/menu",
        "shopping cart": "/cart",
        "payment": "/checkout",
        "about us": "/about",
        "assistant": "/chat",
    }
    
    @property
    def name(self) -> str:
        return "NavigationAgent"
    
    async def process(self, context: AgentContext) -> AgentResponse:
        """Process navigation request."""
        entities = context.extracted_entities
        user_input = context.user_input.lower()
        
        # Get destination from entities or parse from input
        destination = entities.get("destination")
        
        if not destination:
            # Try to find destination from input
            for key, dest in self.DESTINATIONS.items():
                if key in user_input:
                    destination = dest
                    break
        
        if not destination:
            return AgentResponse(
                success=False,
                message=self._get_locale_text(
                    context,
                    "Mau ke halaman mana? (beranda, menu, keranjang, checkout, tentang, chat)",
                    "Which page would you like to go to? (home, menu, cart, checkout, about, chat)"
                ),
                intent=Intent.NAVIGATE,
            )
        
        # Get destination name for message
        dest_names = {
            "/": ("Beranda", "Home"),
            "/menu": ("Menu Produk", "Product Menu"),
            "/cart": ("Keranjang", "Cart"),
            "/checkout": ("Checkout", "Checkout"),
            "/about": ("Tentang Kami", "About Us"),
            "/chat": ("AI Chat", "AI Chat"),
        }
        
        dest_name = dest_names.get(destination, ("", ""))
        name = dest_name[0] if context.locale == "id" else dest_name[1]
        
        return AgentResponse(
            success=True,
            message=self._get_locale_text(
                context,
                f"Mengarahkan ke {name}...",
                f"Navigating to {name}..."
            ),
            intent=Intent.NAVIGATE,
            destination=destination,
            should_navigate=True,
        )

