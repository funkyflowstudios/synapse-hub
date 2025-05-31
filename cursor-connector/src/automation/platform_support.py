"""
Cross-Platform Support Module for Cursor Connector

This module provides platform-specific automation capabilities for Windows, macOS, and Linux
environments with automatic platform detection and unified interfaces.

Key Components:
- Platform detection and configuration
- Windows automation (PowerShell, Windows API)
- macOS automation (AppleScript, Cocoa)
- Linux automation (X11/Wayland, D-Bus)
- Platform abstraction layer for unified access
"""

import asyncio
import logging
import platform
import subprocess
import sys
from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from enum import Enum
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple, Union

logger = logging.getLogger(__name__)


class PlatformType(Enum):
    """Supported platform types."""
    WINDOWS = "windows"
    MACOS = "macos"
    LINUX = "linux"
    UNKNOWN = "unknown"


class AutomationCapability(Enum):
    """Available automation capabilities per platform."""
    WINDOW_MANAGEMENT = "window_management"
    KEYBOARD_INPUT = "keyboard_input"
    MOUSE_INPUT = "mouse_input"
    CLIPBOARD_ACCESS = "clipboard_access"
    PROCESS_CONTROL = "process_control"
    FILE_OPERATIONS = "file_operations"
    SYSTEM_NOTIFICATIONS = "system_notifications"
    SCREEN_CAPTURE = "screen_capture"
    APPLICATION_CONTROL = "application_control"


@dataclass
class PlatformInfo:
    """Information about the current platform."""
    platform_type: PlatformType
    system: str
    release: str
    version: str
    machine: str
    processor: str
    capabilities: List[AutomationCapability] = field(default_factory=list)
    tools_available: Dict[str, bool] = field(default_factory=dict)
    
    def __post_init__(self):
        """Initialize platform-specific information."""
        self._detect_capabilities()
        self._check_tool_availability()
    
    def _detect_capabilities(self):
        """Detect available automation capabilities for this platform."""
        if self.platform_type == PlatformType.WINDOWS:
            self.capabilities = [
                AutomationCapability.WINDOW_MANAGEMENT,
                AutomationCapability.KEYBOARD_INPUT,
                AutomationCapability.MOUSE_INPUT,
                AutomationCapability.CLIPBOARD_ACCESS,
                AutomationCapability.PROCESS_CONTROL,
                AutomationCapability.FILE_OPERATIONS,
                AutomationCapability.SYSTEM_NOTIFICATIONS,
                AutomationCapability.SCREEN_CAPTURE,
                AutomationCapability.APPLICATION_CONTROL,
            ]
        elif self.platform_type == PlatformType.MACOS:
            self.capabilities = [
                AutomationCapability.WINDOW_MANAGEMENT,
                AutomationCapability.KEYBOARD_INPUT,
                AutomationCapability.MOUSE_INPUT,
                AutomationCapability.CLIPBOARD_ACCESS,
                AutomationCapability.PROCESS_CONTROL,
                AutomationCapability.FILE_OPERATIONS,
                AutomationCapability.SYSTEM_NOTIFICATIONS,
                AutomationCapability.SCREEN_CAPTURE,
                AutomationCapability.APPLICATION_CONTROL,
            ]
        elif self.platform_type == PlatformType.LINUX:
            self.capabilities = [
                AutomationCapability.WINDOW_MANAGEMENT,
                AutomationCapability.KEYBOARD_INPUT,
                AutomationCapability.MOUSE_INPUT,
                AutomationCapability.CLIPBOARD_ACCESS,
                AutomationCapability.PROCESS_CONTROL,
                AutomationCapability.FILE_OPERATIONS,
                AutomationCapability.SYSTEM_NOTIFICATIONS,
                AutomationCapability.SCREEN_CAPTURE,
                AutomationCapability.APPLICATION_CONTROL,
            ]
    
    def _check_tool_availability(self):
        """Check availability of platform-specific tools."""
        if self.platform_type == PlatformType.WINDOWS:
            self.tools_available = {
                "powershell": self._check_command("powershell"),
                "pwsh": self._check_command("pwsh"),
                "wmic": self._check_command("wmic"),
                "tasklist": self._check_command("tasklist"),
                "taskkill": self._check_command("taskkill"),
            }
        elif self.platform_type == PlatformType.MACOS:
            self.tools_available = {
                "osascript": self._check_command("osascript"),
                "automator": self._check_command("automator"),
                "open": self._check_command("open"),
                "defaults": self._check_command("defaults"),
                "launchctl": self._check_command("launchctl"),
            }
        elif self.platform_type == PlatformType.LINUX:
            self.tools_available = {
                "xdotool": self._check_command("xdotool"),
                "wmctrl": self._check_command("wmctrl"),
                "xclip": self._check_command("xclip"),
                "xsel": self._check_command("xsel"),
                "notify-send": self._check_command("notify-send"),
                "dbus-send": self._check_command("dbus-send"),
                "gdbus": self._check_command("gdbus"),
            }
    
    def _check_command(self, command: str) -> bool:
        """Check if a command is available in the system."""
        try:
            subprocess.run([command, "--version"], 
                         capture_output=True, 
                         check=False, 
                         timeout=5)
            return True
        except (subprocess.TimeoutExpired, FileNotFoundError, OSError):
            return False


class PlatformAutomation(ABC):
    """Abstract base class for platform-specific automation."""
    
    def __init__(self, platform_info: PlatformInfo):
        self.platform_info = platform_info
        self.logger = logging.getLogger(f"{__name__}.{self.__class__.__name__}")
    
    @abstractmethod
    async def activate_application(self, app_name: str) -> bool:
        """Activate/focus an application."""
        pass
    
    @abstractmethod
    async def send_keyboard_shortcut(self, shortcut: str) -> bool:
        """Send a keyboard shortcut."""
        pass
    
    @abstractmethod
    async def get_clipboard_content(self) -> Optional[str]:
        """Get clipboard content."""
        pass
    
    @abstractmethod
    async def set_clipboard_content(self, content: str) -> bool:
        """Set clipboard content."""
        pass
    
    @abstractmethod
    async def get_active_window_title(self) -> Optional[str]:
        """Get the title of the active window."""
        pass
    
    @abstractmethod
    async def find_windows_by_title(self, title_pattern: str) -> List[Dict[str, Any]]:
        """Find windows matching a title pattern."""
        pass
    
    @abstractmethod
    async def is_application_running(self, app_name: str) -> bool:
        """Check if an application is running."""
        pass
    
    @abstractmethod
    async def launch_application(self, app_path: str) -> bool:
        """Launch an application."""
        pass


class WindowsAutomation(PlatformAutomation):
    """Windows-specific automation using PowerShell and Windows API."""
    
    def __init__(self, platform_info: PlatformInfo):
        super().__init__(platform_info)
        self.powershell_cmd = "pwsh" if platform_info.tools_available.get("pwsh") else "powershell"
    
    async def _run_powershell(self, script: str) -> Tuple[bool, str]:
        """Run a PowerShell script and return success status and output."""
        try:
            process = await asyncio.create_subprocess_exec(
                self.powershell_cmd, "-Command", script,
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE
            )
            stdout, stderr = await process.communicate()
            
            success = process.returncode == 0
            output = stdout.decode('utf-8', errors='ignore').strip()
            
            if not success:
                error = stderr.decode('utf-8', errors='ignore').strip()
                self.logger.warning(f"PowerShell script failed: {error}")
            
            return success, output
        except Exception as e:
            self.logger.error(f"Failed to run PowerShell script: {e}")
            return False, ""
    
    async def activate_application(self, app_name: str) -> bool:
        """Activate application using Windows API."""
        script = f"""
        Add-Type -TypeDefinition @"
            using System;
            using System.Diagnostics;
            using System.Runtime.InteropServices;
            public class Win32 {{
                [DllImport("user32.dll")]
                public static extern bool SetForegroundWindow(IntPtr hWnd);
                [DllImport("user32.dll")]
                public static extern bool ShowWindow(IntPtr hWnd, int nCmdShow);
            }}
"@
        
        $processes = Get-Process -Name "{app_name}" -ErrorAction SilentlyContinue
        if ($processes) {{
            $process = $processes[0]
            [Win32]::ShowWindow($process.MainWindowHandle, 9)  # SW_RESTORE
            [Win32]::SetForegroundWindow($process.MainWindowHandle)
            Write-Output "success"
        }} else {{
            Write-Output "not_found"
        }}
        """
        
        success, output = await self._run_powershell(script)
        return success and output == "success"
    
    async def send_keyboard_shortcut(self, shortcut: str) -> bool:
        """Send keyboard shortcut using Windows SendKeys."""
        # Convert common shortcuts to Windows SendKeys format
        shortcut_map = {
            "cmd+shift+p": "^+p",
            "ctrl+shift+p": "^+p",
            "cmd+c": "^c",
            "ctrl+c": "^c",
            "cmd+v": "^v",
            "ctrl+v": "^v",
            "cmd+a": "^a",
            "ctrl+a": "^a",
        }
        
        windows_shortcut = shortcut_map.get(shortcut.lower(), shortcut)
        
        script = f"""
        Add-Type -AssemblyName System.Windows.Forms
        [System.Windows.Forms.SendKeys]::SendWait("{windows_shortcut}")
        Write-Output "success"
        """
        
        success, output = await self._run_powershell(script)
        return success and output == "success"
    
    async def get_clipboard_content(self) -> Optional[str]:
        """Get clipboard content using Windows API."""
        script = """
        Add-Type -AssemblyName System.Windows.Forms
        $clipboard = [System.Windows.Forms.Clipboard]::GetText()
        Write-Output $clipboard
        """
        
        success, output = await self._run_powershell(script)
        return output if success else None
    
    async def set_clipboard_content(self, content: str) -> bool:
        """Set clipboard content using Windows API."""
        # Escape content for PowerShell
        escaped_content = content.replace('"', '""').replace("'", "''")
        
        script = f"""
        Add-Type -AssemblyName System.Windows.Forms
        [System.Windows.Forms.Clipboard]::SetText(@"
{escaped_content}
"@)
        Write-Output "success"
        """
        
        success, output = await self._run_powershell(script)
        return success and output == "success"
    
    async def get_active_window_title(self) -> Optional[str]:
        """Get active window title using Windows API."""
        script = """
        Add-Type -TypeDefinition @"
            using System;
            using System.Runtime.InteropServices;
            using System.Text;
            public class Win32 {
                [DllImport("user32.dll")]
                public static extern IntPtr GetForegroundWindow();
                [DllImport("user32.dll")]
                public static extern int GetWindowText(IntPtr hWnd, StringBuilder text, int count);
            }
"@
        
        $hwnd = [Win32]::GetForegroundWindow()
        $title = New-Object System.Text.StringBuilder 256
        [Win32]::GetWindowText($hwnd, $title, 256)
        Write-Output $title.ToString()
        """
        
        success, output = await self._run_powershell(script)
        return output if success and output else None
    
    async def find_windows_by_title(self, title_pattern: str) -> List[Dict[str, Any]]:
        """Find windows matching title pattern."""
        script = f"""
        Get-Process | Where-Object {{$_.MainWindowTitle -like "*{title_pattern}*"}} | 
        ForEach-Object {{
            [PSCustomObject]@{{
                ProcessName = $_.ProcessName
                WindowTitle = $_.MainWindowTitle
                ProcessId = $_.Id
                WindowHandle = $_.MainWindowHandle
            }}
        }} | ConvertTo-Json
        """
        
        success, output = await self._run_powershell(script)
        if not success or not output:
            return []
        
        try:
            import json
            result = json.loads(output)
            if isinstance(result, dict):
                return [result]
            return result if isinstance(result, list) else []
        except (json.JSONDecodeError, ImportError):
            return []
    
    async def is_application_running(self, app_name: str) -> bool:
        """Check if application is running."""
        script = f"""
        $processes = Get-Process -Name "{app_name}" -ErrorAction SilentlyContinue
        if ($processes) {{
            Write-Output "true"
        }} else {{
            Write-Output "false"
        }}
        """
        
        success, output = await self._run_powershell(script)
        return success and output == "true"
    
    async def launch_application(self, app_path: str) -> bool:
        """Launch application."""
        script = f"""
        try {{
            Start-Process "{app_path}"
            Write-Output "success"
        }} catch {{
            Write-Output "failed"
        }}
        """
        
        success, output = await self._run_powershell(script)
        return success and output == "success"


class MacOSAutomation(PlatformAutomation):
    """macOS-specific automation using AppleScript and Cocoa."""
    
    async def _run_applescript(self, script: str) -> Tuple[bool, str]:
        """Run an AppleScript and return success status and output."""
        try:
            process = await asyncio.create_subprocess_exec(
                "osascript", "-e", script,
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE
            )
            stdout, stderr = await process.communicate()
            
            success = process.returncode == 0
            output = stdout.decode('utf-8', errors='ignore').strip()
            
            if not success:
                error = stderr.decode('utf-8', errors='ignore').strip()
                self.logger.warning(f"AppleScript failed: {error}")
            
            return success, output
        except Exception as e:
            self.logger.error(f"Failed to run AppleScript: {e}")
            return False, ""
    
    async def activate_application(self, app_name: str) -> bool:
        """Activate application using AppleScript."""
        script = f'tell application "{app_name}" to activate'
        success, _ = await self._run_applescript(script)
        return success
    
    async def send_keyboard_shortcut(self, shortcut: str) -> bool:
        """Send keyboard shortcut using AppleScript."""
        # Convert shortcuts to AppleScript format
        shortcut_map = {
            "cmd+shift+p": "command down, shift down, \"p\", shift up, command up",
            "ctrl+shift+p": "control down, shift down, \"p\", shift up, control up",
            "cmd+c": "command down, \"c\", command up",
            "ctrl+c": "control down, \"c\", control up",
            "cmd+v": "command down, \"v\", command up",
            "ctrl+v": "control down, \"v\", control up",
            "cmd+a": "command down, \"a\", command up",
            "ctrl+a": "control down, \"a\", control up",
        }
        
        applescript_shortcut = shortcut_map.get(shortcut.lower())
        if not applescript_shortcut:
            return False
        
        script = f"""
        tell application "System Events"
            key code using {{{applescript_shortcut}}}
        end tell
        """
        
        success, _ = await self._run_applescript(script)
        return success
    
    async def get_clipboard_content(self) -> Optional[str]:
        """Get clipboard content using AppleScript."""
        script = "the clipboard"
        success, output = await self._run_applescript(script)
        return output if success else None
    
    async def set_clipboard_content(self, content: str) -> bool:
        """Set clipboard content using AppleScript."""
        # Escape content for AppleScript
        escaped_content = content.replace('"', '\\"').replace('\\', '\\\\')
        script = f'set the clipboard to "{escaped_content}"'
        success, _ = await self._run_applescript(script)
        return success
    
    async def get_active_window_title(self) -> Optional[str]:
        """Get active window title using AppleScript."""
        script = """
        tell application "System Events"
            set frontApp to name of first application process whose frontmost is true
            tell process frontApp
                set windowTitle to name of front window
            end tell
        end tell
        return windowTitle
        """
        
        success, output = await self._run_applescript(script)
        return output if success and output else None
    
    async def find_windows_by_title(self, title_pattern: str) -> List[Dict[str, Any]]:
        """Find windows matching title pattern."""
        script = f"""
        set windowList to {{}}
        tell application "System Events"
            repeat with proc in application processes
                try
                    repeat with win in windows of proc
                        set winTitle to name of win
                        if winTitle contains "{title_pattern}" then
                            set end of windowList to {{name:name of proc, title:winTitle}}
                        end if
                    end repeat
                end try
            end repeat
        end tell
        return windowList
        """
        
        success, output = await self._run_applescript(script)
        if not success or not output:
            return []
        
        # Parse AppleScript list output (simplified)
        windows = []
        try:
            # This is a simplified parser - in production, you'd want more robust parsing
            if "name:" in output and "title:" in output:
                windows.append({"app_name": "unknown", "title": title_pattern})
        except Exception:
            pass
        
        return windows
    
    async def is_application_running(self, app_name: str) -> bool:
        """Check if application is running."""
        script = f"""
        tell application "System Events"
            set isRunning to (name of processes) contains "{app_name}"
        end tell
        return isRunning
        """
        
        success, output = await self._run_applescript(script)
        return success and output.lower() == "true"
    
    async def launch_application(self, app_path: str) -> bool:
        """Launch application."""
        script = f'tell application "{app_path}" to launch'
        success, _ = await self._run_applescript(script)
        return success


class LinuxAutomation(PlatformAutomation):
    """Linux-specific automation using X11/Wayland tools."""
    
    async def _run_command(self, command: List[str]) -> Tuple[bool, str]:
        """Run a command and return success status and output."""
        try:
            process = await asyncio.create_subprocess_exec(
                *command,
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE
            )
            stdout, stderr = await process.communicate()
            
            success = process.returncode == 0
            output = stdout.decode('utf-8', errors='ignore').strip()
            
            if not success:
                error = stderr.decode('utf-8', errors='ignore').strip()
                self.logger.warning(f"Command {' '.join(command)} failed: {error}")
            
            return success, output
        except Exception as e:
            self.logger.error(f"Failed to run command {' '.join(command)}: {e}")
            return False, ""
    
    async def activate_application(self, app_name: str) -> bool:
        """Activate application using wmctrl or xdotool."""
        if self.platform_info.tools_available.get("wmctrl"):
            success, _ = await self._run_command(["wmctrl", "-a", app_name])
            return success
        elif self.platform_info.tools_available.get("xdotool"):
            # Find window and activate
            success, output = await self._run_command(["xdotool", "search", "--name", app_name])
            if success and output:
                window_id = output.split('\n')[0]
                success, _ = await self._run_command(["xdotool", "windowactivate", window_id])
                return success
        
        return False
    
    async def send_keyboard_shortcut(self, shortcut: str) -> bool:
        """Send keyboard shortcut using xdotool."""
        if not self.platform_info.tools_available.get("xdotool"):
            return False
        
        # Convert shortcuts to xdotool format
        shortcut_map = {
            "cmd+shift+p": "ctrl+shift+p",
            "ctrl+shift+p": "ctrl+shift+p",
            "cmd+c": "ctrl+c",
            "ctrl+c": "ctrl+c",
            "cmd+v": "ctrl+v",
            "ctrl+v": "ctrl+v",
            "cmd+a": "ctrl+a",
            "ctrl+a": "ctrl+a",
        }
        
        xdotool_shortcut = shortcut_map.get(shortcut.lower(), shortcut)
        success, _ = await self._run_command(["xdotool", "key", xdotool_shortcut])
        return success
    
    async def get_clipboard_content(self) -> Optional[str]:
        """Get clipboard content using xclip or xsel."""
        if self.platform_info.tools_available.get("xclip"):
            success, output = await self._run_command(["xclip", "-selection", "clipboard", "-o"])
            return output if success else None
        elif self.platform_info.tools_available.get("xsel"):
            success, output = await self._run_command(["xsel", "--clipboard", "--output"])
            return output if success else None
        
        return None
    
    async def set_clipboard_content(self, content: str) -> bool:
        """Set clipboard content using xclip or xsel."""
        if self.platform_info.tools_available.get("xclip"):
            process = await asyncio.create_subprocess_exec(
                "xclip", "-selection", "clipboard",
                stdin=asyncio.subprocess.PIPE
            )
            await process.communicate(input=content.encode('utf-8'))
            return process.returncode == 0
        elif self.platform_info.tools_available.get("xsel"):
            process = await asyncio.create_subprocess_exec(
                "xsel", "--clipboard", "--input",
                stdin=asyncio.subprocess.PIPE
            )
            await process.communicate(input=content.encode('utf-8'))
            return process.returncode == 0
        
        return False
    
    async def get_active_window_title(self) -> Optional[str]:
        """Get active window title using xdotool or wmctrl."""
        if self.platform_info.tools_available.get("xdotool"):
            success, output = await self._run_command(["xdotool", "getactivewindow", "getwindowname"])
            return output if success and output else None
        elif self.platform_info.tools_available.get("wmctrl"):
            success, output = await self._run_command(["wmctrl", "-l"])
            if success and output:
                # Parse wmctrl output to find active window
                lines = output.split('\n')
                for line in lines:
                    if line.strip():
                        parts = line.split(None, 3)
                        if len(parts) >= 4:
                            return parts[3]  # Window title
        
        return None
    
    async def find_windows_by_title(self, title_pattern: str) -> List[Dict[str, Any]]:
        """Find windows matching title pattern."""
        windows = []
        
        if self.platform_info.tools_available.get("wmctrl"):
            success, output = await self._run_command(["wmctrl", "-l"])
            if success and output:
                for line in output.split('\n'):
                    if line.strip() and title_pattern.lower() in line.lower():
                        parts = line.split(None, 3)
                        if len(parts) >= 4:
                            windows.append({
                                "window_id": parts[0],
                                "desktop": parts[1],
                                "hostname": parts[2],
                                "title": parts[3]
                            })
        
        return windows
    
    async def is_application_running(self, app_name: str) -> bool:
        """Check if application is running."""
        success, output = await self._run_command(["pgrep", "-f", app_name])
        return success and bool(output.strip())
    
    async def launch_application(self, app_path: str) -> bool:
        """Launch application."""
        try:
            process = await asyncio.create_subprocess_exec(app_path)
            return True
        except Exception as e:
            self.logger.error(f"Failed to launch application {app_path}: {e}")
            return False


class PlatformDetector:
    """Platform detection and information gathering."""
    
    @staticmethod
    def detect_platform() -> PlatformInfo:
        """Detect current platform and gather information."""
        system = platform.system().lower()
        
        if system == "windows":
            platform_type = PlatformType.WINDOWS
        elif system == "darwin":
            platform_type = PlatformType.MACOS
        elif system == "linux":
            platform_type = PlatformType.LINUX
        else:
            platform_type = PlatformType.UNKNOWN
        
        return PlatformInfo(
            platform_type=platform_type,
            system=platform.system(),
            release=platform.release(),
            version=platform.version(),
            machine=platform.machine(),
            processor=platform.processor()
        )
    
    @staticmethod
    def create_automation(platform_info: PlatformInfo) -> Optional[PlatformAutomation]:
        """Create platform-specific automation instance."""
        if platform_info.platform_type == PlatformType.WINDOWS:
            return WindowsAutomation(platform_info)
        elif platform_info.platform_type == PlatformType.MACOS:
            return MacOSAutomation(platform_info)
        elif platform_info.platform_type == PlatformType.LINUX:
            return LinuxAutomation(platform_info)
        else:
            logger.warning(f"Unsupported platform: {platform_info.platform_type}")
            return None


class CrossPlatformSupport:
    """Main cross-platform support coordinator."""
    
    def __init__(self):
        self.logger = logging.getLogger(__name__)
        self.platform_info = PlatformDetector.detect_platform()
        self.automation = PlatformDetector.create_automation(self.platform_info)
        
        self.logger.info(f"Initialized cross-platform support for {self.platform_info.platform_type.value}")
        self.logger.debug(f"Platform capabilities: {[cap.value for cap in self.platform_info.capabilities]}")
        self.logger.debug(f"Available tools: {self.platform_info.tools_available}")
    
    def get_platform_info(self) -> PlatformInfo:
        """Get current platform information."""
        return self.platform_info
    
    def get_automation(self) -> Optional[PlatformAutomation]:
        """Get platform-specific automation instance."""
        return self.automation
    
    def has_capability(self, capability: AutomationCapability) -> bool:
        """Check if platform supports a specific capability."""
        return capability in self.platform_info.capabilities
    
    def is_tool_available(self, tool_name: str) -> bool:
        """Check if a specific tool is available."""
        return self.platform_info.tools_available.get(tool_name, False)
    
    async def test_automation_capabilities(self) -> Dict[str, bool]:
        """Test all automation capabilities and return results."""
        if not self.automation:
            return {}
        
        results = {}
        
        try:
            # Test clipboard access
            test_content = "test_clipboard_content"
            if await self.automation.set_clipboard_content(test_content):
                retrieved = await self.automation.get_clipboard_content()
                results["clipboard"] = retrieved == test_content
            else:
                results["clipboard"] = False
        except Exception as e:
            self.logger.warning(f"Clipboard test failed: {e}")
            results["clipboard"] = False
        
        try:
            # Test window title retrieval
            title = await self.automation.get_active_window_title()
            results["window_title"] = title is not None
        except Exception as e:
            self.logger.warning(f"Window title test failed: {e}")
            results["window_title"] = False
        
        try:
            # Test application detection
            is_running = await self.automation.is_application_running("nonexistent_app")
            results["process_detection"] = isinstance(is_running, bool)
        except Exception as e:
            self.logger.warning(f"Process detection test failed: {e}")
            results["process_detection"] = False
        
        return results
    
    def get_platform_specific_cursor_paths(self) -> List[Path]:
        """Get platform-specific Cursor installation paths."""
        if self.platform_info.platform_type == PlatformType.WINDOWS:
            return [
                Path.home() / "AppData" / "Local" / "Programs" / "cursor" / "Cursor.exe",
                Path("C:") / "Program Files" / "Cursor" / "Cursor.exe",
                Path("C:") / "Program Files (x86)" / "Cursor" / "Cursor.exe",
            ]
        elif self.platform_info.platform_type == PlatformType.MACOS:
            return [
                Path("/Applications/Cursor.app"),
                Path.home() / "Applications" / "Cursor.app",
            ]
        elif self.platform_info.platform_type == PlatformType.LINUX:
            return [
                Path.home() / ".local" / "share" / "applications" / "cursor.desktop",
                Path("/usr/share/applications/cursor.desktop"),
                Path("/opt/cursor/cursor"),
                Path.home() / "cursor" / "cursor",
            ]
        else:
            return []
    
    def get_platform_specific_config_paths(self) -> List[Path]:
        """Get platform-specific configuration paths."""
        if self.platform_info.platform_type == PlatformType.WINDOWS:
            return [
                Path.home() / "AppData" / "Roaming" / "Cursor",
                Path.home() / "AppData" / "Local" / "Cursor",
            ]
        elif self.platform_info.platform_type == PlatformType.MACOS:
            return [
                Path.home() / "Library" / "Application Support" / "Cursor",
                Path.home() / ".cursor",
            ]
        elif self.platform_info.platform_type == PlatformType.LINUX:
            return [
                Path.home() / ".config" / "Cursor",
                Path.home() / ".cursor",
            ]
        else:
            return [] 