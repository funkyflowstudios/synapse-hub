"""
API package for Synapse-Hub backend.

Contains FastAPI routers for all API endpoints with proper
error handling, validation, and dependency injection.
"""

from .deps import get_db_session, get_current_user
from .tasks import router as tasks_router
from .messages import router as messages_router
from .connectors import router as connectors_router
from .websockets import router as websocket_router

__all__ = [
    "get_db_session",
    "get_current_user", 
    "tasks_router",
    "messages_router",
    "connectors_router",
    "websocket_router",
] 