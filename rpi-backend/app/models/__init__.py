"""
SQLAlchemy models for Synapse-Hub backend.

Contains all database model definitions adapted from the existing
Drizzle ORM schema with proper relationships and validation.
"""

from app.models.base import BaseModel, TimestampMixin, SoftDeleteMixin
from app.models.tasks import Task, TaskStatus, TaskTurn, TaskCreate, TaskUpdate
from app.models.messages import Message, MessageAttachment, MessageReaction
from app.models.connectors import Connector, ConnectorStatus, ConnectorLog, ConnectorMetric

__all__ = [
    "BaseModel",
    "TimestampMixin", 
    "SoftDeleteMixin",
    "Task",
    "TaskStatus",
    "TaskTurn",
    "TaskCreate",
    "TaskUpdate",
    "Message",
    "MessageAttachment",
    "MessageReaction",
    "Connector",
    "ConnectorStatus",
    "ConnectorLog",
    "ConnectorMetric",
] 