"""
Script to clean invalid image paths from products.
Run this if you have products with image paths pointing to non-existent files.

Usage:
    cd backend
    python -m scripts.clean_invalid_images
"""
import sys
from pathlib import Path

# Add backend to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from sqlalchemy.orm import Session
from app.db.session import SessionLocal
from app.models.product import Product


def check_image_exists(image_path: str | None, base_paths: list[Path]) -> bool:
    """Check if an image file exists at the given path."""
    if not image_path:
        return False
    
    # Skip color classes (bg-*)
    if image_path.startswith("bg-"):
        return True  # Not an actual image, but valid for fallback
    
    # Skip external URLs
    if image_path.startswith("http://") or image_path.startswith("https://"):
        return True  # Assume external URLs are valid
    
    # Check in each base path
    clean_path = image_path.lstrip("/")
    
    for base_path in base_paths:
        # Try direct path
        full_path = base_path / clean_path
        if full_path.exists():
            return True
        
        # Try without 'images/' prefix
        if clean_path.startswith("images/"):
            alt_path = base_path / clean_path[7:]
            if alt_path.exists():
                return True
    
    return False


def clean_invalid_images(db: Session, dry_run: bool = True) -> None:
    """Clean invalid image paths from products."""
    
    # Define base paths to check for images
    base_paths = [
        Path(__file__).parent.parent.parent / "frontend" / "public",
        Path(__file__).parent.parent.parent / "frontend" / "public" / "images",
        Path(__file__).parent.parent / "uploads",
    ]
    
    print(f"Checking image paths against: {[str(p) for p in base_paths]}")
    print("-" * 60)
    
    products = db.query(Product).all()
    invalid_count = 0
    
    for product in products:
        invalid_fields = []
        
        # Check each image field
        image_fields = [
            ("thumbnail_image", product.thumbnail_image),
            ("hero_image", product.hero_image),
            ("bottle_image", product.bottle_image),
            ("image_url", product.image_url),
        ]
        
        for field_name, field_value in image_fields:
            if field_value and not check_image_exists(field_value, base_paths):
                invalid_fields.append((field_name, field_value))
        
        if invalid_fields:
            invalid_count += 1
            print(f"\n❌ Product: {product.name} (ID: {product.id})")
            for field_name, field_value in invalid_fields:
                print(f"   - {field_name}: {field_value}")
                
                if not dry_run:
                    setattr(product, field_name, None)
    
    if not dry_run and invalid_count > 0:
        db.commit()
        print(f"\n✅ Cleaned {invalid_count} products with invalid images")
    elif invalid_count > 0:
        print(f"\n⚠️  Found {invalid_count} products with invalid images (dry run)")
        print("   Run with --apply to actually clean them")
    else:
        print("\n✅ All product images are valid!")


def main():
    """Main function."""
    import argparse
    
    parser = argparse.ArgumentParser(description="Clean invalid image paths from products")
    parser.add_argument("--apply", action="store_true", help="Actually apply changes (default is dry run)")
    args = parser.parse_args()
    
    dry_run = not args.apply
    
    print("🔍 Checking product images...")
    if dry_run:
        print("   (Dry run mode - no changes will be made)")
    print("=" * 60)
    
    db = SessionLocal()
    try:
        clean_invalid_images(db, dry_run=dry_run)
    except Exception as e:
        print(f"❌ Error: {e}")
        db.rollback()
        raise
    finally:
        db.close()


if __name__ == "__main__":
    main()
