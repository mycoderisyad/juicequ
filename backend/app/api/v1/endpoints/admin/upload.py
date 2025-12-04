"""
Upload API for product images.
Auto-converts images to WebP format for optimization.
Stores images locally on the server (VPS storage).
"""
import os
import re
import uuid
from io import BytesIO
from typing import Annotated, Dict, Optional, Tuple

from fastapi import APIRouter, Depends, File, UploadFile, HTTPException, Form
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.core.permissions import require_roles
from app.models.user import User, UserRole
from app.models.product import Product
from app.config import settings

router = APIRouter()

# Supported input formats
ALLOWED_EXTENSIONS = {"png", "jpg", "jpeg", "gif", "webp", "bmp", "tiff"}
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB

# Magic numbers (file signatures) for image validation
# This prevents attackers from uploading malicious files with fake extensions
IMAGE_MAGIC_NUMBERS: Dict[bytes, str] = {
    b'\x89PNG\r\n\x1a\n': 'png',
    b'\xff\xd8\xff': 'jpg',  # JPEG (various subtypes)
    b'GIF89a': 'gif',
    b'GIF87a': 'gif',
    b'RIFF': 'webp',  # WebP starts with RIFF
    b'BM': 'bmp',
    b'II*\x00': 'tiff',  # TIFF little-endian
    b'MM\x00*': 'tiff',  # TIFF big-endian
}


def validate_image_magic_number(file_content: bytes) -> Tuple[bool, Optional[str]]:
    """
    Validate file content by checking magic number (file signature).
    
    This provides additional security beyond extension checking by verifying
    the actual file content matches an expected image format.
    
    Args:
        file_content: Raw bytes of the uploaded file
        
    Returns:
        Tuple of (is_valid, detected_format)
    """
    for magic, format_name in IMAGE_MAGIC_NUMBERS.items():
        if file_content.startswith(magic):
            return True, format_name
    
    # Additional check for WebP (RIFF followed by WEBP)
    if file_content[:4] == b'RIFF' and file_content[8:12] == b'WEBP':
        return True, 'webp'
    
    return False, None


def sanitize_filename(filename: str, max_length: int = 50) -> str:
    """
    Sanitize filename to prevent path traversal and other attacks.
    
    Args:
        filename: Original filename from upload
        max_length: Maximum allowed length for the base name
        
    Returns:
        Sanitized filename safe for filesystem storage
    """
    if not filename:
        return "image"
    
    # Remove path components (prevent directory traversal)
    filename = os.path.basename(filename)
    
    # Get base name without extension
    base_name = os.path.splitext(filename)[0]
    
    # Remove or replace dangerous characters
    # Allow only alphanumeric, dash, underscore
    base_name = re.sub(r'[^a-zA-Z0-9_-]', '-', base_name)
    
    # Remove consecutive dashes
    base_name = re.sub(r'-+', '-', base_name)
    
    # Remove leading/trailing dashes
    base_name = base_name.strip('-')
    
    # Ensure non-empty
    if not base_name:
        base_name = "image"
    
    # Truncate to max length
    return base_name[:max_length]


def get_upload_base_dir() -> str:
    """
    Get the base directory for uploads.
    Uses UPLOAD_BASE_PATH from config (default: ./uploads)
    Files are stored on the same server (VPS) as the application.
    """
    base_path = settings.upload_base_path or "./uploads"
    return os.path.abspath(base_path)


def get_file_extension(filename: str) -> str:
    """Get file extension from filename."""
    return filename.rsplit(".", 1)[-1].lower() if "." in filename else ""


def ensure_upload_dirs():
    """Ensure upload directories exist."""
    base_dir = get_upload_base_dir()
    dirs = ["hero", "bottles", "thumbnails", "catalog", "products"]
    for d in dirs:
        path = os.path.join(base_dir, d)
        os.makedirs(path, exist_ok=True)


def convert_to_webp(image_data: bytes, quality: int = 85) -> bytes:
    """Convert image to WebP format using Pillow."""
    try:
        from PIL import Image
        
        # Open image from bytes
        img = Image.open(BytesIO(image_data))
        
        # Convert to RGB if necessary (for PNG with alpha, keep RGBA)
        if img.mode in ("RGBA", "LA", "P"):
            # Keep alpha channel for transparency
            if img.mode == "P":
                img = img.convert("RGBA")
        elif img.mode != "RGB":
            img = img.convert("RGB")
        
        # Save as WebP
        output = BytesIO()
        img.save(output, format="WEBP", quality=quality, optimize=True)
        output.seek(0)
        
        return output.read()
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to convert image: {str(e)}")


def save_image(image_data: bytes, folder: str, filename: str) -> str:
    """Save image to disk and return URL path for accessing via API."""
    ensure_upload_dirs()
    
    base_dir = get_upload_base_dir()
    
    # Ensure folder doesn't contain path traversal
    folder = os.path.basename(folder)
    
    # Full path
    file_path = os.path.join(base_dir, folder, filename)
    
    # Verify the resolved path is still within the upload directory (defense in depth)
    resolved_path = os.path.realpath(file_path)
    resolved_base = os.path.realpath(base_dir)
    if not resolved_path.startswith(resolved_base):
        raise HTTPException(status_code=400, detail="Invalid file path")
    
    # Write file
    with open(file_path, "wb") as f:
        f.write(image_data)
    
    # Return URL path (served by FastAPI static files at /uploads/)
    return f"/uploads/{folder}/{filename}"


@router.post(
    "/image",
    summary="Upload product image",
    description="Upload and auto-convert image to WebP format.",
)
async def upload_image(
    file: UploadFile = File(..., description="Image file to upload"),
    image_type: str = Form(..., description="Type: hero, bottle, thumbnail, catalog"),
    product_id: str | None = Form(None, description="Product ID to associate with"),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.ADMIN)),
):
    """
    Upload product image and auto-convert to WebP.
    
    - **file**: Image file (PNG, JPG, GIF, etc.)
    - **image_type**: Where the image will be used (hero, bottle, thumbnail, catalog)
    - **product_id**: Optional product ID to auto-update
    """
    # Validate file extension
    ext = get_file_extension(file.filename or "")
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400, 
            detail=f"File type '{ext}' not allowed. Allowed: {', '.join(ALLOWED_EXTENSIONS)}"
        )
    
    # Validate image type
    valid_types = ["hero", "bottle", "thumbnail", "catalog"]
    folder_map = {
        "hero": "hero",
        "bottle": "bottles",
        "thumbnail": "thumbnails",
        "catalog": "catalog",
    }
    
    if image_type not in valid_types:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid image_type. Must be one of: {', '.join(valid_types)}"
        )
    
    # Read file content
    content = await file.read()
    
    # Check file size
    if len(content) > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=400,
            detail=f"File too large. Maximum size: {MAX_FILE_SIZE / 1024 / 1024}MB"
        )
    
    # Security: Validate magic number (file signature)
    is_valid_image, detected_format = validate_image_magic_number(content)
    if not is_valid_image:
        raise HTTPException(
            status_code=400,
            detail="Invalid image file. File content does not match any supported image format."
        )
    
    # Log format mismatch (but don't reject - common for mis-named files)
    if detected_format and ext != detected_format and ext not in ['jpg', 'jpeg']:
        # Note: jpg/jpeg are interchangeable
        pass  # Could add logging here if needed
    
    # Convert to WebP
    webp_data = convert_to_webp(content)
    
    # Generate unique filename with sanitized base name
    unique_id = str(uuid.uuid4())[:8]
    clean_name = sanitize_filename(file.filename or "image")
    filename = f"{clean_name}-{unique_id}.webp"
    
    # Save file
    folder = folder_map[image_type]
    url_path = save_image(webp_data, folder, filename)
    
    # If product_id provided, update the product
    if product_id:
        product = db.query(Product).filter(Product.id == product_id).first()
        if product:
            if image_type == "hero":
                product.hero_image = url_path
            elif image_type == "bottle":
                product.bottle_image = url_path
            elif image_type == "thumbnail":
                product.thumbnail_image = url_path
            elif image_type == "catalog":
                product.image_url = url_path
            
            db.commit()
    
    # Calculate size reduction
    original_size = len(content)
    webp_size = len(webp_data)
    reduction = ((original_size - webp_size) / original_size) * 100 if original_size > 0 else 0
    
    return {
        "success": True,
        "message": "Image uploaded and converted successfully",
        "url": url_path,
        "filename": filename,
        "image_type": image_type,
        "original_size": original_size,
        "webp_size": webp_size,
        "size_reduction": f"{reduction:.1f}%",
        "product_id": product_id,
    }


@router.post(
    "/images/batch",
    summary="Upload multiple images for a product",
    description="Upload hero, bottle, and thumbnail images at once.",
)
async def upload_batch_images(
    product_id: str = Form(..., description="Product ID"),
    hero_image: UploadFile | None = File(None, description="Hero background image"),
    bottle_image: UploadFile | None = File(None, description="Bottle/product image"),
    thumbnail_image: UploadFile | None = File(None, description="Thumbnail image"),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.ADMIN)),
):
    """Upload multiple images for a product at once."""
    from app.core.exceptions import NotFoundException
    
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise NotFoundException("Product", product_id)
    
    results = {}
    
    # Process each image
    for image_type, file in [
        ("hero", hero_image),
        ("bottle", bottle_image),
        ("thumbnail", thumbnail_image),
    ]:
        if file and file.filename:
            ext = get_file_extension(file.filename)
            if ext not in ALLOWED_EXTENSIONS:
                results[image_type] = {"error": f"Invalid file type: {ext}"}
                continue
            
            content = await file.read()
            if len(content) > MAX_FILE_SIZE:
                results[image_type] = {"error": "File too large"}
                continue
            
            # Security: Validate magic number
            is_valid_image, _ = validate_image_magic_number(content)
            if not is_valid_image:
                results[image_type] = {"error": "Invalid image file content"}
                continue
            
            try:
                webp_data = convert_to_webp(content)
                
                # Generate filename with sanitized product name
                unique_id = str(uuid.uuid4())[:8]
                clean_name = sanitize_filename(product.name)
                
                folder_map = {"hero": "hero", "bottle": "bottles", "thumbnail": "thumbnails"}
                filename = f"{clean_name}-{image_type}-{unique_id}.webp"
                
                url_path = save_image(webp_data, folder_map[image_type], filename)
                
                # Update product
                if image_type == "hero":
                    product.hero_image = url_path
                elif image_type == "bottle":
                    product.bottle_image = url_path
                elif image_type == "thumbnail":
                    product.thumbnail_image = url_path
                
                results[image_type] = {
                    "success": True,
                    "url": url_path,
                    "size_reduction": f"{((len(content) - len(webp_data)) / len(content) * 100):.1f}%"
                }
            except Exception as e:
                results[image_type] = {"error": str(e)}
    
    db.commit()
    db.refresh(product)
    
    return {
        "success": True,
        "message": "Images processed",
        "product_id": product_id,
        "results": results,
        "product": {
            "hero_image": product.hero_image,
            "bottle_image": product.bottle_image,
            "thumbnail_image": product.thumbnail_image,
        }
    }
