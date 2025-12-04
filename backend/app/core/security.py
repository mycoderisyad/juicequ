"""
Security utilities for password hashing and JWT token management.
"""
import hashlib
from datetime import datetime, timedelta, timezone
from typing import Any

from jose import JWTError, jwt
from passlib.context import CryptContext

from app.config import settings

# Password hashing context using bcrypt
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# JWT Token settings
ALGORITHM = "HS256"

# Maximum raw password length before SHA256 preprocessing
# bcrypt has a 72-byte limit, but we use SHA256 to handle any length
MAX_PASSWORD_LENGTH = 1000  # Reasonable limit to prevent DoS


def _preprocess_password(password: str) -> str:
    """
    Preprocess password using SHA256 to handle any length securely.
    
    bcrypt has a 72-byte limit which can cause security issues:
    - Passwords longer than 72 bytes get truncated silently
    - Two different passwords could hash to the same value if they share the first 72 bytes
    
    By using SHA256 first, we:
    1. Support passwords of any length
    2. Ensure the full password affects the hash
    3. Still benefit from bcrypt's slow hashing
    
    Args:
        password: Raw password string
        
    Returns:
        SHA256 hex digest of the password (64 characters, well under 72 bytes)
    """
    return hashlib.sha256(password.encode('utf-8')).hexdigest()


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """
    Verify a plain password against a hashed password.
    
    Args:
        plain_password: The plain text password to verify
        hashed_password: The bcrypt hashed password to verify against
        
    Returns:
        True if password matches, False otherwise
    """
    if not plain_password or not hashed_password:
        return False
    
    # Enforce maximum password length to prevent DoS
    if len(plain_password) > MAX_PASSWORD_LENGTH:
        return False
    
    # Preprocess with SHA256 before bcrypt verification
    preprocessed = _preprocess_password(plain_password)
    return pwd_context.verify(preprocessed, hashed_password)


def get_password_hash(password: str) -> str:
    """
    Hash a password using SHA256 + bcrypt.
    
    Args:
        password: Plain text password to hash
        
    Returns:
        bcrypt hash of the SHA256-preprocessed password
        
    Raises:
        ValueError: If password exceeds maximum length
    """
    if not password:
        raise ValueError("Password cannot be empty")
    
    # Enforce maximum password length to prevent DoS
    if len(password) > MAX_PASSWORD_LENGTH:
        raise ValueError(f"Password exceeds maximum length of {MAX_PASSWORD_LENGTH} characters")
    
    # Preprocess with SHA256 before bcrypt hashing
    preprocessed = _preprocess_password(password)
    return pwd_context.hash(preprocessed)


def create_access_token(
    subject: str | int,
    expires_delta: timedelta | None = None,
    additional_claims: dict[str, Any] | None = None,
) -> str:
    """
    Create a JWT access token.
    
    Args:
        subject: The subject of the token (usually user ID)
        expires_delta: Optional custom expiration time
        additional_claims: Optional additional claims to include
    
    Returns:
        Encoded JWT token string
    """
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(
            minutes=settings.access_token_expire_minutes
        )
    
    to_encode: dict[str, Any] = {
        "exp": expire,
        "sub": str(subject),
        "iat": datetime.now(timezone.utc),
    }
    
    if additional_claims:
        to_encode.update(additional_claims)
    
    return jwt.encode(to_encode, settings.secret_key, algorithm=ALGORITHM)


def create_refresh_token(
    subject: str | int,
    expires_delta: timedelta | None = None,
) -> str:
    """
    Create a JWT refresh token.
    
    Args:
        subject: The subject of the token (usually user ID)
        expires_delta: Optional custom expiration time
    
    Returns:
        Encoded JWT refresh token string
    """
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(
            days=settings.refresh_token_expire_days
        )
    
    to_encode = {
        "exp": expire,
        "sub": str(subject),
        "iat": datetime.now(timezone.utc),
        "type": "refresh",
    }
    
    return jwt.encode(to_encode, settings.secret_key, algorithm=ALGORITHM)


def decode_token(token: str) -> dict[str, Any] | None:
    """
    Decode and verify a JWT token.
    
    Args:
        token: The JWT token to decode
    
    Returns:
        Decoded token payload or None if invalid
    """
    try:
        payload = jwt.decode(token, settings.secret_key, algorithms=[ALGORITHM])
        return payload
    except JWTError:
        return None


def verify_token(token: str, token_type: str = "access") -> str | None:
    """
    Verify a JWT token and return the subject.
    
    Args:
        token: The JWT token to verify
        token_type: Expected token type ("access" or "refresh")
    
    Returns:
        Subject (user ID) if valid, None otherwise
    """
    payload = decode_token(token)
    if payload is None:
        return None
    
    # Check token type for refresh tokens
    if token_type == "refresh" and payload.get("type") != "refresh":
        return None
    
    return payload.get("sub")
