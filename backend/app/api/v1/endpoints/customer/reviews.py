"""
API endpoints for product reviews.
"""
from typing import Annotated, Optional

from fastapi import APIRouter, Depends, Query, HTTPException, Form, File, UploadFile
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.core.dependencies import CurrentUser, OptionalUser
from app.db.session import get_db
from app.models.review import Review
from app.models.product import Product
from app.models.order import Order, OrderItem, OrderStatus
from app.models.user import User, UserRole
from app.schemas.review import ReviewCreate, ReviewList, ReviewResponse
from app.services.storage_service import get_storage_service

router = APIRouter()

AI_PHOTOBOOTH_LIMIT = 3  # Max uses for regular users

@router.get("/{product_id}/reviews", response_model=ReviewList)
async def get_product_reviews(
    product_id: str,
    db: Annotated[Session, Depends(get_db)],
    page: int = Query(1, ge=1),
    size: int = Query(10, ge=1, le=50),
    sort: str = Query("newest", enum=["newest", "highest", "lowest"]),
):
    """
    Get reviews for a specific product. Public endpoint.
    """
    query = db.query(Review).filter(Review.product_id == product_id)
    
    if sort == "newest":
        query = query.order_by(Review.created_at.desc())
    elif sort == "highest":
        query = query.order_by(Review.rating.desc(), Review.created_at.desc())
    elif sort == "lowest":
        query = query.order_by(Review.rating.asc(), Review.created_at.desc())
    
    total = query.count()
    reviews = query.offset((page - 1) * size).limit(size).all()
    
    avg_rating = db.query(func.avg(Review.rating)).filter(Review.product_id == product_id).scalar() or 0.0
    rating_dist_query = db.query(Review.rating, func.count(Review.id)).filter(Review.product_id == product_id).group_by(Review.rating).all()
    rating_dist = {r: c for r, c in rating_dist_query}
    
    return ReviewList(
        items=[
            ReviewResponse(
                id=r.id,
                user_id=r.user_id,
                product_id=r.product_id,
                user_name=r.user.full_name if r.user else "Anonymous",
                user_avatar=r.user.avatar_url if r.user else None,
                rating=r.rating,
                comment=r.comment,
                image_url=r.image_url,
                is_ai_generated=r.is_ai_generated,
                is_verified_purchase=r.is_verified_purchase,
                created_at=r.created_at,
            ) for r in reviews
        ],
        total=total,
        page=page,
        size=size,
        average_rating=round(float(avg_rating), 1),
        rating_distribution=rating_dist,
    )


@router.post("/{product_id}/reviews", response_model=ReviewResponse)
async def create_review(
    product_id: str,
    current_user: CurrentUser,
    db: Annotated[Session, Depends(get_db)],
    rating: int = Form(..., ge=1, le=5),
    comment: Optional[str] = Form(None),
    image: Optional[UploadFile] = File(None),
    is_ai_generated: bool = Form(False),
):
    """
    Create a new review for a product.
    - User must have purchased the product (completed order containing this product).
    - AI Photobooth usage is limited to 3 times per user (admins unlimited).
    """
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    # Check if user already reviewed this product
    existing_review = db.query(Review).filter(
        Review.user_id == current_user.id,
        Review.product_id == product_id
    ).first()
    if existing_review:
        raise HTTPException(status_code=400, detail="You have already reviewed this product")

    # ===== PURCHASE VERIFICATION =====
    # Check if user has a COMPLETED order containing this product
    has_purchased = db.query(OrderItem).join(Order).filter(
        Order.user_id == current_user.id,
        Order.status == OrderStatus.COMPLETED,
        OrderItem.product_id == product_id
    ).first() is not None
    
    if not has_purchased:
        raise HTTPException(
            status_code=403, 
            detail="You can only review products you have purchased."
        )

    # ===== AI PHOTOBOOTH LIMIT CHECK =====
    is_admin = current_user.role == UserRole.ADMIN
    if is_ai_generated and not is_admin:
        if current_user.ai_photobooth_count >= AI_PHOTOBOOTH_LIMIT:
            raise HTTPException(
                status_code=403,
                detail=f"You have reached the maximum AI Photobooth usage ({AI_PHOTOBOOTH_LIMIT} times)."
            )
        # Increment usage count
        current_user.ai_photobooth_count += 1
    
    # ===== HANDLE IMAGE UPLOAD =====
    image_url = None
    if image and image.filename:
        storage = get_storage_service()
        file_data = await image.read()
        content_type = image.content_type or "image/jpeg"
        image_url = await storage.upload_file(
            file_data=file_data,
            filename=image.filename,
            content_type=content_type,
            folder="reviews"
        )
    
    new_review = Review(
        user_id=current_user.id,
        product_id=product_id,
        rating=rating,
        comment=comment,
        image_url=image_url,
        is_ai_generated=is_ai_generated,
        is_verified_purchase=True,  # Always true now since we verified
    )
    
    db.add(new_review)
    db.commit()
    db.refresh(new_review)
    
    # Update product average rating
    new_avg = db.query(func.avg(Review.rating)).filter(Review.product_id == product_id).scalar() or 0.0
    product.average_rating = float(new_avg)
    db.commit()
    
    return ReviewResponse(
        id=new_review.id,
        user_id=new_review.user_id,
        product_id=new_review.product_id,
        user_name=current_user.full_name or "Anonymous",
        user_avatar=current_user.avatar_url,
        rating=new_review.rating,
        comment=new_review.comment,
        image_url=new_review.image_url,
        is_ai_generated=new_review.is_ai_generated,
        is_verified_purchase=new_review.is_verified_purchase,
        created_at=new_review.created_at,
    )


@router.put("/{product_id}/reviews/{review_id}", response_model=ReviewResponse)
async def update_review(
    product_id: str,
    review_id: str,
    current_user: CurrentUser,
    db: Annotated[Session, Depends(get_db)],
    rating: int = Form(..., ge=1, le=5),
    comment: Optional[str] = Form(None),
    image: Optional[UploadFile] = File(None),
):
    """
    Update an existing review.
    - User can only update their own reviews.
    """
    review = db.query(Review).filter(
        Review.id == review_id,
        Review.product_id == product_id
    ).first()
    
    if not review:
        raise HTTPException(status_code=404, detail="Review not found")
    
    if review.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="You can only edit your own reviews")
    
    # Update fields
    review.rating = rating
    review.comment = comment
    
    # Handle new image upload
    if image and image.filename:
        storage = get_storage_service()
        file_data = await image.read()
        content_type = image.content_type or "image/jpeg"
        review.image_url = await storage.upload_file(
            file_data=file_data,
            filename=image.filename,
            content_type=content_type,
            folder="reviews"
        )
    
    db.commit()
    db.refresh(review)
    
    # Update product average rating
    product = db.query(Product).filter(Product.id == product_id).first()
    if product:
        new_avg = db.query(func.avg(Review.rating)).filter(Review.product_id == product_id).scalar() or 0.0
        product.average_rating = float(new_avg)
        db.commit()
    
    return ReviewResponse(
        id=review.id,
        user_id=review.user_id,
        product_id=review.product_id,
        user_name=current_user.full_name or "Anonymous",
        user_avatar=current_user.avatar_url,
        rating=review.rating,
        comment=review.comment,
        image_url=review.image_url,
        is_ai_generated=review.is_ai_generated,
        is_verified_purchase=review.is_verified_purchase,
        created_at=review.created_at,
    )


@router.delete("/{product_id}/reviews/{review_id}")
async def delete_review(
    product_id: str,
    review_id: str,
    current_user: CurrentUser,
    db: Annotated[Session, Depends(get_db)],
):
    """
    Delete a review.
    - User can only delete their own reviews.
    """
    review = db.query(Review).filter(
        Review.id == review_id,
        Review.product_id == product_id
    ).first()
    
    if not review:
        raise HTTPException(status_code=404, detail="Review not found")
    
    if review.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="You can only delete your own reviews")
    
    db.delete(review)
    db.commit()
    
    # Update product average rating
    product = db.query(Product).filter(Product.id == product_id).first()
    if product:
        new_avg = db.query(func.avg(Review.rating)).filter(Review.product_id == product_id).scalar() or 0.0
        product.average_rating = float(new_avg) if new_avg else 0.0
        db.commit()
    
    return {"message": "Review deleted successfully"}

