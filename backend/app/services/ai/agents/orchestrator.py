"""
Agent Orchestrator - Coordinates multi-agent system.
Routes requests to appropriate agents and combines responses.
"""
import logging
from typing import Any, Optional

from sqlalchemy.orm import Session

from .base import AgentContext, AgentResponse, Intent
from .router import IntentRouterAgent
from .product_agent import ProductAgent
from .order_agent import OrderAgent
from .navigation_agent import NavigationAgent
from .guard_agent import GuardAgent
from .conversational_agent import ConversationalAgent
from .voice_agent import VoiceAgent

logger = logging.getLogger(__name__)


class AgentOrchestrator:
    """
    Orchestrates the multi-agent system.
    
    Flow:
    1. GuardAgent checks if query is in-scope
    2. IntentRouterAgent detects intent
    3. Appropriate specialist agent handles the request
    4. Response is formatted and returned
    """
    
    def __init__(self, db: Session):
        self.db = db
        self.guard = GuardAgent(db)
        self.router = IntentRouterAgent(db)
        self.product_agent = ProductAgent(db)
        self.order_agent = OrderAgent(db)
        self.navigation_agent = NavigationAgent(db)
        self.conversational_agent = ConversationalAgent(db)
        self.voice_agent = VoiceAgent(db)
    
    async def process(
        self,
        user_input: str,
        locale: str = "id",
        user_id: Optional[str] = None,
        session_id: Optional[str] = None,
        cart_items: Optional[list[dict]] = None,
        conversation_history: Optional[list[dict]] = None,
        is_voice_command: bool = False,
    ) -> dict[str, Any]:
        """
        Process user input through the multi-agent system.
        
        Args:
            user_input: User's message
            locale: Language locale (id/en)
            user_id: Optional user ID
            session_id: Session ID for conversation context
            cart_items: Current cart items
            conversation_history: Previous conversation messages
            is_voice_command: If True, use VoiceAgent for action-oriented response
            
        Returns:
            Response dictionary with message, intent, order_data, etc.
        """
        # Create context
        context = AgentContext(
            user_input=user_input,
            locale=locale,
            user_id=user_id,
            session_id=session_id,
            cart_items=cart_items or [],
            conversation_history=conversation_history or [],
        )
        
        
        try:
            # VOICE COMMANDS: Use VoiceAgent for action-oriented response
            # This bypasses normal flow and goes directly to LLM for smart parsing
            if is_voice_command:
                logger.info("[Orchestrator] Processing as voice command with VoiceAgent")
                response = await self.voice_agent.process(context)
                return self._format_response(response, context)
            
            # Step 1: Guard check
            guard_response = await self.guard.process(context)
            
            if guard_response.intent == Intent.OFF_TOPIC:
                return self._format_response(guard_response, context)
            
            if guard_response.intent == Intent.GREETING:
                return self._handle_greeting(context)
            
            # If guard detected health topic, route directly to conversational agent
            if guard_response.intent == Intent.HEALTH_INQUIRY:
                context.detected_intent = Intent.HEALTH_INQUIRY
                response = await self.conversational_agent.process(context)
                return self._format_response(response, context)
            
            # Step 2: Route to detect intent
            router_response = await self.router.process(context)
            intent = router_response.intent
            context.detected_intent = intent
            context.extracted_entities = router_response.data.get("entities", {})
            
            logger.info(f"[Orchestrator] Detected intent: {intent.value}, entities: {context.extracted_entities}")
            
            # Step 3: Route to specialist agent
            response = await self._route_to_agent(intent, context)
            
            return self._format_response(response, context)
            
        except Exception as e:
            logger.error(f"[Orchestrator] Error processing request: {e}")
            return {
                "success": False,
                "response": self._get_error_message(locale),
                "intent": "error",
                "order_data": None,
                "featured_products": None,
            }
    
    async def _route_to_agent(self, intent: Intent, context: AgentContext) -> AgentResponse:
        """Route request to appropriate specialist agent."""
        
        # Order-related intents - need ProductAgent for database operations
        if intent in [Intent.ADD_TO_CART, Intent.REMOVE_FROM_CART, Intent.CLEAR_CART, Intent.CHECKOUT]:
            return await self.order_agent.process(context)
        
        # Search intent - use ProductAgent for database search
        if intent == Intent.SEARCH:
            return await self.product_agent.process(context)
        
        # Navigation intent
        if intent == Intent.NAVIGATE:
            return await self.navigation_agent.process(context)
        
        # ALL conversational queries go to LLM for natural responses:
        # - RECOMMENDATION: "juice yang cocok untuk stamina"
        # - PRODUCT_INFO: "manfaat jus avocado"
        # - HEALTH_INQUIRY: "vitamin untuk imun"
        # - INQUIRY: "jam buka toko"
        # - Unknown intents
        #
        # The LLM has product context injected and will give natural responses
        return await self.conversational_agent.process(context)
    
    def _handle_greeting(self, context: AgentContext) -> dict[str, Any]:
        """Handle greeting messages."""
        if context.locale == "id":
            message = (
                "Halo! Selamat datang di JuiceQu! "
                "Saya bisa membantu Anda:\n"
                "- Mencari dan memesan produk\n"
                "- Memberikan rekomendasi (coba bilang 'produk terlaris' atau 'yang murah')\n"
                "- Navigasi ke halaman tertentu\n\n"
                "Ada yang bisa saya bantu hari ini?"
            )
        else:
            message = (
                "Hello! Welcome to JuiceQu! "
                "I can help you:\n"
                "- Find and order products\n"
                "- Give recommendations (try saying 'bestsellers' or 'cheapest')\n"
                "- Navigate to specific pages\n\n"
                "How can I help you today?"
            )
        
        return {
            "success": True,
            "response": message,
            "intent": "greeting",
            "order_data": None,
            "featured_products": None,
            "show_checkout": False,
        }
    
    def _handle_general_inquiry(self, context: AgentContext) -> AgentResponse:
        """Handle general store inquiries."""
        user_lower = context.user_input.lower()
        
        # Opening hours
        if any(kw in user_lower for kw in ["jam buka", "opening", "buka jam", "tutup jam"]):
            message = (
                "JuiceQu buka setiap hari pukul 08:00 - 22:00 WIB."
                if context.locale == "id" else
                "JuiceQu is open daily from 08:00 AM - 10:00 PM."
            )
        # Location
        elif any(kw in user_lower for kw in ["lokasi", "location", "alamat", "address", "dimana", "where"]):
            message = (
                "JuiceQu berlokasi di Jl. Sudirman No. 123, Jakarta Pusat. "
                "Kami juga melayani delivery ke seluruh Jakarta!"
                if context.locale == "id" else
                "JuiceQu is located at Jl. Sudirman No. 123, Central Jakarta. "
                "We also deliver throughout Jakarta!"
            )
        # Delivery
        elif any(kw in user_lower for kw in ["delivery", "pengiriman", "antar", "kirim"]):
            message = (
                "Kami melayani delivery ke seluruh Jakarta dengan ongkir mulai Rp 10.000. "
                "Pesanan di atas Rp 100.000 gratis ongkir!"
                if context.locale == "id" else
                "We deliver throughout Jakarta starting from Rp 10,000. "
                "Free delivery for orders above Rp 100,000!"
            )
        # Payment
        elif any(kw in user_lower for kw in ["bayar", "payment", "pembayaran", "metode"]):
            message = (
                "Kami menerima pembayaran via GoPay, OVO, DANA, transfer bank (BCA, Mandiri), "
                "dan kartu kredit/debit (Visa, Mastercard)."
                if context.locale == "id" else
                "We accept payment via GoPay, OVO, DANA, bank transfer (BCA, Mandiri), "
                "and credit/debit cards (Visa, Mastercard)."
            )
        # Default
        else:
            message = (
                "Ada yang bisa saya bantu tentang produk atau pesanan Anda? "
                "Coba bilang 'rekomendasi' untuk melihat produk terlaris!"
                if context.locale == "id" else
                "Can I help you with products or your order? "
                "Try saying 'recommendations' to see our bestsellers!"
            )
        
        return AgentResponse(
            success=True,
            message=message,
            intent=Intent.INQUIRY,
        )
    
    def _format_response(self, response: AgentResponse, context: AgentContext) -> dict[str, Any]:
        """Format agent response for API."""
        result = {
            "success": response.success,
            "response": response.message,
            "intent": response.intent.value,
            "order_data": None,
            "featured_products": None,
            "show_checkout": False,
            "destination": response.destination,
            "should_navigate": response.should_navigate,
            "search_query": response.search_query,
            "sort_by": response.sort_by,
        }
        
        # Add order data if present
        if response.order_items:
            subtotal = sum(item["total_price"] for item in response.order_items)
            tax = subtotal * 0.1
            result["order_data"] = {
                "items": response.order_items,
                "subtotal": subtotal,
                "tax": tax,
                "total": subtotal + tax,
                "notes": None,
            }
            result["show_checkout"] = True
        
        # Add featured products if present
        if response.featured_products:
            result["featured_products"] = response.featured_products
        
        return result
    
    def _get_error_message(self, locale: str) -> str:
        """Get error message."""
        if locale == "id":
            return "Maaf, terjadi kesalahan. Silakan coba lagi."
        return "Sorry, an error occurred. Please try again."

