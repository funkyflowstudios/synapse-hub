"""
Automation Engine Module.

This module provides the main automation engine that coordinates all UI automation
components to provide a unified interface for Cursor interaction.
"""

import asyncio
import time
from typing import Optional, Dict, Any, List, Callable
from datetime import datetime, timezone
from dataclasses import dataclass
from enum import Enum

from .cursor_detector import CursorDetector, CursorState
from .input_injector import InputInjector, KeyCombination, InputSequence
from .response_extractor import ResponseExtractor, ExtractedResponse, ExtractionMethod
from .window_manager import WindowManager, WindowInfo, CursorUIState
from .error_detector import ErrorDetector, DetectedError, ErrorType, ErrorSeverity
from .ssh_support import SSHSupport, RemoteProject
from .user_guidance import UserGuidanceSystem, GuidanceMessage
from .platform_support import CrossPlatformSupport, PlatformType, AutomationCapability

from ..config.settings import get_settings
from ..utils.logging import get_logger, task_context


class AutomationState(Enum):
    """Automation engine states."""
    IDLE = "idle"
    INITIALIZING = "initializing"
    READY = "ready"
    EXECUTING = "executing"
    WAITING_FOR_RESPONSE = "waiting_for_response"
    ERROR = "error"
    STOPPED = "stopped"


@dataclass
class AutomationResult:
    """Result of an automation operation."""
    success: bool
    message: str
    response: Optional[ExtractedResponse] = None
    error: Optional[DetectedError] = None
    execution_time: Optional[float] = None
    metadata: Dict[str, Any] = None
    
    def __post_init__(self):
        if self.metadata is None:
            self.metadata = {}


@dataclass
class AutomationTask:
    """Represents an automation task."""
    task_id: str
    prompt: str
    submit: bool = True
    wait_for_response: bool = True
    timeout: float = 30.0
    extraction_method: ExtractionMethod = ExtractionMethod.CLIPBOARD
    retry_count: int = 3
    metadata: Dict[str, Any] = None
    
    def __post_init__(self):
        if self.metadata is None:
            self.metadata = {}


class AutomationEngine:
    """
    Main automation engine for Cursor interaction.
    
    This class coordinates all automation components to provide a unified
    interface for interacting with the Cursor application.
    
    Responsibilities:
    - Coordinate all automation components
    - Manage automation state and lifecycle
    - Execute automation tasks with error handling
    - Provide high-level automation operations
    """
    
    def __init__(self):
        """Initialize the automation engine."""
        self.settings = get_settings()
        self.logger = get_logger(__name__)
        
        # Initialize components
        self.cursor_detector = CursorDetector()
        self.input_injector = InputInjector()
        self.response_extractor = ResponseExtractor()
        self.window_manager = WindowManager()
        self.error_detector = ErrorDetector()
        
        # SSH and remote development support
        self.ssh_support = SSHSupport()
        self.user_guidance = UserGuidanceSystem()
        
        # Cross-platform support
        self.platform_support = CrossPlatformSupport()
        
        # State management
        self.state = AutomationState.IDLE
        self._task_callbacks: List[Callable[[AutomationResult], None]] = []
        self._error_callbacks: List[Callable[[DetectedError], None]] = []
        
        # Performance tracking
        self._task_history: List[AutomationResult] = []
        self._performance_metrics = {
            "total_tasks": 0,
            "successful_tasks": 0,
            "failed_tasks": 0,
            "total_execution_time": 0.0,
            "average_execution_time": 0.0,
        }
        
        # SSH context change callback
        self.ssh_support.add_context_change_callback(self._on_ssh_context_change)
        
        self.logger.info("Automation engine initialized")
    
    async def initialize(self) -> bool:
        """
        Initialize the automation engine and all components.
        
        Returns:
            bool: True if initialization was successful, False otherwise
        """
        try:
            self.state = AutomationState.INITIALIZING
            self.logger.info("Initializing automation engine")
            
            # Start monitoring components
            await self.response_extractor.start_monitoring()
            await self.error_detector.start_monitoring()
            await self.ssh_support.start_monitoring()
            
            # Set up error callbacks
            self.error_detector.add_error_callback(self._handle_error)
            
            # Check Cursor availability
            cursor_state = await self.cursor_detector.detect_cursor_state()
            if cursor_state == CursorState.NOT_FOUND:
                self.logger.warning("Cursor not found during initialization")
                if not self.settings.mock_cursor:
                    self.state = AutomationState.ERROR
                    return False
            
            # Optimize window for automation
            await self.window_manager.optimize_window_for_automation()
            
            self.state = AutomationState.READY
            self.logger.info("Automation engine initialized successfully")
            return True
            
        except Exception as e:
            self.logger.error("Error initializing automation engine", error=str(e))
            self.state = AutomationState.ERROR
            return False
    
    async def shutdown(self):
        """Shutdown the automation engine and clean up resources."""
        try:
            self.logger.info("Shutting down automation engine")
            self.state = AutomationState.STOPPED
            
            # Stop monitoring
            await self.response_extractor.stop_monitoring()
            await self.error_detector.stop_monitoring()
            await self.ssh_support.stop_monitoring()
            
            self.logger.info("Automation engine shutdown complete")
            
        except Exception as e:
            self.logger.error("Error during automation engine shutdown", error=str(e))
    
    async def execute_prompt(self, prompt: str, submit: bool = True, wait_for_response: bool = True, 
                           timeout: float = 30.0) -> AutomationResult:
        """
        Execute a prompt in Cursor AI.
        
        Args:
            prompt: The prompt to send to Cursor AI
            submit: Whether to submit the prompt (send Enter)
            wait_for_response: Whether to wait for AI response
            timeout: Maximum time to wait for response
            
        Returns:
            AutomationResult: Result of the automation operation
        """
        task = AutomationTask(
            task_id=f"prompt_{int(time.time())}",
            prompt=prompt,
            submit=submit,
            wait_for_response=wait_for_response,
            timeout=timeout,
        )
        
        return await self.execute_task(task)
    
    async def execute_task(self, task: AutomationTask) -> AutomationResult:
        """
        Execute an automation task.
        
        Args:
            task: The automation task to execute
            
        Returns:
            AutomationResult: Result of the automation operation
        """
        start_time = time.time()
        
        with task_context(task_id=task.task_id):
            self.logger.info(
                "Executing automation task",
                task_id=task.task_id,
                prompt_length=len(task.prompt),
                submit=task.submit,
                wait_for_response=task.wait_for_response,
            )
            
            try:
                if self.state != AutomationState.READY:
                    return AutomationResult(
                        success=False,
                        message=f"Automation engine not ready (state: {self.state.value})",
                    )
                
                self.state = AutomationState.EXECUTING
                
                # Pre-execution checks
                pre_check_result = await self._pre_execution_checks()
                if not pre_check_result.success:
                    execution_time = time.time() - start_time
                    pre_check_result.execution_time = execution_time
                    self._add_to_history(pre_check_result)
                    return pre_check_result
                
                # Execute with retry logic
                last_result = None
                for attempt in range(task.retry_count):
                    try:
                        self.logger.info(f"Executing task attempt {attempt + 1}/{task.retry_count}")
                        
                        result = await self._execute_task_attempt(task, attempt + 1)
                        
                        if result.success:
                            execution_time = time.time() - start_time
                            result.execution_time = execution_time
                            self._add_to_history(result)
                            await self._notify_task_callbacks(result)
                            return result
                        
                        last_result = result
                        
                        # Check if we should retry
                        if attempt < task.retry_count - 1:
                            if result.error and result.error.retry_after:
                                wait_time = result.error.retry_after
                            else:
                                wait_time = 2.0 * (attempt + 1)  # Exponential backoff
                            
                            self.logger.warning(
                                f"Task attempt {attempt + 1} failed, retrying in {wait_time}s",
                                error=result.message,
                            )
                            await asyncio.sleep(wait_time)
                    
                    except Exception as e:
                        self.logger.error(f"Exception during task attempt {attempt + 1}", error=str(e))
                        last_result = AutomationResult(
                            success=False,
                            message=f"Exception during execution: {str(e)}",
                            error=DetectedError(
                                error_type=ErrorType.AUTOMATION_BLOCKED,
                                severity=ErrorSeverity.HIGH,
                                message=str(e),
                                timestamp=datetime.now(timezone.utc),
                            ),
                        )
                
                # All attempts failed
                execution_time = time.time() - start_time
                if last_result:
                    last_result.execution_time = execution_time
                    last_result.message = f"All {task.retry_count} attempts failed. Last error: {last_result.message}"
                else:
                    last_result = AutomationResult(
                        success=False,
                        message=f"All {task.retry_count} attempts failed with unknown error",
                        execution_time=execution_time,
                    )
                
                self._add_to_history(last_result)
                await self._notify_task_callbacks(last_result)
                return last_result
                
            except Exception as e:
                execution_time = time.time() - start_time
                self.logger.error("Error executing automation task", task_id=task.task_id, error=str(e))
                
                result = AutomationResult(
                    success=False,
                    message=f"Automation task failed: {str(e)}",
                    execution_time=execution_time,
                )
                
                self._add_to_history(result)
                self.state = AutomationState.ERROR
                return result
    
    async def _execute_task_attempt(self, task: AutomationTask, attempt: int) -> AutomationResult:
        """Execute a single attempt of an automation task."""
        try:
            # Ensure Cursor is focused and ready
            cursor_state = await self.cursor_detector.detect_cursor_state()
            if cursor_state != CursorState.FOUND_FOCUSED:
                success = await self.cursor_detector.activate_cursor()
                if not success:
                    return AutomationResult(
                        success=False,
                        message="Failed to activate Cursor application",
                        error=DetectedError(
                            error_type=ErrorType.CURSOR_NOT_RESPONDING,
                            severity=ErrorSeverity.HIGH,
                            message="Could not activate Cursor",
                            timestamp=datetime.now(timezone.utc),
                        ),
                    )
                
                # Wait for activation
                await asyncio.sleep(1.0)
            
            # Send the prompt
            success = await self.input_injector.send_cursor_prompt(task.prompt, task.submit)
            if not success:
                return AutomationResult(
                    success=False,
                    message="Failed to send prompt to Cursor",
                    error=DetectedError(
                        error_type=ErrorType.AUTOMATION_BLOCKED,
                        severity=ErrorSeverity.HIGH,
                        message="Could not inject prompt",
                        timestamp=datetime.now(timezone.utc),
                    ),
                )
            
            # If not waiting for response, return success
            if not task.wait_for_response:
                return AutomationResult(
                    success=True,
                    message="Prompt sent successfully (not waiting for response)",
                )
            
            # Wait for AI response
            self.state = AutomationState.WAITING_FOR_RESPONSE
            response = await self.response_extractor.wait_for_response(task.timeout)
            
            if response:
                return AutomationResult(
                    success=True,
                    message="Prompt executed and response received",
                    response=response,
                    metadata={
                        "response_length": len(response.content),
                        "response_confidence": response.confidence,
                        "extraction_method": response.method.value,
                    }
                )
            else:
                # Check for errors during wait
                error = await self.error_detector.wait_for_ai_response(task.timeout)
                return AutomationResult(
                    success=False,
                    message="No response received within timeout",
                    error=error,
                )
                
        except Exception as e:
            self.logger.error("Error in task attempt", attempt=attempt, error=str(e))
            return AutomationResult(
                success=False,
                message=f"Task attempt failed: {str(e)}",
            )
    
    async def _pre_execution_checks(self) -> AutomationResult:
        """Perform pre-execution checks."""
        try:
            # Check Cursor responsiveness
            error = await self.error_detector.check_cursor_responsiveness()
            if error:
                return AutomationResult(
                    success=False,
                    message="Cursor is not responding",
                    error=error,
                )
            
            # Check AI availability
            error = await self.error_detector.check_ai_availability()
            if error:
                return AutomationResult(
                    success=False,
                    message="Cursor AI is not available",
                    error=error,
                )
            
            return AutomationResult(success=True, message="Pre-execution checks passed")
            
        except Exception as e:
            return AutomationResult(
                success=False,
                message=f"Pre-execution checks failed: {str(e)}",
            )
    
    def add_task_callback(self, callback: Callable[[AutomationResult], None]):
        """Add a callback for task completion."""
        self._task_callbacks.append(callback)
    
    def remove_task_callback(self, callback: Callable[[AutomationResult], None]):
        """Remove a task callback."""
        if callback in self._task_callbacks:
            self._task_callbacks.remove(callback)
    
    def add_error_callback(self, callback: Callable[[DetectedError], None]):
        """Add a callback for error detection."""
        self._error_callbacks.append(callback)
    
    def remove_error_callback(self, callback: Callable[[DetectedError], None]):
        """Remove an error callback."""
        if callback in self._error_callbacks:
            self._error_callbacks.remove(callback)
    
    async def get_cursor_status(self) -> Dict[str, Any]:
        """
        Get comprehensive Cursor status information.
        
        Returns:
            Dict[str, Any]: Status information
        """
        try:
            cursor_state = await self.cursor_detector.detect_cursor_state()
            ui_state = await self.window_manager.get_ui_state()
            error_stats = self.error_detector.get_error_statistics()
            
            return {
                "automation_state": self.state.value,
                "cursor_state": cursor_state.value if cursor_state else "unknown",
                "ui_state": {
                    "layout": ui_state.layout.value if ui_state else "unknown",
                    "chat_visible": ui_state.chat_panel_visible if ui_state else False,
                    "ai_active": ui_state.ai_chat_active if ui_state else False,
                } if ui_state else {},
                "error_statistics": error_stats,
                "task_history_count": len(self._task_history),
                "last_task_time": self._task_history[-1].metadata.get("timestamp") if self._task_history else None,
            }
            
        except Exception as e:
            self.logger.error("Error getting Cursor status", error=str(e))
            return {"error": str(e)}
    
    def get_task_history(self, limit: int = 10) -> List[AutomationResult]:
        """
        Get recent task history.
        
        Args:
            limit: Maximum number of tasks to return
            
        Returns:
            List[AutomationResult]: Recent task results
        """
        return self._task_history[-limit:] if self._task_history else []
    
    def get_performance_metrics(self) -> Dict[str, Any]:
        """
        Get performance metrics.
        
        Returns:
            Dict[str, Any]: Performance metrics
        """
        try:
            if not self._task_history:
                return {
                    "total_tasks": 0,
                    "successful_tasks": 0,
                    "failed_tasks": 0,
                    "success_rate": 0.0,
                    "average_execution_time": 0.0,
                    "min_execution_time": 0.0,
                    "max_execution_time": 0.0,
                }
            
            successful_tasks = [t for t in self._task_history if t.success]
            failed_tasks = [t for t in self._task_history if not t.success]
            
            execution_times = [t.execution_time for t in self._task_history if t.execution_time]
            avg_execution_time = sum(execution_times) / len(execution_times) if execution_times else 0
            
            return {
                "total_tasks": len(self._task_history),
                "successful_tasks": len(successful_tasks),
                "failed_tasks": len(failed_tasks),
                "success_rate": len(successful_tasks) / len(self._task_history) if self._task_history else 0,
                "average_execution_time": avg_execution_time,
                "min_execution_time": min(execution_times) if execution_times else 0,
                "max_execution_time": max(execution_times) if execution_times else 0,
            }
            
        except Exception as e:
            self.logger.error("Error getting performance metrics", error=str(e))
            return {"error": str(e)}
    
    async def _notify_task_callbacks(self, result: AutomationResult):
        """Notify all task callbacks."""
        for callback in self._task_callbacks:
            try:
                callback(result)
            except Exception as e:
                self.logger.error("Error in task callback", error=str(e))
    
    def _handle_error(self, error: DetectedError):
        """Handle detected errors."""
        try:
            self.logger.warning(
                "Error detected by automation engine",
                error_type=error.error_type.value,
                severity=error.severity.value,
            )
            
            # Update state if critical error
            if error.severity.value in ["high", "critical"]:
                if self.state not in [AutomationState.STOPPED, AutomationState.ERROR]:
                    self.state = AutomationState.ERROR
            
            # Notify error callbacks
            for callback in self._error_callbacks:
                try:
                    callback(error)
                except Exception as e:
                    self.logger.error("Error in error callback", error=str(e))
                    
        except Exception as e:
            self.logger.error("Error handling detected error", error=str(e))
    
    def _add_to_history(self, result: AutomationResult):
        """Add result to task history."""
        try:
            # Add timestamp to metadata
            if result.metadata is None:
                result.metadata = {}
            result.metadata["timestamp"] = datetime.now(timezone.utc).isoformat()
            
            # Add to history
            self._task_history.append(result)
            
            # Trim history if needed
            if len(self._task_history) > 100:
                self._task_history = self._task_history[-100:]
                
            # Update metrics
            self._performance_metrics["total_tasks"] += 1
            if result.success:
                self._performance_metrics["successful_tasks"] += 1
            else:
                self._performance_metrics["failed_tasks"] += 1
            
            if result.execution_time:
                self._performance_metrics["total_execution_time"] += result.execution_time
                self._performance_metrics["average_execution_time"] = (
                    self._performance_metrics["total_execution_time"] / 
                    self._performance_metrics["total_tasks"]
                )
                
        except Exception as e:
            self.logger.error("Error adding result to history", error=str(e))
    
    # High-level convenience methods
    async def send_prompt_and_wait(self, prompt: str, timeout: float = 30.0) -> Optional[str]:
        """
        Send a prompt and return the AI response content.
        
        Args:
            prompt: The prompt to send
            timeout: Maximum time to wait for response
            
        Returns:
            Optional[str]: AI response content or None if failed
        """
        result = await self.execute_prompt(prompt, submit=True, wait_for_response=True, timeout=timeout)
        
        if result.success and result.response:
            return result.response.content
        
        return None
    
    async def check_cursor_health(self) -> bool:
        """
        Check if Cursor is healthy and ready for automation.
        
        Returns:
            bool: True if Cursor is healthy, False otherwise
        """
        try:
            # Check responsiveness
            error = await self.error_detector.check_cursor_responsiveness()
            if error:
                return False
            
            # Check AI availability
            error = await self.error_detector.check_ai_availability()
            if error:
                return False
            
            # Check cursor state
            cursor_state = await self.cursor_detector.detect_cursor_state()
            if cursor_state == CursorState.NOT_FOUND:
                return False
            
            return True
            
        except Exception as e:
            self.logger.error("Error checking Cursor health", error=str(e))
            return False
    
    # SSH and Remote Development Methods
    
    async def get_ssh_context(self) -> Dict[str, Any]:
        """
        Get current SSH context information.
        
        Returns:
            Dict[str, Any]: SSH context information
        """
        try:
            context = await self.ssh_support.get_current_ssh_context()
            guidance_summary = self.user_guidance.get_guidance_summary()
            
            return {
                "ssh_context": context,
                "guidance": guidance_summary,
                "is_remote": await self.ssh_support.is_remote_environment(),
                "connection_valid": await self.ssh_support.validate_current_connection() if context["type"] == "remote" else None
            }
            
        except Exception as e:
            self.logger.error("Error getting SSH context", error=str(e))
            return {"error": str(e)}
    
    async def validate_remote_setup(self) -> Dict[str, Any]:
        """
        Validate remote SSH setup and provide guidance.
        
        Returns:
            Dict[str, Any]: Validation results and guidance
        """
        try:
            # Get current SSH context
            context = await self.ssh_support.get_current_ssh_context()
            
            if context["type"] == "remote" and context["project"]:
                # We have a remote project, validate it
                current_project = self.ssh_support.project_tracker.current_project
                if current_project and current_project.ssh_connection:
                    validation_results = await self.user_guidance.validate_remote_setup(
                        current_project.ssh_connection
                    )
                    
                    # Get guidance messages based on validation
                    guidance_messages = await self.user_guidance.analyze_current_situation(
                        current_project, "task_automation"
                    )
                    
                    return {
                        "validation": validation_results,
                        "guidance": [
                            {
                                "level": msg.level.value,
                                "title": msg.title,
                                "message": msg.message,
                                "action_required": msg.action_required,
                                "suggested_actions": msg.suggested_actions
                            }
                            for msg in guidance_messages
                        ]
                    }
            
            # No remote context or local environment
            guidance_messages = await self.user_guidance.analyze_current_situation(
                None, "task_automation"
            )
            
            return {
                "validation": {"overall_status": "local"},
                "guidance": [
                    {
                        "level": msg.level.value,
                        "title": msg.title,
                        "message": msg.message,
                        "action_required": msg.action_required,
                        "suggested_actions": msg.suggested_actions
                    }
                    for msg in guidance_messages
                ]
            }
            
        except Exception as e:
            self.logger.error("Error validating remote setup", error=str(e))
            return {"error": str(e)}
    
    async def get_ssh_setup_guidance(self) -> List[Dict[str, Any]]:
        """
        Get comprehensive SSH setup guidance.
        
        Returns:
            List[Dict[str, Any]]: Setup guidance messages
        """
        try:
            guidance_messages = await self.user_guidance.get_ssh_setup_guidance()
            
            return [
                {
                    "level": msg.level.value,
                    "title": msg.title,
                    "message": msg.message,
                    "action_required": msg.action_required,
                    "suggested_actions": msg.suggested_actions,
                    "technical_details": msg.technical_details
                }
                for msg in guidance_messages
            ]
            
        except Exception as e:
            self.logger.error("Error getting SSH setup guidance", error=str(e))
            return [{"error": str(e)}]
    
    async def get_troubleshooting_guidance(self, error_type: str, details: Optional[str] = None) -> List[Dict[str, Any]]:
        """
        Get troubleshooting guidance for specific errors.
        
        Args:
            error_type: Type of error (ssh_connection_failed, cursor_not_responsive, etc.)
            details: Additional error details
            
        Returns:
            List[Dict[str, Any]]: Troubleshooting guidance messages
        """
        try:
            guidance_messages = await self.user_guidance.get_troubleshooting_guidance(error_type, details)
            
            return [
                {
                    "level": msg.level.value,
                    "title": msg.title,
                    "message": msg.message,
                    "action_required": msg.action_required,
                    "suggested_actions": msg.suggested_actions,
                    "technical_details": msg.technical_details
                }
                for msg in guidance_messages
            ]
            
        except Exception as e:
            self.logger.error("Error getting troubleshooting guidance", error=str(e))
            return [{"error": str(e)}]
    
    async def _on_ssh_context_change(self, old_project: Optional[RemoteProject], new_project: Optional[RemoteProject]):
        """Handle SSH context changes."""
        try:
            if old_project != new_project:
                context_type = "remote" if new_project else "local"
                project_name = new_project.name if new_project else "local"
                
                self.logger.info(
                    "SSH context changed",
                    old_project=old_project.name if old_project else "local",
                    new_project=project_name,
                    context_type=context_type
                )
                
                # Analyze new situation and provide guidance
                await self.user_guidance.analyze_current_situation(new_project, "context_change")
                
        except Exception as e:
            self.logger.error("Error handling SSH context change", error=str(e))
    
    # Cross-Platform Support Methods
    
    def get_platform_info(self) -> Dict[str, Any]:
        """
        Get current platform information and capabilities.
        
        Returns:
            Dict[str, Any]: Platform information
        """
        try:
            platform_info = self.platform_support.get_platform_info()
            
            return {
                "platform_type": platform_info.platform_type.value,
                "system": platform_info.system,
                "release": platform_info.release,
                "version": platform_info.version,
                "machine": platform_info.machine,
                "processor": platform_info.processor,
                "capabilities": [cap.value for cap in platform_info.capabilities],
                "tools_available": platform_info.tools_available,
                "automation_available": self.platform_support.get_automation() is not None
            }
            
        except Exception as e:
            self.logger.error("Error getting platform info", error=str(e))
            return {"error": str(e)}
    
    async def test_platform_capabilities(self) -> Dict[str, Any]:
        """
        Test all platform automation capabilities.
        
        Returns:
            Dict[str, Any]: Test results for each capability
        """
        try:
            test_results = await self.platform_support.test_automation_capabilities()
            
            return {
                "platform_type": self.platform_support.platform_info.platform_type.value,
                "test_results": test_results,
                "overall_status": "healthy" if all(test_results.values()) else "degraded"
            }
            
        except Exception as e:
            self.logger.error("Error testing platform capabilities", error=str(e))
            return {"error": str(e)}
    
    def get_platform_specific_paths(self) -> Dict[str, List[str]]:
        """
        Get platform-specific Cursor installation and configuration paths.
        
        Returns:
            Dict[str, List[str]]: Platform-specific paths
        """
        try:
            cursor_paths = self.platform_support.get_platform_specific_cursor_paths()
            config_paths = self.platform_support.get_platform_specific_config_paths()
            
            return {
                "cursor_installation_paths": [str(path) for path in cursor_paths],
                "cursor_config_paths": [str(path) for path in config_paths],
                "platform_type": self.platform_support.platform_info.platform_type.value
            }
            
        except Exception as e:
            self.logger.error("Error getting platform-specific paths", error=str(e))
            return {"error": str(e)}
    
    async def activate_cursor_platform_specific(self) -> bool:
        """
        Activate Cursor using platform-specific methods.
        
        Returns:
            bool: True if activation was successful, False otherwise
        """
        try:
            automation = self.platform_support.get_automation()
            if not automation:
                self.logger.warning("Platform automation not available")
                return False
            
            # Try different Cursor process names
            cursor_names = ["Cursor", "cursor", "cursor.exe"]
            
            for cursor_name in cursor_names:
                if await automation.activate_application(cursor_name):
                    self.logger.info(f"Successfully activated Cursor using {cursor_name}")
                    return True
            
            self.logger.warning("Failed to activate Cursor using platform-specific methods")
            return False
            
        except Exception as e:
            self.logger.error("Error activating Cursor with platform-specific methods", error=str(e))
            return False
    
    async def send_platform_specific_shortcut(self, shortcut: str) -> bool:
        """
        Send keyboard shortcut using platform-specific methods.
        
        Args:
            shortcut: Keyboard shortcut to send (e.g., "cmd+shift+p", "ctrl+c")
            
        Returns:
            bool: True if shortcut was sent successfully, False otherwise
        """
        try:
            automation = self.platform_support.get_automation()
            if not automation:
                self.logger.warning("Platform automation not available")
                return False
            
            success = await automation.send_keyboard_shortcut(shortcut)
            
            if success:
                self.logger.debug(f"Successfully sent shortcut: {shortcut}")
            else:
                self.logger.warning(f"Failed to send shortcut: {shortcut}")
            
            return success
            
        except Exception as e:
            self.logger.error(f"Error sending platform-specific shortcut {shortcut}", error=str(e))
            return False
    
    async def get_platform_clipboard_content(self) -> Optional[str]:
        """
        Get clipboard content using platform-specific methods.
        
        Returns:
            Optional[str]: Clipboard content or None if failed
        """
        try:
            automation = self.platform_support.get_automation()
            if not automation:
                self.logger.warning("Platform automation not available")
                return None
            
            content = await automation.get_clipboard_content()
            
            if content:
                self.logger.debug("Successfully retrieved clipboard content")
            else:
                self.logger.debug("No clipboard content available")
            
            return content
            
        except Exception as e:
            self.logger.error("Error getting platform clipboard content", error=str(e))
            return None
    
    async def set_platform_clipboard_content(self, content: str) -> bool:
        """
        Set clipboard content using platform-specific methods.
        
        Args:
            content: Content to set in clipboard
            
        Returns:
            bool: True if content was set successfully, False otherwise
        """
        try:
            automation = self.platform_support.get_automation()
            if not automation:
                self.logger.warning("Platform automation not available")
                return False
            
            success = await automation.set_clipboard_content(content)
            
            if success:
                self.logger.debug("Successfully set clipboard content")
            else:
                self.logger.warning("Failed to set clipboard content")
            
            return success
            
        except Exception as e:
            self.logger.error("Error setting platform clipboard content", error=str(e))
            return False
    
    async def get_platform_window_info(self) -> Dict[str, Any]:
        """
        Get window information using platform-specific methods.
        
        Returns:
            Dict[str, Any]: Window information
        """
        try:
            automation = self.platform_support.get_automation()
            if not automation:
                return {"error": "Platform automation not available"}
            
            # Get active window title
            active_title = await automation.get_active_window_title()
            
            # Find Cursor windows
            cursor_windows = await automation.find_windows_by_title("Cursor")
            
            # Check if Cursor is running
            cursor_running = await automation.is_application_running("Cursor")
            
            return {
                "active_window_title": active_title,
                "cursor_windows": cursor_windows,
                "cursor_running": cursor_running,
                "platform_type": self.platform_support.platform_info.platform_type.value
            }
            
        except Exception as e:
            self.logger.error("Error getting platform window info", error=str(e))
            return {"error": str(e)}
    
    def has_platform_capability(self, capability: str) -> bool:
        """
        Check if the current platform supports a specific automation capability.
        
        Args:
            capability: Capability name (e.g., "clipboard_access", "window_management")
            
        Returns:
            bool: True if capability is supported, False otherwise
        """
        try:
            # Convert string to AutomationCapability enum
            capability_enum = AutomationCapability(capability)
            return self.platform_support.has_capability(capability_enum)
            
        except (ValueError, Exception) as e:
            self.logger.warning(f"Invalid capability '{capability}' or error checking: {e}")
            return False
    
    def is_platform_tool_available(self, tool_name: str) -> bool:
        """
        Check if a specific platform tool is available.
        
        Args:
            tool_name: Tool name (e.g., "osascript", "powershell", "xdotool")
            
        Returns:
            bool: True if tool is available, False otherwise
        """
        try:
            return self.platform_support.is_tool_available(tool_name)
            
        except Exception as e:
            self.logger.error(f"Error checking tool availability for {tool_name}", error=str(e))
            return False 