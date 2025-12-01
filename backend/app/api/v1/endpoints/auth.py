"""
Authentication API endpoints.
"""
from typing import Annotated

from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

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
    description="Authenticate user and return access and refresh tokens.",
)
async def login(
    data: LoginRequest,
    db: Annotated[Session, Depends(get_db)],
):
    """Authenticate user and return tokens."""
    try:
        service = AuthService(db)
        return service.login(data)
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
    db: Annotated[Session, Depends(get_db)],
):
    """Refresh access token."""
    try:
        service = AuthService(db)
        return service.refresh_token(data.refresh_token)
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
    description="Logout user (client should discard tokens).",
)
async def logout(
    current_user: CurrentUser,
):
    """
    Logout user.
    
    Note: Since we use JWT, actual token invalidation requires
    a token blacklist which can be implemented later.
    For now, client should discard the tokens.
    """
    return MessageResponse(message="Logged out successfully")
