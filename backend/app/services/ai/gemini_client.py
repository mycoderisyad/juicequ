"""Gemini AI Client for chat, STT, and image generation."""
import base64
import io
import json
import logging
import re
from typing import Any, Optional

from PIL import Image

from app.config import settings

logger = logging.getLogger(__name__)


class GeminiClient:
    """Client for Google Gemini API."""

    CHAT_MODEL = "gemini-2.0-flash"
    MULTIMODAL_MODEL = "gemini-2.0-flash"
    IMAGE_MODEL = "gemini-2.0-flash-exp-image-generation"

    def __init__(self):
        self.api_key = settings.gemini_api_key
        self.client = None
        self._initialized = False

        if self.api_key:
            try:
                from google import genai

                self.client = genai.Client(api_key=self.api_key)
                self._initialized = True
                logger.info("Gemini client initialized successfully")
            except ImportError:
                logger.error("google-generativeai not installed")
            except Exception as e:
                logger.error("Failed to initialize Gemini client: %s", e)

    @property
    def is_available(self) -> bool:
        """Check if Gemini client is available."""
        return self._initialized and self.client is not None

    async def chat_completion(
        self,
        messages: list[dict[str, str]],
        temperature: float = 0.7,
        max_tokens: int = 500,
    ) -> dict[str, Any]:
        """Send chat completion request to Gemini."""
        if not self.is_available:
            logger.warning("Gemini client not available")
            return {"content": "", "error": "Gemini not configured"}

        try:
            from google.genai import types

            system_prompt = ""
            chat_messages = []

            for msg in messages:
                role = msg.get("role", "user")
                content = msg.get("content", "")
                if role == "system":
                    system_prompt = content
                elif role == "user":
                    chat_messages.append(types.Content(role="user", parts=[types.Part(text=content)]))
                elif role == "assistant":
                    chat_messages.append(types.Content(role="model", parts=[types.Part(text=content)]))

            config = types.GenerateContentConfig(
                temperature=temperature,
                max_output_tokens=max_tokens,
                system_instruction=system_prompt if system_prompt else None,
            )

            response = self.client.models.generate_content(
                model=self.CHAT_MODEL,
                contents=chat_messages,
                config=config,
            )

            if response and response.text:
                return {"content": response.text}

            return {"content": "", "error": "Empty response from Gemini"}

        except Exception as e:
            logger.error("Gemini chat error: %s", e)
            return {"content": "", "error": str(e)}

    async def transcribe_audio(
        self,
        audio_data: bytes,
        language: str = "id",
    ) -> dict[str, Any]:
        """Transcribe audio using Gemini multimodal."""
        if not self.is_available:
            return {"transcription": "", "error": "Gemini not configured"}

        try:
            from google.genai import types

            audio_base64 = base64.b64encode(audio_data).decode("utf-8")

            prompt = f"""Transcribe the following audio to text. 
The audio is in {language} language (Indonesian if 'id', English if 'en').
Return ONLY the transcribed text, nothing else."""

            response = self.client.models.generate_content(
                model=self.MULTIMODAL_MODEL,
                contents=[
                    types.Content(
                        role="user",
                        parts=[
                            types.Part(
                                inline_data=types.Blob(
                                    mime_type="audio/webm",
                                    data=audio_base64,
                                )
                            ),
                            types.Part(text=prompt),
                        ],
                    )
                ],
            )

            if response and response.text:
                return {"transcription": response.text.strip()}

            return {"transcription": "", "error": "Empty response"}

        except Exception as e:
            logger.error("Gemini STT error: %s", e)
            return {"transcription": "", "error": str(e)}

    async def transcribe_and_parse_voice_command(
        self,
        audio_data: bytes,
        products_context: str,
        language: str = "id",
    ) -> dict[str, Any]:
        """Transcribe audio and parse voice command to JSON action in one request."""
        if not self.is_available:
            return {"error": "Gemini not configured"}

        try:
            from google.genai import types

            audio_base64 = base64.b64encode(audio_data).decode("utf-8")

            system_prompt = f"""Kamu adalah parser perintah suara untuk toko jus JuiceQu.
Tugasmu adalah mendengarkan audio dan mengubahnya menjadi ACTION yang bisa dieksekusi.

PRODUK TERSEDIA:
{products_context}

TUGAS:
1. Transcribe audio ke teks
2. Pahami maksud user (meski ada typo/salah ucap)
3. Tentukan ACTION yang tepat
4. Cocokkan dengan produk di database

OUTPUT FORMAT (JSON ONLY):
{{
    "transcription": "teks hasil transcribe audio",
    "action": "add_to_cart" | "navigate_product" | "navigate_page" | "search" | "clear_cart" | "checkout",
    "products": [
        {{
            "name": "nama produk EXACT dari database",
            "quantity": 1,
            "size": "medium"
        }}
    ],
    "destination": "/menu" | "/cart" | "/checkout",
    "search_query": "query pencarian",
    "message": "pesan singkat (max 10 kata)"
}}

RULES:
- action "add_to_cart": WAJIB isi products[]
- action "navigate_product": WAJIB isi products[] dengan 1 produk
- action "navigate_page": isi destination
- action "search": isi search_query
- message harus SINGKAT

Output HANYA JSON, tanpa penjelasan lain!"""

            response = self.client.models.generate_content(
                model=self.MULTIMODAL_MODEL,
                contents=[
                    types.Content(
                        role="user",
                        parts=[
                            types.Part(
                                inline_data=types.Blob(
                                    mime_type="audio/webm",
                                    data=audio_base64,
                                )
                            ),
                            types.Part(text=system_prompt),
                        ],
                    )
                ],
            )

            if response and response.text:
                json_match = re.search(r"\{[\s\S]*\}", response.text)
                if json_match:
                    return json.loads(json_match.group())

            return {"error": "Failed to parse response"}

        except json.JSONDecodeError as e:
            logger.error("JSON parse error: %s", e)
            return {"error": "Invalid JSON response"}
        except Exception as e:
            logger.error("Gemini voice command error: %s", e)
            return {"error": str(e)}

    async def generate_image(
        self,
        prompt: str,
        reference_image: Optional[bytes] = None,
    ) -> Optional[bytes]:
        """Generate or edit image using Gemini."""
        if not self.is_available:
            logger.error("Gemini client not available")
            return None

        try:
            from google.genai import types

            contents = []

            if reference_image:
                img = Image.open(io.BytesIO(reference_image))
                max_size = 1024
                if max(img.size) > max_size:
                    ratio = max_size / max(img.size)
                    new_size = (int(img.size[0] * ratio), int(img.size[1] * ratio))
                    img = img.resize(new_size, Image.Resampling.LANCZOS)

                if img.mode in ("RGBA", "P"):
                    img = img.convert("RGB")

                contents = [prompt, img]
            else:
                contents = [prompt]

            response = self.client.models.generate_content(
                model=self.IMAGE_MODEL,
                contents=contents,
            )

            if response.parts:
                for part in response.parts:
                    if part.inline_data is not None:
                        return part.inline_data.data

            return None

        except Exception as e:
            logger.error("Gemini image generation error: %s", e)
            return None

    async def generate_photobooth(
        self,
        user_image_data: bytes,
        product_name: str,
    ) -> Optional[bytes]:
        """Generate photobooth image with product context."""
        prompt = f"""Using the provided photo, edit it to create a promotional image for JuiceQu juice shop.

IMPORTANT: Keep the person in the photo EXACTLY as they appear - same face, same pose, same expression.

Changes to make:
1. Replace the background with a vibrant tropical beach bar scene
2. Add floating fresh fruits (oranges, mangoes, berries) around the person
3. Add colorful juice splashes and tropical elements
4. Apply a bright, cheerful color grading
5. Make it look like a professional advertisement for "{product_name}"

Keep their face and body exactly the same - only change the background and add decorative elements."""

        return await self.generate_image(prompt, user_image_data)

    async def close(self) -> None:
        """Clean up resources."""
        self.client = None
        self._initialized = False

