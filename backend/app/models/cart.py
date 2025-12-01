"""
Cart and CartItem models for shopping cart functionality.
"""
from datetime import datetime
from typing import TYPE_CHECKING
from uuid import uuid4

from sqlalchemy import DateTime, Float, ForeignKey, Integer, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.database import Base

if TYPE_CHECKING:
    from app.models.user import User
    from app.models.product import Product


class Cart(Base):
    """Shopping cart for users."""
    
    __tablename__ = "carts"
    
    id: Mapped[str] = mapped_column(
        String(36),
        primary_key=True,
        default=lambda: str(uuid4()),
    )
    
    # User relationship (one cart per user)
    user_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("users.id", ondelete="CASCADE"),
        unique=True,
        nullable=False,
    )
    
    # Session ID for guest carts (future implementation)
    session_id: Mapped[str | None] = mapped_column(
        String(100),
        nullable=True,
        index=True,
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
    user: Mapped["User"] = relationship(
        "User",
        back_populates="cart",
    )
    items: Mapped[list["CartItem"]] = relationship(
        "CartItem",
        back_populates="cart",
        cascade="all, delete-orphan",
    )
    
    def __repr__(self) -> str:
        return f"<Cart user={self.user_id} items={len(self.items)}>"
    
    @property
    def total_items(self) -> int:
        """Get total number of items in cart."""
        return sum(item.quantity for item in self.items)
    
    @property
    def subtotal(self) -> float:
        """Calculate cart subtotal."""
        return sum(item.subtotal for item in self.items)
    
    def clear(self) -> None:
        """Remove all items from cart."""
        self.items.clear()


class CartItem(Base):
    """Individual items in a shopping cart."""
    
    __tablename__ = "cart_items"
    
    id: Mapped[str] = mapped_column(
        String(36),
        primary_key=True,
        default=lambda: str(uuid4()),
    )
    
    # Cart relationship
    cart_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("carts.id", ondelete="CASCADE"),
        nullable=False,
    )
    
    # Product relationship
    product_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("products.id", ondelete="CASCADE"),
        nullable=False,
    )
    
    # Item details
    size: Mapped[str] = mapped_column(
        String(20),
        default="medium",
        nullable=False,
    )
    quantity: Mapped[int] = mapped_column(
        Integer,
        default=1,
        nullable=False,
    )
    unit_price: Mapped[float] = mapped_column(
        Float,
        nullable=False,
    )
    
    # Customizations (stored as JSON string)
    customizations: Mapped[str | None] = mapped_column(
        Text,  # JSON: {"ice_level": "normal", "sweetness": "normal", "add_ons": ["chia"]}
        nullable=True,
    )
    notes: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
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
    cart: Mapped["Cart"] = relationship(
        "Cart",
        back_populates="items",
    )
    product: Mapped["Product"] = relationship(
        "Product",
        back_populates="cart_items",
    )
    
    def __repr__(self) -> str:
        return f"<CartItem product={self.product_id} qty={self.quantity}>"
    
    @property
    def subtotal(self) -> float:
        """Calculate item subtotal."""
        return self.unit_price * self.quantity
    
    def update_price_from_product(self) -> None:
        """Update unit price from product based on size."""
        from app.models.product import ProductSize
        
        if self.product:
            try:
                size = ProductSize(self.size)
            except ValueError:
                size = ProductSize.MEDIUM
            self.unit_price = self.product.get_price(size)
