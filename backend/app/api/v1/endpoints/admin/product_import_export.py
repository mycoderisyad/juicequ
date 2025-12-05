"""
Product Import/Export Functions.
Handles CSV and Excel import/export for products.
"""
import csv
import io
import json
import uuid
from datetime import datetime
from typing import TYPE_CHECKING

from fastapi import UploadFile
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.models.product import Product, ProductCategory

if TYPE_CHECKING:
    pass


class ImportResult(BaseModel):
    """Result of import operation."""
    success: bool
    total_rows: int
    imported: int
    updated: int
    skipped: int
    errors: list[str]


# CSV Export Headers
EXPORT_HEADERS = [
    "name", "description", "price", "category_id", "stock",
    "is_available", "ingredients", "calories", "image_url",
    "hero_image", "bottle_image", "thumbnail_image"
]


def _get_product_ingredients_str(product: Product) -> str:
    """Get product ingredients as semicolon-separated string."""
    if not product.ingredients:
        return ""
    try:
        return ";".join(json.loads(product.ingredients))
    except json.JSONDecodeError:
        return ""


def _parse_ingredients(ingredients_str: str) -> str | None:
    """Parse ingredients string to JSON."""
    if not ingredients_str:
        return None
    return json.dumps([i.strip() for i in ingredients_str.split(";") if i.strip()])


def _product_to_csv_row(product: Product) -> list:
    """Convert product to CSV row."""
    return [
        product.name,
        product.description or "",
        product.base_price,
        product.category_id,
        product.stock_quantity,
        "true" if product.is_available else "false",
        _get_product_ingredients_str(product),
        product.calories or "",
        product.image_url or "",
        product.hero_image or "",
        product.bottle_image or "",
        product.thumbnail_image or "",
    ]


# ============================================================
# CSV Export
# ============================================================

def export_products_to_csv(products: list[Product]) -> StreamingResponse:
    """Export products to CSV format."""
    output = io.StringIO()
    writer = csv.writer(output)
    
    # Write header
    writer.writerow(EXPORT_HEADERS)
    
    # Write data
    for product in products:
        writer.writerow(_product_to_csv_row(product))
    
    output.seek(0)
    
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={
            "Content-Disposition": f"attachment; filename=products_export_{datetime.now().strftime('%Y%m%d_%H%M%S')}.csv"
        }
    )


def generate_csv_template() -> StreamingResponse:
    """Generate CSV template for product import."""
    output = io.StringIO()
    writer = csv.writer(output)
    
    # Write header
    writer.writerow(EXPORT_HEADERS)
    
    # Write example row
    writer.writerow([
        "Contoh Jus Jeruk",
        "Jus jeruk segar yang menyegarkan dan kaya vitamin C",
        15000,
        "fruit-juices",
        100,
        "true",
        "Jeruk;Air;Gula",
        120,
        "bg-orange-500",
        "",
        "",
        ""
    ])
    
    output.seek(0)
    
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={
            "Content-Disposition": "attachment; filename=products_template.csv"
        }
    )


# ============================================================
# Excel Export
# ============================================================

def export_products_to_excel(products: list[Product]) -> StreamingResponse:
    """Export products to Excel format (XLSX)."""
    try:
        import openpyxl
        from openpyxl.styles import Font, PatternFill, Alignment, Border, Side
    except ImportError:
        from app.core.exceptions import BadRequestException
        raise BadRequestException("Excel export requires openpyxl library. Please install it.")
    
    # Create workbook
    wb = openpyxl.Workbook()
    ws = wb.active
    ws.title = "Products"
    
    # Style for headers
    header_font = Font(bold=True, color="FFFFFF")
    header_fill = PatternFill(start_color="4A5568", end_color="4A5568", fill_type="solid")
    header_alignment = Alignment(horizontal="center", vertical="center")
    thin_border = Border(
        left=Side(style='thin'),
        right=Side(style='thin'),
        top=Side(style='thin'),
        bottom=Side(style='thin')
    )
    
    # Write headers with styling
    for col, header in enumerate(EXPORT_HEADERS, 1):
        cell = ws.cell(row=1, column=col, value=header)
        cell.font = header_font
        cell.fill = header_fill
        cell.alignment = header_alignment
        cell.border = thin_border
    
    # Write data
    for row_idx, product in enumerate(products, 2):
        data = _product_to_csv_row(product)
        for col, value in enumerate(data, 1):
            cell = ws.cell(row=row_idx, column=col, value=value)
            cell.border = thin_border
    
    # Adjust column widths
    for col in ws.columns:
        max_length = 0
        column = col[0].column_letter
        for cell in col:
            try:
                if len(str(cell.value)) > max_length:
                    max_length = len(str(cell.value))
            except (TypeError, AttributeError):
                # Skip cells with invalid values
                continue
        adjusted_width = min(max_length + 2, 50)
        ws.column_dimensions[column].width = adjusted_width    
    # Save to memory
    output = io.BytesIO()
    wb.save(output)
    output.seek(0)
    
    return StreamingResponse(
        output,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={
            "Content-Disposition": f"attachment; filename=products_export_{datetime.now().strftime('%Y%m%d_%H%M%S')}.xlsx"
        }
    )


# ============================================================
# CSV Import
# ============================================================

def _validate_and_process_row(
    row: dict,
    row_num: int,
    db: Session,
    result: dict
) -> Product | None:
    """Validate and process a single import row."""
    name = str(row.get("name", "") or "").strip()
    if not name:
        result["errors"].append(f"Row {row_num}: Missing product name")
        result["skipped"] += 1
        return None
    
    description = str(row.get("description", "") or "").strip()
    if not description or len(description) < 10:
        description = f"Delicious {name} juice"
    
    try:
        price = float(row.get("price", 0) or 0)
        if price <= 0:
            result["errors"].append(f"Row {row_num}: Invalid price for '{name}'")
            result["skipped"] += 1
            return None
    except (ValueError, TypeError):
        result["errors"].append(f"Row {row_num}: Invalid price format for '{name}'")
        result["skipped"] += 1
        return None
    
    category_id = str(row.get("category_id", "") or "").strip()
    if not category_id:
        result["errors"].append(f"Row {row_num}: Missing category_id for '{name}'")
        result["skipped"] += 1
        return None
    
    # Validate category exists
    category = db.query(ProductCategory).filter(ProductCategory.id == category_id).first()
    if not category:
        result["errors"].append(f"Row {row_num}: Invalid category_id '{category_id}' for '{name}'")
        result["skipped"] += 1
        return None
    
    try:
        stock = int(row.get("stock", 100) or 100)
    except (ValueError, TypeError):
        stock = 100
    
    is_available_str = str(row.get("is_available", "true") or "true").strip().lower()
    is_available = is_available_str in ("true", "1", "yes")
    
    ingredients = _parse_ingredients(str(row.get("ingredients", "") or ""))
    
    try:
        calories = int(row.get("calories", 0) or 0) if row.get("calories") else None
    except (ValueError, TypeError):
        calories = None
    
    # Check if product exists
    existing = db.query(Product).filter(Product.name.ilike(name)).first()
    
    if existing:
        # Update existing product
        existing.description = description
        existing.base_price = price
        existing.category_id = category_id
        existing.stock_quantity = stock
        existing.is_available = is_available
        existing.is_deleted = False  # Restore if was deleted
        if ingredients:
            existing.ingredients = ingredients
        if calories:
            existing.calories = calories
        if row.get("image_url"):
            existing.image_url = str(row.get("image_url"))
        if row.get("hero_image"):
            existing.hero_image = str(row.get("hero_image"))
        if row.get("bottle_image"):
            existing.bottle_image = str(row.get("bottle_image"))
        if row.get("thumbnail_image"):
            existing.thumbnail_image = str(row.get("thumbnail_image"))
        result["updated"] += 1
        return existing
    else:
        # Create new product
        new_product = Product(
            id=str(uuid.uuid4()),
            name=name,
            description=description,
            base_price=price,
            category_id=category_id,
            stock_quantity=stock,
            is_available=is_available,
            ingredients=ingredients,
            calories=calories,
            image_url=str(row.get("image_url") or "bg-green-500"),
            hero_image=str(row.get("hero_image") or "") if row.get("hero_image") else None,
            bottle_image=str(row.get("bottle_image") or "") if row.get("bottle_image") else None,
            thumbnail_image=str(row.get("thumbnail_image") or "") if row.get("thumbnail_image") else None,
        )
        db.add(new_product)
        result["imported"] += 1
        return new_product


# Maximum file size for imports (10 MB)
MAX_FILE_SIZE = 10 * 1024 * 1024


async def import_products_from_csv(file: UploadFile, db: Session) -> dict:
    """Import products from CSV file."""
    from app.core.exceptions import BadRequestException
    
    if not file.filename.endswith('.csv'):
        raise BadRequestException("File must be a CSV file")
    
    content = await file.read()
    
    # Validate file size
    if len(content) > MAX_FILE_SIZE:
        raise BadRequestException(
            f"File size exceeds maximum allowed size of {MAX_FILE_SIZE // (1024 * 1024)} MB"
        )
    
    try:
        text = content.decode('utf-8')
    except UnicodeDecodeError:
        try:
            text = content.decode('latin-1')
        except:
            raise BadRequestException("Unable to decode file. Please use UTF-8 encoding.")
    
    reader = csv.DictReader(io.StringIO(text))
    
    result = {
        "total_rows": 0,
        "imported": 0,
        "updated": 0,
        "skipped": 0,
        "errors": []
    }
    
    for row_num, row in enumerate(reader, 2):
        result["total_rows"] += 1
        
        try:
            _validate_and_process_row(row, row_num, db, result)
        except Exception as e:
            result["errors"].append(f"Row {row_num}: Unexpected error - {str(e)}")
            result["skipped"] += 1
    
    db.commit()
    
    return {
        "success": True,
        "total_rows": result["total_rows"],
        "imported": result["imported"],
        "updated": result["updated"],
        "skipped": result["skipped"],
        "errors": result["errors"][:20]  # Limit errors to first 20
    }


# ============================================================
# Excel Import
# ============================================================

async def import_products_from_excel(file: UploadFile, db: Session) -> dict:
    """Import products from Excel file."""
    from app.core.exceptions import BadRequestException
    
    if not file.filename.endswith(('.xlsx', '.xls')):
        raise BadRequestException("File must be an Excel file (.xlsx or .xls)")
    
    try:
        import openpyxl
    except ImportError:
        raise BadRequestException("Excel import requires openpyxl library. Please install it.")
    
    content = await file.read()
    
    # Validate file size
    if len(content) > MAX_FILE_SIZE:
        raise BadRequestException(
            f"File size exceeds maximum allowed size of {MAX_FILE_SIZE // (1024 * 1024)} MB"
        )
    
    try:
        wb = openpyxl.load_workbook(io.BytesIO(content))
        ws = wb.active
    except Exception as e:
        raise BadRequestException(f"Unable to read Excel file: {str(e)}")
    
    result = {
        "total_rows": 0,
        "imported": 0,
        "updated": 0,
        "skipped": 0,
        "errors": []
    }
    
    # Get headers from first row
    headers = [cell.value for cell in ws[1] if cell.value]
    if not headers:
        raise BadRequestException("Excel file has no headers in the first row")
    
    # Process rows
    for row_num, row in enumerate(ws.iter_rows(min_row=2, values_only=True), 2):
        # Skip empty rows
        if not any(row):
            continue
        
        result["total_rows"] += 1
        
        # Create dict from row
        row_dict = {}
        for idx, header in enumerate(headers):
            if idx < len(row):
                row_dict[header] = row[idx]
        
        try:
            _validate_and_process_row(row_dict, row_num, db, result)
        except Exception as e:
            result["errors"].append(f"Row {row_num}: Unexpected error - {str(e)}")
            result["skipped"] += 1
    
    db.commit()
    
    return {
        "success": True,
        "total_rows": result["total_rows"],
        "imported": result["imported"],
        "updated": result["updated"],
        "skipped": result["skipped"],
        "errors": result["errors"][:20]
    }
