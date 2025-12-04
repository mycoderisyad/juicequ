"""
Upload API for product images.
Auto-converts images to WebP format for optimization.
Stores images locally on the server (VPS storage).
"""
import os
import uuid
from io import BytesIO
from typing import Annotated

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
    
    # Full path
    file_path = os.path.join(base_dir, folder, filename)
    
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
    
    # Convert to WebP
    webp_data = convert_to_webp(content)
    
    # Generate unique filename
    unique_id = str(uuid.uuid4())[:8]
    base_name = os.path.splitext(file.filename or "image")[0]
    # Clean filename
    clean_name = "".join(c if c.isalnum() or c in "-_" else "-" for c in base_name)
    clean_name = clean_name[:50]  # Limit length
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
            
            try:
                webp_data = convert_to_webp(content)
                
                # Generate filename
                unique_id = str(uuid.uuid4())[:8]
                clean_name = "".join(c if c.isalnum() or c in "-_" else "-" for c in product.name)
                clean_name = clean_name[:30]
                
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
