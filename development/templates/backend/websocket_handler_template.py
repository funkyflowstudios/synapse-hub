# WebSocket Handler Template for Synapse-Hub
#
# 🤖 AI IMPLEMENTATION BREADCRUMBS:
# Phase 2: WebSocket handler template with real-time communication patterns (Current)
# Future: Advanced WebSocket patterns (broadcasting, rooms, subscriptions)
# Future: WebSocket performance optimization and load balancing
# Future: Advanced connection management and reconnection strategies
#
# TEMPLATE USAGE:
# 1. Copy this file and rename to match your handler (e.g., task_websocket.py)
# 2. Replace all PLACEHOLDER comments with actual values
# 3. Customize message handlers, authentication, and business logic as needed

import json
import asyncio
import logging
from typing import Dict, List, Set, Any, Optional, Callable, Union
from datetime import datetime, timezone
from uuid import uuid4
from enum import Enum

from fastapi import WebSocket, WebSocketDisconnect, Depends, HTTPException, Query
from fastapi.security import HTTPBearer
from pydantic import BaseModel, ValidationError as PydanticValidationError
import jwt

from app.core.security import verify_jwt_token, get_user_from_token
from app.core.database import get_db_session
from app.core.exceptions import AuthorizationError, ValidationError

# PLACEHOLDER: Import your models and services
# from app.models.task import Task
# from app.services.task_service import TaskService
# from app.schemas.websocket import (
#     WebSocketMessage,
#     TaskUpdateMessage,
#     TaskCreatedMessage,
#     TaskDeletedMessage,
#     ErrorMessage
# )

# Configure logging
logger = logging.getLogger(__name__)

# WebSocket Message Types
class MessageType(str, Enum):
    """WebSocket message types."""
    # Connection management
    CONNECT = "connect"
    DISCONNECT = "disconnect"
    PING = "ping"
    PONG = "pong"
    
    # Authentication
    AUTHENTICATE = "authenticate"
    AUTHENTICATED = "authenticated"
    UNAUTHORIZED = "unauthorized"
    
    # PLACEHOLDER: Add your domain-specific message types
    # Task operations
    TASK_CREATED = "task_created"
    TASK_UPDATED = "task_updated"
    TASK_DELETED = "task_deleted"
    TASK_ASSIGNED = "task_assigned"
    TASK_COMPLETED = "task_completed"
    
    # Subscription management
    SUBSCRIBE = "subscribe"
    UNSUBSCRIBE = "unsubscribe"
    SUBSCRIBED = "subscribed"
    UNSUBSCRIBED = "unsubscribed"
    
    # Error handling
    ERROR = "error"
    VALIDATION_ERROR = "validation_error"

# Base message schemas
class WebSocketMessage(BaseModel):
    """Base WebSocket message structure."""
    type: MessageType
    data: Optional[Dict[str, Any]] = None
    timestamp: Optional[datetime] = None
    correlation_id: Optional[str] = None

class ErrorMessage(BaseModel):
    """Error message structure."""
    type: MessageType = MessageType.ERROR
    error: str
    details: Optional[str] = None
    correlation_id: Optional[str] = None

# PLACEHOLDER: Add your domain-specific message schemas
class TaskMessage(BaseModel):
    """Task-related message structure."""
    type: MessageType
    task_id: str
    task_data: Optional[Dict[str, Any]] = None
    user_id: Optional[str] = None
    timestamp: datetime = None

class SubscriptionMessage(BaseModel):
    """Subscription management message."""
    type: MessageType
    resource_type: str  # e.g., "tasks", "projects", "users"
    resource_id: Optional[str] = None  # For specific resource subscriptions
    filters: Optional[Dict[str, Any]] = None

# Connection Manager
class ConnectionManager:
    """
    Manages WebSocket connections with authentication and subscription support.
    
    Features:
    - Connection lifecycle management
    - User authentication and authorization
    - Topic-based subscriptions
    - Message broadcasting
    - Connection health monitoring
    """
    
    def __init__(self):
        # Active connections mapping: connection_id -> connection info
        self.active_connections: Dict[str, Dict[str, Any]] = {}
        
        # User connections mapping: user_id -> set of connection_ids
        self.user_connections: Dict[str, Set[str]] = {}
        
        # Subscription mappings: topic -> set of connection_ids
        self.subscriptions: Dict[str, Set[str]] = {}
        
        # Message handlers registry
        self.message_handlers: Dict[MessageType, Callable] = {}
        
        # Health check interval (seconds)
        self.health_check_interval = 30
        
        # Register default handlers
        self._register_default_handlers()
    
    def _register_default_handlers(self):
        """Register default message handlers."""
        self.message_handlers.update({
            MessageType.PING: self._handle_ping,
            MessageType.AUTHENTICATE: self._handle_authenticate,
            MessageType.SUBSCRIBE: self._handle_subscribe,
            MessageType.UNSUBSCRIBE: self._handle_unsubscribe,
            # PLACEHOLDER: Add your domain-specific handlers
            # MessageType.TASK_CREATED: self._handle_task_created,
            # MessageType.TASK_UPDATED: self._handle_task_updated,
        })
    
    async def connect(self, websocket: WebSocket, user_id: Optional[str] = None) -> str:
        """Accept a new WebSocket connection."""
        await websocket.accept()
        
        connection_id = str(uuid4())
        connection_info = {
            'websocket': websocket,
            'user_id': user_id,
            'authenticated': user_id is not None,
            'connected_at': datetime.now(timezone.utc),
            'last_ping': datetime.now(timezone.utc),
            'subscriptions': set(),
            'metadata': {}
        }
        
        self.active_connections[connection_id] = connection_info
        
        # Track user connections
        if user_id:
            if user_id not in self.user_connections:
                self.user_connections[user_id] = set()
            self.user_connections[user_id].add(connection_id)
        
        logger.info(f"WebSocket connection established: {connection_id} (user: {user_id})")
        
        # Send connection confirmation
        await self.send_personal_message(
            connection_id,
            WebSocketMessage(
                type=MessageType.CONNECT,
                data={'connection_id': connection_id, 'authenticated': user_id is not None}
            )
        )
        
        return connection_id
    
    async def disconnect(self, connection_id: str):
        """Disconnect and clean up a WebSocket connection."""
        if connection_id not in self.active_connections:
            return
        
        connection_info = self.active_connections[connection_id]
        user_id = connection_info.get('user_id')
        
        # Remove from user connections
        if user_id and user_id in self.user_connections:
            self.user_connections[user_id].discard(connection_id)
            if not self.user_connections[user_id]:
                del self.user_connections[user_id]
        
        # Remove from all subscriptions
        for topic in list(connection_info.get('subscriptions', set())):
            await self._unsubscribe_from_topic(connection_id, topic)
        
        # Remove connection
        del self.active_connections[connection_id]
        
        logger.info(f"WebSocket connection closed: {connection_id} (user: {user_id})")
    
    async def send_personal_message(self, connection_id: str, message: Union[WebSocketMessage, Dict[str, Any]]):
        """Send a message to a specific connection."""
        if connection_id not in self.active_connections:
            logger.warning(f"Attempted to send message to non-existent connection: {connection_id}")
            return
        
        connection_info = self.active_connections[connection_id]
        websocket = connection_info['websocket']
        
        try:
            if isinstance(message, WebSocketMessage):
                message_data = message.dict()
            else:
                message_data = message
            
            # Add timestamp if not present
            if 'timestamp' not in message_data or message_data['timestamp'] is None:
                message_data['timestamp'] = datetime.now(timezone.utc).isoformat()
            
            await websocket.send_text(json.dumps(message_data, default=str))
            
        except Exception as e:
            logger.error(f"Error sending message to {connection_id}: {str(e)}")
            await self.disconnect(connection_id)
    
    async def send_user_message(self, user_id: str, message: Union[WebSocketMessage, Dict[str, Any]]):
        """Send a message to all connections of a specific user."""
        if user_id not in self.user_connections:
            logger.debug(f"No active connections for user: {user_id}")
            return
        
        connection_ids = list(self.user_connections[user_id])
        for connection_id in connection_ids:
            await self.send_personal_message(connection_id, message)
    
    async def broadcast_to_topic(self, topic: str, message: Union[WebSocketMessage, Dict[str, Any]], exclude_connection: Optional[str] = None):
        """Broadcast a message to all connections subscribed to a topic."""
        if topic not in self.subscriptions:
            logger.debug(f"No subscriptions for topic: {topic}")
            return
        
        connection_ids = list(self.subscriptions[topic])
        for connection_id in connection_ids:
            if connection_id != exclude_connection:
                await self.send_personal_message(connection_id, message)
    
    async def broadcast_to_all(self, message: Union[WebSocketMessage, Dict[str, Any]], authenticated_only: bool = False):
        """Broadcast a message to all active connections."""
        for connection_id, connection_info in self.active_connections.items():
            if authenticated_only and not connection_info.get('authenticated', False):
                continue
            await self.send_personal_message(connection_id, message)
    
    async def handle_message(self, connection_id: str, message_data: str):
        """Handle incoming WebSocket message."""
        try:
            # Parse message
            raw_message = json.loads(message_data)
            message = WebSocketMessage(**raw_message)
            
            # Update last activity
            if connection_id in self.active_connections:
                self.active_connections[connection_id]['last_ping'] = datetime.now(timezone.utc)
            
            # Route to appropriate handler
            handler = self.message_handlers.get(message.type)
            if handler:
                await handler(connection_id, message)
            else:
                logger.warning(f"No handler for message type: {message.type}")
                await self.send_personal_message(
                    connection_id,
                    ErrorMessage(
                        error="Unknown message type",
                        details=f"No handler for message type: {message.type}",
                        correlation_id=message.correlation_id
                    )
                )
        
        except json.JSONDecodeError as e:
            logger.warning(f"Invalid JSON in WebSocket message: {str(e)}")
            await self.send_personal_message(
                connection_id,
                ErrorMessage(error="Invalid JSON format", details=str(e))
            )
        
        except PydanticValidationError as e:
            logger.warning(f"Message validation error: {str(e)}")
            await self.send_personal_message(
                connection_id,
                ErrorMessage(
                    type=MessageType.VALIDATION_ERROR,
                    error="Message validation failed",
                    details=str(e)
                )
            )
        
        except Exception as e:
            logger.error(f"Error handling WebSocket message: {str(e)}")
            await self.send_personal_message(
                connection_id,
                ErrorMessage(error="Internal server error", details="Message processing failed")
            )
    
    # Default message handlers
    
    async def _handle_ping(self, connection_id: str, message: WebSocketMessage):
        """Handle ping message."""
        await self.send_personal_message(
            connection_id,
            WebSocketMessage(
                type=MessageType.PONG,
                correlation_id=message.correlation_id
            )
        )
    
    async def _handle_authenticate(self, connection_id: str, message: WebSocketMessage):
        """Handle authentication message."""
        if connection_id not in self.active_connections:
            return
        
        try:
            token = message.data.get('token') if message.data else None
            if not token:
                raise AuthorizationError("Token required for authentication")
            
            # PLACEHOLDER: Implement your token verification
            # user = await verify_jwt_token(token)
            # Mock authentication for template
            user = {'id': 'user123', 'username': 'testuser'}
            
            # Update connection info
            connection_info = self.active_connections[connection_id]
            connection_info['user_id'] = user['id']
            connection_info['authenticated'] = True
            connection_info['user_data'] = user
            
            # Track user connection
            user_id = user['id']
            if user_id not in self.user_connections:
                self.user_connections[user_id] = set()
            self.user_connections[user_id].add(connection_id)
            
            await self.send_personal_message(
                connection_id,
                WebSocketMessage(
                    type=MessageType.AUTHENTICATED,
                    data={'user': user},
                    correlation_id=message.correlation_id
                )
            )
            
            logger.info(f"WebSocket connection authenticated: {connection_id} (user: {user_id})")
        
        except Exception as e:
            logger.warning(f"Authentication failed for connection {connection_id}: {str(e)}")
            await self.send_personal_message(
                connection_id,
                WebSocketMessage(
                    type=MessageType.UNAUTHORIZED,
                    data={'error': str(e)},
                    correlation_id=message.correlation_id
                )
            )
    
    async def _handle_subscribe(self, connection_id: str, message: WebSocketMessage):
        """Handle subscription message."""
        if connection_id not in self.active_connections:
            return
        
        try:
            subscription_data = SubscriptionMessage(**message.data) if message.data else None
            if not subscription_data:
                raise ValidationError("Subscription data required")
            
            # Build topic name
            topic = subscription_data.resource_type
            if subscription_data.resource_id:
                topic = f"{topic}:{subscription_data.resource_id}"
            
            # PLACEHOLDER: Add authorization check
            # if not await self._can_subscribe_to_topic(connection_id, topic):
            #     raise AuthorizationError("Insufficient permissions for subscription")
            
            await self._subscribe_to_topic(connection_id, topic)
            
            await self.send_personal_message(
                connection_id,
                WebSocketMessage(
                    type=MessageType.SUBSCRIBED,
                    data={'topic': topic},
                    correlation_id=message.correlation_id
                )
            )
            
        except Exception as e:
            logger.warning(f"Subscription failed for connection {connection_id}: {str(e)}")
            await self.send_personal_message(
                connection_id,
                ErrorMessage(
                    error="Subscription failed",
                    details=str(e),
                    correlation_id=message.correlation_id
                )
            )
    
    async def _handle_unsubscribe(self, connection_id: str, message: WebSocketMessage):
        """Handle unsubscription message."""
        if connection_id not in self.active_connections:
            return
        
        try:
            subscription_data = SubscriptionMessage(**message.data) if message.data else None
            if not subscription_data:
                raise ValidationError("Subscription data required")
            
            # Build topic name
            topic = subscription_data.resource_type
            if subscription_data.resource_id:
                topic = f"{topic}:{subscription_data.resource_id}"
            
            await self._unsubscribe_from_topic(connection_id, topic)
            
            await self.send_personal_message(
                connection_id,
                WebSocketMessage(
                    type=MessageType.UNSUBSCRIBED,
                    data={'topic': topic},
                    correlation_id=message.correlation_id
                )
            )
            
        except Exception as e:
            logger.warning(f"Unsubscription failed for connection {connection_id}: {str(e)}")
            await self.send_personal_message(
                connection_id,
                ErrorMessage(
                    error="Unsubscription failed",
                    details=str(e),
                    correlation_id=message.correlation_id
                )
            )
    
    async def _subscribe_to_topic(self, connection_id: str, topic: str):
        """Subscribe connection to a topic."""
        if topic not in self.subscriptions:
            self.subscriptions[topic] = set()
        
        self.subscriptions[topic].add(connection_id)
        
        if connection_id in self.active_connections:
            self.active_connections[connection_id]['subscriptions'].add(topic)
        
        logger.debug(f"Connection {connection_id} subscribed to topic: {topic}")
    
    async def _unsubscribe_from_topic(self, connection_id: str, topic: str):
        """Unsubscribe connection from a topic."""
        if topic in self.subscriptions:
            self.subscriptions[topic].discard(connection_id)
            if not self.subscriptions[topic]:
                del self.subscriptions[topic]
        
        if connection_id in self.active_connections:
            self.active_connections[connection_id]['subscriptions'].discard(topic)
        
        logger.debug(f"Connection {connection_id} unsubscribed from topic: {topic}")
    
    # PLACEHOLDER: Add your domain-specific message handlers
    
    async def register_handler(self, message_type: MessageType, handler: Callable):
        """Register a custom message handler."""
        self.message_handlers[message_type] = handler
    
    async def get_connection_stats(self) -> Dict[str, Any]:
        """Get connection statistics."""
        authenticated_count = sum(
            1 for conn in self.active_connections.values()
            if conn.get('authenticated', False)
        )
        
        return {
            'total_connections': len(self.active_connections),
            'authenticated_connections': authenticated_count,
            'anonymous_connections': len(self.active_connections) - authenticated_count,
            'active_users': len(self.user_connections),
            'total_subscriptions': sum(len(subs) for subs in self.subscriptions.values()),
            'topics': list(self.subscriptions.keys()),
        }
    
    async def health_check(self):
        """Perform health check on all connections."""
        current_time = datetime.now(timezone.utc)
        stale_connections = []
        
        for connection_id, connection_info in self.active_connections.items():
            last_ping = connection_info.get('last_ping')
            if last_ping and (current_time - last_ping).seconds > self.health_check_interval * 2:
                stale_connections.append(connection_id)
        
        # Disconnect stale connections
        for connection_id in stale_connections:
            logger.info(f"Disconnecting stale connection: {connection_id}")
            await self.disconnect(connection_id)

# Global connection manager instance
connection_manager = ConnectionManager()

# WebSocket endpoint dependency
async def get_websocket_token(token: Optional[str] = Query(None)) -> Optional[str]:
    """Extract token from WebSocket query parameters."""
    return token

# PLACEHOLDER: Add your domain-specific event handlers

class TaskWebSocketHandler:
    """
    Task-specific WebSocket event handlers.
    
    PLACEHOLDER: Replace with your domain-specific handlers
    """
    
    def __init__(self, connection_manager: ConnectionManager):
        self.connection_manager = connection_manager
    
    async def on_task_created(self, task_data: Dict[str, Any], user_id: Optional[str] = None):
        """Handle task creation event."""
        message = WebSocketMessage(
            type=MessageType.TASK_CREATED,
            data=task_data
        )
        
        # Broadcast to all subscribers of tasks topic
        await self.connection_manager.broadcast_to_topic("tasks", message)
        
        # If task has assignee, notify them directly
        assignee_id = task_data.get('assignee_id')
        if assignee_id and assignee_id != user_id:
            await self.connection_manager.send_user_message(assignee_id, message)
    
    async def on_task_updated(self, task_data: Dict[str, Any], user_id: Optional[str] = None):
        """Handle task update event."""
        task_id = task_data.get('id')
        message = WebSocketMessage(
            type=MessageType.TASK_UPDATED,
            data=task_data
        )
        
        # Broadcast to task-specific subscribers
        await self.connection_manager.broadcast_to_topic(f"tasks:{task_id}", message)
        
        # Broadcast to general tasks subscribers
        await self.connection_manager.broadcast_to_topic("tasks", message)
    
    async def on_task_deleted(self, task_id: str, user_id: Optional[str] = None):
        """Handle task deletion event."""
        message = WebSocketMessage(
            type=MessageType.TASK_DELETED,
            data={'id': task_id, 'deleted_by': user_id}
        )
        
        # Broadcast to task-specific subscribers
        await self.connection_manager.broadcast_to_topic(f"tasks:{task_id}", message)
        
        # Broadcast to general tasks subscribers
        await self.connection_manager.broadcast_to_topic("tasks", message)

# Initialize domain-specific handlers
task_handler = TaskWebSocketHandler(connection_manager)

# WebSocket endpoint
async def websocket_endpoint(
    websocket: WebSocket,
    token: Optional[str] = Depends(get_websocket_token)
):
    """
    Main WebSocket endpoint for real-time communication.
    
    PLACEHOLDER: Customize authentication and connection handling
    """
    connection_id = None
    
    try:
        # Authenticate user if token provided
        user_id = None
        if token:
            try:
                # PLACEHOLDER: Implement your token verification
                # user = await verify_jwt_token(token)
                # user_id = user['id']
                user_id = "authenticated_user"  # Mock for template
            except Exception as e:
                logger.warning(f"WebSocket authentication failed: {str(e)}")
                # Continue with anonymous connection
        
        # Establish connection
        connection_id = await connection_manager.connect(websocket, user_id)
        
        # Start health check task
        health_check_task = asyncio.create_task(periodic_health_check())
        
        # Message loop
        while True:
            try:
                # Receive message
                data = await websocket.receive_text()
                
                # Handle message
                await connection_manager.handle_message(connection_id, data)
                
            except WebSocketDisconnect:
                logger.info(f"WebSocket client disconnected: {connection_id}")
                break
            
            except Exception as e:
                logger.error(f"Error in WebSocket message loop: {str(e)}")
                await connection_manager.send_personal_message(
                    connection_id,
                    ErrorMessage(error="Message processing error", details=str(e))
                )
    
    except Exception as e:
        logger.error(f"Error in WebSocket endpoint: {str(e)}")
        if websocket.client_state.name != "DISCONNECTED":
            await websocket.close()
    
    finally:
        if connection_id:
            await connection_manager.disconnect(connection_id)
        
        # Cancel health check task
        if 'health_check_task' in locals():
            health_check_task.cancel()

async def periodic_health_check():
    """Periodic health check for WebSocket connections."""
    while True:
        try:
            await asyncio.sleep(connection_manager.health_check_interval)
            await connection_manager.health_check()
        except asyncio.CancelledError:
            break
        except Exception as e:
            logger.error(f"Error in periodic health check: {str(e)}")

# Helper functions for integrating with your application

async def notify_task_created(task_data: Dict[str, Any], user_id: Optional[str] = None):
    """Notify about task creation via WebSocket."""
    await task_handler.on_task_created(task_data, user_id)

async def notify_task_updated(task_data: Dict[str, Any], user_id: Optional[str] = None):
    """Notify about task update via WebSocket."""
    await task_handler.on_task_updated(task_data, user_id)

async def notify_task_deleted(task_id: str, user_id: Optional[str] = None):
    """Notify about task deletion via WebSocket."""
    await task_handler.on_task_deleted(task_id, user_id)

# Template Implementation Guide:
"""
WEBSOCKET HANDLER IMPLEMENTATION STEPS:

1. SETUP:
   - Copy this template to your WebSocket file (e.g., task_websocket.py)
   - Replace all PLACEHOLDER comments with actual values

2. CUSTOMIZE MESSAGE TYPES:
   - Update MessageType enum with your domain-specific types
   - Define your message schemas (TaskMessage, ProjectMessage, etc.)
   - Add validation for custom message formats

3. IMPLEMENT AUTHENTICATION:
   - Replace mock authentication with your JWT verification
   - Add proper user lookup and permission checking
   - Implement role-based authorization for subscriptions

4. ADD DOMAIN-SPECIFIC HANDLERS:
   - Create handlers for your business domain (TaskWebSocketHandler, etc.)
   - Implement event notification methods
   - Add subscription management for your resources

5. REGISTER MESSAGE HANDLERS:
   - Add handlers for your custom message types
   - Implement business logic for each message type
   - Add proper error handling and validation

6. INTEGRATE WITH YOUR API:
   - Call WebSocket notification functions from your API endpoints
   - Add WebSocket events to your service layer
   - Ensure real-time updates for all relevant operations

7. CONFIGURE TOPICS AND SUBSCRIPTIONS:
   - Define topic naming conventions
   - Implement resource-specific subscriptions
   - Add permission checks for topic access

8. ADD MONITORING AND METRICS:
   - Implement connection monitoring
   - Add performance metrics collection
   - Set up alerting for connection issues

FEATURES INCLUDED:
- Connection lifecycle management with authentication
- Topic-based subscription system
- Message routing and handling
- Real-time broadcasting capabilities
- Health checking and stale connection cleanup
- Comprehensive error handling
- PING/PONG heartbeat support
- User-specific message delivery
- Connection statistics and monitoring
- Async message processing
- Structured logging throughout

EXAMPLE FOR TASK DOMAIN:
- Replace TaskWebSocketHandler with your domain handler
- Add your message types (TASK_CREATED, PROJECT_UPDATED, etc.)
- Implement your business logic in event handlers
- Add proper authentication and authorization
- Connect to your service layer for real-time events

INTEGRATION PATTERNS:
- Call notify_* functions from your API endpoints
- Integrate with your service layer for automatic notifications
- Use dependency injection for database and service access
- Add WebSocket events to your business logic

BEST PRACTICES:
- Always authenticate connections when possible
- Implement proper error handling and recovery
- Use structured message formats with validation
- Add comprehensive logging for debugging
- Monitor connection health and performance
- Implement graceful disconnection handling
- Use topic-based subscriptions for scalability
- Add rate limiting for message handling
""" 