"""
Structured logging configuration for the Cursor Connector Agent.

This module provides centralized logging configuration with:
- Structured logging using structlog
- File rotation support
- Platform-specific log locations
- Development and production configurations
"""

import sys
import logging
import logging.handlers
from pathlib import Path
from typing import Dict, Any, Optional
import structlog
from structlog.stdlib import LoggerFactory

from ..config.settings import get_settings


def setup_logging(
    force_reconfigure: bool = False,
    log_file: Optional[str] = None,
    log_level: Optional[str] = None,
) -> structlog.stdlib.BoundLogger:
    """
    Set up structured logging for the Cursor Connector Agent.
    
    Args:
        force_reconfigure: Force reconfiguration even if already configured
        log_file: Override log file path
        log_level: Override log level
        
    Returns:
        Configured structlog logger
    """
    settings = get_settings()
    
    # Check if already configured
    if hasattr(setup_logging, '_configured') and not force_reconfigure:
        return structlog.get_logger()
    
    # Determine log level
    level = log_level or settings.log_level.value
    numeric_level = getattr(logging, level.upper())
    
    # Create log directory
    settings.create_directories()
    
    # Configure stdlib logging
    root_logger = logging.getLogger()
    root_logger.setLevel(numeric_level)
    
    # Clear existing handlers
    for handler in root_logger.handlers[:]:
        root_logger.removeHandler(handler)
    
    # Create formatter
    formatter = logging.Formatter(
        fmt="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
        datefmt="%Y-%m-%d %H:%M:%S"
    )
    
    # Console handler
    console_handler = logging.StreamHandler(sys.stdout)
    console_handler.setLevel(numeric_level)
    console_handler.setFormatter(formatter)
    root_logger.addHandler(console_handler)
    
    # File handler with rotation (if enabled)
    if settings.log_file or log_file:
        log_path = Path(log_file) if log_file else settings.log_dir / (settings.log_file or "cursor-connector.log")
        
        if settings.log_rotation:
            # Parse max size (e.g., "10MB" -> 10 * 1024 * 1024)
            max_size = parse_size(settings.log_max_size)
            
            file_handler = logging.handlers.RotatingFileHandler(
                filename=log_path,
                maxBytes=max_size,
                backupCount=settings.log_backup_count,
                encoding='utf-8'
            )
        else:
            file_handler = logging.FileHandler(log_path, encoding='utf-8')
        
        file_handler.setLevel(numeric_level)
        file_handler.setFormatter(formatter)
        root_logger.addHandler(file_handler)
    
    # Configure structlog
    structlog.configure(
        processors=[
            structlog.contextvars.merge_contextvars,
            structlog.processors.add_log_level,
            structlog.processors.TimeStamper(fmt="ISO"),
            structlog.dev.set_exc_info,
            structlog.processors.UnicodeDecoder(),
            structlog.processors.JSONRenderer() if not settings.debug_mode else structlog.dev.ConsoleRenderer(),
        ],
        wrapper_class=structlog.make_filtering_bound_logger(numeric_level),
        logger_factory=LoggerFactory(),
        context_class=dict,
        cache_logger_on_first_use=False,
    )
    
    # Mark as configured
    setup_logging._configured = True
    
    # Create and return logger
    logger = structlog.get_logger("cursor_connector")
    logger.info(
        "Logging configured",
        log_level=level,
        log_file=str(log_path) if (settings.log_file or log_file) else None,
        debug_mode=settings.debug_mode,
        agent_id=settings.agent_id,
    )
    
    return logger


def parse_size(size_str: str) -> int:
    """
    Parse size string like '10MB' into bytes.
    
    Args:
        size_str: Size string (e.g., '10MB', '1GB', '500KB')
        
    Returns:
        Size in bytes
    """
    size_str = size_str.upper().strip()
    
    # Extract number and unit
    import re
    match = re.match(r'^(\d+(?:\.\d+)?)\s*([KMGT]?B?)$', size_str)
    if not match:
        raise ValueError(f"Invalid size format: {size_str}")
    
    number, unit = match.groups()
    number = float(number)
    
    # Convert to bytes
    multipliers = {
        'B': 1,
        'KB': 1024,
        'MB': 1024 * 1024,
        'GB': 1024 * 1024 * 1024,
        'TB': 1024 * 1024 * 1024 * 1024,
        '': 1,  # Default to bytes
    }
    
    return int(number * multipliers.get(unit, 1))


def get_logger(name: str = "cursor_connector") -> structlog.stdlib.BoundLogger:
    """
    Get a structured logger with the specified name.
    
    Args:
        name: Logger name
        
    Returns:
        Structured logger instance
    """
    # Ensure logging is set up
    if not hasattr(setup_logging, '_configured'):
        setup_logging()
    
    return structlog.get_logger(name)


def log_function_call(logger: structlog.stdlib.BoundLogger):
    """
    Decorator to log function calls with arguments and results.
    
    Args:
        logger: Logger instance to use
        
    Returns:
        Decorator function
    """
    def decorator(func):
        def wrapper(*args, **kwargs):
            logger.debug(
                "Function called",
                function=func.__name__,
                args=args if len(args) < 5 else f"{len(args)} args",
                kwargs=list(kwargs.keys()) if kwargs else None,
            )
            
            try:
                result = func(*args, **kwargs)
                logger.debug(
                    "Function completed",
                    function=func.__name__,
                    result_type=type(result).__name__,
                )
                return result
            except Exception as e:
                logger.error(
                    "Function failed",
                    function=func.__name__,
                    error=str(e),
                    error_type=type(e).__name__,
                )
                raise
        
        return wrapper
    return decorator


class LogContext:
    """Context manager for adding structured context to logs."""
    
    def __init__(self, **context):
        """
        Initialize log context.
        
        Args:
            **context: Context variables to add to logs
        """
        self.context = context
        
    def __enter__(self):
        """Enter context and bind variables."""
        structlog.contextvars.bind_contextvars(**self.context)
        return self
        
    def __exit__(self, exc_type, exc_val, exc_tb):
        """Exit context and clear variables."""
        structlog.contextvars.clear_contextvars()


# Convenience functions for common log contexts
def task_context(task_id: str, **extra):
    """Create log context for task operations."""
    return LogContext(task_id=task_id, **extra)


def command_context(command_id: str, command_type: str, **extra):
    """Create log context for command operations."""
    return LogContext(command_id=command_id, command_type=command_type, **extra)


def ssh_context(host: str, user: Optional[str] = None, **extra):
    """Create log context for SSH operations."""
    context = {"ssh_host": host}
    if user:
        context["ssh_user"] = user
    context.update(extra)
    return LogContext(**context) 