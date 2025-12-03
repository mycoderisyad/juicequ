"""
Rate limiting middleware for FastAPI.
Uses in-memory storage for development; can be extended for Redis in production.
"""
import asyncio
import time
from collections import defaultdict
from dataclasses import dataclass, field
from typing import Callable, Dict, Optional

from fastapi import HTTPException, Request, status
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import Response


@dataclass
class RateLimitInfo:
    """Rate limit information for a client."""
    requests: int = 0
    window_start: float = field(default_factory=time.time)


class RateLimiter:
    """
    Simple in-memory rate limiter.
    
    For production, consider using Redis-based rate limiting.
    """
    
    def __init__(
        self,
        requests_per_minute: int = 60,
        requests_per_hour: int = 1000,
    ):
        self.requests_per_minute = requests_per_minute
        self.requests_per_hour = requests_per_hour
        self._minute_limits: Dict[str, RateLimitInfo] = defaultdict(RateLimitInfo)
        self._hour_limits: Dict[str, RateLimitInfo] = defaultdict(RateLimitInfo)
        self._lock = asyncio.Lock()
    
    def _get_client_key(self, request: Request) -> str:
        """Get unique key for client based on IP and user."""
        # Get client IP
        forwarded = request.headers.get("X-Forwarded-For")
        if forwarded:
            ip = forwarded.split(",")[0].strip()
        else:
            ip = request.client.host if request.client else "unknown"
        
        # Include user ID if authenticated
        user_id = getattr(request.state, "user_id", None)
        if user_id:
            return f"{ip}:{user_id}"
        return ip
    
    async def is_rate_limited(self, request: Request) -> tuple[bool, Optional[Dict]]:
        """
        Check if request should be rate limited.
        
        Returns:
            Tuple of (is_limited, rate_limit_info)
        """
        client_key = self._get_client_key(request)
        current_time = time.time()
        
        async with self._lock:
            # Check minute limit
            minute_info = self._minute_limits[client_key]
            if current_time - minute_info.window_start >= 60:
                # Reset minute window
                minute_info.requests = 0
                minute_info.window_start = current_time
            
            minute_info.requests += 1
            
            if minute_info.requests > self.requests_per_minute:
                retry_after = int(60 - (current_time - minute_info.window_start))
                return True, {
                    "limit": self.requests_per_minute,
                    "remaining": 0,
                    "reset": int(minute_info.window_start + 60),
                    "retry_after": max(1, retry_after),
                }
            
            # Check hour limit
            hour_info = self._hour_limits[client_key]
            if current_time - hour_info.window_start >= 3600:
                # Reset hour window
                hour_info.requests = 0
                hour_info.window_start = current_time
            
            hour_info.requests += 1
            
            if hour_info.requests > self.requests_per_hour:
                retry_after = int(3600 - (current_time - hour_info.window_start))
                return True, {
                    "limit": self.requests_per_hour,
                    "remaining": 0,
                    "reset": int(hour_info.window_start + 3600),
                    "retry_after": max(1, retry_after),
                }
            
            return False, {
                "limit": self.requests_per_minute,
                "remaining": self.requests_per_minute - minute_info.requests,
                "reset": int(minute_info.window_start + 60),
            }
    
    def get_headers(self, rate_limit_info: Dict) -> Dict[str, str]:
        """Get rate limit headers for response."""
        return {
            "X-RateLimit-Limit": str(rate_limit_info.get("limit", 0)),
            "X-RateLimit-Remaining": str(rate_limit_info.get("remaining", 0)),
            "X-RateLimit-Reset": str(rate_limit_info.get("reset", 0)),
        }


class RateLimitMiddleware(BaseHTTPMiddleware):
    """
    FastAPI middleware for rate limiting.
    
    Usage:
        app.add_middleware(
            RateLimitMiddleware,
            requests_per_minute=60,
            requests_per_hour=1000,
        )
    """
    
    def __init__(
        self,
        app,
        requests_per_minute: int = 60,
        requests_per_hour: int = 1000,
        exclude_paths: Optional[list[str]] = None,
    ):
        super().__init__(app)
        self.rate_limiter = RateLimiter(
            requests_per_minute=requests_per_minute,
            requests_per_hour=requests_per_hour,
        )
        self.exclude_paths = exclude_paths or ["/health", "/docs", "/openapi.json", "/redoc"]
    
    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        """Process request and apply rate limiting."""
        # Skip rate limiting for excluded paths
        if any(request.url.path.startswith(path) for path in self.exclude_paths):
            return await call_next(request)
        
        # Check rate limit
        is_limited, rate_limit_info = await self.rate_limiter.is_rate_limited(request)
        
        if is_limited:
            headers = self.rate_limiter.get_headers(rate_limit_info)
            headers["Retry-After"] = str(rate_limit_info.get("retry_after", 60))
            
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail="Too many requests. Please try again later.",
                headers=headers,
            )
        
        # Process request and add rate limit headers to response
        response = await call_next(request)
        
        # Add rate limit headers
        for key, value in self.rate_limiter.get_headers(rate_limit_info).items():
            response.headers[key] = value
        
        return response


# Endpoint-specific rate limiting decorator
def rate_limit(
    requests_per_minute: int = 10,
    requests_per_hour: int = 100,
):
    """
    Decorator for endpoint-specific rate limiting.
    
    Usage:
        @router.post("/ai/chat")
        @rate_limit(requests_per_minute=10)
        async def chat(...):
            ...
    """
    limiter = RateLimiter(
        requests_per_minute=requests_per_minute,
        requests_per_hour=requests_per_hour,
    )
    
    def decorator(func: Callable) -> Callable:
        async def wrapper(*args, request: Request = None, **kwargs):
            # Try to get request from kwargs or args
            req = request
            if req is None:
                for arg in args:
                    if isinstance(arg, Request):
                        req = arg
                        break
            
            if req:
                is_limited, rate_limit_info = await limiter.is_rate_limited(req)
                
                if is_limited:
                    raise HTTPException(
                        status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                        detail="Too many requests. Please try again later.",
                        headers={
                            "Retry-After": str(rate_limit_info.get("retry_after", 60)),
                            **limiter.get_headers(rate_limit_info),
                        },
                    )
            
            return await func(*args, request=request, **kwargs)
        
        return wrapper
    
    return decorator


# AI-specific rate limiter with stricter limits
ai_rate_limiter = RateLimiter(
    requests_per_minute=10,  # 10 AI requests per minute
    requests_per_hour=100,   # 100 AI requests per hour
)
