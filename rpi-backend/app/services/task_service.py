"""
Task service for Synapse-Hub AI orchestration system.

Provides comprehensive business logic for task management, AI workflow
coordination, state transitions, and SSH context handling.
"""

from typing import List, Optional, Dict, Any
from datetime import datetime, timezone
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload
from sqlalchemy import func, desc, asc, and_, or_
import logging

from app.core.exceptions import (
    ValidationError,
    NotFoundError,
    BusinessLogicError,
    DuplicateError
)
from app.models.tasks import (
    Task, TaskStatus, TaskTurn, TaskPriority,
    TaskCreate, TaskUpdate, TaskFilter
)
from app.models.messages import Message

logger = logging.getLogger(__name__)


class TaskService:
    """
    Service class for Task operations within AI orchestration system.
    
    Features:
    - Complete CRUD operations with validation
    - AI workflow state management and coordination
    - Task status transitions with business rules
    - Turn-based communication between AI agents
    - SSH context management for remote development
    - Comprehensive filtering, pagination, and sorting
    - Audit trail and user tracking
    """
    
    def __init__(self, db_session: AsyncSession):
        self.db = db_session
    
    async def create_task(
        self,
        task_data: TaskCreate,
        current_user_id: Optional[str] = None
    ) -> Task:
        """
        Create a new task with validation and initialization.
        
        Args:
            task_data: Validated task creation data
            current_user_id: ID of the user creating the task
            
        Returns:
            Created task instance
            
        Raises:
            ValidationError: If data validation fails
            DuplicateError: If task with same title exists for user
        """
        try:
            # Check for duplicate task title for user
            if current_user_id:
                existing = await self._get_task_by_title_and_user(
                    task_data.title, current_user_id
                )
                if existing:
                    raise DuplicateError(
                        f"Task with title '{task_data.title}' already exists",
                        resource_type="task",
                        conflicting_field="title"
                    )
            
            # Create new task instance
            db_task = Task(
                title=task_data.title,
                description=task_data.description,
                priority=task_data.priority,
                project_path=task_data.project_path,
                ssh_host=task_data.ssh_host,
                ssh_user=task_data.ssh_user,
                estimated_duration=task_data.estimated_duration,
                max_retries=task_data.max_retries,
                created_by=current_user_id
            )
            
            # Set AI contexts if provided
            if task_data.ai_contexts:
                db_task.set_ai_contexts(task_data.ai_contexts)
            
            self.db.add(db_task)
            await self.db.commit()
            await self.db.refresh(db_task)
            
            logger.info(f"Created task '{task_data.title}' with ID {db_task.id}")
            return db_task
            
        except Exception as e:
            await self.db.rollback()
            logger.error(f"Error creating task: {str(e)}")
            if isinstance(e, (ValidationError, DuplicateError)):
                raise
            raise ValidationError(f"Failed to create task: {str(e)}")
    
    async def get_task_by_id(
        self,
        task_id: str,
        include_messages: bool = True
    ) -> Optional[Task]:
        """
        Retrieve task by ID with optional message loading.
        
        Args:
            task_id: Unique identifier for the task
            include_messages: Whether to load associated messages
            
        Returns:
            Task instance or None if not found
        """
        try:
            query = select(Task).where(Task.id == task_id)
            
            if include_messages:
                query = query.options(selectinload(Task.messages))
            
            result = await self.db.execute(query)
            return result.scalar_one_or_none()
            
        except Exception as e:
            logger.error(f"Error retrieving task {task_id}: {str(e)}")
            return None
    
    async def update_task(
        self,
        task_id: str,
        task_data: TaskUpdate,
        current_user_id: Optional[str] = None
    ) -> Task:
        """
        Update existing task with validation.
        
        Args:
            task_id: ID of task to update
            task_data: Validated update data
            current_user_id: ID of user performing update
            
        Returns:
            Updated task instance
            
        Raises:
            NotFoundError: If task doesn't exist
            ValidationError: If update data is invalid
            BusinessLogicError: If update violates business rules
        """
        try:
            # Retrieve existing task
            db_task = await self.get_task_by_id(task_id, include_messages=False)
            if not db_task:
                raise NotFoundError(f"Task with ID {task_id} not found")
            
            # Validate status transition if status is being updated
            if task_data.status and task_data.status != db_task.status:
                if not self._is_valid_status_transition(db_task.status, task_data.status):
                    raise BusinessLogicError(
                        f"Invalid status transition from {db_task.status.value} to {task_data.status.value}",
                        rule="task_status_transition"
                    )
            
            # Update fields
            update_fields = task_data.dict(exclude_unset=True)
            for field, value in update_fields.items():
                if field == "ai_contexts" and value:
                    db_task.set_ai_contexts(value)
                else:
                    setattr(db_task, field, value)
            
            # Update audit fields
            db_task.updated_by = current_user_id
            db_task.updated_at = datetime.now(timezone.utc)
            
            await self.db.commit()
            await self.db.refresh(db_task)
            
            logger.info(f"Updated task {task_id}")
            return db_task
            
        except Exception as e:
            await self.db.rollback()
            logger.error(f"Error updating task {task_id}: {str(e)}")
            if isinstance(e, (NotFoundError, ValidationError, BusinessLogicError)):
                raise
            raise ValidationError(f"Failed to update task: {str(e)}")
    
    async def delete_task(
        self,
        task_id: str,
        current_user_id: Optional[str] = None,
        soft_delete: bool = True
    ) -> bool:
        """
        Delete task (soft delete by default).
        
        Args:
            task_id: ID of task to delete
            current_user_id: ID of user performing deletion
            soft_delete: Whether to perform soft delete
            
        Returns:
            True if task was deleted successfully
            
        Raises:
            NotFoundError: If task doesn't exist
            BusinessLogicError: If task cannot be deleted
        """
        try:
            db_task = await self.get_task_by_id(task_id, include_messages=False)
            if not db_task:
                raise NotFoundError(f"Task with ID {task_id} not found")
            
            # Check if task can be deleted
            if db_task.status in [TaskStatus.PROCESSING_CURSOR, TaskStatus.PROCESSING_GEMINI]:
                raise BusinessLogicError(
                    "Cannot delete task while it's being processed",
                    rule="task_deletion_processing"
                )
            
            if soft_delete:
                db_task.soft_delete()
                db_task.updated_by = current_user_id
            else:
                await self.db.delete(db_task)
            
            await self.db.commit()
            
            logger.info(f"{'Soft deleted' if soft_delete else 'Deleted'} task {task_id}")
            return True
            
        except Exception as e:
            await self.db.rollback()
            logger.error(f"Error deleting task {task_id}: {str(e)}")
            if isinstance(e, (NotFoundError, BusinessLogicError)):
                raise
            raise ValidationError(f"Failed to delete task: {str(e)}")
    
    async def get_tasks(
        self,
        filters: Optional[TaskFilter] = None,
        skip: int = 0,
        limit: int = 50,
        sort_by: str = "created_at",
        sort_order: str = "desc",
        current_user_id: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Retrieve paginated list of tasks with filtering and sorting.
        
        Args:
            filters: Optional filtering criteria
            skip: Number of records to skip (pagination offset)
            limit: Maximum number of records to return
            sort_by: Field to sort by
            sort_order: Sort direction ("asc" or "desc")
            current_user_id: Optional user ID for filtering user's tasks
            
        Returns:
            Dictionary with tasks, total count, and pagination info
        """
        try:
            # Build base query
            query = select(Task).options(selectinload(Task.messages))
            count_query = select(func.count(Task.id))
            
            # Apply user filter if provided
            if current_user_id:
                user_condition = Task.created_by == current_user_id
                query = query.where(user_condition)
                count_query = count_query.where(user_condition)
            
            # Apply filters
            if filters:
                conditions = self._build_filter_conditions(filters)
                if conditions:
                    query = query.where(and_(*conditions))
                    count_query = count_query.where(and_(*conditions))
            
            # Apply sorting
            sort_column = getattr(Task, sort_by, Task.created_at)
            if sort_order.lower() == "asc":
                query = query.order_by(asc(sort_column))
            else:
                query = query.order_by(desc(sort_column))
            
            # Apply pagination
            query = query.offset(skip).limit(limit)
            
            # Execute queries
            tasks_result = await self.db.execute(query)
            count_result = await self.db.execute(count_query)
            
            tasks = tasks_result.scalars().all()
            total = count_result.scalar()
            
            return {
                "tasks": tasks,
                "total": total,
                "skip": skip,
                "limit": limit,
                "has_next": skip + limit < total,
                "has_prev": skip > 0
            }
            
        except Exception as e:
            logger.error(f"Error retrieving tasks: {str(e)}")
            raise ValidationError(f"Failed to retrieve tasks: {str(e)}")
    
    async def start_task(
        self,
        task_id: str,
        current_user_id: Optional[str] = None
    ) -> Task:
        """
        Start a pending task.
        
        Args:
            task_id: ID of task to start
            current_user_id: ID of user starting the task
            
        Returns:
            Updated task instance
        """
        try:
            db_task = await self.get_task_by_id(task_id, include_messages=False)
            if not db_task:
                raise NotFoundError(f"Task with ID {task_id} not found")
            
            if db_task.status != TaskStatus.PENDING:
                raise BusinessLogicError(
                    f"Cannot start task with status {db_task.status.value}",
                    rule="task_start_status"
                )
            
            db_task.start_task()
            db_task.updated_by = current_user_id
            
            await self.db.commit()
            await self.db.refresh(db_task)
            
            logger.info(f"Started task {task_id}")
            return db_task
            
        except Exception as e:
            await self.db.rollback()
            logger.error(f"Error starting task {task_id}: {str(e)}")
            if isinstance(e, (NotFoundError, BusinessLogicError)):
                raise
            raise ValidationError(f"Failed to start task: {str(e)}")
    
    async def complete_task(
        self,
        task_id: str,
        current_user_id: Optional[str] = None
    ) -> Task:
        """Complete a task."""
        try:
            db_task = await self.get_task_by_id(task_id, include_messages=False)
            if not db_task:
                raise NotFoundError(f"Task with ID {task_id} not found")
            
            db_task.complete_task()
            db_task.updated_by = current_user_id
            
            await self.db.commit()
            await self.db.refresh(db_task)
            
            logger.info(f"Completed task {task_id}")
            return db_task
            
        except Exception as e:
            await self.db.rollback()
            logger.error(f"Error completing task {task_id}: {str(e)}")
            raise ValidationError(f"Failed to complete task: {str(e)}")
    
    async def fail_task(
        self,
        task_id: str,
        error_message: str,
        current_user_id: Optional[str] = None
    ) -> Task:
        """Mark task as failed."""
        try:
            db_task = await self.get_task_by_id(task_id, include_messages=False)
            if not db_task:
                raise NotFoundError(f"Task with ID {task_id} not found")
            
            db_task.fail_task(error_message)
            db_task.updated_by = current_user_id
            
            await self.db.commit()
            await self.db.refresh(db_task)
            
            logger.warning(f"Failed task {task_id}: {error_message}")
            return db_task
            
        except Exception as e:
            await self.db.rollback()
            logger.error(f"Error failing task {task_id}: {str(e)}")
            raise ValidationError(f"Failed to fail task: {str(e)}")
    
    async def retry_task(
        self,
        task_id: str,
        current_user_id: Optional[str] = None
    ) -> Task:
        """Retry a failed task."""
        try:
            db_task = await self.get_task_by_id(task_id, include_messages=False)
            if not db_task:
                raise NotFoundError(f"Task with ID {task_id} not found")
            
            if not db_task.can_retry():
                raise BusinessLogicError(
                    "Task cannot be retried (max retries exceeded or not failed)",
                    rule="task_retry_limit"
                )
            
            db_task.retry_task()
            db_task.updated_by = current_user_id
            
            await self.db.commit()
            await self.db.refresh(db_task)
            
            logger.info(f"Retrying task {task_id} (attempt {db_task.retry_count})")
            return db_task
            
        except Exception as e:
            await self.db.rollback()
            logger.error(f"Error retrying task {task_id}: {str(e)}")
            if isinstance(e, (NotFoundError, BusinessLogicError)):
                raise
            raise ValidationError(f"Failed to retry task: {str(e)}")
    
    async def advance_task_turn(
        self,
        task_id: str,
        next_turn: TaskTurn,
        current_user_id: Optional[str] = None
    ) -> Task:
        """Advance task to next turn."""
        try:
            db_task = await self.get_task_by_id(task_id, include_messages=False)
            if not db_task:
                raise NotFoundError(f"Task with ID {task_id} not found")
            
            db_task.advance_turn(next_turn)
            db_task.updated_by = current_user_id
            
            await self.db.commit()
            await self.db.refresh(db_task)
            
            logger.info(f"Advanced task {task_id} to turn {next_turn.value}")
            return db_task
            
        except Exception as e:
            await self.db.rollback()
            logger.error(f"Error advancing task turn {task_id}: {str(e)}")
            if isinstance(e, (NotFoundError, BusinessLogicError)):
                raise
            raise ValidationError(f"Failed to advance task turn: {str(e)}")
    
    async def update_ai_context(
        self,
        task_id: str,
        agent: str,
        context: Dict[str, Any],
        current_user_id: Optional[str] = None
    ) -> Task:
        """Update AI context for specific agent."""
        try:
            db_task = await self.get_task_by_id(task_id, include_messages=False)
            if not db_task:
                raise NotFoundError(f"Task with ID {task_id} not found")
            
            db_task.update_ai_context(agent, context)
            db_task.updated_by = current_user_id
            
            await self.db.commit()
            await self.db.refresh(db_task)
            
            logger.info(f"Updated AI context for {agent} in task {task_id}")
            return db_task
            
        except Exception as e:
            await self.db.rollback()
            logger.error(f"Error updating AI context for task {task_id}: {str(e)}")
            raise ValidationError(f"Failed to update AI context: {str(e)}")
    
    async def _get_task_by_title_and_user(
        self,
        title: str,
        user_id: str
    ) -> Optional[Task]:
        """Get task by title and user for duplicate checking."""
        query = select(Task).where(
            and_(
                Task.title == title,
                Task.created_by == user_id,
                Task.is_deleted == False
            )
        )
        result = await self.db.execute(query)
        return result.scalar_one_or_none()
    
    def _is_valid_status_transition(
        self,
        current_status: TaskStatus,
        new_status: TaskStatus
    ) -> bool:
        """Validate task status transitions."""
        valid_transitions = {
            TaskStatus.PENDING: [
                TaskStatus.PROCESSING_CURSOR,
                TaskStatus.CANCELLED
            ],
            TaskStatus.PROCESSING_CURSOR: [
                TaskStatus.AWAITING_USER_GEMINI,
                TaskStatus.COMPLETED,
                TaskStatus.FAILED,
                TaskStatus.CANCELLED
            ],
            TaskStatus.AWAITING_USER_GEMINI: [
                TaskStatus.PROCESSING_GEMINI,
                TaskStatus.CANCELLED
            ],
            TaskStatus.PROCESSING_GEMINI: [
                TaskStatus.AWAITING_USER_CURSOR,
                TaskStatus.COMPLETED,
                TaskStatus.FAILED,
                TaskStatus.CANCELLED
            ],
            TaskStatus.AWAITING_USER_CURSOR: [
                TaskStatus.PROCESSING_CURSOR,
                TaskStatus.CANCELLED
            ],
            TaskStatus.COMPLETED: [],  # Terminal state
            TaskStatus.FAILED: [TaskStatus.PENDING],  # Can retry
            TaskStatus.CANCELLED: []  # Terminal state
        }
        
        return new_status in valid_transitions.get(current_status, [])
    
    def _build_filter_conditions(self, filters: TaskFilter) -> List[Any]:
        """Build SQLAlchemy filter conditions from TaskFilter."""
        conditions = []
        
        if filters.search_term:
            search_term = f"%{filters.search_term}%"
            conditions.append(
                or_(
                    Task.title.ilike(search_term),
                    Task.description.ilike(search_term)
                )
            )
        
        if filters.status:
            conditions.append(Task.status == filters.status)
        
        if filters.priority:
            conditions.append(Task.priority == filters.priority)
        
        if filters.current_turn:
            conditions.append(Task.current_turn == filters.current_turn)
        
        if filters.created_by:
            conditions.append(Task.created_by == filters.created_by)
        
        if filters.created_after:
            conditions.append(Task.created_at >= filters.created_after)
        
        if filters.created_before:
            conditions.append(Task.created_at <= filters.created_before)
        
        if filters.is_remote_ssh is not None:
            if filters.is_remote_ssh:
                conditions.append(
                    and_(
                        Task.ssh_host.isnot(None),
                        Task.ssh_user.isnot(None)
                    )
                )
            else:
                conditions.append(
                    or_(
                        Task.ssh_host.is_(None),
                        Task.ssh_user.is_(None)
                    )
                )
        
        # Exclude soft-deleted tasks by default
        conditions.append(Task.is_deleted == False)
        
        return conditions 