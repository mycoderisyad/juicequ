"""
Database seed data.
Initial data for development and testing.
"""
import logging

from sqlalchemy.orm import Session

from app.core.security import get_password_hash
from app.models.user import User, UserRole
from app.models.product import Product, ProductCategory

logger = logging.getLogger(__name__)


def seed_users(db: Session) -> None:
    """Seed initial users."""
    users_data = [
        {
            "email": "admin@juicequ.com",
            "password": "admin123",
            "full_name": "Admin JuiceQu",
            "role": UserRole.ADMIN,
        },
        {
            "email": "kasir@juicequ.com",
            "password": "kasir123",
            "full_name": "Kasir JuiceQu",
            "role": UserRole.KASIR,
        },
        {
            "email": "user@example.com",
            "password": "user123",
            "full_name": "Test User",
            "role": UserRole.PEMBELI,
        },
    ]
    
    for user_data in users_data:
        existing = db.query(User).filter(User.email == user_data["email"]).first()
        if not existing:
            user = User(
                email=user_data["email"],
                hashed_password=get_password_hash(user_data["password"]),
                full_name=user_data["full_name"],
                role=user_data["role"],
                is_active=True,
                is_verified=True,
            )
            db.add(user)
            logger.info("Created user: %s", user_data["email"])
    
    db.commit()


def seed_categories(db: Session) -> list[ProductCategory]:
    """Seed product categories."""
    categories_data = [
        {"name": "Fresh Juice", "description": "Jus buah segar", "display_order": 1},
        {"name": "Smoothies", "description": "Smoothie lembut dan creamy", "display_order": 2},
        {"name": "Detox", "description": "Jus detox untuk kesehatan", "display_order": 3},
        {"name": "Special Blend", "description": "Campuran spesial khas JuiceQu", "display_order": 4},
    ]
    
    categories = []
    for cat_data in categories_data:
        existing = db.query(ProductCategory).filter(ProductCategory.name == cat_data["name"]).first()
        if not existing:
            category = ProductCategory(**cat_data)
            db.add(category)
            categories.append(category)
            logger.info("Created category: %s", cat_data["name"])
        else:
            categories.append(existing)
    
    db.commit()
    return categories


def seed_products(db: Session, categories: list[ProductCategory]) -> None:
    """Seed products."""
    if not categories:
        logger.warning("No categories found, skipping products")
        return
    
    products_data = [
        {
            "name": "Orange Fresh",
            "description": "Jus jeruk segar tanpa gula tambahan",
            "base_price": 18000,
            "category_id": categories[0].id,
            "calories": 120,
            "is_featured": True,
        },
        {
            "name": "Berry Blast",
            "description": "Campuran berry segar yang menyegarkan",
            "base_price": 25000,
            "category_id": categories[0].id,
            "calories": 150,
            "is_featured": True,
        },
        {
            "name": "Green Detox",
            "description": "Jus sayuran hijau untuk detoksifikasi",
            "base_price": 22000,
            "category_id": categories[2].id,
            "calories": 80,
            "is_featured": True,
        },
        {
            "name": "Tropical Paradise",
            "description": "Campuran buah tropis eksotis",
            "base_price": 28000,
            "category_id": categories[3].id,
            "calories": 180,
            "is_featured": True,
        },
    ]
    
    for prod_data in products_data:
        existing = db.query(Product).filter(Product.name == prod_data["name"]).first()
        if not existing:
            product = Product(**prod_data)
            db.add(product)
            logger.info("Created product: %s", prod_data["name"])
    
    db.commit()


def run_seed(db: Session) -> None:
    """Run all seeders."""
    logger.info("Starting database seeding...")
    
    seed_users(db)
    categories = seed_categories(db)
    seed_products(db, categories)
    
    logger.info("Database seeding completed!")
