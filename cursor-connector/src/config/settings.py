"""
Configuration management for the Cursor Connector Agent.

This module handles all configuration settings including:
- RPi backend connection settings
- Agent behavior configuration
- Platform-specific settings
- Logging configuration
"""

import os
import platform
from pathlib import Path
from typing import Optional, Dict, Any, List
from pydantic import Field, field_validator, ConfigDict
from pydantic_settings import BaseSettings
from enum import Enum


class LogLevel(str, Enum):
    """Logging levels for the agent."""
    DEBUG = "DEBUG"
    INFO = "INFO"
    WARNING = "WARNING"
    ERROR = "ERROR"
    CRITICAL = "CRITICAL"


class PlatformType(str, Enum):
    """Supported platform types."""
    WINDOWS = "windows"
    MACOS = "darwin"
    LINUX = "linux"


# For backward compatibility
Platform = PlatformType


class AgentSettings(BaseSettings):
    """
    Main configuration class for the Cursor Connector Agent.
    
    Settings are loaded from environment variables, .env files, and defaults.
    """
    
    # Agent Identity
    agent_id: str = Field(default_factory=lambda: f"cursor-connector-{platform.node()}")
    agent_name: str = Field(default="Cursor Connector Agent")
    version: str = Field(default="1.0.0")
    
    # RPi Backend Connection
    rpi_host: str = Field(default="localhost", alias="RPI_HOST")
    rpi_port: int = Field(default=8000, alias="RPI_PORT") 
    rpi_protocol: str = Field(default="http", alias="RPI_PROTOCOL")
    rpi_api_key: Optional[str] = Field(default=None, alias="RPI_API_KEY")
    
    # Connection Settings
    connection_timeout: int = Field(default=30, description="Connection timeout in seconds")
    retry_attempts: int = Field(default=3, description="Number of retry attempts")
    retry_delay: float = Field(default=1.0, description="Delay between retries in seconds")
    heartbeat_interval: int = Field(default=30, description="Heartbeat interval in seconds")
    
    # Agent Behavior
    poll_interval: float = Field(default=2.0, description="Task polling interval in seconds")
    command_timeout: int = Field(default=300, description="Command execution timeout in seconds")
    auto_start: bool = Field(default=False, description="Auto-start agent on system boot")
    
    # Cursor Application Settings
    cursor_executable_path: Optional[str] = Field(default=None, alias="CURSOR_PATH")
    cursor_detection_timeout: int = Field(default=10, description="Cursor detection timeout")
    cursor_response_timeout: int = Field(default=120, description="Cursor response timeout")
    
    # SSH Context Settings
    ssh_context_enabled: bool = Field(default=True, description="Enable SSH context detection")
    ssh_config_path: Optional[str] = Field(default=None, alias="SSH_CONFIG_PATH")
    
    # Logging Configuration
    log_level: LogLevel = Field(default=LogLevel.INFO, alias="LOG_LEVEL")
    log_file: Optional[str] = Field(default=None, alias="LOG_FILE")
    log_rotation: bool = Field(default=True, description="Enable log rotation")
    log_max_size: str = Field(default="10MB", description="Maximum log file size")
    log_backup_count: int = Field(default=5, description="Number of backup log files")
    
    # Platform Detection
    platform: PlatformType = Field(default_factory=lambda: PlatformType(platform.system().lower()))
    
    # Development Settings
    debug_mode: bool = Field(default=False, alias="DEBUG")
    mock_cursor: bool = Field(default=False, alias="MOCK_CURSOR")
    
    # Security Settings
    api_key_header: str = Field(default="X-API-Key")
    secure_connection: bool = Field(default=False, description="Require HTTPS for RPi connection")
    
    model_config = ConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        populate_by_name=True,
    )
        
    @field_validator("rpi_protocol")
    @classmethod
    def validate_protocol(cls, v):
        """Validate RPi protocol."""
        if v not in ["http", "https"]:
            raise ValueError("Protocol must be 'http' or 'https'")
        return v
    
    @field_validator("log_level", mode="before")
    @classmethod
    def validate_log_level(cls, v):
        """Validate and convert log level."""
        if isinstance(v, str):
            return LogLevel(v.upper())
        return v
    
    @field_validator("cursor_executable_path")
    @classmethod
    def validate_cursor_path(cls, v):
        """Validate Cursor executable path if provided."""
        if v and not Path(v).exists():
            raise ValueError(f"Cursor executable not found at: {v}")
        return v
    
    @property
    def rpi_base_url(self) -> str:
        """Get the complete RPi backend base URL."""
        return f"{self.rpi_protocol}://{self.rpi_host}:{self.rpi_port}"
    
    @property
    def rpi_api_url(self) -> str:
        """Get the RPi API base URL."""
        return f"{self.rpi_base_url}/api"
    
    @property
    def rpi_ws_url(self) -> str:
        """Get the RPi WebSocket URL."""
        ws_protocol = "wss" if self.rpi_protocol == "https" else "ws"
        return f"{ws_protocol}://{self.rpi_host}:{self.rpi_port}/ws"
    
    @property
    def config_dir(self) -> Path:
        """Get the configuration directory."""
        if self.platform == PlatformType.WINDOWS:
            return Path.home() / "AppData" / "Local" / "CursorConnector"
        elif self.platform == PlatformType.MACOS:
            return Path.home() / "Library" / "Application Support" / "CursorConnector"
        else:  # Linux
            return Path.home() / ".config" / "cursor-connector"
    
    @property
    def log_dir(self) -> Path:
        """Get the log directory."""
        if self.platform == PlatformType.WINDOWS:
            return Path.home() / "AppData" / "Local" / "CursorConnector" / "logs"
        elif self.platform == PlatformType.MACOS:
            return Path.home() / "Library" / "Logs" / "CursorConnector"
        else:  # Linux
            return Path.home() / ".local" / "share" / "cursor-connector" / "logs"
    
    def get_headers(self) -> Dict[str, str]:
        """Get HTTP headers for RPi communication."""
        headers = {
            "Content-Type": "application/json",
            "User-Agent": f"{self.agent_name}/{self.version}",
            "X-Agent-ID": self.agent_id,
        }
        
        if self.rpi_api_key:
            headers[self.api_key_header] = self.rpi_api_key
            
        return headers
    
    def create_directories(self):
        """Create necessary directories for configuration and logs."""
        self.config_dir.mkdir(parents=True, exist_ok=True)
        self.log_dir.mkdir(parents=True, exist_ok=True)


# Global settings instance
settings = AgentSettings()


def get_settings() -> AgentSettings:
    """Get the global settings instance."""
    return settings


def reload_settings() -> AgentSettings:
    """Reload settings from environment and config files."""
    global settings
    settings = AgentSettings()
    return settings 