"""OpenRouter AI Client (fallback provider)."""
import logging
from typing import Any, Optional

import httpx

from app.config import settings

logger = logging.getLogger(__name__)


class OpenRouterClient:
    """Client for OpenRouter API (OpenAI-compatible)."""

    BASE_URL = "https://openrouter.ai/api/v1"

    def __init__(self):
        self.api_key = settings.openrouter_api_key
        self.model = settings.openrouter_model
        self.client: Optional[httpx.AsyncClient] = None

    @property
    def is_available(self) -> bool:
        """Check if OpenRouter is configured."""
        return bool(self.api_key)

    async def _get_client(self) -> httpx.AsyncClient:
        """Get or create HTTP client."""
        if self.client is None:
            self.client = httpx.AsyncClient(
                base_url=self.BASE_URL,
                headers={
                    "Authorization": f"Bearer {self.api_key}",
                    "Content-Type": "application/json",
                    "HTTP-Referer": settings.frontend_url,
                    "X-Title": settings.app_name,
                },
                timeout=30.0,
            )
        return self.client

    async def chat_completion(
        self,
        messages: list[dict[str, str]],
        temperature: float = 0.7,
        max_tokens: int = 500,
    ) -> dict[str, Any]:
        """Send chat completion request to OpenRouter."""
        if not self.is_available:
            logger.warning("OpenRouter API key not configured")
            return {"content": "", "error": "OpenRouter not configured"}

        client = await self._get_client()

        try:
            response = await client.post(
                "/chat/completions",
                json={
                    "model": self.model,
                    "messages": messages,
                    "temperature": temperature,
                    "max_tokens": max_tokens,
                },
            )

            if response.status_code != 200:
                logger.error("OpenRouter API error: %d - %s", response.status_code, response.text)
                return {"content": "", "error": f"API error: {response.status_code}"}

            data = response.json()
            return self._parse_response(data)

        except httpx.RequestError as e:
            logger.error("OpenRouter request error: %s", e)
            return {"content": "", "error": str(e)}
        except Exception as e:
            logger.error("OpenRouter unexpected error: %s", e)
            return {"content": "", "error": str(e)}

    def _parse_response(self, data: dict) -> dict[str, Any]:
        """Parse OpenAI-compatible response format."""
        if "choices" in data and len(data["choices"]) > 0:
            choice = data["choices"][0]
            if "message" in choice:
                return {"content": choice["message"].get("content", "")}
            elif "text" in choice:
                return {"content": choice["text"]}

        if "content" in data:
            return {"content": data["content"]}

        logger.warning("Unexpected OpenRouter response format: %s", data)
        return {"content": "", "error": "Unexpected response format"}

    async def close(self) -> None:
        """Close the HTTP client."""
        if self.client:
            await self.client.aclose()
            self.client = None

