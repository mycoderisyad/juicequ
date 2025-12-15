"""LLM Provider abstraction with auto-fallback."""
import logging
from typing import Any

from app.services.ai.gemini_client import GeminiClient
from app.services.ai.openrouter_client import OpenRouterClient

logger = logging.getLogger(__name__)


class LLMProvider:
    """
    Abstraction layer for LLM providers.
    Uses Gemini as primary and OpenRouter as fallback.
    """

    def __init__(self):
        self.gemini = GeminiClient()
        self.openrouter = OpenRouterClient()

    @property
    def primary_available(self) -> bool:
        """Check if primary provider (Gemini) is available."""
        return self.gemini.is_available

    @property
    def fallback_available(self) -> bool:
        """Check if fallback provider (OpenRouter) is available."""
        return self.openrouter.is_available

    @property
    def any_available(self) -> bool:
        """Check if any provider is available."""
        return self.primary_available or self.fallback_available

    async def chat_completion(
        self,
        messages: list[dict[str, str]],
        temperature: float = 0.7,
        max_tokens: int = 500,
        use_fallback_on_error: bool = True,
    ) -> dict[str, Any]:
        """
        Send chat completion request with auto-fallback.

        Args:
            messages: List of message dicts with 'role' and 'content'
            temperature: Sampling temperature (0-1)
            max_tokens: Maximum tokens in response
            use_fallback_on_error: If True, try fallback on primary failure

        Returns:
            Response dict with 'content' key
        """
        if self.primary_available:
            result = await self.gemini.chat_completion(messages, temperature, max_tokens)

            if result.get("content") and not result.get("error"):
                result["provider"] = "gemini"
                return result

            if use_fallback_on_error:
                logger.warning("Gemini failed, trying OpenRouter fallback")

        if self.fallback_available:
            result = await self.openrouter.chat_completion(messages, temperature, max_tokens)
            result["provider"] = "openrouter"
            return result

        logger.error("No LLM provider available")
        return self._fallback_response(messages)

    async def transcribe_audio(
        self,
        audio_data: bytes,
        language: str = "id",
    ) -> dict[str, Any]:
        """Transcribe audio using Gemini (STT only available on Gemini)."""
        if not self.primary_available:
            return {"transcription": "", "error": "Gemini not available for STT"}

        return await self.gemini.transcribe_audio(audio_data, language)

    async def transcribe_and_parse_voice_command(
        self,
        audio_data: bytes,
        products_context: str,
        language: str = "id",
    ) -> dict[str, Any]:
        """Transcribe and parse voice command in one request."""
        if not self.primary_available:
            return {"error": "Gemini not available for voice commands"}

        return await self.gemini.transcribe_and_parse_voice_command(
            audio_data, products_context, language
        )

    async def generate_image(
        self,
        prompt: str,
        reference_image: bytes | None = None,
    ) -> bytes | None:
        """Generate image using Gemini (image gen only available on Gemini)."""
        if not self.primary_available:
            logger.error("Gemini not available for image generation")
            return None

        return await self.gemini.generate_image(prompt, reference_image)

    async def generate_photobooth(
        self,
        user_image_data: bytes,
        product_name: str,
    ) -> bytes | None:
        """Generate photobooth image."""
        if not self.primary_available:
            logger.error("Gemini not available for photobooth")
            return None

        return await self.gemini.generate_photobooth(user_image_data, product_name)

    def _fallback_response(self, messages: list[dict[str, str]]) -> dict[str, Any]:
        """Generate fallback response when no AI is available."""
        user_message = ""
        for msg in messages:
            if msg.get("role") == "user":
                user_message = msg.get("content", "").lower()
                break

        responses = {
            "greeting": "Halo! Selamat datang di JuiceQu! Apa yang bisa saya bantu hari ini?",
            "recommend": "Untuk rekomendasi, kami sarankan mencoba Berry Blast atau Tropical Paradise!",
            "price": "Harga jus kami mulai dari Rp 15.000. Silakan cek menu untuk harga lengkap!",
            "health": "Semua produk kami dibuat dari buah segar tanpa pengawet!",
            "default": "Terima kasih sudah menghubungi JuiceQu! Ada yang bisa saya bantu?",
        }

        if any(word in user_message for word in ["halo", "hai", "hi", "hello"]):
            return {"content": responses["greeting"], "provider": "fallback"}
        elif any(word in user_message for word in ["rekomendasi", "recommend", "saran"]):
            return {"content": responses["recommend"], "provider": "fallback"}
        elif any(word in user_message for word in ["harga", "price", "berapa"]):
            return {"content": responses["price"], "provider": "fallback"}
        elif any(word in user_message for word in ["sehat", "health", "diet"]):
            return {"content": responses["health"], "provider": "fallback"}

        return {"content": responses["default"], "provider": "fallback"}

    async def close(self) -> None:
        """Close all clients."""
        await self.gemini.close()
        await self.openrouter.close()


_llm_provider: LLMProvider | None = None


def get_llm_provider() -> LLMProvider:
    """Get singleton LLM provider instance."""
    global _llm_provider
    if _llm_provider is None:
        _llm_provider = LLMProvider()
    return _llm_provider

