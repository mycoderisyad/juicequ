"""
Common Pydantic schemas used across the application.
"""
from datetime import datetime
from typing import Any, Generic, TypeVar, Optional

from pydantic import BaseModel, ConfigDict

T = TypeVar("T")


class BaseSchema(BaseModel):
    """Base schema with common configuration."""
    
    model_config = ConfigDict(
        from_attributes=True,
        populate_by_name=True,
    )


class MessageResponse(BaseModel):
    """Generic message response."""
    
    message: str


class ErrorResponse(BaseModel):
    """Error response schema."""
    
    detail: str
    error_code: Optional[str] = None


class PaginationMeta(BaseModel):
    """Pagination metadata."""
    
    page: int
    page_size: int
    total: int
    total_pages: int


class PaginatedResponse(BaseModel, Generic[T]):
    """Generic paginated response."""
    
    data: list[T]
    meta: PaginationMeta
    
    @classmethod
    def create(
        cls,
        data: list[T],
        page: int,
        page_size: int,
        total: int,
    ) -> "PaginatedResponse[T]":
        """Create a paginated response."""
        total_pages = (total + page_size - 1) // page_size if page_size > 0 else 0
        return cls(
            data=data,
            meta=PaginationMeta(
                page=page,
                page_size=page_size,
                total=total,
                total_pages=total_pages,
            ),
        )


class IDResponse(BaseModel):
    """Response containing just an ID."""
    
    id: str


class SuccessResponse(BaseModel):
    """Generic success response."""
    
    success: bool = True
    message: Optional[str] = None
    data: Optional[Any] = None


class HealthCheckResponse(BaseModel):
    """Health check response."""
    
    status: str
    environment: Optional[str] = None
    version: Optional[str] = None
    services: Optional[dict[str, str]] = None
