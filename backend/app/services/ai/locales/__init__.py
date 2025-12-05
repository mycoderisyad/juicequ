"""
Locale configurations for AI services.
Supports multiple languages for STT, LLM prompts, and responses.
"""
from .config import (
    SUPPORTED_LOCALES,
    DEFAULT_LOCALE,
    get_locale_config,
    get_stt_language_code,
    get_system_prompt,
    get_fallback_message,
    LocaleConfig,
)

__all__ = [
    "SUPPORTED_LOCALES",
    "DEFAULT_LOCALE",
    "get_locale_config",
    "get_stt_language_code",
    "get_system_prompt",
    "get_fallback_message",
    "LocaleConfig",
]

