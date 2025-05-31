"""
Tests for the configuration system.
"""

import os
import tempfile
import pytest
from pathlib import Path
from unittest.mock import patch

import sys
sys.path.insert(0, str(Path(__file__).parent.parent / "src"))

from src.config.settings import AgentSettings, LogLevel, PlatformType, get_settings, reload_settings


class TestAgentSettings:
    """Test cases for AgentSettings configuration."""
    
    def test_default_settings(self):
        """Test default configuration values."""
        settings = AgentSettings()
        
        assert settings.rpi_host == "localhost"
        assert settings.rpi_port == 8000
        assert settings.rpi_protocol == "http"
        assert settings.log_level == LogLevel.INFO
        assert settings.poll_interval == 2.0
        assert settings.connection_timeout == 30
        assert settings.retry_attempts == 3
        assert settings.debug_mode is False
        assert settings.mock_cursor is False
        
    def test_environment_variable_override(self):
        """Test that environment variables override defaults."""
        with patch.dict(os.environ, {
            'RPI_HOST': 'test-host',
            'RPI_PORT': '9000',
            'LOG_LEVEL': 'DEBUG',
            'DEBUG': '1',  # Use '1' instead of 'true' for boolean
            'MOCK_CURSOR': '1'
        }, clear=False):
            settings = AgentSettings()
            
            assert settings.rpi_host == "test-host"
            assert settings.rpi_port == 9000
            assert settings.log_level == LogLevel.DEBUG
            assert settings.debug_mode is True
            assert settings.mock_cursor is True
    
    def test_protocol_validation(self):
        """Test protocol validation."""
        # Valid protocols
        settings = AgentSettings(rpi_protocol="http")
        assert settings.rpi_protocol == "http"
        
        settings = AgentSettings(rpi_protocol="https")
        assert settings.rpi_protocol == "https"
        
        # Invalid protocol should raise error
        with pytest.raises(ValueError, match="Protocol must be 'http' or 'https'"):
            AgentSettings(rpi_protocol="ftp")
    
    def test_log_level_validation(self):
        """Test log level validation and conversion."""
        # Valid log levels (string)
        settings = AgentSettings(log_level="DEBUG")
        assert settings.log_level == LogLevel.DEBUG
        
        settings = AgentSettings(log_level="info")  # Case insensitive
        assert settings.log_level == LogLevel.INFO
        
        # Valid log levels (enum)
        settings = AgentSettings(log_level=LogLevel.ERROR)
        assert settings.log_level == LogLevel.ERROR
    
    def test_url_properties(self):
        """Test URL property generation."""
        settings = AgentSettings(
            rpi_host="example.com",
            rpi_port=8080,
            rpi_protocol="https"
        )
        
        assert settings.rpi_base_url == "https://example.com:8080"
        assert settings.rpi_api_url == "https://example.com:8080/api"
        assert settings.rpi_ws_url == "wss://example.com:8080/ws"
    
    def test_platform_detection(self):
        """Test platform detection."""
        settings = AgentSettings()
        
        # Platform should be automatically detected
        assert isinstance(settings.platform, PlatformType)
        assert settings.platform in [PlatformType.WINDOWS, PlatformType.MACOS, PlatformType.LINUX]
    
    def test_config_directories(self):
        """Test platform-specific config directory paths."""
        settings = AgentSettings()
        
        # Should return valid Path objects
        assert isinstance(settings.config_dir, Path)
        assert isinstance(settings.log_dir, Path)
        
        # Should contain platform-appropriate names
        config_str = str(settings.config_dir)
        log_str = str(settings.log_dir)
        
        if settings.platform == PlatformType.WINDOWS:
            assert "AppData" in config_str
            assert "CursorConnector" in config_str
        elif settings.platform == PlatformType.MACOS:
            assert "Library" in config_str
            assert "CursorConnector" in config_str
        else:  # Linux
            assert ".config" in config_str or ".local" in log_str
    
    def test_http_headers(self):
        """Test HTTP header generation."""
        settings = AgentSettings(
            agent_name="Test Agent",
            version="2.0.0",
            rpi_api_key="test-key-123"
        )
        
        headers = settings.get_headers()
        
        assert headers["Content-Type"] == "application/json"
        assert headers["User-Agent"] == "Test Agent/2.0.0"
        assert "X-Agent-ID" in headers
        assert headers["X-API-Key"] == "test-key-123"
    
    def test_http_headers_without_api_key(self):
        """Test HTTP header generation without API key."""
        settings = AgentSettings(rpi_api_key=None)
        headers = settings.get_headers()
        
        assert "X-API-Key" not in headers
        assert headers["Content-Type"] == "application/json"
    
    def test_create_directories(self):
        """Test directory creation."""
        with tempfile.TemporaryDirectory() as temp_dir:
            temp_path = Path(temp_dir)
            
            # Mock the property methods to use temp location
            settings = AgentSettings()
            with patch.object(type(settings), 'config_dir', new_callable=lambda: property(lambda self: temp_path / "config")):
                with patch.object(type(settings), 'log_dir', new_callable=lambda: property(lambda self: temp_path / "logs")):
                    settings.create_directories()
                    
                    assert (temp_path / "config").exists()
                    assert (temp_path / "logs").exists()
    
    def test_cursor_path_validation(self):
        """Test Cursor executable path validation."""
        # Valid path (if exists)
        with tempfile.NamedTemporaryFile() as temp_file:
            settings = AgentSettings(cursor_executable_path=temp_file.name)
            assert settings.cursor_executable_path == temp_file.name
        
        # Invalid path should raise error
        with pytest.raises(ValueError, match="Cursor executable not found"):
            AgentSettings(cursor_executable_path="/nonexistent/path/cursor")
        
        # None should be allowed
        settings = AgentSettings(cursor_executable_path=None)
        assert settings.cursor_executable_path is None


class TestGlobalSettings:
    """Test cases for global settings functions."""
    
    def test_get_settings(self):
        """Test global settings accessor."""
        settings = get_settings()
        assert isinstance(settings, AgentSettings)
        
        # Should return the same instance
        settings2 = get_settings()
        assert settings is settings2
    
    def test_reload_settings(self):
        """Test settings reload functionality."""
        # Get initial settings
        settings1 = get_settings()
        
        # Reload settings
        with patch.dict(os.environ, {'RPI_HOST': 'new-host'}):
            settings2 = reload_settings()
            
            # Should be a new instance with updated values
            assert settings1 is not settings2
            assert settings2.rpi_host == "new-host"
            
            # Global settings should be updated
            settings3 = get_settings()
            assert settings3 is settings2
            assert settings3.rpi_host == "new-host" 