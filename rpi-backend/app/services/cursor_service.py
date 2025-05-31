"""
Cursor Connector service for Synapse-Hub AI orchestration system.

Provides comprehensive integration with Cursor IDE automation including
message queue management, status tracking, command interface, SSH context
handling, and error recovery mechanisms.
"""

import os
import json
import asyncio
import uuid
from typing import List, Optional, Dict, Any, AsyncGenerator, Union
from datetime import datetime, timezone, timedelta
from dataclasses import dataclass, field
from enum import Enum
from collections import deque
import structlog

from app.core.exceptions import (
    ValidationError,
    BusinessLogicError,
    ExternalServiceError,
    ConfigurationError,
    NotFoundError
)
from app.core.config import settings

logger = structlog.get_logger(__name__)


class CursorStatus(str, Enum):
    """Cursor Connector status states."""
    DISCONNECTED = "disconnected"
    CONNECTING = "connecting"
    CONNECTED = "connected"
    PROCESSING = "processing"
    ERROR = "error"
    TIMEOUT = "timeout"


class CommandType(str, Enum):
    """Types of commands that can be sent to Cursor."""
    PROMPT = "prompt"
    FILE_OPERATION = "file_operation"
    SEARCH = "search"
    REFACTOR = "refactor"
    DEBUG = "debug"
    TERMINAL = "terminal"
    SSH_CONTEXT = "ssh_context"


class CommandStatus(str, Enum):
    """Status of individual commands."""
    QUEUED = "queued"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"
    TIMEOUT = "timeout"
    CANCELLED = "cancelled"


@dataclass
class SSHContext:
    """SSH context information for remote operations."""
    host: str
    port: int = 22
    username: Optional[str] = None
    key_path: Optional[str] = None
    working_directory: Optional[str] = None
    environment_vars: Dict[str, str] = field(default_factory=dict)
    connection_timeout: float = 30.0
    last_verified: Optional[datetime] = None
    is_active: bool = False
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert SSH context to dictionary."""
        return {
            "host": self.host,
            "port": self.port,
            "username": self.username,
            "key_path": self.key_path,
            "working_directory": self.working_directory,
            "environment_vars": self.environment_vars,
            "connection_timeout": self.connection_timeout,
            "last_verified": self.last_verified.isoformat() if self.last_verified else None,
            "is_active": self.is_active
        }
    
    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> "SSHContext":
        """Create SSH context from dictionary."""
        last_verified = None
        if data.get("last_verified"):
            last_verified = datetime.fromisoformat(data["last_verified"])
        
        return cls(
            host=data["host"],
            port=data.get("port", 22),
            username=data.get("username"),
            key_path=data.get("key_path"),
            working_directory=data.get("working_directory"),
            environment_vars=data.get("environment_vars", {}),
            connection_timeout=data.get("connection_timeout", 30.0),
            last_verified=last_verified,
            is_active=data.get("is_active", False)
        )


@dataclass
class CursorCommand:
    """Represents a command to be executed by Cursor."""
    id: str
    task_id: str
    command_type: CommandType
    content: str
    metadata: Dict[str, Any] = field(default_factory=dict)
    status: CommandStatus = CommandStatus.QUEUED
    created_at: datetime = field(default_factory=lambda: datetime.now(timezone.utc))
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    response: Optional[str] = None
    error_message: Optional[str] = None
    retry_count: int = 0
    max_retries: int = 3
    timeout_seconds: float = 300.0  # 5 minutes default
    ssh_context: Optional[SSHContext] = None
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert command to dictionary."""
        return {
            "id": self.id,
            "task_id": self.task_id,
            "command_type": self.command_type.value,
            "content": self.content,
            "metadata": self.metadata,
            "status": self.status.value,
            "created_at": self.created_at.isoformat(),
            "started_at": self.started_at.isoformat() if self.started_at else None,
            "completed_at": self.completed_at.isoformat() if self.completed_at else None,
            "response": self.response,
            "error_message": self.error_message,
            "retry_count": self.retry_count,
            "max_retries": self.max_retries,
            "timeout_seconds": self.timeout_seconds,
            "ssh_context": self.ssh_context.to_dict() if self.ssh_context else None
        }
    
    @property
    def is_expired(self) -> bool:
        """Check if command has exceeded timeout."""
        if self.started_at and self.status == CommandStatus.PROCESSING:
            elapsed = datetime.now(timezone.utc) - self.started_at
            return elapsed.total_seconds() > self.timeout_seconds
        return False
    
    @property
    def can_retry(self) -> bool:
        """Check if command can be retried."""
        return self.retry_count < self.max_retries and self.status in [
            CommandStatus.FAILED, CommandStatus.TIMEOUT
        ]


@dataclass
class CursorConnectorConfig:
    """Configuration for Cursor Connector integration."""
    connector_host: str = "localhost"
    connector_port: int = 8765
    connection_timeout: float = 30.0
    command_timeout: float = 300.0
    max_retries: int = 3
    retry_delay: float = 2.0
    heartbeat_interval: float = 30.0
    queue_max_size: int = 1000
    enable_ssh_context: bool = True
    
    @classmethod
    def from_env(cls) -> "CursorConnectorConfig":
        """Create configuration from environment variables."""
        return cls(
            connector_host=os.getenv("CURSOR_CONNECTOR_HOST", "localhost"),
            connector_port=int(os.getenv("CURSOR_CONNECTOR_PORT", "8765")),
            connection_timeout=float(os.getenv("CURSOR_CONNECTION_TIMEOUT", "30.0")),
            command_timeout=float(os.getenv("CURSOR_COMMAND_TIMEOUT", "300.0")),
            max_retries=int(os.getenv("CURSOR_MAX_RETRIES", "3")),
            retry_delay=float(os.getenv("CURSOR_RETRY_DELAY", "2.0")),
            heartbeat_interval=float(os.getenv("CURSOR_HEARTBEAT_INTERVAL", "30.0")),
            queue_max_size=int(os.getenv("CURSOR_QUEUE_MAX_SIZE", "1000")),
            enable_ssh_context=os.getenv("CURSOR_ENABLE_SSH_CONTEXT", "true").lower() == "true"
        )


class CursorService:
    """
    Service class for Cursor Connector integration.
    
    Features:
    - Message queue system for command management
    - Status tracking and health monitoring
    - Command interface for Cursor operations
    - SSH context handling for remote operations
    - Error recovery with timeout and retry logic
    - Real-time status updates via WebSocket
    """
    
    def __init__(self, config: Optional[CursorConnectorConfig] = None):
        """Initialize Cursor service with configuration."""
        self.config = config or CursorConnectorConfig.from_env()
        self._status = CursorStatus.DISCONNECTED
        self._command_queue: deque = deque(maxlen=self.config.queue_max_size)
        self._active_commands: Dict[str, CursorCommand] = {}
        self._ssh_contexts: Dict[str, SSHContext] = {}
        self._last_heartbeat: Optional[datetime] = None
        self._connection_task: Optional[asyncio.Task] = None
        self._heartbeat_task: Optional[asyncio.Task] = None
        self._processing_task: Optional[asyncio.Task] = None
        
        logger.info(f"Initialized Cursor service with config: {self.config.connector_host}:{self.config.connector_port}")
    
    @property
    def status(self) -> CursorStatus:
        """Get current Cursor Connector status."""
        return self._status
    
    @property
    def is_connected(self) -> bool:
        """Check if Cursor Connector is connected."""
        return self._status == CursorStatus.CONNECTED
    
    @property
    def queue_size(self) -> int:
        """Get current queue size."""
        return len(self._command_queue)
    
    @property
    def active_commands_count(self) -> int:
        """Get number of active commands."""
        return len(self._active_commands)
    
    async def start(self) -> None:
        """Start the Cursor service and background tasks."""
        try:
            logger.info("Starting Cursor service...")
            
            # Start background tasks
            self._connection_task = asyncio.create_task(self._connection_manager())
            self._heartbeat_task = asyncio.create_task(self._heartbeat_manager())
            self._processing_task = asyncio.create_task(self._command_processor())
            
            logger.info("Cursor service started successfully")
            
        except Exception as e:
            logger.error(f"Failed to start Cursor service: {str(e)}")
            await self.stop()
            raise ConfigurationError(f"Cursor service startup failed: {str(e)}")
    
    async def stop(self) -> None:
        """Stop the Cursor service and cleanup resources."""
        try:
            logger.info("Stopping Cursor service...")
            
            # Cancel background tasks
            for task in [self._connection_task, self._heartbeat_task, self._processing_task]:
                if task and not task.done():
                    task.cancel()
                    try:
                        await task
                    except asyncio.CancelledError:
                        pass
            
            # Cancel active commands
            for command in self._active_commands.values():
                command.status = CommandStatus.CANCELLED
                command.completed_at = datetime.now(timezone.utc)
            
            self._active_commands.clear()
            self._command_queue.clear()
            self._status = CursorStatus.DISCONNECTED
            
            logger.info("Cursor service stopped")
            
        except Exception as e:
            logger.error(f"Error stopping Cursor service: {str(e)}")
    
    async def send_command(
        self,
        task_id: str,
        command_type: CommandType,
        content: str,
        metadata: Optional[Dict[str, Any]] = None,
        ssh_context: Optional[SSHContext] = None,
        timeout_seconds: Optional[float] = None
    ) -> str:
        """
        Send a command to Cursor Connector.
        
        Args:
            task_id: Task identifier for context
            command_type: Type of command to execute
            content: Command content/prompt
            metadata: Additional metadata for the command
            ssh_context: SSH context for remote operations
            timeout_seconds: Custom timeout for this command
            
        Returns:
            Command ID for tracking
            
        Raises:
            ValidationError: If command is invalid
            BusinessLogicError: If service is not ready
        """
        if not content.strip():
            raise ValidationError("Command content cannot be empty")
        
        if self.queue_size >= self.config.queue_max_size:
            raise BusinessLogicError("Command queue is full")
        
        # Create command
        command = CursorCommand(
            id=str(uuid.uuid4()),
            task_id=task_id,
            command_type=command_type,
            content=content,
            metadata=metadata or {},
            timeout_seconds=timeout_seconds or self.config.command_timeout,
            ssh_context=ssh_context
        )
        
        # Add to queue
        self._command_queue.append(command)
        
        logger.info(f"Queued command {command.id} for task {task_id}, type: {command_type.value}")
        return command.id
    
    async def get_command_status(self, command_id: str) -> Optional[Dict[str, Any]]:
        """Get status of a specific command."""
        # Check active commands first
        if command_id in self._active_commands:
            return self._active_commands[command_id].to_dict()
        
        # Check queue
        for command in self._command_queue:
            if command.id == command_id:
                return command.to_dict()
        
        return None
    
    async def cancel_command(self, command_id: str) -> bool:
        """Cancel a queued or active command."""
        # Cancel from queue
        for i, command in enumerate(self._command_queue):
            if command.id == command_id:
                command.status = CommandStatus.CANCELLED
                command.completed_at = datetime.now(timezone.utc)
                del self._command_queue[i]
                logger.info(f"Cancelled queued command {command_id}")
                return True
        
        # Cancel active command
        if command_id in self._active_commands:
            command = self._active_commands[command_id]
            command.status = CommandStatus.CANCELLED
            command.completed_at = datetime.now(timezone.utc)
            del self._active_commands[command_id]
            logger.info(f"Cancelled active command {command_id}")
            return True
        
        return False
    
    async def add_ssh_context(
        self,
        context_id: str,
        host: str,
        port: int = 22,
        username: Optional[str] = None,
        key_path: Optional[str] = None,
        working_directory: Optional[str] = None,
        environment_vars: Optional[Dict[str, str]] = None
    ) -> SSHContext:
        """Add or update SSH context for remote operations."""
        if not self.config.enable_ssh_context:
            raise BusinessLogicError("SSH context is disabled")
        
        ssh_context = SSHContext(
            host=host,
            port=port,
            username=username,
            key_path=key_path,
            working_directory=working_directory,
            environment_vars=environment_vars or {},
            last_verified=datetime.now(timezone.utc)
        )
        
        self._ssh_contexts[context_id] = ssh_context
        logger.info(f"Added SSH context {context_id} for {host}:{port}")
        return ssh_context
    
    async def get_ssh_context(self, context_id: str) -> Optional[SSHContext]:
        """Get SSH context by ID."""
        return self._ssh_contexts.get(context_id)
    
    async def verify_ssh_context(self, context_id: str) -> bool:
        """Verify SSH context connectivity."""
        context = self._ssh_contexts.get(context_id)
        if not context:
            return False
        
        try:
            # TODO: Implement actual SSH connectivity test
            # For now, simulate verification
            await asyncio.sleep(0.1)
            context.last_verified = datetime.now(timezone.utc)
            context.is_active = True
            logger.info(f"Verified SSH context {context_id}")
            return True
            
        except Exception as e:
            logger.error(f"SSH context verification failed for {context_id}: {str(e)}")
            context.is_active = False
            return False
    
    async def remove_ssh_context(self, context_id: str) -> bool:
        """Remove SSH context."""
        if context_id in self._ssh_contexts:
            del self._ssh_contexts[context_id]
            logger.info(f"Removed SSH context {context_id}")
            return True
        return False
    
    async def get_health_status(self) -> Dict[str, Any]:
        """Get comprehensive health status."""
        now = datetime.now(timezone.utc)
        
        # Check heartbeat freshness
        heartbeat_healthy = True
        if self._last_heartbeat:
            heartbeat_age = (now - self._last_heartbeat).total_seconds()
            heartbeat_healthy = heartbeat_age < (self.config.heartbeat_interval * 2)
        
        # Count expired commands
        expired_commands = sum(1 for cmd in self._active_commands.values() if cmd.is_expired)
        
        return {
            "status": self._status.value,
            "is_connected": self.is_connected,
            "queue_size": self.queue_size,
            "active_commands": self.active_commands_count,
            "expired_commands": expired_commands,
            "ssh_contexts": len(self._ssh_contexts),
            "last_heartbeat": self._last_heartbeat.isoformat() if self._last_heartbeat else None,
            "heartbeat_healthy": heartbeat_healthy,
            "config": {
                "host": self.config.connector_host,
                "port": self.config.connector_port,
                "max_queue_size": self.config.queue_max_size,
                "ssh_enabled": self.config.enable_ssh_context
            }
        }
    
    async def _connection_manager(self) -> None:
        """Manage connection to Cursor Connector."""
        while True:
            try:
                if self._status == CursorStatus.DISCONNECTED:
                    await self._attempt_connection()
                
                await asyncio.sleep(5.0)  # Check connection every 5 seconds
                
            except asyncio.CancelledError:
                break
            except Exception as e:
                logger.error(f"Connection manager error: {str(e)}")
                self._status = CursorStatus.ERROR
                await asyncio.sleep(10.0)  # Wait before retry
    
    async def _attempt_connection(self) -> None:
        """Attempt to connect to Cursor Connector."""
        try:
            self._status = CursorStatus.CONNECTING
            logger.info(f"Attempting connection to Cursor Connector at {self.config.connector_host}:{self.config.connector_port}")
            
            # TODO: Implement actual WebSocket connection to Cursor Connector
            # For now, simulate connection
            await asyncio.sleep(1.0)
            
            self._status = CursorStatus.CONNECTED
            self._last_heartbeat = datetime.now(timezone.utc)
            logger.info("Connected to Cursor Connector")
            
        except Exception as e:
            logger.error(f"Connection failed: {str(e)}")
            self._status = CursorStatus.ERROR
            raise
    
    async def _heartbeat_manager(self) -> None:
        """Manage heartbeat with Cursor Connector."""
        while True:
            try:
                if self.is_connected:
                    # TODO: Send actual heartbeat to Cursor Connector
                    self._last_heartbeat = datetime.now(timezone.utc)
                    logger.debug("Heartbeat sent to Cursor Connector")
                
                await asyncio.sleep(self.config.heartbeat_interval)
                
            except asyncio.CancelledError:
                break
            except Exception as e:
                logger.error(f"Heartbeat error: {str(e)}")
                await asyncio.sleep(self.config.heartbeat_interval)
    
    async def _command_processor(self) -> None:
        """Process commands from the queue."""
        while True:
            try:
                # Process expired commands
                await self._handle_expired_commands()
                
                # Process new commands
                if self.is_connected and self._command_queue:
                    command = self._command_queue.popleft()
                    await self._execute_command(command)
                
                await asyncio.sleep(0.1)  # Small delay to prevent busy loop
                
            except asyncio.CancelledError:
                break
            except Exception as e:
                logger.error(f"Command processor error: {str(e)}")
                await asyncio.sleep(1.0)
    
    async def _handle_expired_commands(self) -> None:
        """Handle commands that have exceeded their timeout."""
        expired_commands = [
            cmd_id for cmd_id, cmd in self._active_commands.items()
            if cmd.is_expired
        ]
        
        for cmd_id in expired_commands:
            command = self._active_commands[cmd_id]
            command.status = CommandStatus.TIMEOUT
            command.completed_at = datetime.now(timezone.utc)
            command.error_message = f"Command timed out after {command.timeout_seconds} seconds"
            
            # Retry if possible
            if command.can_retry:
                command.retry_count += 1
                command.status = CommandStatus.QUEUED
                command.started_at = None
                command.completed_at = None
                self._command_queue.append(command)
                logger.warning(f"Retrying expired command {cmd_id}, attempt {command.retry_count}")
            else:
                logger.error(f"Command {cmd_id} failed after {command.retry_count} retries")
            
            del self._active_commands[cmd_id]
    
    async def _execute_command(self, command: CursorCommand) -> None:
        """Execute a single command."""
        try:
            command.status = CommandStatus.PROCESSING
            command.started_at = datetime.now(timezone.utc)
            self._active_commands[command.id] = command
            
            logger.info(f"Executing command {command.id}, type: {command.command_type.value}")
            
            # TODO: Send actual command to Cursor Connector
            # For now, simulate command execution
            await asyncio.sleep(2.0)
            
            # Simulate response
            command.response = f"Simulated response for {command.command_type.value} command: {command.content[:50]}..."
            command.status = CommandStatus.COMPLETED
            command.completed_at = datetime.now(timezone.utc)
            
            logger.info(f"Command {command.id} completed successfully")
            
        except Exception as e:
            command.status = CommandStatus.FAILED
            command.completed_at = datetime.now(timezone.utc)
            command.error_message = str(e)
            
            logger.error(f"Command {command.id} failed: {str(e)}")
            
            # Retry if possible
            if command.can_retry:
                command.retry_count += 1
                command.status = CommandStatus.QUEUED
                command.started_at = None
                command.completed_at = None
                self._command_queue.append(command)
                logger.warning(f"Retrying failed command {command.id}, attempt {command.retry_count}")
        
        finally:
            # Keep completed commands in active list for a short time for status queries
            # They will be cleaned up by a separate process or timeout
            pass


# Global service instance
_cursor_service: Optional[CursorService] = None


def get_cursor_service() -> CursorService:
    """Get or create global Cursor service instance."""
    global _cursor_service
    if _cursor_service is None:
        _cursor_service = CursorService()
    return _cursor_service


async def start_cursor_service():
    """Start the global Cursor service."""
    service = get_cursor_service()
    await service.start()


async def shutdown_cursor_service():
    """Shutdown and cleanup Cursor service."""
    global _cursor_service
    if _cursor_service:
        await _cursor_service.stop()
        _cursor_service = None
        logger.info("Cursor service shut down") 