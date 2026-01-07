"""Tests for health endpoint."""
import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_health_endpoint(async_client: AsyncClient) -> None:
    """Test that health endpoint returns healthy status."""
    response = await async_client.get("/api/health")
    assert response.status_code == 200
    
    data = response.json()
    assert data["status"] == "healthy"
    assert "timestamp" in data
    assert data["version"] == "0.1.0"


@pytest.mark.asyncio
async def test_health_response_structure(async_client: AsyncClient) -> None:
    """Test that health response has correct structure."""
    response = await async_client.get("/api/health")
    assert response.status_code == 200
    
    data = response.json()
    # Verify all required fields are present
    assert "status" in data
    assert "timestamp" in data
    assert "version" in data
