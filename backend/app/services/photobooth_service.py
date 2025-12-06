import logging
import io
from typing import Optional
from PIL import Image
from google import genai
from google.genai import types

from app.config import settings

logger = logging.getLogger(__name__)


class PhotoboothService:
    def __init__(self):
        self.api_key = settings.gemini_api_key
        self.client = None
        if self.api_key:
            self.client = genai.Client(api_key=self.api_key)

    async def generate_photobooth_image(
        self,
        user_image_data: bytes,
        product_name: str,
    ) -> Optional[bytes]:
        if not self.client:
            logger.error("Gemini API key not configured")
            return None
        
        
        user_image = Image.open(io.BytesIO(user_image_data))
        
        
        max_size = 1024
        if max(user_image.size) > max_size:
            ratio = max_size / max(user_image.size)
            new_size = (int(user_image.size[0] * ratio), int(user_image.size[1] * ratio))
            user_image = user_image.resize(new_size, Image.Resampling.LANCZOS)
        
        
        if user_image.mode in ('RGBA', 'P'):
            user_image = user_image.convert('RGB')

        
        edit_prompt = f"""Using the provided photo, edit it to create a promotional image for JuiceQu juice shop.

IMPORTANT: Keep the person in the photo EXACTLY as they appear - same face, same pose, same expression.

Changes to make:
1. Replace the background with a vibrant tropical beach bar scene
2. Add floating fresh fruits (oranges, mangoes, berries) around the person
3. Add colorful juice splashes and tropical elements
4. Apply a bright, cheerful color grading
5. Make it look like a professional advertisement for "{product_name}"

Keep their face and body exactly the same - only change the background and add decorative elements."""

        
        
        response = self.client.models.generate_content(
            model="gemini-2.5-flash-image",
            contents=[edit_prompt, user_image]
        )
        
        
        if response.parts:
            for part in response.parts:
                if part.inline_data is not None:
                        # Get the raw image bytes directly
                        return part.inline_data.data
        
        return None




_photobooth_service: Optional[PhotoboothService] = None


def get_photobooth_service() -> PhotoboothService:
    global _photobooth_service
    if _photobooth_service is None:
        _photobooth_service = PhotoboothService()
    return _photobooth_service
