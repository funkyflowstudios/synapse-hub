"""
Tests for Cursor Connector service.

Comprehensive test suite covering configuration management, command queuing,
SSH context handling, status tracking, and error recovery mechanisms.
"""

import pytest
import asyncio
from datetime import datetime, timezone, timedelta
from unittest.mock import Mock, AsyncMock, patch
from typing import Dict, Any

from app.services.cursor_service import (
    CursorService,
    CursorConnectorConfig,
    CursorCommand,
    SSHContext,
    CommandType,
    CommandStatus,
    CursorStatus,
    get_cursor_service,
    start_cursor_service,
    shutdown_cursor_service
)
from app.core.exceptions import (
    ValidationError,
    BusinessLogicError,
    ConfigurationError
)


class TestCursorConnectorConfig:
    """Test Cursor Connector configuration management."""
    
    def test_config_creation_with_defaults(self):
        """Test creating configuration with default values."""
        config = CursorConnectorConfig()
        
        assert config.connector_host == "localhost"
        assert config.connector_port == 8765
        assert config.connection_timeout == 30.0
        assert config.command_timeout == 300.0
        assert config.max_retries == 3
        assert config.retry_delay == 2.0
        assert config.heartbeat_interval == 30.0
        assert config.queue_max_size == 1000
        assert config.enable_ssh_context is True
    
    def test_config_creation_with_custom_values(self):
        """Test creating configuration with custom values."""
        config = CursorConnectorConfig(
            connector_host="192.168.1.100",
            connector_port=9000,
            connection_timeout=60.0,
            command_timeout=600.0,
            max_retries=5,
            retry_delay=3.0,
            heartbeat_interval=60.0,
            queue_max_size=2000,
            enable_ssh_context=False
        )
        
        assert config.connector_host == "192.168.1.100"
        assert config.connector_port == 9000
        assert config.connection_timeout == 60.0
        assert config.command_timeout == 600.0
        assert config.max_retries == 5
        assert config.retry_delay == 3.0
        assert config.heartbeat_interval == 60.0
        assert config.queue_max_size == 2000
        assert config.enable_ssh_context is False
    
    @patch.dict('os.environ', {
        'CURSOR_CONNECTOR_HOST': 'test-host',
        'CURSOR_CONNECTOR_PORT': '9999',
        'CURSOR_CONNECTION_TIMEOUT': '45.0',
        'CURSOR_COMMAND_TIMEOUT': '450.0',
        'CURSOR_MAX_RETRIES': '4',
        'CURSOR_RETRY_DELAY': '2.5',
        'CURSOR_HEARTBEAT_INTERVAL': '45.0',
        'CURSOR_QUEUE_MAX_SIZE': '1500',
        'CURSOR_ENABLE_SSH_CONTEXT': 'false'
    })
    def test_config_from_env(self):
        """Test creating configuration from environment variables."""
        config = CursorConnectorConfig.from_env()
        
        assert config.connector_host == "test-host"
        assert config.connector_port == 9999
        assert config.connection_timeout == 45.0
        assert config.command_timeout == 450.0
        assert config.max_retries == 4
        assert config.retry_delay == 2.5
        assert config.heartbeat_interval == 45.0
        assert config.queue_max_size == 1500
        assert config.enable_ssh_context is False


class TestSSHContext:
    """Test SSH context management."""
    
    def test_ssh_context_creation(self):
        """Test creating SSH context."""
        context = SSHContext(
            host="192.168.1.100",
            port=22,
            username="developer",
            key_path="/home/user/.ssh/id_rsa",
            working_directory="/home/developer/projects",
            environment_vars={"NODE_ENV": "development"}
        )
        
        assert context.host == "192.168.1.100"
        assert context.port == 22
        assert context.username == "developer"
        assert context.key_path == "/home/user/.ssh/id_rsa"
        assert context.working_directory == "/home/developer/projects"
        assert context.environment_vars == {"NODE_ENV": "development"}
        assert context.connection_timeout == 30.0
        assert context.is_active is False
    
    def test_ssh_context_to_dict(self):
        """Test converting SSH context to dictionary."""
        now = datetime.now(timezone.utc)
        context = SSHContext(
            host="test-host",
            port=2222,
            username="testuser",
            last_verified=now,
            is_active=True
        )
        
        context_dict = context.to_dict()
        
        assert context_dict["host"] == "test-host"
        assert context_dict["port"] == 2222
        assert context_dict["username"] == "testuser"
        assert context_dict["last_verified"] == now.isoformat()
        assert context_dict["is_active"] is True
    
    def test_ssh_context_from_dict(self):
        """Test creating SSH context from dictionary."""
        now = datetime.now(timezone.utc)
        data = {
            "host": "test-host",
            "port": 2222,
            "username": "testuser",
            "key_path": "/path/to/key",
            "working_directory": "/home/test",
            "environment_vars": {"TEST": "value"},
            "connection_timeout": 45.0,
            "last_verified": now.isoformat(),
            "is_active": True
        }
        
        context = SSHContext.from_dict(data)
        
        assert context.host == "test-host"
        assert context.port == 2222
        assert context.username == "testuser"
        assert context.key_path == "/path/to/key"
        assert context.working_directory == "/home/test"
        assert context.environment_vars == {"TEST": "value"}
        assert context.connection_timeout == 45.0
        assert context.last_verified == now
        assert context.is_active is True


class TestCursorCommand:
    """Test Cursor command management."""
    
    def test_command_creation(self):
        """Test creating Cursor command."""
        command = CursorCommand(
            id="cmd_123",
            task_id="task_456",
            command_type=CommandType.PROMPT,
            content="Test command content",
            metadata={"priority": "high"}
        )
        
        assert command.id == "cmd_123"
        assert command.task_id == "task_456"
        assert command.command_type == CommandType.PROMPT
        assert command.content == "Test command content"
        assert command.metadata == {"priority": "high"}
        assert command.status == CommandStatus.QUEUED
        assert command.retry_count == 0
        assert command.max_retries == 3
        assert command.timeout_seconds == 300.0
    
    def test_command_to_dict(self):
        """Test converting command to dictionary."""
        now = datetime.now(timezone.utc)
        ssh_context = SSHContext(host="test-host")
        
        command = CursorCommand(
            id="cmd_123",
            task_id="task_456",
            command_type=CommandType.PROMPT,
            content="Test content",
            created_at=now,
            ssh_context=ssh_context
        )
        
        command_dict = command.to_dict()
        
        assert command_dict["id"] == "cmd_123"
        assert command_dict["task_id"] == "task_456"
        assert command_dict["command_type"] == "prompt"
        assert command_dict["content"] == "Test content"
        assert command_dict["status"] == "queued"
        assert command_dict["created_at"] == now.isoformat()
        assert command_dict["ssh_context"] is not None
    
    def test_command_is_expired(self):
        """Test command expiration check."""
        # Create command that started 10 minutes ago with 5 minute timeout
        past_time = datetime.now(timezone.utc) - timedelta(minutes=10)
        command = CursorCommand(
            id="cmd_123",
            task_id="task_456",
            command_type=CommandType.PROMPT,
            content="Test content",
            status=CommandStatus.PROCESSING,
            started_at=past_time,
            timeout_seconds=300.0  # 5 minutes
        )
        
        assert command.is_expired is True
        
        # Test non-expired command
        recent_time = datetime.now(timezone.utc) - timedelta(minutes=2)
        command.started_at = recent_time
        assert command.is_expired is False
        
        # Test queued command (not started)
        command.status = CommandStatus.QUEUED
        command.started_at = None
        assert command.is_expired is False
    
    def test_command_can_retry(self):
        """Test command retry eligibility."""
        command = CursorCommand(
            id="cmd_123",
            task_id="task_456",
            command_type=CommandType.PROMPT,
            content="Test content",
            status=CommandStatus.FAILED,
            retry_count=1,
            max_retries=3
        )
        
        assert command.can_retry is True
        
        # Test max retries reached
        command.retry_count = 3
        assert command.can_retry is False
        
        # Test completed command
        command.retry_count = 1
        command.status = CommandStatus.COMPLETED
        assert command.can_retry is False


class TestCursorService:
    """Test Cursor service functionality."""
    
    @pytest.fixture
    def cursor_service(self):
        """Create Cursor service for testing."""
        config = CursorConnectorConfig(
            connector_host="localhost",
            connector_port=8765,
            connection_timeout=5.0,
            command_timeout=10.0,
            max_retries=2,
            heartbeat_interval=5.0,
            queue_max_size=100
        )
        return CursorService(config)
    
    def test_service_initialization(self, cursor_service):
        """Test Cursor service initialization."""
        assert cursor_service.status == CursorStatus.DISCONNECTED
        assert cursor_service.is_connected is False
        assert cursor_service.queue_size == 0
        assert cursor_service.active_commands_count == 0
        assert cursor_service.config.connector_host == "localhost"
        assert cursor_service.config.connector_port == 8765
    
    @pytest.mark.asyncio
    async def test_send_command_validation_error(self, cursor_service):
        """Test sending invalid command."""
        with pytest.raises(ValidationError, match="Command content cannot be empty"):
            await cursor_service.send_command(
                task_id="task_123",
                command_type=CommandType.PROMPT,
                content=""
            )
    
    @pytest.mark.asyncio
    async def test_send_command_success(self, cursor_service):
        """Test sending valid command."""
        command_id = await cursor_service.send_command(
            task_id="task_123",
            command_type=CommandType.PROMPT,
            content="Test command",
            metadata={"priority": "high"}
        )
        
        assert command_id is not None
        assert cursor_service.queue_size == 1
        
        # Check command status
        command_status = await cursor_service.get_command_status(command_id)
        assert command_status is not None
        assert command_status["task_id"] == "task_123"
        assert command_status["command_type"] == "prompt"
        assert command_status["content"] == "Test command"
        assert command_status["status"] == "queued"
    
    @pytest.mark.asyncio
    async def test_send_command_queue_full(self, cursor_service):
        """Test sending command when queue is full."""
        # Fill the queue
        for i in range(cursor_service.config.queue_max_size):
            await cursor_service.send_command(
                task_id=f"task_{i}",
                command_type=CommandType.PROMPT,
                content=f"Command {i}"
            )
        
        # Try to add one more
        with pytest.raises(BusinessLogicError, match="Command queue is full"):
            await cursor_service.send_command(
                task_id="task_overflow",
                command_type=CommandType.PROMPT,
                content="Overflow command"
            )
    
    @pytest.mark.asyncio
    async def test_cancel_command(self, cursor_service):
        """Test cancelling commands."""
        # Add command to queue
        command_id = await cursor_service.send_command(
            task_id="task_123",
            command_type=CommandType.PROMPT,
            content="Test command"
        )
        
        # Cancel the command
        cancelled = await cursor_service.cancel_command(command_id)
        assert cancelled is True
        assert cursor_service.queue_size == 0
        
        # Try to cancel non-existent command
        cancelled = await cursor_service.cancel_command("non_existent")
        assert cancelled is False
    
    @pytest.mark.asyncio
    async def test_ssh_context_management(self, cursor_service):
        """Test SSH context operations."""
        # Add SSH context
        ssh_context = await cursor_service.add_ssh_context(
            context_id="test_context",
            host="192.168.1.100",
            port=22,
            username="testuser",
            working_directory="/home/test"
        )
        
        assert ssh_context.host == "192.168.1.100"
        assert ssh_context.port == 22
        assert ssh_context.username == "testuser"
        
        # Get SSH context
        retrieved_context = await cursor_service.get_ssh_context("test_context")
        assert retrieved_context is not None
        assert retrieved_context.host == "192.168.1.100"
        
        # Verify SSH context
        verified = await cursor_service.verify_ssh_context("test_context")
        assert verified is True
        assert retrieved_context.is_active is True
        
        # Remove SSH context
        removed = await cursor_service.remove_ssh_context("test_context")
        assert removed is True
        
        # Try to get removed context
        retrieved_context = await cursor_service.get_ssh_context("test_context")
        assert retrieved_context is None
    
    @pytest.mark.asyncio
    async def test_ssh_context_disabled(self, cursor_service):
        """Test SSH context operations when disabled."""
        cursor_service.config.enable_ssh_context = False
        
        with pytest.raises(BusinessLogicError, match="SSH context is disabled"):
            await cursor_service.add_ssh_context(
                context_id="test_context",
                host="192.168.1.100"
            )
    
    @pytest.mark.asyncio
    async def test_get_health_status(self, cursor_service):
        """Test getting health status."""
        health_status = await cursor_service.get_health_status()
        
        assert "status" in health_status
        assert "is_connected" in health_status
        assert "queue_size" in health_status
        assert "active_commands" in health_status
        assert "expired_commands" in health_status
        assert "ssh_contexts" in health_status
        assert "heartbeat_healthy" in health_status
        assert "config" in health_status
        
        assert health_status["status"] == "disconnected"
        assert health_status["is_connected"] is False
        assert health_status["queue_size"] == 0
        assert health_status["active_commands"] == 0
    
    @pytest.mark.asyncio
    async def test_service_lifecycle(self, cursor_service):
        """Test service start and stop."""
        # Start service
        await cursor_service.start()
        
        # Give it a moment to initialize
        await asyncio.sleep(0.1)
        
        # Check that background tasks are running
        assert cursor_service._connection_task is not None
        assert cursor_service._heartbeat_task is not None
        assert cursor_service._processing_task is not None
        
        # Stop service
        await cursor_service.stop()
        
        # Check that service is stopped
        assert cursor_service.status == CursorStatus.DISCONNECTED
        assert cursor_service.queue_size == 0
        assert cursor_service.active_commands_count == 0


class TestCursorServiceSingleton:
    """Test Cursor service singleton functionality."""
    
    def test_get_cursor_service(self):
        """Test getting global Cursor service instance."""
        service1 = get_cursor_service()
        service2 = get_cursor_service()
        
        assert service1 is service2  # Same instance
        assert isinstance(service1, CursorService)
    
    @pytest.mark.asyncio
    async def test_start_cursor_service(self):
        """Test starting global Cursor service."""
        await start_cursor_service()
        
        service = get_cursor_service()
        assert service._connection_task is not None
        
        # Cleanup
        await shutdown_cursor_service()
    
    @pytest.mark.asyncio
    async def test_shutdown_cursor_service(self):
        """Test shutting down global Cursor service."""
        # Start service first
        await start_cursor_service()
        
        # Shutdown service
        await shutdown_cursor_service()
        
        # Service should be reset
        from app.services.cursor_service import _cursor_service
        assert _cursor_service is None


class TestCursorServiceIntegration:
    """Integration tests for Cursor service."""
    
    @pytest.mark.asyncio
    @pytest.mark.integration
    async def test_command_processing_simulation(self):
        """Test simulated command processing workflow."""
        config = CursorConnectorConfig(
            connection_timeout=1.0,
            command_timeout=5.0,
            heartbeat_interval=1.0,
            queue_max_size=10
        )
        service = CursorService(config)
        
        try:
            # Start service
            await service.start()
            await asyncio.sleep(0.1)  # Let it initialize
            
            # Send a command
            command_id = await service.send_command(
                task_id="integration_test",
                command_type=CommandType.PROMPT,
                content="Integration test command"
            )
            
            # Wait for command to be processed
            max_wait = 10  # seconds
            wait_time = 0
            while wait_time < max_wait:
                command_status = await service.get_command_status(command_id)
                if command_status and command_status["status"] in ["completed", "failed"]:
                    break
                await asyncio.sleep(0.5)
                wait_time += 0.5
            
            # Check final status
            final_status = await service.get_command_status(command_id)
            assert final_status is not None
            assert final_status["status"] == "completed"
            assert final_status["response"] is not None
            
        finally:
            await service.stop()
    
    @pytest.mark.asyncio
    @pytest.mark.integration
    async def test_ssh_context_workflow(self):
        """Test complete SSH context workflow."""
        config = CursorConnectorConfig(enable_ssh_context=True)
        service = CursorService(config)
        
        try:
            # Add SSH context
            ssh_context = await service.add_ssh_context(
                context_id="integration_ssh",
                host="localhost",
                port=22,
                username="testuser"
            )
            
            assert ssh_context.host == "localhost"
            
            # Verify context
            verified = await service.verify_ssh_context("integration_ssh")
            assert verified is True
            
            # Use context in command
            command_id = await service.send_command(
                task_id="ssh_test",
                command_type=CommandType.SSH_CONTEXT,
                content="Test SSH command",
                ssh_context=ssh_context
            )
            
            assert command_id is not None
            
            # Check health status includes SSH context
            health = await service.get_health_status()
            assert health["ssh_contexts"] == 1
            
        finally:
            await service.stop() 