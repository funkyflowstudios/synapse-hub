"""
Tests for SSH Support Module

This module tests SSH context detection, connection validation,
and remote development support functionality.
"""

import asyncio
import json
import os
import tempfile
import time
from pathlib import Path
from unittest.mock import AsyncMock, MagicMock, patch

import pytest

from src.automation.ssh_support import (
    SSHConnection,
    RemoteProject,
    SSHContextDetector,
    SSHConnectionValidator,
    RemoteProjectTracker,
    SSHSupport
)


class TestSSHConnection:
    """Test SSH connection data structure."""
    
    def test_ssh_connection_creation(self):
        """Test SSH connection creation with default values."""
        connection = SSHConnection(host="example.com", user="testuser")
        
        assert connection.host == "example.com"
        assert connection.user == "testuser"
        assert connection.port == 22
        assert connection.identity_file is None
        assert connection.remote_path is None
        assert connection.is_active is False
        assert isinstance(connection.last_checked, float)
    
    def test_ssh_connection_with_all_fields(self):
        """Test SSH connection with all fields specified."""
        connection = SSHConnection(
            host="example.com",
            user="testuser",
            port=2222,
            identity_file="/path/to/key",
            remote_path="/home/user/project",
            connection_name="test-connection",
            is_active=True
        )
        
        assert connection.host == "example.com"
        assert connection.user == "testuser"
        assert connection.port == 2222
        assert connection.identity_file == "/path/to/key"
        assert connection.remote_path == "/home/user/project"
        assert connection.connection_name == "test-connection"
        assert connection.is_active is True


class TestRemoteProject:
    """Test remote project data structure."""
    
    def test_remote_project_creation(self):
        """Test remote project creation."""
        ssh_connection = SSHConnection(host="example.com", user="testuser")
        project = RemoteProject(
            name="test-project",
            remote_path="/home/user/project",
            ssh_connection=ssh_connection
        )
        
        assert project.name == "test-project"
        assert project.remote_path == "/home/user/project"
        assert project.ssh_connection == ssh_connection
        assert project.local_workspace_folder is None
        assert project.is_cursor_connected is False
        assert isinstance(project.last_activity, float)


class TestSSHContextDetector:
    """Test SSH context detection functionality."""
    
    def setup_method(self):
        """Set up test fixtures."""
        self.detector = SSHContextDetector()
    
    def test_initialization(self):
        """Test detector initialization."""
        assert isinstance(self.detector.ssh_connections, dict)
        assert isinstance(self.detector.remote_projects, dict)
        assert isinstance(self.detector.cursor_config_paths, list)
        assert isinstance(self.detector.ssh_config_paths, list)
    
    @patch('src.automation.ssh_support.Path.home')
    @patch('src.automation.ssh_support.os.name', 'posix')
    def test_get_cursor_config_paths_posix(self, mock_home):
        """Test getting Cursor config paths on POSIX systems."""
        mock_home.return_value = Path("/home/user")
        
        with patch.object(Path, 'exists', return_value=True):
            paths = self.detector._get_cursor_config_paths()
            
        assert len(paths) > 0
        # Should include common POSIX paths
        path_strs = [str(p) for p in paths]
        assert any(".cursor" in path for path in path_strs)
    
    @patch('src.automation.ssh_support.Path.home')
    @patch('src.automation.ssh_support.os.name', 'nt')
    @patch('src.automation.ssh_support.Path')
    def test_get_cursor_config_paths_windows(self, mock_path_class, mock_home):
        """Test getting Cursor config paths on Windows."""
        # Mock Path class to avoid WindowsPath instantiation on macOS
        mock_path_instance = MagicMock()
        mock_path_instance.exists.return_value = True
        mock_path_class.return_value = mock_path_instance
        
        # Mock home directory
        mock_home_path = MagicMock()
        mock_home_path.__truediv__ = MagicMock(return_value=mock_path_instance)
        mock_home.return_value = mock_home_path
        
        # Test the method
        paths = self.detector._get_cursor_config_paths()
        
        # Verify that paths were returned
        assert isinstance(paths, list)
    
    @patch('psutil.process_iter')
    async def test_detect_ssh_connections(self, mock_process_iter):
        """Test detecting SSH connections from processes."""
        # Mock SSH process
        mock_proc = MagicMock()
        mock_proc.info = {
            'pid': 1234,
            'name': 'ssh',
            'cmdline': ['ssh', '-p', '2222', 'user@example.com']
        }
        mock_process_iter.return_value = [mock_proc]
        
        connections = await self.detector.detect_ssh_connections()
        
        assert len(connections) == 1
        connection = connections[0]
        assert connection.host == "example.com"
        assert connection.user == "user"
        assert connection.port == 2222
        assert connection.is_active is True
    
    def test_parse_ssh_process_basic(self):
        """Test parsing basic SSH process command line."""
        cmdline = ['ssh', 'user@example.com']
        connection = self.detector._parse_ssh_process(cmdline)
        
        assert connection is not None
        assert connection.host == "example.com"
        assert connection.user == "user"
        assert connection.port == 22
    
    def test_parse_ssh_process_with_port(self):
        """Test parsing SSH process with port."""
        cmdline = ['ssh', '-p', '2222', 'user@example.com']
        connection = self.detector._parse_ssh_process(cmdline)
        
        assert connection is not None
        assert connection.port == 2222
    
    def test_parse_ssh_process_with_identity_file(self):
        """Test parsing SSH process with identity file."""
        cmdline = ['ssh', '-i', '/path/to/key', 'user@example.com']
        connection = self.detector._parse_ssh_process(cmdline)
        
        assert connection is not None
        assert connection.identity_file == "/path/to/key"
    
    def test_parse_ssh_process_invalid(self):
        """Test parsing invalid SSH process command line."""
        cmdline = ['ssh']
        connection = self.detector._parse_ssh_process(cmdline)
        
        assert connection is None
    
    async def test_parse_workspace_file_remote_ssh(self):
        """Test parsing Cursor workspace file with remote SSH."""
        workspace_data = {
            "folder": {
                "uri": "vscode-remote://ssh-remote+user@example.com/home/user/project"
            },
            "name": "Test Project"
        }
        
        with tempfile.NamedTemporaryFile(mode='w', suffix='.json', delete=False) as f:
            json.dump(workspace_data, f)
            temp_path = Path(f.name)
        
        try:
            project = await self.detector._parse_workspace_file(temp_path)
            
            assert project is not None
            assert project.name == "Test Project"
            assert project.remote_path == "/home/user/project"
            assert project.ssh_connection.host == "example.com"
            assert project.ssh_connection.user == "user"
            assert project.is_cursor_connected is True
            
        finally:
            os.unlink(temp_path)
    
    async def test_parse_workspace_file_local(self):
        """Test parsing local workspace file."""
        workspace_data = {
            "folder": {
                "uri": "file:///local/project/path"
            }
        }
        
        with tempfile.NamedTemporaryFile(mode='w', suffix='.json', delete=False) as f:
            json.dump(workspace_data, f)
            temp_path = Path(f.name)
        
        try:
            project = await self.detector._parse_workspace_file(temp_path)
            assert project is None  # Should return None for local projects
            
        finally:
            os.unlink(temp_path)


class TestSSHConnectionValidator:
    """Test SSH connection validation."""
    
    def setup_method(self):
        """Set up test fixtures."""
        self.validator = SSHConnectionValidator()
    
    def test_initialization(self):
        """Test validator initialization."""
        assert isinstance(self.validator.connection_cache, dict)
        assert self.validator.cache_ttl == 30.0
    
    @patch('asyncio.create_subprocess_exec')
    async def test_validate_connection_success(self, mock_subprocess):
        """Test successful SSH connection validation."""
        # Mock successful SSH connection
        mock_process = AsyncMock()
        mock_process.returncode = 0
        mock_process.communicate.return_value = (b"connection_test\n", b"")
        mock_subprocess.return_value = mock_process
        
        connection = SSHConnection(host="example.com", user="testuser")
        is_valid = await self.validator.validate_connection(connection)
        
        assert is_valid is True
        
        # Check cache
        cache_key = "testuser@example.com:22"
        assert cache_key in self.validator.connection_cache
    
    @patch('asyncio.create_subprocess_exec')
    async def test_validate_connection_failure(self, mock_subprocess):
        """Test failed SSH connection validation."""
        # Mock failed SSH connection
        mock_process = AsyncMock()
        mock_process.returncode = 1
        mock_process.communicate.return_value = (b"", b"Connection refused")
        mock_subprocess.return_value = mock_process
        
        connection = SSHConnection(host="example.com", user="testuser")
        is_valid = await self.validator.validate_connection(connection)
        
        assert is_valid is False
    
    @patch('asyncio.create_subprocess_exec')
    async def test_validate_connection_timeout(self, mock_subprocess):
        """Test SSH connection validation timeout."""
        mock_subprocess.side_effect = asyncio.TimeoutError()
        
        connection = SSHConnection(host="example.com", user="testuser")
        is_valid = await self.validator.validate_connection(connection)
        
        assert is_valid is False
    
    async def test_validate_connection_cache(self):
        """Test connection validation cache."""
        connection = SSHConnection(host="example.com", user="testuser")
        cache_key = "testuser@example.com:22"
        
        # Add to cache
        self.validator.connection_cache[cache_key] = (True, time.time())
        
        # Should use cached result
        is_valid = await self.validator.validate_connection(connection)
        assert is_valid is True
    
    async def test_validate_connection_cache_expired(self):
        """Test expired cache entry."""
        connection = SSHConnection(host="example.com", user="testuser")
        cache_key = "testuser@example.com:22"
        
        # Add expired cache entry
        expired_time = time.time() - 60  # 60 seconds ago
        self.validator.connection_cache[cache_key] = (True, expired_time)
        
        with patch.object(self.validator, '_test_ssh_connection', return_value=False):
            is_valid = await self.validator.validate_connection(connection)
            assert is_valid is False
    
    @patch('asyncio.create_subprocess_exec')
    async def test_validate_remote_path_success(self, mock_subprocess):
        """Test successful remote path validation."""
        mock_process = AsyncMock()
        mock_process.returncode = 0
        mock_process.communicate.return_value = (b"path_exists\n", b"")
        mock_subprocess.return_value = mock_process
        
        connection = SSHConnection(host="example.com", user="testuser")
        is_valid = await self.validator.validate_remote_path(connection, "/home/user/project")
        
        assert is_valid is True
    
    @patch('asyncio.create_subprocess_exec')
    async def test_validate_remote_path_failure(self, mock_subprocess):
        """Test failed remote path validation."""
        mock_process = AsyncMock()
        mock_process.returncode = 1
        mock_process.communicate.return_value = (b"", b"Path not found")
        mock_subprocess.return_value = mock_process
        
        connection = SSHConnection(host="example.com", user="testuser")
        is_valid = await self.validator.validate_remote_path(connection, "/nonexistent/path")
        
        assert is_valid is False


class TestRemoteProjectTracker:
    """Test remote project tracking."""
    
    def setup_method(self):
        """Set up test fixtures."""
        self.tracker = RemoteProjectTracker()
    
    def test_initialization(self):
        """Test tracker initialization."""
        assert self.tracker.current_project is None
        assert isinstance(self.tracker.project_history, list)
        assert isinstance(self.tracker.change_callbacks, list)
    
    def test_add_remove_callbacks(self):
        """Test adding and removing callbacks."""
        callback = lambda old, new: None
        
        self.tracker.add_change_callback(callback)
        assert callback in self.tracker.change_callbacks
        
        self.tracker.remove_change_callback(callback)
        assert callback not in self.tracker.change_callbacks
    
    async def test_update_current_project(self):
        """Test updating current project."""
        ssh_connection = SSHConnection(host="example.com", user="testuser")
        project = RemoteProject(
            name="test-project",
            remote_path="/home/user/project",
            ssh_connection=ssh_connection
        )
        
        await self.tracker.update_current_project(project)
        
        assert self.tracker.current_project == project
        assert project in self.tracker.project_history
    
    async def test_update_current_project_with_callback(self):
        """Test updating current project with callback."""
        callback_called = False
        old_project_arg = None
        new_project_arg = None
        
        def callback(old_project, new_project):
            nonlocal callback_called, old_project_arg, new_project_arg
            callback_called = True
            old_project_arg = old_project
            new_project_arg = new_project
        
        self.tracker.add_change_callback(callback)
        
        ssh_connection = SSHConnection(host="example.com", user="testuser")
        project = RemoteProject(
            name="test-project",
            remote_path="/home/user/project",
            ssh_connection=ssh_connection
        )
        
        await self.tracker.update_current_project(project)
        
        assert callback_called is True
        assert old_project_arg is None
        assert new_project_arg == project
    
    def test_get_current_context_local(self):
        """Test getting current context for local environment."""
        context = self.tracker.get_current_context()
        
        assert context["type"] == "local"
        assert context["project"] is None
    
    def test_get_current_context_remote(self):
        """Test getting current context for remote environment."""
        ssh_connection = SSHConnection(host="example.com", user="testuser")
        project = RemoteProject(
            name="test-project",
            remote_path="/home/user/project",
            ssh_connection=ssh_connection,
            is_cursor_connected=True
        )
        
        self.tracker.current_project = project
        context = self.tracker.get_current_context()
        
        assert context["type"] == "remote"
        assert context["project"]["name"] == "test-project"
        assert context["project"]["remote_path"] == "/home/user/project"
        assert context["project"]["host"] == "example.com"
        assert context["project"]["user"] == "testuser"
        assert context["project"]["is_connected"] is True


class TestSSHSupport:
    """Test main SSH support coordinator."""
    
    def setup_method(self):
        """Set up test fixtures."""
        self.ssh_support = SSHSupport()
    
    def test_initialization(self):
        """Test SSH support initialization."""
        assert isinstance(self.ssh_support.context_detector, SSHContextDetector)
        assert isinstance(self.ssh_support.connection_validator, SSHConnectionValidator)
        assert isinstance(self.ssh_support.project_tracker, RemoteProjectTracker)
        assert self.ssh_support.is_monitoring is False
        assert self.ssh_support.monitor_task is None
    
    async def test_start_stop_monitoring(self):
        """Test starting and stopping SSH monitoring."""
        assert self.ssh_support.is_monitoring is False
        
        await self.ssh_support.start_monitoring(interval=0.1)
        assert self.ssh_support.is_monitoring is True
        assert self.ssh_support.monitor_task is not None
        
        # Let it run briefly
        await asyncio.sleep(0.05)
        
        await self.ssh_support.stop_monitoring()
        assert self.ssh_support.is_monitoring is False
    
    async def test_get_current_ssh_context_local(self):
        """Test getting SSH context for local environment."""
        context = await self.ssh_support.get_current_ssh_context()
        
        assert context["type"] == "local"
        assert context["project"] is None
    
    async def test_validate_current_connection_no_project(self):
        """Test validating connection with no current project."""
        is_valid = await self.ssh_support.validate_current_connection()
        assert is_valid is False
    
    async def test_is_remote_environment_local(self):
        """Test checking remote environment for local context."""
        is_remote = await self.ssh_support.is_remote_environment()
        assert is_remote is False
    
    def test_add_remove_context_change_callback(self):
        """Test adding and removing context change callbacks."""
        callback = lambda old, new: None
        
        self.ssh_support.add_context_change_callback(callback)
        assert callback in self.ssh_support.project_tracker.change_callbacks
        
        self.ssh_support.remove_context_change_callback(callback)
        assert callback not in self.ssh_support.project_tracker.change_callbacks
    
    @patch.object(SSHContextDetector, 'detect_cursor_remote_sessions')
    @patch.object(SSHConnectionValidator, 'validate_connection')
    async def test_update_ssh_context(self, mock_validate, mock_detect):
        """Test updating SSH context."""
        # Mock remote project detection
        ssh_connection = SSHConnection(host="example.com", user="testuser")
        remote_project = RemoteProject(
            name="test-project",
            remote_path="/home/user/project",
            ssh_connection=ssh_connection,
            is_cursor_connected=True
        )
        mock_detect.return_value = [remote_project]
        mock_validate.return_value = True
        
        # Call update method directly
        await self.ssh_support._update_ssh_context()
        
        # Check that project tracker was updated
        assert self.ssh_support.project_tracker.current_project == remote_project


# Integration Tests

class TestSSHSupportIntegration:
    """Integration tests for SSH support components."""
    
    def setup_method(self):
        """Set up test fixtures."""
        self.ssh_support = SSHSupport()
    
    @patch('psutil.process_iter')
    @patch('asyncio.create_subprocess_exec')
    async def test_full_remote_detection_workflow(self, mock_subprocess, mock_process_iter):
        """Test full workflow from process detection to validation."""
        # Mock SSH process detection
        mock_proc = MagicMock()
        mock_proc.info = {
            'pid': 1234,
            'name': 'ssh',
            'cmdline': ['ssh', 'user@example.com']
        }
        mock_process_iter.return_value = [mock_proc]
        
        # Mock SSH connection validation
        mock_process = AsyncMock()
        mock_process.returncode = 0
        mock_process.communicate.return_value = (b"connection_test\n", b"")
        mock_subprocess.return_value = mock_process
        
        # Detect SSH connections
        connections = await self.ssh_support.context_detector.detect_ssh_connections()
        assert len(connections) == 1
        
        # Validate connection
        is_valid = await self.ssh_support.connection_validator.validate_connection(connections[0])
        assert is_valid is True
    
    async def test_context_change_propagation(self):
        """Test that context changes propagate through the system."""
        callback_called = False
        context_args = []
        
        def context_callback(old_project, new_project):
            nonlocal callback_called, context_args
            callback_called = True
            context_args = [old_project, new_project]
        
        self.ssh_support.add_context_change_callback(context_callback)
        
        # Create and set a remote project
        ssh_connection = SSHConnection(host="example.com", user="testuser")
        project = RemoteProject(
            name="test-project",
            remote_path="/home/user/project",
            ssh_connection=ssh_connection
        )
        
        await self.ssh_support.project_tracker.update_current_project(project)
        
        assert callback_called is True
        assert context_args[0] is None  # old project
        assert context_args[1] == project  # new project


if __name__ == "__main__":
    pytest.main([__file__]) 