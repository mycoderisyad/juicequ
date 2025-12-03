"""
AI Schemas for request/response validation.
"""
from datetime import datetime
from typing import Any, Dict, List, Optional

from pydantic import BaseModel, Field, ConfigDict


# =============================================================================
# Chat Schemas
# =============================================================================

class ChatRequest(BaseModel):
    """Schema for chat request."""
    message: str = Field(..., min_length=1, max_length=2000, description="User message")
    session_id: Optional[str] = Field(None, description="Session ID for conversation context")


class ChatResponse(BaseModel):
    """Schema for chat response."""
    response: str = Field(..., description="AI response message")
    session_id: str = Field(..., description="Session ID for continuing conversation")
    context_used: Optional[List[Dict[str, Any]]] = Field(None, description="Context chunks used for response")
    response_time_ms: int = Field(..., description="Response time in milliseconds")


# =============================================================================
# Voice Schemas
# =============================================================================

class VoiceResponse(BaseModel):
    """Schema for voice processing response."""
    transcription: str = Field(..., description="Transcribed text from audio")
    response: str = Field(..., description="AI response message")
    session_id: str = Field(..., description="Session ID for conversation")
    response_time_ms: int = Field(..., description="Response time in milliseconds")


class OrderItem(BaseModel):
    """Schema for an order item extracted from voice."""
    product_id: Optional[str] = Field(None, description="Matched product ID")
    product_name: str = Field(..., description="Product name mentioned")
    quantity: int = Field(1, description="Number of items")
    size: str = Field("medium", description="Product size")
    price: Optional[float] = Field(None, description="Product price")


class OrderData(BaseModel):
    """Schema for extracted order data."""
    intent: str = Field(..., description="Detected intent (order, inquiry)")
    items: List[OrderItem] = Field(default_factory=list, description="Extracted order items")
    notes: Optional[str] = Field(None, description="Additional notes or special requests")


class VoiceOrderResponse(BaseModel):
    """Schema for voice order processing response."""
    transcription: str = Field(..., description="Transcribed text from audio")
    order_data: OrderData = Field(..., description="Extracted order information")


# =============================================================================
# Recommendation Schemas
# =============================================================================

class RecommendationRequest(BaseModel):
    """Schema for recommendation request."""
    preferences: Optional[str] = Field(None, description="User preferences for recommendations")
    limit: int = Field(5, ge=1, le=20, description="Maximum number of recommendations")


class ProductRecommendation(BaseModel):
    """Schema for a product recommendation."""
    id: str = Field(..., description="Product ID")
    name: str = Field(..., description="Product name")
    description: Optional[str] = Field(None, description="Product description")
    base_price: float = Field(..., description="Base price")
    image_url: Optional[str] = Field(None, description="Product image URL")
    calories: Optional[int] = Field(None, description="Calories per serving")
    category_name: Optional[str] = Field(None, description="Category name")
    reason: str = Field(..., description="Reason for recommendation")
    score: float = Field(..., ge=1, le=10, description="Relevance score")
    
    model_config = ConfigDict(from_attributes=True)


class RecommendationResponse(BaseModel):
    """Schema for recommendation response."""
    recommendations: List[ProductRecommendation] = Field(..., description="List of recommended products")
    total: int = Field(..., description="Total number of recommendations")


# =============================================================================
# Feedback Schemas
# =============================================================================

class AIFeedbackRequest(BaseModel):
    """Schema for submitting feedback on AI response."""
    interaction_id: str = Field(..., description="AI interaction ID")
    rating: int = Field(..., ge=1, le=5, description="Rating from 1-5")
    feedback: Optional[str] = Field(None, max_length=500, description="Optional feedback text")


class AIFeedbackResponse(BaseModel):
    """Schema for feedback submission response."""
    message: str = Field("Feedback submitted successfully", description="Success message")
    interaction_id: str = Field(..., description="AI interaction ID")


# =============================================================================
# Interaction History Schemas
# =============================================================================

class AIInteractionResponse(BaseModel):
    """Schema for AI interaction response."""
    id: str
    session_id: str
    interaction_type: str
    status: str
    user_input: str
    ai_response: Optional[str]
    detected_intent: Optional[str]
    response_time_ms: Optional[int]
    user_rating: Optional[int]
    created_at: datetime
    completed_at: Optional[datetime]
    
    model_config = ConfigDict(from_attributes=True)


class AIInteractionListResponse(BaseModel):
    """Schema for AI interaction list response."""
    interactions: List[AIInteractionResponse]
    total: int
    page: int = 1
    page_size: int = 20
