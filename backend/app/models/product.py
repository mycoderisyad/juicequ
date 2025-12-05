"""
Product and ProductCategory models for the juice menu.
"""
import enum
import json
from datetime import datetime
from typing import TYPE_CHECKING
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
    from app.models.order import OrderItem
    from app.models.cart import CartItem


class ProductCategory(Base):
    """Category for organizing products."""
    
    __tablename__ = "product_categories"
    
    id: Mapped[str] = mapped_column(
        String(36),
        primary_key=True,
        default=lambda: str(uuid4()),
    )
    name: Mapped[str] = mapped_column(
        String(100),
        unique=True,
        nullable=False,
    )
    description: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )
    icon: Mapped[str | None] = mapped_column(
        String(50),  # Emoji or icon name
        nullable=True,
    )
    display_order: Mapped[int] = mapped_column(
        Integer,
        default=0,
        nullable=False,
    )
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
    products: Mapped[list["Product"]] = relationship(
        "Product",
        back_populates="category",
        cascade="all, delete-orphan",
    )
    
    def __repr__(self) -> str:
        return f"<ProductCategory {self.name}>"


class ProductSize(str, enum.Enum):
    """Available product sizes."""
    SMALL = "small"
    MEDIUM = "medium"
    LARGE = "large"


class Product(Base):
    """Product model for juice items."""
    
    __tablename__ = "products"
    
    id: Mapped[str] = mapped_column(
        String(36),
        primary_key=True,
        default=lambda: str(uuid4()),
    )
    
    # Basic info
    name: Mapped[str] = mapped_column(
        String(100),
        nullable=False,
        index=True,
    )
    description: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )
    image_url: Mapped[str | None] = mapped_column(
        String(500),
        nullable=True,
    )
    # Hero images for bestseller display
    hero_image: Mapped[str | None] = mapped_column(
        String(500),
        nullable=True,
        comment="Background image for hero section (WebP)",
    )
    bottle_image: Mapped[str | None] = mapped_column(
        String(500),
        nullable=True,
        comment="Bottle/product image for hero section (WebP)",
    )
    thumbnail_image: Mapped[str | None] = mapped_column(
        String(500),
        nullable=True,
        comment="Thumbnail image for catalog (WebP)",
    )
    
    # Category relationship
    category_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("product_categories.id", ondelete="CASCADE"),
        nullable=False,
    )
    
    # Pricing (base price, size affects final price)
    base_price: Mapped[float] = mapped_column(
        Float,
        nullable=False,
    )
    
    # Size-specific pricing (JSON: {"small": 10000, "medium": 15000, "large": 20000})
    size_prices: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
        comment="JSON object with price per size (small, medium, large)",
    )
    
    # Size-specific volume in ml (JSON: {"small": 250, "medium": 350, "large": 500})
    size_volumes: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
        comment="JSON object with volume per size in ml",
    )
    
    # Volume unit (ml, oz, etc.)
    volume_unit: Mapped[str] = mapped_column(
        String(20),
        default="ml",
        nullable=False,
    )
    
    # Whether product has multiple sizes
    has_sizes: Mapped[bool] = mapped_column(
        Boolean,
        default=True,
        nullable=False,
    )
    
    # Nutrition info (for AI recommendations)
    calories: Mapped[int | None] = mapped_column(
        Integer,
        nullable=True,
    )
    sugar_grams: Mapped[float | None] = mapped_column(
        Float,
        nullable=True,
    )
    
    # Ingredients (JSON string for AI to parse)
    ingredients: Mapped[str | None] = mapped_column(
        Text,  # JSON array of ingredients
        nullable=True,
    )
    
    # Health benefits (for AI recommendations)
    health_benefits: Mapped[str | None] = mapped_column(
        Text,  # JSON array of benefits
        nullable=True,
    )
    
    # Stock management
    stock_quantity: Mapped[int] = mapped_column(
        Integer,
        default=100,
        nullable=False,
    )
    is_available: Mapped[bool] = mapped_column(
        Boolean,
        default=True,
        nullable=False,
    )
    
    # Popularity tracking (for AI recommendations)
    order_count: Mapped[int] = mapped_column(
        Integer,
        default=0,
        nullable=False,
    )
    average_rating: Mapped[float] = mapped_column(
        Float,
        default=0.0,
        nullable=False,
    )
    
    # Display
    is_featured: Mapped[bool] = mapped_column(
        Boolean,
        default=False,
        nullable=False,
    )
    display_order: Mapped[int] = mapped_column(
        Integer,
        default=0,
        nullable=False,
    )
    
    # Soft delete
    is_deleted: Mapped[bool] = mapped_column(
        Boolean,
        default=False,
        nullable=False,
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
    category: Mapped["ProductCategory"] = relationship(
        "ProductCategory",
        back_populates="products",
    )
    order_items: Mapped[list["OrderItem"]] = relationship(
        "OrderItem",
        back_populates="product",
    )
    cart_items: Mapped[list["CartItem"]] = relationship(
        "CartItem",
        back_populates="product",
    )
    
    def __repr__(self) -> str:
        return f"<Product {self.name}>"
    
    def get_price(self, size: ProductSize = ProductSize.MEDIUM) -> float:
        """Get price based on size."""
        # First check if we have custom size prices
        if self.size_prices:
            try:
                prices = json.loads(self.size_prices)
                size_key = size.value if isinstance(size, ProductSize) else size
                if size_key in prices:
                    return float(prices[size_key])
            except (json.JSONDecodeError, ValueError, TypeError):
                pass
        
        # Fall back to multiplier-based pricing
        multipliers = {
            ProductSize.SMALL: 0.8,
            ProductSize.MEDIUM: 1.0,
            ProductSize.LARGE: 1.3,
        }
        return self.base_price * multipliers.get(size, 1.0)
    
    def get_volume(self, size: ProductSize = ProductSize.MEDIUM) -> int | None:
        """Get volume based on size."""
        if self.size_volumes:
            try:
                volumes = json.loads(self.size_volumes)
                size_key = size.value if isinstance(size, ProductSize) else size
                if size_key in volumes:
                    return int(volumes[size_key])
            except (json.JSONDecodeError, ValueError, TypeError):
                pass
        
        # Default volumes if not specified
        default_volumes = {
            ProductSize.SMALL: 250,
            ProductSize.MEDIUM: 350,
            ProductSize.LARGE: 500,
        }
        return default_volumes.get(size)
    
    def get_all_prices(self) -> dict:
        """Get all size prices."""
        if self.size_prices:
            try:
                return json.loads(self.size_prices)
            except (json.JSONDecodeError, ValueError, TypeError):
                pass
        
        # Calculate from base price
        return {
            "small": round(self.base_price * 0.8),
            "medium": round(self.base_price),
            "large": round(self.base_price * 1.3),
        }
    
    def get_all_volumes(self) -> dict:
        """Get all size volumes."""
        if self.size_volumes:
            try:
                return json.loads(self.size_volumes)
            except (json.JSONDecodeError, ValueError, TypeError):
                pass
        
        return {
            "small": 250,
            "medium": 350,
            "large": 500,
        }
    
    def is_in_stock(self, quantity: int = 1) -> bool:
        """Check if product is in stock."""
        return self.is_available and self.stock_quantity >= quantity
