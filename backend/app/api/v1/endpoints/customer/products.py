"""Customer Products API - Browse and search products."""
from typing import Annotated

from fastapi import APIRouter, Depends, Query, HTTPException, status
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.serializers.product_serializer import ProductSerializer
from app.services.product_service import ProductService
from app.utils.pagination import paginate_response

router = APIRouter()


@router.get("", summary="Get all products")
async def get_products(
    db: Annotated[Session, Depends(get_db)],
    category: str | None = Query(None, description="Filter by category ID"),
    search: str | None = Query(None, description="Search by name or description"),
    min_price: float | None = Query(None, ge=0, description="Minimum price"),
    max_price: float | None = Query(None, ge=0, description="Maximum price"),
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(20, ge=1, le=100, description="Items per page"),
):
    """Get all available products with optional filtering."""
    products, total = ProductService.get_all(
        db,
        category_id=category if category and category.lower() != "all" else None,
        search=search,
        min_price=min_price,
        max_price=max_price,
        page=page,
        page_size=page_size,
    )

    items = [ProductSerializer.to_customer_dict(p, db) for p in products]
    return paginate_response(items, total, page, page_size)


@router.get("/categories", summary="Get product categories")
async def get_categories(db: Annotated[Session, Depends(get_db)]):
    """Get list of all product categories."""
    categories = ProductService.get_all_categories(db)
    return {
        "categories": [{"id": "all", "name": "All", "icon": None}]
        + [
            {
                "id": cat.id,
                "name": cat.name,
                "description": cat.description,
                "icon": cat.icon,
            }
            for cat in categories
        ]
    }


@router.get("/featured", summary="Get featured products")
async def get_featured_products(
    db: Annotated[Session, Depends(get_db)],
    limit: int = Query(8, ge=1, le=20, description="Number of products"),
):
    """Get featured products."""
    products = ProductService.get_featured(db, limit=limit)
    items = [ProductSerializer.to_customer_dict(p, db) for p in products]
    return {"items": items, "total": len(items)}


@router.get("/popular", summary="Get popular products")
async def get_popular_products(
    db: Annotated[Session, Depends(get_db)],
    limit: int = Query(8, ge=1, le=20, description="Number of products"),
):
    """Get popular products by order count."""
    products = ProductService.get_popular(db, limit=limit)
    items = [ProductSerializer.to_customer_dict(p, db) for p in products]
    return {"items": items, "total": len(items)}


@router.get("/bestsellers", summary="Get bestseller products for hero section")
async def get_bestseller_products(
    db: Annotated[Session, Depends(get_db)],
    limit: int = Query(3, ge=1, le=5, description="Number of bestsellers"),
):
    """Get bestseller products with hero images for homepage display."""
    products = ProductService.get_bestsellers_for_hero(db, limit=limit)
    items = [
        ProductSerializer.to_hero_dict(product, index)
        for index, product in enumerate(products)
    ]
    return {"items": items, "total": len(items)}


@router.get("/{product_id}", summary="Get product details")
async def get_product(
    product_id: str,
    db: Annotated[Session, Depends(get_db)],
):
    """Get details of a specific product by ID."""
    product = ProductService.get_by_id(db, product_id)

    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Product with ID {product_id} not found",
        )

    return ProductSerializer.to_detail_dict(product, db)
