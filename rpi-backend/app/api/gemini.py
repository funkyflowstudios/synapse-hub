"""
Gemini API endpoints for Synapse-Hub AI orchestration system.

Provides RESTful endpoints for AI conversation management, task integration,
and real-time streaming capabilities.
"""

from typing import Optional, Dict, Any
from fastapi import APIRouter, HTTPException, Depends, BackgroundTasks
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession
import structlog

from app.core.database import get_db_session
from app.core.exceptions import (
    ValidationError,
    BusinessLogicError,
    ExternalServiceError,
    NotFoundError
)
from app.services.gemini_service import get_gemini_service, GeminiService
from app.services.task_service import TaskService
from app.api.websockets import ConnectionManager
from app.schemas.gemini import (
    GeminiMessageRequest,
    GeminiMessageResponse,
    GeminiStreamRequest,
    ConversationSummary,
    GeminiHealthResponse
)

logger = structlog.get_logger(__name__)

router = APIRouter(prefix="/api/gemini", tags=["Gemini AI"])


@router.post("/tasks/{task_id}/message", response_model=GeminiMessageResponse)
async def send_message_to_gemini(
    task_id: str,
    request: GeminiMessageRequest,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db_session),
    gemini_service: GeminiService = Depends(get_gemini_service)
):
    """
    Send a message to Gemini AI for a specific task.
    
    Args:
        task_id: Task identifier for context management
        request: Message request with content and configuration
        background_tasks: FastAPI background tasks for async processing
        db: Database session
        gemini_service: Gemini service instance
        
    Returns:
        Complete AI response with metadata
        
    Raises:
        404: Task not found
        400: Invalid message or configuration
        503: Gemini service unavailable
    """
    try:
        # Validate task exists
        task_service = TaskService(db)
        task = await task_service.get_task_by_id(task_id, include_messages=False)
        if not task:
            raise HTTPException(status_code=404, detail=f"Task {task_id} not found")
        
        # Send message to Gemini
        response_text = await gemini_service.send_message(
            task_id=task_id,
            message=request.message,
            role=request.role,
            stream=False,
            metadata=request.metadata
        )
        
        # Store message in database
        background_tasks.add_task(
            _store_ai_interaction,
            db, task_id, request.message, response_text, request.role
        )
        
        # Get conversation summary
        conversation_summary = await gemini_service.get_conversation_summary(task_id)
        
        return GeminiMessageResponse(
            task_id=task_id,
            user_message=request.message,
            ai_response=response_text,
            model=gemini_service.config.model.value,
            conversation_summary=conversation_summary,
            metadata={
                "response_length": len(response_text),
                "role": request.role,
                "streaming": False
            }
        )
        
    except ValidationError as e:
        logger.warning(f"Validation error for task {task_id}: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))
    except ExternalServiceError as e:
        logger.error(f"Gemini service error for task {task_id}: {str(e)}")
        raise HTTPException(status_code=503, detail=f"AI service unavailable: {str(e)}")
    except Exception as e:
        logger.error(f"Unexpected error in message endpoint: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")


@router.post("/tasks/{task_id}/stream")
async def stream_message_to_gemini(
    task_id: str,
    request: GeminiStreamRequest,
    db: AsyncSession = Depends(get_db_session),
    gemini_service: GeminiService = Depends(get_gemini_service)
):
    """
    Stream a message response from Gemini AI in real-time.
    
    Args:
        task_id: Task identifier for context management
        request: Streaming request with message and configuration
        db: Database session
        gemini_service: Gemini service instance
        
    Returns:
        Streaming response with real-time AI output
        
    Raises:
        404: Task not found
        400: Invalid message or configuration
        503: Gemini service unavailable
    """
    try:
        # Validate task exists
        task_service = TaskService(db)
        task = await task_service.get_task_by_id(task_id, include_messages=False)
        if not task:
            raise HTTPException(status_code=404, detail=f"Task {task_id} not found")
        
        # Get streaming response generator
        response_stream = await gemini_service.send_message(
            task_id=task_id,
            message=request.message,
            role=request.role,
            stream=True,
            metadata=request.metadata
        )
        
        # Create streaming response
        async def generate_stream():
            """Generate streaming response with proper formatting."""
            try:
                full_response = ""
                async for chunk in response_stream:
                    if chunk:
                        full_response += chunk
                        # Format as Server-Sent Events
                        yield f"data: {chunk}\n\n"
                
                # Send completion signal
                yield f"data: [DONE]\n\n"
                
                # Store complete interaction in background
                await _store_ai_interaction(
                    db, task_id, request.message, full_response, request.role
                )
                
            except Exception as e:
                logger.error(f"Error in streaming response: {str(e)}")
                yield f"data: [ERROR] {str(e)}\n\n"
        
        return StreamingResponse(
            generate_stream(),
            media_type="text/plain",
            headers={
                "Cache-Control": "no-cache",
                "Connection": "keep-alive",
                "X-Task-ID": task_id
            }
        )
        
    except ValidationError as e:
        logger.warning(f"Validation error for streaming task {task_id}: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))
    except ExternalServiceError as e:
        logger.error(f"Gemini streaming error for task {task_id}: {str(e)}")
        raise HTTPException(status_code=503, detail=f"AI service unavailable: {str(e)}")
    except Exception as e:
        logger.error(f"Unexpected error in streaming endpoint: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")


@router.get("/tasks/{task_id}/conversation", response_model=ConversationSummary)
async def get_conversation_summary(
    task_id: str,
    gemini_service: GeminiService = Depends(get_gemini_service)
):
    """
    Get conversation summary for a task.
    
    Args:
        task_id: Task identifier
        gemini_service: Gemini service instance
        
    Returns:
        Conversation summary with metadata
        
    Raises:
        404: Conversation not found
    """
    try:
        summary = await gemini_service.get_conversation_summary(task_id)
        if not summary:
            raise HTTPException(
                status_code=404, 
                detail=f"No conversation found for task {task_id}"
            )
        
        return ConversationSummary(**summary)
        
    except Exception as e:
        logger.error(f"Error getting conversation summary: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")


@router.delete("/tasks/{task_id}/conversation")
async def clear_conversation(
    task_id: str,
    gemini_service: GeminiService = Depends(get_gemini_service)
):
    """
    Clear conversation context for a task.
    
    Args:
        task_id: Task identifier
        gemini_service: Gemini service instance
        
    Returns:
        Success confirmation
    """
    try:
        cleared = await gemini_service.clear_conversation(task_id)
        return {
            "task_id": task_id,
            "cleared": cleared,
            "message": f"Conversation cleared for task {task_id}" if cleared 
                      else f"No conversation found for task {task_id}"
        }
        
    except Exception as e:
        logger.error(f"Error clearing conversation: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")


@router.post("/tasks/{task_id}/conversation")
async def create_conversation(
    task_id: str,
    system_prompt: Optional[str] = None,
    db: AsyncSession = Depends(get_db_session),
    gemini_service: GeminiService = Depends(get_gemini_service)
):
    """
    Create or reset conversation context for a task.
    
    Args:
        task_id: Task identifier
        system_prompt: Optional system prompt for conversation
        db: Database session
        gemini_service: Gemini service instance
        
    Returns:
        Conversation creation confirmation
        
    Raises:
        404: Task not found
    """
    try:
        # Validate task exists
        task_service = TaskService(db)
        task = await task_service.get_task_by_id(task_id, include_messages=False)
        if not task:
            raise HTTPException(status_code=404, detail=f"Task {task_id} not found")
        
        # Create conversation context
        context = await gemini_service.create_conversation(
            task_id=task_id,
            system_prompt=system_prompt
        )
        
        return {
            "task_id": task_id,
            "created": True,
            "system_prompt": bool(system_prompt),
            "message": f"Conversation created for task {task_id}"
        }
        
    except Exception as e:
        logger.error(f"Error creating conversation: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")


@router.get("/health", response_model=GeminiHealthResponse)
async def health_check(
    gemini_service: GeminiService = Depends(get_gemini_service)
):
    """
    Perform health check on Gemini service.
    
    Args:
        gemini_service: Gemini service instance
        
    Returns:
        Health status and service information
    """
    try:
        health_data = await gemini_service.health_check()
        return GeminiHealthResponse(**health_data)
        
    except Exception as e:
        logger.error(f"Health check failed: {str(e)}")
        return GeminiHealthResponse(
            status="unhealthy",
            error=str(e),
            model="unknown",
            active_conversations=0
        )


# WebSocket endpoint for real-time AI interaction
@router.websocket("/tasks/{task_id}/ws")
async def websocket_ai_interaction(
    websocket,
    task_id: str,
    db: AsyncSession = Depends(get_db_session),
    gemini_service: GeminiService = Depends(get_gemini_service),
    ws_manager: ConnectionManager = Depends(lambda: ConnectionManager())
):
    """
    WebSocket endpoint for real-time AI conversation.
    
    Args:
        websocket: WebSocket connection
        task_id: Task identifier
        db: Database session
        gemini_service: Gemini service instance
        ws_manager: WebSocket manager
    """
    connection_id = f"ai_task_{task_id}"
    await ws_manager.connect(websocket, connection_id)
    
    try:
        while True:
            # Receive message from client
            data = await websocket.receive_json()
            message = data.get("message", "")
            role = data.get("role", "user")
            stream = data.get("stream", True)
            
            if not message.strip():
                await ws_manager.send_personal_message({
                    "type": "error",
                    "message": "Empty message received"
                }, connection_id)
                continue
            
            try:
                if stream:
                    # Stream response
                    response_stream = await gemini_service.send_message(
                        task_id=task_id,
                        message=message,
                        role=role,
                        stream=True
                    )
                    
                    # Send stream start signal
                    await ws_manager.send_personal_message({
                        "type": "stream_start",
                        "task_id": task_id,
                        "user_message": message
                    }, connection_id)
                    
                    # Send streaming chunks
                    full_response = ""
                    async for chunk in response_stream:
                        if chunk:
                            full_response += chunk
                            await ws_manager.send_personal_message({
                                "type": "stream_chunk",
                                "content": chunk
                            }, connection_id)
                    
                    # Send stream end signal
                    await ws_manager.send_personal_message({
                        "type": "stream_end",
                        "full_response": full_response,
                        "response_length": len(full_response)
                    }, connection_id)
                    
                else:
                    # Complete response
                    response_text = await gemini_service.send_message(
                        task_id=task_id,
                        message=message,
                        role=role,
                        stream=False
                    )
                    
                    await ws_manager.send_personal_message({
                        "type": "complete_response",
                        "task_id": task_id,
                        "user_message": message,
                        "ai_response": response_text,
                        "response_length": len(response_text)
                    }, connection_id)
                
            except Exception as ai_error:
                logger.error(f"AI processing error: {str(ai_error)}")
                await ws_manager.send_personal_message({
                    "type": "error",
                    "message": f"AI processing failed: {str(ai_error)}"
                }, connection_id)
    
    except Exception as e:
        logger.error(f"WebSocket error for task {task_id}: {str(e)}")
    finally:
        ws_manager.disconnect(connection_id)


async def _store_ai_interaction(
    db: AsyncSession,
    task_id: str,
    user_message: str,
    ai_response: str,
    role: str = "user"
):
    """
    Store AI interaction in the database as messages.
    
    Args:
        db: Database session
        task_id: Task identifier
        user_message: User's message
        ai_response: AI's response
        role: Role of the user message sender
    """
    try:
        from app.services.message_service import MessageService
        from app.schemas.messages import MessageCreate
        
        message_service = MessageService(db)
        
        # Store user message
        await message_service.create_message(
            MessageCreate(
                task_id=task_id,
                sender="user",
                content=user_message,
                message_type="text",
                metadata={"role": role, "source": "gemini_api"}
            )
        )
        
        # Store AI response
        await message_service.create_message(
            MessageCreate(
                task_id=task_id,
                sender="gemini",
                content=ai_response,
                message_type="text",
                metadata={"model": "gemini", "source": "gemini_api"}
            )
        )
        
        logger.info(f"Stored AI interaction for task {task_id}")
        
    except Exception as e:
        logger.error(f"Error storing AI interaction: {str(e)}")
        # Don't raise - this is a background task 