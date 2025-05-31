"""
Response Extraction Module.

This module provides functionality to extract AI responses from Cursor through
various methods including clipboard monitoring, text selection, and output capture.
"""

import asyncio
import time
import hashlib
from typing import Optional, List, Dict, Any, Callable
from datetime import datetime, timezone
from dataclasses import dataclass
from enum import Enum

from ..config.settings import get_settings, Platform
from ..utils.logging import get_logger


class ExtractionMethod(Enum):
    """Methods for extracting responses."""
    CLIPBOARD = "clipboard"
    TEXT_SELECTION = "text_selection"
    SCREEN_CAPTURE = "screen_capture"
    ACCESSIBILITY = "accessibility"


@dataclass
class ExtractedResponse:
    """Represents an extracted AI response."""
    content: str
    timestamp: datetime
    method: ExtractionMethod
    confidence: float  # 0.0 to 1.0
    metadata: Dict[str, Any] = None
    
    def __post_init__(self):
        if self.metadata is None:
            self.metadata = {}


@dataclass
class ClipboardState:
    """Represents clipboard state for monitoring."""
    content: str
    content_hash: str
    timestamp: datetime
    
    @classmethod
    def from_content(cls, content: str) -> "ClipboardState":
        """Create ClipboardState from content."""
        return cls(
            content=content,
            content_hash=hashlib.md5(content.encode()).hexdigest(),
            timestamp=datetime.now(timezone.utc)
        )


class ResponseExtractor:
    """
    Platform-specific response extraction from Cursor.
    
    Responsibilities:
    - Monitor clipboard for AI responses
    - Extract text through selection and copying
    - Detect when AI responses are complete
    - Filter and validate extracted content
    """
    
    def __init__(self):
        """Initialize the response extractor."""
        self.settings = get_settings()
        self.logger = get_logger(__name__)
        self.platform = self.settings.platform
        
        # State tracking
        self._last_clipboard_state: Optional[ClipboardState] = None
        self._monitoring_active = False
        self._response_callbacks: List[Callable[[ExtractedResponse], None]] = []
        
        # Response detection patterns
        self.ai_response_indicators = [
            "```",  # Code blocks
            "Here's",  # Common AI response starters
            "I'll help",
            "Let me",
            "To solve",
            "The solution",
            "You can",
            "Based on",
        ]
        
        # Content filters
        self.min_response_length = 10
        self.max_response_length = 50000
        
        self.logger.info(
            "Response extractor initialized",
            platform=self.platform.value,
            indicators=len(self.ai_response_indicators),
        )
    
    async def start_monitoring(self) -> bool:
        """
        Start monitoring for AI responses.
        
        Returns:
            bool: True if monitoring started successfully, False otherwise
        """
        try:
            if self._monitoring_active:
                self.logger.warning("Response monitoring is already active")
                return True
            
            # Initialize clipboard state
            initial_content = await self._get_clipboard_content()
            if initial_content:
                self._last_clipboard_state = ClipboardState.from_content(initial_content)
            
            self._monitoring_active = True
            
            # Start monitoring task
            asyncio.create_task(self._clipboard_monitoring_loop())
            
            self.logger.info("Response monitoring started")
            return True
            
        except Exception as e:
            self.logger.error("Error starting response monitoring", error=str(e))
            return False
    
    async def stop_monitoring(self):
        """Stop monitoring for AI responses."""
        self._monitoring_active = False
        self.logger.info("Response monitoring stopped")
    
    def add_response_callback(self, callback: Callable[[ExtractedResponse], None]):
        """Add a callback for when responses are extracted."""
        self._response_callbacks.append(callback)
    
    def remove_response_callback(self, callback: Callable[[ExtractedResponse], None]):
        """Remove a response callback."""
        if callback in self._response_callbacks:
            self._response_callbacks.remove(callback)
    
    async def extract_current_response(self, method: ExtractionMethod = ExtractionMethod.CLIPBOARD) -> Optional[ExtractedResponse]:
        """
        Extract the current AI response using the specified method.
        
        Args:
            method: Extraction method to use
            
        Returns:
            Optional[ExtractedResponse]: Extracted response or None if not found
        """
        try:
            if method == ExtractionMethod.CLIPBOARD:
                return await self._extract_from_clipboard()
            elif method == ExtractionMethod.TEXT_SELECTION:
                return await self._extract_from_selection()
            elif method == ExtractionMethod.SCREEN_CAPTURE:
                return await self._extract_from_screen()
            elif method == ExtractionMethod.ACCESSIBILITY:
                return await self._extract_from_accessibility()
            else:
                self.logger.error("Unsupported extraction method", method=method.value)
                return None
                
        except Exception as e:
            self.logger.error("Error extracting response", method=method.value, error=str(e))
            return None
    
    async def copy_and_extract_response(self) -> Optional[ExtractedResponse]:
        """
        Copy current selection and extract as response.
        
        Returns:
            Optional[ExtractedResponse]: Extracted response or None if failed
        """
        try:
            # Get current clipboard state
            old_clipboard = await self._get_clipboard_content()
            
            # Copy current selection
            success = await self._copy_selection()
            if not success:
                self.logger.error("Failed to copy selection")
                return None
            
            # Wait for clipboard to update
            await asyncio.sleep(0.2)
            
            # Get new clipboard content
            new_content = await self._get_clipboard_content()
            if not new_content or new_content == old_clipboard:
                self.logger.warning("No new content copied to clipboard")
                return None
            
            # Validate and create response
            response = self._create_response_from_content(
                new_content, 
                ExtractionMethod.TEXT_SELECTION
            )
            
            if response:
                self.logger.info("Response extracted via copy", length=len(response.content))
                await self._notify_callbacks(response)
            
            return response
            
        except Exception as e:
            self.logger.error("Error copying and extracting response", error=str(e))
            return None
    
    async def wait_for_response(self, timeout: float = 30.0) -> Optional[ExtractedResponse]:
        """
        Wait for an AI response to be detected.
        
        Args:
            timeout: Maximum time to wait in seconds
            
        Returns:
            Optional[ExtractedResponse]: Detected response or None if timeout
        """
        try:
            start_time = time.time()
            
            while time.time() - start_time < timeout:
                # Check for new clipboard content
                current_content = await self._get_clipboard_content()
                if current_content and self._last_clipboard_state:
                    if current_content != self._last_clipboard_state.content:
                        response = self._create_response_from_content(
                            current_content,
                            ExtractionMethod.CLIPBOARD
                        )
                        if response:
                            self._last_clipboard_state = ClipboardState.from_content(current_content)
                            return response
                
                await asyncio.sleep(0.5)  # Check every 500ms
            
            self.logger.warning("Timeout waiting for response", timeout=timeout)
            return None
            
        except Exception as e:
            self.logger.error("Error waiting for response", error=str(e))
            return None
    
    async def _clipboard_monitoring_loop(self):
        """Background task to monitor clipboard changes."""
        self.logger.info("Starting clipboard monitoring loop")
        
        while self._monitoring_active:
            try:
                current_content = await self._get_clipboard_content()
                
                if current_content and self._last_clipboard_state:
                    if current_content != self._last_clipboard_state.content:
                        # New clipboard content detected
                        response = self._create_response_from_content(
                            current_content,
                            ExtractionMethod.CLIPBOARD
                        )
                        
                        if response:
                            self._last_clipboard_state = ClipboardState.from_content(current_content)
                            await self._notify_callbacks(response)
                
                elif current_content and not self._last_clipboard_state:
                    # Initialize clipboard state
                    self._last_clipboard_state = ClipboardState.from_content(current_content)
                
                await asyncio.sleep(1.0)  # Check every second
                
            except asyncio.CancelledError:
                self.logger.info("Clipboard monitoring loop cancelled")
                break
            except Exception as e:
                self.logger.error("Error in clipboard monitoring loop", error=str(e))
                await asyncio.sleep(2.0)  # Back off on error
    
    def _create_response_from_content(self, content: str, method: ExtractionMethod) -> Optional[ExtractedResponse]:
        """Create an ExtractedResponse from content if it appears to be an AI response."""
        try:
            # Basic validation
            if not content or len(content) < self.min_response_length:
                return None
            
            if len(content) > self.max_response_length:
                self.logger.warning("Content too long, truncating", original_length=len(content))
                content = content[:self.max_response_length]
            
            # Calculate confidence based on AI response indicators
            confidence = self._calculate_response_confidence(content)
            
            # Only return if confidence is above threshold
            if confidence < 0.3:  # Minimum confidence threshold
                return None
            
            return ExtractedResponse(
                content=content,
                timestamp=datetime.now(timezone.utc),
                method=method,
                confidence=confidence,
                metadata={
                    "length": len(content),
                    "has_code": "```" in content,
                    "has_markdown": any(marker in content for marker in ["**", "*", "#", "-"]),
                }
            )
            
        except Exception as e:
            self.logger.error("Error creating response from content", error=str(e))
            return None
    
    def _calculate_response_confidence(self, content: str) -> float:
        """Calculate confidence that content is an AI response."""
        try:
            confidence = 0.0
            content_lower = content.lower()
            
            # Check for AI response indicators
            indicator_matches = sum(1 for indicator in self.ai_response_indicators 
                                  if indicator.lower() in content_lower)
            confidence += min(indicator_matches * 0.2, 0.6)
            
            # Check for code blocks
            if "```" in content:
                confidence += 0.3
            
            # Check for markdown formatting
            if any(marker in content for marker in ["**", "*", "#", "-", "1.", "2."]):
                confidence += 0.2
            
            # Check length (longer responses more likely to be AI)
            if len(content) > 100:
                confidence += 0.1
            if len(content) > 500:
                confidence += 0.1
            
            # Check for structured content
            if "\n\n" in content:  # Paragraphs
                confidence += 0.1
            
            return min(confidence, 1.0)
            
        except Exception as e:
            self.logger.error("Error calculating response confidence", error=str(e))
            return 0.0
    
    async def _notify_callbacks(self, response: ExtractedResponse):
        """Notify all registered callbacks of a new response."""
        for callback in self._response_callbacks:
            try:
                callback(response)
            except Exception as e:
                self.logger.error("Error in response callback", error=str(e))
    
    # Platform-specific implementations
    async def _get_clipboard_content(self) -> Optional[str]:
        """Get current clipboard content."""
        try:
            if self.platform == Platform.MACOS:
                return await self._get_macos_clipboard()
            elif self.platform == Platform.WINDOWS:
                return await self._get_windows_clipboard()
            elif self.platform == Platform.LINUX:
                return await self._get_linux_clipboard()
            else:
                self.logger.error("Unsupported platform for clipboard access")
                return None
                
        except Exception as e:
            self.logger.debug("Error getting clipboard content", error=str(e))
            return None
    
    async def _copy_selection(self) -> bool:
        """Copy current selection to clipboard."""
        try:
            if self.platform == Platform.MACOS:
                return await self._copy_macos_selection()
            elif self.platform == Platform.WINDOWS:
                return await self._copy_windows_selection()
            elif self.platform == Platform.LINUX:
                return await self._copy_linux_selection()
            else:
                self.logger.error("Unsupported platform for selection copying")
                return False
                
        except Exception as e:
            self.logger.error("Error copying selection", error=str(e))
            return False
    
    # macOS-specific implementations
    async def _get_macos_clipboard(self) -> Optional[str]:
        """Get clipboard content on macOS."""
        try:
            result = await asyncio.create_subprocess_exec(
                "pbpaste",
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE
            )
            stdout, _ = await result.communicate()
            
            if result.returncode == 0:
                return stdout.decode('utf-8', errors='ignore')
            
        except Exception as e:
            self.logger.debug("Error getting macOS clipboard", error=str(e))
        
        return None
    
    async def _copy_macos_selection(self) -> bool:
        """Copy selection on macOS using Cmd+C."""
        try:
            script = '''
            tell application "System Events"
                keystroke "c" using command down
            end tell
            '''
            
            result = await asyncio.create_subprocess_exec(
                "osascript", "-e", script,
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE
            )
            await result.communicate()
            
            return result.returncode == 0
            
        except Exception as e:
            self.logger.error("Error copying selection on macOS", error=str(e))
            return False
    
    # Extraction method implementations
    async def _extract_from_clipboard(self) -> Optional[ExtractedResponse]:
        """Extract response from clipboard."""
        content = await self._get_clipboard_content()
        if content:
            return self._create_response_from_content(content, ExtractionMethod.CLIPBOARD)
        return None
    
    async def _extract_from_selection(self) -> Optional[ExtractedResponse]:
        """Extract response by copying current selection."""
        return await self.copy_and_extract_response()
    
    async def _extract_from_screen(self) -> Optional[ExtractedResponse]:
        """Extract response from screen capture (OCR)."""
        # TODO: Implement screen capture and OCR
        self.logger.debug("Screen capture extraction not implemented")
        return None
    
    async def _extract_from_accessibility(self) -> Optional[ExtractedResponse]:
        """Extract response using accessibility APIs."""
        # TODO: Implement accessibility-based extraction
        self.logger.debug("Accessibility extraction not implemented")
        return None
    
    # Windows-specific implementations (stubs for future implementation)
    async def _get_windows_clipboard(self) -> Optional[str]:
        """Get clipboard content on Windows."""
        # TODO: Implement Windows clipboard access
        self.logger.debug("Windows clipboard access not implemented")
        return None
    
    async def _copy_windows_selection(self) -> bool:
        """Copy selection on Windows."""
        # TODO: Implement Windows selection copying
        self.logger.debug("Windows selection copying not implemented")
        return False
    
    # Linux-specific implementations (stubs for future implementation)
    async def _get_linux_clipboard(self) -> Optional[str]:
        """Get clipboard content on Linux."""
        # TODO: Implement Linux clipboard access
        self.logger.debug("Linux clipboard access not implemented")
        return None
    
    async def _copy_linux_selection(self) -> bool:
        """Copy selection on Linux."""
        # TODO: Implement Linux selection copying
        self.logger.debug("Linux selection copying not implemented")
        return False 