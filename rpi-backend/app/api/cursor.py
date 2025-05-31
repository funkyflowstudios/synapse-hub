"""
Cursor Connector API endpoints for Synapse-Hub AI orchestration system.

Provides RESTful endpoints for Cursor IDE automation, command management,
SSH context handling, and real-time status monitoring.
"""

from typing import Optional, Dict, Any, List
from fastapi import APIRouter, HTTPException, Depends, BackgroundTasks, Query
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession
import asyncio
import structlog

from app.core.database import get_db_session
from app.core.exceptions import (
    ValidationError,
    BusinessLogicError,
    ExternalServiceError,
    NotFoundError
)
from app.services.cursor_service import (
    get_cursor_service, 
    CursorService, 
    CommandType, 
    SSHContext
)
from app.services.task_service import TaskService
from app.api.websockets import ConnectionManager
from app.schemas.cursor import (
    CursorCommandRequest,
    CursorCommandResponse,
    CursorStatusResponse,
    SSHContextRequest,
    SSHContextResponse,
    CursorHealthResponse,
    CommandStatusResponse
)

logger = structlog.get_logger(__name__)

router = APIRouter(prefix="/api/cursor", tags=["Cursor Connector"])


@router.post("/tasks/{task_id}/command", response_model=CursorCommandResponse)
async def send_cursor_command(
    task_id: str,
    request: CursorCommandRequest,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db_session),
    cursor_service: CursorService = Depends(get_cursor_service)
):
    """
    Send a command to Cursor Connector for a specific task.
    
    Args:
        task_id: Task identifier for context management
        request: Command request with type, content, and configuration
        background_tasks: FastAPI background tasks for async processing
        db: Database session
        cursor_service: Cursor service instance
        
    Returns:
        Command response with tracking information
        
    Raises:
        404: Task not found
        400: Invalid command or configuration
        503: Cursor service unavailable
    """
    try:
        # Validate task exists
        task_service = TaskService(db)
        task = await task_service.get_task_by_id(task_id, include_messages=False)
        if not task:
            raise HTTPException(status_code=404, detail=f"Task {task_id} not found")
        
        # Get SSH context if specified
        ssh_context = None
        if request.ssh_context_id:
            ssh_context = await cursor_service.get_ssh_context(request.ssh_context_id)
            if not ssh_context:
                raise HTTPException(
                    status_code=400, 
                    detail=f"SSH context {request.ssh_context_id} not found"
                )
        
        # Send command to Cursor
        command_id = await cursor_service.send_command(
            task_id=task_id,
            command_type=request.command_type,
            content=request.content,
            metadata=request.metadata,
            ssh_context=ssh_context,
            timeout_seconds=request.timeout_seconds
        )
        
        # Store command in database for persistence
        background_tasks.add_task(
            _store_cursor_command,
            db, task_id, command_id, request.command_type.value, request.content
        )
        
        return CursorCommandResponse(
            command_id=command_id,
            task_id=task_id,
            command_type=request.command_type,
            status="queued",
            message=f"Command {command_id} queued for execution",
            metadata={
                "queue_position": cursor_service.queue_size,
                "ssh_context_used": request.ssh_context_id is not None,
                "timeout_seconds": request.timeout_seconds
            }
        )
        
    except ValidationError as e:
        logger.warning(f"Validation error for task {task_id}: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))
    except BusinessLogicError as e:
        logger.warning(f"Business logic error for task {task_id}: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))
    except ExternalServiceError as e:
        logger.error(f"Cursor service error for task {task_id}: {str(e)}")
        raise HTTPException(status_code=503, detail=f"Cursor service unavailable: {str(e)}")
    except Exception as e:
        logger.error(f"Unexpected error in command endpoint: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")


@router.get("/commands/{command_id}/status", response_model=CommandStatusResponse)
async def get_command_status(
    command_id: str,
    cursor_service: CursorService = Depends(get_cursor_service)
):
    """
    Get status of a specific Cursor command.
    
    Args:
        command_id: Command identifier
        cursor_service: Cursor service instance
        
    Returns:
        Command status with execution details
        
    Raises:
        404: Command not found
    """
    try:
        command_status = await cursor_service.get_command_status(command_id)
        if not command_status:
            raise HTTPException(
                status_code=404, 
                detail=f"Command {command_id} not found"
            )
        
        return CommandStatusResponse(**command_status)
        
    except Exception as e:
        logger.error(f"Error getting command status: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")


@router.delete("/commands/{command_id}")
async def cancel_command(
    command_id: str,
    cursor_service: CursorService = Depends(get_cursor_service)
):
    """
    Cancel a queued or active Cursor command.
    
    Args:
        command_id: Command identifier
        cursor_service: Cursor service instance
        
    Returns:
        Cancellation confirmation
        
    Raises:
        404: Command not found
    """
    try:
        cancelled = await cursor_service.cancel_command(command_id)
        if not cancelled:
            raise HTTPException(
                status_code=404, 
                detail=f"Command {command_id} not found or cannot be cancelled"
            )
        
        return {
            "command_id": command_id,
            "cancelled": True,
            "message": f"Command {command_id} has been cancelled"
        }
        
    except Exception as e:
        logger.error(f"Error cancelling command: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")


@router.get("/status", response_model=CursorStatusResponse)
async def get_cursor_status(
    cursor_service: CursorService = Depends(get_cursor_service)
):
    """
    Get current Cursor Connector status and queue information.
    
    Args:
        cursor_service: Cursor service instance
        
    Returns:
        Cursor service status with queue and connection information
    """
    try:
        health_status = await cursor_service.get_health_status()
        return CursorStatusResponse(**health_status)
        
    except Exception as e:
        logger.error(f"Error getting Cursor status: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")


@router.post("/ssh-contexts", response_model=SSHContextResponse)
async def create_ssh_context(
    request: SSHContextRequest,
    cursor_service: CursorService = Depends(get_cursor_service)
):
    """
    Create or update SSH context for remote operations.
    
    Args:
        request: SSH context configuration
        cursor_service: Cursor service instance
        
    Returns:
        SSH context information
        
    Raises:
        400: Invalid SSH configuration
        503: SSH context disabled
    """
    try:
        ssh_context = await cursor_service.add_ssh_context(
            context_id=request.context_id,
            host=request.host,
            port=request.port,
            username=request.username,
            key_path=request.key_path,
            working_directory=request.working_directory,
            environment_vars=request.environment_vars
        )
        
        return SSHContextResponse(
            context_id=request.context_id,
            host=ssh_context.host,
            port=ssh_context.port,
            username=ssh_context.username,
            working_directory=ssh_context.working_directory,
            is_active=ssh_context.is_active,
            last_verified=ssh_context.last_verified,
            message=f"SSH context {request.context_id} created successfully"
        )
        
    except BusinessLogicError as e:
        logger.warning(f"SSH context creation error: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error creating SSH context: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")


@router.get("/ssh-contexts/{context_id}", response_model=SSHContextResponse)
async def get_ssh_context(
    context_id: str,
    cursor_service: CursorService = Depends(get_cursor_service)
):
    """
    Get SSH context information.
    
    Args:
        context_id: SSH context identifier
        cursor_service: Cursor service instance
        
    Returns:
        SSH context information
        
    Raises:
        404: SSH context not found
    """
    try:
        ssh_context = await cursor_service.get_ssh_context(context_id)
        if not ssh_context:
            raise HTTPException(
                status_code=404, 
                detail=f"SSH context {context_id} not found"
            )
        
        return SSHContextResponse(
            context_id=context_id,
            host=ssh_context.host,
            port=ssh_context.port,
            username=ssh_context.username,
            working_directory=ssh_context.working_directory,
            is_active=ssh_context.is_active,
            last_verified=ssh_context.last_verified,
            message=f"SSH context {context_id} retrieved successfully"
        )
        
    except Exception as e:
        logger.error(f"Error getting SSH context: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")


@router.post("/ssh-contexts/{context_id}/verify")
async def verify_ssh_context(
    context_id: str,
    cursor_service: CursorService = Depends(get_cursor_service)
):
    """
    Verify SSH context connectivity.
    
    Args:
        context_id: SSH context identifier
        cursor_service: Cursor service instance
        
    Returns:
        Verification result
        
    Raises:
        404: SSH context not found
    """
    try:
        ssh_context = await cursor_service.get_ssh_context(context_id)
        if not ssh_context:
            raise HTTPException(
                status_code=404, 
                detail=f"SSH context {context_id} not found"
            )
        
        verified = await cursor_service.verify_ssh_context(context_id)
        
        return {
            "context_id": context_id,
            "verified": verified,
            "message": f"SSH context {context_id} {'verified successfully' if verified else 'verification failed'}"
        }
        
    except Exception as e:
        logger.error(f"Error verifying SSH context: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")


@router.delete("/ssh-contexts/{context_id}")
async def delete_ssh_context(
    context_id: str,
    cursor_service: CursorService = Depends(get_cursor_service)
):
    """
    Delete SSH context.
    
    Args:
        context_id: SSH context identifier
        cursor_service: Cursor service instance
        
    Returns:
        Deletion confirmation
        
    Raises:
        404: SSH context not found
    """
    try:
        removed = await cursor_service.remove_ssh_context(context_id)
        if not removed:
            raise HTTPException(
                status_code=404, 
                detail=f"SSH context {context_id} not found"
            )
        
        return {
            "context_id": context_id,
            "deleted": True,
            "message": f"SSH context {context_id} deleted successfully"
        }
        
    except Exception as e:
        logger.error(f"Error deleting SSH context: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")


@router.get("/health", response_model=CursorHealthResponse)
async def health_check(
    cursor_service: CursorService = Depends(get_cursor_service)
):
    """
    Perform health check on Cursor service.
    
    Args:
        cursor_service: Cursor service instance
        
    Returns:
        Health status and service information
    """
    try:
        health_data = await cursor_service.get_health_status()
        return CursorHealthResponse(**health_data)
        
    except Exception as e:
        logger.error(f"Health check failed: {str(e)}")
        return CursorHealthResponse(
            status="unhealthy",
            is_connected=False,
            queue_size=0,
            active_commands=0,
            expired_commands=0,
            ssh_contexts=0,
            error=str(e)
        )


# WebSocket endpoint for real-time Cursor status updates
@router.websocket("/tasks/{task_id}/ws")
async def websocket_cursor_status(
    websocket,
    task_id: str,
    cursor_service: CursorService = Depends(get_cursor_service),
    ws_manager: ConnectionManager = Depends(lambda: ConnectionManager())
):
    """
    WebSocket endpoint for real-time Cursor status updates.
    
    Args:
        websocket: WebSocket connection
        task_id: Task identifier
        cursor_service: Cursor service instance
        ws_manager: WebSocket manager
    """
    connection_id = f"cursor_task_{task_id}"
    await ws_manager.connect(websocket, connection_id)
    
    try:
        while True:
            # Receive command from client
            data = await websocket.receive_json()
            command_type = data.get("command_type", "status")
            
            if command_type == "status":
                # Send current status
                status = await cursor_service.get_health_status()
                await ws_manager.send_personal_message({
                    "type": "status_update",
                    "task_id": task_id,
                    "status": status
                }, connection_id)
                
            elif command_type == "command":
                # Send command and track status
                try:
                    command_id = await cursor_service.send_command(
                        task_id=task_id,
                        command_type=CommandType(data.get("type", "prompt")),
                        content=data.get("content", ""),
                        metadata=data.get("metadata", {})
                    )
                    
                    await ws_manager.send_personal_message({
                        "type": "command_queued",
                        "task_id": task_id,
                        "command_id": command_id,
                        "message": "Command queued for execution"
                    }, connection_id)
                    
                    # Monitor command status
                    while True:
                        command_status = await cursor_service.get_command_status(command_id)
                        if not command_status:
                            break
                            
                        await ws_manager.send_personal_message({
                            "type": "command_status",
                            "task_id": task_id,
                            "command_id": command_id,
                            "status": command_status
                        }, connection_id)
                        
                        # Break if command is completed
                        if command_status["status"] in ["completed", "failed", "cancelled", "timeout"]:
                            break
                            
                        await asyncio.sleep(1.0)  # Check every second
                        
                except Exception as cmd_error:
                    await ws_manager.send_personal_message({
                        "type": "error",
                        "message": f"Command error: {str(cmd_error)}"
                    }, connection_id)
            
            else:
                await ws_manager.send_personal_message({
                    "type": "error",
                    "message": f"Unknown command type: {command_type}"
                }, connection_id)
    
    except Exception as e:
        logger.error(f"WebSocket error for task {task_id}: {str(e)}")
    finally:
        ws_manager.disconnect(connection_id)


async def _store_cursor_command(
    db: AsyncSession,
    task_id: str,
    command_id: str,
    command_type: str,
    content: str
):
    """
    Store Cursor command in the database as a message.
    
    Args:
        db: Database session
        task_id: Task identifier
        command_id: Command identifier
        command_type: Type of command
        content: Command content
    """
    try:
        from app.services.message_service import MessageService
        from app.schemas.messages import MessageCreate
        
        message_service = MessageService(db)
        
        # Store command as message
        await message_service.create_message(
            MessageCreate(
                task_id=task_id,
                sender="cursor",
                content=content,
                message_type="command",
                metadata={
                    "command_id": command_id,
                    "command_type": command_type,
                    "source": "cursor_api"
                }
            )
        )
        
        logger.info(f"Stored Cursor command {command_id} for task {task_id}")
        
    except Exception as e:
        logger.error(f"Error storing Cursor command: {str(e)}") 