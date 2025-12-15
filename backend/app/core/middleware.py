"""Middleware module for JuiceQu API."""
import logging
import secrets
import time
from typing import Callable

from fastapi import Request, Response
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware

logger = logging.getLogger(__name__)

CSRF_COOKIE_NAME = "csrf_token"
CSRF_HEADER_NAME = "X-CSRF-Token"
CSRF_SAFE_METHODS = {"GET", "HEAD", "OPTIONS", "TRACE"}


class RequestLoggingMiddleware(BaseHTTPMiddleware):
    """Middleware for logging HTTP requests and responses."""

    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        start_time = time.time()
        response = await call_next(request)
        process_time = (time.time() - start_time) * 1000

        if response.status_code >= 400 or logger.isEnabledFor(logging.DEBUG):
            logger.info(
                "%s %s - Status: %d - Time: %.2fms",
                request.method,
                request.url.path,
                response.status_code,
                process_time,
            )

        response.headers["X-Process-Time"] = f"{process_time:.2f}ms"
        return response


class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    """Middleware for adding security headers to responses."""

    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        response = await call_next(request)
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["X-XSS-Protection"] = "1; mode=block"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        response.headers["Permissions-Policy"] = "geolocation=(), microphone=(), camera=()"
        return response


class CSRFMiddleware(BaseHTTPMiddleware):
    """
    CSRF protection middleware.
    
    Sets CSRF token cookie and validates on state-changing requests.
    Skips validation for Bearer token auth (stateless API clients).
    """

    DEFAULT_EXEMPT_PATHS = [
        "/api/v1/auth/google/callback",
        "/api/v1/auth/login",
        "/api/v1/auth/register",
        "/api/v1/auth/refresh",
        "/api/v1/ai/voice",
        "/docs",
        "/redoc",
        "/openapi.json",
        "/health",
    ]

    def __init__(
        self,
        app,
        exempt_paths: list[str] | None = None,
        cookie_secure: bool | None = None,
    ):
        super().__init__(app)
        self.exempt_paths = exempt_paths or self.DEFAULT_EXEMPT_PATHS
        self._cookie_secure = cookie_secure

    def _is_secure(self, request: Request) -> bool:
        if self._cookie_secure is not None:
            return self._cookie_secure
        return request.url.scheme == "https"

    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        csrf_token = request.cookies.get(CSRF_COOKIE_NAME)
        new_token = False
        if not csrf_token:
            csrf_token = secrets.token_urlsafe(32)
            new_token = True

        if request.method not in CSRF_SAFE_METHODS:
            if not self._is_exempt(request.url.path):
                auth_header = request.headers.get("Authorization", "")
                if not auth_header.startswith("Bearer "):
                    if "access_token" in request.cookies:
                        header_token = request.headers.get(CSRF_HEADER_NAME)
                        cookie_token = request.cookies.get(CSRF_COOKIE_NAME)

                        if not header_token or not cookie_token:
                            return JSONResponse(
                                status_code=403,
                                content={"detail": "CSRF token missing"},
                            )

                        if not secrets.compare_digest(header_token, cookie_token):
                            return JSONResponse(
                                status_code=403,
                                content={"detail": "CSRF token invalid"},
                            )

        response = await call_next(request)

        if new_token or CSRF_COOKIE_NAME not in request.cookies:
            response.set_cookie(
                key=CSRF_COOKIE_NAME,
                value=csrf_token,
                httponly=False,
                secure=self._is_secure(request),
                samesite="lax",
                max_age=86400,
                path="/",
            )

        return response

    def _is_exempt(self, path: str) -> bool:
        return any(path.startswith(exempt) for exempt in self.exempt_paths)
