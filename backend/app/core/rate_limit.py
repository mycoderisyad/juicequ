"""Rate limiting middleware for FastAPI."""
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
    """In-memory rate limiter."""

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
        forwarded = request.headers.get("X-Forwarded-For")
        if forwarded:
            ip = forwarded.split(",")[0].strip()
        else:
            ip = request.client.host if request.client else "unknown"

        user_id = getattr(request.state, "user_id", None)
        if user_id:
            return f"{ip}:{user_id}"
        return ip

    async def is_rate_limited(self, request: Request) -> tuple[bool, Optional[Dict]]:
        """Check if request should be rate limited."""
        client_key = self._get_client_key(request)
        current_time = time.time()

        async with self._lock:
            minute_info = self._minute_limits[client_key]
            if current_time - minute_info.window_start >= 60:
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

            hour_info = self._hour_limits[client_key]
            if current_time - hour_info.window_start >= 3600:
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
    """FastAPI middleware for rate limiting."""

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
        if any(request.url.path.startswith(path) for path in self.exclude_paths):
            return await call_next(request)

        is_limited, rate_limit_info = await self.rate_limiter.is_rate_limited(request)

        if is_limited:
            headers = self.rate_limiter.get_headers(rate_limit_info)
            headers["Retry-After"] = str(rate_limit_info.get("retry_after", 60))
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail="Too many requests. Please try again later.",
                headers=headers,
            )

        response = await call_next(request)

        for key, value in self.rate_limiter.get_headers(rate_limit_info).items():
            response.headers[key] = value

        return response


def rate_limit(requests_per_minute: int = 10, requests_per_hour: int = 100):
    """Decorator for endpoint-specific rate limiting."""
    limiter = RateLimiter(
        requests_per_minute=requests_per_minute,
        requests_per_hour=requests_per_hour,
    )

    def decorator(func: Callable) -> Callable:
        async def wrapper(*args, request: Request = None, **kwargs):
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


ai_rate_limiter = RateLimiter(
    requests_per_minute=10,
    requests_per_hour=100,
)

auth_rate_limiter = RateLimiter(
    requests_per_minute=5,
    requests_per_hour=30,
)


async def check_auth_rate_limit(request: Request) -> None:
    """Dependency for rate limiting auth endpoints."""
    is_limited, info = await auth_rate_limiter.is_rate_limited(request)
    if is_limited:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Too many authentication attempts. Please try again later.",
            headers={
                "Retry-After": str(info.get("retry_after", 60)),
                **auth_rate_limiter.get_headers(info),
            },
        )
