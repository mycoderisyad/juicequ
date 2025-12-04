"""
Authentication API endpoints.
"""
from typing import Annotated

from fastapi import APIRouter, Depends, Response, status
from sqlalchemy.orm import Session

from app.config import settings
from app.core.dependencies import CurrentUser, get_current_user
from app.core.exceptions import (
    BadRequestException,
    ConflictException,
    CredentialsException,
)
from app.db.session import get_db
from app.schemas.auth import (
    LoginRequest,
    MessageResponse,
    RefreshTokenRequest,
    RegisterRequest,
    Token,
)
from app.schemas.user import UserProfileResponse, UserUpdatePassword
from app.services.auth_service import AuthService

router = APIRouter()


def set_auth_cookies(response: Response, access_token: str, refresh_token: str) -> None:
    """Set secure HttpOnly cookies for authentication tokens."""
    is_production = settings.app_env == "production"
    
    # Access token cookie - shorter lifetime
    response.set_cookie(
        key="access_token",
        value=access_token,
        httponly=True,  # Prevent JavaScript access (XSS protection)
        secure=is_production,  # HTTPS only in production
        samesite="lax",  # CSRF protection
        max_age=settings.access_token_expire_minutes * 60,
        path="/",
    )
    
    # Refresh token cookie - longer lifetime
    response.set_cookie(
        key="refresh_token",
        value=refresh_token,
        httponly=True,
        secure=is_production,
        samesite="lax",
        max_age=settings.refresh_token_expire_days * 24 * 60 * 60,
        path="/api/v1/auth",  # Restrict to auth endpoints only
    )


def clear_auth_cookies(response: Response) -> None:
    """Clear authentication cookies on logout."""
    response.delete_cookie(key="access_token", path="/")
    response.delete_cookie(key="refresh_token", path="/api/v1/auth")


@router.post(
    "/register",
    response_model=UserProfileResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Register new user",
    description="Register a new user account with email and password.",
)
async def register(
    data: RegisterRequest,
    db: Annotated[Session, Depends(get_db)],
):
    """Register a new user account."""
    try:
        service = AuthService(db)
        user = service.register(data)
        return user
    except Exception as e:
        if "already exists" in str(e):
            raise ConflictException("User", "Email already registered")
        raise BadRequestException(str(e))


@router.post(
    "/login",
    response_model=Token,
    summary="User login",
    description="Authenticate user and return access and refresh tokens. Tokens are also set as HttpOnly cookies.",
)
async def login(
    data: LoginRequest,
    response: Response,
    db: Annotated[Session, Depends(get_db)],
):
    """Authenticate user and return tokens."""
    try:
        service = AuthService(db)
        tokens = service.login(data)
        
        # Set HttpOnly cookies for enhanced security
        set_auth_cookies(response, tokens.access_token, tokens.refresh_token)
        
        # Also return tokens in response body for backward compatibility
        # (allows clients to choose storage method)
        return tokens
    except Exception as e:
        raise CredentialsException(detail=str(e))


@router.post(
    "/refresh",
    response_model=Token,
    summary="Refresh token",
    description="Get new access token using refresh token.",
)
async def refresh_token(
    data: RefreshTokenRequest,
    response: Response,
    db: Annotated[Session, Depends(get_db)],
):
    """Refresh access token."""
    try:
        service = AuthService(db)
        tokens = service.refresh_token(data.refresh_token)
        
        # Update HttpOnly cookies
        set_auth_cookies(response, tokens.access_token, tokens.refresh_token)
        
        return tokens
    except Exception as e:
        raise CredentialsException(detail=str(e))


@router.get(
    "/me",
    response_model=UserProfileResponse,
    summary="Get current user",
    description="Get current authenticated user's profile.",
)
async def get_me(
    current_user: CurrentUser,
):
    """Get current user profile."""
    return current_user


@router.post(
    "/change-password",
    response_model=MessageResponse,
    summary="Change password",
    description="Change current user's password.",
)
async def change_password(
    data: UserUpdatePassword,
    current_user: CurrentUser,
    db: Annotated[Session, Depends(get_db)],
):
    """Change user password."""
    try:
        service = AuthService(db)
        service.change_password(
            user=current_user,
            current_password=data.current_password,
            new_password=data.new_password,
        )
        return MessageResponse(message="Password changed successfully")
    except Exception as e:
        raise BadRequestException(str(e))


@router.post(
    "/logout",
    response_model=MessageResponse,
    summary="User logout",
    description="Logout user and clear authentication cookies.",
)
async def logout(
    response: Response,
    current_user: CurrentUser,
):
    """
    Logout user.
    
    Clears HttpOnly cookies. For full token invalidation,
    a token blacklist can be implemented later.
    """
    clear_auth_cookies(response)
    return MessageResponse(message="Logged out successfully")
