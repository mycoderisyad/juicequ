"""Application configuration using pydantic-settings."""
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

    # Database (PostgreSQL only)
    database_url: str = ""

    # Redis (Conversation Memory)
    redis_url: str = "redis://localhost:6379/0"

    # Security
    secret_key: str = ""

    # JWT Authentication
    access_token_expire_minutes: int = 30
    refresh_token_expire_days: int = 7

    # CORS
    cors_origins: str = ""

    # Google Gemini AI (primary provider)
    gemini_api_key: str = ""

    # OpenRouter AI (fallback provider)
    openrouter_api_key: str = ""
    openrouter_model: str = "mistralai/mistral-7b-instruct"

    # ChromaDB (for RAG)
    chroma_persist_directory: str = "./chroma_data"

    # ExchangeRate API (optional)
    exchangerate_api_key: str = ""

    # Google OAuth
    google_client_id: str = ""
    google_client_secret: str = ""
    google_redirect_uri: str = "http://localhost:3000/api/auth/google/callback"

    # Upload
    upload_base_path: str = "./uploads"
    upload_max_size_mb: int = 10
    upload_allowed_extensions: str = "jpg,jpeg,png,webp,gif"

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
    verification_token_expire_minutes: int = 1440
    reset_token_expire_minutes: int = 60

    @property
    def cors_origins_list(self) -> list[str]:
        """Parse CORS origins from comma-separated string."""
        if not self.cors_origins:
            return []
        return [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]

    @property
    def upload_allowed_extensions_list(self) -> list[str]:
        """Parse allowed extensions from comma-separated string."""
        return [ext.strip().lower() for ext in self.upload_allowed_extensions.split(",")]

    @property
    def upload_max_size_bytes(self) -> int:
        """Get max upload size in bytes."""
        return self.upload_max_size_mb * 1024 * 1024

    @field_validator("database_url", mode="before")
    @classmethod
    def validate_database_url(cls, v: str) -> str:
        """Validate database URL is PostgreSQL."""
        app_env = os.getenv("APP_ENV", "development").lower()
        if not v:
            if app_env == "production":
                raise ValueError("DATABASE_URL must be set in production")
            return "postgresql://postgres:postgres@localhost:5432/juicequ"
        if not v.startswith("postgresql"):
            raise ValueError("Only PostgreSQL is supported. DATABASE_URL must start with 'postgresql://'")
        return v

    @field_validator("secret_key", mode="before")
    @classmethod
    def validate_secret_key(cls, v: str) -> str:
        """Validate secret key is set and secure."""
        app_env = os.getenv("APP_ENV", "development").lower()

        if not v:
            if app_env == "production":
                raise ValueError("SECRET_KEY environment variable must be set in production")
            generated_key = secrets.token_urlsafe(32)
            logger.warning(
                "Using auto-generated SECRET_KEY - NOT FOR PRODUCTION! "
                "Set SECRET_KEY environment variable for production deployments."
            )
            return generated_key

        if len(v) < 32:
            raise ValueError("SECRET_KEY must be at least 32 characters")

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
            logger.warning(
                "SECRET_KEY appears to be a placeholder. "
                "Please set a strong secret key for production."
            )

        return v


@lru_cache
def get_settings() -> Settings:
    """Get cached settings instance."""
    return Settings()


settings = get_settings()
