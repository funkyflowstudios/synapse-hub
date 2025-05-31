"""
Connector models for Synapse-Hub AI orchestration system.

Manages Cursor Connector instances and their operational status.
"""

import enum
from datetime import datetime
from typing import Optional
from sqlalchemy import Column, String, Text, Integer, Boolean, Enum, DateTime
from pydantic import BaseModel as PydanticModel, Field

from app.models.base import AuditModel, GUID


class ConnectorStatus(enum.Enum):
    """Connector status enumeration."""
    ONLINE = "online"
    OFFLINE = "offline"
    BUSY = "busy"
    ERROR = "error"
    MAINTENANCE = "maintenance"


class Connector(AuditModel):
    """
    Connector model for Cursor automation agents.
    
    Represents a Cursor Connector instance that can execute
    automation tasks on local or remote machines.
    """
    
    __tablename__ = "connectors"
    
    # Basic connector information
    name = Column(String(255), nullable=False, index=True)
    description = Column(Text, nullable=True)
    
    # Connection details
    host = Column(String(255), nullable=False, index=True)
    port = Column(Integer, nullable=True)
    
    # Status tracking
    status = Column(
        Enum(ConnectorStatus),
        nullable=False,
        default=ConnectorStatus.OFFLINE,
        index=True
    )
    
    # Capabilities
    supports_ssh = Column(Boolean, nullable=False, default=False)
    max_concurrent_tasks = Column(Integer, nullable=False, default=1)
    
    # Health tracking
    last_heartbeat = Column(DateTime(timezone=True), nullable=True, index=True)
    last_error = Column(Text, nullable=True)
    
    def __repr__(self) -> str:
        return f"<Connector(id={self.id}, name='{self.name}', status={self.status.value})>"
    
    def is_available(self) -> bool:
        """Check if connector is available for new tasks."""
        return self.status in [ConnectorStatus.ONLINE]
    
    def mark_online(self):
        """Mark connector as online."""
        self.status = ConnectorStatus.ONLINE
        self.last_heartbeat = datetime.utcnow()
        self.last_error = None
    
    def mark_offline(self):
        """Mark connector as offline."""
        self.status = ConnectorStatus.OFFLINE
    
    def mark_busy(self):
        """Mark connector as busy."""
        self.status = ConnectorStatus.BUSY
    
    def mark_error(self, error_message: str):
        """Mark connector as having an error."""
        self.status = ConnectorStatus.ERROR
        self.last_error = error_message


# Placeholder models for future implementation
class ConnectorLog(AuditModel):
    """Placeholder for connector operation logs."""
    __tablename__ = "connector_logs"
    
    connector_id = Column(GUID(), nullable=False, index=True)
    operation = Column(String(100), nullable=False)
    status = Column(String(50), nullable=False)
    message = Column(Text, nullable=True)


class ConnectorMetric(AuditModel):
    """Placeholder for connector performance metrics."""
    __tablename__ = "connector_metrics"
    
    connector_id = Column(GUID(), nullable=False, index=True)
    metric_name = Column(String(100), nullable=False)
    metric_value = Column(String(255), nullable=False)


# Pydantic schemas
class ConnectorCreate(PydanticModel):
    """Schema for connector creation."""
    name: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = Field(None, max_length=1000)
    host: str = Field(..., min_length=1, max_length=255)
    port: Optional[int] = Field(None, gt=0, le=65535)
    supports_ssh: bool = False
    max_concurrent_tasks: int = Field(1, ge=1, le=10)


class ConnectorResponse(PydanticModel):
    """Schema for connector API responses."""
    id: str
    name: str
    description: Optional[str]
    host: str
    port: Optional[int]
    status: ConnectorStatus
    supports_ssh: bool
    max_concurrent_tasks: int
    last_heartbeat: Optional[datetime]
    last_error: Optional[str]
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


# Export classes
__all__ = [
    "ConnectorStatus",
    "Connector",
    "ConnectorLog",
    "ConnectorMetric",
    "ConnectorCreate",
    "ConnectorResponse",
] 