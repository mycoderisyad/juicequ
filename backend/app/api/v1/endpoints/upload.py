"""
Upload API endpoints.
Handles file uploads to local storage.
"""
import logging
from typing import Annotated

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from pydantic import BaseModel

from app.config import settings
from app.core.permissions import require_roles
from app.models.user import User, UserRole
from app.services.storage_service import get_storage_service

logger = logging.getLogger(__name__)

router = APIRouter()


class UploadResponse(BaseModel):
    """Response for file upload."""
    url: str
    filename: str
    size: int
    content_type: str
    message: str = "File uploaded successfully"


class DeleteResponse(BaseModel):
    """Response for file deletion."""
    success: bool
    message: str


@router.post(
    "/image",
    response_model=UploadResponse,
    summary="Upload image",
    description="Upload an image file to local storage. Supported formats: JPEG, PNG, WebP, GIF.",
)
async def upload_image(
    file: UploadFile = File(..., description="Image file to upload"),
    folder: str = "products",
    current_user: User = Depends(require_roles(UserRole.ADMIN, UserRole.KASIR)),
) -> UploadResponse:
    """
    Upload an image to local storage.
    
    - **file**: Image file (JPEG, PNG, WebP, GIF)
    - **folder**: Storage folder (products, products/hero, products/catalog, users)
    
    Returns the URL path to access the uploaded file.
    """
    # Validate file size
    content = await file.read()
    file_size = len(content)
    
    if file_size > settings.upload_max_size_bytes:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"File size exceeds maximum limit of {settings.upload_max_size_mb}MB",
        )
    
    # Validate file extension
    if file.filename:
        ext = file.filename.rsplit(".", 1)[-1].lower() if "." in file.filename else ""
        if ext not in settings.upload_allowed_extensions_list:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"File extension not allowed. Allowed: {settings.upload_allowed_extensions}",
            )
    
    # Validate content type
    allowed_types = ["image/jpeg", "image/png", "image/webp", "image/gif"]
    if file.content_type not in allowed_types:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid content type. Allowed: {', '.join(allowed_types)}",
        )
    
    # Validate folder
    allowed_folders = [
        "products", "products/hero", "products/catalog", "products/thumbnails", "users"
    ]
    if folder not in allowed_folders:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid folder. Allowed: {', '.join(allowed_folders)}",
        )
    
    try:
        storage = get_storage_service()
        url = await storage.upload_file(
            file_data=content,
            filename=file.filename or "image",
            content_type=file.content_type or "image/jpeg",
            folder=folder,
        )
        
        logger.info(
            "File uploaded by user %s: %s (%d bytes)",
            current_user.email,
            url,
            file_size,
        )
        
        return UploadResponse(
            url=url,
            filename=file.filename or "image",
            size=file_size,
            content_type=file.content_type or "image/jpeg",
        )
    
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )
    except Exception as e:
        logger.error("Upload failed: %s", e)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to upload file",
        )


@router.delete(
    "",
    response_model=DeleteResponse,
    summary="Delete uploaded file",
    description="Delete a previously uploaded file from local storage.",
)
async def delete_file(
    url: str,
    current_user: User = Depends(require_roles(UserRole.ADMIN)),
) -> DeleteResponse:
    """
    Delete an uploaded file.
    
    - **url**: URL path of the file to delete (e.g., /uploads/products/uuid.png)
    
    Only admins can delete files.
    """
    # Validate URL starts with /uploads/
    if not url.startswith("/uploads/"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid URL. Must be a file from /uploads/",
        )
    
    try:
        storage = get_storage_service()
        success = await storage.delete_file(url)
        
        if success:
            logger.info("File deleted by user %s: %s", current_user.email, url)
            return DeleteResponse(success=True, message="File deleted successfully")
        else:
            return DeleteResponse(success=False, message="File not found")
    
    except Exception as e:
        logger.error("Delete failed: %s", e)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to delete file",
        )


@router.post(
    "/product-image",
    response_model=UploadResponse,
    summary="Upload product image",
    description="Upload a product image with automatic thumbnail generation.",
)
async def upload_product_image(
    file: UploadFile = File(..., description="Product image file"),
    image_type: str = "catalog",
    current_user: User = Depends(require_roles(UserRole.ADMIN)),
) -> UploadResponse:
    """
    Upload a product image.
    
    - **file**: Image file (JPEG, PNG, WebP)
    - **image_type**: Type of image (hero, catalog, thumbnails)
    
    Returns the URL path to access the uploaded file.
    """
    # Validate image type
    valid_types = ["hero", "catalog", "thumbnails"]
    if image_type not in valid_types:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid image type. Allowed: {', '.join(valid_types)}",
        )
    
    # Validate file
    content = await file.read()
    file_size = len(content)
    
    if file_size > settings.upload_max_size_bytes:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"File size exceeds maximum limit of {settings.upload_max_size_mb}MB",
        )
    
    allowed_types = ["image/jpeg", "image/png", "image/webp"]
    if file.content_type not in allowed_types:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid content type. Allowed: {', '.join(allowed_types)}",
        )
    
    try:
        storage = get_storage_service()
        folder = f"products/{image_type}"
        url = await storage.upload_file(
            file_data=content,
            filename=file.filename or "product",
            content_type=file.content_type or "image/jpeg",
            folder=folder,
        )
        
        logger.info(
            "Product image uploaded by user %s: %s (%d bytes)",
            current_user.email,
            url,
            file_size,
        )
        
        return UploadResponse(
            url=url,
            filename=file.filename or "product",
            size=file_size,
            content_type=file.content_type or "image/jpeg",
        )
    
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )
    except Exception as e:
        logger.error("Upload failed: %s", e)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to upload file",
        )
