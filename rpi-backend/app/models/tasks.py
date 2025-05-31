"""
Task models for Synapse-Hub AI orchestration system.

Defines the Task model and related enums that manage the AI workflow
state and coordination between different AI agents.
"""

import enum
import json
from datetime import datetime, timezone
from typing import Optional, Dict, Any, List
from sqlalchemy import Column, String, Text, Integer, Boolean, Enum, ForeignKey, DateTime
from sqlalchemy.orm import relationship, validates
from pydantic import BaseModel as PydanticModel, Field, validator

from app.models.base import AuditModel, GUID


class TaskStatus(enum.Enum):
    """Task status enumeration."""
    PENDING = "pending"
    PROCESSING_CURSOR = "processing_cursor"
    AWAITING_USER_GEMINI = "awaiting_user_gemini"
    PROCESSING_GEMINI = "processing_gemini"
    AWAITING_USER_CURSOR = "awaiting_user_cursor"
    COMPLETED = "completed"
    FAILED = "failed"
    CANCELLED = "cancelled"


class TaskTurn(enum.Enum):
    """Current turn in the AI conversation."""
    USER = "user"
    CURSOR = "cursor"
    GEMINI = "gemini"
    SYSTEM = "system"


class TaskPriority(enum.Enum):
    """Task priority levels."""
    LOW = "low"
    NORMAL = "normal"
    HIGH = "high"
    URGENT = "urgent"


class Task(AuditModel):
    """
    Task model for AI orchestration workflows.
    
    Represents a complete AI task that can involve multiple agents
    (Cursor, Gemini) with state management and turn coordination.
    """
    
    __tablename__ = "tasks"
    
    # Basic task information
    title = Column(String(255), nullable=False, index=True)
    description = Column(Text, nullable=True)
    
    # Task state management
    status = Column(
        Enum(TaskStatus),
        nullable=False,
        default=TaskStatus.PENDING,
        index=True
    )
    
    current_turn = Column(
        Enum(TaskTurn),
        nullable=False,
        default=TaskTurn.USER,
        index=True
    )
    
    priority = Column(
        Enum(TaskPriority),
        nullable=False,
        default=TaskPriority.NORMAL,
        index=True
    )
    
    # Progress tracking
    progress = Column(Integer, nullable=False, default=0)  # 0-100
    
    # AI contexts - stored as JSON
    ai_contexts = Column(Text, nullable=True, default="{}")
    
    # Project context (for Cursor Remote-SSH)
    project_path = Column(String(500), nullable=True)
    ssh_host = Column(String(255), nullable=True)
    ssh_user = Column(String(100), nullable=True)
    
    # Timing information
    started_at = Column(DateTime(timezone=True), nullable=True, index=True)
    completed_at = Column(DateTime(timezone=True), nullable=True, index=True)
    estimated_duration = Column(Integer, nullable=True)  # seconds
    actual_duration = Column(Integer, nullable=True)  # seconds
    
    # Error tracking
    error_message = Column(Text, nullable=True)
    retry_count = Column(Integer, nullable=False, default=0)
    max_retries = Column(Integer, nullable=False, default=3)
    
    # Relationships
    messages = relationship(
        "Message",
        back_populates="task",
        cascade="all, delete-orphan",
        order_by="Message.created_at"
    )
    
    def __repr__(self) -> str:
        return f"<Task(id={self.id}, title='{self.title}', status={self.status.value})>"
    
    @validates('progress')
    def validate_progress(self, key, progress):
        """Validate progress is between 0 and 100."""
        if progress < 0:
            return 0
        elif progress > 100:
            return 100
        return progress
    
    @validates('retry_count')
    def validate_retry_count(self, key, retry_count):
        """Validate retry count is not negative."""
        return max(0, retry_count)
    
    def get_ai_contexts(self) -> Dict[str, Any]:
        """Get AI contexts as dictionary."""
        if not self.ai_contexts:
            return {}
        
        try:
            return json.loads(self.ai_contexts)
        except (json.JSONDecodeError, TypeError):
            return {}
    
    def set_ai_contexts(self, contexts: Dict[str, Any]):
        """Set AI contexts from dictionary."""
        self.ai_contexts = json.dumps(contexts, default=str)
    
    def update_ai_context(self, agent: str, context: Dict[str, Any]):
        """Update context for a specific AI agent."""
        contexts = self.get_ai_contexts()
        contexts[agent] = context
        self.set_ai_contexts(contexts)
    
    def get_ai_context(self, agent: str) -> Dict[str, Any]:
        """Get context for a specific AI agent."""
        contexts = self.get_ai_contexts()
        return contexts.get(agent, {})
    
    def start_task(self):
        """Mark task as started."""
        if self.status == TaskStatus.PENDING:
            self.status = TaskStatus.PROCESSING_CURSOR
            self.started_at = datetime.now(timezone.utc)
            self.progress = 5
    
    def complete_task(self):
        """Mark task as completed."""
        self.status = TaskStatus.COMPLETED
        self.completed_at = datetime.now(timezone.utc)
        self.progress = 100
        
        # Calculate actual duration
        if self.started_at:
            duration = (self.completed_at - self.started_at).total_seconds()
            self.actual_duration = int(duration)
    
    def fail_task(self, error_message: str):
        """Mark task as failed with error message."""
        self.status = TaskStatus.FAILED
        self.error_message = error_message
        self.completed_at = datetime.now(timezone.utc)
        
        # Calculate actual duration
        if self.started_at:
            duration = (self.completed_at - self.started_at).total_seconds()
            self.actual_duration = int(duration)
    
    def cancel_task(self):
        """Cancel the task."""
        self.status = TaskStatus.CANCELLED
        self.completed_at = datetime.now(timezone.utc)
        
        # Calculate actual duration
        if self.started_at:
            duration = (self.completed_at - self.started_at).total_seconds()
            self.actual_duration = int(duration)
    
    def can_retry(self) -> bool:
        """Check if task can be retried."""
        return (
            self.status == TaskStatus.FAILED and
            self.retry_count < self.max_retries
        )
    
    def retry_task(self):
        """Retry a failed task."""
        if not self.can_retry():
            raise ValueError("Task cannot be retried")
        
        self.retry_count += 1
        self.status = TaskStatus.PENDING
        self.error_message = None
        self.completed_at = None
        self.current_turn = TaskTurn.USER
        
        # Reset progress but keep some to show it's a retry
        self.progress = min(10, self.progress)
    
    def advance_turn(self, next_turn: TaskTurn):
        """Advance to the next turn in the conversation."""
        valid_transitions = {
            TaskTurn.USER: [TaskTurn.CURSOR, TaskTurn.GEMINI, TaskTurn.SYSTEM],
            TaskTurn.CURSOR: [TaskTurn.USER, TaskTurn.GEMINI, TaskTurn.SYSTEM],
            TaskTurn.GEMINI: [TaskTurn.USER, TaskTurn.CURSOR, TaskTurn.SYSTEM],
            TaskTurn.SYSTEM: [TaskTurn.USER, TaskTurn.CURSOR, TaskTurn.GEMINI],
        }
        
        if next_turn not in valid_transitions[self.current_turn]:
            raise ValueError(f"Invalid turn transition from {self.current_turn} to {next_turn}")
        
        self.current_turn = next_turn
        
        # Update status based on turn
        if next_turn == TaskTurn.CURSOR:
            self.status = TaskStatus.PROCESSING_CURSOR
        elif next_turn == TaskTurn.GEMINI:
            self.status = TaskStatus.PROCESSING_GEMINI
        elif next_turn == TaskTurn.USER:
            if self.current_turn == TaskTurn.CURSOR:
                self.status = TaskStatus.AWAITING_USER_CURSOR
            else:
                self.status = TaskStatus.AWAITING_USER_GEMINI
    
    def is_remote_ssh_task(self) -> bool:
        """Check if this is a remote SSH task."""
        return bool(self.ssh_host and self.ssh_user)
    
    def get_ssh_connection_info(self) -> Optional[Dict[str, str]]:
        """Get SSH connection information."""
        if not self.is_remote_ssh_task():
            return None
        
        return {
            "host": self.ssh_host,
            "user": self.ssh_user,
            "project_path": self.project_path or "~"
        }


# Pydantic schemas for API validation
class TaskBase(PydanticModel):
    """Base task schema."""
    title: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = Field(None, max_length=2000)
    priority: TaskPriority = TaskPriority.NORMAL
    project_path: Optional[str] = Field(None, max_length=500)
    ssh_host: Optional[str] = Field(None, max_length=255)
    ssh_user: Optional[str] = Field(None, max_length=100)
    estimated_duration: Optional[int] = Field(None, gt=0, le=86400)  # Max 24 hours
    max_retries: int = Field(3, ge=0, le=10)


class TaskCreate(TaskBase):
    """Schema for task creation."""
    ai_contexts: Optional[Dict[str, Any]] = Field(default_factory=dict)
    
    @validator('ssh_host')
    def validate_ssh_fields(cls, v, values):
        """Validate SSH fields are provided together."""
        ssh_user = values.get('ssh_user')
        if bool(v) != bool(ssh_user):
            raise ValueError('ssh_host and ssh_user must be provided together')
        return v


class TaskUpdate(PydanticModel):
    """Schema for task updates."""
    title: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = Field(None, max_length=2000)
    priority: Optional[TaskPriority] = None
    status: Optional[TaskStatus] = None
    progress: Optional[int] = Field(None, ge=0, le=100)
    project_path: Optional[str] = Field(None, max_length=500)
    ssh_host: Optional[str] = Field(None, max_length=255)
    ssh_user: Optional[str] = Field(None, max_length=100)
    estimated_duration: Optional[int] = Field(None, gt=0, le=86400)
    ai_contexts: Optional[Dict[str, Any]] = None
    
    @validator('ssh_host')
    def validate_ssh_fields(cls, v, values):
        """Validate SSH fields are provided together."""
        ssh_user = values.get('ssh_user')
        if v is not None and ssh_user is not None:
            if bool(v) != bool(ssh_user):
                raise ValueError('ssh_host and ssh_user must be provided together')
        return v


class TaskResponse(PydanticModel):
    """Schema for task API responses."""
    id: str  # Will be populated from task_id
    title: str
    description: Optional[str]
    status: TaskStatus
    current_turn: TaskTurn
    priority: TaskPriority
    progress: int
    project_path: Optional[str]
    ssh_host: Optional[str]
    ssh_user: Optional[str]
    started_at: Optional[datetime]
    completed_at: Optional[datetime]
    estimated_duration: Optional[int]
    actual_duration: Optional[int]
    error_message: Optional[str]
    retry_count: int
    max_retries: int
    created_at: datetime
    updated_at: datetime
    created_by: Optional[str]
    
    model_config = {"from_attributes": True}
    
    @classmethod
    def from_task(cls, task: "Task") -> "TaskResponse":
        """Create TaskResponse from Task model."""
        return cls(
            id=str(task.id),  # Convert UUID to string
            title=task.title,
            description=task.description,
            status=task.status,
            current_turn=task.current_turn,
            priority=task.priority,
            progress=task.progress,
            project_path=task.project_path,
            ssh_host=task.ssh_host,
            ssh_user=task.ssh_user,
            started_at=task.started_at,
            completed_at=task.completed_at,
            estimated_duration=task.estimated_duration,
            actual_duration=task.actual_duration,
            error_message=task.error_message,
            retry_count=task.retry_count,
            max_retries=task.max_retries,
            created_at=task.created_at,
            updated_at=task.updated_at,
            created_by=task.created_by,
        )


class TaskListResponse(PydanticModel):
    """Schema for task list API responses."""
    tasks: List[TaskResponse]
    total: int
    skip: int
    limit: int
    has_next: bool
    has_prev: bool


class TaskFilter(PydanticModel):
    """Schema for task filtering."""
    search_term: Optional[str] = None
    status: Optional[TaskStatus] = None
    priority: Optional[TaskPriority] = None
    current_turn: Optional[TaskTurn] = None
    created_by: Optional[str] = None
    created_after: Optional[datetime] = None
    created_before: Optional[datetime] = None
    is_remote_ssh: Optional[bool] = None


# Export classes
__all__ = [
    "TaskStatus",
    "TaskTurn", 
    "TaskPriority",
    "Task",
    "TaskBase",
    "TaskCreate",
    "TaskUpdate",
    "TaskResponse",
    "TaskListResponse",
    "TaskFilter",
] 