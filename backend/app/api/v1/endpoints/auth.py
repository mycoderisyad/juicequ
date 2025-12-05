"""
Authentication API endpoints.
"""
from typing import Annotated

from fastapi import APIRouter, Depends, Query, Response, status
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
    GoogleAuthRequest,
    GoogleAuthUrlResponse,
    LoginRequest,
    MessageResponse,
    PasswordResetConfirm,
    PasswordResetRequest,
    RefreshTokenRequest,
    RegisterRequest,
    Token,
    VerifyEmailConfirm,
    VerifyEmailRequest,
)
from app.schemas.user import UserProfileResponse, UserUpdatePassword
from app.services.auth_service import AuthService
from app.services.google_oauth_service import GoogleOAuthService

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
    "/password/forgot",
    response_model=MessageResponse,
    summary="Request password reset",
    description="Send password reset link to email.",
)
async def forgot_password(
    data: PasswordResetRequest,
    db: Annotated[Session, Depends(get_db)],
):
    """Send password reset link."""
    try:
        service = AuthService(db)
        service.request_password_reset(data.email)
        return MessageResponse(message="If the email exists, a reset link has been sent")
    except Exception as e:
        raise BadRequestException(str(e))


@router.post(
    "/password/reset",
    response_model=MessageResponse,
    summary="Reset password",
    description="Reset password using token.",
)
async def reset_password(
    data: PasswordResetConfirm,
    db: Annotated[Session, Depends(get_db)],
):
    """Reset password using token."""
    try:
        service = AuthService(db)
        service.reset_password(token=data.token, new_password=data.new_password)
        return MessageResponse(message="Password reset successfully")
    except Exception as e:
        raise BadRequestException(str(e))


@router.post(
    "/verify-email/send",
    response_model=MessageResponse,
    summary="Send verification email",
    description="Send verification link to email.",
)
async def send_verification_email(
    data: VerifyEmailRequest,
    db: Annotated[Session, Depends(get_db)],
):
    """Send verification email."""
    try:
        service = AuthService(db)
        service.send_verification(data.email)
        return MessageResponse(message="Verification email sent if account exists")
    except Exception as e:
        raise BadRequestException(str(e))


@router.post(
    "/verify-email/confirm",
    response_model=MessageResponse,
    summary="Confirm email verification",
    description="Verify email using token from email link.",
)
async def confirm_verification(
    data: VerifyEmailConfirm,
    db: Annotated[Session, Depends(get_db)],
):
    """Confirm email verification."""
    try:
        service = AuthService(db)
        service.confirm_verification(data.token)
        return MessageResponse(message="Email verified successfully")
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


# ============== Google OAuth Endpoints ==============


@router.get(
    "/google/url",
    response_model=GoogleAuthUrlResponse,
    summary="Get Google OAuth URL",
    description="Generate Google OAuth authorization URL for login.",
)
async def get_google_auth_url(
    db: Annotated[Session, Depends(get_db)],
    redirect_uri: str | None = Query(None, description="Custom redirect URI"),
):
    """Get Google OAuth authorization URL."""
    try:
        service = GoogleOAuthService(db)
        auth_url, state = service.generate_auth_url(redirect_uri)
        return GoogleAuthUrlResponse(auth_url=auth_url, state=state)
    except Exception as e:
        raise BadRequestException(str(e))


@router.post(
    "/google/callback",
    response_model=Token,
    summary="Google OAuth callback",
    description="Handle Google OAuth callback and authenticate user.",
)
async def google_auth_callback(
    data: GoogleAuthRequest,
    response: Response,
    db: Annotated[Session, Depends(get_db)],
    redirect_uri: str | None = Query(None, description="Redirect URI used in auth request"),
):
    """
    Handle Google OAuth callback.
    
    Exchanges authorization code for tokens and creates/logs in user.
    """
    try:
        service = GoogleOAuthService(db)
        tokens = await service.authenticate_with_google(data.code, redirect_uri)
        
        # Set HttpOnly cookies for enhanced security
        set_auth_cookies(response, tokens.access_token, tokens.refresh_token)
        
        return tokens
    except Exception as e:
        raise CredentialsException(detail=str(e))
