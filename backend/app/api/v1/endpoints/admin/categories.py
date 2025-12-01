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

router = APIRouter()

# Import shared categories list
from app.api.v1.endpoints.customer.products import CATEGORIES


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
    # Add product count for each category
    from app.api.v1.endpoints.customer.products import PRODUCTS
    
    categories_with_count = []
    for category in CATEGORIES:
        product_count = len([p for p in PRODUCTS if p["category"] == category["id"]])
        categories_with_count.append({
            **category,
            "product_count": product_count,
        })
    
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
    from app.api.v1.endpoints.customer.products import PRODUCTS
    
    category = next(
        (c for c in CATEGORIES if c["id"] == category_id),
        None
    )
    
    if not category:
        from app.core.exceptions import NotFoundException
        raise NotFoundException("Category", category_id)
    
    # Get products in this category
    products = [p for p in PRODUCTS if p["category"] == category_id]
    
    return {
        **category,
        "product_count": len(products),
        "products": products,
    }


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
    existing = next(
        (c for c in CATEGORIES if c["id"] == request.id),
        None
    )
    if existing:
        raise BadRequestException("A category with this ID already exists")
    
    # Create category
    new_category = {
        "id": request.id,
        "name": request.name,
        "icon": request.icon,
        "description": request.description,
        "created_at": datetime.now().isoformat(),
        "created_by": current_user.id,
    }
    
    CATEGORIES.append(new_category)
    
    return {
        "message": "Category created successfully",
        "category": new_category,
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
    
    category = next(
        (c for c in CATEGORIES if c["id"] == category_id),
        None
    )
    
    if not category:
        raise NotFoundException("Category", category_id)
    
    # Update fields
    if request.name is not None:
        category["name"] = request.name
    
    if request.icon is not None:
        category["icon"] = request.icon
    
    if request.description is not None:
        category["description"] = request.description
    
    category["updated_at"] = datetime.now().isoformat()
    category["updated_by"] = current_user.id
    
    return {
        "message": "Category updated successfully",
        "category": category,
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
    from app.api.v1.endpoints.customer.products import PRODUCTS
    
    category_index = next(
        (i for i, c in enumerate(CATEGORIES) if c["id"] == category_id),
        None
    )
    
    if category_index is None:
        raise NotFoundException("Category", category_id)
    
    # Check if category has products
    products_in_category = [p for p in PRODUCTS if p["category"] == category_id]
    if products_in_category:
        raise BadRequestException(
            f"Cannot delete category with {len(products_in_category)} products. "
            "Move or delete products first."
        )
    
    deleted_category = CATEGORIES.pop(category_index)
    
    return {
        "message": "Category deleted successfully",
        "category_id": category_id,
        "category_name": deleted_category["name"],
        "success": True,
    }
