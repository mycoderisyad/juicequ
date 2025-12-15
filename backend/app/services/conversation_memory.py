"""Conversation memory service using Redis."""
import json
import logging
from typing import Any

from app.config import settings

logger = logging.getLogger(__name__)


class ConversationMemory:
    """
    Manages conversation history in Redis.
    Stores up to MAX_MESSAGES per session with TTL.
    """

    MAX_MESSAGES = 20
    SESSION_TTL = 86400  # 24 hours

    def __init__(self):
        self.redis = None
        self._initialized = False
        self._init_redis()

    def _init_redis(self) -> None:
        """Initialize Redis connection."""
        try:
            import redis.asyncio as redis

            self.redis = redis.from_url(
                settings.redis_url,
                encoding="utf-8",
                decode_responses=True,
            )
            self._initialized = True
            logger.info("Redis connection initialized")
        except ImportError:
            logger.warning("redis package not installed, conversation memory disabled")
        except Exception as e:
            logger.error("Failed to initialize Redis: %s", e)

    def _get_key(self, session_id: str) -> str:
        """Get Redis key for session."""
        return f"juicequ:conversation:{session_id}"

    @property
    def is_available(self) -> bool:
        """Check if Redis is available."""
        return self._initialized and self.redis is not None

    async def add_message(
        self,
        session_id: str,
        role: str,
        content: str,
        metadata: dict[str, Any] | None = None,
    ) -> bool:
        """
        Add a message to conversation history.

        Args:
            session_id: Session identifier
            role: Message role (user/assistant)
            content: Message content
            metadata: Optional metadata (intent, timestamp, etc.)

        Returns:
            True if successful, False otherwise
        """
        if not self.is_available:
            return False

        try:
            key = self._get_key(session_id)

            message = {
                "role": role,
                "content": content,
            }
            if metadata:
                message["metadata"] = metadata

            await self.redis.rpush(key, json.dumps(message))
            await self.redis.ltrim(key, -self.MAX_MESSAGES, -1)
            await self.redis.expire(key, self.SESSION_TTL)

            return True

        except Exception as e:
            logger.error("Failed to add message to Redis: %s", e)
            return False

    async def get_history(
        self,
        session_id: str,
        limit: int | None = None,
    ) -> list[dict[str, Any]]:
        """
        Get conversation history for a session.

        Args:
            session_id: Session identifier
            limit: Optional limit on number of messages

        Returns:
            List of message dicts
        """
        if not self.is_available:
            return []

        try:
            key = self._get_key(session_id)

            if limit:
                messages = await self.redis.lrange(key, -limit, -1)
            else:
                messages = await self.redis.lrange(key, 0, -1)

            return [json.loads(msg) for msg in messages]

        except Exception as e:
            logger.error("Failed to get history from Redis: %s", e)
            return []

    async def clear_session(self, session_id: str) -> bool:
        """
        Clear conversation history for a session.

        Args:
            session_id: Session identifier

        Returns:
            True if successful, False otherwise
        """
        if not self.is_available:
            return False

        try:
            key = self._get_key(session_id)
            await self.redis.delete(key)
            return True

        except Exception as e:
            logger.error("Failed to clear session from Redis: %s", e)
            return False

    async def get_session_info(self, session_id: str) -> dict[str, Any]:
        """
        Get information about a session.

        Args:
            session_id: Session identifier

        Returns:
            Dict with message_count and ttl
        """
        if not self.is_available:
            return {"message_count": 0, "ttl": 0}

        try:
            key = self._get_key(session_id)
            count = await self.redis.llen(key)
            ttl = await self.redis.ttl(key)

            return {
                "message_count": count,
                "ttl": max(0, ttl),
            }

        except Exception as e:
            logger.error("Failed to get session info from Redis: %s", e)
            return {"message_count": 0, "ttl": 0}

    async def close(self) -> None:
        """Close Redis connection."""
        if self.redis:
            await self.redis.close()
            self.redis = None
            self._initialized = False


_conversation_memory: ConversationMemory | None = None


def get_conversation_memory() -> ConversationMemory:
    """Get singleton conversation memory instance."""
    global _conversation_memory
    if _conversation_memory is None:
        _conversation_memory = ConversationMemory()
    return _conversation_memory

