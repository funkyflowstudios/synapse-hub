"""
Message models for Synapse-Hub AI orchestration system.

Handles conversation messages between users and AI agents.
"""

import enum
from datetime import datetime
from typing import Optional, List
from sqlalchemy import Column, String, Text, ForeignKey, Enum
from sqlalchemy.orm import relationship
from pydantic import BaseModel as PydanticModel, Field

from app.models.base import AuditModel, GUID


class MessageSender(enum.Enum):
    """Message sender types."""
    USER = "user"
    CURSOR = "cursor"
    GEMINI = "gemini"
    SYSTEM = "system"


class Message(AuditModel):
    """
    Message model for AI conversation tracking.
    
    Stores messages exchanged between users and AI agents
    within the context of a task.
    """
    
    __tablename__ = "messages"
    
    # Task relationship
    task_id = Column(GUID(), ForeignKey("tasks.id", ondelete="CASCADE"), nullable=False, index=True)
    
    # Message content
    content = Column(Text, nullable=False)
    sender = Column(Enum(MessageSender), nullable=False, index=True)
    
    # Optional file reference
    related_file_name = Column(String(255), nullable=True)
    
    # Relationships
    task = relationship("Task", back_populates="messages")
    
    def __repr__(self) -> str:
        return f"<Message(id={self.id}, task_id={self.task_id}, sender={self.sender.value})>"


# Placeholder models for future implementation
class MessageAttachment(AuditModel):
    """Placeholder for message attachments."""
    __tablename__ = "message_attachments"
    
    message_id = Column(GUID(), ForeignKey("messages.id", ondelete="CASCADE"), nullable=False)
    filename = Column(String(255), nullable=False)
    file_path = Column(String(500), nullable=False)


class MessageReaction(AuditModel):
    """Placeholder for message reactions."""
    __tablename__ = "message_reactions"
    
    message_id = Column(GUID(), ForeignKey("messages.id", ondelete="CASCADE"), nullable=False)
    reaction_type = Column(String(50), nullable=False)


# Pydantic schemas
class MessageCreate(PydanticModel):
    """Schema for message creation."""
    content: str = Field(..., min_length=1, max_length=10000)
    sender: MessageSender
    related_file_name: Optional[str] = Field(None, max_length=255)


class MessageResponse(PydanticModel):
    """Schema for message API responses."""
    id: str
    task_id: str
    content: str
    sender: MessageSender
    related_file_name: Optional[str]
    created_at: datetime
    created_by: Optional[str]
    
    class Config:
        from_attributes = True


# Export classes
__all__ = [
    "MessageSender",
    "Message",
    "MessageAttachment",
    "MessageReaction",
    "MessageCreate",
    "MessageResponse",
] 