"""SSH Support Module for Remote Development

This module provides SSH context awareness and remote development support
for Cursor Connector, enabling seamless integration with remote SSH environments.
"""

import asyncio
import json
import logging
import os
import re
import subprocess
import time
from dataclasses import dataclass, field
from pathlib import Path
from typing import Dict, List, Optional, Tuple, Union

import psutil

logger = logging.getLogger(__name__)


@dataclass
class SSHConnection:
    """Represents an active SSH connection in Cursor"""
    host: str
    user: str
    port: int = 22
    identity_file: Optional[str] = None
    remote_path: Optional[str] = None
    connection_name: Optional[str] = None
    is_active: bool = False
    last_checked: float = field(default_factory=time.time)


@dataclass
class RemoteProject:
    """Represents a remote project context"""
    name: str
    remote_path: str
    local_workspace_folder: Optional[str] = None
    ssh_connection: Optional[SSHConnection] = None
    is_cursor_connected: bool = False
    last_activity: float = field(default_factory=time.time)


class SSHContextDetector:
    """Detects SSH context and remote connections in Cursor"""
    
    def __init__(self):
        self.ssh_connections: Dict[str, SSHConnection] = {}
        self.remote_projects: Dict[str, RemoteProject] = {}
        self.cursor_config_paths = self._get_cursor_config_paths()
        self.ssh_config_paths = self._get_ssh_config_paths()
        
    def _get_cursor_config_paths(self) -> List[Path]:
        """Get possible Cursor configuration paths"""
        home = Path.home()
        config_paths = []
        
        # Common Cursor config locations
        if os.name == 'nt':  # Windows
            config_paths.extend([
                home / "AppData" / "Roaming" / "Cursor" / "User",
                home / "AppData" / "Local" / "Cursor" / "User"
            ])
        elif os.name == 'posix':  # macOS/Linux
            config_paths.extend([
                home / ".cursor",
                home / ".config" / "Cursor" / "User",
                home / "Library" / "Application Support" / "Cursor" / "User"
            ])
            
        return [path for path in config_paths if path.exists()]
    
    def _get_ssh_config_paths(self) -> List[Path]:
        """Get SSH configuration file paths"""
        home = Path.home()
        ssh_paths = [
            home / ".ssh" / "config",
            Path("/etc/ssh/ssh_config")
        ]
        return [path for path in ssh_paths if path.exists()]
    
    async def detect_ssh_connections(self) -> List[SSHConnection]:
        """Detect active SSH connections from system processes"""
        connections = []
        
        try:
            # Check for SSH processes
            for proc in psutil.process_iter(['pid', 'name', 'cmdline']):
                try:
                    if proc.info['name'] in ['ssh', 'ssh.exe']:
                        connection = self._parse_ssh_process(proc.info['cmdline'])
                        if connection:
                            connections.append(connection)
                except (psutil.NoSuchProcess, psutil.AccessDenied):
                    continue
                    
        except Exception as e:
            logger.error(f"Error detecting SSH connections: {e}")
            
        return connections
    
    def _parse_ssh_process(self, cmdline: List[str]) -> Optional[SSHConnection]:
        """Parse SSH process command line to extract connection info"""
        if not cmdline or len(cmdline) < 2:
            return None
            
        try:
            # Basic SSH command parsing
            host_arg = None
            port = 22
            user = None
            identity_file = None
            
            i = 1  # Skip 'ssh' command
            while i < len(cmdline):
                arg = cmdline[i]
                
                if arg == '-p' and i + 1 < len(cmdline):
                    port = int(cmdline[i + 1])
                    i += 2
                elif arg == '-i' and i + 1 < len(cmdline):
                    identity_file = cmdline[i + 1]
                    i += 2
                elif arg == '-l' and i + 1 < len(cmdline):
                    user = cmdline[i + 1]
                    i += 2
                elif not arg.startswith('-'):
                    host_arg = arg
                    break
                else:
                    i += 1
            
            if not host_arg:
                return None
                
            # Parse user@host format
            if '@' in host_arg:
                user_part, host = host_arg.split('@', 1)
                if not user:
                    user = user_part
            else:
                host = host_arg
                
            if not user:
                user = os.getenv('USER', 'unknown')
                
            return SSHConnection(
                host=host,
                user=user,
                port=port,
                identity_file=identity_file,
                is_active=True
            )
            
        except Exception as e:
            logger.error(f"Error parsing SSH process: {e}")
            return None
    
    async def detect_cursor_remote_sessions(self) -> List[RemoteProject]:
        """Detect Cursor remote SSH sessions"""
        remote_projects = []
        
        for config_path in self.cursor_config_paths:
            try:
                # Check for remote SSH workspace folders
                workspaces_file = config_path / "workspaceStorage"
                if workspaces_file.exists():
                    projects = await self._parse_cursor_workspaces(workspaces_file)
                    remote_projects.extend(projects)
                    
                # Check for remote SSH settings
                settings_file = config_path / "settings.json"
                if settings_file.exists():
                    settings_projects = await self._parse_cursor_settings(settings_file)
                    remote_projects.extend(settings_projects)
                    
            except Exception as e:
                logger.error(f"Error reading Cursor config from {config_path}: {e}")
                
        return remote_projects
    
    async def _parse_cursor_workspaces(self, workspaces_path: Path) -> List[RemoteProject]:
        """Parse Cursor workspace storage for remote projects"""
        projects = []
        
        try:
            if workspaces_path.is_dir():
                for workspace_dir in workspaces_path.iterdir():
                    if workspace_dir.is_dir():
                        workspace_file = workspace_dir / "workspace.json"
                        if workspace_file.exists():
                            project = await self._parse_workspace_file(workspace_file)
                            if project:
                                projects.append(project)
                                
        except Exception as e:
            logger.error(f"Error parsing Cursor workspaces: {e}")
            
        return projects
    
    async def _parse_workspace_file(self, workspace_file: Path) -> Optional[RemoteProject]:
        """Parse individual workspace file for remote SSH info"""
        try:
            with open(workspace_file, 'r', encoding='utf-8') as f:
                workspace_data = json.load(f)
                
            # Look for remote SSH indicators
            folder = workspace_data.get('folder')
            if not folder:
                return None
                
            uri = folder.get('uri', '')
            if not uri.startswith('vscode-remote://ssh-remote+'):
                return None
                
            # Parse SSH remote URI
            # Format: vscode-remote://ssh-remote+host/path
            match = re.match(r'vscode-remote://ssh-remote\+([^/]+)(/.*)?', uri)
            if not match:
                return None
                
            host_part = match.group(1)
            remote_path = match.group(2) or '/'
            
            # Parse host (might include user@host)
            if '@' in host_part:
                user, host = host_part.split('@', 1)
            else:
                host = host_part
                user = os.getenv('USER', 'unknown')
                
            ssh_connection = SSHConnection(
                host=host,
                user=user,
                remote_path=remote_path
            )
            
            project_name = workspace_data.get('name') or f"{user}@{host}:{remote_path}"
            
            return RemoteProject(
                name=project_name,
                remote_path=remote_path,
                ssh_connection=ssh_connection,
                is_cursor_connected=True
            )
            
        except Exception as e:
            logger.error(f"Error parsing workspace file {workspace_file}: {e}")
            return None
    
    async def _parse_cursor_settings(self, settings_file: Path) -> List[RemoteProject]:
        """Parse Cursor settings for remote SSH configuration"""
        projects = []
        
        try:
            with open(settings_file, 'r', encoding='utf-8') as f:
                settings = json.load(f)
                
            # Look for remote SSH settings
            remote_hosts = settings.get('remote.SSH.hosts', [])
            for host_config in remote_hosts:
                if isinstance(host_config, dict):
                    host = host_config.get('host')
                    user = host_config.get('user')
                    if host and user:
                        ssh_connection = SSHConnection(
                            host=host,
                            user=user,
                            port=host_config.get('port', 22)
                        )
                        
                        project = RemoteProject(
                            name=f"{user}@{host}",
                            remote_path=host_config.get('remotePath', '/'),
                            ssh_connection=ssh_connection
                        )
                        projects.append(project)
                        
        except Exception as e:
            logger.error(f"Error parsing Cursor settings: {e}")
            
        return projects


class SSHConnectionValidator:
    """Validates SSH connections and remote environment status"""
    
    def __init__(self):
        self.connection_cache: Dict[str, Tuple[bool, float]] = {}
        self.cache_ttl = 30.0  # Cache results for 30 seconds
        
    async def validate_connection(self, connection: SSHConnection) -> bool:
        """Validate if SSH connection is active and accessible"""
        cache_key = f"{connection.user}@{connection.host}:{connection.port}"
        
        # Check cache first
        if cache_key in self.connection_cache:
            is_valid, timestamp = self.connection_cache[cache_key]
            if time.time() - timestamp < self.cache_ttl:
                return is_valid
                
        # Test the connection
        is_valid = await self._test_ssh_connection(connection)
        
        # Update cache
        self.connection_cache[cache_key] = (is_valid, time.time())
        
        return is_valid
    
    async def _test_ssh_connection(self, connection: SSHConnection) -> bool:
        """Test SSH connection with a simple command"""
        try:
            cmd = [
                'ssh',
                '-o', 'ConnectTimeout=5',
                '-o', 'BatchMode=yes',
                '-o', 'StrictHostKeyChecking=no',
                '-p', str(connection.port)
            ]
            
            if connection.identity_file:
                cmd.extend(['-i', connection.identity_file])
                
            cmd.extend([
                f"{connection.user}@{connection.host}",
                'echo "connection_test"'
            ])
            
            process = await asyncio.create_subprocess_exec(
                *cmd,
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE
            )
            
            stdout, stderr = await asyncio.wait_for(
                process.communicate(), 
                timeout=10.0
            )
            
            return process.returncode == 0 and b"connection_test" in stdout
            
        except (asyncio.TimeoutError, subprocess.SubprocessError, FileNotFoundError) as e:
            logger.debug(f"SSH connection test failed for {connection.host}: {e}")
            return False
        except Exception as e:
            logger.error(f"Unexpected error testing SSH connection: {e}")
            return False
    
    async def validate_remote_path(self, connection: SSHConnection, remote_path: str) -> bool:
        """Validate that remote path exists and is accessible"""
        try:
            cmd = [
                'ssh',
                '-o', 'ConnectTimeout=5',
                '-o', 'BatchMode=yes',
                '-p', str(connection.port)
            ]
            
            if connection.identity_file:
                cmd.extend(['-i', connection.identity_file])
                
            cmd.extend([
                f"{connection.user}@{connection.host}",
                f'test -d "{remote_path}" && echo "path_exists"'
            ])
            
            process = await asyncio.create_subprocess_exec(
                *cmd,
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE
            )
            
            stdout, stderr = await asyncio.wait_for(
                process.communicate(),
                timeout=10.0
            )
            
            return process.returncode == 0 and b"path_exists" in stdout
            
        except Exception as e:
            logger.error(f"Error validating remote path {remote_path}: {e}")
            return False


class RemoteProjectTracker:
    """Tracks remote project context and changes"""
    
    def __init__(self):
        self.current_project: Optional[RemoteProject] = None
        self.project_history: List[RemoteProject] = []
        self.change_callbacks: List[callable] = []
        
    def add_change_callback(self, callback: callable):
        """Add callback for project context changes"""
        self.change_callbacks.append(callback)
        
    def remove_change_callback(self, callback: callable):
        """Remove project context change callback"""
        if callback in self.change_callbacks:
            self.change_callbacks.remove(callback)
            
    async def update_current_project(self, project: Optional[RemoteProject]):
        """Update current remote project context"""
        old_project = self.current_project
        self.current_project = project
        
        if project and project not in self.project_history:
            self.project_history.append(project)
            
        # Notify callbacks of context change
        if old_project != project:
            await self._notify_change_callbacks(old_project, project)
            
    async def _notify_change_callbacks(self, old_project: Optional[RemoteProject], 
                                     new_project: Optional[RemoteProject]):
        """Notify all callbacks of project context change"""
        for callback in self.change_callbacks:
            try:
                if asyncio.iscoroutinefunction(callback):
                    await callback(old_project, new_project)
                else:
                    callback(old_project, new_project)
            except Exception as e:
                logger.error(f"Error in project change callback: {e}")
                
    def get_current_context(self) -> Dict[str, any]:
        """Get current remote project context information"""
        if not self.current_project:
            return {"type": "local", "project": None}
            
        return {
            "type": "remote",
            "project": {
                "name": self.current_project.name,
                "remote_path": self.current_project.remote_path,
                "host": self.current_project.ssh_connection.host if self.current_project.ssh_connection else None,
                "user": self.current_project.ssh_connection.user if self.current_project.ssh_connection else None,
                "is_connected": self.current_project.is_cursor_connected
            }
        }


class SSHSupport:
    """Main SSH support coordinator"""
    
    def __init__(self):
        self.context_detector = SSHContextDetector()
        self.connection_validator = SSHConnectionValidator()
        self.project_tracker = RemoteProjectTracker()
        self.is_monitoring = False
        self.monitor_task: Optional[asyncio.Task] = None
        
    async def start_monitoring(self, interval: float = 10.0):
        """Start monitoring SSH context and connections"""
        if self.is_monitoring:
            return
            
        self.is_monitoring = True
        self.monitor_task = asyncio.create_task(
            self._monitor_loop(interval)
        )
        logger.info("SSH monitoring started")
        
    async def stop_monitoring(self):
        """Stop monitoring SSH context"""
        if not self.is_monitoring:
            return
            
        self.is_monitoring = False
        if self.monitor_task:
            self.monitor_task.cancel()
            try:
                await self.monitor_task
            except asyncio.CancelledError:
                pass
                
        logger.info("SSH monitoring stopped")
        
    async def _monitor_loop(self, interval: float):
        """Main monitoring loop for SSH context"""
        while self.is_monitoring:
            try:
                await self._update_ssh_context()
                await asyncio.sleep(interval)
            except asyncio.CancelledError:
                break
            except Exception as e:
                logger.error(f"Error in SSH monitoring loop: {e}")
                await asyncio.sleep(interval)
                
    async def _update_ssh_context(self):
        """Update SSH context information"""
        try:
            # Detect remote projects
            remote_projects = await self.context_detector.detect_cursor_remote_sessions()
            
            # Find current active project
            current_project = None
            for project in remote_projects:
                if project.is_cursor_connected and project.ssh_connection:
                    # Validate the connection
                    is_valid = await self.connection_validator.validate_connection(
                        project.ssh_connection
                    )
                    if is_valid:
                        current_project = project
                        break
                        
            # Update project tracker
            await self.project_tracker.update_current_project(current_project)
            
        except Exception as e:
            logger.error(f"Error updating SSH context: {e}")
            
    async def get_current_ssh_context(self) -> Dict[str, any]:
        """Get current SSH context"""
        return self.project_tracker.get_current_context()
        
    async def validate_current_connection(self) -> bool:
        """Validate current SSH connection"""
        current_project = self.project_tracker.current_project
        if not current_project or not current_project.ssh_connection:
            return False
            
        return await self.connection_validator.validate_connection(
            current_project.ssh_connection
        )
        
    async def is_remote_environment(self) -> bool:
        """Check if currently in a remote SSH environment"""
        context = await self.get_current_ssh_context()
        return context["type"] == "remote" and context["project"] is not None
        
    def add_context_change_callback(self, callback: callable):
        """Add callback for SSH context changes"""
        self.project_tracker.add_change_callback(callback)
        
    def remove_context_change_callback(self, callback: callable):
        """Remove SSH context change callback"""
        self.project_tracker.remove_change_callback(callback) 