"""
Middleware module for JuiceQu API.
Contains CORS, logging, CSRF, and other middleware configurations.
"""
import logging
import secrets
import time
from typing import Callable

from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware

logger = logging.getLogger(__name__)

# CSRF token settings
CSRF_COOKIE_NAME = "csrf_token"
CSRF_HEADER_NAME = "X-CSRF-Token"
CSRF_SAFE_METHODS = {"GET", "HEAD", "OPTIONS", "TRACE"}


class RequestLoggingMiddleware(BaseHTTPMiddleware):
    """
    Middleware for logging HTTP requests and responses.
    """
    
    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        """Log request details and timing."""
        start_time = time.time()
        
        # Process request
        response = await call_next(request)
        
        # Calculate processing time
        process_time = (time.time() - start_time) * 1000
        
        # Log request (only in debug mode or for errors)
        if response.status_code >= 400 or logger.isEnabledFor(logging.DEBUG):
            logger.info(
                "%s %s - Status: %d - Time: %.2fms",
                request.method,
                request.url.path,
                response.status_code,
                process_time,
            )
        
        # Add timing header
        response.headers["X-Process-Time"] = f"{process_time:.2f}ms"
        
        return response


class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    """
    Middleware for adding security headers to responses.
    """
    
    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        """Add security headers to response."""
        response = await call_next(request)
        
        # Security headers
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["X-XSS-Protection"] = "1; mode=block"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        
        return response


class CSRFMiddleware(BaseHTTPMiddleware):
    """
    CSRF protection middleware.
    
    - Sets CSRF token cookie on responses
    - Validates CSRF token header on state-changing requests (POST, PUT, DELETE, PATCH)
    - Skips validation for API endpoints that use Bearer token auth
    """
    
    def __init__(self, app, exempt_paths: list[str] | None = None):
        super().__init__(app)
        # Paths exempt from CSRF validation (e.g., OAuth callbacks, webhooks)
        self.exempt_paths = exempt_paths or [
            "/api/v1/auth/google/callback",
            "/api/v1/auth/login",
            "/api/v1/auth/register",
            "/api/v1/auth/refresh",
            "/api/v1/ai/voice",  # Voice API uses different auth
            "/docs",
            "/redoc",
            "/openapi.json",
        ]
    
    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        """Handle CSRF token validation and generation."""
        # Get or generate CSRF token
        csrf_token = request.cookies.get(CSRF_COOKIE_NAME)
        if not csrf_token:
            csrf_token = secrets.token_urlsafe(32)
        
        # Check if CSRF validation is needed
        if request.method not in CSRF_SAFE_METHODS:
            # Skip validation for exempt paths
            if not self._is_exempt(request.url.path):
                # Skip if request has Bearer token (API clients)
                auth_header = request.headers.get("Authorization", "")
                if not auth_header.startswith("Bearer "):
                    # Validate CSRF token from header
                    header_token = request.headers.get(CSRF_HEADER_NAME)
                    cookie_token = request.cookies.get(CSRF_COOKIE_NAME)
                    
                    if not header_token or not cookie_token or header_token != cookie_token:
                        from fastapi.responses import JSONResponse
                        return JSONResponse(
                            status_code=403,
                            content={"detail": "CSRF token validation failed"},
                        )
        
        # Process request
        response = await call_next(request)
        
        # Set CSRF token cookie (always refresh on response)
        response.set_cookie(
            key=CSRF_COOKIE_NAME,
            value=csrf_token,
            httponly=False,  # Must be readable by JavaScript
            secure=request.url.scheme == "https",
            samesite="lax",
            max_age=60 * 60 * 24,  # 24 hours
            path="/",
        )
        
        return response
    
    def _is_exempt(self, path: str) -> bool:
        """Check if path is exempt from CSRF validation."""
        for exempt_path in self.exempt_paths:
            if path.startswith(exempt_path):
                return True
        return False
