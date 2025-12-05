"""
Customer Products API.
Browse and search products available for purchase.
"""
from typing import Annotated, Optional
import json

from fastapi import APIRouter, Depends, Query, HTTPException, status
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.core.dependencies import OptionalUser
from app.services.product_service import ProductService
from app.schemas.product import ProductListResponse, ProductResponse, CategoryListResponse

router = APIRouter()


def product_to_response(product) -> dict:
    """Convert Product model to response format."""
    ingredients = []
    if product.ingredients:
        try:
            ingredients = json.loads(product.ingredients) if isinstance(product.ingredients, str) else product.ingredients
        except (json.JSONDecodeError, TypeError):
            ingredients = []
    
    return {
        "id": product.id,
        "name": product.name,
        "description": product.description,
        "base_price": product.base_price,
        "price": product.base_price,
        "calories": product.calories,
        "category": product.category_id,
        "category_id": product.category_id,
        "category_name": product.category.name if product.category else None,
        "image": product.image_url,
        "image_url": product.image_url,
        "image_color": product.image_url,  # For frontend compatibility
        # Product images
        "thumbnail_image": product.thumbnail_image,
        "hero_image": product.hero_image,
        "bottle_image": product.bottle_image,
        "is_available": product.is_available,
        "stock": product.stock_quantity,
        "stock_quantity": product.stock_quantity,
        "ingredients": ingredients,
        "rating": product.average_rating or 0,
        "reviews": product.order_count or 0,
        "nutrition": ProductService.get_nutrition_info(product).model_dump() if hasattr(ProductService, 'get_nutrition_info') else {},
        # Size variants
        "has_sizes": product.has_sizes if hasattr(product, 'has_sizes') else True,
        "prices": ProductService.get_all_prices(product) if hasattr(ProductService, 'get_all_prices') else {},
        "volumes": ProductService.get_all_volumes(product) if hasattr(ProductService, 'get_all_volumes') else {},
        "volume_unit": product.volume_unit if hasattr(product, 'volume_unit') else "ml",
    }


@router.get(
    "",
    summary="Get all products",
    description="Retrieve all available products with optional filtering.",
)
async def get_products(
    db: Annotated[Session, Depends(get_db)],
    category: Optional[str] = Query(None, description="Filter by category ID"),
    search: Optional[str] = Query(None, description="Search by name or description"),
    min_price: Optional[float] = Query(None, ge=0, description="Minimum price"),
    max_price: Optional[float] = Query(None, ge=0, description="Maximum price"),
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(20, ge=1, le=100, description="Items per page"),
):
    """
    Get all available products.
    
    Supports filtering by:
    - category: Filter by product category ID
    - search: Search in name and description
    - min_price / max_price: Price range filter
    """
    products, total = ProductService.get_all(
        db,
        category_id=category if category and category.lower() != "all" else None,
        search=search,
        min_price=min_price,
        max_price=max_price,
        page=page,
        page_size=page_size,
    )
    
    items = [product_to_response(p) for p in products]
    
    return {
        "items": items,
        "total": total,
        "page": page,
        "page_size": page_size,
        "total_pages": (total + page_size - 1) // page_size if total > 0 else 0,
    }


@router.get(
    "/categories",
    summary="Get product categories",
    description="Retrieve all available product categories.",
)
async def get_categories(
    db: Annotated[Session, Depends(get_db)],
):
    """Get list of all product categories."""
    categories = ProductService.get_all_categories(db)
    return {
        "categories": [{"id": "all", "name": "All", "icon": "📋"}] + [
            {
                "id": cat.id,
                "name": cat.name,
                "description": cat.description,
                "icon": cat.icon,
            }
            for cat in categories
        ]
    }


@router.get(
    "/featured",
    summary="Get featured products",
    description="Retrieve featured products for homepage.",
)
async def get_featured_products(
    db: Annotated[Session, Depends(get_db)],
    limit: int = Query(8, ge=1, le=20, description="Number of products"),
):
    """Get featured products."""
    products = ProductService.get_featured(db, limit=limit)
    items = [product_to_response(p) for p in products]
    return {"items": items, "total": len(items)}


@router.get(
    "/popular",
    summary="Get popular products",
    description="Retrieve popular products by order count.",
)
async def get_popular_products(
    db: Annotated[Session, Depends(get_db)],
    limit: int = Query(8, ge=1, le=20, description="Number of products"),
):
    """Get popular products."""
    products = ProductService.get_popular(db, limit=limit)
    items = [product_to_response(p) for p in products]
    return {"items": items, "total": len(items)}


@router.get(
    "/bestsellers",
    summary="Get bestseller products for hero section",
    description="Retrieve top 3 bestseller products with hero images for homepage display.",
)
async def get_bestseller_products(
    db: Annotated[Session, Depends(get_db)],
    limit: int = Query(3, ge=1, le=5, description="Number of bestsellers"),
):
    """
    Get bestseller products with hero images.
    Returns products sorted by order_count (most sold first).
    Includes hero_image and bottle_image for homepage hero section.
    """
    products = ProductService.get_bestsellers_for_hero(db, limit=limit)
    
    # Build response with hero-specific data
    items = []
    colors = [
        {"bg": "bg-red-500", "gradient_from": "from-red-400", "gradient_to": "to-red-600", 
         "button_bg": "bg-red-600", "button_hover": "hover:bg-red-700", 
         "shadow_color": "shadow-red-600/20", "accent": "text-red-600", "bg_accent": "bg-red-50/50"},
        {"bg": "bg-green-500", "gradient_from": "from-green-400", "gradient_to": "to-green-600",
         "button_bg": "bg-green-600", "button_hover": "hover:bg-green-700",
         "shadow_color": "shadow-green-600/20", "accent": "text-green-600", "bg_accent": "bg-green-50/50"},
        {"bg": "bg-yellow-500", "gradient_from": "from-yellow-400", "gradient_to": "to-orange-500",
         "button_bg": "bg-orange-500", "button_hover": "hover:bg-orange-600",
         "shadow_color": "shadow-orange-500/20", "accent": "text-orange-500", "bg_accent": "bg-orange-50/50"},
        {"bg": "bg-purple-500", "gradient_from": "from-purple-400", "gradient_to": "to-purple-600",
         "button_bg": "bg-purple-600", "button_hover": "hover:bg-purple-700",
         "shadow_color": "shadow-purple-600/20", "accent": "text-purple-600", "bg_accent": "bg-purple-50/50"},
        {"bg": "bg-blue-500", "gradient_from": "from-blue-400", "gradient_to": "to-blue-600",
         "button_bg": "bg-blue-600", "button_hover": "hover:bg-blue-700",
         "shadow_color": "shadow-blue-600/20", "accent": "text-blue-600", "bg_accent": "bg-blue-50/50"},
    ]
    
    for i, product in enumerate(products):
        color = colors[i % len(colors)]
        # Extract color from image_url if it's a tailwind class
        if product.image_url and product.image_url.startswith("bg-"):
            # Try to find matching color
            for c in colors:
                if c["bg"].split("-")[1] in product.image_url:
                    color = c
                    break
        
        items.append({
            "id": str(product.id),
            "name": product.name,
            "price": str(product.base_price),
            "description": product.description,
            "rating": product.average_rating or 5,
            "order_count": product.order_count or 0,
            # Hero styling
            "color": color["bg"],
            "gradient_from": color["gradient_from"],
            "gradient_to": color["gradient_to"],
            "button_bg": color["button_bg"],
            "button_hover": color["button_hover"],
            "shadow_color": color["shadow_color"],
            "accent_color": color["accent"],
            "bg_accent": color["bg_accent"],
            # Images
            "hero_image": product.hero_image or f"/images/products/hero/{product.name.lower().replace(' ', '-')}.webp",
            "bottle_image": product.bottle_image or f"/images/products/bottles/{product.name.lower().replace(' ', '-')}.webp",
            "thumbnail_image": product.thumbnail_image or product.image_url,
        })
    
    return {
        "items": items,
        "total": len(items),
    }


@router.get(
    "/{product_id}",
    summary="Get product details",
    description="Retrieve detailed information about a specific product.",
)
async def get_product(
    product_id: str,
    db: Annotated[Session, Depends(get_db)],
):
    """Get details of a specific product by ID."""
    product = ProductService.get_by_id(db, product_id)
    
    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Product with ID {product_id} not found"
        )
    
    response = product_to_response(product)
    # Add extra details for single product
    response.update({
        "sugar_grams": product.sugar_grams,
        "is_featured": product.is_featured,
        "health_benefits": product.health_benefits,
        "order_count": product.order_count,
        "average_rating": product.average_rating,
    })
    
    return response
