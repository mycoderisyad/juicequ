"""
Admin Products API.
Manage products and inventory.
"""
from datetime import datetime
from typing import Annotated
import uuid

from fastapi import APIRouter, Depends, Query
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.core.permissions import require_roles
from app.models.user import User, UserRole

router = APIRouter()


# Import shared products list
from app.api.v1.endpoints.customer.products import PRODUCTS, CATEGORIES


class CreateProductRequest(BaseModel):
    """Request to create a product."""
    name: str = Field(..., min_length=2, max_length=100)
    description: str = Field(..., min_length=10, max_length=500)
    price: float = Field(..., gt=0)
    category: str
    image: str | None = None
    is_available: bool = True
    stock: int = Field(default=100, ge=0)
    ingredients: list[str] = []
    nutrition: dict | None = None


class UpdateProductRequest(BaseModel):
    """Request to update a product."""
    name: str | None = Field(None, min_length=2, max_length=100)
    description: str | None = Field(None, max_length=500)
    price: float | None = Field(None, gt=0)
    category: str | None = None
    image: str | None = None
    is_available: bool | None = None
    stock: int | None = Field(None, ge=0)
    ingredients: list[str] | None = None
    nutrition: dict | None = None


@router.get(
    "",
    summary="Get all products",
    description="Get all products with admin details.",
)
async def get_products(
    db: Annotated[Session, Depends(get_db)],
    current_user: User = Depends(require_roles(UserRole.ADMIN)),
    category: str | None = Query(None),
    is_available: bool | None = Query(None),
    search: str | None = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
):
    """Get all products with full admin details."""
    products = PRODUCTS.copy()
    
    # Apply filters
    if category:
        products = [p for p in products if p["category"] == category]
    
    if is_available is not None:
        products = [p for p in products if p.get("is_available", True) == is_available]
    
    if search:
        search_lower = search.lower()
        products = [
            p for p in products
            if search_lower in p["name"].lower() 
            or search_lower in p.get("description", "").lower()
        ]
    
    total = len(products)
    products = products[skip:skip + limit]
    
    return {
        "products": products,
        "total": total,
        "skip": skip,
        "limit": limit,
    }


@router.get(
    "/{product_id}",
    summary="Get product details",
    description="Get detailed product information.",
)
async def get_product(
    product_id: str,
    db: Annotated[Session, Depends(get_db)],
    current_user: User = Depends(require_roles(UserRole.ADMIN)),
):
    """Get product by ID."""
    product = next(
        (p for p in PRODUCTS if str(p["id"]) == product_id),
        None
    )
    
    if not product:
        from app.core.exceptions import NotFoundException
        raise NotFoundException("Product", product_id)
    
    return product


@router.post(
    "",
    summary="Create product",
    description="Create a new product.",
)
async def create_product(
    request: CreateProductRequest,
    db: Annotated[Session, Depends(get_db)],
    current_user: User = Depends(require_roles(UserRole.ADMIN)),
):
    """Create a new product."""
    from app.core.exceptions import BadRequestException
    
    # Validate category
    if request.category not in [c["id"] for c in CATEGORIES]:
        raise BadRequestException(
            f"Invalid category. Must be one of: {[c['id'] for c in CATEGORIES]}"
        )
    
    # Check for duplicate name
    existing = next(
        (p for p in PRODUCTS if p["name"].lower() == request.name.lower()),
        None
    )
    if existing:
        raise BadRequestException("A product with this name already exists")
    
    # Create product
    new_id = max(p["id"] for p in PRODUCTS) + 1 if PRODUCTS else 1
    
    new_product = {
        "id": new_id,
        "name": request.name,
        "description": request.description,
        "price": request.price,
        "category": request.category,
        "image": request.image or "/images/juice-default.jpg",
        "is_available": request.is_available,
        "stock": request.stock,
        "ingredients": request.ingredients,
        "nutrition": request.nutrition or {},
        "rating": 0,
        "reviews": 0,
        "created_at": datetime.now().isoformat(),
        "created_by": current_user.id,
    }
    
    PRODUCTS.append(new_product)
    
    return {
        "message": "Product created successfully",
        "product": new_product,
        "success": True,
    }


@router.put(
    "/{product_id}",
    summary="Update product",
    description="Update product information.",
)
async def update_product(
    product_id: str,
    request: UpdateProductRequest,
    db: Annotated[Session, Depends(get_db)],
    current_user: User = Depends(require_roles(UserRole.ADMIN)),
):
    """Update a product."""
    from app.core.exceptions import NotFoundException, BadRequestException
    
    product = next(
        (p for p in PRODUCTS if str(p["id"]) == product_id),
        None
    )
    
    if not product:
        raise NotFoundException("Product", product_id)
    
    # Update fields
    if request.name is not None:
        # Check for duplicate name
        existing = next(
            (p for p in PRODUCTS 
             if p["name"].lower() == request.name.lower() 
             and str(p["id"]) != product_id),
            None
        )
        if existing:
            raise BadRequestException("A product with this name already exists")
        product["name"] = request.name
    
    if request.description is not None:
        product["description"] = request.description
    
    if request.price is not None:
        product["price"] = request.price
    
    if request.category is not None:
        if request.category not in [c["id"] for c in CATEGORIES]:
            raise BadRequestException(
                f"Invalid category. Must be one of: {[c['id'] for c in CATEGORIES]}"
            )
        product["category"] = request.category
    
    if request.image is not None:
        product["image"] = request.image
    
    if request.is_available is not None:
        product["is_available"] = request.is_available
    
    if request.stock is not None:
        product["stock"] = request.stock
    
    if request.ingredients is not None:
        product["ingredients"] = request.ingredients
    
    if request.nutrition is not None:
        product["nutrition"] = request.nutrition
    
    product["updated_at"] = datetime.now().isoformat()
    product["updated_by"] = current_user.id
    
    return {
        "message": "Product updated successfully",
        "product": product,
        "success": True,
    }


@router.delete(
    "/{product_id}",
    summary="Delete product",
    description="Delete a product.",
)
async def delete_product(
    product_id: str,
    db: Annotated[Session, Depends(get_db)],
    current_user: User = Depends(require_roles(UserRole.ADMIN)),
):
    """Delete a product."""
    from app.core.exceptions import NotFoundException
    
    product_index = next(
        (i for i, p in enumerate(PRODUCTS) if str(p["id"]) == product_id),
        None
    )
    
    if product_index is None:
        raise NotFoundException("Product", product_id)
    
    deleted_product = PRODUCTS.pop(product_index)
    
    return {
        "message": "Product deleted successfully",
        "product_id": product_id,
        "product_name": deleted_product["name"],
        "success": True,
    }


@router.put(
    "/{product_id}/stock",
    summary="Update stock",
    description="Update product stock level.",
)
async def update_stock(
    product_id: str,
    stock: int = Query(..., ge=0, description="New stock level"),
    db: Annotated[Session, Depends(get_db)] = None,
    current_user: User = Depends(require_roles(UserRole.ADMIN, UserRole.KASIR)),
):
    """Update product stock level."""
    from app.core.exceptions import NotFoundException
    
    product = next(
        (p for p in PRODUCTS if str(p["id"]) == product_id),
        None
    )
    
    if not product:
        raise NotFoundException("Product", product_id)
    
    old_stock = product.get("stock", 0)
    product["stock"] = stock
    product["stock_updated_at"] = datetime.now().isoformat()
    product["stock_updated_by"] = current_user.id
    
    return {
        "message": f"Stock updated: {old_stock} → {stock}",
        "product_id": product_id,
        "old_stock": old_stock,
        "new_stock": stock,
        "success": True,
    }
