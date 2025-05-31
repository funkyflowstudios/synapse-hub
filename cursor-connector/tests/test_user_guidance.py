"""
Tests for User Guidance System

This module tests the user guidance system that provides feedback
about SSH setup, remote development, and troubleshooting.
"""

import asyncio
from unittest.mock import AsyncMock, MagicMock, patch

import pytest

from src.automation.user_guidance import (
    GuidanceLevel,
    GuidanceMessage,
    SSHStatusChecker,
    UserGuidanceSystem
)
from src.automation.ssh_support import SSHConnection, RemoteProject


class TestGuidanceLevel:
    """Test guidance level enumeration."""
    
    def test_guidance_levels(self):
        """Test all guidance levels are available."""
        assert GuidanceLevel.INFO.value == "info"
        assert GuidanceLevel.WARNING.value == "warning"
        assert GuidanceLevel.ERROR.value == "error"
        assert GuidanceLevel.SUCCESS.value == "success"


class TestGuidanceMessage:
    """Test guidance message data structure."""
    
    def test_guidance_message_creation(self):
        """Test creating a basic guidance message."""
        message = GuidanceMessage(
            level=GuidanceLevel.INFO,
            title="Test Title",
            message="Test message content"
        )
        
        assert message.level == GuidanceLevel.INFO
        assert message.title == "Test Title"
        assert message.message == "Test message content"
        assert message.action_required is False
        assert message.suggested_actions == []
        assert message.technical_details is None
    
    def test_guidance_message_with_all_fields(self):
        """Test creating a complete guidance message."""
        message = GuidanceMessage(
            level=GuidanceLevel.ERROR,
            title="Error Title",
            message="Error message",
            action_required=True,
            suggested_actions=["Action 1", "Action 2"],
            technical_details="Technical error details"
        )
        
        assert message.level == GuidanceLevel.ERROR
        assert message.title == "Error Title"
        assert message.message == "Error message"
        assert message.action_required is True
        assert message.suggested_actions == ["Action 1", "Action 2"]
        assert message.technical_details == "Technical error details"
    
    def test_guidance_message_post_init(self):
        """Test post-initialization behavior."""
        message = GuidanceMessage(
            level=GuidanceLevel.WARNING,
            title="Warning",
            message="Warning message",
            suggested_actions=None
        )
        
        # Should initialize empty list for suggested_actions
        assert message.suggested_actions == []


class TestSSHStatusChecker:
    """Test SSH status checking functionality."""
    
    def setup_method(self):
        """Set up test fixtures."""
        self.checker = SSHStatusChecker()
    
    def test_initialization(self):
        """Test status checker initialization."""
        assert isinstance(self.checker.last_check_results, dict)
    
    @patch('asyncio.create_subprocess_exec')
    async def test_check_ssh_available_success(self, mock_subprocess):
        """Test successful SSH availability check."""
        mock_process = AsyncMock()
        mock_process.returncode = 0
        mock_process.wait.return_value = 0
        mock_subprocess.return_value = mock_process
        
        is_available = await self.checker._check_ssh_available()
        assert is_available is True
    
    @patch('asyncio.create_subprocess_exec')
    async def test_check_ssh_available_not_found(self, mock_subprocess):
        """Test SSH not available."""
        mock_subprocess.side_effect = FileNotFoundError()
        
        is_available = await self.checker._check_ssh_available()
        assert is_available is False
    
    @patch('asyncio.create_subprocess_exec')
    async def test_check_ssh_available_error(self, mock_subprocess):
        """Test SSH availability check with error."""
        mock_process = AsyncMock()
        mock_process.returncode = 1
        mock_process.wait.return_value = 1
        mock_subprocess.return_value = mock_process
        
        is_available = await self.checker._check_ssh_available()
        assert is_available is False
    
    @patch('psutil.process_iter')
    async def test_check_cursor_running_found(self, mock_process_iter):
        """Test Cursor detection when running."""
        mock_proc = MagicMock()
        mock_proc.info = {'name': 'Cursor'}
        mock_process_iter.return_value = [mock_proc]
        
        is_running = await self.checker._check_cursor_running()
        assert is_running is True
    
    @patch('psutil.process_iter')
    async def test_check_cursor_running_not_found(self, mock_process_iter):
        """Test Cursor detection when not running."""
        mock_proc = MagicMock()
        mock_proc.info = {'name': 'some_other_process'}
        mock_process_iter.return_value = [mock_proc]
        
        is_running = await self.checker._check_cursor_running()
        assert is_running is False
    
    @patch('psutil.process_iter')
    async def test_check_cursor_running_error(self, mock_process_iter):
        """Test Cursor detection with error."""
        mock_process_iter.side_effect = Exception("Process error")
        
        is_running = await self.checker._check_cursor_running()
        assert is_running is False
    
    @patch('asyncio.create_subprocess_exec')
    async def test_test_connection_success(self, mock_subprocess):
        """Test successful SSH connection test."""
        mock_process = AsyncMock()
        mock_process.returncode = 0
        mock_process.communicate.return_value = (b"test\n", b"")
        mock_subprocess.return_value = mock_process
        
        connection = SSHConnection(host="example.com", user="testuser")
        is_valid = await self.checker._test_connection(connection)
        assert is_valid is True
    
    @patch('asyncio.create_subprocess_exec')
    async def test_test_connection_failure(self, mock_subprocess):
        """Test failed SSH connection test."""
        mock_process = AsyncMock()
        mock_process.returncode = 1
        mock_process.communicate.return_value = (b"", b"Connection refused")
        mock_subprocess.return_value = mock_process
        
        connection = SSHConnection(host="example.com", user="testuser")
        is_valid = await self.checker._test_connection(connection)
        assert is_valid is False
    
    @patch('asyncio.create_subprocess_exec')
    async def test_test_connection_timeout(self, mock_subprocess):
        """Test SSH connection test timeout."""
        mock_subprocess.side_effect = asyncio.TimeoutError()
        
        connection = SSHConnection(host="example.com", user="testuser")
        is_valid = await self.checker._test_connection(connection)
        assert is_valid is False
    
    async def test_check_ssh_requirements_no_connection(self):
        """Test checking SSH requirements without connection."""
        with patch.object(self.checker, '_check_ssh_available', return_value=True), \
             patch.object(self.checker, '_check_cursor_running', return_value=True):
            
            status = await self.checker.check_ssh_requirements()
            
            assert status["ssh_available"] is True
            assert status["cursor_detected"] is True
            assert status["connection_valid"] is False
            assert status["remote_context"] is False
    
    async def test_check_ssh_requirements_with_connection(self):
        """Test checking SSH requirements with connection."""
        connection = SSHConnection(host="example.com", user="testuser")
        
        with patch.object(self.checker, '_check_ssh_available', return_value=True), \
             patch.object(self.checker, '_check_cursor_running', return_value=True), \
             patch.object(self.checker, '_test_connection', return_value=True):
            
            status = await self.checker.check_ssh_requirements(connection)
            
            assert status["ssh_available"] is True
            assert status["cursor_detected"] is True
            assert status["connection_valid"] is True
            assert status["remote_context"] is True


class TestUserGuidanceSystem:
    """Test main user guidance system."""
    
    def setup_method(self):
        """Set up test fixtures."""
        self.guidance = UserGuidanceSystem()
    
    def test_initialization(self):
        """Test guidance system initialization."""
        assert isinstance(self.guidance.status_checker, SSHStatusChecker)
        assert isinstance(self.guidance.guidance_history, list)
        assert self.guidance.current_context is None
    
    async def test_analyze_situation_ssh_not_available(self):
        """Test analyzing situation when SSH is not available."""
        with patch.object(self.guidance.status_checker, 'check_ssh_requirements') as mock_check:
            mock_check.return_value = {
                "ssh_available": False,
                "cursor_detected": True,
                "connection_valid": False,
                "remote_context": False
            }
            
            messages = await self.guidance.analyze_current_situation()
            
            assert len(messages) > 0
            ssh_error_message = next((m for m in messages if "SSH Not Available" in m.title), None)
            assert ssh_error_message is not None
            assert ssh_error_message.level == GuidanceLevel.ERROR
            assert ssh_error_message.action_required is True
    
    async def test_analyze_situation_cursor_not_running(self):
        """Test analyzing situation when Cursor is not running."""
        with patch.object(self.guidance.status_checker, 'check_ssh_requirements') as mock_check:
            mock_check.return_value = {
                "ssh_available": True,
                "cursor_detected": False,
                "connection_valid": False,
                "remote_context": False
            }
            
            messages = await self.guidance.analyze_current_situation()
            
            cursor_warning = next((m for m in messages if "Cursor Not Detected" in m.title), None)
            assert cursor_warning is not None
            assert cursor_warning.level == GuidanceLevel.WARNING
    
    async def test_analyze_situation_remote_project_invalid(self):
        """Test analyzing situation with invalid remote project."""
        ssh_connection = SSHConnection(host="example.com", user="testuser")
        remote_project = RemoteProject(
            name="test-project",
            remote_path="/home/user/project",
            ssh_connection=ssh_connection
        )
        
        with patch.object(self.guidance.status_checker, 'check_ssh_requirements') as mock_check:
            mock_check.return_value = {
                "ssh_available": True,
                "cursor_detected": True,
                "connection_valid": False,
                "remote_context": True
            }
            
            messages = await self.guidance.analyze_current_situation(remote_project)
            
            connection_error = next((m for m in messages if "SSH Connection Failed" in m.title), None)
            assert connection_error is not None
            assert connection_error.level == GuidanceLevel.ERROR
    
    async def test_analyze_situation_remote_project_ready(self):
        """Test analyzing situation with ready remote project."""
        ssh_connection = SSHConnection(host="example.com", user="testuser")
        remote_project = RemoteProject(
            name="test-project",
            remote_path="/home/user/project",
            ssh_connection=ssh_connection
        )
        
        with patch.object(self.guidance.status_checker, 'check_ssh_requirements') as mock_check:
            mock_check.return_value = {
                "ssh_available": True,
                "cursor_detected": True,
                "connection_valid": True,
                "remote_context": True
            }
            
            messages = await self.guidance.analyze_current_situation(remote_project)
            
            ready_message = next((m for m in messages if "Remote Environment Ready" in m.title), None)
            assert ready_message is not None
            assert ready_message.level == GuidanceLevel.SUCCESS
    
    async def test_analyze_situation_local_environment(self):
        """Test analyzing situation for local environment."""
        with patch.object(self.guidance.status_checker, 'check_ssh_requirements') as mock_check:
            mock_check.return_value = {
                "ssh_available": True,
                "cursor_detected": True,
                "connection_valid": False,
                "remote_context": False
            }
            
            messages = await self.guidance.analyze_current_situation(None, "automation")
            
            local_message = next((m for m in messages if "Local Development Mode" in m.title), None)
            assert local_message is not None
            assert local_message.level == GuidanceLevel.INFO
    
    async def test_operation_specific_guidance_prompt_injection(self):
        """Test operation-specific guidance for prompt injection."""
        ssh_connection = SSHConnection(host="example.com", user="testuser")
        remote_project = RemoteProject(
            name="test-project",
            remote_path="/home/user/project",
            ssh_connection=ssh_connection
        )
        
        messages = await self.guidance._get_operation_specific_guidance(
            "prompt_injection",
            {"ssh_available": True, "cursor_detected": True, "connection_valid": True},
            remote_project
        )
        
        assert len(messages) == 1
        assert "Remote Prompt Injection Ready" in messages[0].title
    
    async def test_operation_specific_guidance_task_automation_no_cursor(self):
        """Test operation-specific guidance for task automation without Cursor."""
        messages = await self.guidance._get_operation_specific_guidance(
            "task_automation",
            {"ssh_available": True, "cursor_detected": False, "connection_valid": False},
            None
        )
        
        assert len(messages) == 1
        assert "Cursor Required for Automation" in messages[0].title
        assert messages[0].level == GuidanceLevel.WARNING
    
    async def test_get_ssh_setup_guidance_ssh_available(self):
        """Test SSH setup guidance when SSH is available."""
        with patch.object(self.guidance.status_checker, 'check_ssh_requirements') as mock_check:
            mock_check.return_value = {
                "ssh_available": True,
                "cursor_detected": True
            }
            
            messages = await self.guidance.get_ssh_setup_guidance()
            
            ssh_available = next((m for m in messages if "SSH Available" in m.title), None)
            assert ssh_available is not None
            assert ssh_available.level == GuidanceLevel.SUCCESS
    
    async def test_get_ssh_setup_guidance_ssh_not_available(self):
        """Test SSH setup guidance when SSH is not available."""
        with patch.object(self.guidance.status_checker, 'check_ssh_requirements') as mock_check:
            mock_check.return_value = {
                "ssh_available": False,
                "cursor_detected": True
            }
            
            messages = await self.guidance.get_ssh_setup_guidance()
            
            ssh_setup_required = next((m for m in messages if "SSH Setup Required" in m.title), None)
            assert ssh_setup_required is not None
            assert ssh_setup_required.level == GuidanceLevel.ERROR
            assert ssh_setup_required.action_required is True
    
    async def test_get_troubleshooting_guidance_ssh_connection_failed(self):
        """Test troubleshooting guidance for SSH connection failure."""
        messages = await self.guidance.get_troubleshooting_guidance(
            "ssh_connection_failed",
            "Connection timeout"
        )
        
        assert len(messages) == 1
        assert "SSH Connection Troubleshooting" in messages[0].title
        assert messages[0].level == GuidanceLevel.ERROR
        assert messages[0].technical_details == "Connection timeout"
    
    async def test_get_troubleshooting_guidance_cursor_not_responsive(self):
        """Test troubleshooting guidance for unresponsive Cursor."""
        messages = await self.guidance.get_troubleshooting_guidance("cursor_not_responsive")
        
        assert len(messages) == 1
        assert "Cursor Not Responsive" in messages[0].title
        assert messages[0].level == GuidanceLevel.WARNING
    
    async def test_get_troubleshooting_guidance_remote_path_invalid(self):
        """Test troubleshooting guidance for invalid remote path."""
        messages = await self.guidance.get_troubleshooting_guidance("remote_path_invalid")
        
        assert len(messages) == 1
        assert "Remote Path Issue" in messages[0].title
        assert messages[0].level == GuidanceLevel.ERROR
    
    def test_guidance_summary_no_messages(self):
        """Test guidance summary with no messages."""
        summary = self.guidance.get_guidance_summary()
        
        assert summary["status"] == "no_guidance"
        assert summary["messages"] == []
    
    def test_guidance_summary_with_messages(self):
        """Test guidance summary with messages."""
        # Add some test messages to history
        error_message = GuidanceMessage(
            level=GuidanceLevel.ERROR,
            title="Test Error",
            message="Test error message",
            action_required=True
        )
        warning_message = GuidanceMessage(
            level=GuidanceLevel.WARNING,
            title="Test Warning",
            message="Test warning message"
        )
        success_message = GuidanceMessage(
            level=GuidanceLevel.SUCCESS,
            title="Test Success",
            message="Test success message"
        )
        
        self.guidance.guidance_history.extend([error_message, warning_message, success_message])
        
        summary = self.guidance.get_guidance_summary()
        
        assert summary["status"] == "errors"  # Should be "errors" due to error message
        assert summary["error_count"] == 1
        assert summary["warning_count"] == 1
        assert summary["action_required"] is True
        assert len(summary["messages"]) == 3
    
    def test_clear_guidance_history(self):
        """Test clearing guidance history."""
        # Add a test message
        message = GuidanceMessage(
            level=GuidanceLevel.INFO,
            title="Test",
            message="Test message"
        )
        self.guidance.guidance_history.append(message)
        
        assert len(self.guidance.guidance_history) == 1
        
        self.guidance.clear_guidance_history()
        
        assert len(self.guidance.guidance_history) == 0
    
    async def test_validate_remote_setup_ready(self):
        """Test validating remote setup when ready."""
        connection = SSHConnection(host="example.com", user="testuser")
        
        with patch.object(self.guidance.status_checker, '_check_ssh_available', return_value=True), \
             patch.object(self.guidance.status_checker, '_check_cursor_running', return_value=True), \
             patch.object(self.guidance.status_checker, '_test_connection', return_value=True), \
             patch.object(self.guidance, '_test_remote_path', return_value=True):
            
            validation = await self.guidance.validate_remote_setup(connection)
            
            assert validation["ssh_available"] is True
            assert validation["cursor_detected"] is True
            assert validation["connection_valid"] is True
            assert validation["overall_status"] == "ready"
    
    async def test_validate_remote_setup_failed(self):
        """Test validating remote setup when failed."""
        connection = SSHConnection(host="example.com", user="testuser")
        
        with patch.object(self.guidance.status_checker, '_check_ssh_available', return_value=False), \
             patch.object(self.guidance.status_checker, '_check_cursor_running', return_value=False), \
             patch.object(self.guidance.status_checker, '_test_connection', return_value=False):
            
            validation = await self.guidance.validate_remote_setup(connection)
            
            assert validation["ssh_available"] is False
            assert validation["cursor_detected"] is False
            assert validation["connection_valid"] is False
            assert validation["overall_status"] == "failed"
    
    async def test_validate_remote_setup_partial(self):
        """Test validating remote setup when partially working."""
        connection = SSHConnection(host="example.com", user="testuser")
        
        with patch.object(self.guidance.status_checker, '_check_ssh_available', return_value=True), \
             patch.object(self.guidance.status_checker, '_check_cursor_running', return_value=False), \
             patch.object(self.guidance.status_checker, '_test_connection', return_value=True):
            
            validation = await self.guidance.validate_remote_setup(connection)
            
            assert validation["ssh_available"] is True
            assert validation["cursor_detected"] is False
            assert validation["connection_valid"] is True
            assert validation["overall_status"] == "partial"
    
    @patch('asyncio.create_subprocess_exec')
    async def test_test_remote_path_success(self, mock_subprocess):
        """Test successful remote path test."""
        mock_process = AsyncMock()
        mock_process.returncode = 0
        mock_process.communicate.return_value = (b"exists\n", b"")
        mock_subprocess.return_value = mock_process
        
        connection = SSHConnection(host="example.com", user="testuser")
        is_accessible = await self.guidance._test_remote_path(connection, "/home/user/project")
        
        assert is_accessible is True
    
    @patch('asyncio.create_subprocess_exec')
    async def test_test_remote_path_failure(self, mock_subprocess):
        """Test failed remote path test."""
        mock_process = AsyncMock()
        mock_process.returncode = 1
        mock_process.communicate.return_value = (b"", b"Path not found")
        mock_subprocess.return_value = mock_process
        
        connection = SSHConnection(host="example.com", user="testuser")
        is_accessible = await self.guidance._test_remote_path(connection, "/nonexistent/path")
        
        assert is_accessible is False
    
    @patch('asyncio.create_subprocess_exec')
    async def test_test_remote_path_timeout(self, mock_subprocess):
        """Test remote path test timeout."""
        mock_subprocess.side_effect = asyncio.TimeoutError()
        
        connection = SSHConnection(host="example.com", user="testuser")
        is_accessible = await self.guidance._test_remote_path(connection, "/home/user/project")
        
        assert is_accessible is False


# Integration Tests

class TestUserGuidanceIntegration:
    """Integration tests for user guidance system."""
    
    def setup_method(self):
        """Set up test fixtures."""
        self.guidance = UserGuidanceSystem()
    
    async def test_full_guidance_workflow_local_environment(self):
        """Test complete guidance workflow for local environment."""
        with patch.object(self.guidance.status_checker, 'check_ssh_requirements') as mock_check:
            mock_check.return_value = {
                "ssh_available": True,
                "cursor_detected": True,
                "connection_valid": False,
                "remote_context": False
            }
            
            # Analyze situation
            messages = await self.guidance.analyze_current_situation(None, "task_automation")
            
            # Should have local environment guidance
            local_guidance = next((m for m in messages if "Local Development Mode" in m.title), None)
            assert local_guidance is not None
            
            # Get guidance summary
            summary = self.guidance.get_guidance_summary()
            assert summary["status"] in ["ready", "warnings", "errors"]
            assert len(summary["messages"]) > 0
    
    async def test_full_guidance_workflow_remote_environment_problems(self):
        """Test complete guidance workflow for problematic remote environment."""
        ssh_connection = SSHConnection(host="example.com", user="testuser")
        remote_project = RemoteProject(
            name="test-project",
            remote_path="/home/user/project",
            ssh_connection=ssh_connection
        )
        
        with patch.object(self.guidance.status_checker, 'check_ssh_requirements') as mock_check:
            mock_check.return_value = {
                "ssh_available": False,
                "cursor_detected": False,
                "connection_valid": False,
                "remote_context": True
            }
            
            # Analyze situation
            messages = await self.guidance.analyze_current_situation(remote_project, "task_automation")
            
            # Should have multiple error/warning messages
            assert len(messages) >= 2
            
            # Should have SSH not available error
            ssh_error = next((m for m in messages if m.level == GuidanceLevel.ERROR), None)
            assert ssh_error is not None
            
            # Get troubleshooting guidance
            troubleshooting = await self.guidance.get_troubleshooting_guidance("ssh_connection_failed")
            assert len(troubleshooting) == 1
            
            # Check final summary
            summary = self.guidance.get_guidance_summary()
            assert summary["status"] == "errors"
            assert summary["error_count"] > 0
            assert summary["action_required"] is True


if __name__ == "__main__":
    pytest.main([__file__]) 