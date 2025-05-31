"""
Base model classes and mixins for Synapse-Hub backend.

Provides common functionality for all database models including
timestamps, soft delete, and base model patterns.
"""

import uuid
from datetime import datetime, timezone
from typing import Optional, Any, Dict
from sqlalchemy import Column, String, DateTime, Boolean, Text, func
from sqlalchemy.ext.declarative import declared_attr
from sqlalchemy.orm import declarative_base
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.types import TypeDecorator, CHAR

from app.core.database import Base


class GUID(TypeDecorator):
    """
    Platform-independent GUID type.
    
    Uses PostgreSQL's UUID type when available,
    otherwise uses CHAR(36) storing as stringified hex values.
    """
    impl = CHAR
    cache_ok = True
    
    def load_dialect_impl(self, dialect):
        if dialect.name == 'postgresql':
            return dialect.type_descriptor(UUID())
        else:
            return dialect.type_descriptor(CHAR(36))
    
    def process_bind_param(self, value, dialect):
        if value is None:
            return value
        elif dialect.name == 'postgresql':
            return str(value)
        else:
            if not isinstance(value, uuid.UUID):
                return str(uuid.UUID(value))
            else:
                return str(value)
    
    def process_result_value(self, value, dialect):
        if value is None:
            return value
        else:
            if not isinstance(value, uuid.UUID):
                return uuid.UUID(value)
            return value


class TimestampMixin:
    """Mixin to add timestamp fields to models."""
    
    @declared_attr
    def created_at(cls):
        return Column(
            DateTime(timezone=True),
            default=lambda: datetime.now(timezone.utc),
            nullable=False,
            index=True
        )
    
    @declared_attr
    def updated_at(cls):
        return Column(
            DateTime(timezone=True),
            default=lambda: datetime.now(timezone.utc),
            onupdate=lambda: datetime.now(timezone.utc),
            nullable=False,
            index=True
        )


class SoftDeleteMixin:
    """Mixin to add soft delete functionality to models."""
    
    @declared_attr
    def deleted_at(cls):
        return Column(
            DateTime(timezone=True),
            nullable=True,
            index=True
        )
    
    @declared_attr
    def is_deleted(cls):
        return Column(
            Boolean,
            default=False,
            nullable=False,
            index=True
        )
    
    def soft_delete(self):
        """Mark the record as deleted."""
        self.is_deleted = True
        self.deleted_at = datetime.now(timezone.utc)
    
    def restore(self):
        """Restore a soft-deleted record."""
        self.is_deleted = False
        self.deleted_at = None


class UserTrackingMixin:
    """Mixin to track user who created/updated records."""
    
    @declared_attr
    def created_by(cls):
        return Column(
            GUID(),
            nullable=True,
            index=True
        )
    
    @declared_attr 
    def updated_by(cls):
        return Column(
            GUID(),
            nullable=True,
            index=True
        )


class BaseModel(Base, TimestampMixin):
    """
    Base model class for all database models.
    
    Provides:
    - UUID primary key
    - Timestamp fields (created_at, updated_at)
    - Common utility methods
    """
    
    __abstract__ = True
    
    id = Column(
        GUID(),
        primary_key=True,
        default=uuid.uuid4,
        unique=True,
        nullable=False
    )
    
    def __repr__(self) -> str:
        """String representation of the model."""
        return f"<{self.__class__.__name__}(id={self.id})>"
    
    def to_dict(self, exclude: Optional[list] = None) -> Dict[str, Any]:
        """
        Convert model instance to dictionary.
        
        Args:
            exclude: List of field names to exclude
            
        Returns:
            Dictionary representation of the model
        """
        exclude = exclude or []
        result = {}
        
        for column in self.__table__.columns:
            if column.name not in exclude:
                value = getattr(self, column.name)
                
                # Handle datetime serialization
                if isinstance(value, datetime):
                    value = value.isoformat()
                # Handle UUID serialization
                elif isinstance(value, uuid.UUID):
                    value = str(value)
                
                result[column.name] = value
        
        return result
    
    @classmethod
    def from_dict(cls, data: Dict[str, Any]):
        """
        Create model instance from dictionary.
        
        Args:
            data: Dictionary with model data
            
        Returns:
            Model instance
        """
        # Filter data to only include model fields
        valid_columns = {column.name for column in cls.__table__.columns}
        filtered_data = {k: v for k, v in data.items() if k in valid_columns}
        
        return cls(**filtered_data)
    
    def update_from_dict(self, data: Dict[str, Any], exclude: Optional[list] = None):
        """
        Update model instance from dictionary.
        
        Args:
            data: Dictionary with updated data
            exclude: List of field names to exclude from update
        """
        exclude = exclude or ['id', 'created_at']
        valid_columns = {column.name for column in self.__table__.columns}
        
        for key, value in data.items():
            if key in valid_columns and key not in exclude:
                setattr(self, key, value)
        
        # Update the updated_at timestamp
        self.updated_at = datetime.now(timezone.utc)


class AuditModel(BaseModel, UserTrackingMixin, SoftDeleteMixin):
    """
    Enhanced base model with full audit trail.
    
    Provides:
    - UUID primary key
    - Timestamp fields
    - User tracking (created_by, updated_by)
    - Soft delete functionality
    """
    
    __abstract__ = True
    
    def delete(self, user_id: Optional[str] = None, soft: bool = True):
        """
        Delete the record.
        
        Args:
            user_id: ID of user performing the deletion
            soft: Whether to perform soft delete (True) or mark for hard delete (False)
        """
        if soft:
            self.soft_delete()
        else:
            # Mark for hard delete - actual deletion handled by service layer
            self.is_deleted = True
            self.deleted_at = datetime.now(timezone.utc)
        
        if user_id:
            self.updated_by = user_id
        
        self.updated_at = datetime.now(timezone.utc)


class MetadataModel(AuditModel):
    """
    Base model with metadata support.
    
    Adds a JSON metadata field for storing additional
    flexible data that doesn't warrant separate columns.
    """
    
    __abstract__ = True
    
    @declared_attr
    def metadata(cls):
        return Column(
            Text,  # Store as JSON string
            nullable=True,
            default="{}"
        )
    
    def get_metadata(self) -> Dict[str, Any]:
        """Get metadata as dictionary."""
        if not self.metadata:
            return {}
        
        try:
            import json
            return json.loads(self.metadata)
        except (json.JSONDecodeError, TypeError):
            return {}
    
    def set_metadata(self, data: Dict[str, Any]):
        """Set metadata from dictionary."""
        import json
        self.metadata = json.dumps(data, default=str)
    
    def update_metadata(self, data: Dict[str, Any]):
        """Update metadata by merging with existing data."""
        current = self.get_metadata()
        current.update(data)
        self.set_metadata(current)


# Export classes
__all__ = [
    "GUID",
    "TimestampMixin",
    "SoftDeleteMixin",
    "UserTrackingMixin",
    "BaseModel",
    "AuditModel",
    "MetadataModel",
] 