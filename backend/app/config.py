"""
Application configuration using pydantic-settings.
All sensitive values are loaded from environment variables.
"""

from functools import lru_cache
from typing import Literal

from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


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

    # Google Cloud
    gcp_project_id: str = ""
    gcp_speech_credentials: str = ""

    # ChromaDB (for RAG)
    chroma_persist_directory: str = "./chroma_data"

    # ExchangeRate API (optional - can be set in admin panel)
    exchangerate_api_key: str = ""

    # Upload storage (development: local filesystem, production: cloud storage)
    upload_storage_type: Literal["local", "gcs", "s3"] = "local"
    upload_base_path: str = ""  # For local storage, path to frontend/public/images/products
    gcs_bucket_name: str = ""  # For Google Cloud Storage
    s3_bucket_name: str = ""  # For AWS S3

    @property
    def cors_origins_list(self) -> list[str]:
        """Parse CORS origins from comma-separated string."""
        return [origin.strip() for origin in self.cors_origins.split(",")]

    @property
    def is_sqlite(self) -> bool:
        """Check if using SQLite database."""
        return self.database_url.startswith("sqlite")

    @field_validator("secret_key")
    @classmethod
    def validate_secret_key(cls, v: str) -> str:
        """Validate secret key is set and has minimum length."""
        if not v:
            raise ValueError("SECRET_KEY environment variable must be set")
        if len(v) < 32:
            raise ValueError("SECRET_KEY must be at least 32 characters")
        return v


@lru_cache
def get_settings() -> Settings:
    """Get cached settings instance."""
    return Settings()


settings = get_settings()
