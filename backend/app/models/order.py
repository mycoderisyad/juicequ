"""
Order and OrderItem models for order management.
"""
import enum
from datetime import datetime
from typing import TYPE_CHECKING
from uuid import uuid4

from sqlalchemy import (
    DateTime,
    Enum,
    Float,
    ForeignKey,
    Integer,
    String,
    Text,
    func,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.database import Base

if TYPE_CHECKING:
    from app.models.user import User
    from app.models.product import Product


class OrderStatus(str, enum.Enum):
    """Order status workflow."""
    PENDING = "pending"           # Order created, awaiting payment
    PAID = "paid"                 # Payment confirmed
    PREPARING = "preparing"       # Kasir is preparing
    READY = "ready"               # Ready for pickup
    COMPLETED = "completed"       # Picked up by customer
    CANCELLED = "cancelled"       # Order cancelled


class PaymentMethod(str, enum.Enum):
    """Available payment methods."""
    CASH = "cash"
    QRIS = "qris"
    TRANSFER = "transfer"


class Order(Base):
    """Order model for tracking customer orders."""
    
    __tablename__ = "orders"
    
    id: Mapped[str] = mapped_column(
        String(36),
        primary_key=True,
        default=lambda: str(uuid4()),
    )
    
    # Order number for display (human readable)
    order_number: Mapped[str] = mapped_column(
        String(20),
        unique=True,
        nullable=False,
        index=True,
    )
    
    # User relationship (nullable for guest orders)
    user_id: Mapped[str | None] = mapped_column(
        String(36),
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
    )
    
    # Guest info (for non-logged in orders)
    guest_name: Mapped[str | None] = mapped_column(
        String(100),
        nullable=True,
    )
    guest_phone: Mapped[str | None] = mapped_column(
        String(20),
        nullable=True,
    )
    
    # Order details
    status: Mapped[OrderStatus] = mapped_column(
        Enum(OrderStatus),
        default=OrderStatus.PENDING,
        nullable=False,
        index=True,
    )
    
    # Pricing
    subtotal: Mapped[float] = mapped_column(
        Float,
        nullable=False,
    )
    discount: Mapped[float] = mapped_column(
        Float,
        default=0.0,
        nullable=False,
    )
    tax: Mapped[float] = mapped_column(
        Float,
        default=0.0,
        nullable=False,
    )
    total: Mapped[float] = mapped_column(
        Float,
        nullable=False,
    )
    
    # Payment
    payment_method: Mapped[PaymentMethod | None] = mapped_column(
        Enum(PaymentMethod),
        nullable=True,
    )
    payment_reference: Mapped[str | None] = mapped_column(
        String(100),
        nullable=True,
    )
    paid_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )
    
    # Notes
    customer_notes: Mapped[str | None] = mapped_column(
        Text,  # Special requests from customer
        nullable=True,
    )
    internal_notes: Mapped[str | None] = mapped_column(
        Text,  # Notes from kasir/admin
        nullable=True,
    )
    
    # AI interaction reference
    ai_session_id: Mapped[str | None] = mapped_column(
        String(100),  # Reference to AI chat session that created this order
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
    completed_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )
    
    # Relationships
    user: Mapped["User | None"] = relationship(
        "User",
        back_populates="orders",
    )
    items: Mapped[list["OrderItem"]] = relationship(
        "OrderItem",
        back_populates="order",
        cascade="all, delete-orphan",
    )
    
    def __repr__(self) -> str:
        return f"<Order {self.order_number} ({self.status.value})>"
    
    def calculate_total(self) -> float:
        """Calculate order total from items."""
        self.subtotal = sum(item.subtotal for item in self.items)
        self.total = self.subtotal - self.discount + self.tax
        return self.total
    
    def can_cancel(self) -> bool:
        """Check if order can be cancelled."""
        return self.status in (OrderStatus.PENDING, OrderStatus.PAID)


class OrderItem(Base):
    """Individual items in an order."""
    
    __tablename__ = "order_items"
    
    id: Mapped[str] = mapped_column(
        String(36),
        primary_key=True,
        default=lambda: str(uuid4()),
    )
    
    # Relationships
    order_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("orders.id", ondelete="CASCADE"),
        nullable=False,
    )
    product_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("products.id", ondelete="CASCADE"),
        nullable=False,
    )
    
    # Item details (snapshot at time of order)
    product_name: Mapped[str] = mapped_column(
        String(100),
        nullable=False,
    )
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
    subtotal: Mapped[float] = mapped_column(
        Float,
        nullable=False,
    )
    
    # Customizations
    customizations: Mapped[str | None] = mapped_column(
        Text,  # JSON for ice level, sweetness, add-ons
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
    
    # Relationships
    order: Mapped["Order"] = relationship(
        "Order",
        back_populates="items",
    )
    product: Mapped["Product"] = relationship(
        "Product",
        back_populates="order_items",
    )
    
    def __repr__(self) -> str:
        return f"<OrderItem {self.product_name} x{self.quantity}>"
    
    def calculate_subtotal(self) -> float:
        """Calculate item subtotal."""
        self.subtotal = self.unit_price * self.quantity
        return self.subtotal
