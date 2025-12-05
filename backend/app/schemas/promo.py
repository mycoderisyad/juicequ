"""
Promo and Voucher schemas for API serialization.
"""
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field, validator


# =============================================================================
# Promo Type Enums
# =============================================================================

class PromoTypeEnum(str):
    PERCENTAGE = "percentage"
    FIXED = "fixed"


class VoucherTypeEnum(str):
    PERCENTAGE = "percentage"
    FIXED = "fixed"
    FREE_SHIPPING = "free_shipping"


# =============================================================================
# Product Promo Schemas
# =============================================================================

class ProductPromoBase(BaseModel):
    """Base schema for product promo."""
    name: str = Field(..., min_length=1, max_length=100)
    description: Optional[str] = None
    promo_type: str = Field(default="percentage")  # percentage or fixed
    discount_value: float = Field(..., gt=0)
    start_date: datetime
    end_date: datetime
    is_active: bool = True

    @validator('promo_type')
    def validate_promo_type(cls, v):
        if v not in ['percentage', 'fixed']:
            raise ValueError('promo_type must be percentage or fixed')
        return v

    @validator('discount_value')
    def validate_discount_value(cls, v, values):
        promo_type = values.get('promo_type', 'percentage')
        if promo_type == 'percentage' and v > 100:
            raise ValueError('Percentage discount cannot exceed 100%')
        return v

    @validator('end_date')
    def validate_end_date(cls, v, values):
        start_date = values.get('start_date')
        if start_date and v <= start_date:
            raise ValueError('end_date must be after start_date')
        return v


class ProductPromoCreate(ProductPromoBase):
    """Schema for creating a product promo."""
    product_id: int


class ProductPromoUpdate(BaseModel):
    """Schema for updating a product promo."""
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    description: Optional[str] = None
    promo_type: Optional[str] = None
    discount_value: Optional[float] = Field(None, gt=0)
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    is_active: Optional[bool] = None


class ProductPromoResponse(ProductPromoBase):
    """Schema for product promo response."""
    id: str
    product_id: int
    created_at: datetime
    updated_at: datetime
    
    # Computed fields
    is_valid: bool = False
    discount_display: str = ""

    class Config:
        from_attributes = True


class ProductPromoListResponse(BaseModel):
    """Schema for list of product promos."""
    items: list[ProductPromoResponse]
    total: int
    page: int
    page_size: int


# =============================================================================
# Voucher Schemas
# =============================================================================

class VoucherBase(BaseModel):
    """Base schema for voucher."""
    code: str = Field(..., min_length=3, max_length=50)
    name: str = Field(..., min_length=1, max_length=100)
    description: Optional[str] = None
    voucher_type: str = Field(default="percentage")  # percentage, fixed, free_shipping
    discount_value: float = Field(..., ge=0)
    min_order_amount: float = Field(default=0.0, ge=0)
    max_discount: Optional[float] = Field(None, gt=0)
    usage_limit: Optional[int] = Field(None, gt=0)
    per_user_limit: int = Field(default=1, gt=0)
    start_date: datetime
    end_date: datetime
    is_active: bool = True

    @validator('voucher_type')
    def validate_voucher_type(cls, v):
        if v not in ['percentage', 'fixed', 'free_shipping']:
            raise ValueError('voucher_type must be percentage, fixed, or free_shipping')
        return v

    @validator('code')
    def validate_code(cls, v):
        # Uppercase and remove spaces
        return v.upper().replace(' ', '')

    @validator('end_date')
    def validate_end_date(cls, v, values):
        start_date = values.get('start_date')
        if start_date and v <= start_date:
            raise ValueError('end_date must be after start_date')
        return v


class VoucherCreate(VoucherBase):
    """Schema for creating a voucher."""
    pass


class VoucherUpdate(BaseModel):
    """Schema for updating a voucher."""
    code: Optional[str] = Field(None, min_length=3, max_length=50)
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    description: Optional[str] = None
    voucher_type: Optional[str] = None
    discount_value: Optional[float] = Field(None, ge=0)
    min_order_amount: Optional[float] = Field(None, ge=0)
    max_discount: Optional[float] = None
    usage_limit: Optional[int] = None
    per_user_limit: Optional[int] = Field(None, gt=0)
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    is_active: Optional[bool] = None


class VoucherResponse(VoucherBase):
    """Schema for voucher response."""
    id: str
    usage_count: int
    created_at: datetime
    updated_at: datetime
    
    # Computed fields
    is_valid: bool = False
    usage_remaining: Optional[int] = None
    discount_display: str = ""

    class Config:
        from_attributes = True


class VoucherListResponse(BaseModel):
    """Schema for list of vouchers."""
    items: list[VoucherResponse]
    total: int
    page: int
    page_size: int


# =============================================================================
# Voucher Validation Schemas
# =============================================================================

class VoucherValidateRequest(BaseModel):
    """Schema for validating a voucher."""
    code: str
    order_amount: float = Field(..., gt=0)


class VoucherValidateResponse(BaseModel):
    """Schema for voucher validation response."""
    valid: bool
    message: str
    voucher: Optional[VoucherResponse] = None
    discount_amount: float = 0.0
    final_amount: float = 0.0


# =============================================================================
# Voucher Usage Schemas
# =============================================================================

class VoucherUsageResponse(BaseModel):
    """Schema for voucher usage response."""
    id: str
    voucher_id: str
    voucher_code: str
    user_id: Optional[str]
    order_id: str
    discount_amount: float
    used_at: datetime

    class Config:
        from_attributes = True


# =============================================================================
# Product with Promo Info
# =============================================================================

class ProductPromoInfo(BaseModel):
    """Promo info to be included in product response."""
    has_promo: bool = False
    promo_id: Optional[str] = None
    promo_name: Optional[str] = None
    promo_type: Optional[str] = None
    discount_value: Optional[float] = None
    discount_percentage: Optional[int] = None  # For badge display
    original_price: Optional[float] = None
    discounted_price: Optional[float] = None
    promo_end_date: Optional[datetime] = None
