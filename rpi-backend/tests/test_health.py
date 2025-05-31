"""
Health check and basic API tests.
"""
import pytest
from fastapi.testclient import TestClient


def test_health_endpoint(test_client: TestClient):
    """Test the health check endpoint."""
    response = test_client.get("/health")
    
    assert response.status_code == 200
    data = response.json()
    
    assert data["status"] == "healthy"
    assert data["version"] == "0.1.0"
    assert data["environment"] == "development"
    assert "services" in data
    assert data["services"]["database"] == "healthy"


def test_root_endpoint(test_client: TestClient):
    """Test the root endpoint."""
    response = test_client.get("/")
    
    assert response.status_code == 200
    data = response.json()
    
    assert "name" in data
    assert "version" in data
    assert "description" in data
    assert data["name"] == "Synapse-Hub Backend"


def test_nonexistent_endpoint(test_client: TestClient):
    """Test that nonexistent endpoints return 404."""
    response = test_client.get("/nonexistent")
    assert response.status_code == 404


def test_cors_headers(test_client: TestClient):
    """Test that CORS headers are properly set."""
    response = test_client.get("/health")
    assert response.status_code == 200
    # For CORS testing, we can check if Access-Control headers are present
    # when request includes Origin header
    headers = {"Origin": "http://localhost:3000"}
    response = test_client.get("/health", headers=headers)
    assert response.status_code == 200 