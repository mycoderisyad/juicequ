"""
Admin Products API.
Manage products and inventory.
"""
from datetime import datetime
from typing import Annotated
import uuid
import json

from fastapi import APIRouter, Depends, Query
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.core.permissions import require_roles
from app.models.user import User, UserRole
from app.models.product import Product, ProductCategory

router = APIRouter()


class CreateProductRequest(BaseModel):
    """Request to create a product."""
    name: str = Field(..., min_length=2, max_length=100)
    description: str = Field(..., min_length=10, max_length=500)
    price: float = Field(..., gt=0)
    category: str
    image: str | None = None
    hero_image: str | None = None
    bottle_image: str | None = None
    thumbnail_image: str | None = None
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
    hero_image: str | None = None
    bottle_image: str | None = None
    thumbnail_image: str | None = None
    is_available: bool | None = None
    stock: int | None = Field(None, ge=0)
    ingredients: list[str] | None = None
    nutrition: dict | None = None


def product_to_dict(product: Product) -> dict:
    """Convert Product model to dictionary."""
    ingredients = []
    if product.ingredients:
        try:
            ingredients = json.loads(product.ingredients)
        except json.JSONDecodeError:
            ingredients = []
    
    return {
        "id": product.id,
        "name": product.name,
        "description": product.description,
        "price": product.base_price,
        "base_price": product.base_price,
        "category": product.category_id,
        "category_id": product.category_id,
        "category_name": product.category.name if product.category else None,
        "image": product.image_url,
        "image_color": product.image_url,  # For frontend compatibility
        "hero_image": product.hero_image,
        "bottle_image": product.bottle_image,
        "thumbnail_image": product.thumbnail_image,
        "is_available": product.is_available,
        "stock": product.stock_quantity,
        "stock_quantity": product.stock_quantity,
        "ingredients": ingredients,
        "calories": product.calories,
        "rating": product.average_rating,
        "reviews": product.order_count,
        "order_count": product.order_count,
        "created_at": product.created_at.isoformat() if product.created_at else None,
        "updated_at": product.updated_at.isoformat() if product.updated_at else None,
    }


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
    query = db.query(Product)
    
    # Apply filters
    if category:
        query = query.filter(Product.category_id == category)
    
    if is_available is not None:
        query = query.filter(Product.is_available == is_available)
    
    if search:
        search_pattern = f"%{search}%"
        query = query.filter(
            (Product.name.ilike(search_pattern)) | 
            (Product.description.ilike(search_pattern))
        )
    
    total = query.count()
    products = query.offset(skip).limit(limit).all()
    
    return {
        "products": [product_to_dict(p) for p in products],
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
    product = db.query(Product).filter(Product.id == product_id).first()
    
    if not product:
        from app.core.exceptions import NotFoundException
        raise NotFoundException("Product", product_id)
    
    return product_to_dict(product)


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
    
    # Validate category exists
    category = db.query(ProductCategory).filter(ProductCategory.id == request.category).first()
    if not category:
        raise BadRequestException(
            f"Invalid category ID: {request.category}. Category does not exist."
        )
    
    # Check for duplicate name
    existing = db.query(Product).filter(Product.name.ilike(request.name)).first()
    if existing:
        raise BadRequestException("A product with this name already exists")
    
    # Create product
    new_product = Product(
        id=str(uuid.uuid4()),
        name=request.name,
        description=request.description,
        base_price=request.price,
        category_id=request.category,
        image_url=request.image or "bg-green-500",
        hero_image=request.hero_image,
        bottle_image=request.bottle_image,
        thumbnail_image=request.thumbnail_image,
        is_available=request.is_available,
        stock_quantity=request.stock,
        ingredients=json.dumps(request.ingredients) if request.ingredients else None,
    )
    
    db.add(new_product)
    db.commit()
    db.refresh(new_product)
    
    return {
        "message": "Product created successfully",
        "product": product_to_dict(new_product),
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
    
    product = db.query(Product).filter(Product.id == product_id).first()
    
    if not product:
        raise NotFoundException("Product", product_id)
    
    # Update fields
    if request.name is not None:
        # Check for duplicate name
        existing = db.query(Product).filter(
            Product.name.ilike(request.name),
            Product.id != product_id
        ).first()
        if existing:
            raise BadRequestException("A product with this name already exists")
        product.name = request.name
    
    if request.description is not None:
        product.description = request.description
    
    if request.price is not None:
        product.base_price = request.price
    
    if request.category is not None:
        # Validate category exists
        category = db.query(ProductCategory).filter(ProductCategory.id == request.category).first()
        if not category:
            raise BadRequestException(f"Invalid category ID: {request.category}")
        product.category_id = request.category
    
    if request.image is not None:
        product.image_url = request.image
    
    if request.hero_image is not None:
        product.hero_image = request.hero_image
    
    if request.bottle_image is not None:
        product.bottle_image = request.bottle_image
    
    if request.thumbnail_image is not None:
        product.thumbnail_image = request.thumbnail_image
    
    if request.is_available is not None:
        product.is_available = request.is_available
    
    if request.stock is not None:
        product.stock_quantity = request.stock
    
    if request.ingredients is not None:
        product.ingredients = json.dumps(request.ingredients)
    
    db.commit()
    db.refresh(product)
    
    return {
        "message": "Product updated successfully",
        "product": product_to_dict(product),
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
    
    product = db.query(Product).filter(Product.id == product_id).first()
    
    if not product:
        raise NotFoundException("Product", product_id)
    
    product_name = product.name
    db.delete(product)
    db.commit()
    
    return {
        "message": "Product deleted successfully",
        "product_id": product_id,
        "product_name": product_name,
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
    
    product = db.query(Product).filter(Product.id == product_id).first()
    
    if not product:
        raise NotFoundException("Product", product_id)
    
    old_stock = product.stock_quantity
    product.stock_quantity = stock
    
    db.commit()
    
    return {
        "message": f"Stock updated: {old_stock} → {stock}",
        "product_id": product_id,
        "old_stock": old_stock,
        "new_stock": stock,
        "success": True,
    }
