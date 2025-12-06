"""
Unit tests for Authentication Service.
Tests for user registration, login, and token management.
"""
import pytest
from datetime import datetime, timedelta, timezone
from unittest.mock import patch, MagicMock

from sqlalchemy.orm import Session

from app.models.user import User, UserRole
from app.services.auth_service import AuthService
from app.core.security import get_password_hash, verify_password
from app.core.exceptions import (
    AuthenticationError,
    DuplicateError,
    NotFoundError,
    ValidationError,
)
from app.schemas.auth import LoginRequest, RegisterRequest


class TestAuthService:
    """Tests for AuthService class."""
    
    def test_register_new_user(self, db: Session):
        """Test registering a new user."""
        auth_service = AuthService(db)
        
        with patch.object(auth_service, '_send_verification_email'):
            register_data = RegisterRequest(
                email="newuser@test.com",
                password="SecurePass123!",
                full_name="New User",
            )
            
            user = auth_service.register(register_data)
            
            assert user is not None
            assert user.email == "newuser@test.com"
            assert user.full_name == "New User"
            assert user.role == UserRole.PEMBELI
            assert user.is_active == True
    
    def test_register_duplicate_email(self, db: Session, test_user: User):
        """Test that registering with duplicate email fails."""
        auth_service = AuthService(db)
        
        register_data = RegisterRequest(
            email=test_user.email,  # Already exists
            password="AnotherPass123!",
            full_name="Duplicate User",
        )
        
        with pytest.raises(DuplicateError):
            auth_service.register(register_data)
    
    def test_login_success(self, db: Session, test_user: User):
        """Test successful login."""
        auth_service = AuthService(db)
        
        # Need to update the user's password to a known value
        test_user.hashed_password = get_password_hash("testpassword123")
        db.commit()
        
        login_data = LoginRequest(
            email=test_user.email,
            password="testpassword123",
        )
        
        result = auth_service.login(login_data)
        
        assert result is not None
        assert result.access_token is not None
        assert result.refresh_token is not None
        assert result.token_type == "bearer"
    
    def test_login_wrong_password(self, db: Session, test_user: User):
        """Test login with wrong password."""
        auth_service = AuthService(db)
        
        login_data = LoginRequest(
            email=test_user.email,
            password="wrongpassword",
        )
        
        with pytest.raises(AuthenticationError):
            auth_service.login(login_data)
    
    def test_login_user_not_found(self, db: Session):
        """Test login with non-existent user."""
        auth_service = AuthService(db)
        
        login_data = LoginRequest(
            email="nonexistent@test.com",
            password="anypassword",
        )
        
        with pytest.raises(AuthenticationError):
            auth_service.login(login_data)
    
    def test_login_inactive_user(self, db: Session, test_user: User):
        """Test login with inactive user account."""
        auth_service = AuthService(db)
        
        # Deactivate user
        test_user.is_active = False
        test_user.hashed_password = get_password_hash("testpassword123")
        db.commit()
        
        login_data = LoginRequest(
            email=test_user.email,
            password="testpassword123",
        )
        
        with pytest.raises(AuthenticationError):
            auth_service.login(login_data)
    
    def test_get_user_by_email(self, db: Session, test_user: User):
        """Test getting a user by email."""
        auth_service = AuthService(db)
        
        user = auth_service.get_user_by_email(test_user.email)
        
        assert user is not None
        assert user.id == test_user.id
        assert user.email == test_user.email
    
    def test_get_user_by_email_not_found(self, db: Session):
        """Test getting a non-existent user by email raises NotFoundError."""
        auth_service = AuthService(db)
        
        with pytest.raises(NotFoundError):
            auth_service.get_user_by_email("nonexistent@test.com")
    
    def test_change_password(self, db: Session, test_user: User):
        """Test changing user password."""
        auth_service = AuthService(db)
        
        old_password = "testpassword123"
        new_password = "NewSecurePass456!"
        
        # Set known password
        test_user.hashed_password = get_password_hash(old_password)
        db.commit()
        
        # Should not raise exception
        auth_service.change_password(
            test_user, old_password, new_password
        )
        
        assert verify_password(new_password, test_user.hashed_password)
    
    def test_change_password_wrong_old_password(self, db: Session, test_user: User):
        """Test changing password with wrong old password."""
        auth_service = AuthService(db)
        
        test_user.hashed_password = get_password_hash("correctpassword")
        db.commit()
        
        with pytest.raises(ValidationError):
            auth_service.change_password(
                test_user, "wrongpassword", "newpassword"
            )
    
    def test_request_password_reset(self, db: Session, test_user: User):
        """Test requesting password reset."""
        auth_service = AuthService(db)
        
        # Ensure user is local auth provider
        test_user.auth_provider = "local"
        db.commit()
        
        with patch.object(auth_service, '_send_reset_email') as mock_send:
            # Should not raise exception
            auth_service.request_password_reset(test_user.email)
            
            db.refresh(test_user)
            # The _send_reset_email method sets reset_token_hash
            # Since we patched it, token was set before the mock was called
            assert mock_send.called
    
    def test_request_password_reset_user_not_found(self, db: Session):
        """Test requesting password reset for non-existent user."""
        auth_service = AuthService(db)
        
        # Should not raise error (security: don't reveal if email exists)
        auth_service.request_password_reset("nonexistent@test.com")
        # Method returns None (does nothing for non-existent users)
    
    def test_verify_email_token(self, db: Session, test_user: User):
        """Test email verification with valid token."""
        auth_service = AuthService(db)
        
        # Set up verification token
        raw_token = "test_verification_token"
        hashed_token = auth_service._hash_token(raw_token)
        test_user.verification_token = hashed_token
        test_user.verification_token_expires_at = datetime.now(timezone.utc) + timedelta(hours=1)
        test_user.is_verified = False
        db.commit()
        
        # Should not raise exception
        auth_service.confirm_verification(raw_token)
        
        db.refresh(test_user)
        assert test_user.is_verified == True
        assert test_user.verification_token is None
    
    def test_verify_email_expired_token(self, db: Session, test_user: User):
        """Test email verification with expired token."""
        auth_service = AuthService(db)
        
        # Set up expired token
        raw_token = "expired_token"
        hashed_token = auth_service._hash_token(raw_token)
        test_user.verification_token = hashed_token
        test_user.verification_token_expires_at = datetime.now(timezone.utc) - timedelta(hours=1)
        test_user.is_verified = False
        db.commit()
        
        with pytest.raises(ValidationError):
            auth_service.confirm_verification(raw_token)


class TestPasswordSecurity:
    """Tests for password security features."""
    
    def test_password_is_hashed(self, db: Session):
        """Test that passwords are properly hashed."""
        plain_password = "MySecurePassword123!"
        hashed = get_password_hash(plain_password)
        
        # Hash should be different from plain password
        assert hashed != plain_password
        # Hash should be verifiable
        assert verify_password(plain_password, hashed)
    
    def test_different_passwords_different_hashes(self):
        """Test that different passwords produce different hashes."""
        hash1 = get_password_hash("Password1")
        hash2 = get_password_hash("Password2")
        
        assert hash1 != hash2
    
    def test_same_password_different_hashes(self):
        """Test that same password produces different hashes (salt)."""
        password = "SamePassword123!"
        hash1 = get_password_hash(password)
        hash2 = get_password_hash(password)
        
        # Hashes should be different due to salt
        assert hash1 != hash2
        # But both should verify correctly
        assert verify_password(password, hash1)
        assert verify_password(password, hash2)
    
    def test_verify_wrong_password(self):
        """Test that wrong password fails verification."""
        hashed = get_password_hash("CorrectPassword")
        
        assert verify_password("WrongPassword", hashed) == False


class TestTokenGeneration:
    """Tests for JWT token generation."""
    
    def test_access_token_contains_user_info(self, db: Session, test_user: User):
        """Test that access token contains user information."""
        from app.core.security import create_access_token, decode_token
        
        token = create_access_token(
            subject=test_user.id,
            additional_claims={"role": test_user.role.value},
        )
        
        payload = decode_token(token)
        
        assert payload is not None
        assert payload.get("sub") == test_user.id
        assert payload.get("role") == test_user.role.value
    
    def test_refresh_token_generation(self, db: Session, test_user: User):
        """Test refresh token generation."""
        from app.core.security import create_refresh_token, decode_token
        
        token = create_refresh_token(subject=test_user.id)
        
        payload = decode_token(token)
        
        assert payload is not None
        assert payload.get("sub") == test_user.id
        assert payload.get("type") == "refresh"
