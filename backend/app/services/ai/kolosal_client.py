"""
Kolosal AI API Client.
Handles communication with Kolosal AI (OpenAI-compatible API).
"""
import logging
from typing import Any, Optional

import httpx

from app.config import settings

logger = logging.getLogger(__name__)


class KolosalClient:
    """Client for Kolosal AI API."""
    
    def __init__(self):
        """Initialize the Kolosal client."""
        self.base_url = settings.kolosal_api_base
        self.api_key = settings.kolosal_api_key
        self.model = settings.kolosal_model
        self.client: Optional[httpx.AsyncClient] = None
    
    async def _get_client(self) -> httpx.AsyncClient:
        """Get or create HTTP client."""
        if self.client is None:
            self.client = httpx.AsyncClient(
                base_url=self.base_url,
                headers={
                    "Authorization": f"Bearer {self.api_key}",
                    "Content-Type": "application/json",
                },
                timeout=30.0,
            )
        return self.client
    
    async def close(self) -> None:
        """Close the HTTP client."""
        if self.client:
            await self.client.aclose()
            self.client = None
    
    async def chat_completion(
        self,
        messages: list[dict[str, str]],
        temperature: float = 0.7,
        max_tokens: int = 500,
    ) -> dict[str, Any]:
        """
        Send chat completion request to Kolosal AI.
        
        Args:
            messages: List of message dicts with 'role' and 'content'
            temperature: Sampling temperature (0-1)
            max_tokens: Maximum tokens in response
        
        Returns:
            Response dict with 'content' key
        """
        if not self.api_key:
            logger.warning("Kolosal API key not configured")
            return self._fallback_response(messages)
        
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
                logger.error("Kolosal API error: %d - %s", response.status_code, response.text)
                return self._fallback_response(messages)
            
            data = response.json()
            return self._parse_response(data)
            
        except httpx.RequestError as e:
            logger.error("Request error calling Kolosal AI: %s", str(e))
            return self._fallback_response(messages)
        except Exception as e:
            logger.error("Unexpected error calling Kolosal AI: %s", str(e))
            return self._fallback_response(messages)
    
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
        
        logger.warning("Unexpected AI response format: %s", data)
        return {"content": ""}
    
    def _fallback_response(self, messages: list[dict[str, str]]) -> dict[str, Any]:
        """Generate fallback response when AI is unavailable."""
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
            return {"content": responses["greeting"]}
        elif any(word in user_message for word in ["rekomendasi", "recommend", "saran"]):
            return {"content": responses["recommend"]}
        elif any(word in user_message for word in ["harga", "price", "berapa"]):
            return {"content": responses["price"]}
        elif any(word in user_message for word in ["sehat", "health", "diet"]):
            return {"content": responses["health"]}
        
        return {"content": responses["default"]}
