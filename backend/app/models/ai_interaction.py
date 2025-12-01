"""
AI Interaction model for tracking chatbot and voice interactions.
Used for analytics and improving AI recommendations.
"""
import enum
from datetime import datetime
from typing import TYPE_CHECKING
from uuid import uuid4

from sqlalchemy import DateTime, Enum, Float, ForeignKey, Integer, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.database import Base

if TYPE_CHECKING:
    from app.models.user import User


class InteractionType(str, enum.Enum):
    """Types of AI interactions."""
    CHAT = "chat"               # Text chat with AI
    VOICE = "voice"             # Voice ordering
    RECOMMENDATION = "recommendation"  # AI recommendation request


class InteractionStatus(str, enum.Enum):
    """Status of AI interaction."""
    ACTIVE = "active"           # Ongoing conversation
    COMPLETED = "completed"     # Successfully completed
    ABANDONED = "abandoned"     # User left without completing
    ERROR = "error"             # Error occurred


class AIInteraction(Base):
    """Track AI chatbot and voice interactions."""
    
    __tablename__ = "ai_interactions"
    
    id: Mapped[str] = mapped_column(
        String(36),
        primary_key=True,
        default=lambda: str(uuid4()),
    )
    
    # Session identifier (for grouping related interactions)
    session_id: Mapped[str] = mapped_column(
        String(100),
        nullable=False,
        index=True,
    )
    
    # User relationship (nullable for guest interactions)
    user_id: Mapped[str | None] = mapped_column(
        String(36),
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
    )
    
    # Interaction type
    interaction_type: Mapped[InteractionType] = mapped_column(
        Enum(InteractionType),
        default=InteractionType.CHAT,
        nullable=False,
    )
    
    # Status
    status: Mapped[InteractionStatus] = mapped_column(
        Enum(InteractionStatus),
        default=InteractionStatus.ACTIVE,
        nullable=False,
    )
    
    # User input
    user_input: Mapped[str] = mapped_column(
        Text,
        nullable=False,
    )
    user_input_type: Mapped[str] = mapped_column(
        String(20),  # "text" or "audio"
        default="text",
        nullable=False,
    )
    
    # AI response
    ai_response: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )
    
    # AI model info
    model_used: Mapped[str | None] = mapped_column(
        String(50),  # e.g., "qwen-3-30b", "llama-4-maverick"
        nullable=True,
    )
    
    # Context used (for RAG)
    context_used: Mapped[str | None] = mapped_column(
        Text,  # JSON array of retrieved context chunks
        nullable=True,
    )
    
    # Intent detection
    detected_intent: Mapped[str | None] = mapped_column(
        String(50),  # e.g., "order", "inquiry", "recommendation", "complaint"
        nullable=True,
    )
    confidence_score: Mapped[float | None] = mapped_column(
        Float,
        nullable=True,
    )
    
    # Extracted entities
    extracted_entities: Mapped[str | None] = mapped_column(
        Text,  # JSON: {"products": [...], "quantities": [...], "preferences": [...]}
        nullable=True,
    )
    
    # Order reference (if interaction resulted in order)
    order_id: Mapped[str | None] = mapped_column(
        String(36),
        nullable=True,
    )
    
    # Performance metrics
    response_time_ms: Mapped[int | None] = mapped_column(
        Integer,  # Time to generate response in milliseconds
        nullable=True,
    )
    tokens_used: Mapped[int | None] = mapped_column(
        Integer,
        nullable=True,
    )
    
    # User feedback
    user_rating: Mapped[int | None] = mapped_column(
        Integer,  # 1-5 rating
        nullable=True,
    )
    user_feedback: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )
    
    # Timestamps
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )
    completed_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )
    
    # Relationships
    user: Mapped["User | None"] = relationship(
        "User",
        back_populates="ai_interactions",
    )
    
    def __repr__(self) -> str:
        return f"<AIInteraction {self.session_id} ({self.interaction_type.value})>"
    
    def mark_completed(self) -> None:
        """Mark interaction as completed."""
        self.status = InteractionStatus.COMPLETED
        self.completed_at = datetime.utcnow()
    
    def mark_error(self, error_message: str | None = None) -> None:
        """Mark interaction as error."""
        self.status = InteractionStatus.ERROR
        if error_message:
            self.ai_response = f"Error: {error_message}"
