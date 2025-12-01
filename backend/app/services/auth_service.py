"""
Authentication service for user login, registration, and token management.
"""
from datetime import datetime, timezone

from sqlalchemy.orm import Session

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


class AuthService:
    """Service for handling authentication operations."""
    
    def __init__(self, db: Session):
        self.db = db
    
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
        self.db.commit()
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
        
        # Verify password
        if not verify_password(data.password, user.hashed_password):
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
