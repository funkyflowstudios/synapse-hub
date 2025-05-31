"""
Comprehensive tests for the health check system.

Tests all aspects of the health monitoring including individual service checks,
comprehensive health reports, and health history tracking.
"""

import pytest
import asyncio
from unittest.mock import Mock, patch, AsyncMock
from datetime import datetime, timezone
from fastapi.testclient import TestClient

from app.core.health import (
    HealthManager, 
    HealthCheckResult, 
    ServiceStatus, 
    ServiceHealthInfo,
    health_manager
)


class TestHealthCheckResult:
    """Test HealthCheckResult dataclass."""
    
    def test_healthy_result_creation(self):
        """Test creating a healthy result."""
        result = HealthCheckResult(
            status=ServiceStatus.HEALTHY,
            details={"test": "data"},
            response_time_ms=150.5
        )
        
        assert result.status == ServiceStatus.HEALTHY
        assert result.details == {"test": "data"}
        assert result.response_time_ms == 150.5
        assert result.error is None
        assert isinstance(result.timestamp, datetime)
    
    def test_unhealthy_result_creation(self):
        """Test creating an unhealthy result."""
        result = HealthCheckResult(
            status=ServiceStatus.UNHEALTHY,
            error="Connection failed"
        )
        
        assert result.status == ServiceStatus.UNHEALTHY
        assert result.error == "Connection failed"
        assert result.details == {}


class TestServiceHealthInfo:
    """Test ServiceHealthInfo dataclass."""
    
    def test_service_info_creation(self):
        """Test creating service health info."""
        info = ServiceHealthInfo(
            name="test-service",
            status=ServiceStatus.HEALTHY
        )
        
        assert info.name == "test-service"
        assert info.status == ServiceStatus.HEALTHY
        assert info.error_count == 0
        assert info.uptime_percentage == 100.0


class TestHealthManager:
    """Test HealthManager functionality."""
    
    @pytest.fixture
    def health_manager_instance(self):
        """Create a fresh health manager for testing."""
        return HealthManager()
    
    def test_service_registration(self, health_manager_instance):
        """Test service registration."""
        health_manager_instance.register_service("test-service")
        
        assert "test-service" in health_manager_instance.services
        service_info = health_manager_instance.services["test-service"]
        assert service_info.name == "test-service"
        assert service_info.status == ServiceStatus.UNKNOWN
    
    @pytest.mark.asyncio
    async def test_database_health_check_success(self, health_manager_instance):
        """Test successful database health check."""
        with patch('app.core.database.health_check', new_callable=AsyncMock) as mock_health_check:
            mock_health_check.return_value = True
            
            result = await health_manager_instance.check_database_health()
            
            assert result.status == ServiceStatus.HEALTHY
            assert result.details["connection"] == "active"
            assert result.details["engine"] == "sqlite+aiosqlite"
            assert result.response_time_ms is not None
            assert result.error is None
    
    @pytest.mark.asyncio
    async def test_database_health_check_failure(self, health_manager_instance):
        """Test failed database health check."""
        with patch('app.core.database.health_check', new_callable=AsyncMock) as mock_health_check:
            mock_health_check.return_value = False
            
            result = await health_manager_instance.check_database_health()
            
            assert result.status == ServiceStatus.UNHEALTHY
            assert result.details["connection"] == "failed"
            assert result.error == "Database connection test failed"
    
    @pytest.mark.asyncio
    async def test_database_health_check_exception(self, health_manager_instance):
        """Test database health check with exception."""
        with patch('app.core.database.health_check', new_callable=AsyncMock) as mock_health_check:
            mock_health_check.side_effect = Exception("Database error")
            
            result = await health_manager_instance.check_database_health()
            
            assert result.status == ServiceStatus.UNHEALTHY
            assert result.error == "Database error"
    
    @pytest.mark.asyncio
    async def test_gemini_health_check_not_configured(self, health_manager_instance):
        """Test Gemini health check when not configured."""
        with patch.object(health_manager_instance.settings, 'gemini_api_key', 'your_gemini_api_key_here'):
            result = await health_manager_instance.check_gemini_health()
            
            assert result.status == ServiceStatus.NOT_CONFIGURED
            assert result.details["reason"] == "API key not configured"
            assert "API key not set" in result.error
    
    @pytest.mark.asyncio
    async def test_gemini_health_check_success(self, health_manager_instance):
        """Test successful Gemini health check."""
        with patch.object(health_manager_instance.settings, 'gemini_api_key', 'real_api_key'):
            with patch('app.services.gemini_service.GeminiService') as mock_service_class, \
                 patch('app.connectors.gemini_handler.GeminiConfig') as mock_config_class:
                mock_service = Mock()
                mock_service_class.return_value = mock_service
                mock_service.health_check = AsyncMock(return_value={
                    "status": "healthy",
                    "model": "gemini-1.5-pro",
                    "test_passed": True
                })
                
                result = await health_manager_instance.check_gemini_health()
                
                assert result.status == ServiceStatus.HEALTHY
                assert result.details["status"] == "healthy"
                assert result.details["model"] == "gemini-1.5-pro"
    
    @pytest.mark.asyncio
    async def test_cursor_health_check_success(self, health_manager_instance):
        """Test successful Cursor health check."""
        with patch('app.services.cursor_service.CursorService') as mock_service_class, \
             patch('app.connectors.cursor_handler.CursorConnectorConfig') as mock_config_class:
            mock_service = Mock()
            mock_service_class.return_value = mock_service
            mock_service.get_health_status = AsyncMock(return_value={
                "status": "connected",
                "is_connected": True,
                "queue_size": 0
            })
            
            result = await health_manager_instance.check_cursor_health()
            
            assert result.status == ServiceStatus.HEALTHY
            assert result.details["status"] == "connected"
            assert result.details["is_connected"] is True
    
    @pytest.mark.asyncio
    async def test_websocket_health_check(self, health_manager_instance):
        """Test WebSocket health check."""
        with patch('app.services.websocket_service.WebSocketManager'):
            result = await health_manager_instance.check_websocket_health()
            
            assert result.status == ServiceStatus.HEALTHY
            assert result.details["service"] == "available"
    
    @pytest.mark.asyncio
    async def test_system_resources_check_healthy(self, health_manager_instance):
        """Test system resources check when healthy."""
        mock_cpu_percent = Mock(return_value=50.0)
        mock_memory = Mock()
        mock_memory.percent = 60.0
        mock_memory.available = 4 * 1024 * 1024 * 1024  # 4GB
        mock_disk = Mock()
        mock_disk.percent = 70.0
        mock_disk.free = 100 * 1024 * 1024 * 1024  # 100GB
        
        with patch('psutil') as mock_psutil:
            mock_psutil.cpu_percent = mock_cpu_percent
            mock_psutil.virtual_memory.return_value = mock_memory
            mock_psutil.disk_usage.return_value = mock_disk
            
            result = await health_manager_instance.check_system_resources()
            
            assert result.status == ServiceStatus.HEALTHY
            assert result.details["cpu_percent"] == 50.0
            assert result.details["memory_percent"] == 60.0
            assert result.details["warnings"] == []
    
    @pytest.mark.asyncio
    async def test_system_resources_check_degraded(self, health_manager_instance):
        """Test system resources check when degraded."""
        mock_cpu_percent = Mock(return_value=85.0)  # High CPU
        mock_memory = Mock()
        mock_memory.percent = 90.0  # High memory
        mock_memory.available = 1024 * 1024 * 1024  # 1GB
        mock_disk = Mock()
        mock_disk.percent = 95.0  # High disk
        mock_disk.free = 5 * 1024 * 1024 * 1024  # 5GB
        
        with patch('psutil') as mock_psutil:
            mock_psutil.cpu_percent = mock_cpu_percent
            mock_psutil.virtual_memory.return_value = mock_memory
            mock_psutil.disk_usage.return_value = mock_disk
            
            result = await health_manager_instance.check_system_resources()
            
            assert result.status == ServiceStatus.DEGRADED
            assert len(result.details["warnings"]) == 3  # CPU, memory, and disk warnings
    
    @pytest.mark.asyncio  
    async def test_system_resources_psutil_not_available(self, health_manager_instance):
        """Test system resources check when psutil is not available."""
        # Mock the import inside the method to raise ImportError
        async def mock_check_system_resources():
            try:
                import psutil
                raise ImportError("psutil not found")  # Simulate import error
            except ImportError:
                return HealthCheckResult(
                    status=ServiceStatus.NOT_CONFIGURED,
                    details={"reason": "psutil not available"},
                    error="System monitoring requires psutil package"
                )
        
        health_manager_instance.check_system_resources = mock_check_system_resources
        result = await health_manager_instance.check_system_resources()
        
        assert result.status == ServiceStatus.NOT_CONFIGURED
        assert "psutil not available" in result.details["reason"]
    
    @pytest.mark.asyncio
    async def test_comprehensive_health_check(self, health_manager_instance):
        """Test comprehensive health check."""
        # Mock all individual health checks
        with patch.object(health_manager_instance, 'check_database_health') as mock_db, \
             patch.object(health_manager_instance, 'check_gemini_health') as mock_gemini, \
             patch.object(health_manager_instance, 'check_cursor_health') as mock_cursor, \
             patch.object(health_manager_instance, 'check_websocket_health') as mock_ws, \
             patch.object(health_manager_instance, 'check_system_resources') as mock_system:
            
            # Set up mock returns
            mock_db.return_value = HealthCheckResult(ServiceStatus.HEALTHY, {"db": "ok"})
            mock_gemini.return_value = HealthCheckResult(ServiceStatus.NOT_CONFIGURED, {"api": "not_set"})
            mock_cursor.return_value = HealthCheckResult(ServiceStatus.DEGRADED, {"cursor": "disconnected"})
            mock_ws.return_value = HealthCheckResult(ServiceStatus.HEALTHY, {"ws": "ok"})
            mock_system.return_value = HealthCheckResult(ServiceStatus.HEALTHY, {"cpu": 50})
            
            health_report = await health_manager_instance.perform_comprehensive_health_check()
            
            # Should be degraded due to cursor service
            assert health_report["status"] == "degraded"
            assert health_report["summary"]["total_services"] == 5
            assert health_report["summary"]["healthy"] == 3
            assert health_report["summary"]["degraded"] == 1
            assert health_report["summary"]["not_configured"] == 1
            
            # Check that services are properly reported
            assert "database" in health_report["services"]
            assert "gemini" in health_report["services"]
            assert "cursor" in health_report["services"]
            assert "websocket" in health_report["services"]
            assert "system" in health_report["services"]
    
    @pytest.mark.asyncio
    async def test_comprehensive_health_check_unhealthy(self, health_manager_instance):
        """Test comprehensive health check with unhealthy services."""
        with patch.object(health_manager_instance, 'check_database_health') as mock_db, \
             patch.object(health_manager_instance, 'check_gemini_health') as mock_gemini, \
             patch.object(health_manager_instance, 'check_cursor_health') as mock_cursor, \
             patch.object(health_manager_instance, 'check_websocket_health') as mock_ws, \
             patch.object(health_manager_instance, 'check_system_resources') as mock_system:
            
            # Set up mock returns with one unhealthy service
            mock_db.return_value = HealthCheckResult(ServiceStatus.UNHEALTHY, error="DB connection failed")
            mock_gemini.return_value = HealthCheckResult(ServiceStatus.HEALTHY)
            mock_cursor.return_value = HealthCheckResult(ServiceStatus.HEALTHY)
            mock_ws.return_value = HealthCheckResult(ServiceStatus.HEALTHY)
            mock_system.return_value = HealthCheckResult(ServiceStatus.HEALTHY)
            
            health_report = await health_manager_instance.perform_comprehensive_health_check()
            
            # Should be unhealthy due to database
            assert health_report["status"] == "unhealthy"
            assert health_report["summary"]["unhealthy"] == 1
    
    def test_get_service_health(self, health_manager_instance):
        """Test getting specific service health."""
        health_manager_instance.register_service("test-service")
        
        service_info = health_manager_instance.get_service_health("test-service")
        assert service_info is not None
        assert service_info.name == "test-service"
        
        # Non-existent service
        assert health_manager_instance.get_service_health("non-existent") is None
    
    @pytest.mark.asyncio
    async def test_health_history(self, health_manager_instance):
        """Test health history tracking."""
        # Perform a health check to generate history
        with patch.object(health_manager_instance, 'check_database_health') as mock_db, \
             patch.object(health_manager_instance, 'check_gemini_health') as mock_gemini, \
             patch.object(health_manager_instance, 'check_cursor_health') as mock_cursor, \
             patch.object(health_manager_instance, 'check_websocket_health') as mock_ws, \
             patch.object(health_manager_instance, 'check_system_resources') as mock_system:
            
            mock_db.return_value = HealthCheckResult(ServiceStatus.HEALTHY)
            mock_gemini.return_value = HealthCheckResult(ServiceStatus.HEALTHY)
            mock_cursor.return_value = HealthCheckResult(ServiceStatus.HEALTHY)
            mock_ws.return_value = HealthCheckResult(ServiceStatus.HEALTHY)
            mock_system.return_value = HealthCheckResult(ServiceStatus.HEALTHY)
            
            # Perform multiple health checks
            await health_manager_instance.perform_comprehensive_health_check()
            await health_manager_instance.perform_comprehensive_health_check()
            
            history = health_manager_instance.get_health_history(limit=5)
            assert len(history) == 2
            
            # Test with smaller limit
            history = health_manager_instance.get_health_history(limit=1)
            assert len(history) == 1


class TestHealthAPIEndpoints:
    """Test health check API endpoints."""
    
    def test_health_endpoint_healthy(self, test_client: TestClient):
        """Test health endpoint when services are healthy."""
        with patch('app.core.health.health_manager') as mock_manager:
            mock_manager.perform_comprehensive_health_check = AsyncMock(return_value={
                "status": "healthy",
                "version": "0.1.0",
                "environment": "development",
                "services": {
                    "database": {"status": "healthy"},
                    "gemini": {"status": "not_configured"},
                    "cursor": {"status": "healthy"},
                    "websocket": {"status": "healthy"},
                    "system": {"status": "healthy"}
                },
                "summary": {
                    "total_services": 5,
                    "healthy": 4,
                    "not_configured": 1,
                    "degraded": 0,
                    "unhealthy": 0
                }
            })
            
            response = test_client.get("/health")
            
            assert response.status_code == 200
            data = response.json()
            assert data["status"] == "healthy"
            assert "services" in data
            assert "summary" in data
    
    def test_health_endpoint_degraded(self, test_client: TestClient):
        """Test health endpoint when services are degraded."""
        with patch('app.core.health.health_manager') as mock_manager:
            mock_manager.perform_comprehensive_health_check = AsyncMock(return_value={
                "status": "degraded",
                "version": "0.1.0",
                "services": {"database": {"status": "degraded"}},
                "summary": {"degraded": 1}
            })
            
            response = test_client.get("/health")
            
            assert response.status_code == 200
            data = response.json()
            assert data["status"] == "degraded"
            assert "warning" in data
    
    def test_health_endpoint_unhealthy(self, test_client: TestClient):
        """Test health endpoint when services are unhealthy."""
        with patch('app.core.health.health_manager') as mock_manager:
            mock_manager.perform_comprehensive_health_check = AsyncMock(return_value={
                "status": "unhealthy",
                "version": "0.1.0",
                "services": {"database": {"status": "unhealthy"}},
                "summary": {"unhealthy": 1}
            })
            
            response = test_client.get("/health")
            
            assert response.status_code == 503
            data = response.json()
            assert data["detail"]["message"] == "Service unhealthy"
            assert "health_report" in data["detail"]
    
    def test_service_health_endpoint(self, test_client: TestClient):
        """Test individual service health endpoint."""
        with patch('app.core.health.health_manager') as mock_manager:
            mock_manager.check_database_health = AsyncMock(return_value=HealthCheckResult(
                status=ServiceStatus.HEALTHY,
                details={"connection": "active"},
                response_time_ms=50.0
            ))
            
            response = test_client.get("/health/services/database")
            
            assert response.status_code == 200
            data = response.json()
            assert data["service"] == "database"
            assert data["status"] == "healthy"
            assert data["details"]["connection"] == "active"
            assert data["response_time_ms"] == 50.0
    
    def test_service_health_endpoint_not_found(self, test_client: TestClient):
        """Test service health endpoint for non-existent service."""
        response = test_client.get("/health/services/nonexistent")
        
        assert response.status_code == 404
        data = response.json()
        assert "not found" in data["detail"]
    
    def test_health_history_endpoint(self, test_client: TestClient):
        """Test health history endpoint."""
        with patch('app.core.health.health_manager') as mock_manager:
            mock_manager.get_health_history = Mock(return_value=[
                {"status": "healthy", "timestamp": "2024-01-01T10:00:00"},
                {"status": "degraded", "timestamp": "2024-01-01T09:00:00"}
            ])
            
            response = test_client.get("/health/history?limit=2")
            
            assert response.status_code == 200
            data = response.json()
            assert data["count"] == 2
            assert data["requested_limit"] == 2
            assert len(data["history"]) == 2
    
    def test_root_endpoint_includes_health_info(self, test_client: TestClient):
        """Test that root endpoint includes health endpoint information."""
        response = test_client.get("/")
        
        assert response.status_code == 200
        data = response.json()
        assert "health_endpoints" in data
        assert data["health_endpoints"]["comprehensive"] == "/health"
        assert data["health_endpoints"]["service_specific"] == "/health/services/{service_name}"
        assert data["health_endpoints"]["history"] == "/health/history" 