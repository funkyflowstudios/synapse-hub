"""
Configuration management for Synapse-Hub backend.

Handles environment variables, database settings, AI API keys,
and deployment-specific configuration with validation.
"""

import os
from functools import lru_cache
from typing import Optional, List
from pydantic import validator, Field
from pydantic_settings import BaseSettings
import secrets


class Settings(BaseSettings):
    """
    Application settings with environment variable support.
    
    All settings can be overridden via environment variables
    with the SYNAPSE_ prefix (e.g., SYNAPSE_DEBUG=true).
    """
    
    # Application Settings
    app_name: str = Field(default="Synapse-Hub Backend", description="Application name")
    version: str = Field(default="0.1.0", description="Application version")
    debug: bool = Field(default=False, description="Debug mode")
    environment: str = Field(default="development", description="Environment (development/staging/production)")
    
    # Server Settings
    host: str = Field(default="0.0.0.0", description="Server host")
    port: int = Field(default=8000, description="Server port")
    reload: bool = Field(default=True, description="Auto-reload on code changes")
    workers: int = Field(default=1, description="Number of worker processes")
    
    # Database Settings
    database_url: str = Field(default="sqlite+aiosqlite:///./synapse_hub.db", description="Database connection URL")
    database_echo: bool = Field(default=False, description="Echo SQL queries")
    database_pool_size: int = Field(default=5, description="Database connection pool size")
    database_max_overflow: int = Field(default=10, description="Max database connections overflow")
    
    # Security Settings
    secret_key: str = Field(default_factory=lambda: secrets.token_urlsafe(32), description="Secret key for JWT tokens")
    access_token_expire_minutes: int = Field(default=30, description="Access token expiration time in minutes")
    refresh_token_expire_days: int = Field(default=7, description="Refresh token expiration time in days")
    algorithm: str = Field(default="HS256", description="JWT algorithm")
    
    # CORS Settings
    allowed_origins: List[str] = Field(default=["http://localhost:5173", "http://localhost:3000"], description="Allowed CORS origins")
    allowed_methods: List[str] = Field(default=["GET", "POST", "PUT", "DELETE", "OPTIONS"], description="Allowed HTTP methods")
    allowed_headers: List[str] = Field(default=["*"], description="Allowed headers")
    
    # AI Integration Settings
    gemini_api_key: Optional[str] = Field(default=None, description="Google Gemini API key")
    openai_api_key: Optional[str] = Field(default=None, description="OpenAI API key (backup)")
    anthropic_api_key: Optional[str] = Field(default=None, description="Anthropic API key (backup)")
    
    # AI Configuration
    default_ai_provider: str = Field(default="gemini", description="Default AI provider (gemini/openai/anthropic)")
    ai_request_timeout: int = Field(default=30, description="AI request timeout in seconds")
    ai_max_retries: int = Field(default=3, description="Maximum AI request retries")
    ai_rate_limit_requests: int = Field(default=100, description="AI requests per minute limit")
    
    # Cursor Connector Settings
    cursor_connector_enabled: bool = Field(default=True, description="Enable Cursor Connector integration")
    cursor_polling_interval: int = Field(default=5, description="Cursor Connector polling interval in seconds")
    cursor_request_timeout: int = Field(default=60, description="Cursor request timeout in seconds")
    cursor_max_concurrent_tasks: int = Field(default=5, description="Maximum concurrent Cursor tasks")
    
    # WebSocket Settings
    websocket_heartbeat_interval: int = Field(default=30, description="WebSocket heartbeat interval in seconds")
    websocket_max_connections: int = Field(default=100, description="Maximum WebSocket connections")
    websocket_message_queue_size: int = Field(default=1000, description="WebSocket message queue size")
    
    # Task Management Settings
    max_task_duration: int = Field(default=3600, description="Maximum task duration in seconds")
    task_cleanup_interval: int = Field(default=300, description="Task cleanup interval in seconds")
    max_concurrent_tasks: int = Field(default=10, description="Maximum concurrent tasks")
    task_retry_attempts: int = Field(default=3, description="Task retry attempts")
    
    # Logging Settings
    log_level: str = Field(default="INFO", description="Logging level")
    log_format: str = Field(default="json", description="Log format (json/text)")
    log_file: Optional[str] = Field(default=None, description="Log file path")
    
    # Monitoring Settings
    prometheus_enabled: bool = Field(default=True, description="Enable Prometheus metrics")
    prometheus_port: int = Field(default=8001, description="Prometheus metrics port")
    health_check_enabled: bool = Field(default=True, description="Enable health check endpoints")
    
    # File Storage Settings
    upload_max_size: int = Field(default=10 * 1024 * 1024, description="Maximum upload size in bytes (10MB)")
    upload_allowed_types: List[str] = Field(
        default=["image/jpeg", "image/png", "text/plain", "application/pdf"],
        description="Allowed upload MIME types"
    )
    storage_path: str = Field(default="./storage", description="File storage path")
    
    # Cache Settings
    redis_url: Optional[str] = Field(default=None, description="Redis URL for caching")
    cache_ttl: int = Field(default=300, description="Default cache TTL in seconds")
    
    @validator("environment")
    def validate_environment(cls, v):
        """Validate environment setting."""
        if v not in ["development", "staging", "production"]:
            raise ValueError("Environment must be 'development', 'staging', or 'production'")
        return v
    
    @validator("log_level")
    def validate_log_level(cls, v):
        """Validate log level setting."""
        valid_levels = ["DEBUG", "INFO", "WARNING", "ERROR", "CRITICAL"]
        if v.upper() not in valid_levels:
            raise ValueError(f"Log level must be one of: {', '.join(valid_levels)}")
        return v.upper()
    
    @validator("default_ai_provider")
    def validate_ai_provider(cls, v):
        """Validate AI provider setting."""
        valid_providers = ["gemini", "openai", "anthropic"]
        if v not in valid_providers:
            raise ValueError(f"AI provider must be one of: {', '.join(valid_providers)}")
        return v
    
    @validator("database_url")
    def validate_database_url(cls, v):
        """Validate database URL format."""
        if not v.startswith(("sqlite", "postgresql", "mysql")):
            raise ValueError("Database URL must start with sqlite, postgresql, or mysql")
        return v
    
    @property
    def is_development(self) -> bool:
        """Check if running in development mode."""
        return self.environment == "development"
    
    @property
    def is_production(self) -> bool:
        """Check if running in production mode."""
        return self.environment == "production"
    
    @property
    def database_name(self) -> str:
        """Extract database name from URL."""
        if "sqlite" in self.database_url:
            return self.database_url.split("/")[-1].replace(".db", "")
        return "synapse_hub"
    
    def get_ai_api_key(self, provider: Optional[str] = None) -> Optional[str]:
        """Get API key for specified AI provider."""
        provider = provider or self.default_ai_provider
        
        if provider == "gemini":
            return self.gemini_api_key
        elif provider == "openai":
            return self.openai_api_key
        elif provider == "anthropic":
            return self.anthropic_api_key
        else:
            return None
    
    class Config:
        """Pydantic configuration."""
        env_prefix = "SYNAPSE_"
        env_file = ".env"
        case_sensitive = False
        
        @classmethod
        def customise_sources(
            cls,
            init_settings,
            env_settings,
            file_secret_settings,
        ):
            """Customize settings sources priority."""
            return (
                init_settings,
                env_settings,
                file_secret_settings,
            )


@lru_cache()
def get_settings() -> Settings:
    """
    Get application settings with caching.
    
    Uses lru_cache to ensure settings are loaded only once
    and cached for subsequent calls.
    """
    return Settings()


# Convenience functions
def get_database_url() -> str:
    """Get database connection URL."""
    return get_settings().database_url


def get_secret_key() -> str:
    """Get application secret key."""
    return get_settings().secret_key


def is_development() -> bool:
    """Check if running in development mode."""
    return get_settings().is_development


def is_production() -> bool:
    """Check if running in production mode."""
    return get_settings().is_production


# Environment-specific configuration
class DevelopmentSettings(Settings):
    """Development-specific settings."""
    debug: bool = True
    reload: bool = True
    database_echo: bool = True
    log_level: str = "DEBUG"


class ProductionSettings(Settings):
    """Production-specific settings."""
    debug: bool = False
    reload: bool = False
    database_echo: bool = False
    log_level: str = "INFO"
    workers: int = 4


class TestingSettings(Settings):
    """Testing-specific settings."""
    database_url: str = "sqlite+aiosqlite:///:memory:"
    secret_key: str = "test-secret-key"
    debug: bool = True


def get_settings_for_environment(env: str) -> Settings:
    """Get settings for specific environment."""
    if env == "development":
        return DevelopmentSettings()
    elif env == "production":
        return ProductionSettings()
    elif env == "testing":
        return TestingSettings()
    else:
        return Settings()


# Export main settings instance
settings = get_settings() 