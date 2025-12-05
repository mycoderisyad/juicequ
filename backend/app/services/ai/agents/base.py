"""
Base Agent class and shared types for Multi-Agent system.
"""
from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from enum import Enum
from typing import Any, Optional

from sqlalchemy.orm import Session


class Intent(str, Enum):
    """Detected user intent types."""
    ORDER = "order"
    ADD_TO_CART = "add_to_cart"
    REMOVE_FROM_CART = "remove_from_cart"
    CLEAR_CART = "clear_cart"
    NAVIGATE = "navigate"
    SEARCH = "search"
    RECOMMENDATION = "recommendation"
    PRODUCT_INFO = "product_info"
    CHECKOUT = "checkout"
    INQUIRY = "inquiry"
    GREETING = "greeting"
    OFF_TOPIC = "off_topic"
    UNKNOWN = "unknown"


@dataclass
class AgentContext:
    """Context passed between agents."""
    user_input: str
    locale: str = "id"
    user_id: Optional[str] = None
    session_id: Optional[str] = None
    cart_items: list[dict] = field(default_factory=list)
    conversation_history: list[dict] = field(default_factory=list)
    detected_intent: Optional[Intent] = None
    extracted_entities: dict = field(default_factory=dict)
    metadata: dict = field(default_factory=dict)


@dataclass
class AgentResponse:
    """Response from an agent."""
    success: bool
    message: str
    intent: Intent
    data: dict = field(default_factory=dict)
    
    # For order operations
    order_items: list[dict] = field(default_factory=list)
    
    # For navigation
    destination: Optional[str] = None
    
    # For product recommendations
    featured_products: list[dict] = field(default_factory=list)
    
    # For search
    search_query: Optional[str] = None
    sort_by: Optional[str] = None
    filter_category: Optional[str] = None
    
    # Additional context
    should_add_to_cart: bool = False
    should_navigate: bool = False


class BaseAgent(ABC):
    """Abstract base class for all agents."""
    
    def __init__(self, db: Session):
        self.db = db
    
    @property
    @abstractmethod
    def name(self) -> str:
        """Agent name for logging and debugging."""
        pass
    
    @abstractmethod
    async def process(self, context: AgentContext) -> AgentResponse:
        """
        Process user input and return response.
        
        Args:
            context: Current conversation context
            
        Returns:
            AgentResponse with results
        """
        pass
    
    def _get_locale_text(self, context: AgentContext, id_text: str, en_text: str) -> str:
        """Helper to return localized text."""
        return id_text if context.locale == "id" else en_text

