"""
Cursor Application Detection Module.

This module provides functionality to detect, locate, and activate the Cursor
application across different platforms.
"""

import asyncio
import subprocess
import psutil
from typing import Optional, List, Dict, Any
from pathlib import Path
from enum import Enum

from ..config.settings import get_settings, Platform
from ..utils.logging import get_logger


class CursorState(Enum):
    """Cursor application state."""
    NOT_FOUND = "not_found"
    FOUND_INACTIVE = "found_inactive"
    FOUND_ACTIVE = "found_active"
    FOUND_FOCUSED = "found_focused"


class CursorDetector:
    """
    Platform-specific Cursor application detection and activation.
    
    Responsibilities:
    - Detect if Cursor is installed and running
    - Activate and focus Cursor application
    - Get Cursor window information
    - Monitor Cursor process state
    """
    
    def __init__(self):
        """Initialize the Cursor detector."""
        self.settings = get_settings()
        self.logger = get_logger(__name__)
        self.platform = self.settings.platform
        
        # Platform-specific Cursor process names
        self.cursor_process_names = {
            Platform.MACOS: ["Cursor", "cursor"],
            Platform.WINDOWS: ["Cursor.exe", "cursor.exe"],
            Platform.LINUX: ["cursor", "Cursor"],
        }
        
        # Platform-specific Cursor installation paths
        self.cursor_paths = {
            Platform.MACOS: [
                "/Applications/Cursor.app",
                "~/Applications/Cursor.app",
                "/System/Applications/Cursor.app",
            ],
            Platform.WINDOWS: [
                "C:\\Users\\{username}\\AppData\\Local\\Programs\\cursor\\Cursor.exe",
                "C:\\Program Files\\Cursor\\Cursor.exe",
                "C:\\Program Files (x86)\\Cursor\\Cursor.exe",
            ],
            Platform.LINUX: [
                "/usr/bin/cursor",
                "/usr/local/bin/cursor",
                "~/.local/bin/cursor",
                "/opt/cursor/cursor",
            ],
        }
        
        self.logger.info(
            "Cursor detector initialized",
            platform=self.platform.value,
            process_names=self.cursor_process_names.get(self.platform, []),
        )
    
    async def detect_cursor_state(self) -> CursorState:
        """
        Detect the current state of the Cursor application.
        
        Returns:
            CursorState: Current state of Cursor application
        """
        try:
            # Check if Cursor process is running
            cursor_processes = await self._find_cursor_processes()
            
            if not cursor_processes:
                return CursorState.NOT_FOUND
            
            # Check if Cursor is the active/focused application
            if await self._is_cursor_focused():
                return CursorState.FOUND_FOCUSED
            
            # Check if Cursor window is visible/active
            if await self._is_cursor_active():
                return CursorState.FOUND_ACTIVE
            
            # Cursor is running but not active
            return CursorState.FOUND_INACTIVE
            
        except Exception as e:
            self.logger.error("Error detecting Cursor state", error=str(e))
            return CursorState.NOT_FOUND
    
    async def find_cursor_installation(self) -> Optional[Path]:
        """
        Find Cursor installation path.
        
        Returns:
            Optional[Path]: Path to Cursor executable/app, or None if not found
        """
        try:
            paths = self.cursor_paths.get(self.platform, [])
            
            for path_str in paths:
                # Expand user path
                if path_str.startswith("~"):
                    path_str = str(Path(path_str).expanduser())
                
                # Handle Windows username placeholder
                if "{username}" in path_str and self.platform == Platform.WINDOWS:
                    import os
                    username = os.getenv("USERNAME", "")
                    path_str = path_str.format(username=username)
                
                path = Path(path_str)
                
                if path.exists():
                    self.logger.info("Found Cursor installation", path=str(path))
                    return path
            
            # Try to find via which/where command
            cursor_path = await self._find_cursor_via_command()
            if cursor_path:
                return cursor_path
            
            self.logger.warning("Cursor installation not found")
            return None
            
        except Exception as e:
            self.logger.error("Error finding Cursor installation", error=str(e))
            return None
    
    async def activate_cursor(self) -> bool:
        """
        Activate and focus the Cursor application.
        
        Returns:
            bool: True if successfully activated, False otherwise
        """
        try:
            current_state = await self.detect_cursor_state()
            
            if current_state == CursorState.FOUND_FOCUSED:
                self.logger.info("Cursor is already focused")
                return True
            
            if current_state == CursorState.NOT_FOUND:
                # Try to launch Cursor
                if not await self._launch_cursor():
                    return False
                
                # Wait for Cursor to start
                await asyncio.sleep(2)
            
            # Activate/focus Cursor
            return await self._focus_cursor()
            
        except Exception as e:
            self.logger.error("Error activating Cursor", error=str(e))
            return False
    
    async def get_cursor_window_info(self) -> Optional[Dict[str, Any]]:
        """
        Get information about Cursor windows.
        
        Returns:
            Optional[Dict[str, Any]]: Window information or None if not available
        """
        try:
            if self.platform == Platform.MACOS:
                return await self._get_macos_window_info()
            elif self.platform == Platform.WINDOWS:
                return await self._get_windows_window_info()
            elif self.platform == Platform.LINUX:
                return await self._get_linux_window_info()
            else:
                self.logger.warning("Unsupported platform for window info")
                return None
                
        except Exception as e:
            self.logger.error("Error getting window info", error=str(e))
            return None
    
    async def _find_cursor_processes(self) -> List[psutil.Process]:
        """Find running Cursor processes."""
        cursor_processes = []
        process_names = self.cursor_process_names.get(self.platform, [])
        
        for proc in psutil.process_iter(['pid', 'name', 'exe']):
            try:
                proc_name = proc.info['name']
                if proc_name and any(name.lower() in proc_name.lower() for name in process_names):
                    cursor_processes.append(proc)
            except (psutil.NoSuchProcess, psutil.AccessDenied):
                continue
        
        return cursor_processes
    
    async def _is_cursor_focused(self) -> bool:
        """Check if Cursor is the currently focused application."""
        if self.platform == Platform.MACOS:
            return await self._is_macos_cursor_focused()
        elif self.platform == Platform.WINDOWS:
            return await self._is_windows_cursor_focused()
        elif self.platform == Platform.LINUX:
            return await self._is_linux_cursor_focused()
        return False
    
    async def _is_cursor_active(self) -> bool:
        """Check if Cursor has active/visible windows."""
        if self.platform == Platform.MACOS:
            return await self._is_macos_cursor_active()
        elif self.platform == Platform.WINDOWS:
            return await self._is_windows_cursor_active()
        elif self.platform == Platform.LINUX:
            return await self._is_linux_cursor_active()
        return False
    
    async def _find_cursor_via_command(self) -> Optional[Path]:
        """Find Cursor using system commands."""
        try:
            if self.platform == Platform.WINDOWS:
                cmd = ["where", "cursor"]
            else:
                cmd = ["which", "cursor"]
            
            result = await asyncio.create_subprocess_exec(
                *cmd,
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE
            )
            stdout, _ = await result.communicate()
            
            if result.returncode == 0 and stdout:
                path_str = stdout.decode().strip()
                if path_str:
                    return Path(path_str)
            
        except Exception as e:
            self.logger.debug("Command-based Cursor search failed", error=str(e))
        
        return None
    
    async def _launch_cursor(self) -> bool:
        """Launch Cursor application."""
        try:
            cursor_path = await self.find_cursor_installation()
            if not cursor_path:
                self.logger.error("Cannot launch Cursor: installation not found")
                return False
            
            if self.platform == Platform.MACOS:
                cmd = ["open", "-a", str(cursor_path)]
            elif self.platform == Platform.WINDOWS:
                cmd = [str(cursor_path)]
            elif self.platform == Platform.LINUX:
                cmd = [str(cursor_path)]
            else:
                return False
            
            process = await asyncio.create_subprocess_exec(
                *cmd,
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE
            )
            
            # Don't wait for the process to complete (it should keep running)
            self.logger.info("Launched Cursor application", command=cmd)
            return True
            
        except Exception as e:
            self.logger.error("Error launching Cursor", error=str(e))
            return False
    
    async def _focus_cursor(self) -> bool:
        """Focus the Cursor application."""
        if self.platform == Platform.MACOS:
            return await self._focus_macos_cursor()
        elif self.platform == Platform.WINDOWS:
            return await self._focus_windows_cursor()
        elif self.platform == Platform.LINUX:
            return await self._focus_linux_cursor()
        return False
    
    # macOS-specific implementations
    async def _is_macos_cursor_focused(self) -> bool:
        """Check if Cursor is focused on macOS using AppleScript."""
        try:
            script = '''
            tell application "System Events"
                set frontApp to name of first application process whose frontmost is true
                return frontApp
            end tell
            '''
            
            result = await asyncio.create_subprocess_exec(
                "osascript", "-e", script,
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE
            )
            stdout, _ = await result.communicate()
            
            if result.returncode == 0:
                front_app = stdout.decode().strip()
                return "cursor" in front_app.lower()
            
        except Exception as e:
            self.logger.debug("Error checking macOS focus", error=str(e))
        
        return False
    
    async def _is_macos_cursor_active(self) -> bool:
        """Check if Cursor has active windows on macOS."""
        try:
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
            
        except Exception as e:
            self.logger.debug("Error checking macOS active state", error=str(e))
        
        return False
    
    async def _focus_macos_cursor(self) -> bool:
        """Focus Cursor on macOS using AppleScript."""
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
            self.logger.error("Error focusing Cursor on macOS", error=str(e))
            return False
    
    async def _get_macos_window_info(self) -> Optional[Dict[str, Any]]:
        """Get Cursor window information on macOS."""
        try:
            script = '''
            tell application "System Events"
                tell process "Cursor"
                    set windowList to windows
                    set windowInfo to {}
                    repeat with w in windowList
                        set windowInfo to windowInfo & {name of w, position of w, size of w}
                    end repeat
                    return windowInfo
                end tell
            end tell
            '''
            
            result = await asyncio.create_subprocess_exec(
                "osascript", "-e", script,
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE
            )
            stdout, _ = await result.communicate()
            
            if result.returncode == 0:
                # Parse AppleScript output (simplified)
                return {"raw_output": stdout.decode().strip()}
            
        except Exception as e:
            self.logger.debug("Error getting macOS window info", error=str(e))
        
        return None
    
    # Windows-specific implementations (stubs for future implementation)
    async def _is_windows_cursor_focused(self) -> bool:
        """Check if Cursor is focused on Windows."""
        # TODO: Implement Windows-specific focus detection
        self.logger.debug("Windows focus detection not implemented")
        return False
    
    async def _is_windows_cursor_active(self) -> bool:
        """Check if Cursor has active windows on Windows."""
        # TODO: Implement Windows-specific active state detection
        self.logger.debug("Windows active state detection not implemented")
        return False
    
    async def _focus_windows_cursor(self) -> bool:
        """Focus Cursor on Windows."""
        # TODO: Implement Windows-specific focus
        self.logger.debug("Windows focus not implemented")
        return False
    
    async def _get_windows_window_info(self) -> Optional[Dict[str, Any]]:
        """Get Cursor window information on Windows."""
        # TODO: Implement Windows-specific window info
        self.logger.debug("Windows window info not implemented")
        return None
    
    # Linux-specific implementations (stubs for future implementation)
    async def _is_linux_cursor_focused(self) -> bool:
        """Check if Cursor is focused on Linux."""
        # TODO: Implement Linux-specific focus detection
        self.logger.debug("Linux focus detection not implemented")
        return False
    
    async def _is_linux_cursor_active(self) -> bool:
        """Check if Cursor has active windows on Linux."""
        # TODO: Implement Linux-specific active state detection
        self.logger.debug("Linux active state detection not implemented")
        return False
    
    async def _focus_linux_cursor(self) -> bool:
        """Focus Cursor on Linux."""
        # TODO: Implement Linux-specific focus
        self.logger.debug("Linux focus not implemented")
        return False
    
    async def _get_linux_window_info(self) -> Optional[Dict[str, Any]]:
        """Get Cursor window information on Linux."""
        # TODO: Implement Linux-specific window info
        self.logger.debug("Linux window info not implemented")
        return None 