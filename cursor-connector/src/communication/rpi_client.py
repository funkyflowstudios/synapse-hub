"""
RPi Backend Communication Client for the Cursor Connector Agent.

This module handles all communication with the RPi backend including:
- HTTP API calls with retry logic
- WebSocket connections for real-time updates
- Task polling and status reporting
- Error handling and connection recovery
"""

import asyncio
import json
from typing import Dict, Any, List, Optional, AsyncGenerator
from datetime import datetime, timezone
import aiohttp
from aiohttp import WSMsgType
from pydantic import BaseModel

from ..config.settings import get_settings
from ..utils.logging import get_logger, task_context, LogContext


class TaskData(BaseModel):
    """Task data from RPi backend."""
    task_id: str
    title: str
    description: str
    status: str
    current_turn: str
    created_at: datetime
    updated_at: datetime
    ai_contexts: Dict[str, Any] = {}


class CommandData(BaseModel):
    """Command data for Cursor operations."""
    command_id: str
    prompt: str
    context: Dict[str, Any] = {}
    timeout: int = 300
    requires_ssh: bool = False
    ssh_host: Optional[str] = None
    ssh_user: Optional[str] = None


class AgentStatus(BaseModel):
    """Agent status for reporting to RPi backend."""
    agent_id: str
    status: str
    platform: str
    cursor_available: bool
    ssh_context: Optional[Dict[str, Any]] = None
    last_heartbeat: datetime
    capabilities: List[str] = []


class RPiClient:
    """
    Async HTTP client for RPi backend communication.
    
    Provides methods for:
    - Task management
    - Command execution
    - Status reporting
    - Real-time WebSocket communication
    """
    
    def __init__(self):
        """Initialize the RPi client."""
        self.settings = get_settings()
        self.logger = get_logger("rpi_client")
        self.session: Optional[aiohttp.ClientSession] = None
        self.ws_connection: Optional[aiohttp.ClientWebSocketResponse] = None
        self._heartbeat_task: Optional[asyncio.Task] = None
        self._connected = False
        
    async def __aenter__(self):
        """Async context manager entry."""
        await self.connect()
        return self
        
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        """Async context manager exit."""
        await self.disconnect()
        
    async def connect(self):
        """Establish connection to RPi backend."""
        if self.session and not self.session.closed:
            return
            
        connector = aiohttp.TCPConnector(
            limit=10,
            limit_per_host=5,
            keepalive_timeout=30,
            enable_cleanup_closed=True,
        )
        
        timeout = aiohttp.ClientTimeout(
            total=self.settings.connection_timeout,
            connect=10,
            sock_read=30,
        )
        
        self.session = aiohttp.ClientSession(
            headers=self.settings.get_headers(),
            connector=connector,
            timeout=timeout,
            raise_for_status=True,
        )
        
        # Test connection
        try:
            await self.health_check()
            self._connected = True
            self.logger.info("Connected to RPi backend", rpi_url=self.settings.rpi_base_url)
            
            # Start heartbeat
            if not self._heartbeat_task or self._heartbeat_task.done():
                self._heartbeat_task = asyncio.create_task(self._heartbeat_loop())
                
        except Exception as e:
            self.logger.error("Failed to connect to RPi backend", error=str(e))
            await self.disconnect()
            raise
    
    async def disconnect(self):
        """Disconnect from RPi backend."""
        self._connected = False
        
        # Stop heartbeat
        if self._heartbeat_task and not self._heartbeat_task.done():
            self._heartbeat_task.cancel()
            try:
                await self._heartbeat_task
            except asyncio.CancelledError:
                pass
        
        # Close WebSocket
        if self.ws_connection and not self.ws_connection.closed:
            await self.ws_connection.close()
            self.ws_connection = None
        
        # Close HTTP session
        if self.session and not self.session.closed:
            await self.session.close()
            self.session = None
            
        self.logger.info("Disconnected from RPi backend")
    
    async def _retry_request(self, method: str, url: str, **kwargs) -> Dict[str, Any]:
        """
        Make HTTP request with retry logic.
        
        Args:
            method: HTTP method
            url: Request URL
            **kwargs: Additional request parameters
            
        Returns:
            Response data as dictionary
            
        Raises:
            aiohttp.ClientError: On request failure after retries
        """
        if not self.session:
            await self.connect()
        
        last_error = None
        
        for attempt in range(self.settings.retry_attempts):
            try:
                async with self.session.request(method, url, **kwargs) as response:
                    if response.status == 404:
                        return None
                    response.raise_for_status()
                    return await response.json()
                    
            except Exception as e:
                last_error = e
                if attempt < self.settings.retry_attempts - 1:
                    wait_time = self.settings.retry_delay * (2 ** attempt)
                    self.logger.warning(
                        "Request failed, retrying",
                        attempt=attempt + 1,
                        max_attempts=self.settings.retry_attempts,
                        wait_time=wait_time,
                        error=str(e),
                    )
                    await asyncio.sleep(wait_time)
                else:
                    self.logger.error(
                        "Request failed after all retries",
                        attempts=self.settings.retry_attempts,
                        error=str(e),
                    )
        
        raise last_error
    
    async def health_check(self) -> Dict[str, Any]:
        """
        Check RPi backend health.
        
        Returns:
            Health status data
        """
        url = f"{self.settings.rpi_api_url}/health"
        return await self._retry_request("GET", url)
    
    async def register_agent(self, status: AgentStatus) -> Dict[str, Any]:
        """
        Register this agent with the RPi backend.
        
        Args:
            status: Agent status information
            
        Returns:
            Registration response
        """
        url = f"{self.settings.rpi_api_url}/cursor/agents/{status.agent_id}/register"
        data = status.dict()
        return await self._retry_request("POST", url, json=data)
    
    async def update_agent_status(self, status: AgentStatus) -> Dict[str, Any]:
        """
        Update agent status on RPi backend.
        
        Args:
            status: Updated agent status
            
        Returns:
            Update response
        """
        url = f"{self.settings.rpi_api_url}/cursor/agents/{status.agent_id}/status"
        data = status.dict()
        return await self._retry_request("PUT", url, json=data)
    
    async def get_pending_commands(self, agent_id: str) -> List[CommandData]:
        """
        Get pending commands for this agent.
        
        Args:
            agent_id: Agent identifier
            
        Returns:
            List of pending commands
        """
        url = f"{self.settings.rpi_api_url}/cursor/agents/{agent_id}/commands"
        response = await self._retry_request("GET", url)
        
        if not response or "commands" not in response:
            return []
            
        return [CommandData(**cmd) for cmd in response["commands"]]
    
    async def submit_command_result(
        self, 
        agent_id: str, 
        command_id: str, 
        result: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Submit command execution result.
        
        Args:
            agent_id: Agent identifier
            command_id: Command identifier
            result: Command execution result
            
        Returns:
            Submission response
        """
        url = f"{self.settings.rpi_api_url}/cursor/agents/{agent_id}/commands/{command_id}/result"
        return await self._retry_request("POST", url, json=result)
    
    async def get_task(self, task_id: str) -> Optional[TaskData]:
        """
        Get task details by ID.
        
        Args:
            task_id: Task identifier
            
        Returns:
            Task data or None if not found
        """
        url = f"{self.settings.rpi_api_url}/tasks/{task_id}"
        response = await self._retry_request("GET", url)
        
        if not response:
            return None
            
        return TaskData(**response)
    
    async def update_task_status(
        self, 
        task_id: str, 
        status: str, 
        context: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Update task status.
        
        Args:
            task_id: Task identifier
            status: New task status
            context: Additional context data
            
        Returns:
            Update response
        """
        url = f"{self.settings.rpi_api_url}/tasks/{task_id}/status"
        data = {"status": status}
        if context:
            data["context"] = context
            
        return await self._retry_request("PUT", url, json=data)
    
    async def send_task_message(
        self, 
        task_id: str, 
        content: str, 
        sender: str = "cursor_agent",
        message_type: str = "response"
    ) -> Dict[str, Any]:
        """
        Send message to task conversation.
        
        Args:
            task_id: Task identifier
            content: Message content
            sender: Message sender
            message_type: Type of message
            
        Returns:
            Message creation response
        """
        url = f"{self.settings.rpi_api_url}/tasks/{task_id}/messages"
        data = {
            "content": content,
            "sender": sender,
            "message_type": message_type,
        }
        
        return await self._retry_request("POST", url, json=data)
    
    async def connect_websocket(self) -> aiohttp.ClientWebSocketResponse:
        """
        Connect to RPi WebSocket for real-time updates.
        
        Returns:
            WebSocket connection
        """
        if not self.session:
            await self.connect()
        
        if self.ws_connection and not self.ws_connection.closed:
            return self.ws_connection
        
        try:
            self.ws_connection = await self.session.ws_connect(
                self.settings.rpi_ws_url,
                headers=self.settings.get_headers(),
                heartbeat=30,
            )
            
            self.logger.info("WebSocket connected", ws_url=self.settings.rpi_ws_url)
            return self.ws_connection
            
        except Exception as e:
            self.logger.error("Failed to connect WebSocket", error=str(e))
            raise
    
    async def listen_websocket(self) -> AsyncGenerator[Dict[str, Any], None]:
        """
        Listen for WebSocket messages.
        
        Yields:
            Parsed WebSocket messages
        """
        ws = await self.connect_websocket()
        
        try:
            async for msg in ws:
                if msg.type == WSMsgType.TEXT:
                    try:
                        data = json.loads(msg.data)
                        yield data
                    except json.JSONDecodeError as e:
                        self.logger.warning("Invalid JSON in WebSocket message", error=str(e))
                        
                elif msg.type == WSMsgType.ERROR:
                    self.logger.error("WebSocket error", error=str(msg.data))
                    break
                    
                elif msg.type in (WSMsgType.CLOSE, WSMsgType.CLOSED):
                    self.logger.info("WebSocket closed")
                    break
                    
        except Exception as e:
            self.logger.error("WebSocket listening error", error=str(e))
            raise
        finally:
            if not ws.closed:
                await ws.close()
    
    async def _heartbeat_loop(self):
        """Background heartbeat loop."""
        while self._connected:
            try:
                # Create agent status
                status = AgentStatus(
                    agent_id=self.settings.agent_id,
                    status="active",
                    platform=self.settings.platform.value,
                    cursor_available=True,  # TODO: Implement actual detection
                    last_heartbeat=datetime.now(timezone.utc),
                    capabilities=["cursor_automation", "ssh_context"],
                )
                
                await self.update_agent_status(status)
                self.logger.debug("Heartbeat sent")
                
            except Exception as e:
                self.logger.warning("Heartbeat failed", error=str(e))
            
            await asyncio.sleep(self.settings.heartbeat_interval)
    
    @property
    def is_connected(self) -> bool:
        """Check if client is connected to RPi backend."""
        return self._connected and self.session and not self.session.closed 