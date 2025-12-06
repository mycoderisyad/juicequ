"""
Application configuration using pydantic-settings.
All sensitive values are loaded from environment variables.
"""

import logging
import os
import secrets
from functools import lru_cache
from typing import Literal

from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

logger = logging.getLogger(__name__)


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    # Application
    app_name: str = "JuiceQu API"
    app_version: str = "1.0.0"
    app_env: Literal["development", "staging", "production"] = "development"
    debug: bool = True

    # Database
    database_url: str = ""

    # Security
    secret_key: str = ""

    # JWT Authentication
    access_token_expire_minutes: int = 30
    refresh_token_expire_days: int = 7

    # CORS
    cors_origins: str = ""

    # Kolosal AI
    kolosal_api_key: str = ""
    kolosal_api_base: str = ""
    kolosal_model: str = ""

    # Google Gemini AI (for image generation)
    gemini_api_key: str = ""

    # Google Cloud (only for Speech-to-Text, optional)
    gcp_project_id: str = ""
    gcp_speech_credentials: str = ""

    # ChromaDB (for RAG)
    chroma_persist_directory: str = "./chroma_data"

    # ExchangeRate API (optional - can be set in admin panel)
    exchangerate_api_key: str = ""

    # Google OAuth
    google_client_id: str = ""
    google_client_secret: str = ""
    google_redirect_uri: str = "http://localhost:3000/api/auth/google/callback"

    # Local File Storage (VPS-based storage)
    # Files are stored on the same server as the application
    upload_base_path: str = "./uploads"  # Path to uploads directory
    upload_max_size_mb: int = 10  # Maximum file size in MB
    upload_allowed_extensions: str = "jpg,jpeg,png,webp,gif"  # Comma-separated
    
    # Email
    smtp_host: str = ""
    smtp_port: int = 587
    smtp_username: str = ""
    smtp_password: str = ""
    smtp_from_email: str = ""
    smtp_from_name: str = "JuiceQu"
    smtp_use_tls: bool = True
    smtp_use_ssl: bool = False
    
    # Frontend
    frontend_url: str = "http://localhost:3000"
    
    # Tokens
    verification_token_expire_minutes: int = 60 * 24  # 24 hours
    reset_token_expire_minutes: int = 60  # 1 hour

    @property
    def cors_origins_list(self) -> list[str]:
        """Parse CORS origins from comma-separated string."""
        return [origin.strip() for origin in self.cors_origins.split(",")]

    @property
    def is_sqlite(self) -> bool:
        """Check if using SQLite database."""
        return self.database_url.startswith("sqlite")

    @property
    def upload_allowed_extensions_list(self) -> list[str]:
        """Parse allowed extensions from comma-separated string."""
        return [ext.strip().lower() for ext in self.upload_allowed_extensions.split(",")]

    @property
    def upload_max_size_bytes(self) -> int:
        """Get max upload size in bytes."""
        return self.upload_max_size_mb * 1024 * 1024

    @field_validator("secret_key", mode="before")
    @classmethod
    def validate_secret_key(cls, v: str) -> str:
        """Validate secret key is set and secure."""
        # Get app_env from environment since we can't access other fields in validator
        app_env = os.getenv("APP_ENV", "development").lower()
        
        if not v:
            # In production, require explicit secret key
            if app_env == "production":
                raise ValueError("SECRET_KEY environment variable must be set in production")
            else:
                # Auto-generate for development only
                generated_key = secrets.token_urlsafe(32)
                logger.warning(
                    "⚠️ Using auto-generated SECRET_KEY - NOT FOR PRODUCTION! "
                    "Set SECRET_KEY environment variable for production deployments."
                )
                return generated_key
        
        if len(v) < 32:
            raise ValueError("SECRET_KEY must be at least 32 characters")
        
        # Check for common weak/placeholder keys
        weak_keys = [
            "your-super-secret-key",
            "change-me",
            "changeme",
            "secret",
            "password",
            "your-secret-key",
            "secret-key",
            "secretkey",
            "my-secret-key",
            "mysecretkey",
            "replace-this",
            "placeholder",
            "example-key",
        ]
        if v.lower() in weak_keys or v.lower().startswith("your-"):
            if app_env == "production":
                raise ValueError(
                    "SECRET_KEY is too weak. Use a cryptographically random key. "
                    "Generate one with: python -c 'import secrets; print(secrets.token_urlsafe(32))'"
                )
            else:
                logger.warning(
                    "⚠️ SECRET_KEY appears to be a placeholder. "
                    "Please set a strong secret key for production."
                )
        
        return v


@lru_cache
def get_settings() -> Settings:
    """Get cached settings instance."""
    return Settings()


settings = get_settings()
