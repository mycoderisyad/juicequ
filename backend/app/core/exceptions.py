"""
Custom exceptions for the application.
"""
from typing import Any

from fastapi import HTTPException, status


class JuiceQuException(Exception):
    """Base exception for JuiceQu application."""
    
    def __init__(self, message: str = "An error occurred"):
        self.message = message
        super().__init__(self.message)


class AuthenticationError(JuiceQuException):
    """Raised when authentication fails."""
    pass


class AuthorizationError(JuiceQuException):
    """Raised when user is not authorized."""
    pass


class NotFoundError(JuiceQuException):
    """Raised when a resource is not found."""
    pass


class ValidationError(JuiceQuException):
    """Raised when validation fails."""
    pass


class DuplicateError(JuiceQuException):
    """Raised when a duplicate resource is detected."""
    pass


# HTTP Exceptions for API responses
class CredentialsException(HTTPException):
    """Exception for invalid credentials."""
    
    def __init__(
        self,
        detail: str = "Could not validate credentials",
        headers: dict[str, str] | None = None,
    ):
        super().__init__(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=detail,
            headers=headers or {"WWW-Authenticate": "Bearer"},
        )


class ForbiddenException(HTTPException):
    """Exception for forbidden access."""
    
    def __init__(self, detail: str = "Not enough permissions"):
        super().__init__(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=detail,
        )


class NotFoundException(HTTPException):
    """Exception for resource not found."""
    
    def __init__(self, resource: str = "Resource", detail: str | None = None):
        super().__init__(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=detail or f"{resource} not found",
        )


class BadRequestException(HTTPException):
    """Exception for bad request."""
    
    def __init__(self, detail: str = "Bad request"):
        super().__init__(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=detail,
        )


class ConflictException(HTTPException):
    """Exception for resource conflict (duplicate)."""
    
    def __init__(self, resource: str = "Resource", detail: str | None = None):
        super().__init__(
            status_code=status.HTTP_409_CONFLICT,
            detail=detail or f"{resource} already exists",
        )


class InternalServerException(HTTPException):
    """Exception for internal server errors."""
    
    def __init__(self, detail: str = "Internal server error"):
        super().__init__(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=detail,
        )


class ServiceUnavailableException(HTTPException):
    """Exception for service unavailable."""
    
    def __init__(self, detail: str = "Service temporarily unavailable"):
        super().__init__(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=detail,
        )


class ExternalServiceException(HTTPException):
    """Exception for external service errors (AI, Speech-to-Text, etc.)."""
    
    def __init__(self, service_name: str = "External service", detail: str | None = None):
        super().__init__(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=detail or f"{service_name} is currently unavailable",
        )


class RateLimitException(HTTPException):
    """Exception for rate limit exceeded."""
    
    def __init__(self, detail: str = "Rate limit exceeded. Please try again later."):
        super().__init__(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=detail,
        )


# Exception handlers for FastAPI
async def juice_qu_exception_handler(request: Any, exc: JuiceQuException) -> HTTPException:
    """Handler for JuiceQu custom exceptions."""
    if isinstance(exc, AuthenticationError):
        raise CredentialsException(detail=exc.message)
    elif isinstance(exc, AuthorizationError):
        raise ForbiddenException(detail=exc.message)
    elif isinstance(exc, NotFoundError):
        raise NotFoundException(detail=exc.message)
    elif isinstance(exc, ValidationError):
        raise BadRequestException(detail=exc.message)
    elif isinstance(exc, DuplicateError):
        raise ConflictException(detail=exc.message)
    else:
        raise InternalServerException(detail=exc.message)
