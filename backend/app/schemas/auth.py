"""
Pydantic schemas for authentication operations.
"""
from pydantic import BaseModel, EmailStr, Field


class Token(BaseModel):
    """Schema for JWT token response."""
    
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class TokenPayload(BaseModel):
    """Schema for JWT token payload."""
    
    sub: str
    exp: int
    iat: int
    type: str | None = None


class LoginRequest(BaseModel):
    """Schema for login request."""
    
    email: EmailStr
    password: str = Field(..., min_length=1)


class RefreshTokenRequest(BaseModel):
    """Schema for refresh token request."""
    
    refresh_token: str


class RegisterRequest(BaseModel):
    """Schema for user registration."""
    
    email: EmailStr
    password: str = Field(..., min_length=8, max_length=100)
    full_name: str = Field(..., min_length=2, max_length=100)
    phone_number: str | None = Field(None, max_length=20)


class PasswordResetRequest(BaseModel):
    """Schema for password reset request."""
    
    email: EmailStr


class PasswordResetConfirm(BaseModel):
    """Schema for password reset confirmation."""
    
    token: str
    new_password: str = Field(..., min_length=8, max_length=100)


class MessageResponse(BaseModel):
    """Generic message response."""
    
    message: str
    success: bool = True
