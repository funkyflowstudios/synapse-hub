"""
Error Detection Module.

This module provides functionality to detect when Cursor AI is unavailable,
encountering errors, or when automation should be paused or retried.
"""

import asyncio
import time
from typing import Optional, List, Dict, Any, Callable
from datetime import datetime, timezone, timedelta
from dataclasses import dataclass
from enum import Enum

from ..config.settings import get_settings, Platform
from ..utils.logging import get_logger


class ErrorType(Enum):
    """Types of errors that can be detected."""
    CURSOR_NOT_RESPONDING = "cursor_not_responding"
    AI_UNAVAILABLE = "ai_unavailable"
    RATE_LIMITED = "rate_limited"
    NETWORK_ERROR = "network_error"
    AUTHENTICATION_ERROR = "authentication_error"
    UI_CHANGED = "ui_changed"
    UNEXPECTED_DIALOG = "unexpected_dialog"
    CLIPBOARD_ERROR = "clipboard_error"
    AUTOMATION_BLOCKED = "automation_blocked"


class ErrorSeverity(Enum):
    """Severity levels for detected errors."""
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"


@dataclass
class DetectedError:
    """Represents a detected error."""
    error_type: ErrorType
    severity: ErrorSeverity
    message: str
    timestamp: datetime
    context: Dict[str, Any] = None
    suggested_action: Optional[str] = None
    retry_after: Optional[float] = None  # Seconds to wait before retry
    
    def __post_init__(self):
        if self.context is None:
            self.context = {}


@dataclass
class ErrorPattern:
    """Pattern for detecting specific errors."""
    name: str
    indicators: List[str]
    error_type: ErrorType
    severity: ErrorSeverity
    confidence_threshold: float = 0.7
    suggested_action: Optional[str] = None
    retry_after: Optional[float] = None


class ErrorDetector:
    """
    Platform-specific error detection for Cursor automation.
    
    Responsibilities:
    - Detect when Cursor AI is unavailable
    - Identify rate limiting and network errors
    - Detect UI changes that break automation
    - Monitor for unexpected dialogs or prompts
    - Suggest recovery actions
    """
    
    def __init__(self):
        """Initialize the error detector."""
        self.settings = get_settings()
        self.logger = get_logger(__name__)
        self.platform = self.settings.platform
        
        # Error detection patterns
        self.error_patterns = [
            ErrorPattern(
                name="AI Service Unavailable",
                indicators=[
                    "ai is currently unavailable",
                    "ai service is currently unavailable",
                    "service temporarily unavailable",
                    "unable to connect to ai",
                    "ai service error",
                    "model not available",
                ],
                error_type=ErrorType.AI_UNAVAILABLE,
                severity=ErrorSeverity.HIGH,
                confidence_threshold=0.15,  # Lower threshold for better detection
                suggested_action="Wait and retry",
                retry_after=30.0,
            ),
            ErrorPattern(
                name="Rate Limited",
                indicators=[
                    "rate limit exceeded",
                    "too many requests",
                    "quota exceeded",
                    "please wait before",
                    "rate limited",
                ],
                error_type=ErrorType.RATE_LIMITED,
                severity=ErrorSeverity.MEDIUM,
                confidence_threshold=0.2,  # Lower threshold for better detection
                suggested_action="Wait for rate limit reset",
                retry_after=60.0,
            ),
            ErrorPattern(
                name="Network Error",
                indicators=[
                    "network error",
                    "connection failed",
                    "timeout",
                    "unable to connect",
                    "no internet connection",
                ],
                error_type=ErrorType.NETWORK_ERROR,
                severity=ErrorSeverity.HIGH,
                suggested_action="Check network connection",
                retry_after=10.0,
            ),
            ErrorPattern(
                name="Authentication Error",
                indicators=[
                    "authentication failed",
                    "invalid api key",
                    "unauthorized",
                    "login required",
                    "session expired",
                ],
                error_type=ErrorType.AUTHENTICATION_ERROR,
                severity=ErrorSeverity.CRITICAL,
                suggested_action="Check authentication credentials",
                retry_after=None,
            ),
            ErrorPattern(
                name="Unexpected Dialog",
                indicators=[
                    "dialog",
                    "alert",
                    "confirm",
                    "warning",
                    "error message",
                ],
                error_type=ErrorType.UNEXPECTED_DIALOG,
                severity=ErrorSeverity.MEDIUM,
                suggested_action="Handle dialog and retry",
                retry_after=5.0,
            ),
        ]
        
        # State tracking
        self._monitoring_active = False
        self._error_callbacks: List[Callable[[DetectedError], None]] = []
        self._last_errors: List[DetectedError] = []
        self._error_history_limit = 50
        
        # Detection thresholds
        self.response_timeout = 30.0  # Seconds to wait for AI response
        self.ui_stability_timeout = 5.0  # Seconds to wait for UI to stabilize
        
        self.logger.info(
            "Error detector initialized",
            platform=self.platform.value,
            patterns=len(self.error_patterns),
        )
    
    async def start_monitoring(self) -> bool:
        """
        Start error monitoring.
        
        Returns:
            bool: True if monitoring started successfully, False otherwise
        """
        try:
            if self._monitoring_active:
                self.logger.warning("Error monitoring is already active")
                return True
            
            self._monitoring_active = True
            
            # Start monitoring tasks
            asyncio.create_task(self._error_monitoring_loop())
            
            self.logger.info("Error monitoring started")
            return True
            
        except Exception as e:
            self.logger.error("Error starting error monitoring", error=str(e))
            return False
    
    async def stop_monitoring(self):
        """Stop error monitoring."""
        self._monitoring_active = False
        self.logger.info("Error monitoring stopped")
    
    def add_error_callback(self, callback: Callable[[DetectedError], None]):
        """Add a callback for when errors are detected."""
        self._error_callbacks.append(callback)
    
    def remove_error_callback(self, callback: Callable[[DetectedError], None]):
        """Remove an error callback."""
        if callback in self._error_callbacks:
            self._error_callbacks.remove(callback)
    
    async def check_cursor_responsiveness(self) -> Optional[DetectedError]:
        """
        Check if Cursor is responding to automation.
        
        Returns:
            Optional[DetectedError]: Error if Cursor is not responding, None otherwise
        """
        try:
            # Try to get window information
            if self.platform == Platform.MACOS:
                responsive = await self._check_macos_responsiveness()
            elif self.platform == Platform.WINDOWS:
                responsive = await self._check_windows_responsiveness()
            elif self.platform == Platform.LINUX:
                responsive = await self._check_linux_responsiveness()
            else:
                self.logger.warning("Cannot check responsiveness on unsupported platform")
                return None
            
            if not responsive:
                return DetectedError(
                    error_type=ErrorType.CURSOR_NOT_RESPONDING,
                    severity=ErrorSeverity.HIGH,
                    message="Cursor application is not responding to automation",
                    timestamp=datetime.now(timezone.utc),
                    suggested_action="Restart Cursor application",
                    retry_after=10.0,
                )
            
            return None
            
        except Exception as e:
            self.logger.error("Error checking Cursor responsiveness", error=str(e))
            return DetectedError(
                error_type=ErrorType.CURSOR_NOT_RESPONDING,
                severity=ErrorSeverity.HIGH,
                message=f"Failed to check Cursor responsiveness: {str(e)}",
                timestamp=datetime.now(timezone.utc),
                suggested_action="Check Cursor installation and permissions",
            )
    
    async def check_ai_availability(self) -> Optional[DetectedError]:
        """
        Check if Cursor AI is available and responding.
        
        Returns:
            Optional[DetectedError]: Error if AI is unavailable, None otherwise
        """
        try:
            # This would involve checking for AI-specific indicators in the UI
            # For now, we'll use a simplified approach
            
            # Check for common AI unavailability indicators
            if self.platform == Platform.MACOS:
                ai_available = await self._check_macos_ai_availability()
            elif self.platform == Platform.WINDOWS:
                ai_available = await self._check_windows_ai_availability()
            elif self.platform == Platform.LINUX:
                ai_available = await self._check_linux_ai_availability()
            else:
                self.logger.warning("Cannot check AI availability on unsupported platform")
                return None
            
            if not ai_available:
                return DetectedError(
                    error_type=ErrorType.AI_UNAVAILABLE,
                    severity=ErrorSeverity.HIGH,
                    message="Cursor AI service appears to be unavailable",
                    timestamp=datetime.now(timezone.utc),
                    suggested_action="Wait for AI service to become available",
                    retry_after=30.0,
                )
            
            return None
            
        except Exception as e:
            self.logger.error("Error checking AI availability", error=str(e))
            return None
    
    async def detect_error_in_text(self, text: str) -> Optional[DetectedError]:
        """
        Detect errors in text content (e.g., from clipboard or UI).
        
        Args:
            text: Text to analyze for error indicators
            
        Returns:
            Optional[DetectedError]: Detected error or None if no error found
        """
        try:
            if not text:
                return None
            
            text_lower = text.lower()
            
            # Check against error patterns
            for pattern in self.error_patterns:
                matches = sum(1 for indicator in pattern.indicators 
                            if indicator.lower() in text_lower)
                confidence = matches / len(pattern.indicators) if pattern.indicators else 0
                
                if confidence >= pattern.confidence_threshold and matches > 0:
                    return DetectedError(
                        error_type=pattern.error_type,
                        severity=pattern.severity,
                        message=f"Detected {pattern.name}: {text[:200]}...",
                        timestamp=datetime.now(timezone.utc),
                        context={"pattern": pattern.name, "confidence": confidence},
                        suggested_action=pattern.suggested_action,
                        retry_after=pattern.retry_after,
                    )
            
            return None
            
        except Exception as e:
            self.logger.error("Error detecting error in text", error=str(e))
            return None
    
    async def wait_for_ai_response(self, timeout: float = None) -> Optional[DetectedError]:
        """
        Wait for AI response and detect timeout errors.
        
        Args:
            timeout: Maximum time to wait (uses default if None)
            
        Returns:
            Optional[DetectedError]: Timeout error if no response, None otherwise
        """
        try:
            if timeout is None:
                timeout = self.response_timeout
            
            start_time = time.time()
            
            while time.time() - start_time < timeout:
                # Check if AI has responded (this would be more sophisticated in practice)
                # For now, we'll simulate checking for response indicators
                
                await asyncio.sleep(1.0)
                
                # Check for error conditions
                error = await self.check_ai_availability()
                if error:
                    return error
            
            # Timeout reached
            return DetectedError(
                error_type=ErrorType.AI_UNAVAILABLE,
                severity=ErrorSeverity.MEDIUM,
                message=f"AI response timeout after {timeout} seconds",
                timestamp=datetime.now(timezone.utc),
                suggested_action="Retry request or check AI service status",
                retry_after=10.0,
            )
            
        except Exception as e:
            self.logger.error("Error waiting for AI response", error=str(e))
            return DetectedError(
                error_type=ErrorType.AI_UNAVAILABLE,
                severity=ErrorSeverity.HIGH,
                message=f"Error while waiting for AI response: {str(e)}",
                timestamp=datetime.now(timezone.utc),
            )
    
    def get_recent_errors(self, limit: int = 10) -> List[DetectedError]:
        """
        Get recent errors.
        
        Args:
            limit: Maximum number of errors to return
            
        Returns:
            List[DetectedError]: Recent errors
        """
        return self._last_errors[-limit:] if self._last_errors else []
    
    def get_error_statistics(self) -> Dict[str, Any]:
        """
        Get error statistics.
        
        Returns:
            Dict[str, Any]: Error statistics
        """
        try:
            if not self._last_errors:
                return {"total_errors": 0}
            
            # Count errors by type
            error_counts = {}
            for error in self._last_errors:
                error_type = error.error_type.value
                error_counts[error_type] = error_counts.get(error_type, 0) + 1
            
            # Count errors by severity
            severity_counts = {}
            for error in self._last_errors:
                severity = error.severity.value
                severity_counts[severity] = severity_counts.get(severity, 0) + 1
            
            # Recent error rate (last hour)
            one_hour_ago = datetime.now(timezone.utc) - timedelta(hours=1)
            recent_errors = [e for e in self._last_errors if e.timestamp > one_hour_ago]
            
            return {
                "total_errors": len(self._last_errors),
                "recent_errors_1h": len(recent_errors),
                "error_counts_by_type": error_counts,
                "error_counts_by_severity": severity_counts,
                "last_error_time": self._last_errors[-1].timestamp.isoformat() if self._last_errors else None,
            }
            
        except Exception as e:
            self.logger.error("Error getting error statistics", error=str(e))
            return {"error": str(e)}
    
    async def _error_monitoring_loop(self):
        """Background task to monitor for errors."""
        self.logger.info("Starting error monitoring loop")
        
        while self._monitoring_active:
            try:
                # Check Cursor responsiveness
                error = await self.check_cursor_responsiveness()
                if error:
                    await self._handle_detected_error(error)
                
                # Check AI availability
                error = await self.check_ai_availability()
                if error:
                    await self._handle_detected_error(error)
                
                await asyncio.sleep(10.0)  # Check every 10 seconds
                
            except asyncio.CancelledError:
                self.logger.info("Error monitoring loop cancelled")
                break
            except Exception as e:
                self.logger.error("Error in error monitoring loop", error=str(e))
                await asyncio.sleep(30.0)  # Back off on error
    
    async def _handle_detected_error(self, error: DetectedError):
        """Handle a detected error."""
        try:
            # Add to error history
            self._last_errors.append(error)
            if len(self._last_errors) > self._error_history_limit:
                self._last_errors = self._last_errors[-self._error_history_limit:]
            
            # Log the error
            self.logger.error(
                "Error detected",
                error_type=error.error_type.value,
                severity=error.severity.value,
                message=error.message,
                suggested_action=error.suggested_action,
            )
            
            # Notify callbacks
            for callback in self._error_callbacks:
                try:
                    callback(error)
                except Exception as e:
                    self.logger.error("Error in error callback", error=str(e))
                    
        except Exception as e:
            self.logger.error("Error handling detected error", error=str(e))
    
    # Platform-specific implementations
    async def _check_macos_responsiveness(self) -> bool:
        """Check Cursor responsiveness on macOS."""
        try:
            # Try to get process information
            script = '''
            tell application "System Events"
                set cursorRunning to (name of processes) contains "Cursor"
                return cursorRunning
            end tell
            '''
            
            result = await asyncio.create_subprocess_exec(
                "osascript", "-e", script,
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE
            )
            stdout, _ = await result.communicate()
            
            if result.returncode == 0:
                return stdout.decode().strip().lower() == "true"
            
            return False
            
        except Exception as e:
            self.logger.debug("Error checking macOS responsiveness", error=str(e))
            return False
    
    async def _check_macos_ai_availability(self) -> bool:
        """Check AI availability on macOS."""
        try:
            # This would involve more sophisticated UI inspection
            # For now, assume AI is available if Cursor is running
            return await self._check_macos_responsiveness()
            
        except Exception as e:
            self.logger.debug("Error checking macOS AI availability", error=str(e))
            return False
    
    # Windows-specific implementations (stubs for future implementation)
    async def _check_windows_responsiveness(self) -> bool:
        """Check Cursor responsiveness on Windows."""
        # TODO: Implement Windows responsiveness check
        self.logger.debug("Windows responsiveness check not implemented")
        return True
    
    async def _check_windows_ai_availability(self) -> bool:
        """Check AI availability on Windows."""
        # TODO: Implement Windows AI availability check
        self.logger.debug("Windows AI availability check not implemented")
        return True
    
    # Linux-specific implementations (stubs for future implementation)
    async def _check_linux_responsiveness(self) -> bool:
        """Check Cursor responsiveness on Linux."""
        # TODO: Implement Linux responsiveness check
        self.logger.debug("Linux responsiveness check not implemented")
        return True
    
    async def _check_linux_ai_availability(self) -> bool:
        """Check AI availability on Linux."""
        # TODO: Implement Linux AI availability check
        self.logger.debug("Linux AI availability check not implemented")
        return True 