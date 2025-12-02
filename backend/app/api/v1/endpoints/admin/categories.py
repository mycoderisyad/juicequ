"""
Admin Categories API.
Manage product categories.
"""
from datetime import datetime
from typing import Annotated

from fastapi import APIRouter, Depends
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.core.permissions import require_roles
from app.models.user import User, UserRole
from app.models.product import Product, ProductCategory

router = APIRouter()


class CreateCategoryRequest(BaseModel):
    """Request to create a category."""
    id: str = Field(..., min_length=2, max_length=50, description="Category ID/slug")
    name: str = Field(..., min_length=2, max_length=100)
    icon: str = Field(default="🍹", max_length=10)
    description: str | None = Field(None, max_length=500)


class UpdateCategoryRequest(BaseModel):
    """Request to update a category."""
    name: str | None = Field(None, min_length=2, max_length=100)
    icon: str | None = Field(None, max_length=10)
    description: str | None = Field(None, max_length=500)


def category_to_dict(category: ProductCategory, product_count: int = 0) -> dict:
    """Convert ProductCategory model to dictionary."""
    return {
        "id": category.id,
        "name": category.name,
        "icon": category.icon,
        "description": category.description,
        "product_count": product_count,
        "created_at": category.created_at.isoformat() if category.created_at else None,
        "updated_at": category.updated_at.isoformat() if category.updated_at else None,
    }


@router.get(
    "",
    summary="Get all categories",
    description="Get all product categories.",
)
async def get_categories(
    db: Annotated[Session, Depends(get_db)],
    current_user: User = Depends(require_roles(UserRole.ADMIN)),
):
    """Get all categories."""
    categories = db.query(ProductCategory).all()
    
    categories_with_count = []
    for category in categories:
        product_count = db.query(Product).filter(Product.category_id == category.id).count()
        categories_with_count.append(category_to_dict(category, product_count))
    
    return {
        "categories": categories_with_count,
        "total": len(categories_with_count),
    }


@router.get(
    "/{category_id}",
    summary="Get category details",
    description="Get detailed category information.",
)
async def get_category(
    category_id: str,
    db: Annotated[Session, Depends(get_db)],
    current_user: User = Depends(require_roles(UserRole.ADMIN)),
):
    """Get category by ID."""
    from app.core.exceptions import NotFoundException
    
    category = db.query(ProductCategory).filter(ProductCategory.id == category_id).first()
    
    if not category:
        raise NotFoundException("Category", category_id)
    
    # Get products in this category
    products = db.query(Product).filter(Product.category_id == category_id).all()
    products_list = []
    for p in products:
        products_list.append({
            "id": p.id,
            "name": p.name,
            "description": p.description,
            "price": p.base_price,
            "image": p.image_url,
            "is_available": p.is_available,
            "stock": p.stock_quantity,
        })
    
    result = category_to_dict(category, len(products))
    result["products"] = products_list
    
    return result


@router.post(
    "",
    summary="Create category",
    description="Create a new product category.",
)
async def create_category(
    request: CreateCategoryRequest,
    db: Annotated[Session, Depends(get_db)],
    current_user: User = Depends(require_roles(UserRole.ADMIN)),
):
    """Create a new category."""
    from app.core.exceptions import BadRequestException
    
    # Check for duplicate ID
    existing = db.query(ProductCategory).filter(ProductCategory.id == request.id).first()
    if existing:
        raise BadRequestException("A category with this ID already exists")
    
    # Create category
    new_category = ProductCategory(
        id=request.id,
        name=request.name,
        icon=request.icon,
        description=request.description,
    )
    
    db.add(new_category)
    db.commit()
    db.refresh(new_category)
    
    return {
        "message": "Category created successfully",
        "category": category_to_dict(new_category),
        "success": True,
    }


@router.put(
    "/{category_id}",
    summary="Update category",
    description="Update category information.",
)
async def update_category(
    category_id: str,
    request: UpdateCategoryRequest,
    db: Annotated[Session, Depends(get_db)],
    current_user: User = Depends(require_roles(UserRole.ADMIN)),
):
    """Update a category."""
    from app.core.exceptions import NotFoundException
    
    category = db.query(ProductCategory).filter(ProductCategory.id == category_id).first()
    
    if not category:
        raise NotFoundException("Category", category_id)
    
    # Update fields
    if request.name is not None:
        category.name = request.name
    
    if request.icon is not None:
        category.icon = request.icon
    
    if request.description is not None:
        category.description = request.description
    
    db.commit()
    db.refresh(category)
    
    return {
        "message": "Category updated successfully",
        "category": category_to_dict(category),
        "success": True,
    }


@router.delete(
    "/{category_id}",
    summary="Delete category",
    description="Delete a category.",
)
async def delete_category(
    category_id: str,
    db: Annotated[Session, Depends(get_db)],
    current_user: User = Depends(require_roles(UserRole.ADMIN)),
):
    """Delete a category."""
    from app.core.exceptions import NotFoundException, BadRequestException
    
    category = db.query(ProductCategory).filter(ProductCategory.id == category_id).first()
    
    if not category:
        raise NotFoundException("Category", category_id)
    
    # Check if category has products
    product_count = db.query(Product).filter(Product.category_id == category_id).count()
    if product_count > 0:
        raise BadRequestException(
            f"Cannot delete category with {product_count} products. "
            "Move or delete products first."
        )
    
    category_name = category.name
    db.delete(category)
    db.commit()
    
    return {
        "message": "Category deleted successfully",
        "category_id": category_id,
        "category_name": category_name,
        "success": True,
    }
