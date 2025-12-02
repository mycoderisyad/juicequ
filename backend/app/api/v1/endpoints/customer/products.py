"""
Customer Products API.
Browse and search products available for purchase.
"""
from typing import Annotated, Optional

from fastapi import APIRouter, Depends, Query, HTTPException, status
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.core.dependencies import OptionalUser
from app.services.product_service import ProductService
from app.schemas.product import ProductListResponse, ProductResponse, CategoryListResponse

router = APIRouter()


# Fallback mock data (used when database is empty)
MOCK_CATEGORIES = [
    {"id": "smoothies", "name": "Smoothies", "icon": "🥤"},
    {"id": "juices", "name": "Juices", "icon": "🍊"},
    {"id": "bowls", "name": "Bowls", "icon": "🥣"},
    {"id": "shots", "name": "Shots", "icon": "💉"},
]


MOCK_PRODUCTS = [
    {
        "id": 1,
        "name": "Berry Blast",
        "description": "A refreshing blend of strawberries, blueberries, and raspberries with a hint of mint.",
        "base_price": 8.50,
        "price": 8.50,
        "calories": 240,
        "category": "smoothies",
        "category_id": "smoothies",
        "category_name": "Smoothies",
        "image": "/images/berry-blast.jpg",
        "image_color": "bg-red-500",
        "is_available": True,
        "stock": 100,
        "stock_quantity": 100,
        "ingredients": ["strawberry", "blueberry", "raspberry", "mint"],
        "nutrition": {"calories": 240, "protein": 3, "carbs": 45, "fat": 2},
        "rating": 4.8,
        "reviews": 124,
    },
    {
        "id": 2,
        "name": "Green Goddess",
        "description": "Kale, spinach, apple, and ginger for a healthy detox boost.",
        "base_price": 9.00,
        "price": 9.00,
        "calories": 180,
        "category": "smoothies",
        "category_id": "smoothies",
        "category_name": "Smoothies",
        "image": "/images/green-goddess.jpg",
        "image_color": "bg-green-500",
        "is_available": True,
        "stock": 100,
        "stock_quantity": 100,
        "ingredients": ["kale", "spinach", "apple", "ginger"],
        "nutrition": {"calories": 180, "protein": 5, "carbs": 30, "fat": 1},
        "rating": 4.6,
        "reviews": 89,
    },
    {
        "id": 3,
        "name": "Tropical Paradise",
        "description": "Mango, pineapple, and coconut milk blended to perfection.",
        "base_price": 8.75,
        "price": 8.75,
        "calories": 320,
        "category": "smoothies",
        "category_id": "smoothies",
        "category_name": "Smoothies",
        "image": "/images/tropical-paradise.jpg",
        "image_color": "bg-yellow-400",
        "is_available": True,
        "stock": 100,
        "stock_quantity": 100,
        "ingredients": ["mango", "pineapple", "coconut milk"],
        "nutrition": {"calories": 320, "protein": 4, "carbs": 60, "fat": 8},
        "rating": 4.9,
        "reviews": 156,
    },
    {
        "id": 4,
        "name": "Citrus Splash",
        "description": "Orange, grapefruit, and lemon with a touch of honey.",
        "base_price": 7.50,
        "price": 7.50,
        "calories": 150,
        "category": "juices",
        "category_id": "juices",
        "category_name": "Juices",
        "image": "/images/citrus-splash.jpg",
        "image_color": "bg-orange-400",
        "is_available": True,
        "stock": 100,
        "stock_quantity": 100,
        "ingredients": ["orange", "grapefruit", "lemon", "honey"],
        "nutrition": {"calories": 150, "protein": 2, "carbs": 35, "fat": 0},
        "rating": 4.7,
        "reviews": 92,
    },
    {
        "id": 5,
        "name": "Protein Power",
        "description": "Banana, peanut butter, chocolate protein powder, and almond milk.",
        "base_price": 10.00,
        "price": 10.00,
        "calories": 450,
        "category": "smoothies",
        "category_id": "smoothies",
        "category_name": "Smoothies",
        "image": "/images/protein-power.jpg",
        "image_color": "bg-stone-600",
        "is_available": True,
        "stock": 100,
        "stock_quantity": 100,
        "ingredients": ["banana", "peanut butter", "chocolate protein", "almond milk"],
        "nutrition": {"calories": 450, "protein": 25, "carbs": 40, "fat": 18},
        "rating": 4.5,
        "reviews": 78,
    },
    {
        "id": 6,
        "name": "Acai Bowl",
        "description": "Organic acai topped with granola, banana, and honey.",
        "base_price": 12.00,
        "price": 12.00,
        "calories": 380,
        "category": "bowls",
        "category_id": "bowls",
        "category_name": "Bowls",
        "image": "/images/acai-bowl.jpg",
        "image_color": "bg-purple-600",
        "is_available": True,
        "stock": 100,
        "stock_quantity": 100,
        "ingredients": ["acai", "granola", "banana", "honey"],
        "nutrition": {"calories": 380, "protein": 6, "carbs": 65, "fat": 10},
        "rating": 4.9,
        "reviews": 203,
    },
    {
        "id": 7,
        "name": "Ginger Shot",
        "description": "Pure ginger with a touch of lemon for immune boost.",
        "base_price": 4.50,
        "price": 4.50,
        "calories": 20,
        "category": "shots",
        "category_id": "shots",
        "category_name": "Shots",
        "image": "/images/ginger-shot.jpg",
        "image_color": "bg-amber-500",
        "is_available": True,
        "stock": 100,
        "stock_quantity": 100,
        "ingredients": ["ginger", "lemon"],
        "nutrition": {"calories": 20, "protein": 0, "carbs": 5, "fat": 0},
        "rating": 4.4,
        "reviews": 67,
    },
    {
        "id": 8,
        "name": "Turmeric Shot",
        "description": "Turmeric, black pepper, and orange for anti-inflammatory benefits.",
        "base_price": 5.00,
        "price": 5.00,
        "calories": 25,
        "category": "shots",
        "category_id": "shots",
        "category_name": "Shots",
        "image": "/images/turmeric-shot.jpg",
        "image_color": "bg-yellow-600",
        "is_available": True,
        "stock": 100,
        "stock_quantity": 100,
        "ingredients": ["turmeric", "black pepper", "orange"],
        "nutrition": {"calories": 25, "protein": 0, "carbs": 6, "fat": 0},
        "rating": 4.3,
        "reviews": 45,
    },
]

# Export aliases for admin endpoints
PRODUCTS = MOCK_PRODUCTS
CATEGORIES = MOCK_CATEGORIES


def _use_mock_data(db: Session) -> bool:
    """Check if we should use mock data (when database is empty)."""
    try:
        products, total = ProductService.get_all(db, page_size=1)
        return total == 0
    except Exception:
        return True


@router.get(
    "",
    summary="Get all products",
    description="Retrieve all available products with optional filtering.",
)
async def get_products(
    db: Annotated[Session, Depends(get_db)],
    category: Optional[str] = Query(None, description="Filter by category ID"),
    search: Optional[str] = Query(None, description="Search by name or description"),
    min_price: Optional[float] = Query(None, ge=0, description="Minimum price"),
    max_price: Optional[float] = Query(None, ge=0, description="Maximum price"),
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(20, ge=1, le=100, description="Items per page"),
):
    """
    Get all available products.
    
    Supports filtering by:
    - category: Filter by product category ID
    - search: Search in name and description
    - min_price / max_price: Price range filter
    """
    # Use mock data if database is empty
    if _use_mock_data(db):
        filtered_products = MOCK_PRODUCTS.copy()
        
        # Filter by category
        if category and category.lower() != "all":
            filtered_products = [
                product for product in filtered_products 
                if product["category_id"].lower() == category.lower()
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
                if product["base_price"] >= min_price
            ]
        
        if max_price is not None:
            filtered_products = [
                product for product in filtered_products 
                if product["base_price"] <= max_price
            ]
        
        # Pagination
        total = len(filtered_products)
        start = (page - 1) * page_size
        end = start + page_size
        items = filtered_products[start:end]
        
        return {
            "items": items,
            "total": total,
            "page": page,
            "page_size": page_size,
            "total_pages": (total + page_size - 1) // page_size,
        }
    
    # Use database
    products, total = ProductService.get_all(
        db,
        category_id=category if category and category.lower() != "all" else None,
        search=search,
        min_price=min_price,
        max_price=max_price,
        page=page,
        page_size=page_size,
    )
    
    # Convert to response format
    items = []
    for product in products:
        items.append({
            "id": product.id,
            "name": product.name,
            "description": product.description,
            "base_price": product.base_price,
            "calories": product.calories,
            "category_id": product.category_id,
            "category_name": product.category.name if product.category else None,
            "image_url": product.image_url,
            "is_available": product.is_available,
            "stock_quantity": product.stock_quantity,
            "ingredients": product.ingredients,
            "nutrition": ProductService.get_nutrition_info(product).model_dump(),
            "prices": ProductService.get_all_prices(product),
        })
    
    return {
        "items": items,
        "total": total,
        "page": page,
        "page_size": page_size,
        "total_pages": (total + page_size - 1) // page_size,
    }


@router.get(
    "/categories",
    summary="Get product categories",
    description="Retrieve all available product categories.",
)
async def get_categories(
    db: Annotated[Session, Depends(get_db)],
):
    """Get list of all product categories."""
    # Use mock data if database is empty
    if _use_mock_data(db):
        return {
            "categories": [{"id": "all", "name": "All", "icon": "📋"}] + MOCK_CATEGORIES
        }
    
    # Use database
    categories = ProductService.get_all_categories(db)
    return {
        "categories": [{"id": "all", "name": "All", "icon": "📋"}] + [
            {
                "id": cat.id,
                "name": cat.name,
                "description": cat.description,
                "icon": cat.icon,
            }
            for cat in categories
        ]
    }


@router.get(
    "/featured",
    summary="Get featured products",
    description="Retrieve featured products for homepage.",
)
async def get_featured_products(
    db: Annotated[Session, Depends(get_db)],
    limit: int = Query(8, ge=1, le=20, description="Number of products"),
):
    """Get featured products."""
    # Use mock data if database is empty
    if _use_mock_data(db):
        return {
            "items": MOCK_PRODUCTS[:limit],
            "total": min(limit, len(MOCK_PRODUCTS)),
        }
    
    products = ProductService.get_featured(db, limit=limit)
    items = [
        {
            "id": p.id,
            "name": p.name,
            "description": p.description,
            "base_price": p.base_price,
            "calories": p.calories,
            "category_id": p.category_id,
            "category_name": p.category.name if p.category else None,
            "image_url": p.image_url,
            "is_available": p.is_available,
            "prices": ProductService.get_all_prices(p),
        }
        for p in products
    ]
    return {"items": items, "total": len(items)}


@router.get(
    "/popular",
    summary="Get popular products",
    description="Retrieve popular products by order count.",
)
async def get_popular_products(
    db: Annotated[Session, Depends(get_db)],
    limit: int = Query(8, ge=1, le=20, description="Number of products"),
):
    """Get popular products."""
    # Use mock data if database is empty
    if _use_mock_data(db):
        return {
            "items": MOCK_PRODUCTS[:limit],
            "total": min(limit, len(MOCK_PRODUCTS)),
        }
    
    products = ProductService.get_popular(db, limit=limit)
    items = [
        {
            "id": p.id,
            "name": p.name,
            "description": p.description,
            "base_price": p.base_price,
            "calories": p.calories,
            "category_id": p.category_id,
            "category_name": p.category.name if p.category else None,
            "image_url": p.image_url,
            "is_available": p.is_available,
            "prices": ProductService.get_all_prices(p),
        }
        for p in products
    ]
    return {"items": items, "total": len(items)}


@router.get(
    "/{product_id}",
    summary="Get product details",
    description="Retrieve detailed information about a specific product.",
)
async def get_product(
    product_id: str,
    db: Annotated[Session, Depends(get_db)],
):
    """Get details of a specific product by ID."""
    # Use mock data if database is empty
    if _use_mock_data(db):
        # Try to match product ID (handle both string and int)
        try:
            pid = int(product_id)
            product = next(
                (p for p in MOCK_PRODUCTS if p["id"] == pid),
                None
            )
        except ValueError:
            product = next(
                (p for p in MOCK_PRODUCTS if str(p["id"]) == product_id),
                None
            )
        
        if not product:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Product with ID {product_id} not found"
            )
        
        return product
    
    # Use database
    product = ProductService.get_by_id(db, product_id)
    
    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Product with ID {product_id} not found"
        )
    
    return {
        "id": product.id,
        "name": product.name,
        "description": product.description,
        "base_price": product.base_price,
        "calories": product.calories,
        "sugar_grams": product.sugar_grams,
        "category_id": product.category_id,
        "category_name": product.category.name if product.category else None,
        "image_url": product.image_url,
        "is_available": product.is_available,
        "stock_quantity": product.stock_quantity,
        "is_featured": product.is_featured,
        "ingredients": product.ingredients,
        "health_benefits": product.health_benefits,
        "nutrition": ProductService.get_nutrition_info(product).model_dump(),
        "prices": ProductService.get_all_prices(product),
        "order_count": product.order_count,
        "average_rating": product.average_rating,
    }
