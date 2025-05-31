"""
Message service for Synapse-Hub AI orchestration system.

Provides business logic for message management within tasks,
AI conversation tracking, and communication between agents.
"""

from typing import List, Optional, Dict, Any
from datetime import datetime, timezone
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload
from sqlalchemy import func, desc, asc, and_
import logging

from app.core.exceptions import (
    ValidationError,
    NotFoundError,
    BusinessLogicError
)
from app.models.messages import Message, MessageSender
from app.models.tasks import Task, TaskStatus, TaskTurn

logger = logging.getLogger(__name__)


class MessageService:
    """
    Service class for Message operations within AI orchestration tasks.
    
    Features:
    - Message creation and retrieval within task context
    - AI conversation history management
    - Turn-based communication coordination
    - Message validation and content filtering
    - Pagination support for message history
    """
    
    def __init__(self, db_session: AsyncSession):
        self.db = db_session
    
    async def create_message(
        self,
        task_id: str,
        message_data: Dict[str, Any],
        current_user_id: Optional[str] = None
    ) -> Message:
        """
        Create a new message within a task context.
        
        Args:
            task_id: ID of the task this message belongs to
            message_data: Validated message creation data
            current_user_id: ID of the user creating the message
            
        Returns:
            Created message instance
            
        Raises:
            NotFoundError: If task doesn't exist
            ValidationError: If data validation fails
            BusinessLogicError: If message violates workflow rules
        """
        try:
            # Verify task exists
            task = await self._get_task_by_id(task_id)
            if not task:
                raise NotFoundError(f"Task with ID {task_id} not found")
            
            # Validate message sender against current task turn
            sender = MessageSender(message_data["sender"])
            if not self._is_valid_message_sender(task, sender):
                raise BusinessLogicError(
                    f"Invalid sender {sender.value} for current task turn {task.current_turn.value}"
                )
            
            # Create new message instance
            db_message = Message(
                task_id=task_id,
                content=message_data["content"],
                sender=sender,
                related_file_name=message_data.get("related_file_name"),
                created_by=current_user_id
            )
            
            self.db.add(db_message)
            
            # Update task turn based on message sender
            await self._update_task_turn_after_message(task, sender)
            
            await self.db.commit()
            await self.db.refresh(db_message)
            
            logger.info(f"Created message in task {task_id} from {sender.value}")
            return db_message
            
        except Exception as e:
            await self.db.rollback()
            logger.error(f"Error creating message in task {task_id}: {str(e)}")
            if isinstance(e, (NotFoundError, ValidationError, BusinessLogicError)):
                raise
            raise ValidationError(f"Failed to create message: {str(e)}")
    
    async def get_message_by_id(self, message_id: str) -> Optional[Message]:
        """
        Retrieve message by ID.
        
        Args:
            message_id: Unique identifier for the message
            
        Returns:
            Message instance or None if not found
        """
        try:
            query = select(Message).where(Message.id == message_id)
            result = await self.db.execute(query)
            return result.scalar_one_or_none()
            
        except Exception as e:
            logger.error(f"Error retrieving message {message_id}: {str(e)}")
            return None
    
    async def get_task_messages(
        self,
        task_id: str,
        skip: int = 0,
        limit: int = 100,
        sender_filter: Optional[MessageSender] = None,
        sort_order: str = "asc"  # Default to chronological order
    ) -> Dict[str, Any]:
        """
        Retrieve paginated list of messages for a specific task.
        
        Args:
            task_id: ID of the task to get messages for
            skip: Number of records to skip (pagination offset)
            limit: Maximum number of records to return (max 100)
            sender_filter: Optional filter by message sender
            sort_order: Sort direction ("asc" for chronological, "desc" for reverse)
            
        Returns:
            Dictionary with messages, total count, and pagination info
        """
        try:
            # Verify task exists
            task = await self._get_task_by_id(task_id)
            if not task:
                raise NotFoundError(f"Task with ID {task_id} not found")
            
            # Build base query
            query = select(Message).where(Message.task_id == task_id)
            count_query = select(func.count(Message.id)).where(Message.task_id == task_id)
            
            # Apply sender filter
            if sender_filter:
                sender_condition = Message.sender == sender_filter
                query = query.where(sender_condition)
                count_query = count_query.where(sender_condition)
            
            # Apply sorting
            if sort_order.lower() == "desc":
                query = query.order_by(desc(Message.created_at))
            else:
                query = query.order_by(asc(Message.created_at))
            
            # Apply pagination
            query = query.offset(skip).limit(limit)
            
            # Execute queries
            messages_result = await self.db.execute(query)
            count_result = await self.db.execute(count_query)
            
            messages = messages_result.scalars().all()
            total = count_result.scalar()
            
            return {
                "messages": messages,
                "total": total,
                "skip": skip,
                "limit": limit,
                "has_next": skip + limit < total,
                "has_prev": skip > 0
            }
            
        except Exception as e:
            logger.error(f"Error retrieving messages for task {task_id}: {str(e)}")
            if isinstance(e, NotFoundError):
                raise
            raise ValidationError(f"Failed to retrieve messages: {str(e)}")
    
    async def get_conversation_history(
        self,
        task_id: str,
        include_system_messages: bool = True
    ) -> List[Message]:
        """
        Get complete conversation history for a task in chronological order.
        
        Args:
            task_id: ID of the task to get conversation for
            include_system_messages: Whether to include system messages
            
        Returns:
            List of messages in chronological order
        """
        try:
            query = select(Message).where(Message.task_id == task_id)
            
            if not include_system_messages:
                query = query.where(Message.sender != MessageSender.SYSTEM)
            
            query = query.order_by(asc(Message.created_at))
            
            result = await self.db.execute(query)
            return result.scalars().all()
            
        except Exception as e:
            logger.error(f"Error retrieving conversation history for task {task_id}: {str(e)}")
            raise ValidationError(f"Failed to retrieve conversation history: {str(e)}")
    
    async def relay_message_to_agent(
        self,
        task_id: str,
        target_agent: MessageSender,
        message_content: str,
        current_user_id: Optional[str] = None
    ) -> Message:
        """
        Relay a message to a specific AI agent.
        
        Args:
            task_id: ID of the task for the relay
            target_agent: Target AI agent (CURSOR or GEMINI)
            message_content: Content to relay
            current_user_id: ID of the user initiating the relay
            
        Returns:
            Created relay message
            
        Raises:
            BusinessLogicError: If relay is not valid for current task state
        """
        if target_agent not in [MessageSender.CURSOR, MessageSender.GEMINI]:
            raise ValidationError("Can only relay to CURSOR or GEMINI agents")
        
        # Create system message indicating relay
        relay_data = {
            "content": f"[RELAY TO {target_agent.value.upper()}] {message_content}",
            "sender": MessageSender.SYSTEM.value
        }
        
        return await self.create_message(task_id, relay_data, current_user_id)
    
    async def add_system_message(
        self,
        task_id: str,
        content: str,
        current_user_id: Optional[str] = None
    ) -> Message:
        """
        Add a system message to a task.
        
        Args:
            task_id: ID of the task
            content: System message content
            current_user_id: ID of the user (for audit trail)
            
        Returns:
            Created system message
        """
        system_data = {
            "content": content,
            "sender": MessageSender.SYSTEM.value
        }
        
        return await self.create_message(task_id, system_data, current_user_id)
    
    async def get_latest_message_by_sender(
        self,
        task_id: str,
        sender: MessageSender
    ) -> Optional[Message]:
        """
        Get the most recent message from a specific sender in a task.
        
        Args:
            task_id: ID of the task
            sender: Message sender to filter by
            
        Returns:
            Latest message from sender or None
        """
        try:
            query = select(Message).where(
                and_(
                    Message.task_id == task_id,
                    Message.sender == sender
                )
            ).order_by(desc(Message.created_at)).limit(1)
            
            result = await self.db.execute(query)
            return result.scalar_one_or_none()
            
        except Exception as e:
            logger.error(f"Error retrieving latest message from {sender.value} in task {task_id}: {str(e)}")
            return None
    
    async def _get_task_by_id(self, task_id: str) -> Optional[Task]:
        """Get task by ID for validation."""
        query = select(Task).where(Task.id == task_id)
        result = await self.db.execute(query)
        return result.scalar_one_or_none()
    
    def _is_valid_message_sender(self, task: Task, sender: MessageSender) -> bool:
        """
        Validate if the message sender is appropriate for the current task turn.
        
        Args:
            task: Task instance
            sender: Message sender
            
        Returns:
            True if sender is valid for current turn
        """
        # System messages are always allowed
        if sender == MessageSender.SYSTEM:
            return True
        
        # User messages are allowed in most states
        if sender == MessageSender.USER:
            return task.current_turn in [
                TaskTurn.USER,
                TaskTurn.CURSOR,  # User can interrupt
                TaskTurn.GEMINI   # User can interrupt
            ]
        
        # AI agent messages should match current turn
        if sender == MessageSender.CURSOR:
            return task.current_turn == TaskTurn.CURSOR
        
        if sender == MessageSender.GEMINI:
            return task.current_turn == TaskTurn.GEMINI
        
        return False
    
    async def _update_task_turn_after_message(self, task: Task, sender: MessageSender):
        """
        Update task turn based on the message sender.
        
        Args:
            task: Task instance to update
            sender: Message sender that determines next turn
        """
        if sender == MessageSender.USER:
            # User message typically starts with Cursor
            if task.current_turn == TaskTurn.USER:
                task.current_turn = TaskTurn.CURSOR
                task.status = TaskStatus.PROCESSING_CURSOR
        
        elif sender == MessageSender.CURSOR:
            # Cursor response typically goes to user for Gemini decision
            task.current_turn = TaskTurn.USER
            task.status = TaskStatus.AWAITING_USER_GEMINI
        
        elif sender == MessageSender.GEMINI:
            # Gemini response typically goes back to user for Cursor decision
            task.current_turn = TaskTurn.USER
            task.status = TaskStatus.AWAITING_USER_CURSOR
        
        # System messages don't change turn
        # Task will be updated in the calling transaction 