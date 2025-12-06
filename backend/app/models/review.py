"""
Review model for product reviews.
"""
from datetime import datetime
from uuid import uuid4

from sqlalchemy import (
    Boolean,
    DateTime,
    ForeignKey,
    Integer,
    String,
    Text,
    func,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.database import Base

class Review(Base):
    """Product review model."""
    
    __tablename__ = "reviews"
    
    id: Mapped[str] = mapped_column(
        String(36),
        primary_key=True,
        default=lambda: str(uuid4()),
    )
    
    user_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
    )
    
    product_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("products.id", ondelete="CASCADE"),
        nullable=False,
    )
    
    rating: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
        comment="Rating from 1 to 5",
    )
    
    comment: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )
    
    image_url: Mapped[str | None] = mapped_column(
        String(500),
        nullable=True,
        comment="URL of uploaded review photo",
    )
    
    is_ai_generated: Mapped[bool] = mapped_column(
        Boolean,
        default=False,
        nullable=False,
        comment="Whether the photo was generated/enhanced by AI",
    )
    
    is_verified_purchase: Mapped[bool] = mapped_column(
        Boolean,
        default=False,
        nullable=False,
    )
    
    # Timestamps
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )
    
    # Relationships
    user: Mapped["User"] = relationship("User", backref="reviews")
    product: Mapped["Product"] = relationship("Product", backref="reviews")

    def __repr__(self) -> str:
        return f"<Review {self.id} (Product: {self.product_id}, Rating: {self.rating})>"
