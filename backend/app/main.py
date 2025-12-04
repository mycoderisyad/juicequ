"""
JuiceQu API - Main FastAPI Application Entry Point.
"""
import logging
from contextlib import asynccontextmanager
from pathlib import Path
from typing import AsyncGenerator

from fastapi import FastAPI
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
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

# Rate Limiting Middleware (applied first)
app.add_middleware(
    RateLimitMiddleware,
    requests_per_minute=60,
    requests_per_hour=1000,
    exclude_paths=["/health", "/docs", "/openapi.json", "/redoc", "/"],
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

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
