#!/usr/bin/env python3
"""
Health Check Verification Script for Synapse-Hub Backend

This script verifies that the health check system is working correctly
and provides detailed information about service status.
"""

import asyncio
import json
import sys
from typing import Dict, Any

try:
    from app.core.health import health_manager
    from app.core.config import get_settings
except ImportError as e:
    print(f"❌ Failed to import required modules: {e}")
    print("Make sure you're running this from the rpi-backend directory")
    sys.exit(1)


def print_status_icon(status: str) -> str:
    """Get status icon for display."""
    icons = {
        "healthy": "✅",
        "degraded": "⚠️",
        "unhealthy": "❌",
        "not_configured": "⚙️",
        "unknown": "❓"
    }
    return icons.get(status, "❓")


def print_service_status(service_name: str, service_data: Dict[str, Any]) -> None:
    """Print formatted service status."""
    status = service_data.get("status", "unknown")
    icon = print_status_icon(status)
    response_time = service_data.get("response_time_ms")
    
    print(f"  {icon} {service_name.upper()}: {status}")
    
    if response_time is not None:
        print(f"    Response Time: {response_time:.2f}ms")
    
    if service_data.get("error"):
        print(f"    Error: {service_data['error']}")
    
    # Show relevant details
    details = service_data.get("details", {})
    if details:
        if service_name == "system":
            print(f"    CPU: {details.get('cpu_percent', 'N/A')}%")
            print(f"    Memory: {details.get('memory_percent', 'N/A')}%")
            print(f"    Disk: {details.get('disk_percent', 'N/A')}%")
            if details.get("warnings"):
                print(f"    Warnings: {', '.join(details['warnings'])}")
        elif service_name == "database":
            print(f"    Connection: {details.get('connection', 'N/A')}")
            print(f"    Engine: {details.get('engine', 'N/A')}")
        elif service_name == "gemini":
            if details.get("model"):
                print(f"    Model: {details['model']}")
        elif service_name == "cursor":
            if details.get("is_connected") is not None:
                print(f"    Connected: {details['is_connected']}")
    
    print()


async def verify_health_system() -> bool:
    """
    Verify the health check system is working correctly.
    
    Returns:
        bool: True if verification successful, False otherwise
    """
    print("🔍 Synapse-Hub Backend Health Check Verification")
    print("=" * 50)
    
    try:
        # Get settings info
        settings = get_settings()
        print(f"📋 Configuration:")
        print(f"  Version: {settings.version}")
        print(f"  Environment: {settings.environment}")
        print(f"  Debug Mode: {settings.debug}")
        print()
        
        # Perform comprehensive health check
        print("🏥 Performing comprehensive health check...")
        health_report = await health_manager.perform_comprehensive_health_check()
        
        # Overall status
        overall_status = health_report["status"]
        overall_icon = print_status_icon(overall_status)
        print(f"📊 Overall Status: {overall_icon} {overall_status.upper()}")
        print()
        
        # Service breakdown
        print("🔧 Service Status:")
        services = health_report.get("services", {})
        for service_name, service_data in services.items():
            print_service_status(service_name, service_data)
        
        # Summary
        summary = health_report.get("summary", {})
        print("📈 Summary:")
        print(f"  Total Services: {summary.get('total_services', 0)}")
        print(f"  Healthy: {summary.get('healthy', 0)}")
        print(f"  Degraded: {summary.get('degraded', 0)}")
        print(f"  Unhealthy: {summary.get('unhealthy', 0)}")
        print(f"  Not Configured: {summary.get('not_configured', 0)}")
        print()
        
        # Response time
        response_time = health_report.get("response_time_ms", 0)
        print(f"⏱️  Total Response Time: {response_time:.2f}ms")
        print()
        
        # Recommendations
        print("💡 Recommendations:")
        
        if overall_status == "healthy":
            print("  ✅ System is healthy and ready for production!")
        elif overall_status == "degraded":
            print("  ⚠️  System is functional but has some issues:")
            for service_name, service_data in services.items():
                if service_data.get("status") == "degraded":
                    print(f"    - Fix {service_name} service issues")
        elif overall_status == "unhealthy":
            print("  ❌ System has critical issues that need attention:")
            for service_name, service_data in services.items():
                if service_data.get("status") == "unhealthy":
                    print(f"    - Fix {service_name} service: {service_data.get('error', 'Unknown error')}")
        
        # Configuration recommendations
        not_configured = [name for name, data in services.items() if data.get("status") == "not_configured"]
        if not_configured:
            print("  ⚙️  Services that need configuration:")
            for service in not_configured:
                if service == "gemini":
                    print("    - Set GEMINI_API_KEY environment variable")
                elif service == "cursor":
                    print("    - Configure Cursor Connector service")
                elif service == "websocket":
                    print("    - WebSocket service will be available when needed")
                else:
                    print(f"    - Configure {service} service")
        
        print()
        
        # Return success status
        return overall_status in ["healthy", "degraded"]
        
    except Exception as e:
        print(f"❌ Health check verification failed: {e}")
        return False


async def test_individual_services() -> None:
    """Test individual service health checks."""
    print("🔬 Testing Individual Service Health Checks")
    print("=" * 50)
    
    services = ["database", "gemini", "cursor", "websocket", "system"]
    
    for service_name in services:
        try:
            print(f"Testing {service_name}...")
            
            if service_name == "database":
                result = await health_manager.check_database_health()
            elif service_name == "gemini":
                result = await health_manager.check_gemini_health()
            elif service_name == "cursor":
                result = await health_manager.check_cursor_health()
            elif service_name == "websocket":
                result = await health_manager.check_websocket_health()
            elif service_name == "system":
                result = await health_manager.check_system_resources()
            
            icon = print_status_icon(result.status.value)
            print(f"  {icon} {service_name}: {result.status.value}")
            
            if result.response_time_ms:
                print(f"    Response time: {result.response_time_ms:.2f}ms")
            
            if result.error:
                print(f"    Error: {result.error}")
            
        except Exception as e:
            print(f"  ❌ {service_name}: Failed - {e}")
        
        print()


def main():
    """Main entry point."""
    print("🚀 Starting Synapse-Hub Health Check Verification\n")
    
    try:
        # Run comprehensive verification
        success = asyncio.run(verify_health_system())
        
        print("\n" + "=" * 50)
        
        # Run individual service tests
        asyncio.run(test_individual_services())
        
        print("=" * 50)
        
        if success:
            print("✅ Health check system verification completed successfully!")
            print("🚀 Backend is ready for deployment!")
            sys.exit(0)
        else:
            print("❌ Health check system verification failed!")
            print("🔧 Please address the issues above before deployment.")
            sys.exit(1)
            
    except KeyboardInterrupt:
        print("\n⏹️  Verification cancelled by user")
        sys.exit(1)
    except Exception as e:
        print(f"\n💥 Unexpected error during verification: {e}")
        sys.exit(1)


if __name__ == "__main__":
    main() 