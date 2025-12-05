"""
Google OAuth service for authentication.
Handles Google OAuth flow and user creation/login.
"""
import secrets
from datetime import datetime, timezone
from typing import Optional
from urllib.parse import urlencode

import httpx
from sqlalchemy.orm import Session

from app.config import settings
from app.core.exceptions import AuthenticationError, ValidationError
from app.core.security import create_access_token, create_refresh_token
from app.models.user import User, UserRole
from app.schemas.auth import Token


class GoogleOAuthService:
    """Service for Google OAuth authentication."""

    GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth"
    GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token"
    GOOGLE_USERINFO_URL = "https://www.googleapis.com/oauth2/v2/userinfo"

    def __init__(self, db: Session):
        self.db = db

    def generate_auth_url(self, redirect_uri: Optional[str] = None) -> tuple[str, str]:
        """
        Generate Google OAuth authorization URL.

        Returns:
            Tuple of (auth_url, state)
        """
        if not settings.google_client_id:
            raise ValidationError("Google OAuth is not configured")

        # Generate CSRF state token
        state = secrets.token_urlsafe(32)

        params = {
            "client_id": settings.google_client_id,
            "redirect_uri": redirect_uri or settings.google_redirect_uri,
            "response_type": "code",
            "scope": "openid email profile",
            "access_type": "offline",
            "state": state,
            "prompt": "select_account",
        }

        auth_url = f"{self.GOOGLE_AUTH_URL}?{urlencode(params)}"
        return auth_url, state

    async def exchange_code_for_tokens(
        self, code: str, redirect_uri: Optional[str] = None
    ) -> dict:
        """
        Exchange authorization code for Google tokens.

        Args:
            code: Authorization code from Google
            redirect_uri: Redirect URI used in auth request

        Returns:
            Dict containing access_token, id_token, etc.
        """
        if not settings.google_client_id or not settings.google_client_secret:
            raise ValidationError("Google OAuth is not configured")

        async with httpx.AsyncClient() as client:
            response = await client.post(
                self.GOOGLE_TOKEN_URL,
                data={
                    "client_id": settings.google_client_id,
                    "client_secret": settings.google_client_secret,
                    "code": code,
                    "grant_type": "authorization_code",
                    "redirect_uri": redirect_uri or settings.google_redirect_uri,
                },
            )

            if response.status_code != 200:
                raise AuthenticationError("Failed to exchange code for tokens")

            return response.json()

    async def get_user_info(self, access_token: str) -> dict:
        """
        Get user info from Google.

        Args:
            access_token: Google access token

        Returns:
            Dict containing user info (id, email, name, picture)
        """
        async with httpx.AsyncClient() as client:
            response = await client.get(
                self.GOOGLE_USERINFO_URL,
                headers={"Authorization": f"Bearer {access_token}"},
            )

            if response.status_code != 200:
                raise AuthenticationError("Failed to get user info from Google")

            return response.json()

    async def authenticate_with_google(
        self, code: str, redirect_uri: Optional[str] = None
    ) -> Token:
        """
        Complete Google OAuth flow and return JWT tokens.

        Args:
            code: Authorization code from Google
            redirect_uri: Redirect URI used in auth request

        Returns:
            Token object with access and refresh tokens
        """
        # Exchange code for Google tokens
        google_tokens = await self.exchange_code_for_tokens(code, redirect_uri)
        google_access_token = google_tokens.get("access_token")

        if not google_access_token:
            raise AuthenticationError("No access token received from Google")

        # Get user info from Google
        user_info = await self.get_user_info(google_access_token)

        google_id = user_info.get("id")
        email = user_info.get("email")
        name = user_info.get("name", "")
        picture = user_info.get("picture")

        if not email:
            raise AuthenticationError("Email not provided by Google")

        # Find or create user
        user = self._find_or_create_user(
            google_id=google_id,
            email=email,
            name=name,
            picture=picture,
        )

        # Update last login
        user.last_login = datetime.now(timezone.utc)
        self.db.commit()

        # Generate JWT tokens
        access_token = create_access_token(
            subject=user.id,
            additional_claims={"role": user.role.value},
        )
        refresh_token = create_refresh_token(subject=user.id)

        return Token(
            access_token=access_token,
            refresh_token=refresh_token,
        )

    def _find_or_create_user(
        self,
        google_id: str,
        email: str,
        name: str,
        picture: Optional[str] = None,
    ) -> User:
        """
        Find existing user or create new one from Google data.

        Args:
            google_id: Google user ID
            email: User email
            name: User full name
            picture: Profile picture URL

        Returns:
            User object
        """
        # First try to find by Google OAuth ID
        user = (
            self.db.query(User)
            .filter(
                User.auth_provider == "google",
                User.oauth_id == google_id,
            )
            .first()
        )

        if user:
            # Update profile picture if changed
            if picture and user.avatar_url != picture:
                user.avatar_url = picture
                self.db.commit()
            return user

        # Try to find by email (might be existing local user)
        user = self.db.query(User).filter(User.email == email.lower()).first()

        if user:
            # Link existing account to Google
            if user.auth_provider == "local":
                # User already has local account, link Google
                user.oauth_id = google_id
                user.auth_provider = "google"
                if picture:
                    user.avatar_url = picture
                user.is_verified = True  # Google accounts are verified
                self.db.commit()
            return user

        # Create new user
        user = User(
            email=email.lower(),
            full_name=name or email.split("@")[0],
            hashed_password=None,  # No password for OAuth users
            auth_provider="google",
            oauth_id=google_id,
            avatar_url=picture,
            role=UserRole.PEMBELI,
            is_active=True,
            is_verified=True,  # Google accounts are verified
        )

        self.db.add(user)
        self.db.commit()
        self.db.refresh(user)

        return user

