"""
Chatbot Service for AI-powered conversations.
Handles chat logic, context building, and response generation.
"""
import json
import logging
import time
import uuid
from datetime import datetime
from typing import Any, Optional

from sqlalchemy.orm import Session

from app.config import settings
from app.models.ai_interaction import AIInteraction, InteractionStatus, InteractionType
from app.models.user import User
from app.services.ai.kolosal_client import KolosalClient
from app.services.ai.rag_service import RAGService

logger = logging.getLogger(__name__)


class ChatbotService:
    """Service for handling chatbot interactions."""
    
    def __init__(self, db: Session):
        """Initialize chatbot service."""
        self.db = db
        self.kolosal = KolosalClient()
        self.rag = RAGService(db)
    
    async def chat(
        self,
        user_input: str,
        user_id: Optional[str] = None,
        session_id: Optional[str] = None,
    ) -> dict[str, Any]:
        """
        Process a chat message.
        
        Args:
            user_input: User's message
            user_id: Optional user ID for personalization
            session_id: Session ID for conversation context
        
        Returns:
            Dict with response and metadata
        """
        if not session_id:
            session_id = str(uuid.uuid4())
        
        # Create interaction record
        interaction = AIInteraction(
            session_id=session_id,
            user_id=user_id,
            interaction_type=InteractionType.CHAT,
            status=InteractionStatus.ACTIVE,
            user_input=user_input,
            user_input_type="text",
        )
        self.db.add(interaction)
        
        try:
            start_time = time.time()
            
            # Get user context
            user_context = await self._get_user_context(user_id)
            
            # Get relevant product context via RAG
            context_chunks = await self.rag.retrieve_context(user_input)
            context_text = "\n".join([chunk["text"] for chunk in context_chunks])
            
            # Build system prompt
            system_prompt = self._build_system_prompt(user_context, context_text)
            
            # Call AI
            response = await self.kolosal.chat_completion(
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_input},
                ]
            )
            
            response_time = int((time.time() - start_time) * 1000)
            
            # Update interaction
            interaction.ai_response = response.get("content", "")
            interaction.context_used = json.dumps(context_chunks)
            interaction.response_time_ms = response_time
            interaction.model_used = settings.kolosal_model
            interaction.status = InteractionStatus.COMPLETED
            interaction.completed_at = datetime.utcnow()
            
            self.db.commit()
            
            return {
                "response": response.get("content", ""),
                "session_id": session_id,
                "context_used": context_chunks,
                "response_time_ms": response_time,
            }
            
        except Exception as e:
            logger.error("Chat error: %s", str(e))
            interaction.status = InteractionStatus.ERROR
            interaction.ai_response = f"Error: {str(e)}"
            self.db.commit()
            raise
    
    async def _get_user_context(self, user_id: Optional[str]) -> str:
        """Get user context for personalization."""
        if not user_id:
            return ""
        
        user = self.db.query(User).filter(User.id == user_id).first()
        if not user:
            return ""
        
        parts = []
        if user.full_name:
            parts.append(f"Nama pelanggan: {user.full_name}")
        if user.preferences:
            parts.append(f"Preferensi: {user.preferences}")
        
        return "\n".join(parts)
    
    def _build_system_prompt(self, user_context: str, product_context: str) -> str:
        """Build the system prompt for AI."""
        return f"""Kamu adalah JuiceQu Assistant, asisten virtual untuk toko jus JuiceQu.

TUGAS:
- Membantu pelanggan menemukan jus yang tepat
- Memberikan informasi produk, nutrisi, dan manfaat kesehatan
- Memberikan rekomendasi yang dipersonalisasi
- Menjawab pertanyaan tentang produk dan pesanan

PANDUAN:
- Ramah, antusias, dan informatif
- Jawaban singkat tapi membantu
- Fokus pada manfaat kesehatan dan bahan alami
- Jika tidak tahu, akui dengan jujur
- Jangan memberikan saran medis

{f"KONTEKS PELANGGAN:{chr(10)}{user_context}{chr(10)}" if user_context else ""}
INFORMASI PRODUK:
{product_context}

Selalu jawab dalam Bahasa Indonesia."""
    
    async def close(self) -> None:
        """Clean up resources."""
        await self.kolosal.close()
        await self.rag.close()
