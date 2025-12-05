"""
Seed script to create default products and categories.
Run this script to create initial products for the system.

Usage:
    cd backend
    python -m scripts.seed_products
"""
import sys
import json
from pathlib import Path

# Add backend to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from sqlalchemy.orm import Session
from app.db.session import SessionLocal
from app.models.product import Product, ProductCategory


def create_default_categories(db: Session) -> None:
    """Create default product categories if they don't exist."""
    
    default_categories = [
        {
            "id": "smoothies",
            "name": "Smoothies",
            "icon": "",
            "description": "Blended fruit smoothies with fresh ingredients",
        },
        {
            "id": "juices",
            "name": "Juices",
            "icon": "",
            "description": "Fresh pressed juices from natural fruits",
        },
        {
            "id": "bowls",
            "name": "Bowls",
            "icon": "",
            "description": "Healthy acai and smoothie bowls with toppings",
        },
        {
            "id": "shots",
            "name": "Shots",
            "icon": "",
            "description": "Concentrated health shots for immune boost",
        },
    ]
    
    for cat_data in default_categories:
        existing = db.query(ProductCategory).filter(ProductCategory.id == cat_data["id"]).first()
        
        if existing:
            print(f"Category '{cat_data['name']}' already exists, skipping...")
            continue
        
        new_category = ProductCategory(
            id=cat_data["id"],
            name=cat_data["name"],
            icon=cat_data["icon"],
            description=cat_data["description"],
        )
        
        db.add(new_category)
        db.commit()
        
        print(f"Created category: {cat_data['name']}")
    
    print("\n")


def create_default_products(db: Session) -> None:
    """Create default products if they don't exist."""
    
    import uuid
    
    default_products = [
        {
            "name": "Berry Blast",
            "description": "A refreshing blend of strawberries, blueberries, and raspberries with a hint of mint.",
            "base_price": 35000,
            "calories": 240,
            "category_id": "smoothies",
            "image_url": "bg-red-500",
            "is_available": True,
            "stock_quantity": 100,
            "ingredients": json.dumps(["strawberry", "blueberry", "raspberry", "mint"]),
            "is_featured": True,
            "average_rating": 4.8,
            "order_count": 124,
        },
        {
            "name": "Green Goddess",
            "description": "Kale, spinach, apple, and ginger for a healthy detox boost.",
            "base_price": 38000,
            "calories": 180,
            "category_id": "smoothies",
            "image_url": "bg-green-500",
            "is_available": True,
            "stock_quantity": 100,
            "ingredients": json.dumps(["kale", "spinach", "apple", "ginger"]),
            "is_featured": True,
            "average_rating": 4.6,
            "order_count": 89,
        },
        {
            "name": "Tropical Paradise",
            "description": "Mango, pineapple, and coconut milk blended to perfection.",
            "base_price": 37000,
            "calories": 320,
            "category_id": "smoothies",
            "image_url": "bg-yellow-400",
            "is_available": True,
            "stock_quantity": 100,
            "ingredients": json.dumps(["mango", "pineapple", "coconut milk"]),
            "is_featured": True,
            "average_rating": 4.9,
            "order_count": 156,
        },
        {
            "name": "Citrus Splash",
            "description": "Orange, grapefruit, and lemon with a touch of honey.",
            "base_price": 32000,
            "calories": 150,
            "category_id": "juices",
            "image_url": "bg-orange-400",
            "is_available": True,
            "stock_quantity": 100,
            "ingredients": json.dumps(["orange", "grapefruit", "lemon", "honey"]),
            "is_featured": False,
            "average_rating": 4.7,
            "order_count": 92,
        },
        {
            "name": "Protein Power",
            "description": "Banana, peanut butter, chocolate protein powder, and almond milk.",
            "base_price": 42000,
            "calories": 450,
            "category_id": "smoothies",
            "image_url": "bg-stone-600",
            "is_available": True,
            "stock_quantity": 100,
            "ingredients": json.dumps(["banana", "peanut butter", "chocolate protein", "almond milk"]),
            "is_featured": True,
            "average_rating": 4.5,
            "order_count": 78,
        },
        {
            "name": "Acai Bowl",
            "description": "Organic acai topped with granola, banana, and honey.",
            "base_price": 55000,
            "calories": 380,
            "category_id": "bowls",
            "image_url": "bg-purple-600",
            "is_available": True,
            "stock_quantity": 100,
            "ingredients": json.dumps(["acai", "granola", "banana", "honey"]),
            "is_featured": True,
            "average_rating": 4.9,
            "order_count": 203,
        },
        {
            "name": "Ginger Shot",
            "description": "Pure ginger with a touch of lemon for immune boost.",
            "base_price": 18000,
            "calories": 20,
            "category_id": "shots",
            "image_url": "bg-amber-500",
            "is_available": True,
            "stock_quantity": 100,
            "ingredients": json.dumps(["ginger", "lemon"]),
            "is_featured": False,
            "average_rating": 4.4,
            "order_count": 67,
        },
        {
            "name": "Turmeric Shot",
            "description": "Turmeric, black pepper, and orange for anti-inflammatory benefits.",
            "base_price": 20000,
            "calories": 25,
            "category_id": "shots",
            "image_url": "bg-yellow-600",
            "is_available": True,
            "stock_quantity": 100,
            "ingredients": json.dumps(["turmeric", "black pepper", "orange"]),
            "is_featured": False,
            "average_rating": 4.3,
            "order_count": 45,
        },
        {
            "name": "Watermelon Cooler",
            "description": "Fresh watermelon juice with mint and lime for a refreshing summer drink.",
            "base_price": 28000,
            "calories": 120,
            "category_id": "juices",
            "image_url": "bg-pink-500",
            "is_available": True,
            "stock_quantity": 100,
            "ingredients": json.dumps(["watermelon", "mint", "lime"]),
            "is_featured": True,
            "average_rating": 4.7,
            "order_count": 134,
        },
        {
            "name": "Dragon Fruit Bowl",
            "description": "Pink dragon fruit base topped with fresh fruits and coconut flakes.",
            "base_price": 58000,
            "calories": 340,
            "category_id": "bowls",
            "image_url": "bg-pink-600",
            "is_available": True,
            "stock_quantity": 100,
            "ingredients": json.dumps(["dragon fruit", "banana", "strawberry", "coconut flakes"]),
            "is_featured": True,
            "average_rating": 4.8,
            "order_count": 98,
        },
        {
            "name": "Apple Detox",
            "description": "Green apple, celery, and cucumber for a cleansing juice.",
            "base_price": 30000,
            "calories": 90,
            "category_id": "juices",
            "image_url": "bg-green-400",
            "is_available": True,
            "stock_quantity": 100,
            "ingredients": json.dumps(["green apple", "celery", "cucumber", "lemon"]),
            "is_featured": False,
            "average_rating": 4.5,
            "order_count": 76,
        },
        {
            "name": "Wheatgrass Shot",
            "description": "Pure organic wheatgrass for a powerful nutrient boost.",
            "base_price": 15000,
            "calories": 15,
            "category_id": "shots",
            "image_url": "bg-lime-500",
            "is_available": True,
            "stock_quantity": 100,
            "ingredients": json.dumps(["wheatgrass"]),
            "is_featured": False,
            "average_rating": 4.2,
            "order_count": 54,
        },
    ]
    
    for prod_data in default_products:
        existing = db.query(Product).filter(Product.name == prod_data["name"]).first()
        
        if existing:
            print(f"Product '{prod_data['name']}' already exists, skipping...")
            continue
        
        new_product = Product(
            id=str(uuid.uuid4()),
            name=prod_data["name"],
            description=prod_data["description"],
            base_price=prod_data["base_price"],
            calories=prod_data["calories"],
            category_id=prod_data["category_id"],
            image_url=prod_data["image_url"],
            is_available=prod_data["is_available"],
            stock_quantity=prod_data["stock_quantity"],
            ingredients=prod_data["ingredients"],
            is_featured=prod_data["is_featured"],
            average_rating=prod_data["average_rating"],
            order_count=prod_data["order_count"],
        )
        
        db.add(new_product)
        db.commit()
        
        print(f"Created product: {prod_data['name']} (Rp {prod_data['base_price']:,})")
    
    print("\n")


def main():
    """Main function to run the seeder."""
    print("Starting product seeder...")
    print("="*50)
    
    db = SessionLocal()
    try:
        print("\nCreating categories...")
        print("-"*50)
        create_default_categories(db)
        
        print("Creating products...")
        print("-"*50)
        create_default_products(db)
        
        total_categories = db.query(ProductCategory).count()
        total_products = db.query(Product).count()
        
        print("="*50)
        print("Seeding completed successfully!")
        print("="*50)
        print(f"\nTotal categories: {total_categories}")
        print(f"Total products: {total_products}")
        print("-"*50)
        
    except Exception as e:
        print(f"Error: {e}")
        db.rollback()
        raise
    finally:
        db.close()


if __name__ == "__main__":
    main()
