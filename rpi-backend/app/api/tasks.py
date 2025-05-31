"""
Task API endpoints for Synapse-Hub backend.

Provides RESTful API for task management with comprehensive
CRUD operations, filtering, pagination, and AI workflow coordination.
"""

from typing import List, Optional
from fastapi import APIRouter, Depends, Query, Path, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import DatabaseDep, UserDep
from app.services.task_service import TaskService
from app.models.tasks import (
    TaskCreate, TaskUpdate, TaskResponse, TaskListResponse,
    TaskFilter, TaskStatus, TaskPriority, TaskTurn
)
from app.core.exceptions import COMMON_ERROR_RESPONSES

# Create router
router = APIRouter()


async def get_task_service(db: AsyncSession = DatabaseDep) -> TaskService:
    """Get TaskService instance."""
    return TaskService(db)


@router.post(
    "/",
    response_model=TaskResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a new task",
    description="Create a new AI orchestration task with optional SSH context",
    responses={
        201: {"description": "Task created successfully"},
        **{k: v for k, v in COMMON_ERROR_RESPONSES.items() if k in [400, 409, 500]}
    }
)
async def create_task(
    task_data: TaskCreate,
    current_user: Optional[str] = UserDep,
    task_service: TaskService = Depends(get_task_service)
) -> TaskResponse:
    """
    Create a new AI orchestration task.
    
    - **title**: Task title (required, 1-255 characters)
    - **description**: Optional task description (max 2000 characters)
    - **priority**: Task priority (low, normal, high, urgent)
    - **project_path**: Optional project path for Cursor context
    - **ssh_host**: SSH host for remote development (requires ssh_user)
    - **ssh_user**: SSH user for remote development (requires ssh_host)
    - **estimated_duration**: Estimated duration in seconds (max 24 hours)
    - **max_retries**: Maximum retry attempts (0-10, default 3)
    - **ai_contexts**: Optional AI context data
    """
    task = await task_service.create_task(task_data, current_user)
    return TaskResponse.from_orm(task)


@router.get(
    "/",
    response_model=TaskListResponse,
    summary="List tasks",
    description="Retrieve paginated list of tasks with filtering and sorting",
    responses={
        200: {"description": "Tasks retrieved successfully"},
        **{k: v for k, v in COMMON_ERROR_RESPONSES.items() if k in [400, 500]}
    }
)
async def list_tasks(
    # Pagination
    skip: int = Query(0, ge=0, description="Number of tasks to skip"),
    limit: int = Query(50, ge=1, le=100, description="Maximum number of tasks to return"),
    
    # Sorting
    sort_by: str = Query("created_at", description="Field to sort by"),
    sort_order: str = Query("desc", regex="^(asc|desc)$", description="Sort direction"),
    
    # Filtering
    search_term: Optional[str] = Query(None, description="Search in title and description"),
    status: Optional[TaskStatus] = Query(None, description="Filter by task status"),
    priority: Optional[TaskPriority] = Query(None, description="Filter by task priority"),
    current_turn: Optional[TaskTurn] = Query(None, description="Filter by current turn"),
    is_remote_ssh: Optional[bool] = Query(None, description="Filter by SSH context presence"),
    
    # Dependencies
    current_user: Optional[str] = UserDep,
    task_service: TaskService = Depends(get_task_service)
) -> TaskListResponse:
    """
    Retrieve a paginated list of tasks with optional filtering.
    
    **Pagination:**
    - Use `skip` and `limit` parameters for pagination
    - Maximum limit is 100 tasks per request
    
    **Sorting:**
    - Sort by any task field (created_at, title, priority, etc.)
    - Use `asc` or `desc` for sort direction
    
    **Filtering:**
    - Search across title and description with `search_term`
    - Filter by status, priority, or current turn
    - Filter SSH tasks with `is_remote_ssh`
    """
    # Build filter object
    filters = TaskFilter(
        search_term=search_term,
        status=status,
        priority=priority,
        current_turn=current_turn,
        is_remote_ssh=is_remote_ssh,
        created_by=current_user  # Only show user's tasks if authenticated
    )
    
    # Get tasks
    result = await task_service.get_tasks(
        filters=filters,
        skip=skip,
        limit=limit,
        sort_by=sort_by,
        sort_order=sort_order,
        current_user_id=current_user
    )
    
    # Convert to response format
    task_responses = [TaskResponse.from_orm(task) for task in result["tasks"]]
    
    return TaskListResponse(
        tasks=task_responses,
        total=result["total"],
        skip=result["skip"],
        limit=result["limit"],
        has_next=result["has_next"],
        has_prev=result["has_prev"]
    )


@router.get(
    "/{task_id}",
    response_model=TaskResponse,
    summary="Get task by ID",
    description="Retrieve a specific task by its ID with full details",
    responses={
        200: {"description": "Task retrieved successfully"},
        **{k: v for k, v in COMMON_ERROR_RESPONSES.items() if k in [404, 500]}
    }
)
async def get_task(
    task_id: str = Path(..., description="Task ID"),
    task_service: TaskService = Depends(get_task_service)
) -> TaskResponse:
    """
    Retrieve a specific task by its ID.
    
    Returns the complete task details including:
    - Basic task information
    - Current status and turn
    - SSH context if applicable
    - Timing information
    - Error details if failed
    """
    task = await task_service.get_task_by_id(task_id)
    if not task:
        from app.core.exceptions import NotFoundError
        raise NotFoundError(f"Task with ID {task_id} not found")
    
    return TaskResponse.from_orm(task)


@router.put(
    "/{task_id}",
    response_model=TaskResponse,
    summary="Update task",
    description="Update an existing task with validation and business rules",
    responses={
        200: {"description": "Task updated successfully"},
        **{k: v for k, v in COMMON_ERROR_RESPONSES.items() if k in [400, 404, 422, 500]}
    }
)
async def update_task(
    task_id: str = Path(..., description="Task ID"),
    task_data: TaskUpdate = ...,
    current_user: Optional[str] = UserDep,
    task_service: TaskService = Depends(get_task_service)
) -> TaskResponse:
    """
    Update an existing task.
    
    **Business Rules:**
    - Status transitions must be valid (see status transition matrix)
    - Cannot modify completed or cancelled tasks
    - SSH fields must be provided together
    
    **Updatable Fields:**
    - title, description, priority
    - status (with validation)
    - progress (0-100)
    - SSH context (ssh_host, ssh_user, project_path)
    - AI contexts
    """
    task = await task_service.update_task(task_id, task_data, current_user)
    return TaskResponse.from_orm(task)


@router.delete(
    "/{task_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete task",
    description="Delete a task (soft delete by default)",
    responses={
        204: {"description": "Task deleted successfully"},
        **{k: v for k, v in COMMON_ERROR_RESPONSES.items() if k in [404, 422, 500]}
    }
)
async def delete_task(
    task_id: str = Path(..., description="Task ID"),
    soft_delete: bool = Query(True, description="Whether to perform soft delete"),
    current_user: Optional[str] = UserDep,
    task_service: TaskService = Depends(get_task_service)
):
    """
    Delete a task.
    
    **Soft Delete (default):**
    - Marks task as deleted but preserves data
    - Can be restored if needed
    
    **Hard Delete:**
    - Permanently removes task and all associated data
    - Cannot be undone
    
    **Business Rules:**
    - Cannot delete tasks currently being processed
    """
    await task_service.delete_task(task_id, current_user, soft_delete)
    return None


# Task Workflow Operations
@router.post(
    "/{task_id}/start",
    response_model=TaskResponse,
    summary="Start task",
    description="Start a pending task and begin AI processing",
    responses={
        200: {"description": "Task started successfully"},
        **{k: v for k, v in COMMON_ERROR_RESPONSES.items() if k in [404, 422, 500]}
    }
)
async def start_task(
    task_id: str = Path(..., description="Task ID"),
    current_user: Optional[str] = UserDep,
    task_service: TaskService = Depends(get_task_service)
) -> TaskResponse:
    """
    Start a pending task.
    
    This transitions the task from PENDING to PROCESSING_CURSOR
    and sets the started_at timestamp.
    """
    task = await task_service.start_task(task_id, current_user)
    return TaskResponse.from_orm(task)


@router.post(
    "/{task_id}/complete",
    response_model=TaskResponse,
    summary="Complete task",
    description="Mark a task as completed",
    responses={
        200: {"description": "Task completed successfully"},
        **{k: v for k, v in COMMON_ERROR_RESPONSES.items() if k in [404, 500]}
    }
)
async def complete_task(
    task_id: str = Path(..., description="Task ID"),
    current_user: Optional[str] = UserDep,
    task_service: TaskService = Depends(get_task_service)
) -> TaskResponse:
    """
    Mark a task as completed.
    
    Sets the completed_at timestamp and calculates actual duration.
    """
    task = await task_service.complete_task(task_id, current_user)
    return TaskResponse.from_orm(task)


@router.post(
    "/{task_id}/fail",
    response_model=TaskResponse,
    summary="Fail task",
    description="Mark a task as failed with error message",
    responses={
        200: {"description": "Task marked as failed"},
        **{k: v for k, v in COMMON_ERROR_RESPONSES.items() if k in [404, 500]}
    }
)
async def fail_task(
    task_id: str = Path(..., description="Task ID"),
    error_message: str = Query(..., description="Error message"),
    current_user: Optional[str] = UserDep,
    task_service: TaskService = Depends(get_task_service)
) -> TaskResponse:
    """
    Mark a task as failed.
    
    Records the error message and sets completion timestamp.
    """
    task = await task_service.fail_task(task_id, error_message, current_user)
    return TaskResponse.from_orm(task)


@router.post(
    "/{task_id}/retry",
    response_model=TaskResponse,
    summary="Retry task",
    description="Retry a failed task if retries are available",
    responses={
        200: {"description": "Task retry initiated"},
        **{k: v for k, v in COMMON_ERROR_RESPONSES.items() if k in [404, 422, 500]}
    }
)
async def retry_task(
    task_id: str = Path(..., description="Task ID"),
    current_user: Optional[str] = UserDep,
    task_service: TaskService = Depends(get_task_service)
) -> TaskResponse:
    """
    Retry a failed task.
    
    Only works if:
    - Task status is FAILED
    - Retry count is less than max_retries
    """
    task = await task_service.retry_task(task_id, current_user)
    return TaskResponse.from_orm(task) 