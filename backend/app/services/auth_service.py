"""
Authentication service for user login, registration, and token management.
"""
import hashlib
import secrets
from datetime import datetime, timedelta, timezone

from sqlalchemy.orm import Session

from app.config import settings
from app.core.exceptions import (
    AuthenticationError,
    DuplicateError,
    NotFoundError,
    ValidationError,
)
from app.core.security import (
    create_access_token,
    create_refresh_token,
    get_password_hash,
    verify_password,
    verify_token,
)
from app.models.user import User, UserRole
from app.schemas.auth import LoginRequest, RegisterRequest, Token
from app.services.email_service import EmailService


class AuthService:
    """Service for handling authentication operations."""
    
    def __init__(self, db: Session):
        self.db = db
        self.email_service = EmailService()
    
    @staticmethod
    def _hash_token(token: str) -> str:
        """Hash token using SHA256 for storage."""
        return hashlib.sha256(token.encode("utf-8")).hexdigest()
    
    @staticmethod
    def _generate_token(expire_minutes: int) -> tuple[str, str, datetime]:
        """Generate raw token, hashed token, and expiry."""
        raw_token = secrets.token_urlsafe(32)
        hashed_token = AuthService._hash_token(raw_token)
        expires_at = datetime.now(timezone.utc) + timedelta(minutes=expire_minutes)
        return raw_token, hashed_token, expires_at
    
    @staticmethod
    def _build_link(path: str, token: str) -> str:
        """Build absolute link for email actions."""
        base_url = settings.frontend_url.rstrip("/")
        return f"{base_url}{path}?token={token}"
    
    def _send_verification_email(self, user: User) -> None:
        """Prepare and send verification email."""
        raw_token, hashed_token, expires_at = self._generate_token(
            settings.verification_token_expire_minutes
        )
        user.verification_token = hashed_token
        user.verification_token_expires_at = expires_at
        
        verify_link = self._build_link("/verify-email", raw_token)
        html_body = (
            f"<p>Hello {user.full_name},</p>"
            "<p>Please verify your email address to activate your JuiceQu account.</p>"
            f'<p><a href="{verify_link}">Verify Email</a></p>'
            f"<p>This link expires in {settings.verification_token_expire_minutes // 60} "
            "hour(s). If you did not create an account, you can ignore this email.</p>"
        )
        text_body = (
            f"Hello {user.full_name},\n\n"
            "Please verify your email address to activate your JuiceQu account.\n"
            f"Verification link: {verify_link}\n\n"
            "If you did not create an account, you can ignore this email."
        )
        
        self.email_service.send_email(
            recipient=user.email,
            subject="Verify your JuiceQu email",
            html_body=html_body,
            text_body=text_body,
        )
    
    def _send_reset_email(self, user: User) -> None:
        """Prepare and send password reset email."""
        raw_token, hashed_token, expires_at = self._generate_token(
            settings.reset_token_expire_minutes
        )
        user.reset_token_hash = hashed_token
        user.reset_token_expires_at = expires_at
        
        reset_link = self._build_link("/reset-password", raw_token)
        html_body = (
            f"<p>Hello {user.full_name},</p>"
            "<p>We received a request to reset your JuiceQu password.</p>"
            f'<p><a href="{reset_link}">Reset Password</a></p>'
            f"<p>This link expires in {settings.reset_token_expire_minutes} minutes. "
            "If you did not request this, you can ignore this email.</p>"
        )
        text_body = (
            f"Hello {user.full_name},\n\n"
            "We received a request to reset your JuiceQu password.\n"
            f"Reset link: {reset_link}\n\n"
            "If you did not request this, you can ignore this email."
        )
        
        self.email_service.send_email(
            recipient=user.email,
            subject="Reset your JuiceQu password",
            html_body=html_body,
            text_body=text_body,
        )
    
    def register(self, data: RegisterRequest) -> User:
        """
        Register a new user.
        
        Args:
            data: Registration data including email, password, name
        
        Returns:
            Created User object
        
        Raises:
            DuplicateError: If email already exists
        """
        # Check if email exists
        existing_user = self.db.query(User).filter(
            User.email == data.email.lower()
        ).first()
        
        if existing_user:
            raise DuplicateError("User with this email already exists")
        
        # Create new user
        user = User(
            email=data.email.lower(),
            hashed_password=get_password_hash(data.password),
            full_name=data.full_name,
            phone_number=data.phone_number,
            role=UserRole.PEMBELI,
            is_active=True,
            is_verified=False,
        )
        
        self.db.add(user)
        self.db.flush()
        
        try:
            self._send_verification_email(user)
            self.db.commit()
        except Exception as exc:
            self.db.rollback()
            raise ValidationError("Failed to send verification email") from exc
        
        self.db.refresh(user)
        
        return user
    
    def login(self, data: LoginRequest) -> Token:
        """
        Authenticate user and return tokens.
        
        Args:
            data: Login credentials (email, password)
        
        Returns:
            Token object with access and refresh tokens
        
        Raises:
            AuthenticationError: If credentials are invalid
        """
        # Find user by email
        user = self.db.query(User).filter(
            User.email == data.email.lower()
        ).first()
        
        if not user:
            raise AuthenticationError("Invalid email or password")
        
        # Check if user uses OAuth (no password)
        if user.auth_provider != "local":
            raise AuthenticationError(
                f"This account uses {user.auth_provider} login. "
                "Please use the appropriate login method."
            )
        
        # Verify password
        if not user.hashed_password or not verify_password(data.password, user.hashed_password):
            raise AuthenticationError("Invalid email or password")
        
        # Check if user is active
        if not user.is_active:
            raise AuthenticationError("User account is deactivated")
        
        # Update last login
        user.last_login = datetime.now(timezone.utc)
        self.db.commit()
        
        # Generate tokens
        access_token = create_access_token(
            subject=user.id,
            additional_claims={"role": user.role.value},
        )
        refresh_token = create_refresh_token(subject=user.id)
        
        return Token(
            access_token=access_token,
            refresh_token=refresh_token,
        )
    
    def refresh_token(self, refresh_token: str) -> Token:
        """
        Refresh access token using refresh token.
        
        Args:
            refresh_token: Valid refresh token
        
        Returns:
            New Token object
        
        Raises:
            AuthenticationError: If refresh token is invalid
        """
        # Verify refresh token
        user_id = verify_token(refresh_token, token_type="refresh")
        if not user_id:
            raise AuthenticationError("Invalid or expired refresh token")
        
        # Get user
        user = self.db.query(User).filter(User.id == user_id).first()
        if not user or not user.is_active:
            raise AuthenticationError("User not found or inactive")
        
        # Generate new tokens
        access_token = create_access_token(
            subject=user.id,
            additional_claims={"role": user.role.value},
        )
        new_refresh_token = create_refresh_token(subject=user.id)
        
        return Token(
            access_token=access_token,
            refresh_token=new_refresh_token,
        )
    
    def get_user_by_id(self, user_id: str) -> User:
        """
        Get user by ID.
        
        Args:
            user_id: User UUID
        
        Returns:
            User object
        
        Raises:
            NotFoundError: If user not found
        """
        user = self.db.query(User).filter(User.id == user_id).first()
        if not user:
            raise NotFoundError("User not found")
        return user
    
    def get_user_by_email(self, email: str) -> User:
        """
        Get user by email.
        
        Args:
            email: User email
        
        Returns:
            User object
        
        Raises:
            NotFoundError: If user not found
        """
        user = self.db.query(User).filter(
            User.email == email.lower()
        ).first()
        if not user:
            raise NotFoundError("User not found")
        return user
    
    def change_password(
        self,
        user: User,
        current_password: str,
        new_password: str,
    ) -> None:
        """
        Change user password.
        
        Args:
            user: User object
            current_password: Current password for verification
            new_password: New password to set
        
        Raises:
            ValidationError: If current password is incorrect
        """
        if not verify_password(current_password, user.hashed_password):
            raise ValidationError("Current password is incorrect")
        
        user.hashed_password = get_password_hash(new_password)
        self.db.commit()
    
    def request_password_reset(self, email: str) -> None:
        """Request a password reset link."""
        user = self.db.query(User).filter(User.email == email.lower()).first()
        
        # Avoid leaking whether the email exists or uses OAuth
        if not user or user.auth_provider != "local":
            return
        
        try:
            self._send_reset_email(user)
            self.db.commit()
        except Exception as exc:
            self.db.rollback()
            raise ValidationError("Failed to send password reset email") from exc
    
    def reset_password(self, token: str, new_password: str) -> None:
        """Reset password using a reset token."""
        hashed_token = self._hash_token(token)
        now = datetime.now(timezone.utc)
        
        user = self.db.query(User).filter(
            User.reset_token_hash == hashed_token,
            User.reset_token_expires_at != None,  # noqa: E711
            User.reset_token_expires_at >= now,
        ).first()
        
        if not user:
            raise ValidationError("Invalid or expired reset token")
        
        user.hashed_password = get_password_hash(new_password)
        user.reset_token_hash = None
        user.reset_token_expires_at = None
        self.db.commit()
    
    def send_verification(self, email: str) -> None:
        """Send verification email for the provided address."""
        user = self.db.query(User).filter(User.email == email.lower()).first()
        
        # Avoid leaking whether the email exists
        if not user:
            return
        
        if user.is_verified:
            raise ValidationError("Email is already verified")
        
        try:
            self._send_verification_email(user)
            self.db.commit()
        except Exception as exc:
            self.db.rollback()
            raise ValidationError("Failed to send verification email") from exc
    
    def confirm_verification(self, token: str) -> None:
        """Confirm email verification using token."""
        hashed_token = self._hash_token(token)
        now = datetime.now(timezone.utc)
        
        user = self.db.query(User).filter(
            User.verification_token == hashed_token,
            User.verification_token_expires_at != None,  # noqa: E711
            User.verification_token_expires_at >= now,
        ).first()
        
        if not user:
            raise ValidationError("Invalid or expired verification token")
        
        user.is_verified = True
        user.verification_token = None
        user.verification_token_expires_at = None
        self.db.commit()
