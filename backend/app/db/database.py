"""
Database configuration and connection setup.
Uses SQLAlchemy 2.x patterns with support for SQLite and PostgreSQL.
"""
from sqlalchemy import create_engine, MetaData, event
from sqlalchemy.orm import DeclarativeBase, declared_attr

from app.config import settings


# Naming convention for constraints (helps with Alembic migrations)
convention = {
    "ix": "ix_%(column_0_label)s",
    "uq": "uq_%(table_name)s_%(column_0_name)s",
    "ck": "ck_%(table_name)s_%(constraint_name)s",
    "fk": "fk_%(table_name)s_%(column_0_name)s_%(referred_table_name)s",
    "pk": "pk_%(table_name)s",
}


class Base(DeclarativeBase):
    """Base class for all SQLAlchemy models."""
    
    metadata = MetaData(naming_convention=convention)
    
    @declared_attr.directive
    def __tablename__(cls) -> str:
        """Auto-generate table name from class name."""
        # Convert CamelCase to snake_case
        name = cls.__name__
        return "".join(
            ["_" + c.lower() if c.isupper() else c for c in name]
        ).lstrip("_")


# Create database engine with appropriate settings
if settings.is_sqlite:
    # SQLite configuration
    engine = create_engine(
        settings.database_url,
        connect_args={"check_same_thread": False},
        echo=settings.debug,
    )
    
    # Enable foreign keys for SQLite
    @event.listens_for(engine, "connect")
    def set_sqlite_pragma(dbapi_connection, connection_record):
        cursor = dbapi_connection.cursor()
        cursor.execute("PRAGMA foreign_keys=ON")
        cursor.close()
else:
    # PostgreSQL configuration
    engine = create_engine(
        settings.database_url,
        pool_pre_ping=True,
        pool_size=5,
        max_overflow=10,
        echo=settings.debug,
    )
