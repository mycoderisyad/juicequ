"""
Database session management.
Provides dependency injection for FastAPI endpoints.
"""
from collections.abc import Generator
from typing import Annotated

from fastapi import Depends
from sqlalchemy.orm import Session, sessionmaker

from app.db.database import engine


# Create session factory
SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine,
)


def get_db() -> Generator[Session, None, None]:
    """
    Dependency that provides a database session.
    
    Yields a database session and ensures it's closed after use.
    Use with FastAPI's Depends().
    
    Example:
        @router.get("/items")
        def get_items(db: Annotated[Session, Depends(get_db)]):
            return db.query(Item).all()
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# Type alias for dependency injection
DbSession = Annotated[Session, Depends(get_db)]
