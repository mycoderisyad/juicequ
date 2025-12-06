"""
API endpoint for AI Photobooth.
"""
import logging
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from fastapi.responses import Response
from sqlalchemy.orm import Session

from app.core.dependencies import CurrentUser
from app.db.session import get_db
from app.models.user import UserRole
from app.services.photobooth_service import get_photobooth_service
from app.config import settings

logger = logging.getLogger(__name__)

router = APIRouter()

AI_PHOTOBOOTH_LIMIT = 3  # Max uses for regular users


@router.post("/generate")
async def generate_photobooth_image(
    current_user: CurrentUser,
    db: Annotated[Session, Depends(get_db)],
    image: UploadFile = File(...),
    product_name: str = Form("Fresh Juice"),
):
    """
    Generate an AI-enhanced photobooth image.
    """
    try:
        is_admin = current_user.role == UserRole.ADMIN
        
        if not is_admin:
            if current_user.ai_photobooth_count >= AI_PHOTOBOOTH_LIMIT:
                raise HTTPException(
                    status_code=403,
                    detail=f"You have reached the maximum AI Photobooth usage ({AI_PHOTOBOOTH_LIMIT} times)."
                )
        
        if not settings.gemini_api_key:
            logger.error("Gemini API key not configured!")
            raise HTTPException(
                status_code=503,
                detail="AI Photobooth is not configured. Please contact administrator."
            )
        
        image_data = await image.read()
        
        if not image_data:
            raise HTTPException(status_code=400, detail="No image data provided")
        
        if len(image_data) > 10 * 1024 * 1024:
            raise HTTPException(status_code=400, detail="Image too large. Maximum size is 10MB.")
        
        service = get_photobooth_service()
        
        generated_image = await service.generate_photobooth_image(
            user_image_data=image_data,
            product_name=product_name,
        )
        
        if not generated_image:
            raise HTTPException(
                status_code=500,
                detail="Failed to generate image. Please try again."
            )
        
        if not is_admin:
            current_user.ai_photobooth_count += 1
            db.commit()
        
        return Response(
            content=generated_image,
            media_type="image/jpeg",
            headers={
                "X-Remaining-Uses": str(
                    AI_PHOTOBOOTH_LIMIT - current_user.ai_photobooth_count if not is_admin else -1
                )
            }
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"=== PHOTOBOOTH ERROR: {e} ===", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"An error occurred: {str(e)}"
        )
