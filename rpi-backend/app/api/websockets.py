"""
WebSocket API endpoints for Synapse-Hub backend.

Provides real-time communication for task updates, message streaming,
and agent status notifications.
"""

import json
import logging
from typing import Dict, List, Any, Optional
from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_db_session
from app.core.config import get_settings

logger = logging.getLogger(__name__)

# Create router
router = APIRouter()

# Global connection manager
class ConnectionManager:
    """Manages WebSocket connections for real-time updates."""
    
    def __init__(self):
        self.active_connections: Dict[str, WebSocket] = {}
        self.task_subscribers: Dict[str, List[str]] = {}  # task_id -> [connection_ids]
        self.user_connections: Dict[str, List[str]] = {}  # user_id -> [connection_ids]
    
    async def connect(self, websocket: WebSocket, connection_id: str, user_id: Optional[str] = None):
        """Accept a new WebSocket connection."""
        await websocket.accept()
        self.active_connections[connection_id] = websocket
        
        if user_id:
            if user_id not in self.user_connections:
                self.user_connections[user_id] = []
            self.user_connections[user_id].append(connection_id)
        
        logger.info(f"WebSocket connection {connection_id} established for user {user_id}")
    
    def disconnect(self, connection_id: str, user_id: Optional[str] = None):
        """Remove a WebSocket connection."""
        if connection_id in self.active_connections:
            del self.active_connections[connection_id]
        
        if user_id and user_id in self.user_connections:
            if connection_id in self.user_connections[user_id]:
                self.user_connections[user_id].remove(connection_id)
            if not self.user_connections[user_id]:
                del self.user_connections[user_id]
        
        # Remove from task subscriptions
        for task_id, subscribers in self.task_subscribers.items():
            if connection_id in subscribers:
                subscribers.remove(connection_id)
        
        logger.info(f"WebSocket connection {connection_id} disconnected")
    
    async def send_personal_message(self, message: dict, connection_id: str):
        """Send a message to a specific connection."""
        if connection_id in self.active_connections:
            try:
                websocket = self.active_connections[connection_id]
                await websocket.send_text(json.dumps(message))
            except Exception as e:
                logger.error(f"Error sending message to {connection_id}: {str(e)}")
                # Connection might be dead, remove it
                self.disconnect(connection_id)
    
    async def send_to_user(self, message: dict, user_id: str):
        """Send a message to all connections for a specific user."""
        if user_id in self.user_connections:
            for connection_id in self.user_connections[user_id].copy():
                await self.send_personal_message(message, connection_id)
    
    async def broadcast_to_task(self, message: dict, task_id: str):
        """Broadcast a message to all subscribers of a specific task."""
        if task_id in self.task_subscribers:
            for connection_id in self.task_subscribers[task_id].copy():
                await self.send_personal_message(message, connection_id)
    
    async def broadcast_to_all(self, message: dict):
        """Broadcast a message to all active connections."""
        for connection_id in list(self.active_connections.keys()):
            await self.send_personal_message(message, connection_id)
    
    def subscribe_to_task(self, connection_id: str, task_id: str):
        """Subscribe a connection to task updates."""
        if task_id not in self.task_subscribers:
            self.task_subscribers[task_id] = []
        
        if connection_id not in self.task_subscribers[task_id]:
            self.task_subscribers[task_id].append(connection_id)
            logger.info(f"Connection {connection_id} subscribed to task {task_id}")
    
    def unsubscribe_from_task(self, connection_id: str, task_id: str):
        """Unsubscribe a connection from task updates."""
        if task_id in self.task_subscribers:
            if connection_id in self.task_subscribers[task_id]:
                self.task_subscribers[task_id].remove(connection_id)
                logger.info(f"Connection {connection_id} unsubscribed from task {task_id}")
    
    def get_connection_count(self) -> int:
        """Get the number of active connections."""
        return len(self.active_connections)
    
    def get_task_subscriber_count(self, task_id: str) -> int:
        """Get the number of subscribers for a specific task."""
        return len(self.task_subscribers.get(task_id, []))


# Global connection manager instance
manager = ConnectionManager()


@router.websocket("/ws/{connection_id}")
async def websocket_endpoint(
    websocket: WebSocket,
    connection_id: str,
    user_id: Optional[str] = None,
    db: AsyncSession = Depends(get_db_session)
):
    """
    Main WebSocket endpoint for real-time communication.
    
    Args:
        connection_id: Unique identifier for this connection
        user_id: Optional user ID for authenticated connections
    """
    await manager.connect(websocket, connection_id, user_id)
    
    try:
        # Send welcome message
        welcome_message = {
            "type": "connection_established",
            "data": {
                "connection_id": connection_id,
                "user_id": user_id,
                "timestamp": str(datetime.utcnow()),
                "server_info": {
                    "version": get_settings().version,
                    "environment": get_settings().environment
                }
            }
        }
        await manager.send_personal_message(welcome_message, connection_id)
        
        while True:
            # Receive message from client
            try:
                data = await websocket.receive_text()
                message = json.loads(data)
                await handle_websocket_message(message, connection_id, user_id, db)
            except json.JSONDecodeError:
                error_message = {
                    "type": "error",
                    "data": {
                        "message": "Invalid JSON format",
                        "timestamp": str(datetime.utcnow())
                    }
                }
                await manager.send_personal_message(error_message, connection_id)
            
    except WebSocketDisconnect:
        logger.info(f"WebSocket {connection_id} disconnected")
    except Exception as e:
        logger.error(f"WebSocket error for {connection_id}: {str(e)}")
    finally:
        manager.disconnect(connection_id, user_id)


async def handle_websocket_message(
    message: dict,
    connection_id: str,
    user_id: Optional[str],
    db: AsyncSession
):
    """
    Handle incoming WebSocket messages from clients.
    
    Args:
        message: Parsed JSON message from client
        connection_id: Connection identifier
        user_id: User identifier (if authenticated)
        db: Database session
    """
    try:
        message_type = message.get("type")
        data = message.get("data", {})
        
        if message_type == "subscribe_task":
            # Subscribe to task updates
            task_id = data.get("task_id")
            if task_id:
                manager.subscribe_to_task(connection_id, task_id)
                response = {
                    "type": "subscription_confirmed",
                    "data": {
                        "task_id": task_id,
                        "timestamp": str(datetime.utcnow())
                    }
                }
                await manager.send_personal_message(response, connection_id)
        
        elif message_type == "unsubscribe_task":
            # Unsubscribe from task updates
            task_id = data.get("task_id")
            if task_id:
                manager.unsubscribe_from_task(connection_id, task_id)
                response = {
                    "type": "unsubscription_confirmed",
                    "data": {
                        "task_id": task_id,
                        "timestamp": str(datetime.utcnow())
                    }
                }
                await manager.send_personal_message(response, connection_id)
        
        elif message_type == "ping":
            # Heartbeat/ping response
            response = {
                "type": "pong",
                "data": {
                    "timestamp": str(datetime.utcnow()),
                    "connection_count": manager.get_connection_count()
                }
            }
            await manager.send_personal_message(response, connection_id)
        
        elif message_type == "get_status":
            # Get server and connection status
            response = {
                "type": "status_response",
                "data": {
                    "connection_id": connection_id,
                    "user_id": user_id,
                    "active_connections": manager.get_connection_count(),
                    "subscribed_tasks": list(manager.task_subscribers.keys()),
                    "timestamp": str(datetime.utcnow())
                }
            }
            await manager.send_personal_message(response, connection_id)
        
        else:
            # Unknown message type
            error_response = {
                "type": "error",
                "data": {
                    "message": f"Unknown message type: {message_type}",
                    "timestamp": str(datetime.utcnow())
                }
            }
            await manager.send_personal_message(error_response, connection_id)
    
    except Exception as e:
        logger.error(f"Error handling WebSocket message: {str(e)}")
        error_response = {
            "type": "error",
            "data": {
                "message": "Internal server error",
                "timestamp": str(datetime.utcnow())
            }
        }
        await manager.send_personal_message(error_response, connection_id)


# Utility functions for broadcasting updates (to be used by services)
async def broadcast_task_update(task_id: str, task_data: dict):
    """Broadcast task update to all subscribers."""
    message = {
        "type": "task_update",
        "data": {
            "task_id": task_id,
            "task": task_data,
            "timestamp": str(datetime.utcnow())
        }
    }
    await manager.broadcast_to_task(message, task_id)


async def broadcast_new_message(task_id: str, message_data: dict):
    """Broadcast new message to task subscribers."""
    message = {
        "type": "new_message",
        "data": {
            "task_id": task_id,
            "message": message_data,
            "timestamp": str(datetime.utcnow())
        }
    }
    await manager.broadcast_to_task(message, task_id)


async def broadcast_agent_status(agent_name: str, status: str, details: dict = None):
    """Broadcast agent status change to all connections."""
    message = {
        "type": "agent_status",
        "data": {
            "agent": agent_name,
            "status": status,
            "details": details or {},
            "timestamp": str(datetime.utcnow())
        }
    }
    await manager.broadcast_to_all(message)


async def send_user_notification(user_id: str, notification: dict):
    """Send notification to specific user."""
    message = {
        "type": "notification",
        "data": {
            **notification,
            "timestamp": str(datetime.utcnow())
        }
    }
    await manager.send_to_user(message, user_id)


# Export the connection manager for use in services
def get_connection_manager() -> ConnectionManager:
    """Get the global connection manager instance."""
    return manager


# Add datetime import at the top
from datetime import datetime 