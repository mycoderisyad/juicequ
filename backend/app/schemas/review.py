"""
Pydantic schemas for product reviews.
"""
from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field, field_validator

class ReviewBase(BaseModel):
    """Base review schema."""
    rating: int = Field(..., ge=1, le=5, description="Rating from 1 to 5")
    comment: Optional[str] = Field(None, max_length=1000)
    image_url: Optional[str] = None
    is_ai_generated: bool = False

class ReviewCreate(ReviewBase):
    """Schema for creating a review."""
    pass

class ReviewResponse(ReviewBase):
    """Schema for review response."""
    id: str
    user_id: str
    product_id: str
    user_name: str
    user_avatar: Optional[str] = None
    created_at: datetime
    is_verified_purchase: bool

    class Config:
        from_attributes = True

class ReviewList(BaseModel):
    """Schema for list of reviews."""
    items: list[ReviewResponse]
    total: int
    page: int
    size: int
    average_rating: float
    rating_distribution: dict[int, int]
