"""
Main Cursor Connector Agent.

This module provides the main agent class that coordinates all components:
- RPi backend communication
- Task polling and execution
- Health monitoring and status reporting
- Graceful shutdown handling
"""

import asyncio
import signal
import sys
from typing import Dict, Any, Optional, List
from datetime import datetime, timezone
from pathlib import Path

from .config.settings import get_settings
from .utils.logging import setup_logging, get_logger, task_context, command_context
from .communication.rpi_client import RPiClient, AgentStatus, CommandData


class CursorConnectorAgent:
    """
    Main agent class that coordinates all Cursor Connector functionality.
    
    Responsibilities:
    - Establish and maintain connection to RPi backend
    - Poll for and execute Cursor commands
    - Report agent status and health
    - Handle graceful shutdown
    """
    
    def __init__(self):
        """Initialize the Cursor Connector Agent."""
        self.settings = get_settings()
        self.logger = setup_logging()
        self.rpi_client: Optional[RPiClient] = None
        self._running = False
        self._tasks: List[asyncio.Task] = []
        self._shutdown_event = asyncio.Event()
        
        # Agent state
        self.agent_status = AgentStatus(
            agent_id=self.settings.agent_id,
            status="initializing",
            platform=self.settings.platform.value,
            cursor_available=False,
            last_heartbeat=datetime.now(timezone.utc),
            capabilities=["cursor_automation"],
        )
        
        self.logger.info(
            "Cursor Connector Agent initialized",
            agent_id=self.settings.agent_id,
            platform=self.settings.platform.value,
            rpi_host=self.settings.rpi_host,
            rpi_port=self.settings.rpi_port,
        )
    
    async def start(self):
        """Start the agent and all background tasks."""
        if self._running:
            self.logger.warning("Agent is already running")
            return
        
        try:
            self.logger.info("Starting Cursor Connector Agent")
            self._running = True
            
            # Initialize RPi client
            self.rpi_client = RPiClient()
            await self.rpi_client.connect()
            
            # Update agent status
            self.agent_status.status = "connecting"
            await self._update_cursor_availability()
            
            # Register with RPi backend
            self.agent_status.status = "active"
            await self.rpi_client.register_agent(self.agent_status)
            
            # Start background tasks
            self._tasks = [
                asyncio.create_task(self._command_polling_loop(), name="command_polling"),
                asyncio.create_task(self._status_monitoring_loop(), name="status_monitoring"),
                asyncio.create_task(self._websocket_listener_loop(), name="websocket_listener"),
            ]
            
            self.logger.info(
                "Agent started successfully",
                tasks=len(self._tasks),
                agent_status=self.agent_status.status,
            )
            
            # Wait for shutdown signal
            await self._shutdown_event.wait()
            
        except Exception as e:
            self.logger.error("Failed to start agent", error=str(e))
            raise
        finally:
            await self.stop()
    
    async def stop(self):
        """Stop the agent and clean up resources."""
        if not self._running:
            return
        
        self.logger.info("Stopping Cursor Connector Agent")
        self._running = False
        
        # Update status to offline
        if self.rpi_client and self.rpi_client.is_connected:
            try:
                self.agent_status.status = "offline"
                await self.rpi_client.update_agent_status(self.agent_status)
            except Exception as e:
                self.logger.warning("Failed to update status to offline", error=str(e))
        
        # Cancel background tasks
        for task in self._tasks:
            if not task.done():
                task.cancel()
        
        # Wait for tasks to complete
        if self._tasks:
            await asyncio.gather(*self._tasks, return_exceptions=True)
        
        # Disconnect from RPi
        if self.rpi_client:
            await self.rpi_client.disconnect()
        
        self.logger.info("Agent stopped successfully")
    
    def shutdown(self):
        """Signal shutdown from signal handler."""
        self.logger.info("Shutdown signal received")
        self._shutdown_event.set()
    
    async def _command_polling_loop(self):
        """Background task to poll for and execute commands."""
        self.logger.info("Starting command polling loop")
        
        while self._running:
            try:
                # Get pending commands
                commands = await self.rpi_client.get_pending_commands(self.settings.agent_id)
                
                if commands:
                    self.logger.info(f"Received {len(commands)} pending command(s)")
                    
                    # Process commands
                    for command in commands:
                        if not self._running:
                            break
                            
                        await self._execute_command(command)
                
                # Wait before next poll
                await asyncio.sleep(self.settings.poll_interval)
                
            except asyncio.CancelledError:
                self.logger.info("Command polling loop cancelled")
                break
            except Exception as e:
                self.logger.error("Error in command polling loop", error=str(e))
                await asyncio.sleep(self.settings.poll_interval * 2)  # Back off on error
    
    async def _status_monitoring_loop(self):
        """Background task to monitor and report agent status."""
        self.logger.info("Starting status monitoring loop")
        
        while self._running:
            try:
                # Update Cursor availability
                await self._update_cursor_availability()
                
                # Update status timestamp
                self.agent_status.last_heartbeat = datetime.now(timezone.utc)
                
                # Report status every few polling cycles
                # (Heartbeat is handled by RPiClient, this is for additional monitoring)
                
                # Wait before next check
                await asyncio.sleep(self.settings.heartbeat_interval)
                
            except asyncio.CancelledError:
                self.logger.info("Status monitoring loop cancelled")
                break
            except Exception as e:
                self.logger.error("Error in status monitoring loop", error=str(e))
                await asyncio.sleep(self.settings.heartbeat_interval)
    
    async def _websocket_listener_loop(self):
        """Background task to listen for real-time updates via WebSocket."""
        self.logger.info("Starting WebSocket listener loop")
        
        while self._running:
            try:
                async for message in self.rpi_client.listen_websocket():
                    if not self._running:
                        break
                    
                    await self._handle_websocket_message(message)
                    
            except asyncio.CancelledError:
                self.logger.info("WebSocket listener loop cancelled")
                break
            except Exception as e:
                self.logger.warning("WebSocket connection error, will retry", error=str(e))
                await asyncio.sleep(5)  # Wait before reconnecting
    
    async def _execute_command(self, command: CommandData):
        """
        Execute a single Cursor command.
        
        Args:
            command: Command to execute
        """
        with command_context(command.command_id, "cursor_automation"):
            self.logger.info(
                "Executing command",
                command_id=command.command_id,
                requires_ssh=command.requires_ssh,
                ssh_host=command.ssh_host,
            )
            
            result = {
                "command_id": command.command_id,
                "status": "unknown",
                "output": "",
                "error": None,
                "timestamp": datetime.now(timezone.utc).isoformat(),
                "agent_id": self.settings.agent_id,
            }
            
            try:
                # Check if command requires SSH context
                if command.requires_ssh:
                    ssh_available = await self._check_ssh_context(command.ssh_host, command.ssh_user)
                    if not ssh_available:
                        result.update({
                            "status": "failed",
                            "error": f"SSH context not available for {command.ssh_host}",
                        })
                        await self.rpi_client.submit_command_result(
                            self.settings.agent_id, 
                            command.command_id, 
                            result
                        )
                        return
                
                # Check Cursor availability
                if not self.agent_status.cursor_available:
                    await self._update_cursor_availability()
                    if not self.agent_status.cursor_available:
                        result.update({
                            "status": "failed",
                            "error": "Cursor application not available",
                        })
                        await self.rpi_client.submit_command_result(
                            self.settings.agent_id, 
                            command.command_id, 
                            result
                        )
                        return
                
                # Execute the command (placeholder for actual Cursor automation)
                if self.settings.mock_cursor:
                    # Mock execution for testing
                    await asyncio.sleep(2)  # Simulate work
                    result.update({
                        "status": "completed",
                        "output": f"Mock response to: {command.prompt[:50]}...",
                    })
                else:
                    # TODO: Implement actual Cursor automation in Phase 3.2
                    result.update({
                        "status": "failed",
                        "error": "Cursor automation not yet implemented (Phase 3.2)",
                    })
                
            except Exception as e:
                self.logger.error("Command execution failed", error=str(e))
                result.update({
                    "status": "failed",
                    "error": f"Execution error: {str(e)}",
                })
            
            # Submit result
            try:
                await self.rpi_client.submit_command_result(
                    self.settings.agent_id, 
                    command.command_id, 
                    result
                )
                self.logger.info(
                    "Command completed",
                    command_id=command.command_id,
                    status=result["status"],
                )
            except Exception as e:
                self.logger.error("Failed to submit command result", error=str(e))
    
    async def _handle_websocket_message(self, message: Dict[str, Any]):
        """
        Handle incoming WebSocket messages.
        
        Args:
            message: WebSocket message data
        """
        message_type = message.get("type")
        
        if message_type == "command":
            # Real-time command (high priority)
            command_data = message.get("data", {})
            command = CommandData(**command_data)
            await self._execute_command(command)
            
        elif message_type == "status_request":
            # Status update request
            await self.rpi_client.update_agent_status(self.agent_status)
            
        elif message_type == "ping":
            # Ping/pong for connection health
            self.logger.debug("Received ping, connection healthy")
            
        else:
            self.logger.warning("Unknown WebSocket message type", message_type=message_type)
    
    async def _update_cursor_availability(self):
        """Update Cursor application availability status."""
        if self.settings.mock_cursor:
            # Mock availability for testing
            self.agent_status.cursor_available = True
            return
        
        # TODO: Implement actual Cursor detection in Phase 3.2
        # For now, assume Cursor is available
        self.agent_status.cursor_available = True
        
        # Update SSH context if enabled
        if self.settings.ssh_context_enabled:
            self.agent_status.ssh_context = await self._get_ssh_context()
    
    async def _check_ssh_context(self, host: Optional[str], user: Optional[str]) -> bool:
        """
        Check if required SSH context is available.
        
        Args:
            host: Required SSH host
            user: Required SSH user
            
        Returns:
            True if SSH context is available
        """
        if not self.settings.ssh_context_enabled:
            return False
        
        # TODO: Implement actual SSH context checking in Phase 3.3
        # For now, return True if host is specified
        return host is not None
    
    async def _get_ssh_context(self) -> Optional[Dict[str, Any]]:
        """
        Get current SSH context information.
        
        Returns:
            SSH context data or None
        """
        # TODO: Implement actual SSH context detection in Phase 3.3
        return None


def setup_signal_handlers(agent: CursorConnectorAgent):
    """Set up signal handlers for graceful shutdown."""
    if sys.platform != "win32":
        # Unix-style signal handling
        loop = asyncio.get_event_loop()
        
        for sig in (signal.SIGTERM, signal.SIGINT):
            loop.add_signal_handler(sig, agent.shutdown)
    else:
        # Windows signal handling
        signal.signal(signal.SIGINT, lambda s, f: agent.shutdown())
        signal.signal(signal.SIGTERM, lambda s, f: agent.shutdown())


async def main():
    """Main entry point for the Cursor Connector Agent."""
    agent = CursorConnectorAgent()
    
    try:
        # Set up signal handlers for graceful shutdown
        setup_signal_handlers(agent)
        
        # Start the agent
        await agent.start()
        
    except KeyboardInterrupt:
        agent.logger.info("Received keyboard interrupt")
    except Exception as e:
        agent.logger.error("Agent failed", error=str(e))
        return 1
    
    return 0


if __name__ == "__main__":
    sys.exit(asyncio.run(main())) 