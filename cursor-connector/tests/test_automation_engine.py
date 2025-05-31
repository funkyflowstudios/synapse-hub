"""
Tests for the automation engine and UI automation components.
"""

import pytest
import asyncio
from unittest.mock import AsyncMock, Mock, patch
from pathlib import Path
import sys

sys.path.insert(0, str(Path(__file__).parent.parent / "src"))

from src.automation.automation_engine import AutomationEngine, AutomationTask, AutomationResult, AutomationState
from src.automation.cursor_detector import CursorDetector, CursorState
from src.automation.input_injector import InputInjector, KeyCombination, KeyModifier
from src.automation.response_extractor import ResponseExtractor, ExtractedResponse, ExtractionMethod
from src.automation.window_manager import WindowManager, WindowInfo, WindowState
from src.automation.error_detector import ErrorDetector, DetectedError, ErrorType, ErrorSeverity
from src.config.settings import AgentSettings


class TestCursorDetector:
    """Test cases for CursorDetector."""
    
    def test_initialization(self):
        """Test CursorDetector initialization."""
        detector = CursorDetector()
        assert detector.platform
        assert detector.cursor_process_names
        assert detector.cursor_paths
    
    @pytest.mark.asyncio
    async def test_detect_cursor_state_not_found(self):
        """Test cursor state detection when not found."""
        detector = CursorDetector()
        
        with patch.object(detector, '_find_cursor_processes', return_value=[]):
            state = await detector.detect_cursor_state()
            assert state == CursorState.NOT_FOUND
    
    @pytest.mark.asyncio
    async def test_find_cursor_installation(self):
        """Test finding Cursor installation."""
        detector = CursorDetector()
        
        # Mock existing path
        with patch('pathlib.Path.exists', return_value=True):
            path = await detector.find_cursor_installation()
            assert path is not None
    
    @pytest.mark.asyncio
    async def test_activate_cursor_already_focused(self):
        """Test activating Cursor when already focused."""
        detector = CursorDetector()
        
        with patch.object(detector, 'detect_cursor_state', return_value=CursorState.FOUND_FOCUSED):
            result = await detector.activate_cursor()
            assert result is True


class TestInputInjector:
    """Test cases for InputInjector."""
    
    def test_initialization(self):
        """Test InputInjector initialization."""
        injector = InputInjector()
        assert injector.platform
        assert injector.cursor_shortcuts
        assert "open_chat" in injector.cursor_shortcuts
        assert "submit_prompt" in injector.cursor_shortcuts
    
    def test_key_combination_creation(self):
        """Test KeyCombination creation."""
        injector = InputInjector()
        
        combo = injector.create_custom_shortcut("l", [KeyModifier.CMD])
        assert combo.key == "l"
        assert KeyModifier.CMD in combo.modifiers
    
    def test_available_shortcuts(self):
        """Test getting available shortcuts."""
        injector = InputInjector()
        
        shortcuts = injector.get_available_shortcuts()
        assert isinstance(shortcuts, dict)
        assert "open_chat" in shortcuts
        assert "submit_prompt" in shortcuts
    
    @pytest.mark.asyncio
    async def test_send_cursor_shortcut_unknown(self):
        """Test sending unknown shortcut."""
        injector = InputInjector()
        
        result = await injector.send_cursor_shortcut("unknown_shortcut")
        assert result is False


class TestResponseExtractor:
    """Test cases for ResponseExtractor."""
    
    def test_initialization(self):
        """Test ResponseExtractor initialization."""
        extractor = ResponseExtractor()
        assert extractor.platform
        assert extractor.ai_response_indicators
        assert extractor.min_response_length > 0
    
    def test_response_confidence_calculation(self):
        """Test response confidence calculation."""
        extractor = ResponseExtractor()
        
        # High confidence content
        high_conf_content = "Here's the solution to your problem:\n```python\nprint('hello')\n```"
        confidence = extractor._calculate_response_confidence(high_conf_content)
        assert confidence > 0.5
        
        # Low confidence content
        low_conf_content = "test"
        confidence = extractor._calculate_response_confidence(low_conf_content)
        assert confidence < 0.5
    
    def test_create_response_from_content(self):
        """Test creating response from content."""
        extractor = ResponseExtractor()
        
        # Valid content
        content = "Here's a detailed explanation with code:\n```python\nprint('test')\n```"
        response = extractor._create_response_from_content(content, ExtractionMethod.CLIPBOARD)
        
        assert response is not None
        assert response.content == content
        assert response.method == ExtractionMethod.CLIPBOARD
        assert response.confidence > 0.3
        
        # Invalid content (too short)
        short_content = "hi"
        response = extractor._create_response_from_content(short_content, ExtractionMethod.CLIPBOARD)
        assert response is None
    
    @pytest.mark.asyncio
    async def test_start_stop_monitoring(self):
        """Test starting and stopping monitoring."""
        extractor = ResponseExtractor()
        
        result = await extractor.start_monitoring()
        assert result is True
        assert extractor._monitoring_active is True
        
        await extractor.stop_monitoring()
        assert extractor._monitoring_active is False


class TestWindowManager:
    """Test cases for WindowManager."""
    
    def test_initialization(self):
        """Test WindowManager initialization."""
        manager = WindowManager()
        assert manager.platform
        assert manager.ui_indicators
        assert manager.cursor_window_patterns
    
    @pytest.mark.asyncio
    async def test_get_cursor_windows_empty(self):
        """Test getting Cursor windows when none found."""
        manager = WindowManager()
        
        # Mock platform-specific method to return empty list
        with patch.object(manager, '_get_macos_cursor_windows', return_value=[]):
            windows = await manager.get_cursor_windows()
            assert windows == []
    
    @pytest.mark.asyncio
    async def test_get_main_cursor_window_no_windows(self):
        """Test getting main window when no windows exist."""
        manager = WindowManager()
        
        with patch.object(manager, 'get_cursor_windows', return_value=[]):
            main_window = await manager.get_main_cursor_window()
            assert main_window is None


class TestErrorDetector:
    """Test cases for ErrorDetector."""
    
    def test_initialization(self):
        """Test ErrorDetector initialization."""
        detector = ErrorDetector()
        assert detector.platform
        assert detector.error_patterns
        assert len(detector.error_patterns) > 0
    
    @pytest.mark.asyncio
    async def test_detect_error_in_text_rate_limit(self):
        """Test detecting rate limit error in text."""
        detector = ErrorDetector()
        
        text = "Error: Rate limit exceeded. Please wait before making another request."
        error = await detector.detect_error_in_text(text)
        
        assert error is not None
        assert error.error_type == ErrorType.RATE_LIMITED
        assert error.severity == ErrorSeverity.MEDIUM
    
    @pytest.mark.asyncio
    async def test_detect_error_in_text_ai_unavailable(self):
        """Test detecting AI unavailable error."""
        detector = ErrorDetector()
        
        text = "The AI service is currently unavailable. Please try again later."
        error = await detector.detect_error_in_text(text)
        
        assert error is not None
        assert error.error_type == ErrorType.AI_UNAVAILABLE
        assert error.severity == ErrorSeverity.HIGH
    
    @pytest.mark.asyncio
    async def test_detect_error_in_text_no_error(self):
        """Test when no error is detected."""
        detector = ErrorDetector()
        
        text = "This is a normal response with no error indicators."
        error = await detector.detect_error_in_text(text)
        
        assert error is None
    
    def test_get_error_statistics_empty(self):
        """Test getting error statistics when no errors."""
        detector = ErrorDetector()
        
        stats = detector.get_error_statistics()
        assert stats["total_errors"] == 0
    
    @pytest.mark.asyncio
    async def test_start_stop_monitoring(self):
        """Test starting and stopping error monitoring."""
        detector = ErrorDetector()
        
        result = await detector.start_monitoring()
        assert result is True
        assert detector._monitoring_active is True
        
        await detector.stop_monitoring()
        assert detector._monitoring_active is False


class TestAutomationEngine:
    """Test cases for AutomationEngine."""
    
    def test_initialization(self):
        """Test AutomationEngine initialization."""
        engine = AutomationEngine()
        assert engine.state == AutomationState.IDLE
        assert engine.cursor_detector is not None
        assert engine.input_injector is not None
        assert engine.response_extractor is not None
        assert engine.window_manager is not None
        assert engine.error_detector is not None
    
    @pytest.mark.asyncio
    async def test_initialize_success(self):
        """Test successful engine initialization."""
        engine = AutomationEngine()
        
        # Mock all initialization steps
        with patch.object(engine.error_detector, 'start_monitoring', return_value=True), \
             patch.object(engine.response_extractor, 'start_monitoring', return_value=True), \
             patch.object(engine.cursor_detector, 'detect_cursor_state', return_value=CursorState.FOUND_ACTIVE), \
             patch.object(engine.window_manager, 'optimize_window_for_automation', return_value=True):
            
            result = await engine.initialize()
            assert result is True
            assert engine.state == AutomationState.READY
    
    @pytest.mark.asyncio
    async def test_initialize_cursor_not_found(self):
        """Test initialization when Cursor not found."""
        engine = AutomationEngine()
        
        # Mock Cursor not found and not in mock mode
        with patch.object(engine.error_detector, 'start_monitoring', return_value=True), \
             patch.object(engine.response_extractor, 'start_monitoring', return_value=True), \
             patch.object(engine.cursor_detector, 'detect_cursor_state', return_value=CursorState.NOT_FOUND), \
             patch.object(engine.settings, 'mock_cursor', False):
            
            result = await engine.initialize()
            assert result is False
            assert engine.state == AutomationState.ERROR
    
    @pytest.mark.asyncio
    async def test_execute_prompt_simple(self):
        """Test executing a simple prompt."""
        engine = AutomationEngine()
        engine.state = AutomationState.READY
        
        # Mock successful execution
        with patch.object(engine, '_pre_execution_checks') as mock_pre_check, \
             patch.object(engine, '_execute_task_attempt') as mock_execute:
            
            mock_pre_check.return_value = AutomationResult(success=True, message="OK")
            mock_execute.return_value = AutomationResult(
                success=True, 
                message="Success",
                response=ExtractedResponse(
                    content="AI response",
                    timestamp=None,
                    method=ExtractionMethod.CLIPBOARD,
                    confidence=0.8
                )
            )
            
            result = await engine.execute_prompt("Test prompt")
            assert result.success is True
            assert result.response is not None
    
    @pytest.mark.asyncio
    async def test_execute_task_with_retry(self):
        """Test task execution with retry logic."""
        engine = AutomationEngine()
        engine.state = AutomationState.READY
        
        task = AutomationTask(
            task_id="test_task",
            prompt="Test prompt",
            retry_count=2
        )
        
        # Mock pre-check success and first attempt failure, second success
        with patch.object(engine, '_pre_execution_checks') as mock_pre_check, \
             patch.object(engine, '_execute_task_attempt') as mock_execute:
            
            mock_pre_check.return_value = AutomationResult(success=True, message="OK")
            mock_execute.side_effect = [
                AutomationResult(success=False, message="First attempt failed"),
                AutomationResult(success=True, message="Second attempt succeeded")
            ]
            
            result = await engine.execute_task(task)
            assert result.success is True
            assert mock_execute.call_count == 2
    
    def test_performance_metrics_initial(self):
        """Test initial performance metrics."""
        engine = AutomationEngine()
        
        metrics = engine.get_performance_metrics()
        assert metrics["total_tasks"] == 0
        assert metrics["successful_tasks"] == 0
        assert metrics["failed_tasks"] == 0
        assert metrics["success_rate"] == 0.0
    
    def test_add_remove_callbacks(self):
        """Test adding and removing callbacks."""
        engine = AutomationEngine()
        
        task_callback = Mock()
        error_callback = Mock()
        
        # Add callbacks
        engine.add_task_callback(task_callback)
        engine.add_error_callback(error_callback)
        
        assert task_callback in engine._task_callbacks
        assert error_callback in engine._error_callbacks
        
        # Remove callbacks
        engine.remove_task_callback(task_callback)
        engine.remove_error_callback(error_callback)
        
        assert task_callback not in engine._task_callbacks
        assert error_callback not in engine._error_callbacks
    
    def test_task_history_management(self):
        """Test task history management."""
        engine = AutomationEngine()
        
        # Add some test results
        for i in range(5):
            result = AutomationResult(
                success=i % 2 == 0,
                message=f"Task {i}",
                execution_time=1.0
            )
            engine._add_to_history(result)
        
        # Check history
        history = engine.get_task_history(3)
        assert len(history) == 3
        
        # Check metrics
        metrics = engine.get_performance_metrics()
        assert metrics["total_tasks"] == 5
        assert metrics["successful_tasks"] == 3  # 0, 2, 4 are successful
        assert metrics["failed_tasks"] == 2
        assert metrics["success_rate"] == 0.6
    
    @pytest.mark.asyncio
    async def test_check_cursor_health(self):
        """Test Cursor health check."""
        engine = AutomationEngine()
        
        # Mock healthy Cursor
        with patch.object(engine.cursor_detector, 'detect_cursor_state', return_value=CursorState.FOUND_ACTIVE):
            health = await engine.check_cursor_health()
            assert health is True
        
        # Mock unhealthy Cursor
        with patch.object(engine.cursor_detector, 'detect_cursor_state', return_value=CursorState.NOT_FOUND):
            health = await engine.check_cursor_health()
            assert health is False
    
    @pytest.mark.asyncio
    async def test_send_prompt_and_wait(self):
        """Test convenience method for sending prompt and waiting."""
        engine = AutomationEngine()
        
        # Mock successful execution with response
        with patch.object(engine, 'execute_prompt') as mock_execute:
            mock_execute.return_value = AutomationResult(
                success=True,
                message="Success",
                response=ExtractedResponse(
                    content="AI response content",
                    timestamp=None,
                    method=ExtractionMethod.CLIPBOARD,
                    confidence=0.9
                )
            )
            
            response_text = await engine.send_prompt_and_wait("Test prompt")
            assert response_text == "AI response content"
        
        # Mock failed execution
        with patch.object(engine, 'execute_prompt') as mock_execute:
            mock_execute.return_value = AutomationResult(success=False, message="Failed")
            
            response_text = await engine.send_prompt_and_wait("Test prompt")
            assert response_text is None
    
    @pytest.mark.asyncio
    async def test_shutdown(self):
        """Test engine shutdown."""
        engine = AutomationEngine()
        
        with patch.object(engine.error_detector, 'stop_monitoring') as mock_error_stop, \
             patch.object(engine.response_extractor, 'stop_monitoring') as mock_response_stop:
            
            await engine.shutdown()
            
            assert engine.state == AutomationState.STOPPED
            mock_error_stop.assert_called_once()
            mock_response_stop.assert_called_once()


@pytest.mark.asyncio 
async def test_integration_automation_flow():
    """Integration test for complete automation flow."""
    engine = AutomationEngine()
    
    # Mock all components for successful flow
    with patch.object(engine.error_detector, 'start_monitoring', return_value=True), \
         patch.object(engine.response_extractor, 'start_monitoring', return_value=True), \
         patch.object(engine.cursor_detector, 'detect_cursor_state', return_value=CursorState.FOUND_ACTIVE), \
         patch.object(engine.window_manager, 'optimize_window_for_automation', return_value=True), \
         patch.object(engine.cursor_detector, 'activate_cursor', return_value=True), \
         patch.object(engine.input_injector, 'send_cursor_prompt', return_value=True), \
         patch.object(engine.response_extractor, 'wait_for_response') as mock_wait:
        
        mock_wait.return_value = ExtractedResponse(
            content="This is the AI response to your question.",
            timestamp=None,
            method=ExtractionMethod.CLIPBOARD,
            confidence=0.85
        )
        
        # Initialize engine
        init_result = await engine.initialize()
        assert init_result is True
        
        # Execute a task
        result = await engine.execute_prompt("What is Python?")
        assert result.success is True
        assert result.response is not None
        assert "AI response" in result.response.content
        
        # Check metrics
        metrics = engine.get_performance_metrics()
        assert metrics["total_tasks"] == 1
        assert metrics["successful_tasks"] == 1
        assert metrics["success_rate"] == 1.0
        
        # Shutdown
        await engine.shutdown()
        assert engine.state == AutomationState.STOPPED 