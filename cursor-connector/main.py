#!/usr/bin/env python3
"""
Main entry point for the Cursor Connector Agent.

This script provides a simple way to start the agent with command-line options.
"""

import sys
import asyncio
import argparse
from pathlib import Path

# Add src to path for imports
sys.path.insert(0, str(Path(__file__).parent / "src"))

from src.agent import main, CursorConnectorAgent
from src.config.settings import get_settings, reload_settings
from src.utils.logging import setup_logging


def parse_args():
    """Parse command line arguments."""
    parser = argparse.ArgumentParser(
        description="Cursor Connector Agent - Local machine agent for Synapse-Hub",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Environment Variables:
  RPI_HOST          RPi backend hostname (default: localhost)
  RPI_PORT          RPi backend port (default: 8000)
  RPI_PROTOCOL      RPi backend protocol (default: http)
  RPI_API_KEY       RPi backend API key
  LOG_LEVEL         Logging level (default: INFO)
  LOG_FILE          Log file path
  DEBUG             Enable debug mode (default: False)
  MOCK_CURSOR       Enable mock Cursor mode for testing (default: False)

Examples:
  python main.py
  python main.py --debug --mock-cursor
  RPI_HOST=192.168.1.100 python main.py
        """
    )
    
    parser.add_argument(
        "--rpi-host",
        help="RPi backend hostname"
    )
    
    parser.add_argument(
        "--rpi-port",
        type=int,
        help="RPi backend port"
    )
    
    parser.add_argument(
        "--debug",
        action="store_true",
        help="Enable debug mode"
    )
    
    parser.add_argument(
        "--mock-cursor",
        action="store_true",
        help="Enable mock Cursor mode for testing"
    )
    
    parser.add_argument(
        "--log-level",
        choices=["DEBUG", "INFO", "WARNING", "ERROR", "CRITICAL"],
        help="Set logging level"
    )
    
    parser.add_argument(
        "--log-file",
        help="Log file path"
    )
    
    parser.add_argument(
        "--version",
        action="version",
        version="Cursor Connector Agent 1.0.0"
    )
    
    return parser.parse_args()


def configure_from_args(args):
    """Configure settings from command line arguments."""
    import os
    
    # Set environment variables from args
    if args.rpi_host:
        os.environ["RPI_HOST"] = args.rpi_host
    if args.rpi_port:
        os.environ["RPI_PORT"] = str(args.rpi_port)
    if args.debug:
        os.environ["DEBUG"] = "true"
    if args.mock_cursor:
        os.environ["MOCK_CURSOR"] = "true"
    if args.log_level:
        os.environ["LOG_LEVEL"] = args.log_level
    if args.log_file:
        os.environ["LOG_FILE"] = args.log_file
    
    # Reload settings to pick up changes
    reload_settings()


def main_cli():
    """Main CLI entry point."""
    args = parse_args()
    configure_from_args(args)
    
    # Set up logging
    setup_logging()
    
    # Run the agent
    try:
        exit_code = asyncio.run(main())
        sys.exit(exit_code)
    except KeyboardInterrupt:
        print("\nInterrupted by user")
        sys.exit(130)
    except Exception as e:
        print(f"Fatal error: {e}")
        sys.exit(1)


if __name__ == "__main__":
    main_cli() 