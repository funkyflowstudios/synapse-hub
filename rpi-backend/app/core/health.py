"""
Comprehensive health management system for Synapse-Hub backend.

Provides centralized health monitoring for all application services
including database, AI services, WebSocket connections, and external dependencies.
"""

import asyncio
import logging
from datetime import datetime, timezone
from typing import Dict, Any, Optional, List
from dataclasses import dataclass, field
from enum import Enum

from app.core.config import get_settings

logger = logging.getLogger(__name__)


class ServiceStatus(Enum):
    """Service health status levels."""
    HEALTHY = "healthy"
    DEGRADED = "degraded" 
    UNHEALTHY = "unhealthy"
    UNKNOWN = "unknown"
    NOT_CONFIGURED = "not_configured"


@dataclass
class HealthCheckResult:
    """Result of a health check operation."""
    status: ServiceStatus
    details: Dict[str, Any] = field(default_factory=dict)
    error: Optional[str] = None
    response_time_ms: Optional[float] = None
    timestamp: datetime = field(default_factory=lambda: datetime.now(timezone.utc))


@dataclass
class ServiceHealthInfo:
    """Comprehensive health information for a service."""
    name: str
    status: ServiceStatus
    details: Dict[str, Any] = field(default_factory=dict)
    last_check: Optional[datetime] = None
    error_count: int = 0
    last_error: Optional[str] = None
    uptime_percentage: float = 100.0


class HealthManager:
    """
    Centralized health monitoring and management.
    
    Coordinates health checks across all application services and provides
    comprehensive health status reporting.
    """
    
    def __init__(self):
        self.services: Dict[str, ServiceHealthInfo] = {}
        self._health_history: List[Dict[str, Any]] = []
        self._max_history = 100
        self.settings = get_settings()
        
    def register_service(self, name: str) -> None:
        """Register a service for health monitoring."""
        self.services[name] = ServiceHealthInfo(
            name=name,
            status=ServiceStatus.UNKNOWN
        )
        logger.info(f"Registered service for health monitoring: {name}")
    
    async def check_database_health(self) -> HealthCheckResult:
        """Check database connectivity and health."""
        start_time = asyncio.get_event_loop().time()
        
        try:
            from app.core.database import health_check
            
            is_healthy = await health_check()
            response_time = (asyncio.get_event_loop().time() - start_time) * 1000
            
            if is_healthy:
                return HealthCheckResult(
                    status=ServiceStatus.HEALTHY,
                    details={
                        "connection": "active",
                        "engine": "sqlite+aiosqlite",
                        "query_test": "passed"
                    },
                    response_time_ms=response_time
                )
            else:
                return HealthCheckResult(
                    status=ServiceStatus.UNHEALTHY,
                    details={"connection": "failed"},
                    error="Database connection test failed",
                    response_time_ms=response_time
                )
                
        except Exception as e:
            response_time = (asyncio.get_event_loop().time() - start_time) * 1000
            logger.error(f"Database health check failed: {str(e)}")
            return HealthCheckResult(
                status=ServiceStatus.UNHEALTHY,
                error=str(e),
                response_time_ms=response_time
            )
    
    async def check_gemini_health(self) -> HealthCheckResult:
        """Check Gemini AI service health."""
        start_time = asyncio.get_event_loop().time()
        
        try:
            # Check if Gemini API key is configured
            if not self.settings.gemini_api_key or self.settings.gemini_api_key == "your_gemini_api_key_here":
                return HealthCheckResult(
                    status=ServiceStatus.NOT_CONFIGURED,
                    details={"reason": "API key not configured"},
                    error="Gemini API key not set in configuration"
                )
            
            # Try to create and test Gemini service
            from app.services.gemini_service import GeminiService
            from app.connectors.gemini_handler import GeminiConfig
            
            config = GeminiConfig.from_env()
            service = GeminiService(config)
            
            health_data = await service.health_check()
            response_time = (asyncio.get_event_loop().time() - start_time) * 1000
            
            status_map = {
                "healthy": ServiceStatus.HEALTHY,
                "degraded": ServiceStatus.DEGRADED,
                "unhealthy": ServiceStatus.UNHEALTHY
            }
            
            return HealthCheckResult(
                status=status_map.get(health_data["status"], ServiceStatus.UNKNOWN),
                details=health_data,
                response_time_ms=response_time
            )
            
        except ImportError:
            return HealthCheckResult(
                status=ServiceStatus.NOT_CONFIGURED,
                details={"reason": "Service not available"},
                error="Gemini service not properly configured"
            )
        except Exception as e:
            response_time = (asyncio.get_event_loop().time() - start_time) * 1000
            logger.error(f"Gemini health check failed: {str(e)}")
            return HealthCheckResult(
                status=ServiceStatus.UNHEALTHY,
                error=str(e),
                response_time_ms=response_time
            )
    
    async def check_cursor_health(self) -> HealthCheckResult:
        """Check Cursor Connector service health."""
        start_time = asyncio.get_event_loop().time()
        
        try:
            from app.services.cursor_service import CursorService
            from app.connectors.cursor_handler import CursorConnectorConfig
            
            config = CursorConnectorConfig.from_env()
            service = CursorService(config)
            
            health_data = await service.get_health_status()
            response_time = (asyncio.get_event_loop().time() - start_time) * 1000
            
            # Map cursor status to health status
            status_mapping = {
                "connected": ServiceStatus.HEALTHY,
                "disconnected": ServiceStatus.DEGRADED,
                "error": ServiceStatus.UNHEALTHY
            }
            
            status = status_mapping.get(health_data["status"], ServiceStatus.UNKNOWN)
            
            return HealthCheckResult(
                status=status,
                details=health_data,
                response_time_ms=response_time
            )
            
        except ImportError:
            return HealthCheckResult(
                status=ServiceStatus.NOT_CONFIGURED,
                details={"reason": "Service not available"},
                error="Cursor service not properly configured"
            )
        except Exception as e:
            response_time = (asyncio.get_event_loop().time() - start_time) * 1000
            logger.error(f"Cursor health check failed: {str(e)}")
            return HealthCheckResult(
                status=ServiceStatus.UNHEALTHY,
                error=str(e),
                response_time_ms=response_time
            )
    
    async def check_websocket_health(self) -> HealthCheckResult:
        """Check WebSocket service health."""
        start_time = asyncio.get_event_loop().time()
        
        try:
            from app.services.websocket_service import WebSocketManager
            
            # Get the WebSocket manager instance (if it exists)
            # For now, we'll check if the service is importable and configured
            response_time = (asyncio.get_event_loop().time() - start_time) * 1000
            
            return HealthCheckResult(
                status=ServiceStatus.HEALTHY,
                details={
                    "service": "available",
                    "connections": 0,  # TODO: Get actual connection count
                    "handler": "websocket_service.WebSocketManager"
                },
                response_time_ms=response_time
            )
            
        except ImportError:
            return HealthCheckResult(
                status=ServiceStatus.NOT_CONFIGURED,
                details={"reason": "WebSocket service not available"},
                error="WebSocket service not properly configured"
            )
        except Exception as e:
            response_time = (asyncio.get_event_loop().time() - start_time) * 1000
            logger.error(f"WebSocket health check failed: {str(e)}")
            return HealthCheckResult(
                status=ServiceStatus.UNHEALTHY,
                error=str(e),
                response_time_ms=response_time
            )
    
    async def check_system_resources(self) -> HealthCheckResult:
        """Check system resource utilization."""
        start_time = asyncio.get_event_loop().time()
        
        try:
            import psutil
            
            # Get system metrics
            cpu_percent = psutil.cpu_percent(interval=0.1)
            memory = psutil.virtual_memory()
            disk = psutil.disk_usage('/')
            
            response_time = (asyncio.get_event_loop().time() - start_time) * 1000
            
            # Determine status based on resource usage
            status = ServiceStatus.HEALTHY
            warnings = []
            
            if cpu_percent > 80:
                status = ServiceStatus.DEGRADED
                warnings.append(f"High CPU usage: {cpu_percent}%")
            
            if memory.percent > 85:
                status = ServiceStatus.DEGRADED
                warnings.append(f"High memory usage: {memory.percent}%")
            
            if disk.percent > 90:
                status = ServiceStatus.DEGRADED
                warnings.append(f"High disk usage: {disk.percent}%")
            
            return HealthCheckResult(
                status=status,
                details={
                    "cpu_percent": cpu_percent,
                    "memory_percent": memory.percent,
                    "memory_available_mb": memory.available // 1024 // 1024,
                    "disk_percent": disk.percent,
                    "disk_free_gb": disk.free // 1024 // 1024 // 1024,
                    "warnings": warnings
                },
                response_time_ms=response_time
            )
            
        except ImportError:
            return HealthCheckResult(
                status=ServiceStatus.NOT_CONFIGURED,
                details={"reason": "psutil not available"},
                error="System monitoring requires psutil package"
            )
        except Exception as e:
            response_time = (asyncio.get_event_loop().time() - start_time) * 1000
            logger.error(f"System resource check failed: {str(e)}")
            return HealthCheckResult(
                status=ServiceStatus.UNHEALTHY,
                error=str(e),
                response_time_ms=response_time
            )
    
    async def perform_comprehensive_health_check(self) -> Dict[str, Any]:
        """
        Perform comprehensive health check of all services.
        
        Returns:
            Complete health status report
        """
        start_time = datetime.now(timezone.utc)
        
        # Run all health checks concurrently
        health_checks = await asyncio.gather(
            self.check_database_health(),
            self.check_gemini_health(),
            self.check_cursor_health(),
            self.check_websocket_health(),
            self.check_system_resources(),
            return_exceptions=True
        )
        
        check_results = {
            "database": health_checks[0] if not isinstance(health_checks[0], Exception) else HealthCheckResult(ServiceStatus.UNHEALTHY, error=str(health_checks[0])),
            "gemini": health_checks[1] if not isinstance(health_checks[1], Exception) else HealthCheckResult(ServiceStatus.UNHEALTHY, error=str(health_checks[1])),
            "cursor": health_checks[2] if not isinstance(health_checks[2], Exception) else HealthCheckResult(ServiceStatus.UNHEALTHY, error=str(health_checks[2])),
            "websocket": health_checks[3] if not isinstance(health_checks[3], Exception) else HealthCheckResult(ServiceStatus.UNHEALTHY, error=str(health_checks[3])),
            "system": health_checks[4] if not isinstance(health_checks[4], Exception) else HealthCheckResult(ServiceStatus.UNHEALTHY, error=str(health_checks[4]))
        }
        
        # Update service health info
        for service_name, result in check_results.items():
            if service_name in self.services:
                service_info = self.services[service_name]
                service_info.status = result.status
                service_info.details = result.details
                service_info.last_check = result.timestamp
                
                if result.error:
                    service_info.error_count += 1
                    service_info.last_error = result.error
            else:
                self.register_service(service_name)
                self.services[service_name].status = result.status
                self.services[service_name].details = result.details
                self.services[service_name].last_check = result.timestamp
        
        # Determine overall system status
        statuses = [result.status for result in check_results.values()]
        
        if any(status == ServiceStatus.UNHEALTHY for status in statuses):
            overall_status = ServiceStatus.UNHEALTHY
        elif any(status == ServiceStatus.DEGRADED for status in statuses):
            overall_status = ServiceStatus.DEGRADED
        elif all(status in [ServiceStatus.HEALTHY, ServiceStatus.NOT_CONFIGURED] for status in statuses):
            overall_status = ServiceStatus.HEALTHY
        else:
            overall_status = ServiceStatus.UNKNOWN
        
        # Calculate total response time
        total_response_time = sum(
            result.response_time_ms for result in check_results.values() 
            if result.response_time_ms is not None
        )
        
        # Build comprehensive response
        health_report = {
            "status": overall_status.value,
            "version": self.settings.version,
            "environment": self.settings.environment,
            "timestamp": start_time.isoformat(),
            "response_time_ms": total_response_time,
            "services": {
                name: {
                    "status": result.status.value,
                    "details": result.details,
                    "response_time_ms": result.response_time_ms,
                    "error": result.error,
                    "last_check": result.timestamp.isoformat()
                }
                for name, result in check_results.items()
            },
            "summary": {
                "total_services": len(check_results),
                "healthy": len([s for s in statuses if s == ServiceStatus.HEALTHY]),
                "degraded": len([s for s in statuses if s == ServiceStatus.DEGRADED]),
                "unhealthy": len([s for s in statuses if s == ServiceStatus.UNHEALTHY]),
                "not_configured": len([s for s in statuses if s == ServiceStatus.NOT_CONFIGURED])
            }
        }
        
        # Store in history
        self._health_history.append(health_report)
        if len(self._health_history) > self._max_history:
            self._health_history.pop(0)
        
        return health_report
    
    def get_service_health(self, service_name: str) -> Optional[ServiceHealthInfo]:
        """Get health information for a specific service."""
        return self.services.get(service_name)
    
    def get_health_history(self, limit: int = 10) -> List[Dict[str, Any]]:
        """Get recent health check history."""
        return self._health_history[-limit:]


# Global health manager instance
health_manager = HealthManager() 