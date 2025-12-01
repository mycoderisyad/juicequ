"""
Customer Cart API.
Manage shopping cart for authenticated customers.
"""
from typing import Annotated

from fastapi import APIRouter, Depends
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.core.dependencies import CurrentUser
from app.models.user import User

router = APIRouter()


class CartItem(BaseModel):
    """Schema for a cart item."""
    product_id: int = Field(..., description="Product ID")
    quantity: int = Field(..., ge=1, le=99, description="Quantity")


class AddToCartRequest(BaseModel):
    """Request to add item to cart."""
    product_id: int = Field(..., description="Product ID to add")
    quantity: int = Field(1, ge=1, le=99, description="Quantity to add")


class UpdateCartItemRequest(BaseModel):
    """Request to update cart item quantity."""
    quantity: int = Field(..., ge=0, le=99, description="New quantity (0 to remove)")


# In-memory cart storage (will be replaced with database)
CARTS: dict[str, list[dict]] = {}


@router.get(
    "",
    summary="Get cart",
    description="Get current user's shopping cart.",
)
async def get_cart(
    current_user: CurrentUser,
    db: Annotated[Session, Depends(get_db)],
):
    """Get the current user's cart contents."""
    user = current_user
    if not isinstance(user, User):
        return {"items": [], "total": 0}
    
    user_cart = CARTS.get(user.id, [])
    
    # Calculate total
    total = sum(item["price"] * item["quantity"] for item in user_cart)
    
    return {
        "items": user_cart,
        "item_count": sum(item["quantity"] for item in user_cart),
        "total": round(total, 2),
    }


@router.post(
    "/items",
    summary="Add to cart",
    description="Add a product to the shopping cart.",
)
async def add_to_cart(
    request: AddToCartRequest,
    current_user: CurrentUser,
    db: Annotated[Session, Depends(get_db)],
):
    """Add a product to the user's cart."""
    user = current_user
    if not isinstance(user, User):
        from app.core.exceptions import CredentialsException
        raise CredentialsException()
    
    # Initialize cart if not exists
    if user.id not in CARTS:
        CARTS[user.id] = []
    
    # Check if product already in cart
    existing_item = next(
        (item for item in CARTS[user.id] if item["product_id"] == request.product_id),
        None
    )
    
    if existing_item:
        existing_item["quantity"] += request.quantity
    else:
        # Mock product data (should fetch from database)
        from app.api.v1.endpoints.customer.products import PRODUCTS
        product = next(
            (p for p in PRODUCTS if p["id"] == request.product_id),
            None
        )
        
        if not product:
            from app.core.exceptions import NotFoundException
            raise NotFoundException("Product", request.product_id)
        
        CARTS[user.id].append({
            "product_id": request.product_id,
            "name": product["name"],
            "price": product["price"],
            "quantity": request.quantity,
            "image_color": product["image_color"],
        })
    
    return {"message": "Item added to cart", "success": True}


@router.put(
    "/items/{product_id}",
    summary="Update cart item",
    description="Update quantity of a cart item.",
)
async def update_cart_item(
    product_id: int,
    request: UpdateCartItemRequest,
    current_user: CurrentUser,
    db: Annotated[Session, Depends(get_db)],
):
    """Update the quantity of an item in the cart."""
    user = current_user
    if not isinstance(user, User):
        from app.core.exceptions import CredentialsException
        raise CredentialsException()
    
    if user.id not in CARTS:
        from app.core.exceptions import NotFoundException
        raise NotFoundException("Cart item", product_id)
    
    # Find item in cart
    item_index = next(
        (i for i, item in enumerate(CARTS[user.id]) if item["product_id"] == product_id),
        None
    )
    
    if item_index is None:
        from app.core.exceptions import NotFoundException
        raise NotFoundException("Cart item", product_id)
    
    if request.quantity == 0:
        # Remove item
        CARTS[user.id].pop(item_index)
        return {"message": "Item removed from cart", "success": True}
    else:
        # Update quantity
        CARTS[user.id][item_index]["quantity"] = request.quantity
        return {"message": "Cart updated", "success": True}


@router.delete(
    "/items/{product_id}",
    summary="Remove from cart",
    description="Remove an item from the cart.",
)
async def remove_from_cart(
    product_id: int,
    current_user: CurrentUser,
    db: Annotated[Session, Depends(get_db)],
):
    """Remove an item from the cart."""
    user = current_user
    if not isinstance(user, User):
        from app.core.exceptions import CredentialsException
        raise CredentialsException()
    
    if user.id not in CARTS:
        from app.core.exceptions import NotFoundException
        raise NotFoundException("Cart item", product_id)
    
    original_length = len(CARTS[user.id])
    CARTS[user.id] = [
        item for item in CARTS[user.id] 
        if item["product_id"] != product_id
    ]
    
    if len(CARTS[user.id]) == original_length:
        from app.core.exceptions import NotFoundException
        raise NotFoundException("Cart item", product_id)
    
    return {"message": "Item removed from cart", "success": True}


@router.delete(
    "",
    summary="Clear cart",
    description="Remove all items from the cart.",
)
async def clear_cart(
    current_user: CurrentUser,
    db: Annotated[Session, Depends(get_db)],
):
    """Clear all items from the cart."""
    user = current_user
    if not isinstance(user, User):
        from app.core.exceptions import CredentialsException
        raise CredentialsException()
    
    CARTS[user.id] = []
    
    return {"message": "Cart cleared", "success": True}
