"""
JuiceQu API - Main FastAPI Application Entry Point.
"""
import logging
import secrets
from contextlib import asynccontextmanager
from pathlib import Path
from typing import AsyncGenerator

from fastapi import FastAPI, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from sqlalchemy import text

from app.api.v1.router import api_router
from app.config import settings
from app.core.rate_limit import RateLimitMiddleware
from app.db.session import get_db

# Configure logging
logging.basicConfig(
    level=logging.INFO if settings.app_env == "production" else logging.DEBUG,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger(__name__)


# CSRF Token configuration
CSRF_TOKEN_NAME = "X-CSRF-Token"
CSRF_COOKIE_NAME = "csrf_token"
CSRF_SAFE_METHODS = {"GET", "HEAD", "OPTIONS", "TRACE"}


def setup_uploads_directory() -> Path:
    """Create uploads directory if it doesn't exist."""
    uploads_path = Path(settings.upload_base_path)
    uploads_path.mkdir(parents=True, exist_ok=True)
    
    # Create subdirectories
    (uploads_path / "products").mkdir(exist_ok=True)
    (uploads_path / "products" / "hero").mkdir(exist_ok=True)
    (uploads_path / "products" / "catalog").mkdir(exist_ok=True)
    (uploads_path / "products" / "thumbnails").mkdir(exist_ok=True)
    (uploads_path / "users").mkdir(exist_ok=True)
    (uploads_path / "temp").mkdir(exist_ok=True)
    
    return uploads_path


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    """Application lifespan events."""
    # Startup
    logger.info("Starting %s v%s", settings.app_name, settings.app_version)
    logger.info("Environment: %s", settings.app_env)
    
    # Setup uploads directory
    uploads_path = setup_uploads_directory()
    logger.info("Uploads directory: %s", uploads_path.absolute())
    
    yield
    # Shutdown
    logger.info("Shutting down...")



app = FastAPI(
    title=settings.app_name,
    version=settings.app_version,
    description="E-commerce API for JuiceQu juice store with AI integration",
    docs_url=None,  # Disabled - protected endpoint below
    redoc_url=None,  # Disabled - protected endpoint below
    lifespan=lifespan,
)

# Rate Limiting Middleware (applied first)
app.add_middleware(
    RateLimitMiddleware,
    requests_per_minute=60,
    requests_per_hour=1000,
    exclude_paths=["/health", "/docs", "/openapi.json", "/redoc", "/"],
)

# CORS Middleware - More restrictive configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,  # Must be explicitly set in env
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],  # Explicit methods
    allow_headers=[
        "Authorization",
        "Content-Type",
        "Accept",
        "Origin",
        "X-Requested-With",
        CSRF_TOKEN_NAME,  # Allow CSRF token header
    ],
    expose_headers=[
        "X-RateLimit-Limit",
        "X-RateLimit-Remaining",
        "X-RateLimit-Reset",
    ],
    max_age=600,  # Cache preflight for 10 minutes
)


@app.middleware("http")
async def csrf_middleware(request: Request, call_next) -> Response:
    """
    CSRF protection middleware.
    
    - Sets CSRF cookie on first request
    - Validates CSRF token header for state-changing requests
    - Skips validation for safe methods (GET, HEAD, OPTIONS, TRACE)
    """
    response = await call_next(request)
    
    # Generate and set CSRF token cookie if not present
    if CSRF_COOKIE_NAME not in request.cookies:
        csrf_token = secrets.token_urlsafe(32)
        is_production = settings.app_env == "production"
        response.set_cookie(
            key=CSRF_COOKIE_NAME,
            value=csrf_token,
            httponly=False,  # Must be readable by JavaScript to send in header
            secure=is_production,
            samesite="lax",
            max_age=3600 * 24,  # 24 hours
            path="/",
        )
    
    return response


@app.middleware("http")
async def validate_csrf_token(request: Request, call_next) -> Response:
    """
    Validate CSRF token for state-changing requests.
    """
    # Skip CSRF validation for safe methods
    if request.method in CSRF_SAFE_METHODS:
        return await call_next(request)
    
    # Skip CSRF for API endpoints that use Bearer auth (stateless)
    # CSRF is mainly needed for cookie-based auth
    auth_header = request.headers.get("Authorization", "")
    if auth_header.startswith("Bearer "):
        return await call_next(request)
    
    # Skip for paths that don't need CSRF (webhooks, health checks)
    skip_paths = ["/health", "/docs", "/openapi.json", "/redoc"]
    if any(request.url.path.startswith(path) for path in skip_paths):
        return await call_next(request)
    
    # Validate CSRF token for cookie-based auth
    csrf_cookie = request.cookies.get(CSRF_COOKIE_NAME)
    csrf_header = request.headers.get(CSRF_TOKEN_NAME)
    
    # If using cookie-based auth (access_token cookie present), require CSRF
    if "access_token" in request.cookies:
        if not csrf_cookie or not csrf_header:
            from fastapi.responses import JSONResponse
            return JSONResponse(
                status_code=403,
                content={"detail": "CSRF token missing"}
            )
        
        if not secrets.compare_digest(csrf_cookie, csrf_header):
            from fastapi.responses import JSONResponse
            return JSONResponse(
                status_code=403,
                content={"detail": "CSRF token invalid"}
            )
    
    return await call_next(request)


# Include API router
app.include_router(api_router, prefix="/api/v1")

# Mount static files for uploads (local storage)
# Files uploaded to ./uploads will be served at /uploads/*
uploads_path = Path(settings.upload_base_path)
uploads_path.mkdir(parents=True, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=str(uploads_path)), name="uploads")


@app.get("/", tags=["Health"])
async def root() -> dict[str, str]:
    """Health check endpoint."""
    return {
        "status": "healthy",
        "app": settings.app_name,
        "version": settings.app_version,
    }


@app.get("/health", tags=["Health"])
async def health_check() -> dict[str, str]:
    """Detailed health check endpoint."""
    db_status = "disconnected"
    
    try:
        # Test database connection
        db = next(get_db())
        db.execute(text("SELECT 1"))
        db_status = "connected"
    except Exception:
        db_status = "error"
    
    return {
        "status": "healthy" if db_status == "connected" else "degraded",
        "environment": settings.app_env,
        "version": settings.app_version,
        "services": {
            "database": db_status,
            "ai": "available" if settings.kolosal_api_key else "not_configured",
        },
    }


@app.get("/health/ready", tags=["Health"])
async def readiness_check() -> dict[str, str]:
    """Kubernetes readiness probe endpoint."""
    try:
        db = next(get_db())
        db.execute(text("SELECT 1"))
        return {"status": "ready"}
    except Exception as e:
        return {"status": "not_ready", "reason": str(e)}


@app.get("/health/live", tags=["Health"])
async def liveness_check() -> dict[str, str]:
    """Kubernetes liveness probe endpoint."""
    return {"status": "alive"}


# ===========================================
# Protected API Documentation (Admin Only)
# ===========================================
from fastapi.openapi.docs import get_swagger_ui_html, get_redoc_html
from fastapi.responses import HTMLResponse, JSONResponse
from app.core.dependencies import get_current_user


@app.get("/docs", tags=["Documentation"], include_in_schema=False)
async def get_docs(request: Request) -> HTMLResponse:
    """
    Swagger UI documentation.
    Protected: Requires admin authentication via cookie.
    """
    # Check for access_token cookie
    access_token = request.cookies.get("access_token")
    if not access_token:
        return HTMLResponse(
            content="""
            <html>
                <head><title>Access Denied</title></head>
                <body style="font-family: sans-serif; padding: 50px; text-align: center;">
                    <h1>Access Denied</h1>
                    <p>API documentation is restricted to administrators.</p>
                    <p><a href="/">Go to Home</a></p>
                </body>
            </html>
            """,
            status_code=403
        )
    
    # Validate token and check role
    try:
        from jose import jwt
        payload = jwt.decode(
            access_token.replace("Bearer ", ""),
            settings.secret_key,
            algorithms=["HS256"]
        )
        role = payload.get("role", "")
        if role != "admin":
            return HTMLResponse(
                content="""
                <html>
                    <head><title>Access Denied</title></head>
                    <body style="font-family: sans-serif; padding: 50px; text-align: center;">
                        <h1>Access Denied</h1>
                        <p>Only administrators can access API documentation.</p>
                        <p><a href="/">Go to Home</a></p>
                    </body>
                </html>
                """,
                status_code=403
            )
    except Exception:
        return HTMLResponse(
            content="""
            <html>
                <head><title>Session Expired</title></head>
                <body style="font-family: sans-serif; padding: 50px; text-align: center;">
                    <h1>Session Expired</h1>
                    <p>Please login again to access documentation.</p>
                    <p><a href="/">Go to Home</a></p>
                </body>
            </html>
            """,
            status_code=401
        )
    
    return get_swagger_ui_html(
        openapi_url="/openapi.json",
        title=f"{settings.app_name} - API Docs"
    )


@app.get("/redoc", tags=["Documentation"], include_in_schema=False)
async def get_redoc(request: Request) -> HTMLResponse:
    """
    ReDoc documentation.
    Protected: Requires admin authentication via cookie.
    """
    access_token = request.cookies.get("access_token")
    if not access_token:
        return HTMLResponse(
            content="<h1>Access Denied</h1><p>Login as admin to access.</p>",
            status_code=403
        )
    
    try:
        from jose import jwt
        payload = jwt.decode(
            access_token.replace("Bearer ", ""),
            settings.secret_key,
            algorithms=["HS256"]
        )
        if payload.get("role") != "admin":
            return HTMLResponse(
                content="<h1>Access Denied</h1><p>Admin only.</p>",
                status_code=403
            )
    except Exception:
        return HTMLResponse(
            content="<h1>Session Expired</h1>",
            status_code=401
        )
    
    return get_redoc_html(
        openapi_url="/openapi.json",
        title=f"{settings.app_name} - API Docs"
    )
