"""
Cursor UI Automation Engine.

This package provides platform-specific automation capabilities for interacting
with the Cursor application, including:
- Application detection and activation
- Input injection (keyboard shortcuts, text input)
- Response extraction (clipboard monitoring, output capture)
- Window management and UI state detection
- Error detection and recovery
"""

from .cursor_detector import CursorDetector
from .input_injector import InputInjector
from .response_extractor import ResponseExtractor
from .window_manager import WindowManager
from .error_detector import ErrorDetector
from .automation_engine import AutomationEngine

__all__ = [
    "CursorDetector",
    "InputInjector", 
    "ResponseExtractor",
    "WindowManager",
    "ErrorDetector",
    "AutomationEngine",
] 