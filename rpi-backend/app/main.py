"""
Main FastAPI application for Synapse-Hub backend.

AI Orchestration System for Raspberry Pi deployment with:
- Task management and AI agent coordination
- Real-time WebSocket communication
- Gemini API and Cursor Connector integration
"""

import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import uvicorn

from app.core.config import get_settings
from app.core.database import init_database, close_database, health_check
from app.core.exceptions import SynapseHubException, map_exception_to_http_exception

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Application lifespan manager.
    
    Handles startup and shutdown events for the FastAPI application.
    """
    # Startup
    logger.info("Starting Synapse-Hub backend...")
    
    try:
        # Initialize database
        await init_database()
        logger.info("Database initialized successfully")
        
        # TODO: Initialize AI services
        # TODO: Initialize WebSocket manager
        # TODO: Start background tasks
        
        logger.info("Synapse-Hub backend started successfully")
        
    except Exception as e:
        logger.error(f"Failed to start application: {str(e)}")
        raise
    
    yield
    
    # Shutdown
    logger.info("Shutting down Synapse-Hub backend...")
    
    try:
        # Close database connections
        await close_database()
        logger.info("Database connections closed")
        
        # TODO: Cleanup AI services
        # TODO: Close WebSocket connections
        # TODO: Stop background tasks
        
        logger.info("Synapse-Hub backend shutdown complete")
        
    except Exception as e:
        logger.error(f"Error during shutdown: {str(e)}")


def create_app() -> FastAPI:
    """
    Create and configure the FastAPI application.
    
    Returns:
        FastAPI: Configured application instance
    """
    settings = get_settings()
    
    # Create FastAPI app
    app = FastAPI(
        title="Synapse-Hub Backend",
        description="AI Orchestration System for Raspberry Pi deployment",
        version=settings.version,
        debug=settings.debug,
        lifespan=lifespan,
        docs_url="/docs" if settings.debug else None,
        redoc_url="/redoc" if settings.debug else None,
    )
    
    # Add CORS middleware
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.allowed_origins,
        allow_credentials=True,
        allow_methods=settings.allowed_methods,
        allow_headers=settings.allowed_headers,
    )
    
    # Global exception handler
    @app.exception_handler(SynapseHubException)
    async def synapse_hub_exception_handler(request, exc: SynapseHubException):
        """Handle custom Synapse-Hub exceptions."""
        http_exc = map_exception_to_http_exception(exc)
        return JSONResponse(
            status_code=http_exc.status_code,
            content=http_exc.detail,
            headers=getattr(http_exc, 'headers', None)
        )
    
    @app.exception_handler(Exception)
    async def global_exception_handler(request, exc: Exception):
        """Handle unexpected exceptions."""
        logger.error(f"Unexpected error: {str(exc)}", exc_info=True)
        return JSONResponse(
            status_code=500,
            content={
                "message": "Internal server error",
                "error_code": "INTERNAL_ERROR",
                "details": {}
            }
        )
    
    # Health check endpoint
    @app.get("/health", tags=["health"])
    async def health_check_endpoint():
        """
        Health check endpoint for monitoring.
        
        Returns:
            dict: Health status information
        """
        try:
            # Check database health
            db_healthy = await health_check()
            
            # TODO: Check AI services health
            # TODO: Check WebSocket health
            # TODO: Check Cursor Connector health
            
            status = "healthy" if db_healthy else "unhealthy"
            
            return {
                "status": status,
                "version": settings.version,
                "environment": settings.environment,
                "services": {
                    "database": "healthy" if db_healthy else "unhealthy",
                    "ai_services": "not_implemented",
                    "websocket": "not_implemented",
                    "cursor_connector": "not_implemented"
                }
            }
            
        except Exception as e:
            logger.error(f"Health check failed: {str(e)}")
            raise HTTPException(status_code=503, detail="Service unavailable")
    
    # Root endpoint
    @app.get("/", tags=["root"])
    async def root():
        """
        Root endpoint with API information.
        
        Returns:
            dict: API information
        """
        return {
            "name": "Synapse-Hub Backend",
            "version": settings.version,
            "description": "AI Orchestration System for Raspberry Pi deployment",
            "docs_url": "/docs" if settings.debug else None,
            "health_url": "/health"
        }
    
    # Include API routers
    from app.api import tasks_router, messages_router, connectors_router, websocket_router
    
    app.include_router(tasks_router, prefix="/api/tasks", tags=["tasks"])
    app.include_router(messages_router, prefix="/api", tags=["messages"])  # Already has /tasks prefix
    app.include_router(connectors_router, prefix="/api/connectors", tags=["connectors"])
    app.include_router(websocket_router, tags=["websocket"])
    
    return app


# Create the application instance
app = create_app()


def main():
    """
    Main entry point for running the application.
    
    Used when running the application directly with python -m app.main
    """
    settings = get_settings()
    
    logger.info(f"Starting Synapse-Hub backend on {settings.host}:{settings.port}")
    logger.info(f"Environment: {settings.environment}")
    logger.info(f"Debug mode: {settings.debug}")
    
    uvicorn.run(
        "app.main:app",
        host=settings.host,
        port=settings.port,
        reload=settings.reload,
        workers=settings.workers if not settings.reload else 1,
        log_level=settings.log_level.lower(),
        access_log=True,
    )


if __name__ == "__main__":
    main() 