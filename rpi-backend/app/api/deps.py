"""
Dependency injection for FastAPI endpoints.

Provides database sessions, authentication, and other
common dependencies for API routes.
"""

from typing import Optional, AsyncGenerator
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db_session as get_db_session_dep
from app.core.exceptions import AuthenticationError

# HTTP Bearer token scheme for authentication
security = HTTPBearer(auto_error=False)


async def get_db_session() -> AsyncGenerator[AsyncSession, None]:
    """
    Database session dependency.
    
    Yields:
        AsyncSession: Database session for the request
    """
    async for session in get_db_session_dep():
        yield session


async def get_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security)
) -> Optional[str]:
    """
    Get current user from authorization token.
    
    For now, this is a placeholder that returns None.
    In a full implementation, this would:
    1. Validate the JWT token
    2. Extract user ID from the token
    3. Optionally fetch user from database
    
    Args:
        credentials: HTTP Bearer credentials
        
    Returns:
        User ID or None if not authenticated
        
    Raises:
        HTTPException: If token is invalid
    """
    if not credentials:
        return None
    
    # TODO: Implement actual JWT token validation
    # For now, we'll accept any token and extract a fake user ID
    token = credentials.credentials
    
    # Placeholder validation - replace with actual JWT validation
    if token.startswith("test_"):
        # Extract user ID from test token
        return token.replace("test_", "")
    
    # For development, allow anonymous access
    return None


async def require_authentication(
    current_user: Optional[str] = Depends(get_current_user)
) -> str:
    """
    Require authentication for protected endpoints.
    
    Args:
        current_user: Current user ID from get_current_user
        
    Returns:
        User ID if authenticated
        
    Raises:
        HTTPException: If user is not authenticated
    """
    if not current_user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return current_user


# Common dependency combinations
DatabaseDep = Depends(get_db_session)
UserDep = Depends(get_current_user)
AuthRequiredDep = Depends(require_authentication) 