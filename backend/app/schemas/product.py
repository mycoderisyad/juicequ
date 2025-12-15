"""Product schemas for request/response validation."""
from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field, ConfigDict


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


class SizePricing(BaseModel):
    """Schema for product size pricing."""
    small: Optional[float] = None
    medium: Optional[float] = None
    large: Optional[float] = None


class SizeVolume(BaseModel):
    """Schema for product size volume."""
    small: Optional[int] = None
    medium: Optional[int] = None
    large: Optional[int] = None


class SizeCalories(BaseModel):
    """Schema for calories per size."""
    small: Optional[int] = None
    medium: Optional[int] = None
    large: Optional[int] = None


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


class ProductBase(BaseModel):
    """Base product schema."""
    name: str = Field(..., min_length=1, max_length=100)
    description: Optional[str] = None
    image_url: Optional[str] = None
    base_price: float = Field(..., gt=0)
    calories: Optional[int] = None
    size_calories: Optional[SizeCalories] = None
    sugar_grams: Optional[float] = None
    ingredients: Optional[str] = None  # JSON string
    health_benefits: Optional[str] = None  # JSON string
    allergy_warning: Optional[str] = None
    stock_quantity: int = 100
    is_available: bool = True
    is_featured: bool = False
    display_order: int = 0
    # Size variants
    has_sizes: bool = True
    size_prices: Optional[SizePricing] = None
    size_volumes: Optional[SizeVolume] = None
    volume_unit: str = "ml"


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
    size_calories: Optional[SizeCalories] = None
    sugar_grams: Optional[float] = None
    ingredients: Optional[str] = None
    health_benefits: Optional[str] = None
    allergy_warning: Optional[str] = None
    stock_quantity: Optional[int] = None
    is_available: Optional[bool] = None
    is_featured: Optional[bool] = None
    display_order: Optional[int] = None
    # Size variants
    has_sizes: Optional[bool] = None
    size_prices: Optional[SizePricing] = None
    size_volumes: Optional[SizeVolume] = None
    volume_unit: Optional[str] = None


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
    
    # Computed size data (for convenience)
    prices: Optional[dict] = None  # {"small": 8000, "medium": 10000, "large": 13000}
    volumes: Optional[dict] = None  # {"small": 250, "medium": 350, "large": 500}
    calories_by_size: Optional[dict] = None  # {"small": 120, "medium": 180, "large": 240}
    
    model_config = ConfigDict(from_attributes=True)


class ProductListResponse(BaseModel):
    """Schema for product list response with pagination."""
    items: list[ProductResponse]
    total: int
    page: int = 1
    page_size: int = 20
    total_pages: int = 1


class ProductSizePrice(BaseModel):
    """Schema for product price by size."""
    size: str = Field(..., pattern="^(small|medium|large)$")
    price: float
    multiplier: float


class ProductWithPrices(ProductResponse):
    """Schema for product with all size prices."""
    prices: dict[str, float] = {}


class AdminProductCreate(BaseModel):
    """Request to create a product (admin)."""
    name: str = Field(..., min_length=2, max_length=100)
    description: str = Field(..., min_length=10, max_length=500)
    price: float = Field(..., gt=0)
    category: str
    image: str | None = None
    hero_image: str | None = None
    bottle_image: str | None = None
    thumbnail_image: str | None = None
    is_available: bool = True
    stock: int = Field(default=100, ge=0)
    ingredients: list[str] = []
    nutrition: dict | None = None
    allergy_warning: str | None = None
    calories: int | None = None
    has_sizes: bool = True
    size_prices: dict | None = None
    size_volumes: dict | None = None
    size_calories: dict | None = None
    volume_unit: str = "ml"


class AdminProductUpdate(BaseModel):
    """Request to update a product (admin)."""
    name: str | None = Field(None, min_length=2, max_length=100)
    description: str | None = Field(None, max_length=500)
    price: float | None = Field(None, gt=0)
    category: str | None = None
    image: str | None = None
    hero_image: str | None = None
    bottle_image: str | None = None
    thumbnail_image: str | None = None
    is_available: bool | None = None
    stock: int | None = Field(None, ge=0)
    ingredients: list[str] | None = None
    nutrition: dict | None = None
    allergy_warning: str | None = None
    calories: int | None = None
    has_sizes: bool | None = None
    size_prices: dict | None = None
    size_volumes: dict | None = None
    size_calories: dict | None = None
    volume_unit: str | None = None


class BatchDeleteRequest(BaseModel):
    """Request to batch delete products."""
    product_ids: list[str] = Field(..., min_length=1)
