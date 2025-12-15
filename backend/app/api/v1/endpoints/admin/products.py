"""Admin Products API - Manage products and inventory."""
import uuid
from typing import Annotated

from fastapi import APIRouter, Depends, Query, UploadFile, File
from sqlalchemy.orm import Session

from app.core.exceptions import BadRequestException, NotFoundException
from app.core.permissions import require_roles
from app.db.session import get_db
from app.models.product import Product, ProductCategory
from app.models.user import User, UserRole
from app.schemas.product import AdminProductCreate, AdminProductUpdate, BatchDeleteRequest
from app.serializers.product_serializer import ProductSerializer
from app.utils.json_helpers import safe_json_dumps

from app.api.v1.endpoints.admin.product_import_export import (
    ImportResult,
    export_products_to_csv,
    export_products_to_excel,
    import_products_from_csv,
    import_products_from_excel,
    generate_csv_template,
)

router = APIRouter()


@router.get("", summary="Get all products")
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
    query = db.query(Product).filter(Product.is_deleted == False)

    if category:
        query = query.filter(Product.category_id == category)

    if is_available is not None:
        query = query.filter(Product.is_available == is_available)

    if search:
        pattern = f"%{search}%"
        query = query.filter(
            (Product.name.ilike(pattern)) | (Product.description.ilike(pattern))
        )

    total = query.count()
    products = query.offset(skip).limit(limit).all()

    return {
        "products": [ProductSerializer.to_admin_dict(p) for p in products],
        "total": total,
        "skip": skip,
        "limit": limit,
    }


@router.get("/export/csv", summary="Export products to CSV")
async def export_products_csv_route(
    db: Annotated[Session, Depends(get_db)],
    current_user: User = Depends(require_roles(UserRole.ADMIN)),
):
    """Export all products to CSV format."""
    products = db.query(Product).filter(Product.is_deleted == False).all()
    return export_products_to_csv(products)


@router.get("/export/excel", summary="Export products to Excel")
async def export_products_excel_route(
    db: Annotated[Session, Depends(get_db)],
    current_user: User = Depends(require_roles(UserRole.ADMIN)),
):
    """Export all products to Excel format."""
    products = db.query(Product).filter(Product.is_deleted == False).all()
    return export_products_to_excel(products)


@router.post("/import/csv", summary="Import products from CSV", response_model=ImportResult)
async def import_csv_route(
    file: UploadFile = File(...),
    db: Annotated[Session, Depends(get_db)] = None,
    current_user: User = Depends(require_roles(UserRole.ADMIN)),
):
    """Import products from CSV file."""
    return await import_products_from_csv(file, db)


@router.post("/import/excel", summary="Import products from Excel", response_model=ImportResult)
async def import_excel_route(
    file: UploadFile = File(...),
    db: Annotated[Session, Depends(get_db)] = None,
    current_user: User = Depends(require_roles(UserRole.ADMIN)),
):
    """Import products from Excel file."""
    return await import_products_from_excel(file, db)


@router.get("/template/csv", summary="Download CSV template")
async def download_csv_template_route(
    current_user: User = Depends(require_roles(UserRole.ADMIN)),
):
    """Download CSV template for product import."""
    return generate_csv_template()


@router.get("/{product_id}", summary="Get product details")
async def get_product(
    product_id: str,
    db: Annotated[Session, Depends(get_db)],
    current_user: User = Depends(require_roles(UserRole.ADMIN)),
):
    """Get product by ID."""
    product = db.query(Product).filter(
        Product.id == product_id,
        Product.is_deleted == False,
    ).first()

    if not product:
        raise NotFoundException("Product", product_id)

    return ProductSerializer.to_admin_dict(product)


@router.post("", summary="Create product")
async def create_product(
    request: AdminProductCreate,
    db: Annotated[Session, Depends(get_db)],
    current_user: User = Depends(require_roles(UserRole.ADMIN)),
):
    """Create a new product."""
    category = db.query(ProductCategory).filter(
        ProductCategory.id == request.category
    ).first()
    if not category:
        raise BadRequestException(f"Invalid category ID: {request.category}")

    existing = db.query(Product).filter(Product.name.ilike(request.name)).first()
    if existing:
        raise BadRequestException("A product with this name already exists")

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
        ingredients=safe_json_dumps(request.ingredients),
        calories=request.calories,
        has_sizes=request.has_sizes,
        size_prices=safe_json_dumps(request.size_prices),
        size_volumes=safe_json_dumps(request.size_volumes),
        size_calories=safe_json_dumps(request.size_calories),
        volume_unit=request.volume_unit,
        allergy_warning=request.allergy_warning,
    )

    db.add(new_product)
    db.commit()
    db.refresh(new_product)

    return {
        "message": "Product created successfully",
        "product": ProductSerializer.to_admin_dict(new_product),
        "success": True,
    }


@router.put("/{product_id}", summary="Update product")
async def update_product(
    product_id: str,
    request: AdminProductUpdate,
    db: Annotated[Session, Depends(get_db)],
    current_user: User = Depends(require_roles(UserRole.ADMIN)),
):
    """Update a product."""
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise NotFoundException("Product", product_id)

    if request.name is not None:
        existing = db.query(Product).filter(
            Product.name.ilike(request.name),
            Product.id != product_id,
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
        category = db.query(ProductCategory).filter(
            ProductCategory.id == request.category
        ).first()
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
        product.ingredients = safe_json_dumps(request.ingredients)

    if request.allergy_warning is not None:
        product.allergy_warning = request.allergy_warning

    if request.has_sizes is not None:
        product.has_sizes = request.has_sizes

    if request.size_prices is not None:
        product.size_prices = safe_json_dumps(request.size_prices)

    if request.size_volumes is not None:
        product.size_volumes = safe_json_dumps(request.size_volumes)

    if request.size_calories is not None:
        product.size_calories = safe_json_dumps(request.size_calories)

    if request.volume_unit is not None:
        product.volume_unit = request.volume_unit

    db.commit()
    db.refresh(product)

    return {
        "message": "Product updated successfully",
        "product": ProductSerializer.to_admin_dict(product),
        "success": True,
    }


@router.delete("/{product_id}", summary="Delete product")
async def delete_product(
    product_id: str,
    db: Annotated[Session, Depends(get_db)],
    current_user: User = Depends(require_roles(UserRole.ADMIN)),
):
    """Soft delete a product."""
    product = db.query(Product).filter(Product.id == product_id).first()

    if not product or product.is_deleted:
        raise NotFoundException("Product", product_id)

    product_name = product.name
    product.is_deleted = True
    product.is_available = False
    db.commit()

    return {
        "message": "Product deleted successfully",
        "product_id": product_id,
        "product_name": product_name,
        "success": True,
    }


@router.post("/batch-delete", summary="Batch delete products")
async def batch_delete_products(
    request: BatchDeleteRequest,
    db: Annotated[Session, Depends(get_db)],
    current_user: User = Depends(require_roles(UserRole.ADMIN)),
):
    """Batch soft delete products."""
    deleted_count = 0
    deleted_names = []
    failed_ids = []

    for product_id in request.product_ids:
        product = db.query(Product).filter(
            Product.id == product_id,
            Product.is_deleted == False,
        ).first()

        if product:
            product.is_deleted = True
            product.is_available = False
            deleted_count += 1
            deleted_names.append(product.name)
        else:
            failed_ids.append(product_id)

    db.commit()

    return {
        "message": f"Successfully deleted {deleted_count} products",
        "deleted_count": deleted_count,
        "deleted_names": deleted_names,
        "failed_ids": failed_ids,
        "success": True,
    }


@router.put("/{product_id}/stock", summary="Update stock")
async def update_stock(
    product_id: str,
    stock: int = Query(..., ge=0),
    db: Annotated[Session, Depends(get_db)] = None,
    current_user: User = Depends(require_roles(UserRole.ADMIN, UserRole.KASIR)),
):
    """Update product stock level."""
    product = db.query(Product).filter(Product.id == product_id).first()

    if not product:
        raise NotFoundException("Product", product_id)

    old_stock = product.stock_quantity
    product.stock_quantity = stock
    db.commit()

    return {
        "message": f"Stock updated: {old_stock} -> {stock}",
        "product_id": product_id,
        "old_stock": old_stock,
        "new_stock": stock,
        "success": True,
    }
