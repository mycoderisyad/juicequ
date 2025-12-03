"""
AI Recommendation Service.
Generates personalized product recommendations.
"""
import json
import logging
from typing import Any, Optional

from sqlalchemy.orm import Session

from app.models.product import Product
from app.models.user import User
from app.services.ai.kolosal_client import KolosalClient

logger = logging.getLogger(__name__)


class RecommendationService:
    """Service for AI-powered recommendations."""
    
    def __init__(self, db: Session):
        """Initialize recommendation service."""
        self.db = db
        self.kolosal = KolosalClient()
    
    async def get_recommendations(
        self,
        user_id: Optional[str] = None,
        preferences: Optional[str] = None,
        limit: int = 5,
    ) -> list[dict[str, Any]]:
        """
        Get personalized product recommendations.
        
        Args:
            user_id: Optional user ID for personalization
            preferences: Optional preference string
            limit: Maximum number of recommendations
        
        Returns:
            List of recommended products
        """
        # Build user context
        user_context = await self._build_user_context(user_id, preferences)
        
        # Get candidate products
        products = (
            self.db.query(Product)
            .filter(Product.is_available == True)
            .order_by(Product.order_count.desc(), Product.average_rating.desc())
            .limit(limit * 2)
            .all()
        )
        
        if not products:
            return []
        
        # Format product info for AI
        product_info = "\n".join([
            f"- ID:{p.id} | {p.name}: {p.description or 'No description'} "
            f"(Rp {p.base_price:,.0f}, {p.calories or 'N/A'} kcal)"
            for p in products
        ])
        
        # Build recommendation prompt
        prompt = f"""{user_context}

Produk tersedia:
{product_info}

Rekomendasikan {limit} produk terbaik. Jawab dalam format JSON array:
[{{"product_id": "...", "reason": "...", "score": 1-10}}]"""
        
        # Get AI recommendations
        response = await self.kolosal.chat_completion(
            messages=[
                {
                    "role": "system",
                    "content": "Kamu adalah ahli rekomendasi jus. Selalu jawab dengan JSON valid saja.",
                },
                {"role": "user", "content": prompt},
            ]
        )
        
        # Parse recommendations
        recommendations = self._parse_recommendations(response.get("content", ""), products, limit)
        
        return recommendations
    
    async def _build_user_context(
        self,
        user_id: Optional[str],
        preferences: Optional[str],
    ) -> str:
        """Build user context for recommendations."""
        parts = []
        
        if user_id:
            user = self.db.query(User).filter(User.id == user_id).first()
            if user and user.preferences:
                parts.append(f"Preferensi user: {user.preferences}")
        
        if preferences:
            parts.append(f"Request saat ini: {preferences}")
        
        return "\n".join(parts) if parts else "Tidak ada preferensi khusus."
    
    def _parse_recommendations(
        self,
        ai_response: str,
        products: list[Product],
        limit: int,
    ) -> list[dict[str, Any]]:
        """Parse AI recommendations and match with products."""
        try:
            recommendations = json.loads(ai_response)
        except json.JSONDecodeError:
            # Fallback to simple recommendations
            recommendations = [
                {"product_id": str(p.id), "reason": "Produk populer", "score": 8}
                for p in products[:limit]
            ]
        
        result = []
        products_dict = {str(p.id): p for p in products}
        
        for rec in recommendations[:limit]:
            product_id = str(rec.get("product_id", ""))
            product = products_dict.get(product_id)
            
            if product:
                result.append({
                    "id": str(product.id),
                    "name": product.name,
                    "description": product.description,
                    "base_price": product.base_price,
                    "image_url": product.image_url,
                    "calories": product.calories,
                    "category_name": product.category.name if product.category else None,
                    "reason": rec.get("reason", "Recommended for you"),
                    "score": rec.get("score", 8.0),
                })
        
        return result
    
    async def close(self) -> None:
        """Clean up resources."""
        await self.kolosal.close()
