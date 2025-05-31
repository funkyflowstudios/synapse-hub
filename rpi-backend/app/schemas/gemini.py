"""
Pydantic schemas for Gemini AI integration endpoints.

Defines request/response models for AI conversation management,
streaming, and health monitoring.
"""

from typing import Optional, Dict, Any, Union
from datetime import datetime
from pydantic import BaseModel, Field, validator
import json


class GeminiMessageRequest(BaseModel):
    """Request model for sending messages to Gemini AI."""
    
    message: str = Field(
        ...,
        min_length=1,
        max_length=32000,
        description="Message content to send to AI"
    )
    role: str = Field(
        default="user",
        description="Role of the message sender"
    )
    metadata: Optional[Dict[str, Any]] = Field(
        default=None,
        description="Additional metadata for the message"
    )
    
    @validator('message')
    def validate_message(cls, v):
        """Validate message content."""
        if not v.strip():
            raise ValueError("Message cannot be empty or whitespace only")
        return v.strip()
    
    @validator('role')
    def validate_role(cls, v):
        """Validate message role."""
        allowed_roles = {"user", "assistant", "system"}
        if v not in allowed_roles:
            raise ValueError(f"Role must be one of: {allowed_roles}")
        return v
    
    @validator('metadata')
    def validate_metadata(cls, v):
        """Validate metadata is JSON serializable."""
        if v is not None:
            try:
                json.dumps(v)
            except (TypeError, ValueError):
                raise ValueError("Metadata must be JSON serializable")
        return v


class GeminiStreamRequest(BaseModel):
    """Request model for streaming messages to Gemini AI."""
    
    message: str = Field(
        ...,
        min_length=1,
        max_length=32000,
        description="Message content to stream to AI"
    )
    role: str = Field(
        default="user",
        description="Role of the message sender"
    )
    metadata: Optional[Dict[str, Any]] = Field(
        default=None,
        description="Additional metadata for the message"
    )
    
    @validator('message')
    def validate_message(cls, v):
        """Validate message content."""
        if not v.strip():
            raise ValueError("Message cannot be empty or whitespace only")
        return v.strip()
    
    @validator('role')
    def validate_role(cls, v):
        """Validate message role."""
        allowed_roles = {"user", "assistant", "system"}
        if v not in allowed_roles:
            raise ValueError(f"Role must be one of: {allowed_roles}")
        return v


class ConversationSummary(BaseModel):
    """Summary information about an AI conversation."""
    
    task_id: str = Field(..., description="Task identifier")
    message_count: int = Field(..., ge=0, description="Number of messages in conversation")
    total_tokens: int = Field(..., ge=0, description="Estimated total tokens used")
    last_updated: Optional[str] = Field(None, description="Last update timestamp")
    has_system_prompt: bool = Field(False, description="Whether conversation has system prompt")
    
    class Config:
        schema_extra = {
            "example": {
                "task_id": "123e4567-e89b-12d3-a456-426614174000",
                "message_count": 6,
                "total_tokens": 1250,
                "last_updated": "2024-01-15T10:30:00Z",
                "has_system_prompt": True
            }
        }


class GeminiMessageResponse(BaseModel):
    """Response model for Gemini AI message interactions."""
    
    task_id: str = Field(..., description="Task identifier")
    user_message: str = Field(..., description="Original user message")
    ai_response: str = Field(..., description="AI-generated response")
    model: str = Field(..., description="AI model used for generation")
    conversation_summary: Optional[ConversationSummary] = Field(
        None, description="Summary of conversation context"
    )
    metadata: Optional[Dict[str, Any]] = Field(
        default=None,
        description="Additional response metadata"
    )
    timestamp: datetime = Field(
        default_factory=datetime.utcnow,
        description="Response generation timestamp"
    )
    
    class Config:
        schema_extra = {
            "example": {
                "task_id": "123e4567-e89b-12d3-a456-426614174000",
                "user_message": "Hello, can you help me with my code?",
                "ai_response": "Of course! I'd be happy to help you with your code. What specific issue are you working on?",
                "model": "gemini-1.5-pro-latest",
                "conversation_summary": {
                    "task_id": "123e4567-e89b-12d3-a456-426614174000",
                    "message_count": 2,
                    "total_tokens": 45,
                    "last_updated": "2024-01-15T10:30:00Z",
                    "has_system_prompt": False
                },
                "metadata": {
                    "response_length": 89,
                    "role": "user",
                    "streaming": False
                },
                "timestamp": "2024-01-15T10:30:00.123456"
            }
        }


class GeminiHealthResponse(BaseModel):
    """Health check response for Gemini service."""
    
    status: str = Field(..., description="Service health status")
    model: str = Field(..., description="AI model identifier")
    response_time: Optional[str] = Field(None, description="Response time information")
    test_passed: Optional[bool] = Field(None, description="Whether health test passed")
    active_conversations: int = Field(..., ge=0, description="Number of active conversations")
    error: Optional[str] = Field(None, description="Error message if unhealthy")
    timestamp: datetime = Field(
        default_factory=datetime.utcnow,
        description="Health check timestamp"
    )
    
    @validator('status')
    def validate_status(cls, v):
        """Validate health status."""
        allowed_statuses = {"healthy", "degraded", "unhealthy"}
        if v not in allowed_statuses:
            raise ValueError(f"Status must be one of: {allowed_statuses}")
        return v
    
    class Config:
        schema_extra = {
            "example": {
                "status": "healthy",
                "model": "gemini-1.5-pro-latest",
                "response_time": "< 10s",
                "test_passed": True,
                "active_conversations": 3,
                "error": None,
                "timestamp": "2024-01-15T10:30:00.123456"
            }
        }


class WebSocketMessage(BaseModel):
    """WebSocket message format for AI interactions."""
    
    type: str = Field(..., description="Message type")
    content: Optional[str] = Field(None, description="Message content")
    task_id: Optional[str] = Field(None, description="Task identifier")
    user_message: Optional[str] = Field(None, description="User message")
    ai_response: Optional[str] = Field(None, description="AI response")
    full_response: Optional[str] = Field(None, description="Complete response")
    response_length: Optional[int] = Field(None, ge=0, description="Response length")
    message: Optional[str] = Field(None, description="Status or error message")
    timestamp: datetime = Field(
        default_factory=datetime.utcnow,
        description="Message timestamp"
    )
    
    @validator('type')
    def validate_type(cls, v):
        """Validate message type."""
        allowed_types = {
            "stream_start", "stream_chunk", "stream_end",
            "complete_response", "error", "status"
        }
        if v not in allowed_types:
            raise ValueError(f"Type must be one of: {allowed_types}")
        return v
    
    class Config:
        schema_extra = {
            "examples": {
                "stream_start": {
                    "type": "stream_start",
                    "task_id": "123e4567-e89b-12d3-a456-426614174000",
                    "user_message": "Hello AI",
                    "timestamp": "2024-01-15T10:30:00.123456"
                },
                "stream_chunk": {
                    "type": "stream_chunk",
                    "content": "Hello! How can I",
                    "timestamp": "2024-01-15T10:30:00.234567"
                },
                "stream_end": {
                    "type": "stream_end",
                    "full_response": "Hello! How can I help you today?",
                    "response_length": 34,
                    "timestamp": "2024-01-15T10:30:01.345678"
                },
                "complete_response": {
                    "type": "complete_response",
                    "task_id": "123e4567-e89b-12d3-a456-426614174000",
                    "user_message": "Hello AI",
                    "ai_response": "Hello! How can I help you today?",
                    "response_length": 34,
                    "timestamp": "2024-01-15T10:30:01.456789"
                },
                "error": {
                    "type": "error",
                    "message": "AI processing failed: timeout",
                    "timestamp": "2024-01-15T10:30:02.567890"
                }
            }
        }


class ConversationCreateRequest(BaseModel):
    """Request model for creating conversation contexts."""
    
    system_prompt: Optional[str] = Field(
        None,
        max_length=8000,
        description="Optional system prompt for conversation"
    )
    
    @validator('system_prompt')
    def validate_system_prompt(cls, v):
        """Validate system prompt."""
        if v is not None and not v.strip():
            return None  # Convert empty strings to None
        return v


class ConversationCreateResponse(BaseModel):
    """Response model for conversation creation."""
    
    task_id: str = Field(..., description="Task identifier")
    created: bool = Field(..., description="Whether conversation was created")
    system_prompt: bool = Field(..., description="Whether system prompt was set")
    message: str = Field(..., description="Status message")
    timestamp: datetime = Field(
        default_factory=datetime.utcnow,
        description="Creation timestamp"
    )
    
    class Config:
        schema_extra = {
            "example": {
                "task_id": "123e4567-e89b-12d3-a456-426614174000",
                "created": True,
                "system_prompt": True,
                "message": "Conversation created for task 123e4567-e89b-12d3-a456-426614174000",
                "timestamp": "2024-01-15T10:30:00.123456"
            }
        }


class ConversationClearResponse(BaseModel):
    """Response model for conversation clearing."""
    
    task_id: str = Field(..., description="Task identifier")
    cleared: bool = Field(..., description="Whether conversation was cleared")
    message: str = Field(..., description="Status message")
    timestamp: datetime = Field(
        default_factory=datetime.utcnow,
        description="Clear timestamp"
    )
    
    class Config:
        schema_extra = {
            "example": {
                "task_id": "123e4567-e89b-12d3-a456-426614174000",
                "cleared": True,
                "message": "Conversation cleared for task 123e4567-e89b-12d3-a456-426614174000",
                "timestamp": "2024-01-15T10:30:00.123456"
            }
        }


# Input validation models
class GeminiConfigUpdate(BaseModel):
    """Model for updating Gemini configuration."""
    
    model: Optional[str] = Field(None, description="AI model to use")
    max_tokens: Optional[int] = Field(None, ge=1, le=32000, description="Maximum tokens")
    temperature: Optional[float] = Field(None, ge=0.0, le=2.0, description="Generation temperature")
    top_p: Optional[float] = Field(None, ge=0.0, le=1.0, description="Top-p sampling")
    top_k: Optional[int] = Field(None, ge=1, le=100, description="Top-k sampling")
    
    @validator('model')
    def validate_model(cls, v):
        """Validate model name."""
        if v is not None:
            allowed_models = {
                "gemini-pro",
                "gemini-pro-vision", 
                "gemini-1.5-pro-latest",
                "gemini-1.5-flash-latest"
            }
            if v not in allowed_models:
                raise ValueError(f"Model must be one of: {allowed_models}")
        return v 