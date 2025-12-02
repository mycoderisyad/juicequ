"""
Product schemas for request/response validation.
"""
from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field, ConfigDict


# =============================================================================
# Category Schemas
# =============================================================================

class CategoryBase(BaseModel):
    """Base category schema."""
    name: str = Field(..., min_length=1, max_length=100)
    description: Optional[str] = None
    icon: Optional[str] = None
    display_order: int = 0
    is_active: bool = True


class CategoryCreate(CategoryBase):
    """Schema for creating a category."""
    pass


class CategoryUpdate(BaseModel):
    """Schema for updating a category."""
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    description: Optional[str] = None
    icon: Optional[str] = None
    display_order: Optional[int] = None
    is_active: Optional[bool] = None


class CategoryResponse(CategoryBase):
    """Schema for category response."""
    id: str
    created_at: datetime
    updated_at: datetime
    
    model_config = ConfigDict(from_attributes=True)


class CategoryListResponse(BaseModel):
    """Schema for category list response."""
    categories: list[CategoryResponse]
    total: int


# =============================================================================
# Nutrition Schemas
# =============================================================================

class NutritionInfo(BaseModel):
    """Schema for nutrition information."""
    calories: Optional[int] = None
    protein: Optional[float] = None
    carbs: Optional[float] = None
    fat: Optional[float] = None
    sugar: Optional[float] = None
    fiber: Optional[float] = None
    vitamin_c: Optional[float] = None
    vitamin_a: Optional[float] = None


# =============================================================================
# Product Schemas
# =============================================================================

class ProductBase(BaseModel):
    """Base product schema."""
    name: str = Field(..., min_length=1, max_length=100)
    description: Optional[str] = None
    image_url: Optional[str] = None
    base_price: float = Field(..., gt=0)
    calories: Optional[int] = None
    sugar_grams: Optional[float] = None
    ingredients: Optional[str] = None  # JSON string
    health_benefits: Optional[str] = None  # JSON string
    stock_quantity: int = 100
    is_available: bool = True
    is_featured: bool = False
    display_order: int = 0


class ProductCreate(ProductBase):
    """Schema for creating a product."""
    category_id: str


class ProductUpdate(BaseModel):
    """Schema for updating a product."""
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    description: Optional[str] = None
    image_url: Optional[str] = None
    category_id: Optional[str] = None
    base_price: Optional[float] = Field(None, gt=0)
    calories: Optional[int] = None
    sugar_grams: Optional[float] = None
    ingredients: Optional[str] = None
    health_benefits: Optional[str] = None
    stock_quantity: Optional[int] = None
    is_available: Optional[bool] = None
    is_featured: Optional[bool] = None
    display_order: Optional[int] = None


class ProductResponse(ProductBase):
    """Schema for product response."""
    id: str
    category_id: str
    order_count: int = 0
    average_rating: float = 0.0
    created_at: datetime
    updated_at: datetime
    
    # Include category info
    category: Optional[CategoryResponse] = None
    
    # Parsed nutrition info
    nutrition: Optional[NutritionInfo] = None
    
    model_config = ConfigDict(from_attributes=True)


class ProductListResponse(BaseModel):
    """Schema for product list response with pagination."""
    items: list[ProductResponse]
    total: int
    page: int = 1
    page_size: int = 20
    total_pages: int = 1


# =============================================================================
# Product Size Pricing
# =============================================================================

class ProductSizePrice(BaseModel):
    """Schema for product price by size."""
    size: str = Field(..., pattern="^(small|medium|large)$")
    price: float
    multiplier: float


class ProductWithPrices(ProductResponse):
    """Schema for product with all size prices."""
    prices: dict[str, float] = {}  # {"small": 8.0, "medium": 10.0, "large": 13.0}
