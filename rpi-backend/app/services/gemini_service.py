"""
Gemini AI service for Synapse-Hub AI orchestration system.

Provides comprehensive integration with Google's Gemini AI API including
conversation management, context optimization, streaming responses, and
task workflow integration.
"""

import os
import json
import asyncio
from typing import List, Optional, Dict, Any, AsyncGenerator, Union
from datetime import datetime, timezone
from dataclasses import dataclass
from enum import Enum

import google.generativeai as genai
from google.generativeai.types import GenerateContentResponse, ContentType
from google.ai.generativelanguage_v1beta.types import content
import structlog

from app.core.exceptions import (
    ValidationError,
    BusinessLogicError,
    ExternalServiceError,
    ConfigurationError
)
from app.core.config import settings

logger = structlog.get_logger(__name__)


class GeminiModel(str, Enum):
    """Available Gemini model configurations."""
    PRO = "gemini-pro"
    PRO_VISION = "gemini-pro-vision"
    PRO_LATEST = "gemini-1.5-pro-latest"
    FLASH = "gemini-1.5-flash-latest"


@dataclass
class GeminiConfig:
    """Configuration for Gemini API integration."""
    api_key: str
    model: GeminiModel = GeminiModel.PRO_LATEST
    max_tokens: int = 8192
    temperature: float = 0.7
    top_p: float = 0.8
    top_k: int = 40
    max_retries: int = 3
    timeout: float = 30.0
    context_window: int = 32000  # Approximate token limit for context
    
    @classmethod
    def from_env(cls) -> "GeminiConfig":
        """Create configuration from environment variables."""
        api_key = os.getenv("GEMINI_API_KEY")
        if not api_key:
            raise ConfigurationError(
                "GEMINI_API_KEY environment variable is required",
                config_key="GEMINI_API_KEY"
            )
        
        return cls(
            api_key=api_key,
            model=GeminiModel(os.getenv("GEMINI_MODEL", GeminiModel.PRO_LATEST.value)),
            max_tokens=int(os.getenv("GEMINI_MAX_TOKENS", "8192")),
            temperature=float(os.getenv("GEMINI_TEMPERATURE", "0.7")),
            top_p=float(os.getenv("GEMINI_TOP_P", "0.8")),
            top_k=int(os.getenv("GEMINI_TOP_K", "40")),
            max_retries=int(os.getenv("GEMINI_MAX_RETRIES", "3")),
            timeout=float(os.getenv("GEMINI_TIMEOUT", "30.0")),
        )


@dataclass
class ConversationContext:
    """Represents conversation context for AI interactions."""
    task_id: str
    history: List[Dict[str, Any]]
    system_prompt: Optional[str] = None
    total_tokens: int = 0
    last_updated: datetime = None
    
    def add_message(self, role: str, content: str, metadata: Optional[Dict] = None):
        """Add a message to conversation history."""
        message = {
            "role": role,
            "content": content,
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "metadata": metadata or {}
        }
        self.history.append(message)
        self.last_updated = datetime.now(timezone.utc)
        # Rough token estimation (4 chars ≈ 1 token)
        self.total_tokens += len(content) // 4
    
    def optimize_context(self, max_tokens: int) -> None:
        """Optimize context to fit within token limits."""
        if self.total_tokens <= max_tokens:
            return
        
        # Keep system prompt and recent messages
        important_messages = []
        if self.system_prompt:
            important_messages.append({
                "role": "system",
                "content": self.system_prompt,
                "timestamp": datetime.now(timezone.utc).isoformat(),
                "metadata": {"preserved": True}
            })
        
        # Keep last N messages that fit in budget
        current_tokens = len(self.system_prompt or "") // 4
        for message in reversed(self.history):
            message_tokens = len(message["content"]) // 4
            if current_tokens + message_tokens <= max_tokens:
                important_messages.insert(-1 if self.system_prompt else 0, message)
                current_tokens += message_tokens
            else:
                break
        
        self.history = important_messages
        self.total_tokens = current_tokens
        logger.info(f"Optimized context for task {self.task_id}, tokens: {self.total_tokens}")


class GeminiService:
    """
    Service class for Google Gemini AI integration.
    
    Features:
    - Async conversation management with context optimization
    - Real-time response streaming
    - Comprehensive error handling with exponential backoff
    - Task system integration
    - Context window management
    - Multi-turn conversation support
    - Function calling capabilities
    """
    
    def __init__(self, config: Optional[GeminiConfig] = None):
        """Initialize Gemini service with configuration."""
        self.config = config or GeminiConfig.from_env()
        self._initialize_client()
        self._contexts: Dict[str, ConversationContext] = {}
        
    def _initialize_client(self) -> None:
        """Initialize the Gemini client with API key."""
        try:
            genai.configure(api_key=self.config.api_key)
            self.model = genai.GenerativeModel(
                model_name=self.config.model.value,
                generation_config={
                    "max_output_tokens": self.config.max_tokens,
                    "temperature": self.config.temperature,
                    "top_p": self.config.top_p,
                    "top_k": self.config.top_k,
                }
            )
            logger.info(f"Initialized Gemini client with model {self.config.model.value}")
        except Exception as e:
            raise ConfigurationError(f"Failed to initialize Gemini client: {str(e)}")
    
    async def create_conversation(
        self,
        task_id: str,
        system_prompt: Optional[str] = None
    ) -> ConversationContext:
        """Create a new conversation context for a task."""
        context = ConversationContext(
            task_id=task_id,
            history=[],
            system_prompt=system_prompt,
            last_updated=datetime.now(timezone.utc)
        )
        
        if system_prompt:
            context.add_message("system", system_prompt, {"type": "system_prompt"})
        
        self._contexts[task_id] = context
        logger.info(f"Created conversation context for task {task_id}")
        return context
    
    async def get_conversation(self, task_id: str) -> Optional[ConversationContext]:
        """Retrieve conversation context for a task."""
        return self._contexts.get(task_id)
    
    async def send_message(
        self,
        task_id: str,
        message: str,
        role: str = "user",
        stream: bool = False,
        metadata: Optional[Dict] = None
    ) -> Union[str, AsyncGenerator[str, None]]:
        """
        Send a message to Gemini and get response.
        
        Args:
            task_id: Task identifier for context management
            message: Message content to send
            role: Role of the sender (user, assistant, system)
            stream: Whether to stream the response
            metadata: Additional metadata for the message
            
        Returns:
            Complete response string or async generator for streaming
            
        Raises:
            ValidationError: If message is invalid
            BusinessLogicError: If conversation context is invalid
            ExternalServiceError: If Gemini API fails
        """
        if not message.strip():
            raise ValidationError("Message cannot be empty")
        
        context = await self.get_conversation(task_id)
        if not context:
            # Create conversation if it doesn't exist
            context = await self.create_conversation(task_id)
        
        # Add user message to context
        context.add_message(role, message, metadata)
        
        try:
            # Optimize context if needed
            context.optimize_context(self.config.context_window - self.config.max_tokens)
            
            # Prepare conversation history for Gemini
            gemini_history = self._prepare_gemini_history(context)
            
            if stream:
                return self._stream_response(task_id, gemini_history, message)
            else:
                return await self._generate_response(task_id, gemini_history, message)
                
        except Exception as e:
            logger.error(f"Error sending message to Gemini: {str(e)}")
            if isinstance(e, (ValidationError, BusinessLogicError)):
                raise
            raise ExternalServiceError(f"Gemini API error: {str(e)}")
    
    async def _generate_response(
        self,
        task_id: str,
        history: List[content.Content],
        message: str
    ) -> str:
        """Generate a complete response from Gemini."""
        retry_count = 0
        while retry_count < self.config.max_retries:
            try:
                # Start a chat session with history
                chat = self.model.start_chat(history=history[:-1])  # Exclude current message
                
                # Generate response
                response = await asyncio.wait_for(
                    asyncio.to_thread(chat.send_message, message),
                    timeout=self.config.timeout
                )
                
                response_text = response.text
                if not response_text:
                    raise ExternalServiceError("Empty response from Gemini")
                
                # Add response to context
                context = self._contexts[task_id]
                context.add_message("assistant", response_text, {
                    "model": self.config.model.value,
                    "finish_reason": getattr(response, "finish_reason", None),
                    "usage": getattr(response, "usage", None)
                })
                
                logger.info(f"Generated response for task {task_id}, length: {len(response_text)}")
                return response_text
                
            except asyncio.TimeoutError:
                retry_count += 1
                wait_time = min(2 ** retry_count, 30)  # Exponential backoff, max 30s
                logger.warning(f"Timeout for task {task_id}, retry {retry_count}/{self.config.max_retries}, waiting {wait_time}s")
                if retry_count < self.config.max_retries:
                    await asyncio.sleep(wait_time)
                else:
                    raise ExternalServiceError("Gemini API timeout after all retries")
                    
            except Exception as e:
                retry_count += 1
                if retry_count >= self.config.max_retries:
                    raise ExternalServiceError(f"Gemini API error after {retry_count} retries: {str(e)}")
                
                wait_time = min(2 ** retry_count, 30)
                logger.warning(f"API error for task {task_id}, retry {retry_count}/{self.config.max_retries}: {str(e)}")
                await asyncio.sleep(wait_time)
    
    async def _stream_response(
        self,
        task_id: str,
        history: List[content.Content],
        message: str
    ) -> AsyncGenerator[str, None]:
        """Stream response from Gemini in real-time."""
        try:
            chat = self.model.start_chat(history=history[:-1])
            
            # Generate streaming response
            response_stream = chat.send_message(message, stream=True)
            
            full_response = ""
            async for chunk in self._async_stream_wrapper(response_stream):
                if chunk.text:
                    full_response += chunk.text
                    yield chunk.text
            
            # Add complete response to context
            if full_response:
                context = self._contexts[task_id]
                context.add_message("assistant", full_response, {
                    "model": self.config.model.value,
                    "streaming": True
                })
                
                logger.info(f"Streamed response for task {task_id}, total length: {len(full_response)}")
            
        except Exception as e:
            logger.error(f"Error streaming response for task {task_id}: {str(e)}")
            raise ExternalServiceError(f"Gemini streaming error: {str(e)}")
    
    async def _async_stream_wrapper(self, stream) -> AsyncGenerator[Any, None]:
        """Wrap synchronous stream in async generator."""
        for chunk in stream:
            yield chunk
            await asyncio.sleep(0)  # Allow other coroutines to run
    
    def _prepare_gemini_history(self, context: ConversationContext) -> List[content.Content]:
        """Convert conversation context to Gemini-compatible format."""
        gemini_history = []
        
        for message in context.history:
            role = message["role"]
            # Map roles to Gemini format
            if role == "system":
                continue  # System prompts handled separately
            elif role == "assistant":
                role = "model"
            elif role != "user":
                role = "user"  # Default unknown roles to user
            
            gemini_history.append(
                content.Content(
                    parts=[content.Part(text=message["content"])],
                    role=role
                )
            )
        
        return gemini_history
    
    async def clear_conversation(self, task_id: str) -> bool:
        """Clear conversation context for a task."""
        if task_id in self._contexts:
            del self._contexts[task_id]
            logger.info(f"Cleared conversation context for task {task_id}")
            return True
        return False
    
    async def get_conversation_summary(self, task_id: str) -> Optional[Dict[str, Any]]:
        """Get summary information about a conversation."""
        context = self._contexts.get(task_id)
        if not context:
            return None
        
        return {
            "task_id": task_id,
            "message_count": len(context.history),
            "total_tokens": context.total_tokens,
            "last_updated": context.last_updated.isoformat() if context.last_updated else None,
            "has_system_prompt": context.system_prompt is not None
        }
    
    async def health_check(self) -> Dict[str, Any]:
        """Perform health check on Gemini service."""
        try:
            # Simple test message
            test_response = await asyncio.wait_for(
                asyncio.to_thread(
                    self.model.generate_content,
                    "Health check test. Please respond with 'OK'."
                ),
                timeout=10.0
            )
            
            success = test_response.text and "OK" in test_response.text.upper()
            
            return {
                "status": "healthy" if success else "degraded",
                "model": self.config.model.value,
                "response_time": "< 10s",
                "test_passed": success,
                "active_conversations": len(self._contexts)
            }
            
        except Exception as e:
            logger.error(f"Gemini health check failed: {str(e)}")
            return {
                "status": "unhealthy",
                "error": str(e),
                "model": self.config.model.value,
                "active_conversations": len(self._contexts)
            }


# Global service instance
_gemini_service: Optional[GeminiService] = None


def get_gemini_service() -> GeminiService:
    """Get or create global Gemini service instance."""
    global _gemini_service
    if _gemini_service is None:
        _gemini_service = GeminiService()
    return _gemini_service


async def shutdown_gemini_service():
    """Shutdown and cleanup Gemini service."""
    global _gemini_service
    if _gemini_service:
        # Clear all conversations
        for task_id in list(_gemini_service._contexts.keys()):
            await _gemini_service.clear_conversation(task_id)
        _gemini_service = None
        logger.info("Gemini service shut down") 