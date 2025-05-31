# Health Monitoring System

## Overview

The Synapse-Hub backend includes a comprehensive health monitoring system that provides real-time status tracking for all application services. This system is designed specifically for Raspberry Pi deployment with resource-optimized monitoring and detailed diagnostic capabilities.

## Architecture

### Core Components

- **HealthManager** (`app/core/health.py`): Central coordinator for all health checks
- **Health API Endpoints** (`app/main.py`): RESTful endpoints for health status
- **Health Verification Script** (`scripts/verify_health.py`): CLI tool for deployment verification
- **Service Monitors**: Individual health checks for each application component

### Monitored Services

1. **Database** - SQLite/aiosqlite connection and query performance
2. **Gemini API** - AI service connectivity and API key validation
3. **Cursor Connector** - Local machine automation service status
4. **WebSocket** - Real-time communication service availability
5. **System Resources** - CPU, Memory, and Disk usage monitoring

## Health Status Levels

The system uses five distinct status levels:

- **✅ Healthy**: Service operating optimally within normal parameters
- **⚠️ Degraded**: Service functional but with performance issues or warnings
- **❌ Unhealthy**: Service has critical issues requiring immediate attention
- **⚙️ Not Configured**: Service not configured (expected during development/setup)
- **❓ Unknown**: Service status cannot be determined

## Health Check Features

### Comprehensive Health Reports

```python
# Example health report structure
{
  "status": "healthy",
  "version": "0.1.0",
  "environment": "production",
  "timestamp": "2024-01-20T10:30:00Z",
  "response_time_ms": 358.7,
  "services": {
    "database": {
      "status": "healthy",
      "details": {
        "connection": "active",
        "engine": "sqlite+aiosqlite",
        "query_test": "passed"
      },
      "response_time_ms": 15.2
    },
    "system": {
      "status": "healthy",
      "details": {
        "cpu_percent": 12.5,
        "memory_percent": 67.8,
        "disk_percent": 8.0,
        "warnings": []
      },
      "response_time_ms": 112.3
    }
  },
  "summary": {
    "total_services": 5,
    "healthy": 3,
    "degraded": 0,
    "unhealthy": 0,
    "not_configured": 2
  }
}
```

### Performance Monitoring

- **Response Time Tracking**: Each health check measures and reports response times
- **Resource Thresholds**: Configurable thresholds for CPU (80%), Memory (85%), Disk (90%)
- **Concurrent Execution**: Health checks run concurrently using asyncio.gather()
- **History Tracking**: Rolling history of last 100 health checks

### Error Diagnostics

- **Detailed Error Messages**: Comprehensive error reporting with context
- **Configuration Guidance**: Specific recommendations for service setup
- **Resource Warnings**: Proactive alerts for resource usage approaching limits
- **Troubleshooting Context**: Error details to assist with problem resolution

## API Endpoints

### Comprehensive Health Check

```http
GET /health
```

Returns complete health status for all services with appropriate HTTP status codes:

- **200 OK**: System healthy or degraded (functional)
- **503 Service Unavailable**: System unhealthy (critical issues)

### Individual Service Health

```http
GET /health/services/{service_name}
```

Available services: `database`, `gemini`, `cursor`, `websocket`, `system`

Returns detailed health information for a specific service.

### Health History

```http
GET /health/history?limit=10
```

Returns historical health check data with configurable limit (max 100).

## Usage Guide

### CLI Verification Tool

The health verification script provides comprehensive deployment validation:

```bash
cd rpi-backend
python scripts/verify_health.py
```

**Output Features:**

- **Configuration Display**: Version, environment, debug status
- **Service Status Breakdown**: Detailed status with performance metrics
- **Resource Monitoring**: CPU, Memory, Disk usage with Raspberry Pi optimization
- **Recommendations**: Specific guidance for configuration and issue resolution
- **Exit Codes**: 0 for success, 1 for failures (suitable for automation)

### API Integration

```python
import httpx

async def check_system_health():
    async with httpx.AsyncClient() as client:
        response = await client.get("http://localhost:8000/health")

        if response.status_code == 200:
            health_data = response.json()
            print(f"System Status: {health_data['status']}")
            return health_data['status'] in ['healthy', 'degraded']
        else:
            print("System Unhealthy")
            return False
```

### Monitoring Integration

#### Automated Health Checks

```bash
# Add to crontab for hourly monitoring
crontab -e

# Add this line:
0 * * * * cd /path/to/synapse-hub/rpi-backend && python scripts/verify_health.py >> /var/log/synapse-hub-health.log 2>&1
```

#### Service Monitoring

```bash
# Monitor health endpoint from external systems
curl -f http://your-rpi:8000/health || echo "Health check failed"

# Integration with systemd
ExecStartPre=/bin/bash -c 'curl -f http://localhost:8000/health || exit 1'
```

## Development Guidelines

### Adding New Health Checks

1. **Create Health Check Method** in `HealthManager`:

```python
async def check_new_service_health(self) -> HealthCheckResult:
    start_time = asyncio.get_event_loop().time()

    try:
        # Perform health check logic
        is_healthy = await service.health_check()
        response_time = (asyncio.get_event_loop().time() - start_time) * 1000

        return HealthCheckResult(
            status=ServiceStatus.HEALTHY if is_healthy else ServiceStatus.UNHEALTHY,
            details={"service_info": "data"},
            response_time_ms=response_time
        )
    except Exception as e:
        response_time = (asyncio.get_event_loop().time() - start_time) * 1000
        return HealthCheckResult(
            status=ServiceStatus.UNHEALTHY,
            error=str(e),
            response_time_ms=response_time
        )
```

2. **Update Comprehensive Check**: Add to `perform_comprehensive_health_check()`
3. **Add API Endpoint**: Include in service health endpoint mapping
4. **Write Tests**: Add comprehensive test coverage
5. **Update Documentation**: Document the new health check

### Testing Health Checks

```bash
# Run health check tests
pytest tests/test_health_system.py -v

# Test individual components
pytest tests/test_health_system.py::TestHealthManager::test_database_health_check_success -v

# Coverage report
pytest tests/test_health_system.py --cov=app.core.health --cov-report=html
```

## Deployment Considerations

### Raspberry Pi Optimization

- **Resource Monitoring**: Tuned thresholds for Raspberry Pi constraints
- **Concurrent Execution**: Optimized for limited CPU cores
- **Memory Efficiency**: Minimal memory footprint with psutil integration
- **Response Time Targets**: Sub-400ms total health check time

### Production Deployment

1. **Health Check Verification**: Always run verification script after deployment
2. **Automated Monitoring**: Set up cron jobs for regular health checks
3. **Log Management**: Configure health check logging with rotation
4. **Alert Integration**: Integrate with monitoring systems via API endpoints

### Configuration Management

Environment variables for health check tuning:

```bash
# Health check configuration
SYNAPSE_HEALTH_CHECK_TIMEOUT=30
SYNAPSE_HEALTH_HISTORY_SIZE=100
SYNAPSE_RESOURCE_WARNING_THRESHOLDS="cpu:80,memory:85,disk:90"
```

## Troubleshooting

### Common Issues

#### Database Health Check Failures

```
Error: Database connection test failed
```

**Solutions:**

- Verify database file permissions
- Check SQLite file corruption: `sqlite3 synapse_hub.db "PRAGMA integrity_check;"`
- Restart database connections: Restart application

#### System Resource Monitoring Issues

```
Error: System monitoring requires psutil package
```

**Solutions:**

- Install psutil: `pip install psutil==5.9.6`
- Verify virtual environment activation
- Check Python package compatibility

#### API Service Not Configured

```
Status: not_configured - API key not set
```

**Solutions:**

- Set environment variables in `.env` file
- Verify API key validity
- Check service configuration files

### Performance Tuning

#### Raspberry Pi 3B (1GB RAM)

```bash
# Reduce health check frequency
SYNAPSE_HEALTH_CHECK_INTERVAL=300  # 5 minutes

# Lower resource thresholds
SYNAPSE_CPU_WARNING_THRESHOLD=70
SYNAPSE_MEMORY_WARNING_THRESHOLD=75
```

#### Raspberry Pi 4 (4GB+ RAM)

```bash
# Standard configuration
SYNAPSE_HEALTH_CHECK_INTERVAL=60   # 1 minute
SYNAPSE_CPU_WARNING_THRESHOLD=80
SYNAPSE_MEMORY_WARNING_THRESHOLD=85
```

## Metrics and Analytics

### Key Performance Indicators

- **Response Time**: Target <400ms for comprehensive health check
- **Service Availability**: >99% uptime for critical services
- **Resource Utilization**: CPU <80%, Memory <85%, Disk <90%
- **Error Rate**: <1% health check failures in normal operation

### Health Data Analysis

```python
# Analyze health history trends
import json
import httpx

async def analyze_health_trends():
    async with httpx.AsyncClient() as client:
        response = await client.get("http://localhost:8000/health/history?limit=100")
        history = response.json()["history"]

        # Calculate average response times
        avg_response_time = sum(h["response_time_ms"] for h in history) / len(history)

        # Count status distribution
        status_counts = {}
        for check in history:
            status = check["status"]
            status_counts[status] = status_counts.get(status, 0) + 1

        return {
            "average_response_time": avg_response_time,
            "status_distribution": status_counts,
            "total_checks": len(history)
        }
```

---

## Conclusion

The Synapse-Hub health monitoring system provides production-ready observability for Raspberry Pi deployment with comprehensive service monitoring, performance tracking, and diagnostic capabilities. The system is designed for reliability, efficiency, and ease of use in resource-constrained environments.

For additional support or feature requests, please refer to the main project documentation or create an issue in the repository.
