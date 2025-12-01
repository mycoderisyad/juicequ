"""
Pydantic schemas for user-related operations.
"""
from datetime import datetime

from pydantic import BaseModel, ConfigDict, EmailStr, Field, field_validator

from app.models.user import UserRole


class UserBase(BaseModel):
    """Base schema for user data."""
    
    email: EmailStr
    full_name: str = Field(..., min_length=2, max_length=100)
    phone_number: str | None = Field(None, max_length=20)


class UserCreate(UserBase):
    """Schema for creating a new user."""
    
    password: str = Field(..., min_length=8, max_length=100)
    
    @field_validator("password")
    @classmethod
    def validate_password(cls, v: str) -> str:
        """Validate password strength."""
        if not any(c.isupper() for c in v):
            raise ValueError("Password must contain at least one uppercase letter")
        if not any(c.islower() for c in v):
            raise ValueError("Password must contain at least one lowercase letter")
        if not any(c.isdigit() for c in v):
            raise ValueError("Password must contain at least one digit")
        return v


class UserCreateByAdmin(UserCreate):
    """Schema for admin creating a user with specific role."""
    
    role: UserRole = UserRole.PEMBELI


class UserUpdate(BaseModel):
    """Schema for updating user profile."""
    
    full_name: str | None = Field(None, min_length=2, max_length=100)
    phone_number: str | None = Field(None, max_length=20)
    preferences: str | None = None  # JSON string


class UserUpdatePassword(BaseModel):
    """Schema for updating user password."""
    
    current_password: str
    new_password: str = Field(..., min_length=8, max_length=100)
    
    @field_validator("new_password")
    @classmethod
    def validate_password(cls, v: str) -> str:
        """Validate password strength."""
        if not any(c.isupper() for c in v):
            raise ValueError("Password must contain at least one uppercase letter")
        if not any(c.islower() for c in v):
            raise ValueError("Password must contain at least one lowercase letter")
        if not any(c.isdigit() for c in v):
            raise ValueError("Password must contain at least one digit")
        return v


class UserResponse(UserBase):
    """Schema for user response (public data)."""
    
    model_config = ConfigDict(from_attributes=True)
    
    id: str
    role: UserRole
    is_active: bool
    is_verified: bool
    created_at: datetime


class UserProfileResponse(UserResponse):
    """Schema for user profile response (includes preferences)."""
    
    preferences: str | None = None
    last_login: datetime | None = None


class UserListResponse(BaseModel):
    """Schema for paginated user list."""
    
    items: list[UserResponse]
    total: int
    page: int
    page_size: int
    total_pages: int
