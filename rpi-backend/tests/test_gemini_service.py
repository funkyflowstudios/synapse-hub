"""
Tests for Gemini AI service integration.

Comprehensive test coverage for AI conversation management,
streaming responses, context optimization, and error handling.
"""

import pytest
import asyncio
from unittest.mock import Mock, AsyncMock, patch, MagicMock
from datetime import datetime, timezone
from typing import Dict, Any

from app.services.gemini_service import (
    GeminiService,
    GeminiConfig,
    ConversationContext,
    GeminiModel,
    get_gemini_service,
    shutdown_gemini_service
)
from app.core.exceptions import (
    ValidationError,
    ExternalServiceError,
    ConfigurationError
)


class TestGeminiConfig:
    """Test cases for GeminiConfig configuration management."""
    
    def test_config_creation_with_defaults(self):
        """Test creating config with minimal parameters."""
        config = GeminiConfig(api_key="test-key")
        
        assert config.api_key == "test-key"
        assert config.model == GeminiModel.PRO_LATEST
        assert config.max_tokens == 8192
        assert config.temperature == 0.7
        assert config.top_p == 0.8
        assert config.top_k == 40
        assert config.max_retries == 3
        assert config.timeout == 30.0
        assert config.context_window == 32000
    
    def test_config_creation_with_custom_values(self):
        """Test creating config with custom parameters."""
        config = GeminiConfig(
            api_key="custom-key",
            model=GeminiModel.FLASH,
            max_tokens=4096,
            temperature=0.5,
            top_p=0.9,
            top_k=20,
            max_retries=5,
            timeout=60.0
        )
        
        assert config.api_key == "custom-key"
        assert config.model == GeminiModel.FLASH
        assert config.max_tokens == 4096
        assert config.temperature == 0.5
        assert config.top_p == 0.9
        assert config.top_k == 20
        assert config.max_retries == 5
        assert config.timeout == 60.0
    
    @patch.dict('os.environ', {
        'GEMINI_API_KEY': 'env-test-key',
        'GEMINI_MODEL': 'gemini-pro',
        'GEMINI_MAX_TOKENS': '4096',
        'GEMINI_TEMPERATURE': '0.5'
    })
    def test_config_from_env(self):
        """Test creating config from environment variables."""
        config = GeminiConfig.from_env()
        
        assert config.api_key == "env-test-key"
        assert config.model == GeminiModel.PRO
        assert config.max_tokens == 4096
        assert config.temperature == 0.5
    
    @patch.dict('os.environ', {}, clear=True)
    def test_config_from_env_missing_api_key(self):
        """Test config creation fails without API key."""
        with pytest.raises(ConfigurationError) as exc_info:
            GeminiConfig.from_env()
        
        assert "GEMINI_API_KEY environment variable is required" in str(exc_info.value)


class TestConversationContext:
    """Test cases for ConversationContext management."""
    
    def test_context_creation(self):
        """Test creating conversation context."""
        context = ConversationContext(
            task_id="test-task",
            history=[],
            system_prompt="Test system prompt"
        )
        
        assert context.task_id == "test-task"
        assert context.history == []
        assert context.system_prompt == "Test system prompt"
        assert context.total_tokens == 0
        assert context.last_updated is None
    
    def test_add_message(self):
        """Test adding messages to conversation context."""
        context = ConversationContext(task_id="test-task", history=[])
        
        context.add_message("user", "Hello AI", {"test": "metadata"})
        
        assert len(context.history) == 1
        message = context.history[0]
        assert message["role"] == "user"
        assert message["content"] == "Hello AI"
        assert message["metadata"] == {"test": "metadata"}
        assert "timestamp" in message
        assert context.total_tokens > 0
        assert context.last_updated is not None
    
    def test_optimize_context_under_limit(self):
        """Test context optimization when under token limit."""
        context = ConversationContext(task_id="test-task", history=[])
        context.add_message("user", "Short message")
        
        initial_tokens = context.total_tokens
        context.optimize_context(max_tokens=1000)
        
        assert context.total_tokens == initial_tokens
        assert len(context.history) == 1
    
    def test_optimize_context_over_limit(self):
        """Test context optimization when over token limit."""
        context = ConversationContext(
            task_id="test-task", 
            history=[],
            system_prompt="System prompt"
        )
        
        # Add many messages to exceed limit
        for i in range(10):
            context.add_message("user", f"Message {i} " * 100)  # Long messages
        
        initial_message_count = len(context.history)
        context.optimize_context(max_tokens=50)  # Very low limit
        
        assert context.total_tokens <= 50
        assert len(context.history) < initial_message_count


class TestGeminiService:
    """Test cases for GeminiService main functionality."""
    
    @pytest.fixture
    def mock_config(self):
        """Fixture providing mock configuration."""
        return GeminiConfig(api_key="test-key")
    
    @pytest.fixture
    def mock_genai(self):
        """Fixture providing mocked Google AI library."""
        with patch('app.services.gemini_service.genai') as mock:
            mock_model = Mock()
            mock.GenerativeModel.return_value = mock_model
            yield mock, mock_model
    
    @pytest.fixture
    def gemini_service(self, mock_config, mock_genai):
        """Fixture providing GeminiService instance."""
        mock_genai_lib, mock_model = mock_genai
        service = GeminiService(mock_config)
        service.model = mock_model
        return service
    
    def test_service_initialization(self, mock_config, mock_genai):
        """Test service initialization."""
        mock_genai_lib, mock_model = mock_genai
        
        service = GeminiService(mock_config)
        
        mock_genai_lib.configure.assert_called_once_with(api_key="test-key")
        mock_genai_lib.GenerativeModel.assert_called_once()
        assert service.config == mock_config
        assert service._contexts == {}
    
    def test_service_initialization_failure(self, mock_config):
        """Test service initialization failure."""
        with patch('app.services.gemini_service.genai') as mock_genai:
            mock_genai.configure.side_effect = Exception("API key invalid")
            
            with pytest.raises(ConfigurationError) as exc_info:
                GeminiService(mock_config)
            
            assert "Failed to initialize Gemini client" in str(exc_info.value)
    
    @pytest.mark.asyncio
    async def test_create_conversation(self, gemini_service):
        """Test creating conversation context."""
        context = await gemini_service.create_conversation(
            task_id="test-task",
            system_prompt="Test prompt"
        )
        
        assert context.task_id == "test-task"
        assert context.system_prompt == "Test prompt"
        assert len(context.history) == 1  # System prompt added
        assert context.history[0]["role"] == "system"
        assert "test-task" in gemini_service._contexts
    
    @pytest.mark.asyncio
    async def test_get_conversation(self, gemini_service):
        """Test retrieving conversation context."""
        # Create conversation first
        await gemini_service.create_conversation("test-task")
        
        # Retrieve it
        context = await gemini_service.get_conversation("test-task")
        
        assert context is not None
        assert context.task_id == "test-task"
        
        # Test non-existent conversation
        missing_context = await gemini_service.get_conversation("non-existent")
        assert missing_context is None
    
    @pytest.mark.asyncio
    async def test_send_message_validation_error(self, gemini_service):
        """Test message validation errors."""
        with pytest.raises(ValidationError) as exc_info:
            await gemini_service.send_message("test-task", "")
        
        assert "Message cannot be empty" in str(exc_info.value)
        
        with pytest.raises(ValidationError) as exc_info:
            await gemini_service.send_message("test-task", "   ")
        
        assert "Message cannot be empty" in str(exc_info.value)
    
    @pytest.mark.asyncio
    async def test_send_message_success(self, gemini_service):
        """Test successful message sending."""
        # Mock the model response
        mock_response = Mock()
        mock_response.text = "Hello! How can I help you?"
        
        mock_chat = Mock()
        mock_chat.send_message = Mock(return_value=mock_response)
        gemini_service.model.start_chat = Mock(return_value=mock_chat)
        
        with patch('asyncio.to_thread') as mock_to_thread:
            mock_to_thread.return_value = mock_response
            
            response = await gemini_service.send_message(
                task_id="test-task",
                message="Hello AI",
                stream=False
            )
        
        assert response == "Hello! How can I help you?"
        assert "test-task" in gemini_service._contexts
        
        # Check conversation history
        context = gemini_service._contexts["test-task"]
        assert len(context.history) >= 2  # User message + AI response
    
    @pytest.mark.asyncio
    async def test_send_message_with_retries(self, gemini_service):
        """Test message sending with retry logic."""
        mock_response = Mock()
        mock_response.text = "Success after retry"
        
        mock_chat = Mock()
        # First call fails, second succeeds
        mock_chat.send_message = Mock(side_effect=[
            Exception("Temporary failure"),
            mock_response
        ])
        gemini_service.model.start_chat = Mock(return_value=mock_chat)
        
        with patch('asyncio.to_thread') as mock_to_thread:
            mock_to_thread.side_effect = [
                Exception("Temporary failure"),
                mock_response
            ]
            with patch('asyncio.sleep') as mock_sleep:
                response = await gemini_service.send_message(
                    task_id="test-task",
                    message="Test retry",
                    stream=False
                )
        
        assert response == "Success after retry"
        mock_sleep.assert_called()  # Verify retry delay
    
    @pytest.mark.asyncio
    async def test_send_message_max_retries_exceeded(self, gemini_service):
        """Test message sending when max retries exceeded."""
        mock_chat = Mock()
        mock_chat.send_message = Mock(side_effect=Exception("Persistent failure"))
        gemini_service.model.start_chat = Mock(return_value=mock_chat)
        
        with patch('asyncio.to_thread') as mock_to_thread:
            mock_to_thread.side_effect = Exception("Persistent failure")
            with patch('asyncio.sleep'):
                with pytest.raises(ExternalServiceError) as exc_info:
                    await gemini_service.send_message(
                        task_id="test-task",
                        message="Test failure",
                        stream=False
                    )
        
        assert "Gemini API error after" in str(exc_info.value)
    
    @pytest.mark.asyncio
    async def test_stream_response(self, gemini_service):
        """Test streaming response functionality."""
        # Mock streaming response
        mock_chunks = [
            Mock(text="Hello"),
            Mock(text=" there"),
            Mock(text="!")
        ]
        
        mock_chat = Mock()
        mock_chat.send_message = Mock(return_value=iter(mock_chunks))
        gemini_service.model.start_chat = Mock(return_value=mock_chat)
        
        stream = await gemini_service.send_message(
            task_id="test-task",
            message="Stream test",
            stream=True
        )
        
        # Collect streamed content
        content_chunks = []
        async for chunk in stream:
            content_chunks.append(chunk)
        
        assert content_chunks == ["Hello", " there", "!"]
        
        # Check final response in context
        context = gemini_service._contexts["test-task"]
        ai_messages = [msg for msg in context.history if msg["role"] == "assistant"]
        assert len(ai_messages) == 1
        assert ai_messages[0]["content"] == "Hello there!"
    
    @pytest.mark.asyncio
    async def test_clear_conversation(self, gemini_service):
        """Test clearing conversation context."""
        # Create conversation
        await gemini_service.create_conversation("test-task")
        assert "test-task" in gemini_service._contexts
        
        # Clear it
        result = await gemini_service.clear_conversation("test-task")
        
        assert result is True
        assert "test-task" not in gemini_service._contexts
        
        # Try to clear non-existent conversation
        result = await gemini_service.clear_conversation("non-existent")
        assert result is False
    
    @pytest.mark.asyncio
    async def test_get_conversation_summary(self, gemini_service):
        """Test getting conversation summary."""
        # Create conversation with messages
        context = await gemini_service.create_conversation(
            task_id="test-task",
            system_prompt="Test prompt"
        )
        context.add_message("user", "Hello")
        context.add_message("assistant", "Hi there!")
        
        summary = await gemini_service.get_conversation_summary("test-task")
        
        assert summary is not None
        assert summary["task_id"] == "test-task"
        assert summary["message_count"] == 3  # System + user + assistant
        assert summary["total_tokens"] > 0
        assert summary["has_system_prompt"] is True
        
        # Test non-existent conversation
        summary = await gemini_service.get_conversation_summary("non-existent")
        assert summary is None
    
    @pytest.mark.asyncio
    async def test_health_check_success(self, gemini_service):
        """Test successful health check."""
        mock_response = Mock()
        mock_response.text = "OK"
        
        with patch('asyncio.to_thread') as mock_to_thread:
            mock_to_thread.return_value = mock_response
            
            health = await gemini_service.health_check()
        
        assert health["status"] == "healthy"
        assert health["test_passed"] is True
        assert health["model"] == gemini_service.config.model.value
        assert health["active_conversations"] == 0
    
    @pytest.mark.asyncio
    async def test_health_check_failure(self, gemini_service):
        """Test health check failure."""
        with patch('asyncio.to_thread') as mock_to_thread:
            mock_to_thread.side_effect = Exception("API unavailable")
            
            health = await gemini_service.health_check()
        
        assert health["status"] == "unhealthy"
        assert health["error"] == "API unavailable"
        assert health["model"] == gemini_service.config.model.value
    
    def test_prepare_gemini_history(self, gemini_service):
        """Test conversation history preparation for Gemini format."""
        context = ConversationContext(task_id="test-task", history=[])
        context.add_message("system", "System prompt")
        context.add_message("user", "Hello")
        context.add_message("assistant", "Hi there")
        context.add_message("unknown_role", "Test message")
        
        history = gemini_service._prepare_gemini_history(context)
        
        # System messages should be filtered out
        # Assistant should become "model"
        # Unknown roles should become "user"
        assert len(history) == 3  # Excluding system message
        
        # Check role mapping
        roles = [content.role for content in history]
        assert roles == ["user", "model", "user"]


class TestGeminiServiceSingleton:
    """Test cases for global service instance management."""
    
    @pytest.mark.asyncio
    async def test_get_gemini_service(self):
        """Test getting global service instance."""
        with patch('app.services.gemini_service.GeminiService') as MockService:
            mock_instance = Mock()
            MockService.return_value = mock_instance
            
            service1 = get_gemini_service()
            service2 = get_gemini_service()
            
            # Should return same instance
            assert service1 is service2
            MockService.assert_called_once()
    
    @pytest.mark.asyncio
    async def test_shutdown_gemini_service(self):
        """Test shutting down global service instance."""
        # Create mock service with conversations
        mock_service = Mock()
        mock_service._contexts = {"task1": Mock(), "task2": Mock()}
        mock_service.clear_conversation = AsyncMock()
        
        with patch('app.services.gemini_service._gemini_service', mock_service):
            await shutdown_gemini_service()
            
            # Should clear all conversations
            assert mock_service.clear_conversation.call_count == 2


@pytest.mark.integration
class TestGeminiServiceIntegration:
    """Integration tests for Gemini service (requires real API key)."""
    
    @pytest.mark.skip(reason="Requires real API key")
    @pytest.mark.asyncio
    async def test_real_gemini_integration(self):
        """Test with real Gemini API (skip by default)."""
        # This test would require a real API key
        # Uncomment and set GEMINI_API_KEY environment variable to run
        config = GeminiConfig.from_env()
        service = GeminiService(config)
        
        response = await service.send_message(
            task_id="integration-test",
            message="Hello, this is a test. Please respond with 'Test successful'.",
            stream=False
        )
        
        assert "test" in response.lower()
        
        health = await service.health_check()
        assert health["status"] == "healthy" 