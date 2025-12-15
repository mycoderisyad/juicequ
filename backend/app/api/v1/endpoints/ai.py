"""AI API endpoints for chatbot, voice processing, and recommendations."""
import logging
from typing import Annotated, Any, Optional

from fastapi import APIRouter, Depends, File, UploadFile, Query
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.core.dependencies import CurrentUser, OptionalUser
from app.core.exceptions import BadRequestException, ExternalServiceException
from app.db.session import get_db
from app.schemas.ai import (
    AIFeedbackRequest,
    AIFeedbackResponse,
    AIInteractionListResponse,
    AIInteractionResponse,
    ChatRequest,
    ChatResponse,
    FotoboothRequest,
    FotoboothResponse,
    RecommendationResponse,
    ProductRecommendation,
    VoiceOrderResponse,
    VoiceResponse,
)
from app.services.ai_service import AIService
from app.models.ai_interaction import AIInteraction

logger = logging.getLogger(__name__)
router = APIRouter()

ALLOWED_AUDIO_TYPES = ["audio/wav", "audio/mp3", "audio/mpeg", "audio/webm", "audio/ogg"]
MAX_AUDIO_SIZE = 10 * 1024 * 1024


class ChatHistoryMessage(BaseModel):
    role: str
    content: str
    metadata: Optional[dict[str, Any]] = None


class ChatHistoryResponse(BaseModel):
    session_id: str
    messages: list[ChatHistoryMessage]
    message_count: int


class SessionInfoResponse(BaseModel):
    session_id: str
    message_count: int
    ttl: int


class VoiceCommandResponse(BaseModel):
    transcription: str
    action: str
    message: str
    products: list[dict[str, Any]]
    destination: Optional[str] = None
    search_query: Optional[str] = None
    order_items: list[dict[str, Any]]
    session_id: str
    response_time_ms: int


def validate_audio_file(audio: UploadFile, audio_data: bytes) -> None:
    if audio.content_type and audio.content_type not in ALLOWED_AUDIO_TYPES:
        raise BadRequestException(f"Invalid audio format. Allowed: {', '.join(ALLOWED_AUDIO_TYPES)}")
    if len(audio_data) == 0:
        raise BadRequestException("Empty audio file")
    if len(audio_data) > MAX_AUDIO_SIZE:
        raise BadRequestException("Audio file too large. Maximum size is 10MB")


@router.post("/chat", response_model=ChatResponse)
async def chat_with_ai(
    request: ChatRequest,
    db: Annotated[Session, Depends(get_db)],
    current_user: OptionalUser = None,
):
    try:
        user_id = current_user.id if current_user else None
        service = AIService(db)

        conversation_history = None
        if request.conversation_history:
            conversation_history = [
                {"role": msg.role, "content": msg.content} for msg in request.conversation_history
            ]

        result = await service.chat(
            request.message,
            user_id,
            request.session_id,
            request.locale or "id",
            conversation_history,
            is_voice_command=request.is_voice_command,
        )
        await service.close()

        order_data = None
        if result.get("order_data"):
            from app.schemas.ai import ChatOrderData, ChatOrderItem

            order_items = [
                ChatOrderItem(
                    product_id=item["product_id"],
                    product_name=item["product_name"],
                    quantity=item["quantity"],
                    size=item["size"],
                    unit_price=item["unit_price"],
                    total_price=item["total_price"],
                    image_url=item.get("image_url"),
                    description=item.get("description"),
                )
                for item in result["order_data"]["items"]
            ]
            order_data = ChatOrderData(
                items=order_items,
                subtotal=result["order_data"]["subtotal"],
                tax=result["order_data"]["tax"],
                total=result["order_data"]["total"],
                notes=result["order_data"].get("notes"),
            )

        featured_products = None
        if result.get("featured_products"):
            from app.schemas.ai import FeaturedProduct

            featured_products = [
                FeaturedProduct(
                    id=p["id"],
                    name=p["name"],
                    description=p.get("description"),
                    price=p["price"],
                    image_url=p.get("image_url"),
                    thumbnail_url=p.get("thumbnail_url"),
                    category=p.get("category"),
                    calories=p.get("calories"),
                    is_bestseller=p.get("is_bestseller", False),
                    order_count=p.get("order_count", 0),
                )
                for p in result["featured_products"]
            ]

        return ChatResponse(
            response=result["response"],
            session_id=result["session_id"],
            context_used=result.get("context_used"),
            response_time_ms=result["response_time_ms"],
            intent=result.get("intent"),
            order_data=order_data,
            show_checkout=result.get("show_checkout", False),
            featured_products=featured_products,
            should_navigate=result.get("should_navigate", False),
            destination=result.get("destination"),
        )
    except ExternalServiceException:
        raise
    except Exception as e:
        logger.error("Chat error: %s", e)
        raise BadRequestException(f"Failed to process chat: {e}")


@router.post("/voice", response_model=VoiceResponse)
async def process_voice(
    db: Annotated[Session, Depends(get_db)],
    audio: UploadFile = File(...),
    session_id: Optional[str] = Query(None),
    current_user: OptionalUser = None,
):
    try:
        audio_data = await audio.read()
        validate_audio_file(audio, audio_data)

        user_id = current_user.id if current_user else None
        service = AIService(db)
        result = await service.process_voice(audio_data, user_id, session_id)
        await service.close()

        return VoiceResponse(
            transcription=result["transcription"],
            response=result["response"],
            session_id=result["session_id"],
            response_time_ms=result["response_time_ms"],
        )
    except (ExternalServiceException, BadRequestException):
        raise
    except Exception as e:
        logger.error("Voice error: %s", e)
        raise BadRequestException(f"Failed to process voice: {e}")


@router.post("/voice/command", response_model=VoiceCommandResponse)
async def process_voice_command(
    db: Annotated[Session, Depends(get_db)],
    audio: UploadFile = File(...),
    session_id: Optional[str] = Query(None),
    current_user: OptionalUser = None,
):
    """
    Process voice command using Gemini STT + intent parsing.
    Returns action JSON for navigation/ordering.
    """
    try:
        audio_data = await audio.read()
        validate_audio_file(audio, audio_data)

        user_id = current_user.id if current_user else None
        service = AIService(db)
        result = await service.process_voice_command(audio_data, user_id, session_id)
        await service.close()

        return VoiceCommandResponse(
            transcription=result["transcription"],
            action=result["action"],
            message=result["message"],
            products=result.get("products", []),
            destination=result.get("destination"),
            search_query=result.get("search_query"),
            order_items=result.get("order_items", []),
            session_id=result["session_id"],
            response_time_ms=result["response_time_ms"],
        )
    except (ExternalServiceException, BadRequestException):
        raise
    except Exception as e:
        logger.error("Voice command error: %s", e)
        raise BadRequestException(f"Failed to process voice command: {e}")


@router.get("/recommendations", response_model=RecommendationResponse)
async def get_recommendations(
    db: Annotated[Session, Depends(get_db)],
    preferences: Optional[str] = Query(None),
    limit: int = Query(5, ge=1, le=20),
    current_user: OptionalUser = None,
):
    try:
        user_id = current_user.id if current_user else None
        service = AIService(db)
        results = await service.get_recommendations(user_id, preferences, limit)
        await service.close()

        recommendations = [
            ProductRecommendation(
                id=r["id"],
                name=r["name"],
                description=r.get("description"),
                base_price=r["base_price"],
                image_url=r.get("image_url"),
                calories=r.get("calories"),
                category_name=r.get("category_name"),
                reason=r.get("reason", "Recommended for you"),
                score=r.get("score", 8.0),
            )
            for r in results
        ]
        return RecommendationResponse(recommendations=recommendations, total=len(recommendations))
    except ExternalServiceException:
        raise
    except Exception as e:
        logger.error("Recommendation error: %s", e)
        raise BadRequestException(f"Failed to get recommendations: {e}")


@router.post("/voice/order", response_model=VoiceOrderResponse)
async def process_voice_order(
    db: Annotated[Session, Depends(get_db)],
    audio: UploadFile = File(...),
    current_user: OptionalUser = None,
):
    try:
        audio_data = await audio.read()
        validate_audio_file(audio, audio_data)

        user_id = current_user.id if current_user else None
        service = AIService(db)
        result = await service.process_voice_order(audio_data, user_id)
        await service.close()

        return VoiceOrderResponse(transcription=result["transcription"], order_data=result["order_data"])
    except (ExternalServiceException, BadRequestException):
        raise
    except Exception as e:
        logger.error("Voice order error: %s", e)
        raise BadRequestException(f"Failed to process voice order: {e}")


@router.post("/feedback", response_model=AIFeedbackResponse)
async def submit_feedback(
    request: AIFeedbackRequest,
    db: Annotated[Session, Depends(get_db)],
):
    interaction = db.query(AIInteraction).filter(AIInteraction.id == request.interaction_id).first()
    if not interaction:
        raise BadRequestException("Interaction not found")

    interaction.user_rating = request.rating
    if request.feedback:
        interaction.user_feedback = request.feedback
    db.commit()

    return AIFeedbackResponse(message="Feedback submitted successfully", interaction_id=request.interaction_id)


@router.get("/history", response_model=AIInteractionListResponse)
async def get_interaction_history(
    db: Annotated[Session, Depends(get_db)],
    current_user: CurrentUser,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
):
    total = db.query(AIInteraction).filter(AIInteraction.user_id == current_user.id).count()
    interactions = (
        db.query(AIInteraction)
        .filter(AIInteraction.user_id == current_user.id)
        .order_by(AIInteraction.created_at.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
        .all()
    )

    return AIInteractionListResponse(
        interactions=[
            AIInteractionResponse(
                id=i.id,
                session_id=i.session_id,
                interaction_type=i.interaction_type.value,
                status=i.status.value,
                user_input=i.user_input,
                ai_response=i.ai_response,
                detected_intent=i.detected_intent,
                response_time_ms=i.response_time_ms,
                user_rating=i.user_rating,
                created_at=i.created_at,
                completed_at=i.completed_at,
            )
            for i in interactions
        ],
        total=total,
        page=page,
        page_size=page_size,
    )


@router.get("/chat/history/{session_id}", response_model=ChatHistoryResponse)
async def get_chat_history(
    session_id: str,
    db: Annotated[Session, Depends(get_db)],
):
    """Get conversation history for a session from Redis."""
    service = AIService(db)
    history = await service.get_chat_history(session_id)
    await service.close()

    messages = [
        ChatHistoryMessage(
            role=msg.get("role", "user"),
            content=msg.get("content", ""),
            metadata=msg.get("metadata"),
        )
        for msg in history
    ]

    return ChatHistoryResponse(
        session_id=session_id,
        messages=messages,
        message_count=len(messages),
    )


@router.delete("/chat/history/{session_id}")
async def clear_chat_history(
    session_id: str,
    db: Annotated[Session, Depends(get_db)],
):
    """Clear conversation history for a session."""
    service = AIService(db)
    success = await service.clear_chat_history(session_id)
    await service.close()

    if success:
        return {"message": "Chat history cleared", "session_id": session_id}
    return {"message": "No history found or Redis unavailable", "session_id": session_id}


@router.get("/chat/session/{session_id}", response_model=SessionInfoResponse)
async def get_session_info(
    session_id: str,
    db: Annotated[Session, Depends(get_db)],
):
    """Get session information including message count and TTL."""
    from app.services.conversation_memory import get_conversation_memory

    memory = get_conversation_memory()
    info = await memory.get_session_info(session_id)

    return SessionInfoResponse(
        session_id=session_id,
        message_count=info.get("message_count", 0),
        ttl=info.get("ttl", 0),
    )


@router.post("/fotobooth", response_model=FotoboothResponse)
async def generate_fotobooth(
    request: FotoboothRequest,
    db: Annotated[Session, Depends(get_db)],
    current_user: CurrentUser,
):
    """Generate AI Fotobooth image for product review."""
    try:
        service = AIService(db)
        result = await service.generate_fotobooth(
            user_id=current_user.id,
            product_id=request.product_id,
            image_data=request.image_data,
            style=request.style or "natural",
        )
        await service.close()

        return FotoboothResponse(
            image_url=result.get("image_url"),
            image_data=result.get("image_data"),
            product_name=result["product_name"],
            generation_time_ms=result["generation_time_ms"],
            message="AI Fotobooth image generated successfully!",
        )
    except ExternalServiceException:
        raise
    except Exception as e:
        logger.error("Fotobooth error: %s", e)
        raise BadRequestException(f"Failed to generate fotobooth image: {e}")


@router.get("/languages")
async def get_supported_languages():
    """Get list of supported languages for voice/chat."""
    from app.services.ai.locales import SUPPORTED_LOCALES

    return {
        "languages": [
            {
                "code": config.code,
                "name": config.name,
                "stt_code": config.stt_code,
                "flag": config.flag,
                "is_regional": config.is_regional,
            }
            for config in SUPPORTED_LOCALES.values()
        ],
        "default": "id",
    }
