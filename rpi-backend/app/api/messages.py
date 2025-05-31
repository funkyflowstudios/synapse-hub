"""
Message API endpoints for Synapse-Hub backend.

Provides API for message management within tasks, conversation
history tracking, and AI agent relay functionality.
"""

from typing import List, Optional
from fastapi import APIRouter, Depends, Query, Path, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import DatabaseDep, UserDep
from app.services.message_service import MessageService
from app.models.messages import MessageCreate, MessageResponse, MessageSender
from app.core.exceptions import COMMON_ERROR_RESPONSES

# Create router
router = APIRouter()


async def get_message_service(db: AsyncSession = DatabaseDep) -> MessageService:
    """Get MessageService instance."""
    return MessageService(db)


@router.post(
    "/tasks/{task_id}/messages",
    response_model=MessageResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a message in a task",
    description="Add a new message to a task conversation",
    responses={
        201: {"description": "Message created successfully"},
        **{k: v for k, v in COMMON_ERROR_RESPONSES.items() if k in [400, 404, 422, 500]}
    }
)
async def create_message(
    task_id: str = Path(..., description="Task ID"),
    message_data: MessageCreate = ...,
    current_user: Optional[str] = UserDep,
    message_service: MessageService = Depends(get_message_service)
) -> MessageResponse:
    """
    Create a new message within a task.
    
    - **content**: Message content (required, 1-10000 characters)
    - **sender**: Message sender (user, cursor, gemini, system)
    - **related_file_name**: Optional filename reference (max 255 characters)
    
    **Business Rules:**
    - Message sender must be appropriate for current task turn
    - System messages are always allowed
    - User messages can interrupt AI processing
    """
    message_dict = message_data.dict()
    message = await message_service.create_message(task_id, message_dict, current_user)
    return MessageResponse.from_orm(message)


@router.get(
    "/tasks/{task_id}/messages",
    response_model=List[MessageResponse],
    summary="Get task messages",
    description="Retrieve paginated messages for a specific task",
    responses={
        200: {"description": "Messages retrieved successfully"},
        **{k: v for k, v in COMMON_ERROR_RESPONSES.items() if k in [404, 500]}
    }
)
async def get_task_messages(
    task_id: str = Path(..., description="Task ID"),
    skip: int = Query(0, ge=0, description="Number of messages to skip"),
    limit: int = Query(100, ge=1, le=100, description="Maximum number of messages"),
    sender_filter: Optional[MessageSender] = Query(None, description="Filter by message sender"),
    sort_order: str = Query("asc", regex="^(asc|desc)$", description="Sort order (asc=chronological)"),
    message_service: MessageService = Depends(get_message_service)
) -> List[MessageResponse]:
    """
    Retrieve messages for a specific task.
    
    **Pagination:**
    - Use `skip` and `limit` for pagination
    - Default sort is chronological (asc)
    
    **Filtering:**
    - Filter by sender type (user, cursor, gemini, system)
    """
    result = await message_service.get_task_messages(
        task_id=task_id,
        skip=skip,
        limit=limit,
        sender_filter=sender_filter,
        sort_order=sort_order
    )
    
    return [MessageResponse.from_orm(msg) for msg in result["messages"]]


@router.get(
    "/tasks/{task_id}/conversation",
    response_model=List[MessageResponse],
    summary="Get conversation history",
    description="Retrieve complete conversation history for a task",
    responses={
        200: {"description": "Conversation history retrieved successfully"},
        **{k: v for k, v in COMMON_ERROR_RESPONSES.items() if k in [404, 500]}
    }
)
async def get_conversation_history(
    task_id: str = Path(..., description="Task ID"),
    include_system: bool = Query(True, description="Include system messages"),
    message_service: MessageService = Depends(get_message_service)
) -> List[MessageResponse]:
    """
    Get complete conversation history for a task in chronological order.
    
    Returns all messages in the order they were created, which represents
    the complete conversation flow between user and AI agents.
    """
    messages = await message_service.get_conversation_history(
        task_id=task_id,
        include_system_messages=include_system
    )
    
    return [MessageResponse.from_orm(msg) for msg in messages]


@router.get(
    "/messages/{message_id}",
    response_model=MessageResponse,
    summary="Get message by ID",
    description="Retrieve a specific message by its ID",
    responses={
        200: {"description": "Message retrieved successfully"},
        **{k: v for k, v in COMMON_ERROR_RESPONSES.items() if k in [404, 500]}
    }
)
async def get_message(
    message_id: str = Path(..., description="Message ID"),
    message_service: MessageService = Depends(get_message_service)
) -> MessageResponse:
    """Retrieve a specific message by its ID."""
    message = await message_service.get_message_by_id(message_id)
    if not message:
        from app.core.exceptions import NotFoundError
        raise NotFoundError(f"Message with ID {message_id} not found")
    
    return MessageResponse.from_orm(message)


@router.post(
    "/tasks/{task_id}/relay",
    response_model=MessageResponse,
    summary="Relay message to AI agent",
    description="Relay a message to a specific AI agent (Cursor or Gemini)",
    responses={
        201: {"description": "Message relayed successfully"},
        **{k: v for k, v in COMMON_ERROR_RESPONSES.items() if k in [400, 404, 422, 500]}
    }
)
async def relay_message(
    task_id: str = Path(..., description="Task ID"),
    target_agent: MessageSender = Query(..., description="Target AI agent (cursor or gemini)"),
    content: str = Query(..., description="Content to relay"),
    current_user: Optional[str] = UserDep,
    message_service: MessageService = Depends(get_message_service)
) -> MessageResponse:
    """
    Relay a message to a specific AI agent.
    
    This creates a system message indicating that content should be
    sent to the specified AI agent (Cursor or Gemini).
    
    **Valid Target Agents:**
    - `cursor`: Relay to Cursor Connector
    - `gemini`: Relay to Gemini API
    """
    message = await message_service.relay_message_to_agent(
        task_id=task_id,
        target_agent=target_agent,
        message_content=content,
        current_user_id=current_user
    )
    
    return MessageResponse.from_orm(message)


@router.post(
    "/tasks/{task_id}/system-message",
    response_model=MessageResponse,
    summary="Add system message",
    description="Add a system message to a task",
    responses={
        201: {"description": "System message added successfully"},
        **{k: v for k, v in COMMON_ERROR_RESPONSES.items() if k in [404, 500]}
    }
)
async def add_system_message(
    task_id: str = Path(..., description="Task ID"),
    content: str = Query(..., description="System message content"),
    current_user: Optional[str] = UserDep,
    message_service: MessageService = Depends(get_message_service)
) -> MessageResponse:
    """
    Add a system message to a task.
    
    System messages are used for:
    - Status updates
    - Error notifications
    - Process logging
    - Relay notifications
    """
    message = await message_service.add_system_message(
        task_id=task_id,
        content=content,
        current_user_id=current_user
    )
    
    return MessageResponse.from_orm(message)


@router.get(
    "/tasks/{task_id}/latest/{sender}",
    response_model=Optional[MessageResponse],
    summary="Get latest message by sender",
    description="Get the most recent message from a specific sender in a task",
    responses={
        200: {"description": "Latest message retrieved (or null if none found)"},
        **{k: v for k, v in COMMON_ERROR_RESPONSES.items() if k in [404, 500]}
    }
)
async def get_latest_message_by_sender(
    task_id: str = Path(..., description="Task ID"),
    sender: MessageSender = Path(..., description="Message sender to filter by"),
    message_service: MessageService = Depends(get_message_service)
) -> Optional[MessageResponse]:
    """
    Get the most recent message from a specific sender in a task.
    
    Useful for:
    - Getting the latest user input
    - Checking the most recent AI response
    - Finding the last system update
    """
    message = await message_service.get_latest_message_by_sender(task_id, sender)
    
    if not message:
        return None
    
    return MessageResponse.from_orm(message) 