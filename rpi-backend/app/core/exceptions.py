"""
Custom exceptions for Synapse-Hub backend.

Provides structured error handling with proper HTTP status codes
and detailed error messages for different types of failures.
"""

from typing import Optional, Dict, Any
from fastapi import HTTPException, status


class SynapseHubException(Exception):
    """Base exception for all Synapse-Hub specific errors."""
    
    def __init__(
        self,
        message: str,
        error_code: Optional[str] = None,
        details: Optional[Dict[str, Any]] = None
    ):
        self.message = message
        self.error_code = error_code
        self.details = details or {}
        super().__init__(self.message)


class ValidationError(SynapseHubException):
    """Raised when data validation fails."""
    
    def __init__(
        self,
        message: str = "Validation error",
        field: Optional[str] = None,
        value: Optional[Any] = None,
        details: Optional[Dict[str, Any]] = None
    ):
        self.field = field
        self.value = value
        error_details = details or {}
        if field:
            error_details["field"] = field
        if value is not None:
            error_details["value"] = value
        
        super().__init__(
            message=message,
            error_code="VALIDATION_ERROR",
            details=error_details
        )


class NotFoundError(SynapseHubException):
    """Raised when a requested resource is not found."""
    
    def __init__(
        self,
        message: str = "Resource not found",
        resource_type: Optional[str] = None,
        resource_id: Optional[str] = None,
        details: Optional[Dict[str, Any]] = None
    ):
        self.resource_type = resource_type
        self.resource_id = resource_id
        error_details = details or {}
        if resource_type:
            error_details["resource_type"] = resource_type
        if resource_id:
            error_details["resource_id"] = resource_id
        
        super().__init__(
            message=message,
            error_code="NOT_FOUND",
            details=error_details
        )


class DuplicateError(SynapseHubException):
    """Raised when attempting to create a resource that already exists."""
    
    def __init__(
        self,
        message: str = "Resource already exists",
        resource_type: Optional[str] = None,
        conflicting_field: Optional[str] = None,
        details: Optional[Dict[str, Any]] = None
    ):
        self.resource_type = resource_type
        self.conflicting_field = conflicting_field
        error_details = details or {}
        if resource_type:
            error_details["resource_type"] = resource_type
        if conflicting_field:
            error_details["conflicting_field"] = conflicting_field
        
        super().__init__(
            message=message,
            error_code="DUPLICATE_RESOURCE",
            details=error_details
        )


class AuthorizationError(SynapseHubException):
    """Raised when user lacks sufficient permissions."""
    
    def __init__(
        self,
        message: str = "Insufficient permissions",
        required_permission: Optional[str] = None,
        user_id: Optional[str] = None,
        details: Optional[Dict[str, Any]] = None
    ):
        self.required_permission = required_permission
        self.user_id = user_id
        error_details = details or {}
        if required_permission:
            error_details["required_permission"] = required_permission
        if user_id:
            error_details["user_id"] = user_id
        
        super().__init__(
            message=message,
            error_code="AUTHORIZATION_ERROR",
            details=error_details
        )


class AuthenticationError(SynapseHubException):
    """Raised when authentication fails."""
    
    def __init__(
        self,
        message: str = "Authentication failed",
        auth_method: Optional[str] = None,
        details: Optional[Dict[str, Any]] = None
    ):
        self.auth_method = auth_method
        error_details = details or {}
        if auth_method:
            error_details["auth_method"] = auth_method
        
        super().__init__(
            message=message,
            error_code="AUTHENTICATION_ERROR",
            details=error_details
        )


class BusinessLogicError(SynapseHubException):
    """Raised when business logic rules are violated."""
    
    def __init__(
        self,
        message: str = "Business logic error",
        rule: Optional[str] = None,
        details: Optional[Dict[str, Any]] = None
    ):
        self.rule = rule
        error_details = details or {}
        if rule:
            error_details["rule"] = rule
        
        super().__init__(
            message=message,
            error_code="BUSINESS_LOGIC_ERROR",
            details=error_details
        )


class ExternalServiceError(SynapseHubException):
    """Raised when external service integration fails."""
    
    def __init__(
        self,
        message: str = "External service error",
        service: Optional[str] = None,
        status_code: Optional[int] = None,
        details: Optional[Dict[str, Any]] = None
    ):
        self.service = service
        self.status_code = status_code
        error_details = details or {}
        if service:
            error_details["service"] = service
        if status_code:
            error_details["status_code"] = status_code
        
        super().__init__(
            message=message,
            error_code="EXTERNAL_SERVICE_ERROR",
            details=error_details
        )


class AIServiceError(ExternalServiceError):
    """Raised when AI service integration fails."""
    
    def __init__(
        self,
        message: str = "AI service error",
        provider: Optional[str] = None,
        model: Optional[str] = None,
        details: Optional[Dict[str, Any]] = None
    ):
        self.provider = provider
        self.model = model
        error_details = details or {}
        if provider:
            error_details["provider"] = provider
        if model:
            error_details["model"] = model
        
        super().__init__(
            message=message,
            service=f"ai_{provider}" if provider else "ai",
            details=error_details
        )


class CursorConnectorError(ExternalServiceError):
    """Raised when Cursor Connector integration fails."""
    
    def __init__(
        self,
        message: str = "Cursor Connector error",
        connector_id: Optional[str] = None,
        operation: Optional[str] = None,
        details: Optional[Dict[str, Any]] = None
    ):
        self.connector_id = connector_id
        self.operation = operation
        error_details = details or {}
        if connector_id:
            error_details["connector_id"] = connector_id
        if operation:
            error_details["operation"] = operation
        
        super().__init__(
            message=message,
            service="cursor_connector",
            details=error_details
        )


class DatabaseError(SynapseHubException):
    """Raised when database operations fail."""
    
    def __init__(
        self,
        message: str = "Database error",
        operation: Optional[str] = None,
        table: Optional[str] = None,
        details: Optional[Dict[str, Any]] = None
    ):
        self.operation = operation
        self.table = table
        error_details = details or {}
        if operation:
            error_details["operation"] = operation
        if table:
            error_details["table"] = table
        
        super().__init__(
            message=message,
            error_code="DATABASE_ERROR",
            details=error_details
        )


class RateLimitError(SynapseHubException):
    """Raised when rate limits are exceeded."""
    
    def __init__(
        self,
        message: str = "Rate limit exceeded",
        limit: Optional[int] = None,
        window: Optional[int] = None,
        retry_after: Optional[int] = None,
        details: Optional[Dict[str, Any]] = None
    ):
        self.limit = limit
        self.window = window
        self.retry_after = retry_after
        error_details = details or {}
        if limit:
            error_details["limit"] = limit
        if window:
            error_details["window"] = window
        if retry_after:
            error_details["retry_after"] = retry_after
        
        super().__init__(
            message=message,
            error_code="RATE_LIMIT_EXCEEDED",
            details=error_details
        )


class ConfigurationError(SynapseHubException):
    """Raised when configuration is invalid or missing."""
    
    def __init__(
        self,
        message: str = "Configuration error",
        config_key: Optional[str] = None,
        details: Optional[Dict[str, Any]] = None
    ):
        self.config_key = config_key
        error_details = details or {}
        if config_key:
            error_details["config_key"] = config_key
        
        super().__init__(
            message=message,
            error_code="CONFIGURATION_ERROR",
            details=error_details
        )


# HTTP Exception mapping
def map_exception_to_http_exception(exc: SynapseHubException) -> HTTPException:
    """
    Map custom exceptions to FastAPI HTTPException with appropriate status codes.
    
    Args:
        exc: The custom exception to map
        
    Returns:
        HTTPException with appropriate status code and detail
    """
    
    # Create detail dictionary
    detail = {
        "message": exc.message,
        "error_code": exc.error_code,
        "details": exc.details
    }
    
    # Map to appropriate HTTP status codes
    if isinstance(exc, ValidationError):
        return HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=detail
        )
    elif isinstance(exc, NotFoundError):
        return HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=detail
        )
    elif isinstance(exc, DuplicateError):
        return HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=detail
        )
    elif isinstance(exc, AuthenticationError):
        return HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=detail
        )
    elif isinstance(exc, AuthorizationError):
        return HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=detail
        )
    elif isinstance(exc, BusinessLogicError):
        return HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=detail
        )
    elif isinstance(exc, RateLimitError):
        return HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=detail,
            headers={"Retry-After": str(exc.retry_after)} if exc.retry_after else None
        )
    elif isinstance(exc, ExternalServiceError):
        return HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=detail
        )
    elif isinstance(exc, DatabaseError):
        return HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=detail
        )
    elif isinstance(exc, ConfigurationError):
        return HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=detail
        )
    else:
        # Generic SynapseHubException
        return HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=detail
        )


# Error response schemas for OpenAPI documentation
class ErrorResponse:
    """Standard error response format."""
    
    def __init__(
        self,
        message: str,
        error_code: str,
        details: Optional[Dict[str, Any]] = None
    ):
        self.message = message
        self.error_code = error_code
        self.details = details or {}


# Common error responses for OpenAPI
COMMON_ERROR_RESPONSES = {
    400: {
        "description": "Validation Error",
        "content": {
            "application/json": {
                "example": {
                    "message": "Validation failed",
                    "error_code": "VALIDATION_ERROR",
                    "details": {
                        "field": "email",
                        "value": "invalid-email"
                    }
                }
            }
        }
    },
    401: {
        "description": "Authentication Error",
        "content": {
            "application/json": {
                "example": {
                    "message": "Authentication failed",
                    "error_code": "AUTHENTICATION_ERROR",
                    "details": {}
                }
            }
        }
    },
    403: {
        "description": "Authorization Error",
        "content": {
            "application/json": {
                "example": {
                    "message": "Insufficient permissions",
                    "error_code": "AUTHORIZATION_ERROR",
                    "details": {
                        "required_permission": "tasks:create"
                    }
                }
            }
        }
    },
    404: {
        "description": "Not Found",
        "content": {
            "application/json": {
                "example": {
                    "message": "Resource not found",
                    "error_code": "NOT_FOUND",
                    "details": {
                        "resource_type": "task",
                        "resource_id": "123e4567-e89b-12d3-a456-426614174000"
                    }
                }
            }
        }
    },
    409: {
        "description": "Conflict",
        "content": {
            "application/json": {
                "example": {
                    "message": "Resource already exists",
                    "error_code": "DUPLICATE_RESOURCE",
                    "details": {
                        "conflicting_field": "email"
                    }
                }
            }
        }
    },
    422: {
        "description": "Business Logic Error",
        "content": {
            "application/json": {
                "example": {
                    "message": "Business rule violation",
                    "error_code": "BUSINESS_LOGIC_ERROR",
                    "details": {
                        "rule": "task_status_transition"
                    }
                }
            }
        }
    },
    429: {
        "description": "Rate Limit Exceeded",
        "content": {
            "application/json": {
                "example": {
                    "message": "Rate limit exceeded",
                    "error_code": "RATE_LIMIT_EXCEEDED",
                    "details": {
                        "limit": 100,
                        "window": 60,
                        "retry_after": 30
                    }
                }
            }
        }
    },
    500: {
        "description": "Internal Server Error",
        "content": {
            "application/json": {
                "example": {
                    "message": "Internal server error",
                    "error_code": "INTERNAL_ERROR",
                    "details": {}
                }
            }
        }
    },
    502: {
        "description": "External Service Error",
        "content": {
            "application/json": {
                "example": {
                    "message": "External service unavailable",
                    "error_code": "EXTERNAL_SERVICE_ERROR",
                    "details": {
                        "service": "gemini_api",
                        "status_code": 503
                    }
                }
            }
        }
    }
} 