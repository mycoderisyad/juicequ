"""
Promo and Voucher models for discount management.
"""
import enum
from datetime import datetime
from typing import TYPE_CHECKING, Optional
from uuid import uuid4

from sqlalchemy import (
    Boolean,
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
    from app.models.product import Product
    from app.models.user import User
    from app.models.order import Order


class PromoType(str, enum.Enum):
    """Type of promotion."""
    PERCENTAGE = "percentage"  # Discount by percentage (e.g., 20% off)
    FIXED = "fixed"            # Fixed amount discount (e.g., Rp 10.000 off)


class VoucherType(str, enum.Enum):
    """Type of voucher."""
    PERCENTAGE = "percentage"  # Discount by percentage
    FIXED = "fixed"            # Fixed amount discount
    FREE_SHIPPING = "free_shipping"  # Free delivery (if applicable)


class ProductPromo(Base):
    """Product-specific promotions (discounts on individual products)."""
    
    __tablename__ = "product_promos"
    
    id: Mapped[str] = mapped_column(
        String(36),
        primary_key=True,
        default=lambda: str(uuid4()),
    )
    
    # Product relationship
    product_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("products.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    
    # Promo details
    name: Mapped[str] = mapped_column(
        String(100),
        nullable=False,
    )
    description: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )
    
    # Discount configuration
    promo_type: Mapped[PromoType] = mapped_column(
        Enum(PromoType),
        default=PromoType.PERCENTAGE,
        nullable=False,
    )
    discount_value: Mapped[float] = mapped_column(
        Float,
        nullable=False,  # Percentage (e.g., 20 for 20%) or fixed amount
    )
    
    # Validity period
    start_date: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
    )
    end_date: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
    )
    
    # Status
    is_active: Mapped[bool] = mapped_column(
        Boolean,
        default=True,
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
    product: Mapped["Product"] = relationship(
        "Product",
        back_populates="promos",
    )
    
    def __repr__(self) -> str:
        return f"<ProductPromo {self.name} ({self.discount_value}{'%' if self.promo_type == PromoType.PERCENTAGE else ''})>"
    
    def is_valid(self) -> bool:
        """Check if promo is currently valid."""
        now = datetime.now(self.start_date.tzinfo) if self.start_date.tzinfo else datetime.utcnow()
        return self.is_active and self.start_date <= now <= self.end_date
    
    def calculate_discount(self, original_price: float) -> float:
        """Calculate discount amount for a given price."""
        if not self.is_valid():
            return 0.0
        
        if self.promo_type == PromoType.PERCENTAGE:
            return round(original_price * (self.discount_value / 100), 2)
        else:  # FIXED
            return min(self.discount_value, original_price)
    
    def get_discounted_price(self, original_price: float) -> float:
        """Get final price after discount."""
        discount = self.calculate_discount(original_price)
        return round(original_price - discount, 2)


class Voucher(Base):
    """Voucher codes for order-wide discounts."""
    
    __tablename__ = "vouchers"
    
    id: Mapped[str] = mapped_column(
        String(36),
        primary_key=True,
        default=lambda: str(uuid4()),
    )
    
    # Voucher code (what users enter)
    code: Mapped[str] = mapped_column(
        String(50),
        unique=True,
        nullable=False,
        index=True,
    )
    
    # Voucher details
    name: Mapped[str] = mapped_column(
        String(100),
        nullable=False,
    )
    description: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )
    
    # Discount configuration
    voucher_type: Mapped[VoucherType] = mapped_column(
        Enum(VoucherType),
        default=VoucherType.PERCENTAGE,
        nullable=False,
    )
    discount_value: Mapped[float] = mapped_column(
        Float,
        nullable=False,  # Percentage or fixed amount
    )
    
    # Constraints
    min_order_amount: Mapped[float] = mapped_column(
        Float,
        default=0.0,
        nullable=False,  # Minimum order amount to use voucher
    )
    max_discount: Mapped[float | None] = mapped_column(
        Float,
        nullable=True,  # Maximum discount cap (for percentage vouchers)
    )
    
    # Usage limits
    usage_limit: Mapped[int | None] = mapped_column(
        Integer,
        nullable=True,  # Total number of times voucher can be used (null = unlimited)
    )
    usage_count: Mapped[int] = mapped_column(
        Integer,
        default=0,
        nullable=False,  # How many times it has been used
    )
    per_user_limit: Mapped[int] = mapped_column(
        Integer,
        default=1,
        nullable=False,  # How many times a single user can use it
    )
    
    # Validity period
    start_date: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
    )
    end_date: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
    )
    
    # Status
    is_active: Mapped[bool] = mapped_column(
        Boolean,
        default=True,
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
    usages: Mapped[list["VoucherUsage"]] = relationship(
        "VoucherUsage",
        back_populates="voucher",
        cascade="all, delete-orphan",
    )
    
    def __repr__(self) -> str:
        return f"<Voucher {self.code} ({self.discount_value}{'%' if self.voucher_type == VoucherType.PERCENTAGE else ''})>"
    
    def is_valid(self) -> bool:
        """Check if voucher is currently valid (not considering usage limits)."""
        now = datetime.now(self.start_date.tzinfo) if self.start_date.tzinfo else datetime.utcnow()
        return self.is_active and self.start_date <= now <= self.end_date
    
    def has_usage_remaining(self) -> bool:
        """Check if voucher has usage remaining."""
        if self.usage_limit is None:
            return True
        return self.usage_count < self.usage_limit
    
    def can_use(self, order_amount: float, user_usage_count: int = 0) -> tuple[bool, str]:
        """Check if voucher can be used for an order."""
        if not self.is_active:
            return False, "Voucher tidak aktif"
        
        if not self.is_valid():
            return False, "Voucher sudah kadaluarsa"
        
        if not self.has_usage_remaining():
            return False, "Voucher sudah habis digunakan"
        
        if user_usage_count >= self.per_user_limit:
            return False, f"Voucher hanya bisa digunakan {self.per_user_limit}x per user"
        
        if order_amount < self.min_order_amount:
            return False, f"Minimum pembelian Rp {self.min_order_amount:,.0f}"
        
        return True, "Voucher valid"
    
    def calculate_discount(self, order_amount: float) -> float:
        """Calculate discount amount for a given order."""
        if self.voucher_type == VoucherType.FREE_SHIPPING:
            return 0.0  # Handled separately
        
        if self.voucher_type == VoucherType.PERCENTAGE:
            discount = order_amount * (self.discount_value / 100)
            if self.max_discount:
                discount = min(discount, self.max_discount)
            return round(discount, 2)
        else:  # FIXED
            return min(self.discount_value, order_amount)


class VoucherUsage(Base):
    """Track voucher usage by users."""
    
    __tablename__ = "voucher_usages"
    
    id: Mapped[str] = mapped_column(
        String(36),
        primary_key=True,
        default=lambda: str(uuid4()),
    )
    
    voucher_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("vouchers.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    
    user_id: Mapped[str | None] = mapped_column(
        String(36),
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,  # Null for guest users
        index=True,
    )
    
    order_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("orders.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    
    discount_amount: Mapped[float] = mapped_column(
        Float,
        nullable=False,
    )
    
    used_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )
    
    # Relationships
    voucher: Mapped["Voucher"] = relationship(
        "Voucher",
        back_populates="usages",
    )
    user: Mapped["User | None"] = relationship("User")
    order: Mapped["Order"] = relationship("Order")
    
    def __repr__(self) -> str:
        return f"<VoucherUsage {self.voucher_id} by {self.user_id}>"
