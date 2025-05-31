"""User Guidance System for SSH Remote Development

This module provides user-friendly guidance and feedback for SSH remote
development scenarios in Cursor Connector.
"""

import asyncio
import logging
from dataclasses import dataclass
from enum import Enum
from typing import Dict, List, Optional

from .ssh_support import SSHConnection, RemoteProject

logger = logging.getLogger(__name__)


class GuidanceLevel(Enum):
    """Guidance message levels"""
    INFO = "info"
    WARNING = "warning"
    ERROR = "error"
    SUCCESS = "success"


@dataclass
class GuidanceMessage:
    """Represents a user guidance message"""
    level: GuidanceLevel
    title: str
    message: str
    action_required: bool = False
    suggested_actions: List[str] = None
    technical_details: Optional[str] = None
    
    def __post_init__(self):
        if self.suggested_actions is None:
            self.suggested_actions = []


class SSHStatusChecker:
    """Checks SSH status and provides contextual information"""
    
    def __init__(self):
        self.last_check_results: Dict[str, any] = {}
        
    async def check_ssh_requirements(self, connection: Optional[SSHConnection] = None) -> Dict[str, any]:
        """Check SSH requirements and return status information"""
        status = {
            "ssh_available": await self._check_ssh_available(),
            "cursor_detected": await self._check_cursor_running(),
            "connection_valid": False,
            "remote_context": False
        }
        
        if connection:
            status["connection_valid"] = await self._test_connection(connection)
            status["remote_context"] = True
            
        self.last_check_results = status
        return status
        
    async def _check_ssh_available(self) -> bool:
        """Check if SSH is available on the system"""
        try:
            process = await asyncio.create_subprocess_exec(
                'ssh', '-V',
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE
            )
            await process.wait()
            return process.returncode == 0
        except FileNotFoundError:
            return False
        except Exception as e:
            logger.error(f"Error checking SSH availability: {e}")
            return False
            
    async def _check_cursor_running(self) -> bool:
        """Check if Cursor is currently running"""
        try:
            import psutil
            for proc in psutil.process_iter(['name']):
                if proc.info['name'] and 'cursor' in proc.info['name'].lower():
                    return True
            return False
        except Exception as e:
            logger.error(f"Error checking Cursor status: {e}")
            return False
            
    async def _test_connection(self, connection: SSHConnection) -> bool:
        """Test SSH connection validity"""
        try:
            cmd = [
                'ssh',
                '-o', 'ConnectTimeout=3',
                '-o', 'BatchMode=yes',
                '-o', 'StrictHostKeyChecking=no',
                '-p', str(connection.port),
                f"{connection.user}@{connection.host}",
                'echo "test"'
            ]
            
            process = await asyncio.create_subprocess_exec(
                *cmd,
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE
            )
            
            await asyncio.wait_for(process.communicate(), timeout=5.0)
            return process.returncode == 0
            
        except Exception as e:
            logger.debug(f"SSH connection test failed: {e}")
            return False


class UserGuidanceSystem:
    """Main user guidance system for SSH remote development"""
    
    def __init__(self):
        self.status_checker = SSHStatusChecker()
        self.guidance_history: List[GuidanceMessage] = []
        self.current_context: Optional[RemoteProject] = None
        
    async def analyze_current_situation(self, 
                                      remote_project: Optional[RemoteProject] = None,
                                      requested_operation: str = "general") -> List[GuidanceMessage]:
        """Analyze current situation and provide appropriate guidance"""
        
        self.current_context = remote_project
        messages = []
        
        # Check SSH status
        ssh_status = await self.status_checker.check_ssh_requirements(
            remote_project.ssh_connection if remote_project else None
        )
        
        # Generate guidance based on situation
        if not ssh_status["ssh_available"]:
            messages.append(self._create_ssh_not_available_guidance())
            
        if not ssh_status["cursor_detected"]:
            messages.append(self._create_cursor_not_running_guidance())
            
        if remote_project:
            if not ssh_status["connection_valid"]:
                messages.append(self._create_connection_invalid_guidance(remote_project))
            else:
                messages.append(self._create_remote_environment_ready_guidance(remote_project))
        else:
            if requested_operation in ["automation", "prompt_injection"]:
                messages.append(self._create_local_environment_guidance(requested_operation))
                
        # Add operation-specific guidance
        operation_guidance = await self._get_operation_specific_guidance(
            requested_operation, ssh_status, remote_project
        )
        messages.extend(operation_guidance)
        
        # Store in history
        self.guidance_history.extend(messages)
        
        return messages
        
    def _create_ssh_not_available_guidance(self) -> GuidanceMessage:
        """Create guidance for SSH not being available"""
        return GuidanceMessage(
            level=GuidanceLevel.ERROR,
            title="SSH Not Available",
            message="SSH is required for remote development but is not available on this system.",
            action_required=True,
            suggested_actions=[
                "Install OpenSSH client on your system",
                "Verify SSH is in your system PATH",
                "On Windows: Install OpenSSH through Windows Features or use Git Bash",
                "On macOS: SSH should be pre-installed, check your system",
                "On Linux: Install openssh-client package"
            ],
            technical_details="The SSH command could not be found or executed. Remote development requires SSH connectivity."
        )
        
    def _create_cursor_not_running_guidance(self) -> GuidanceMessage:
        """Create guidance for Cursor not running"""
        return GuidanceMessage(
            level=GuidanceLevel.WARNING,
            title="Cursor Not Detected",
            message="Cursor application is not currently running.",
            action_required=True,
            suggested_actions=[
                "Start Cursor application",
                "Connect to your remote SSH environment",
                "Open your project in Cursor via Remote-SSH"
            ],
            technical_details="Cursor process was not detected in the running applications."
        )
        
    def _create_connection_invalid_guidance(self, project: RemoteProject) -> GuidanceMessage:
        """Create guidance for invalid SSH connection"""
        connection = project.ssh_connection
        return GuidanceMessage(
            level=GuidanceLevel.ERROR,
            title="SSH Connection Failed",
            message=f"Cannot connect to {connection.user}@{connection.host}:{connection.port}",
            action_required=True,
            suggested_actions=[
                "Verify your SSH connection works manually",
                "Check your SSH key authentication",
                "Ensure the remote host is accessible",
                "Verify port and hostname are correct",
                "Check your network connectivity"
            ],
            technical_details=f"SSH connection test failed for {connection.user}@{connection.host}:{connection.port}"
        )
        
    def _create_remote_environment_ready_guidance(self, project: RemoteProject) -> GuidanceMessage:
        """Create guidance for ready remote environment"""
        connection = project.ssh_connection
        return GuidanceMessage(
            level=GuidanceLevel.SUCCESS,
            title="Remote Environment Ready",
            message=f"Connected to {project.name} at {connection.host}",
            action_required=False,
            suggested_actions=[
                "You can now use AI automation features",
                "Remote development environment is fully operational"
            ],
            technical_details=f"SSH connection verified for {connection.user}@{connection.host}:{connection.port}"
        )
        
    def _create_local_environment_guidance(self, operation: str) -> GuidanceMessage:
        """Create guidance for local environment operations"""
        return GuidanceMessage(
            level=GuidanceLevel.INFO,
            title="Local Development Mode",
            message="Operating in local development mode.",
            action_required=False,
            suggested_actions=[
                "All automation features are available for local projects",
                "To work with remote projects, connect via Remote-SSH in Cursor"
            ],
            technical_details="No remote SSH context detected, using local automation."
        )
        
    async def _get_operation_specific_guidance(self, 
                                             operation: str,
                                             ssh_status: Dict[str, any],
                                             remote_project: Optional[RemoteProject]) -> List[GuidanceMessage]:
        """Get guidance specific to the requested operation"""
        messages = []
        
        if operation == "prompt_injection":
            if remote_project and ssh_status["connection_valid"]:
                messages.append(GuidanceMessage(
                    level=GuidanceLevel.INFO,
                    title="Remote Prompt Injection Ready",
                    message="AI prompt injection is ready for remote environment.",
                    suggested_actions=[
                        "Ensure Cursor is focused on the remote project",
                        "The AI chat panel should be accessible via Cmd/Ctrl+L"
                    ]
                ))
            else:
                messages.append(GuidanceMessage(
                    level=GuidanceLevel.INFO,
                    title="Local Prompt Injection Ready",
                    message="AI prompt injection is ready for local environment.",
                    suggested_actions=[
                        "Ensure Cursor is focused and active",
                        "The AI chat panel should be accessible via Cmd/Ctrl+L"
                    ]
                ))
                
        elif operation == "response_extraction":
            if remote_project:
                messages.append(GuidanceMessage(
                    level=GuidanceLevel.INFO,
                    title="Remote Response Extraction",
                    message="Response extraction configured for remote environment.",
                    suggested_actions=[
                        "Responses will be extracted from remote Cursor session",
                        "Ensure clipboard access is available"
                    ]
                ))
                
        elif operation == "task_automation":
            if not ssh_status["cursor_detected"]:
                messages.append(GuidanceMessage(
                    level=GuidanceLevel.WARNING,
                    title="Cursor Required for Automation",
                    message="Task automation requires Cursor to be running.",
                    action_required=True,
                    suggested_actions=[
                        "Start Cursor application",
                        "Open your project (local or remote)",
                        "Retry the automation task"
                    ]
                ))
                
        return messages
        
    async def get_ssh_setup_guidance(self) -> List[GuidanceMessage]:
        """Provide comprehensive SSH setup guidance"""
        messages = []
        
        # Check current SSH status
        ssh_status = await self.status_checker.check_ssh_requirements()
        
        if not ssh_status["ssh_available"]:
            messages.append(GuidanceMessage(
                level=GuidanceLevel.ERROR,
                title="SSH Setup Required",
                message="SSH is not available on this system.",
                action_required=True,
                suggested_actions=[
                    "Install SSH client for your operating system",
                    "Windows: Enable OpenSSH Client feature or install Git Bash",
                    "macOS: SSH is pre-installed, verify with 'ssh -V'",
                    "Linux: Install openssh-client package"
                ],
                technical_details="SSH client is required for remote development features."
            ))
        else:
            messages.append(GuidanceMessage(
                level=GuidanceLevel.SUCCESS,
                title="SSH Available",
                message="SSH client is installed and available.",
                suggested_actions=[
                    "Configure SSH keys for passwordless authentication",
                    "Test your SSH connections manually",
                    "Set up SSH config file for easier connections"
                ]
            ))
            
        # Add Cursor-specific guidance
        if not ssh_status["cursor_detected"]:
            messages.append(GuidanceMessage(
                level=GuidanceLevel.INFO,
                title="Cursor Remote-SSH Setup",
                message="To use remote development features with Cursor:",
                suggested_actions=[
                    "Install Remote-SSH extension in Cursor",
                    "Use Cmd/Ctrl+Shift+P and search for 'Remote-SSH: Connect to Host'",
                    "Configure your SSH hosts in Cursor settings",
                    "Open remote folders using Remote-SSH"
                ],
                technical_details="Cursor Remote-SSH extension enables remote development workflows."
            ))
            
        return messages
        
    async def get_troubleshooting_guidance(self, error_type: str, 
                                         details: Optional[str] = None) -> List[GuidanceMessage]:
        """Provide troubleshooting guidance for specific errors"""
        messages = []
        
        if error_type == "ssh_connection_failed":
            messages.append(GuidanceMessage(
                level=GuidanceLevel.ERROR,
                title="SSH Connection Troubleshooting",
                message="SSH connection failed. Here are common solutions:",
                action_required=True,
                suggested_actions=[
                    "Verify the hostname and port are correct",
                    "Test SSH connection manually: ssh user@host",
                    "Check if SSH keys are properly configured",
                    "Verify the remote host is accessible",
                    "Check firewall and network settings",
                    "Ensure SSH service is running on remote host"
                ],
                technical_details=details or "SSH connection could not be established."
            ))
            
        elif error_type == "cursor_not_responsive":
            messages.append(GuidanceMessage(
                level=GuidanceLevel.WARNING,
                title="Cursor Not Responsive",
                message="Cursor application is not responding to automation.",
                action_required=True,
                suggested_actions=[
                    "Ensure Cursor is focused and active",
                    "Try clicking on the Cursor window",
                    "Check if any dialogs are blocking the interface",
                    "Restart Cursor if it appears frozen",
                    "Verify the AI panel is accessible"
                ],
                technical_details=details or "Cursor UI automation is not responding."
            ))
            
        elif error_type == "remote_path_invalid":
            messages.append(GuidanceMessage(
                level=GuidanceLevel.ERROR,
                title="Remote Path Issue",
                message="The remote project path is not accessible.",
                action_required=True,
                suggested_actions=[
                    "Verify the remote path exists",
                    "Check permissions for the remote directory",
                    "Ensure you're connected to the correct remote host",
                    "Try navigating to the path manually via SSH"
                ],
                technical_details=details or "Remote project path validation failed."
            ))
            
        return messages
        
    def get_guidance_summary(self) -> Dict[str, any]:
        """Get a summary of current guidance status"""
        if not self.guidance_history:
            return {"status": "no_guidance", "messages": []}
            
        recent_messages = self.guidance_history[-5:]  # Last 5 messages
        error_count = len([m for m in recent_messages if m.level == GuidanceLevel.ERROR])
        warning_count = len([m for m in recent_messages if m.level == GuidanceLevel.WARNING])
        
        status = "ready"
        if error_count > 0:
            status = "errors"
        elif warning_count > 0:
            status = "warnings"
            
        return {
            "status": status,
            "error_count": error_count,
            "warning_count": warning_count,
            "action_required": any(m.action_required for m in recent_messages),
            "messages": [
                {
                    "level": m.level.value,
                    "title": m.title,
                    "message": m.message,
                    "action_required": m.action_required,
                    "suggested_actions": m.suggested_actions
                }
                for m in recent_messages
            ]
        }
        
    def clear_guidance_history(self):
        """Clear the guidance message history"""
        self.guidance_history.clear()
        
    async def validate_remote_setup(self, connection: SSHConnection) -> Dict[str, any]:
        """Validate complete remote setup and return detailed status"""
        validation_results = {
            "ssh_available": False,
            "connection_valid": False,
            "cursor_detected": False,
            "remote_path_accessible": False,
            "overall_status": "failed"
        }
        
        # Check SSH availability
        validation_results["ssh_available"] = await self.status_checker._check_ssh_available()
        
        # Check Cursor
        validation_results["cursor_detected"] = await self.status_checker._check_cursor_running()
        
        # Test SSH connection
        if validation_results["ssh_available"]:
            validation_results["connection_valid"] = await self.status_checker._test_connection(connection)
            
        # Test remote path if specified
        if validation_results["connection_valid"] and connection.remote_path:
            validation_results["remote_path_accessible"] = await self._test_remote_path(
                connection, connection.remote_path
            )
            
        # Determine overall status
        if all([
            validation_results["ssh_available"],
            validation_results["connection_valid"],
            validation_results["cursor_detected"]
        ]):
            validation_results["overall_status"] = "ready"
        elif validation_results["ssh_available"] and validation_results["connection_valid"]:
            validation_results["overall_status"] = "partial"
        else:
            validation_results["overall_status"] = "failed"
            
        return validation_results
        
    async def _test_remote_path(self, connection: SSHConnection, remote_path: str) -> bool:
        """Test if remote path is accessible"""
        try:
            cmd = [
                'ssh',
                '-o', 'ConnectTimeout=3',
                '-o', 'BatchMode=yes',
                '-p', str(connection.port),
                f"{connection.user}@{connection.host}",
                f'test -d "{remote_path}" && echo "exists"'
            ]
            
            process = await asyncio.create_subprocess_exec(
                *cmd,
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE
            )
            
            stdout, _ = await asyncio.wait_for(process.communicate(), timeout=5.0)
            return process.returncode == 0 and b"exists" in stdout
            
        except Exception as e:
            logger.debug(f"Remote path test failed: {e}")
            return False 