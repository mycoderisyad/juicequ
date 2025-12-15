"""Authentication API endpoints."""
from typing import Annotated

from fastapi import APIRouter, Depends, Query, Response, status
from sqlalchemy.orm import Session

from app.config import settings
from app.core.dependencies import CurrentUser
from app.core.exceptions import BadRequestException, ConflictException, CredentialsException
from app.core.rate_limit import check_auth_rate_limit
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


def _set_auth_cookies(response: Response, access_token: str, refresh_token: str) -> None:
    """Set secure HttpOnly cookies for authentication tokens."""
    is_production = settings.app_env == "production"

    response.set_cookie(
        key="access_token",
        value=access_token,
        httponly=True,
        secure=is_production,
        samesite="lax",
        max_age=settings.access_token_expire_minutes * 60,
        path="/",
    )

    response.set_cookie(
        key="refresh_token",
        value=refresh_token,
        httponly=True,
        secure=is_production,
        samesite="lax",
        max_age=settings.refresh_token_expire_days * 86400,
        path="/api/v1/auth",
    )


def _clear_auth_cookies(response: Response) -> None:
    """Clear authentication cookies on logout."""
    response.delete_cookie(key="access_token", path="/")
    response.delete_cookie(key="refresh_token", path="/api/v1/auth")


@router.post(
    "/register",
    response_model=UserProfileResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Register new user",
    dependencies=[Depends(check_auth_rate_limit)],
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
    dependencies=[Depends(check_auth_rate_limit)],
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
        _set_auth_cookies(response, tokens.access_token, tokens.refresh_token)
        return tokens
    except Exception as e:
        raise CredentialsException(detail=str(e))


@router.post("/refresh", response_model=Token, summary="Refresh token")
async def refresh_token(
    data: RefreshTokenRequest,
    response: Response,
    db: Annotated[Session, Depends(get_db)],
):
    """Refresh access token."""
    try:
        service = AuthService(db)
        tokens = service.refresh_token(data.refresh_token)
        _set_auth_cookies(response, tokens.access_token, tokens.refresh_token)
        return tokens
    except Exception as e:
        raise CredentialsException(detail=str(e))


@router.get("/me", response_model=UserProfileResponse, summary="Get current user")
async def get_me(current_user: CurrentUser):
    """Get current user profile."""
    return current_user


@router.post("/change-password", response_model=MessageResponse, summary="Change password")
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
    dependencies=[Depends(check_auth_rate_limit)],
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
    dependencies=[Depends(check_auth_rate_limit)],
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
    dependencies=[Depends(check_auth_rate_limit)],
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


@router.post("/logout", response_model=MessageResponse, summary="User logout")
async def logout(response: Response, current_user: CurrentUser):
    """Logout user and clear cookies."""
    _clear_auth_cookies(response)
    return MessageResponse(message="Logged out successfully")


@router.get("/google/url", response_model=GoogleAuthUrlResponse, summary="Get Google OAuth URL")
async def get_google_auth_url(
    db: Annotated[Session, Depends(get_db)],
    redirect_uri: str | None = Query(None),
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
    dependencies=[Depends(check_auth_rate_limit)],
)
async def google_auth_callback(
    data: GoogleAuthRequest,
    response: Response,
    db: Annotated[Session, Depends(get_db)],
    redirect_uri: str | None = Query(None),
):
    """Handle Google OAuth callback."""
    try:
        service = GoogleOAuthService(db)
        tokens = await service.authenticate_with_google(data.code, redirect_uri)
        _set_auth_cookies(response, tokens.access_token, tokens.refresh_token)
        return tokens
    except Exception as e:
        raise CredentialsException(detail=str(e))
