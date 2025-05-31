"""
Tests for Cross-Platform Support Module.

This module tests platform detection, automation capabilities, and platform-specific
implementations for Windows, macOS, and Linux.
"""

import asyncio
import platform
import pytest
from unittest.mock import Mock, patch, AsyncMock, MagicMock
from pathlib import Path

from src.automation.platform_support import (
    PlatformType,
    AutomationCapability,
    PlatformInfo,
    PlatformAutomation,
    WindowsAutomation,
    MacOSAutomation,
    LinuxAutomation,
    PlatformDetector,
    CrossPlatformSupport
)


class TestPlatformType:
    """Test PlatformType enum."""
    
    def test_platform_types(self):
        """Test platform type values."""
        assert PlatformType.WINDOWS.value == "windows"
        assert PlatformType.MACOS.value == "macos"
        assert PlatformType.LINUX.value == "linux"
        assert PlatformType.UNKNOWN.value == "unknown"


class TestAutomationCapability:
    """Test AutomationCapability enum."""
    
    def test_automation_capabilities(self):
        """Test automation capability values."""
        assert AutomationCapability.WINDOW_MANAGEMENT.value == "window_management"
        assert AutomationCapability.KEYBOARD_INPUT.value == "keyboard_input"
        assert AutomationCapability.MOUSE_INPUT.value == "mouse_input"
        assert AutomationCapability.CLIPBOARD_ACCESS.value == "clipboard_access"
        assert AutomationCapability.PROCESS_CONTROL.value == "process_control"
        assert AutomationCapability.FILE_OPERATIONS.value == "file_operations"
        assert AutomationCapability.SYSTEM_NOTIFICATIONS.value == "system_notifications"
        assert AutomationCapability.SCREEN_CAPTURE.value == "screen_capture"
        assert AutomationCapability.APPLICATION_CONTROL.value == "application_control"


class TestPlatformInfo:
    """Test PlatformInfo dataclass."""
    
    def test_platform_info_creation(self):
        """Test platform info creation."""
        platform_info = PlatformInfo(
            platform_type=PlatformType.MACOS,
            system="Darwin",
            release="23.0.0",
            version="Darwin Kernel Version 23.0.0",
            machine="arm64",
            processor="arm"
        )
        
        assert platform_info.platform_type == PlatformType.MACOS
        assert platform_info.system == "Darwin"
        assert platform_info.release == "23.0.0"
        assert platform_info.machine == "arm64"
        assert len(platform_info.capabilities) > 0
        assert isinstance(platform_info.tools_available, dict)
    
    @patch('subprocess.run')
    def test_check_command_available(self, mock_run):
        """Test command availability checking."""
        mock_run.return_value = Mock(returncode=0)
        
        platform_info = PlatformInfo(
            platform_type=PlatformType.MACOS,
            system="Darwin",
            release="23.0.0",
            version="Darwin Kernel Version 23.0.0",
            machine="arm64",
            processor="arm"
        )
        
        # Should have checked for macOS tools
        assert "osascript" in platform_info.tools_available
        assert "automator" in platform_info.tools_available
        assert "open" in platform_info.tools_available
    
    @patch('subprocess.run')
    def test_check_command_not_available(self, mock_run):
        """Test command not available."""
        mock_run.side_effect = FileNotFoundError()
        
        platform_info = PlatformInfo(
            platform_type=PlatformType.LINUX,
            system="Linux",
            release="5.15.0",
            version="#1 SMP",
            machine="x86_64",
            processor="x86_64"
        )
        
        # All tools should be marked as not available
        for tool_available in platform_info.tools_available.values():
            assert tool_available is False


class TestWindowsAutomation:
    """Test Windows-specific automation."""
    
    def setup_method(self):
        """Set up test fixtures."""
        self.platform_info = PlatformInfo(
            platform_type=PlatformType.WINDOWS,
            system="Windows",
            release="10",
            version="10.0.19041",
            machine="AMD64",
            processor="Intel64 Family 6 Model 142 Stepping 10, GenuineIntel"
        )
        self.automation = WindowsAutomation(self.platform_info)
    
    def test_initialization(self):
        """Test Windows automation initialization."""
        assert self.automation.platform_info.platform_type == PlatformType.WINDOWS
        assert self.automation.powershell_cmd in ["powershell", "pwsh"]
    
    @pytest.mark.asyncio
    async def test_run_powershell_success(self):
        """Test successful PowerShell execution."""
        with patch('asyncio.create_subprocess_exec') as mock_subprocess:
            mock_process = AsyncMock()
            mock_process.communicate.return_value = (b"success\n", b"")
            mock_process.returncode = 0
            mock_subprocess.return_value = mock_process
            
            success, output = await self.automation._run_powershell("Write-Output 'success'")
            
            assert success is True
            assert output == "success"
    
    @pytest.mark.asyncio
    async def test_run_powershell_failure(self):
        """Test failed PowerShell execution."""
        with patch('asyncio.create_subprocess_exec') as mock_subprocess:
            mock_process = AsyncMock()
            mock_process.communicate.return_value = (b"", b"error\n")
            mock_process.returncode = 1
            mock_subprocess.return_value = mock_process
            
            success, output = await self.automation._run_powershell("invalid command")
            
            assert success is False
            assert output == ""
    
    @pytest.mark.asyncio
    async def test_activate_application_success(self):
        """Test successful application activation."""
        with patch.object(self.automation, '_run_powershell') as mock_powershell:
            mock_powershell.return_value = (True, "success")
            
            result = await self.automation.activate_application("Cursor")
            
            assert result is True
            mock_powershell.assert_called_once()
    
    @pytest.mark.asyncio
    async def test_activate_application_not_found(self):
        """Test application activation when app not found."""
        with patch.object(self.automation, '_run_powershell') as mock_powershell:
            mock_powershell.return_value = (True, "not_found")
            
            result = await self.automation.activate_application("NonExistentApp")
            
            assert result is False
    
    @pytest.mark.asyncio
    async def test_send_keyboard_shortcut(self):
        """Test sending keyboard shortcut."""
        with patch.object(self.automation, '_run_powershell') as mock_powershell:
            mock_powershell.return_value = (True, "success")
            
            result = await self.automation.send_keyboard_shortcut("ctrl+c")
            
            assert result is True
            mock_powershell.assert_called_once()
    
    @pytest.mark.asyncio
    async def test_clipboard_operations(self):
        """Test clipboard get and set operations."""
        with patch.object(self.automation, '_run_powershell') as mock_powershell:
            # Test get clipboard
            mock_powershell.return_value = (True, "test content")
            content = await self.automation.get_clipboard_content()
            assert content == "test content"
            
            # Test set clipboard
            mock_powershell.return_value = (True, "success")
            result = await self.automation.set_clipboard_content("new content")
            assert result is True


class TestMacOSAutomation:
    """Test macOS-specific automation."""
    
    def setup_method(self):
        """Set up test fixtures."""
        self.platform_info = PlatformInfo(
            platform_type=PlatformType.MACOS,
            system="Darwin",
            release="23.0.0",
            version="Darwin Kernel Version 23.0.0",
            machine="arm64",
            processor="arm"
        )
        self.automation = MacOSAutomation(self.platform_info)
    
    def test_initialization(self):
        """Test macOS automation initialization."""
        assert self.automation.platform_info.platform_type == PlatformType.MACOS
    
    @pytest.mark.asyncio
    async def test_run_applescript_success(self):
        """Test successful AppleScript execution."""
        with patch('asyncio.create_subprocess_exec') as mock_subprocess:
            mock_process = AsyncMock()
            mock_process.communicate.return_value = (b"success\n", b"")
            mock_process.returncode = 0
            mock_subprocess.return_value = mock_process
            
            success, output = await self.automation._run_applescript('return "success"')
            
            assert success is True
            assert output == "success"
    
    @pytest.mark.asyncio
    async def test_activate_application(self):
        """Test application activation."""
        with patch.object(self.automation, '_run_applescript') as mock_applescript:
            mock_applescript.return_value = (True, "")
            
            result = await self.automation.activate_application("Cursor")
            
            assert result is True
            mock_applescript.assert_called_once()
    
    @pytest.mark.asyncio
    async def test_send_keyboard_shortcut_valid(self):
        """Test sending valid keyboard shortcut."""
        with patch.object(self.automation, '_run_applescript') as mock_applescript:
            mock_applescript.return_value = (True, "")
            
            result = await self.automation.send_keyboard_shortcut("cmd+c")
            
            assert result is True
            mock_applescript.assert_called_once()
    
    @pytest.mark.asyncio
    async def test_send_keyboard_shortcut_invalid(self):
        """Test sending invalid keyboard shortcut."""
        result = await self.automation.send_keyboard_shortcut("invalid+shortcut")
        assert result is False
    
    @pytest.mark.asyncio
    async def test_clipboard_operations(self):
        """Test clipboard operations."""
        with patch.object(self.automation, '_run_applescript') as mock_applescript:
            # Test get clipboard
            mock_applescript.return_value = (True, "test content")
            content = await self.automation.get_clipboard_content()
            assert content == "test content"
            
            # Test set clipboard
            mock_applescript.return_value = (True, "")
            result = await self.automation.set_clipboard_content("new content")
            assert result is True


class TestLinuxAutomation:
    """Test Linux-specific automation."""
    
    def setup_method(self):
        """Set up test fixtures."""
        self.platform_info = PlatformInfo(
            platform_type=PlatformType.LINUX,
            system="Linux",
            release="5.15.0",
            version="#1 SMP",
            machine="x86_64",
            processor="x86_64"
        )
        self.platform_info.tools_available = {
            "xdotool": True,
            "wmctrl": True,
            "xclip": True,
            "xsel": False,
            "notify-send": True,
            "dbus-send": True,
            "gdbus": True,
        }
        self.automation = LinuxAutomation(self.platform_info)
    
    def test_initialization(self):
        """Test Linux automation initialization."""
        assert self.automation.platform_info.platform_type == PlatformType.LINUX
    
    @pytest.mark.asyncio
    async def test_run_command_success(self):
        """Test successful command execution."""
        with patch('asyncio.create_subprocess_exec') as mock_subprocess:
            mock_process = AsyncMock()
            mock_process.communicate.return_value = (b"success\n", b"")
            mock_process.returncode = 0
            mock_subprocess.return_value = mock_process
            
            success, output = await self.automation._run_command(["echo", "success"])
            
            assert success is True
            assert output == "success"
    
    @pytest.mark.asyncio
    async def test_activate_application_wmctrl(self):
        """Test application activation using wmctrl."""
        with patch.object(self.automation, '_run_command') as mock_command:
            mock_command.return_value = (True, "")
            
            result = await self.automation.activate_application("Cursor")
            
            assert result is True
            mock_command.assert_called_once_with(["wmctrl", "-a", "Cursor"])
    
    @pytest.mark.asyncio
    async def test_activate_application_xdotool(self):
        """Test application activation using xdotool when wmctrl not available."""
        self.platform_info.tools_available["wmctrl"] = False
        
        with patch.object(self.automation, '_run_command') as mock_command:
            # First call returns window ID, second call activates
            mock_command.side_effect = [(True, "12345678"), (True, "")]
            
            result = await self.automation.activate_application("Cursor")
            
            assert result is True
            assert mock_command.call_count == 2
    
    @pytest.mark.asyncio
    async def test_send_keyboard_shortcut(self):
        """Test sending keyboard shortcut."""
        with patch.object(self.automation, '_run_command') as mock_command:
            mock_command.return_value = (True, "")
            
            result = await self.automation.send_keyboard_shortcut("ctrl+c")
            
            assert result is True
            mock_command.assert_called_once_with(["xdotool", "key", "ctrl+c"])
    
    @pytest.mark.asyncio
    async def test_clipboard_operations_xclip(self):
        """Test clipboard operations using xclip."""
        with patch('asyncio.create_subprocess_exec') as mock_subprocess:
            # Test get clipboard
            mock_process = AsyncMock()
            mock_process.communicate.return_value = (b"test content\n", b"")
            mock_process.returncode = 0
            mock_subprocess.return_value = mock_process
            
            content = await self.automation.get_clipboard_content()
            assert content == "test content"
            
            # Test set clipboard
            mock_process.communicate.return_value = (b"", b"")
            mock_process.returncode = 0
            
            result = await self.automation.set_clipboard_content("new content")
            assert result is True


class TestPlatformDetector:
    """Test platform detection."""
    
    @patch('platform.system')
    def test_detect_windows(self, mock_system):
        """Test Windows platform detection."""
        mock_system.return_value = "Windows"
        
        with patch('platform.release'), patch('platform.version'), \
             patch('platform.machine'), patch('platform.processor'):
            platform_info = PlatformDetector.detect_platform()
            
            assert platform_info.platform_type == PlatformType.WINDOWS
    
    @patch('platform.system')
    def test_detect_macos(self, mock_system):
        """Test macOS platform detection."""
        mock_system.return_value = "Darwin"
        
        with patch('platform.release'), patch('platform.version'), \
             patch('platform.machine'), patch('platform.processor'):
            platform_info = PlatformDetector.detect_platform()
            
            assert platform_info.platform_type == PlatformType.MACOS
    
    @patch('platform.system')
    def test_detect_linux(self, mock_system):
        """Test Linux platform detection."""
        mock_system.return_value = "Linux"
        
        with patch('platform.release'), patch('platform.version'), \
             patch('platform.machine'), patch('platform.processor'):
            platform_info = PlatformDetector.detect_platform()
            
            assert platform_info.platform_type == PlatformType.LINUX
    
    @patch('platform.system')
    def test_detect_unknown(self, mock_system):
        """Test unknown platform detection."""
        mock_system.return_value = "FreeBSD"
        
        with patch('platform.release'), patch('platform.version'), \
             patch('platform.machine'), patch('platform.processor'):
            platform_info = PlatformDetector.detect_platform()
            
            assert platform_info.platform_type == PlatformType.UNKNOWN
    
    def test_create_automation_windows(self):
        """Test creating Windows automation."""
        platform_info = PlatformInfo(
            platform_type=PlatformType.WINDOWS,
            system="Windows",
            release="10",
            version="10.0.19041",
            machine="AMD64",
            processor="Intel64"
        )
        
        automation = PlatformDetector.create_automation(platform_info)
        
        assert isinstance(automation, WindowsAutomation)
    
    def test_create_automation_macos(self):
        """Test creating macOS automation."""
        platform_info = PlatformInfo(
            platform_type=PlatformType.MACOS,
            system="Darwin",
            release="23.0.0",
            version="Darwin Kernel Version 23.0.0",
            machine="arm64",
            processor="arm"
        )
        
        automation = PlatformDetector.create_automation(platform_info)
        
        assert isinstance(automation, MacOSAutomation)
    
    def test_create_automation_linux(self):
        """Test creating Linux automation."""
        platform_info = PlatformInfo(
            platform_type=PlatformType.LINUX,
            system="Linux",
            release="5.15.0",
            version="#1 SMP",
            machine="x86_64",
            processor="x86_64"
        )
        
        automation = PlatformDetector.create_automation(platform_info)
        
        assert isinstance(automation, LinuxAutomation)
    
    def test_create_automation_unknown(self):
        """Test creating automation for unknown platform."""
        platform_info = PlatformInfo(
            platform_type=PlatformType.UNKNOWN,
            system="FreeBSD",
            release="13.0",
            version="FreeBSD 13.0",
            machine="amd64",
            processor="amd64"
        )
        
        automation = PlatformDetector.create_automation(platform_info)
        
        assert automation is None


class TestCrossPlatformSupport:
    """Test cross-platform support coordinator."""
    
    def setup_method(self):
        """Set up test fixtures."""
        with patch('src.automation.platform_support.PlatformDetector.detect_platform') as mock_detect:
            mock_detect.return_value = PlatformInfo(
                platform_type=PlatformType.MACOS,
                system="Darwin",
                release="23.0.0",
                version="Darwin Kernel Version 23.0.0",
                machine="arm64",
                processor="arm"
            )
            self.support = CrossPlatformSupport()
    
    def test_initialization(self):
        """Test cross-platform support initialization."""
        assert self.support.platform_info.platform_type == PlatformType.MACOS
        assert self.support.automation is not None
    
    def test_get_platform_info(self):
        """Test getting platform information."""
        platform_info = self.support.get_platform_info()
        
        assert platform_info.platform_type == PlatformType.MACOS
        assert len(platform_info.capabilities) > 0
    
    def test_get_automation(self):
        """Test getting automation instance."""
        automation = self.support.get_automation()
        
        assert automation is not None
        assert isinstance(automation, MacOSAutomation)
    
    def test_has_capability(self):
        """Test capability checking."""
        assert self.support.has_capability(AutomationCapability.CLIPBOARD_ACCESS)
        assert self.support.has_capability(AutomationCapability.WINDOW_MANAGEMENT)
    
    def test_is_tool_available(self):
        """Test tool availability checking."""
        # This will depend on the actual system, so we'll test the method exists
        result = self.support.is_tool_available("osascript")
        assert isinstance(result, bool)
    
    @pytest.mark.asyncio
    async def test_test_automation_capabilities(self):
        """Test automation capability testing."""
        with patch.object(self.support.automation, 'set_clipboard_content') as mock_set, \
             patch.object(self.support.automation, 'get_clipboard_content') as mock_get, \
             patch.object(self.support.automation, 'get_active_window_title') as mock_title, \
             patch.object(self.support.automation, 'is_application_running') as mock_running:
            
            mock_set.return_value = True
            mock_get.return_value = "test_clipboard_content"
            mock_title.return_value = "Test Window"
            mock_running.return_value = False
            
            results = await self.support.test_automation_capabilities()
            
            assert "clipboard" in results
            assert "window_title" in results
            assert "process_detection" in results
            assert results["clipboard"] is True
            assert results["window_title"] is True
            assert results["process_detection"] is True
    
    def test_get_platform_specific_cursor_paths_macos(self):
        """Test getting macOS-specific Cursor paths."""
        paths = self.support.get_platform_specific_cursor_paths()
        
        assert len(paths) > 0
        assert any("Applications" in str(path) for path in paths)
        assert any("Cursor.app" in str(path) for path in paths)
    
    def test_get_platform_specific_config_paths_macos(self):
        """Test getting macOS-specific config paths."""
        paths = self.support.get_platform_specific_config_paths()
        
        assert len(paths) > 0
        assert any("Library" in str(path) for path in paths)
        assert any("Cursor" in str(path) for path in paths)


class TestCrossPlatformSupportIntegration:
    """Integration tests for cross-platform support."""
    
    @pytest.mark.asyncio
    async def test_full_platform_detection_workflow(self):
        """Test complete platform detection and automation workflow."""
        # This test runs on the actual platform
        support = CrossPlatformSupport()
        
        # Should detect current platform
        platform_info = support.get_platform_info()
        assert platform_info.platform_type in [PlatformType.WINDOWS, PlatformType.MACOS, PlatformType.LINUX]
        
        # Should have automation available
        automation = support.get_automation()
        assert automation is not None
        
        # Should have some capabilities
        assert len(platform_info.capabilities) > 0
        
        # Should be able to test capabilities (may fail on CI without GUI)
        try:
            test_results = await support.test_automation_capabilities()
            assert isinstance(test_results, dict)
        except Exception:
            # Expected on headless CI systems
            pass
    
    def test_platform_specific_paths_current_platform(self):
        """Test platform-specific paths for current platform."""
        support = CrossPlatformSupport()
        
        cursor_paths = support.get_platform_specific_cursor_paths()
        config_paths = support.get_platform_specific_config_paths()
        
        # Should return some paths
        assert len(cursor_paths) > 0
        assert len(config_paths) > 0
        
        # Paths should be Path objects
        assert all(isinstance(path, Path) for path in cursor_paths)
        assert all(isinstance(path, Path) for path in config_paths) 