"""
Window Management Module.

This module provides functionality to manage Cursor application windows,
handle different UI layouts, and adapt to various Cursor versions.
"""

import asyncio
from typing import Optional, List, Dict, Any, Tuple
from dataclasses import dataclass
from enum import Enum

from ..config.settings import get_settings, Platform
from ..utils.logging import get_logger


class WindowState(Enum):
    """Window states."""
    MINIMIZED = "minimized"
    NORMAL = "normal"
    MAXIMIZED = "maximized"
    FULLSCREEN = "fullscreen"
    HIDDEN = "hidden"


class CursorUILayout(Enum):
    """Known Cursor UI layouts."""
    STANDARD = "standard"
    COMPACT = "compact"
    SIDEBAR_LEFT = "sidebar_left"
    SIDEBAR_RIGHT = "sidebar_right"
    CHAT_FOCUSED = "chat_focused"
    EDITOR_FOCUSED = "editor_focused"


@dataclass
class WindowInfo:
    """Information about a window."""
    title: str
    position: Tuple[int, int]  # (x, y)
    size: Tuple[int, int]      # (width, height)
    state: WindowState
    is_focused: bool
    process_id: Optional[int] = None
    window_id: Optional[str] = None
    metadata: Dict[str, Any] = None
    
    def __post_init__(self):
        if self.metadata is None:
            self.metadata = {}


@dataclass
class CursorUIState:
    """State of Cursor UI."""
    layout: CursorUILayout
    chat_panel_visible: bool
    editor_panel_visible: bool
    sidebar_visible: bool
    terminal_visible: bool
    ai_chat_active: bool
    current_file: Optional[str] = None
    metadata: Dict[str, Any] = None
    
    def __post_init__(self):
        if self.metadata is None:
            self.metadata = {}


class WindowManager:
    """
    Platform-specific window management for Cursor application.
    
    Responsibilities:
    - Detect and manage Cursor windows
    - Handle different UI layouts and versions
    - Optimize window positioning for automation
    - Detect UI state changes
    """
    
    def __init__(self):
        """Initialize the window manager."""
        self.settings = get_settings()
        self.logger = get_logger(__name__)
        self.platform = self.settings.platform
        
        # UI detection patterns
        self.ui_indicators = {
            CursorUILayout.CHAT_FOCUSED: [
                "chat",
                "ai assistant",
                "conversation",
            ],
            CursorUILayout.EDITOR_FOCUSED: [
                "editor",
                "code",
                "file",
            ],
            CursorUILayout.SIDEBAR_LEFT: [
                "explorer",
                "files",
                "sidebar",
            ],
        }
        
        # Window title patterns for Cursor
        self.cursor_window_patterns = [
            "Cursor",
            "cursor",
            "Visual Studio Code",  # Cursor is based on VS Code
        ]
        
        self.logger.info(
            "Window manager initialized",
            platform=self.platform.value,
            patterns=len(self.cursor_window_patterns),
        )
    
    async def get_cursor_windows(self) -> List[WindowInfo]:
        """
        Get all Cursor application windows.
        
        Returns:
            List[WindowInfo]: List of Cursor windows
        """
        try:
            if self.platform == Platform.MACOS:
                return await self._get_macos_cursor_windows()
            elif self.platform == Platform.WINDOWS:
                return await self._get_windows_cursor_windows()
            elif self.platform == Platform.LINUX:
                return await self._get_linux_cursor_windows()
            else:
                self.logger.error("Unsupported platform for window management")
                return []
                
        except Exception as e:
            self.logger.error("Error getting Cursor windows", error=str(e))
            return []
    
    async def get_main_cursor_window(self) -> Optional[WindowInfo]:
        """
        Get the main Cursor window (usually the focused or largest one).
        
        Returns:
            Optional[WindowInfo]: Main Cursor window or None if not found
        """
        try:
            windows = await self.get_cursor_windows()
            if not windows:
                return None
            
            # Prefer focused window
            focused_windows = [w for w in windows if w.is_focused]
            if focused_windows:
                return focused_windows[0]
            
            # Prefer largest window
            largest_window = max(windows, key=lambda w: w.size[0] * w.size[1])
            return largest_window
            
        except Exception as e:
            self.logger.error("Error getting main Cursor window", error=str(e))
            return None
    
    async def detect_ui_layout(self) -> Optional[CursorUILayout]:
        """
        Detect the current Cursor UI layout.
        
        Returns:
            Optional[CursorUILayout]: Detected layout or None if unknown
        """
        try:
            main_window = await self.get_main_cursor_window()
            if not main_window:
                return None
            
            # Analyze window title and content
            title_lower = main_window.title.lower()
            
            # Check for specific layout indicators
            for layout, indicators in self.ui_indicators.items():
                if any(indicator in title_lower for indicator in indicators):
                    self.logger.info("Detected UI layout", layout=layout.value)
                    return layout
            
            # Default to standard layout
            return CursorUILayout.STANDARD
            
        except Exception as e:
            self.logger.error("Error detecting UI layout", error=str(e))
            return None
    
    async def get_ui_state(self) -> Optional[CursorUIState]:
        """
        Get the current Cursor UI state.
        
        Returns:
            Optional[CursorUIState]: Current UI state or None if unavailable
        """
        try:
            layout = await self.detect_ui_layout()
            if not layout:
                return None
            
            # Detect panel visibility (platform-specific)
            if self.platform == Platform.MACOS:
                ui_details = await self._get_macos_ui_details()
            elif self.platform == Platform.WINDOWS:
                ui_details = await self._get_windows_ui_details()
            elif self.platform == Platform.LINUX:
                ui_details = await self._get_linux_ui_details()
            else:
                ui_details = {}
            
            return CursorUIState(
                layout=layout,
                chat_panel_visible=ui_details.get("chat_visible", False),
                editor_panel_visible=ui_details.get("editor_visible", True),
                sidebar_visible=ui_details.get("sidebar_visible", True),
                terminal_visible=ui_details.get("terminal_visible", False),
                ai_chat_active=ui_details.get("ai_chat_active", False),
                current_file=ui_details.get("current_file"),
                metadata=ui_details,
            )
            
        except Exception as e:
            self.logger.error("Error getting UI state", error=str(e))
            return None
    
    async def optimize_window_for_automation(self) -> bool:
        """
        Optimize Cursor window positioning and size for automation.
        
        Returns:
            bool: True if optimization was successful, False otherwise
        """
        try:
            main_window = await self.get_main_cursor_window()
            if not main_window:
                self.logger.error("No main Cursor window found for optimization")
                return False
            
            # Ensure window is visible and not minimized
            if main_window.state == WindowState.MINIMIZED:
                success = await self.restore_window(main_window)
                if not success:
                    return False
            
            # Bring window to front
            success = await self.bring_window_to_front(main_window)
            if not success:
                return False
            
            # Optimize size if needed (ensure it's large enough for automation)
            min_width, min_height = 800, 600
            if main_window.size[0] < min_width or main_window.size[1] < min_height:
                new_width = max(main_window.size[0], min_width)
                new_height = max(main_window.size[1], min_height)
                success = await self.resize_window(main_window, (new_width, new_height))
                if not success:
                    self.logger.warning("Failed to resize window for optimization")
            
            self.logger.info("Window optimized for automation")
            return True
            
        except Exception as e:
            self.logger.error("Error optimizing window for automation", error=str(e))
            return False
    
    async def bring_window_to_front(self, window: WindowInfo) -> bool:
        """
        Bring a window to the front.
        
        Args:
            window: Window to bring to front
            
        Returns:
            bool: True if successful, False otherwise
        """
        try:
            if self.platform == Platform.MACOS:
                return await self._bring_macos_window_to_front(window)
            elif self.platform == Platform.WINDOWS:
                return await self._bring_windows_window_to_front(window)
            elif self.platform == Platform.LINUX:
                return await self._bring_linux_window_to_front(window)
            else:
                self.logger.error("Unsupported platform for window management")
                return False
                
        except Exception as e:
            self.logger.error("Error bringing window to front", error=str(e))
            return False
    
    async def restore_window(self, window: WindowInfo) -> bool:
        """
        Restore a minimized window.
        
        Args:
            window: Window to restore
            
        Returns:
            bool: True if successful, False otherwise
        """
        try:
            if self.platform == Platform.MACOS:
                return await self._restore_macos_window(window)
            elif self.platform == Platform.WINDOWS:
                return await self._restore_windows_window(window)
            elif self.platform == Platform.LINUX:
                return await self._restore_linux_window(window)
            else:
                self.logger.error("Unsupported platform for window restoration")
                return False
                
        except Exception as e:
            self.logger.error("Error restoring window", error=str(e))
            return False
    
    async def resize_window(self, window: WindowInfo, new_size: Tuple[int, int]) -> bool:
        """
        Resize a window.
        
        Args:
            window: Window to resize
            new_size: New size as (width, height)
            
        Returns:
            bool: True if successful, False otherwise
        """
        try:
            if self.platform == Platform.MACOS:
                return await self._resize_macos_window(window, new_size)
            elif self.platform == Platform.WINDOWS:
                return await self._resize_windows_window(window, new_size)
            elif self.platform == Platform.LINUX:
                return await self._resize_linux_window(window, new_size)
            else:
                self.logger.error("Unsupported platform for window resizing")
                return False
                
        except Exception as e:
            self.logger.error("Error resizing window", error=str(e))
            return False
    
    # macOS-specific implementations
    async def _get_macos_cursor_windows(self) -> List[WindowInfo]:
        """Get Cursor windows on macOS using AppleScript."""
        try:
            script = '''
            tell application "System Events"
                set cursorWindows to {}
                repeat with proc in (processes whose name contains "Cursor")
                    repeat with win in (windows of proc)
                        set windowInfo to {name of win, position of win, size of win}
                        set cursorWindows to cursorWindows & {windowInfo}
                    end repeat
                end repeat
                return cursorWindows
            end tell
            '''
            
            result = await asyncio.create_subprocess_exec(
                "osascript", "-e", script,
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE
            )
            stdout, _ = await result.communicate()
            
            windows = []
            if result.returncode == 0:
                # Parse AppleScript output (simplified)
                output = stdout.decode().strip()
                if output and output != "{}":
                    # This is a simplified parser - in practice, you'd need more robust parsing
                    windows.append(WindowInfo(
                        title="Cursor",
                        position=(100, 100),
                        size=(1200, 800),
                        state=WindowState.NORMAL,
                        is_focused=True,
                        metadata={"raw_output": output}
                    ))
            
            return windows
            
        except Exception as e:
            self.logger.error("Error getting macOS Cursor windows", error=str(e))
            return []
    
    async def _get_macos_ui_details(self) -> Dict[str, Any]:
        """Get UI details on macOS."""
        try:
            # This would use more sophisticated AppleScript or accessibility APIs
            # For now, return basic detection
            return {
                "chat_visible": True,
                "editor_visible": True,
                "sidebar_visible": True,
                "terminal_visible": False,
                "ai_chat_active": False,
            }
        except Exception as e:
            self.logger.debug("Error getting macOS UI details", error=str(e))
            return {}
    
    async def _bring_macos_window_to_front(self, window: WindowInfo) -> bool:
        """Bring window to front on macOS."""
        try:
            script = '''
            tell application "Cursor"
                activate
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
            self.logger.error("Error bringing macOS window to front", error=str(e))
            return False
    
    async def _restore_macos_window(self, window: WindowInfo) -> bool:
        """Restore macOS window."""
        try:
            # Use AppleScript to restore window
            script = '''
            tell application "System Events"
                tell process "Cursor"
                    set visible to true
                    set frontmost to true
                end tell
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
            self.logger.error("Error restoring macOS window", error=str(e))
            return False
    
    async def _resize_macos_window(self, window: WindowInfo, new_size: Tuple[int, int]) -> bool:
        """Resize macOS window."""
        try:
            width, height = new_size
            script = f'''
            tell application "System Events"
                tell process "Cursor"
                    tell window 1
                        set size to {{{width}, {height}}}
                    end tell
                end tell
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
            self.logger.error("Error resizing macOS window", error=str(e))
            return False
    
    # Windows-specific implementations (stubs for future implementation)
    async def _get_windows_cursor_windows(self) -> List[WindowInfo]:
        """Get Cursor windows on Windows."""
        # TODO: Implement Windows window detection
        self.logger.debug("Windows window detection not implemented")
        return []
    
    async def _get_windows_ui_details(self) -> Dict[str, Any]:
        """Get UI details on Windows."""
        # TODO: Implement Windows UI detection
        self.logger.debug("Windows UI detection not implemented")
        return {}
    
    async def _bring_windows_window_to_front(self, window: WindowInfo) -> bool:
        """Bring window to front on Windows."""
        # TODO: Implement Windows window management
        self.logger.debug("Windows window management not implemented")
        return False
    
    async def _restore_windows_window(self, window: WindowInfo) -> bool:
        """Restore Windows window."""
        # TODO: Implement Windows window restoration
        self.logger.debug("Windows window restoration not implemented")
        return False
    
    async def _resize_windows_window(self, window: WindowInfo, new_size: Tuple[int, int]) -> bool:
        """Resize Windows window."""
        # TODO: Implement Windows window resizing
        self.logger.debug("Windows window resizing not implemented")
        return False
    
    # Linux-specific implementations (stubs for future implementation)
    async def _get_linux_cursor_windows(self) -> List[WindowInfo]:
        """Get Cursor windows on Linux."""
        # TODO: Implement Linux window detection
        self.logger.debug("Linux window detection not implemented")
        return []
    
    async def _get_linux_ui_details(self) -> Dict[str, Any]:
        """Get UI details on Linux."""
        # TODO: Implement Linux UI detection
        self.logger.debug("Linux UI detection not implemented")
        return {}
    
    async def _bring_linux_window_to_front(self, window: WindowInfo) -> bool:
        """Bring window to front on Linux."""
        # TODO: Implement Linux window management
        self.logger.debug("Linux window management not implemented")
        return False
    
    async def _restore_linux_window(self, window: WindowInfo) -> bool:
        """Restore Linux window."""
        # TODO: Implement Linux window restoration
        self.logger.debug("Linux window restoration not implemented")
        return False
    
    async def _resize_linux_window(self, window: WindowInfo, new_size: Tuple[int, int]) -> bool:
        """Resize Linux window."""
        # TODO: Implement Linux window resizing
        self.logger.debug("Linux window resizing not implemented")
        return False 