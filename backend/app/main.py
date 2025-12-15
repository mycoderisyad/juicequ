"""JuiceQu API - Main FastAPI Application Entry Point."""
import logging
from contextlib import asynccontextmanager
from pathlib import Path
from typing import AsyncGenerator

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.openapi.docs import get_swagger_ui_html, get_redoc_html
from fastapi.responses import HTMLResponse
from fastapi.staticfiles import StaticFiles
from jose import jwt
from sqlalchemy import text

from app.api.v1.router import api_router
from app.config import settings
from app.core.middleware import (
    CSRFMiddleware,
    SecurityHeadersMiddleware,
    CSRF_HEADER_NAME,
)
from app.core.rate_limit import RateLimitMiddleware
from app.db.session import get_db

logging.basicConfig(
    level=logging.INFO if settings.app_env == "production" else logging.DEBUG,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger(__name__)


def setup_uploads_directory() -> Path:
    """Create uploads directory structure."""
    uploads_path = Path(settings.upload_base_path)
    uploads_path.mkdir(parents=True, exist_ok=True)

    for subdir in [
        "products",
        "products/hero",
        "products/catalog",
        "products/thumbnails",
        "users",
        "temp",
    ]:
        (uploads_path / subdir).mkdir(exist_ok=True)

    return uploads_path


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    """Application lifespan events."""
    logger.info("Starting %s v%s", settings.app_name, settings.app_version)
    logger.info("Environment: %s", settings.app_env)
    uploads_path = setup_uploads_directory()
    logger.info("Uploads directory: %s", uploads_path.absolute())
    yield
    logger.info("Shutting down...")


app = FastAPI(
    title=settings.app_name,
    version=settings.app_version,
    description="E-commerce API for JuiceQu juice store with AI integration",
    docs_url=None,
    redoc_url=None,
    lifespan=lifespan,
)

app.add_middleware(
    RateLimitMiddleware,
    requests_per_minute=60,
    requests_per_hour=1000,
    exclude_paths=["/health", "/docs", "/openapi.json", "/redoc", "/"],
)

app.add_middleware(SecurityHeadersMiddleware)

app.add_middleware(
    CSRFMiddleware,
    cookie_secure=settings.app_env == "production",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allow_headers=[
        "Authorization",
        "Content-Type",
        "Accept",
        "Origin",
        "X-Requested-With",
        CSRF_HEADER_NAME,
    ],
    expose_headers=[
        "X-RateLimit-Limit",
        "X-RateLimit-Remaining",
        "X-RateLimit-Reset",
    ],
    max_age=600,
)

app.include_router(api_router, prefix="/api/v1")

uploads_path = Path(settings.upload_base_path)
uploads_path.mkdir(parents=True, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=str(uploads_path)), name="uploads")


@app.get("/", tags=["Health"])
async def root() -> dict[str, str]:
    """Root health check."""
    return {
        "status": "healthy",
        "app": settings.app_name,
        "version": settings.app_version,
    }


@app.get("/health", tags=["Health"])
async def health_check() -> dict:
    """Detailed health check."""
    db_status = "disconnected"
    try:
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
            "ai": "available" if settings.gemini_api_key else "not_configured",
        },
    }


@app.get("/health/ready", tags=["Health"])
async def readiness_check() -> dict[str, str]:
    """Kubernetes readiness probe."""
    try:
        db = next(get_db())
        db.execute(text("SELECT 1"))
        return {"status": "ready"}
    except Exception as e:
        return {"status": "not_ready", "reason": str(e)}


@app.get("/health/live", tags=["Health"])
async def liveness_check() -> dict[str, str]:
    """Kubernetes liveness probe."""
    return {"status": "alive"}


def _verify_admin_token(token: str) -> bool:
    """Verify JWT token and check for admin role."""
    try:
        payload = jwt.decode(
            token.replace("Bearer ", ""),
            settings.secret_key,
            algorithms=["HS256"],
        )
        return payload.get("role") == "admin"
    except Exception:
        return False


def _access_denied_html(message: str, status_code: int = 403) -> HTMLResponse:
    """Generate access denied HTML response."""
    return HTMLResponse(
        content=f"""
        <html>
            <head><title>Access Denied</title></head>
            <body style="font-family: sans-serif; padding: 50px; text-align: center;">
                <h1>Access Denied</h1>
                <p>{message}</p>
                <p><a href="/">Go to Home</a></p>
            </body>
        </html>
        """,
        status_code=status_code,
    )


@app.get("/docs", tags=["Documentation"], include_in_schema=False)
async def get_docs(request: Request) -> HTMLResponse:
    """Swagger UI documentation (admin only in production)."""
    if settings.app_env == "development":
        return get_swagger_ui_html(
            openapi_url="/openapi.json",
            title=f"{settings.app_name} - API Docs (Development)",
        )

    access_token = request.cookies.get("access_token")
    if not access_token:
        return _access_denied_html("API documentation is restricted to administrators.")

    if not _verify_admin_token(access_token):
        return _access_denied_html("Only administrators can access API documentation.")

    return get_swagger_ui_html(
        openapi_url="/openapi.json",
        title=f"{settings.app_name} - API Docs",
    )


@app.get("/redoc", tags=["Documentation"], include_in_schema=False)
async def get_redoc(request: Request) -> HTMLResponse:
    """ReDoc documentation (admin only in production)."""
    if settings.app_env == "development":
        return get_redoc_html(
            openapi_url="/openapi.json",
            title=f"{settings.app_name} - API Docs (Development)",
        )

    access_token = request.cookies.get("access_token")
    if not access_token:
        return _access_denied_html("Login as admin to access.")

    if not _verify_admin_token(access_token):
        return _access_denied_html("Admin only.")

    return get_redoc_html(
        openapi_url="/openapi.json",
        title=f"{settings.app_name} - API Docs",
    )
