# SQLAlchemy Model Template for Synapse-Hub
#
# 🤖 AI IMPLEMENTATION BREADCRUMBS:
# Phase 2: Database model template with comprehensive patterns (Current)
# Future: Advanced relationship patterns and polymorphic models
# Future: Database performance optimization patterns
# Future: Advanced indexing and query optimization
#
# TEMPLATE USAGE:
# 1. Copy this file and rename to match your model (e.g., task_model.py)
# 2. Replace all PLACEHOLDER comments with actual values
# 3. Customize fields, relationships, and validation as needed

from typing import Optional, Dict, Any, List
from datetime import datetime, timezone
from uuid import uuid4
from sqlalchemy import (
    String, Text, Integer, Boolean, DateTime, ForeignKey, 
    UniqueConstraint, Index, CheckConstraint, Enum as SQLEnum,
    JSON, Numeric, event
)
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.dialects.sqlite import JSON as SQLiteJSON
from sqlalchemy.orm import Mapped, mapped_column, relationship, validates
from sqlalchemy.ext.hybrid import hybrid_property
from sqlalchemy.sql import func
import enum

from app.core.database import Base
from app.core.mixins import TimestampMixin, AuditMixin, SoftDeleteMixin

# PLACEHOLDER: Import related models
# from app.models.user import User
# from app.models.category import Category

# PLACEHOLDER: Define your enums
class ItemStatus(enum.Enum):  # PLACEHOLDER: Replace 'ItemStatus' with your enum name
    """Status enumeration for items."""
    DRAFT = "draft"
    ACTIVE = "active"
    INACTIVE = "inactive"
    ARCHIVED = "archived"
    # PLACEHOLDER: Add your status values

class ItemPriority(enum.Enum):  # PLACEHOLDER: Replace 'ItemPriority' with your enum name
    """Priority enumeration for items."""
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    URGENT = "urgent"
    # PLACEHOLDER: Add your priority values

# PLACEHOLDER: Add more enums as needed

class Item(Base, TimestampMixin, AuditMixin, SoftDeleteMixin):  # PLACEHOLDER: Replace 'Item' with your model name
    """
    Item model for managing application items.
    
    PLACEHOLDER: Update docstring with your model description
    
    Features:
    - UUID primary key for scalability
    - Comprehensive audit trail with timestamps
    - Soft delete functionality
    - JSON metadata storage
    - Optimized indexing
    - Data validation and constraints
    - Relationship management
    
    Relationships:
    - PLACEHOLDER: Document your model relationships
    
    Constraints:
    - PLACEHOLDER: Document your model constraints
    """
    
    __tablename__ = "items"  # PLACEHOLDER: Replace with your table name
    
    # Primary key - Always use UUID for scalability
    id: Mapped[str] = mapped_column(
        String(36),
        primary_key=True,
        default=lambda: str(uuid4()),
        comment="Unique identifier for the item"
    )
    
    # Core fields - PLACEHOLDER: Replace with your model fields
    name: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
        index=True,
        comment="Display name of the item"
    )
    
    description: Mapped[Optional[str]] = mapped_column(
        Text,
        nullable=True,
        comment="Detailed description of the item"
    )
    
    # Status and priority fields
    status: Mapped[ItemStatus] = mapped_column(
        SQLEnum(ItemStatus),
        nullable=False,
        default=ItemStatus.DRAFT,
        index=True,
        comment="Current status of the item"
    )
    
    priority: Mapped[ItemPriority] = mapped_column(
        SQLEnum(ItemPriority),
        nullable=False,
        default=ItemPriority.MEDIUM,
        index=True,
        comment="Priority level of the item"
    )
    
    # PLACEHOLDER: Add your model-specific fields
    # Example fields (remove/modify as needed):
    
    # Numeric fields
    order_index: Mapped[Optional[int]] = mapped_column(
        Integer,
        nullable=True,
        default=0,
        index=True,
        comment="Display order index"
    )
    
    # Boolean fields
    is_featured: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
        default=False,
        index=True,
        comment="Whether the item is featured"
    )
    
    is_public: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
        default=True,
        comment="Whether the item is publicly visible"
    )
    
    # JSON metadata field
    metadata: Mapped[Optional[Dict[str, Any]]] = mapped_column(
        JSON,  # Use JSONB for PostgreSQL in production
        nullable=True,
        comment="Additional metadata storage"
    )
    
    # Configuration JSON field
    config: Mapped[Optional[Dict[str, Any]]] = mapped_column(
        JSON,
        nullable=True,
        comment="Configuration settings"
    )
    
    # Date/time fields
    due_date: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
        index=True,
        comment="Due date for the item"
    )
    
    start_date: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
        comment="Start date for the item"
    )
    
    # Foreign key relationships - PLACEHOLDER: Replace with your relationships
    # owner_id: Mapped[Optional[str]] = mapped_column(
    #     String(36),
    #     ForeignKey("users.id", ondelete="SET NULL"),
    #     nullable=True,
    #     index=True,
    #     comment="ID of the user who owns this item"
    # )
    
    # category_id: Mapped[Optional[str]] = mapped_column(
    #     String(36),
    #     ForeignKey("categories.id", ondelete="SET NULL"),
    #     nullable=True,
    #     index=True,
    #     comment="ID of the category this item belongs to"
    # )
    
    # Relationships - PLACEHOLDER: Define your relationships
    # owner: Mapped[Optional["User"]] = relationship(
    #     "User",
    #     back_populates="items",
    #     lazy="select"
    # )
    
    # category: Mapped[Optional["Category"]] = relationship(
    #     "Category",
    #     back_populates="items",
    #     lazy="select"
    # )
    
    # One-to-many relationships
    # children: Mapped[List["Item"]] = relationship(
    #     "Item",
    #     back_populates="parent",
    #     cascade="all, delete-orphan",
    #     lazy="dynamic"
    # )
    
    # parent_id: Mapped[Optional[str]] = mapped_column(
    #     String(36),
    #     ForeignKey("items.id", ondelete="CASCADE"),
    #     nullable=True,
    #     index=True,
    #     comment="ID of the parent item"
    # )
    
    # parent: Mapped[Optional["Item"]] = relationship(
    #     "Item",
    #     back_populates="children",
    #     remote_side=[id],
    #     lazy="select"
    # )
    
    # Many-to-many relationships (using association tables)
    # tags: Mapped[List["Tag"]] = relationship(
    #     "Tag",
    #     secondary="item_tags",
    #     back_populates="items",
    #     lazy="dynamic"
    # )
    
    # Table constraints
    __table_args__ = (
        # Unique constraints
        UniqueConstraint('name', name='uq_item_name'),  # PLACEHOLDER: Adjust as needed
        
        # Check constraints
        CheckConstraint(
            'order_index >= 0',
            name='ck_item_order_index_positive'
        ),
        
        CheckConstraint(
            'start_date IS NULL OR due_date IS NULL OR start_date <= due_date',
            name='ck_item_dates_logical'
        ),
        
        # Indexes for performance
        Index('ix_item_status_priority', 'status', 'priority'),
        Index('ix_item_dates', 'start_date', 'due_date'),
        Index('ix_item_metadata_gin', 'metadata', postgresql_using='gin'),  # PostgreSQL only
        
        # PLACEHOLDER: Add your table constraints and indexes
        
        {
            'comment': 'Items table for managing application items'
        }
    )
    
    # Hybrid properties for computed fields
    @hybrid_property
    def is_overdue(self) -> bool:
        """Check if the item is overdue."""
        if not self.due_date:
            return False
        return datetime.now(timezone.utc) > self.due_date
    
    @hybrid_property
    def days_until_due(self) -> Optional[int]:
        """Calculate days until due date."""
        if not self.due_date:
            return None
        delta = self.due_date - datetime.now(timezone.utc)
        return delta.days
    
    @hybrid_property
    def display_name(self) -> str:
        """Get display name with fallback."""
        return self.name or f"Item #{self.id[:8]}"
    
    # PLACEHOLDER: Add your hybrid properties
    
    # Validation methods
    @validates('name')
    def validate_name(self, key, value):
        """Validate name field."""
        if not value or not value.strip():
            raise ValueError("Name cannot be empty")
        
        # Strip and limit length
        value = value.strip()
        if len(value) > 255:
            raise ValueError("Name cannot exceed 255 characters")
        
        return value
    
    @validates('order_index')
    def validate_order_index(self, key, value):
        """Validate order index."""
        if value is not None and value < 0:
            raise ValueError("Order index must be non-negative")
        return value
    
    @validates('metadata', 'config')
    def validate_json_fields(self, key, value):
        """Validate JSON fields."""
        if value is None:
            return value
        
        # Ensure it's a dictionary
        if not isinstance(value, dict):
            raise ValueError(f"{key} must be a dictionary")
        
        # Limit JSON size (adjust as needed)
        import json
        json_str = json.dumps(value)
        if len(json_str) > 10000:  # 10KB limit
            raise ValueError(f"{key} JSON size exceeds 10KB limit")
        
        return value
    
    # PLACEHOLDER: Add your validation methods
    
    # Instance methods
    def to_dict(self, include_relationships: bool = False) -> Dict[str, Any]:
        """Convert model instance to dictionary."""
        data = {
            'id': self.id,
            'name': self.name,
            'description': self.description,
            'status': self.status.value if self.status else None,
            'priority': self.priority.value if self.priority else None,
            'order_index': self.order_index,
            'is_featured': self.is_featured,
            'is_public': self.is_public,
            'metadata': self.metadata,
            'config': self.config,
            'due_date': self.due_date.isoformat() if self.due_date else None,
            'start_date': self.start_date.isoformat() if self.start_date else None,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
            # PLACEHOLDER: Add your fields
        }
        
        # Include computed properties
        data.update({
            'is_overdue': self.is_overdue,
            'days_until_due': self.days_until_due,
            'display_name': self.display_name,
        })
        
        # Include relationships if requested
        if include_relationships:
            # PLACEHOLDER: Add relationship data
            # data['owner'] = self.owner.to_dict() if self.owner else None
            # data['category'] = self.category.to_dict() if self.category else None
            pass
        
        return data
    
    def update_metadata(self, key: str, value: Any) -> None:
        """Update a specific metadata key."""
        if self.metadata is None:
            self.metadata = {}
        self.metadata[key] = value
        # Mark as modified for SQLAlchemy
        from sqlalchemy.orm.attributes import flag_modified
        flag_modified(self, 'metadata')
    
    def get_metadata(self, key: str, default: Any = None) -> Any:
        """Get a specific metadata value."""
        if not self.metadata:
            return default
        return self.metadata.get(key, default)
    
    def set_status(self, status: ItemStatus, reason: Optional[str] = None) -> None:
        """Set status with optional reason tracking."""
        old_status = self.status
        self.status = status
        
        # Track status change in metadata
        if reason:
            status_history = self.get_metadata('status_history', [])
            status_history.append({
                'from': old_status.value if old_status else None,
                'to': status.value,
                'reason': reason,
                'timestamp': datetime.now(timezone.utc).isoformat(),
                'changed_by': self.updated_by  # From AuditMixin
            })
            self.update_metadata('status_history', status_history)
    
    # PLACEHOLDER: Add your instance methods
    
    # Class methods
    @classmethod
    def get_by_name(cls, session, name: str) -> Optional["Item"]:
        """Get item by name."""
        return session.query(cls).filter(cls.name == name).first()
    
    @classmethod
    def get_active_items(cls, session) -> List["Item"]:
        """Get all active items."""
        return session.query(cls).filter(
            cls.status == ItemStatus.ACTIVE,
            cls.deleted_at.is_(None)  # From SoftDeleteMixin
        ).all()
    
    @classmethod
    def get_by_status(cls, session, status: ItemStatus) -> List["Item"]:
        """Get items by status."""
        return session.query(cls).filter(
            cls.status == status,
            cls.deleted_at.is_(None)
        ).all()
    
    # PLACEHOLDER: Add your class methods
    
    def __repr__(self) -> str:
        """String representation."""
        return f"<Item(id='{self.id}', name='{self.name}', status='{self.status}')>"
    
    def __str__(self) -> str:
        """Human-readable string."""
        return self.display_name

# Event listeners for model lifecycle
@event.listens_for(Item, 'before_insert')
def set_default_values(mapper, connection, target):
    """Set default values before insert."""
    # PLACEHOLDER: Add default value logic
    if not target.name:
        target.name = f"Item {target.id[:8]}"
    
    # Set default metadata structure
    if target.metadata is None:
        target.metadata = {
            'created_via': 'api',
            'version': '1.0'
        }

@event.listens_for(Item, 'before_update')
def track_changes(mapper, connection, target):
    """Track changes before update."""
    # PLACEHOLDER: Add change tracking logic
    # This could track which fields changed and store in metadata
    pass

@event.listens_for(Item.status, 'set')
def status_changed(target, value, old_value, initiator):
    """Handle status changes."""
    # PLACEHOLDER: Add status change logic
    if old_value != value and old_value is not None:
        # Log status change
        print(f"Item {target.id} status changed from {old_value} to {value}")

# Association tables for many-to-many relationships
# PLACEHOLDER: Define your association tables

# Example association table (uncomment and modify as needed):
# from sqlalchemy import Table, Column, ForeignKey
# 
# item_tags = Table(
#     'item_tags',
#     Base.metadata,
#     Column('item_id', String(36), ForeignKey('items.id'), primary_key=True),
#     Column('tag_id', String(36), ForeignKey('tags.id'), primary_key=True),
#     Column('created_at', DateTime(timezone=True), default=func.now()),
#     Index('ix_item_tags_item_id', 'item_id'),
#     Index('ix_item_tags_tag_id', 'tag_id'),
# )

# Template Implementation Guide:
"""
IMPLEMENTATION STEPS:

1. SETUP:
   - Copy this template to your model file (e.g., task.py)
   - Replace all PLACEHOLDER comments with actual values

2. CUSTOMIZE MODEL:
   Model Names:
   - Item -> Task (or your model class)
   - items -> tasks (table name)
   - ItemStatus -> TaskStatus (enum name)
   - ItemPriority -> TaskPriority (enum name)
   
3. DEFINE FIELDS:
   - Remove example fields you don't need
   - Add your model-specific fields
   - Update field types and constraints
   - Add proper comments and indexes

4. SETUP RELATIONSHIPS:
   - Uncomment and customize foreign key fields
   - Define relationship mappings
   - Create association tables if needed
   - Add proper cascade and lazy loading options

5. ADD VALIDATION:
   - Implement field validation methods
   - Add business logic validation
   - Include constraint validation

6. IMPLEMENT METHODS:
   - Add model-specific instance methods
   - Implement useful class methods
   - Add computed properties as needed

7. CONFIGURE CONSTRAINTS:
   - Add unique constraints
   - Define check constraints
   - Create performance indexes
   - Add table-level constraints

8. SETUP EVENT LISTENERS:
   - Implement lifecycle event handlers
   - Add change tracking as needed
   - Include audit trail functionality

EXAMPLE FOR TASK MODEL:
- Replace Item with Task throughout
- Add task-specific fields (title, due_date, assignee_id)
- Implement TaskStatus enum (TODO, IN_PROGRESS, DONE)
- Add relationship to User model
- Implement task-specific methods (mark_complete, assign_to)
- Add task validation (due_date > created_at)

FEATURES INCLUDED:
- UUID primary keys for scalability
- Comprehensive audit trail (TimestampMixin, AuditMixin)
- Soft delete functionality (SoftDeleteMixin)
- JSON metadata storage
- Enum field support
- Relationship patterns (one-to-many, many-to-many)
- Data validation and constraints
- Hybrid properties for computed fields
- Event listeners for lifecycle management
- Performance optimizations with indexes
- Type hints for better IDE support

BEST PRACTICES:
- Always use UUIDs for primary keys
- Include proper indexes for query performance
- Add meaningful constraints and validation
- Use enums for status and type fields
- Include audit trails for important models
- Implement soft delete for data retention
- Add proper documentation and comments
- Use type hints for better maintainability
""" 