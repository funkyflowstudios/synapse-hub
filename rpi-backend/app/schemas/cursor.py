"""
Pydantic schemas for Cursor Connector API endpoints.

Defines request/response models for Cursor IDE automation, command management,
SSH context handling, and status monitoring.
"""

from typing import Optional, Dict, Any, List
from datetime import datetime
from pydantic import BaseModel, Field, validator
from enum import Enum

from app.services.cursor_service import CommandType, CommandStatus, CursorStatus


class CursorCommandRequest(BaseModel):
    """Request model for sending commands to Cursor."""
    
    command_type: CommandType = Field(..., description="Type of command to execute")
    content: str = Field(..., min_length=1, description="Command content or prompt")
    metadata: Optional[Dict[str, Any]] = Field(
        default_factory=dict, 
        description="Additional metadata for the command"
    )
    ssh_context_id: Optional[str] = Field(
        None, 
        description="SSH context ID for remote operations"
    )
    timeout_seconds: Optional[float] = Field(
        300.0, 
        ge=1.0, 
        le=3600.0, 
        description="Command timeout in seconds (1-3600)"
    )
    
    @validator('content')
    def validate_content(cls, v):
        """Validate command content."""
        if not v.strip():
            raise ValueError("Command content cannot be empty or whitespace only")
        if len(v) > 10000:
            raise ValueError("Command content cannot exceed 10,000 characters")
        return v.strip()
    
    @validator('metadata')
    def validate_metadata(cls, v):
        """Validate metadata dictionary."""
        if v is None:
            return {}
        if not isinstance(v, dict):
            raise ValueError("Metadata must be a dictionary")
        # Check for reasonable size
        if len(str(v)) > 5000:
            raise ValueError("Metadata is too large")
        return v
    
    class Config:
        schema_extra = {
            "example": {
                "command_type": "prompt",
                "content": "Create a new React component for user authentication",
                "metadata": {
                    "priority": "high",
                    "project": "web-app"
                },
                "ssh_context_id": "dev-server",
                "timeout_seconds": 300.0
            }
        }


class CursorCommandResponse(BaseModel):
    """Response model for Cursor command submission."""
    
    command_id: str = Field(..., description="Unique command identifier")
    task_id: str = Field(..., description="Associated task identifier")
    command_type: CommandType = Field(..., description="Type of command")
    status: str = Field(..., description="Current command status")
    message: str = Field(..., description="Response message")
    metadata: Dict[str, Any] = Field(
        default_factory=dict, 
        description="Additional response metadata"
    )
    timestamp: datetime = Field(
        default_factory=datetime.utcnow,
        description="Response timestamp"
    )
    
    class Config:
        schema_extra = {
            "example": {
                "command_id": "cmd_123e4567-e89b-12d3-a456-426614174000",
                "task_id": "task_456",
                "command_type": "prompt",
                "status": "queued",
                "message": "Command queued for execution",
                "metadata": {
                    "queue_position": 2,
                    "ssh_context_used": True,
                    "timeout_seconds": 300.0
                },
                "timestamp": "2024-01-15T10:30:00.123456"
            }
        }


class CommandStatusResponse(BaseModel):
    """Response model for command status queries."""
    
    id: str = Field(..., description="Command identifier")
    task_id: str = Field(..., description="Associated task identifier")
    command_type: str = Field(..., description="Type of command")
    content: str = Field(..., description="Command content")
    status: str = Field(..., description="Current command status")
    created_at: str = Field(..., description="Command creation timestamp")
    started_at: Optional[str] = Field(None, description="Command start timestamp")
    completed_at: Optional[str] = Field(None, description="Command completion timestamp")
    response: Optional[str] = Field(None, description="Command response")
    error_message: Optional[str] = Field(None, description="Error message if failed")
    retry_count: int = Field(..., ge=0, description="Number of retry attempts")
    max_retries: int = Field(..., ge=0, description="Maximum retry attempts")
    timeout_seconds: float = Field(..., gt=0, description="Command timeout")
    metadata: Dict[str, Any] = Field(
        default_factory=dict, 
        description="Command metadata"
    )
    ssh_context: Optional[Dict[str, Any]] = Field(
        None, 
        description="SSH context information"
    )
    
    class Config:
        schema_extra = {
            "example": {
                "id": "cmd_123e4567-e89b-12d3-a456-426614174000",
                "task_id": "task_456",
                "command_type": "prompt",
                "content": "Create a new React component",
                "status": "completed",
                "created_at": "2024-01-15T10:30:00.123456",
                "started_at": "2024-01-15T10:30:05.123456",
                "completed_at": "2024-01-15T10:32:15.123456",
                "response": "Component created successfully",
                "error_message": None,
                "retry_count": 0,
                "max_retries": 3,
                "timeout_seconds": 300.0,
                "metadata": {"priority": "high"},
                "ssh_context": None
            }
        }


class SSHContextRequest(BaseModel):
    """Request model for creating SSH contexts."""
    
    context_id: str = Field(..., min_length=1, description="Unique context identifier")
    host: str = Field(..., min_length=1, description="SSH host address")
    port: int = Field(22, ge=1, le=65535, description="SSH port number")
    username: Optional[str] = Field(None, description="SSH username")
    key_path: Optional[str] = Field(None, description="Path to SSH private key")
    working_directory: Optional[str] = Field(
        None, 
        description="Default working directory"
    )
    environment_vars: Optional[Dict[str, str]] = Field(
        default_factory=dict, 
        description="Environment variables"
    )
    
    @validator('context_id')
    def validate_context_id(cls, v):
        """Validate context ID."""
        if not v.strip():
            raise ValueError("Context ID cannot be empty")
        if len(v) > 100:
            raise ValueError("Context ID cannot exceed 100 characters")
        # Allow alphanumeric, hyphens, underscores
        import re
        if not re.match(r'^[a-zA-Z0-9_-]+$', v):
            raise ValueError("Context ID can only contain alphanumeric characters, hyphens, and underscores")
        return v.strip()
    
    @validator('host')
    def validate_host(cls, v):
        """Validate SSH host."""
        if not v.strip():
            raise ValueError("Host cannot be empty")
        return v.strip()
    
    @validator('environment_vars')
    def validate_environment_vars(cls, v):
        """Validate environment variables."""
        if v is None:
            return {}
        if not isinstance(v, dict):
            raise ValueError("Environment variables must be a dictionary")
        # Validate all keys and values are strings
        for key, value in v.items():
            if not isinstance(key, str) or not isinstance(value, str):
                raise ValueError("Environment variable keys and values must be strings")
        return v
    
    class Config:
        schema_extra = {
            "example": {
                "context_id": "dev-server",
                "host": "192.168.1.100",
                "port": 22,
                "username": "developer",
                "key_path": "/home/user/.ssh/id_rsa",
                "working_directory": "/home/developer/projects",
                "environment_vars": {
                    "NODE_ENV": "development",
                    "DEBUG": "true"
                }
            }
        }


class SSHContextResponse(BaseModel):
    """Response model for SSH context operations."""
    
    context_id: str = Field(..., description="Context identifier")
    host: str = Field(..., description="SSH host address")
    port: int = Field(..., description="SSH port number")
    username: Optional[str] = Field(None, description="SSH username")
    working_directory: Optional[str] = Field(None, description="Working directory")
    is_active: bool = Field(..., description="Whether context is active")
    last_verified: Optional[datetime] = Field(
        None, 
        description="Last verification timestamp"
    )
    message: str = Field(..., description="Response message")
    
    class Config:
        schema_extra = {
            "example": {
                "context_id": "dev-server",
                "host": "192.168.1.100",
                "port": 22,
                "username": "developer",
                "working_directory": "/home/developer/projects",
                "is_active": True,
                "last_verified": "2024-01-15T10:30:00.123456",
                "message": "SSH context created successfully"
            }
        }


class CursorStatusResponse(BaseModel):
    """Response model for Cursor service status."""
    
    status: str = Field(..., description="Current service status")
    is_connected: bool = Field(..., description="Connection status")
    queue_size: int = Field(..., ge=0, description="Current queue size")
    active_commands: int = Field(..., ge=0, description="Number of active commands")
    expired_commands: int = Field(..., ge=0, description="Number of expired commands")
    ssh_contexts: int = Field(..., ge=0, description="Number of SSH contexts")
    last_heartbeat: Optional[str] = Field(None, description="Last heartbeat timestamp")
    heartbeat_healthy: bool = Field(..., description="Heartbeat health status")
    config: Dict[str, Any] = Field(..., description="Service configuration")
    
    class Config:
        schema_extra = {
            "example": {
                "status": "connected",
                "is_connected": True,
                "queue_size": 3,
                "active_commands": 1,
                "expired_commands": 0,
                "ssh_contexts": 2,
                "last_heartbeat": "2024-01-15T10:30:00.123456",
                "heartbeat_healthy": True,
                "config": {
                    "host": "localhost",
                    "port": 8765,
                    "max_queue_size": 1000,
                    "ssh_enabled": True
                }
            }
        }


class CursorHealthResponse(BaseModel):
    """Health check response for Cursor service."""
    
    status: str = Field(..., description="Service health status")
    is_connected: bool = Field(..., description="Connection status")
    queue_size: int = Field(..., ge=0, description="Current queue size")
    active_commands: int = Field(..., ge=0, description="Number of active commands")
    expired_commands: int = Field(..., ge=0, description="Number of expired commands")
    ssh_contexts: int = Field(..., ge=0, description="Number of SSH contexts")
    last_heartbeat: Optional[str] = Field(None, description="Last heartbeat timestamp")
    heartbeat_healthy: Optional[bool] = Field(None, description="Heartbeat health status")
    config: Optional[Dict[str, Any]] = Field(None, description="Service configuration")
    error: Optional[str] = Field(None, description="Error message if unhealthy")
    timestamp: datetime = Field(
        default_factory=datetime.utcnow,
        description="Health check timestamp"
    )
    
    @validator('status')
    def validate_status(cls, v):
        """Validate health status."""
        allowed_statuses = {"healthy", "degraded", "unhealthy", "connected", "disconnected", "error"}
        if v not in allowed_statuses:
            raise ValueError(f"Status must be one of: {allowed_statuses}")
        return v
    
    class Config:
        schema_extra = {
            "example": {
                "status": "healthy",
                "is_connected": True,
                "queue_size": 2,
                "active_commands": 1,
                "expired_commands": 0,
                "ssh_contexts": 1,
                "last_heartbeat": "2024-01-15T10:30:00.123456",
                "heartbeat_healthy": True,
                "config": {
                    "host": "localhost",
                    "port": 8765,
                    "max_queue_size": 1000,
                    "ssh_enabled": True
                },
                "error": None,
                "timestamp": "2024-01-15T10:30:00.123456"
            }
        }


class WebSocketMessage(BaseModel):
    """WebSocket message format for Cursor operations."""
    
    type: str = Field(..., description="Message type")
    task_id: Optional[str] = Field(None, description="Associated task ID")
    command_id: Optional[str] = Field(None, description="Associated command ID")
    content: Optional[str] = Field(None, description="Message content")
    metadata: Optional[Dict[str, Any]] = Field(
        default_factory=dict, 
        description="Additional message data"
    )
    timestamp: datetime = Field(
        default_factory=datetime.utcnow,
        description="Message timestamp"
    )
    
    @validator('type')
    def validate_type(cls, v):
        """Validate message type."""
        allowed_types = {
            "status_update", "command_queued", "command_status", 
            "command_completed", "command_failed", "error", "heartbeat"
        }
        if v not in allowed_types:
            raise ValueError(f"Message type must be one of: {allowed_types}")
        return v
    
    class Config:
        schema_extra = {
            "example": {
                "type": "command_status",
                "task_id": "task_456",
                "command_id": "cmd_123",
                "content": "Command is processing",
                "metadata": {
                    "status": "processing",
                    "progress": 50
                },
                "timestamp": "2024-01-15T10:30:00.123456"
            }
        }


class CursorConfigUpdate(BaseModel):
    """Model for updating Cursor service configuration."""
    
    connector_host: Optional[str] = Field(None, description="Cursor Connector host")
    connector_port: Optional[int] = Field(
        None, 
        ge=1, 
        le=65535, 
        description="Cursor Connector port"
    )
    connection_timeout: Optional[float] = Field(
        None, 
        gt=0, 
        le=300, 
        description="Connection timeout in seconds"
    )
    command_timeout: Optional[float] = Field(
        None, 
        gt=0, 
        le=3600, 
        description="Command timeout in seconds"
    )
    max_retries: Optional[int] = Field(
        None, 
        ge=0, 
        le=10, 
        description="Maximum retry attempts"
    )
    heartbeat_interval: Optional[float] = Field(
        None, 
        gt=0, 
        le=300, 
        description="Heartbeat interval in seconds"
    )
    queue_max_size: Optional[int] = Field(
        None, 
        ge=1, 
        le=10000, 
        description="Maximum queue size"
    )
    enable_ssh_context: Optional[bool] = Field(
        None, 
        description="Enable SSH context support"
    )
    
    @validator('connector_host')
    def validate_host(cls, v):
        """Validate connector host."""
        if v is not None and not v.strip():
            raise ValueError("Connector host cannot be empty")
        return v.strip() if v else v
    
    class Config:
        schema_extra = {
            "example": {
                "connector_host": "localhost",
                "connector_port": 8765,
                "connection_timeout": 30.0,
                "command_timeout": 300.0,
                "max_retries": 3,
                "heartbeat_interval": 30.0,
                "queue_max_size": 1000,
                "enable_ssh_context": True
            }
        } 