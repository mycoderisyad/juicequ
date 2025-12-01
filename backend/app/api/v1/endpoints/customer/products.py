"""
Customer Products API.
Browse and search products available for purchase.
"""
from typing import Annotated

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.core.dependencies import OptionalUser

router = APIRouter()


# Categories data
CATEGORIES = [
    {"id": "smoothies", "name": "Smoothies", "icon": "🥤"},
    {"id": "juices", "name": "Juices", "icon": "🍊"},
    {"id": "bowls", "name": "Bowls", "icon": "🥣"},
    {"id": "shots", "name": "Shots", "icon": "💉"},
]


# Mock data for products (will be replaced with database)
PRODUCTS = [
    {
        "id": 1,
        "name": "Berry Blast",
        "description": "A refreshing blend of strawberries, blueberries, and raspberries with a hint of mint.",
        "price": 8.50,
        "calories": 240,
        "category": "smoothies",
        "image_color": "bg-red-500",
        "is_available": True,
        "stock": 100,
        "ingredients": ["strawberry", "blueberry", "raspberry", "mint"],
        "nutrition": {"calories": 240, "protein": 3, "carbs": 45, "fat": 2},
    },
    {
        "id": 2,
        "name": "Green Goddess",
        "description": "Kale, spinach, apple, and ginger for a healthy detox boost.",
        "price": 9.00,
        "calories": 180,
        "category": "smoothies",
        "image_color": "bg-green-500",
        "is_available": True,
        "stock": 100,
        "ingredients": ["kale", "spinach", "apple", "ginger"],
        "nutrition": {"calories": 180, "protein": 5, "carbs": 30, "fat": 1},
    },
    {
        "id": 3,
        "name": "Tropical Paradise",
        "description": "Mango, pineapple, and coconut milk blended to perfection.",
        "price": 8.75,
        "calories": 320,
        "category": "smoothies",
        "image_color": "bg-yellow-400",
        "is_available": True,
        "stock": 100,
        "ingredients": ["mango", "pineapple", "coconut milk"],
        "nutrition": {"calories": 320, "protein": 4, "carbs": 60, "fat": 8},
    },
    {
        "id": 4,
        "name": "Citrus Splash",
        "description": "Orange, grapefruit, and lemon with a touch of honey.",
        "price": 7.50,
        "calories": 150,
        "category": "juices",
        "image_color": "bg-orange-400",
        "is_available": True,
        "stock": 100,
        "ingredients": ["orange", "grapefruit", "lemon", "honey"],
        "nutrition": {"calories": 150, "protein": 2, "carbs": 35, "fat": 0},
    },
    {
        "id": 5,
        "name": "Protein Power",
        "description": "Banana, peanut butter, chocolate protein powder, and almond milk.",
        "price": 10.00,
        "calories": 450,
        "category": "smoothies",
        "image_color": "bg-stone-600",
        "is_available": True,
        "stock": 100,
        "ingredients": ["banana", "peanut butter", "chocolate protein", "almond milk"],
        "nutrition": {"calories": 450, "protein": 25, "carbs": 40, "fat": 18},
    },
    {
        "id": 6,
        "name": "Acai Bowl",
        "description": "Organic acai topped with granola, banana, and honey.",
        "price": 12.00,
        "calories": 380,
        "category": "bowls",
        "image_color": "bg-purple-600",
        "is_available": True,
        "stock": 100,
        "ingredients": ["acai", "granola", "banana", "honey"],
        "nutrition": {"calories": 380, "protein": 6, "carbs": 65, "fat": 10},
    },
    {
        "id": 7,
        "name": "Ginger Shot",
        "description": "Pure ginger with a touch of lemon for immune boost.",
        "price": 4.50,
        "calories": 20,
        "category": "shots",
        "image_color": "bg-amber-500",
        "is_available": True,
        "stock": 100,
        "ingredients": ["ginger", "lemon"],
        "nutrition": {"calories": 20, "protein": 0, "carbs": 5, "fat": 0},
    },
    {
        "id": 8,
        "name": "Turmeric Shot",
        "description": "Turmeric, black pepper, and orange for anti-inflammatory benefits.",
        "price": 5.00,
        "calories": 25,
        "category": "shots",
        "image_color": "bg-yellow-600",
        "is_available": True,
        "stock": 100,
        "ingredients": ["turmeric", "black pepper", "orange"],
        "nutrition": {"calories": 25, "protein": 0, "carbs": 6, "fat": 0},
    },
]


@router.get(
    "",
    summary="Get all products",
    description="Retrieve all available products with optional filtering.",
)
async def get_products(
    db: Annotated[Session, Depends(get_db)],
    category: str | None = Query(None, description="Filter by category"),
    search: str | None = Query(None, description="Search by name or description"),
    min_price: float | None = Query(None, ge=0, description="Minimum price"),
    max_price: float | None = Query(None, ge=0, description="Maximum price"),
):
    """
    Get all available products.
    
    Supports filtering by:
    - category: Filter by product category
    - search: Search in name and description
    - min_price / max_price: Price range filter
    """
    filtered_products = PRODUCTS.copy()
    
    # Filter by category
    if category and category != "All":
        filtered_products = [
            product for product in filtered_products 
            if product["category"].lower() == category.lower()
        ]
    
    # Filter by search query
    if search:
        search_lower = search.lower()
        filtered_products = [
            product for product in filtered_products
            if search_lower in product["name"].lower() 
            or search_lower in product["description"].lower()
        ]
    
    # Filter by price range
    if min_price is not None:
        filtered_products = [
            product for product in filtered_products 
            if product["price"] >= min_price
        ]
    
    if max_price is not None:
        filtered_products = [
            product for product in filtered_products 
            if product["price"] <= max_price
        ]
    
    return {
        "items": filtered_products,
        "total": len(filtered_products),
    }


@router.get(
    "/categories",
    summary="Get product categories",
    description="Retrieve all available product categories.",
)
async def get_categories():
    """Get list of all product categories."""
    return {
        "categories": [{"id": "all", "name": "All", "icon": "📋"}] + CATEGORIES
    }


@router.get(
    "/{product_id}",
    summary="Get product details",
    description="Retrieve detailed information about a specific product.",
)
async def get_product(product_id: int):
    """Get details of a specific product by ID."""
    product = next(
        (product for product in PRODUCTS if product["id"] == product_id),
        None
    )
    
    if not product:
        from app.core.exceptions import NotFoundException
        raise NotFoundException("Product", product_id)
    
    return product
