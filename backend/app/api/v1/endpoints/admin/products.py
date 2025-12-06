"""
Admin Products API.
Manage products and inventory.
"""
from typing import Annotated
import uuid
import json

from fastapi import APIRouter, Depends, Query, UploadFile, File
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.core.permissions import require_roles
from app.models.user import User, UserRole
from app.models.product import Product, ProductCategory

# Import/Export functions
from app.api.v1.endpoints.admin.product_import_export import (
    ImportResult,
    export_products_to_csv,
    export_products_to_excel,
    import_products_from_csv,
    import_products_from_excel,
    generate_csv_template,
)

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
    allergy_warning: str | None = None
    calories: int | None = None
    # Size variants
    has_sizes: bool = True
    size_prices: dict | None = None  # {"small": 10000, "medium": 15000, "large": 20000}
    size_volumes: dict | None = None  # {"small": 250, "medium": 350, "large": 500}
    size_calories: dict | None = None  # {"small": 120, "medium": 180, "large": 240}
    volume_unit: str = "ml"


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
    allergy_warning: str | None = None
    calories: int | None = None
    # Size variants
    has_sizes: bool | None = None
    size_prices: dict | None = None
    size_volumes: dict | None = None
    size_calories: dict | None = None
    volume_unit: str | None = None


def product_to_dict(product: Product) -> dict:
    """Convert Product model to dictionary."""
    ingredients = []
    if product.ingredients:
        try:
            ingredients = json.loads(product.ingredients)
        except json.JSONDecodeError:
            ingredients = []
    
    # Get size prices and volumes
    prices = product.get_all_prices()
    volumes = product.get_all_volumes()
    
    # Parse stored size data
    size_prices = None
    size_volumes = None
    size_calories = None
    if product.size_prices:
        try:
            size_prices = json.loads(product.size_prices)
        except json.JSONDecodeError:
            pass
    if product.size_volumes:
        try:
            size_volumes = json.loads(product.size_volumes)
        except json.JSONDecodeError:
            pass
    if product.size_calories:
        try:
            size_calories = json.loads(product.size_calories)
        except json.JSONDecodeError:
            pass
    
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
        "size_calories": size_calories,
        "calories_by_size": product.get_all_calories(),
        "allergy_warning": product.allergy_warning,
        "rating": product.average_rating,
        "reviews": product.order_count,
        "order_count": product.order_count,
        # Size variants
        "has_sizes": product.has_sizes,
        "size_prices": size_prices,
        "size_volumes": size_volumes,
        "volume_unit": product.volume_unit,
        "prices": prices,  # Computed prices for all sizes
        "volumes": volumes,  # Computed volumes for all sizes
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
    
    # Exclude soft-deleted products
    query = query.filter(Product.is_deleted == False)
    
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
    "/export/csv",
    summary="Export products to CSV",
    description="Export all products to CSV format.",
)
async def export_products_csv_route(
    db: Annotated[Session, Depends(get_db)],
    current_user: User = Depends(require_roles(UserRole.ADMIN)),
):
    """Export all products to CSV format."""
    products = db.query(Product).filter(Product.is_deleted == False).all()
    return export_products_to_csv(products)


@router.get(
    "/export/excel",
    summary="Export products to Excel",
    description="Export all products to Excel format.",
)
async def export_products_excel_route(
    db: Annotated[Session, Depends(get_db)],
    current_user: User = Depends(require_roles(UserRole.ADMIN)),
):
    """Export all products to Excel format (XLSX)."""
    products = db.query(Product).filter(Product.is_deleted == False).all()
    return export_products_to_excel(products)


@router.post(
    "/import/csv",
    summary="Import products from CSV",
    description="Import products from CSV file. Updates existing products by name.",
    response_model=ImportResult,
)
async def import_csv_route(
    file: UploadFile = File(...),
    db: Annotated[Session, Depends(get_db)] = None,
    current_user: User = Depends(require_roles(UserRole.ADMIN)),
):
    """Import products from CSV file."""
    return await import_products_from_csv(file, db)


@router.post(
    "/import/excel",
    summary="Import products from Excel",
    description="Import products from Excel file. Updates existing products by name.",
    response_model=ImportResult,
)
async def import_excel_route(
    file: UploadFile = File(...),
    db: Annotated[Session, Depends(get_db)] = None,
    current_user: User = Depends(require_roles(UserRole.ADMIN)),
):
    """Import products from Excel file."""
    return await import_products_from_excel(file, db)


@router.get(
    "/template/csv",
    summary="Download CSV template",
    description="Download a CSV template for importing products.",
)
async def download_csv_template_route(
    current_user: User = Depends(require_roles(UserRole.ADMIN)),
):
    """Download CSV template for product import."""
    return generate_csv_template()


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
    product = db.query(Product).filter(
        Product.id == product_id,
        Product.is_deleted == False
    ).first()
    
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
        calories=request.calories,
        # Size variants
        has_sizes=request.has_sizes,
        size_prices=json.dumps(request.size_prices) if request.size_prices else None,
        size_volumes=json.dumps(request.size_volumes) if request.size_volumes else None,
        size_calories=json.dumps(request.size_calories) if request.size_calories else None,
        volume_unit=request.volume_unit,
        allergy_warning=request.allergy_warning,
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
    if request.calories is not None:
        product.calories = request.calories
    
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
    if request.allergy_warning is not None:
        product.allergy_warning = request.allergy_warning
    
    # Size variants
    if request.has_sizes is not None:
        product.has_sizes = request.has_sizes
    
    if request.size_prices is not None:
        product.size_prices = json.dumps(request.size_prices)
    
    if request.size_volumes is not None:
        product.size_volumes = json.dumps(request.size_volumes)

    if request.size_calories is not None:
        product.size_calories = json.dumps(request.size_calories)
    
    if request.volume_unit is not None:
        product.volume_unit = request.volume_unit
    
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
    """Delete a product (soft delete to preserve order history)."""
    from app.core.exceptions import NotFoundException
    
    product = db.query(Product).filter(Product.id == product_id).first()
    
    if not product:
        raise NotFoundException("Product", product_id)
    
    if product.is_deleted:
        raise NotFoundException("Product", product_id)
    
    product_name = product.name
    
    # Soft delete - mark as deleted instead of actually deleting
    # This preserves order history integrity
    product.is_deleted = True
    product.is_available = False
    
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
