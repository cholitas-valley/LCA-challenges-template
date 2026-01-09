"""Tests for health endpoint."""
import pytest
from httpx import AsyncClient
from unittest.mock import AsyncMock, patch, MagicMock

from src.main import app


@pytest.mark.asyncio
async def test_health_endpoint(async_client: AsyncClient) -> None:
    """Test that health endpoint returns healthy status."""
    # Mock MQTT as connected
    mock_mqtt = MagicMock()
    mock_mqtt.is_connected = True
    app.state.mqtt = mock_mqtt

    with patch('src.main.check_database_health', return_value=(True, None)):
        response = await async_client.get("/api/health")

    assert response.status_code == 200

    data = response.json()
    assert data["status"] == "healthy"
    assert "timestamp" in data
    assert data["version"] == "0.1.0"


@pytest.mark.asyncio
async def test_health_response_structure(async_client: AsyncClient) -> None:
    """Test that health response has correct structure."""
    # Mock MQTT as connected
    mock_mqtt = MagicMock()
    mock_mqtt.is_connected = True
    app.state.mqtt = mock_mqtt

    with patch('src.main.check_database_health', return_value=(True, None)):
        response = await async_client.get("/api/health")

    assert response.status_code == 200

    data = response.json()
    # Verify all required fields are present
    assert "status" in data
    assert "timestamp" in data
    assert "version" in data
    assert "components" in data
    assert "database" in data["components"]
    assert "mqtt" in data["components"]


@pytest.mark.asyncio
async def test_health_all_connected(async_client: AsyncClient) -> None:
    """Test health returns healthy when all components connected."""
    # Mock MQTT as connected
    mock_mqtt = MagicMock()
    mock_mqtt.is_connected = True
    app.state.mqtt = mock_mqtt

    with patch('src.main.check_database_health', return_value=(True, None)):
        response = await async_client.get("/api/health")

    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert data["components"]["database"]["status"] == "connected"
    assert data["components"]["mqtt"]["status"] == "connected"


@pytest.mark.asyncio
async def test_health_mqtt_disconnected(async_client: AsyncClient) -> None:
    """Test health returns degraded when MQTT disconnected."""
    # Mock MQTT as disconnected
    mock_mqtt = MagicMock()
    mock_mqtt.is_connected = False
    app.state.mqtt = mock_mqtt

    with patch('src.main.check_database_health', return_value=(True, None)):
        response = await async_client.get("/api/health")

    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "degraded"
    assert data["components"]["database"]["status"] == "connected"
    assert data["components"]["mqtt"]["status"] == "disconnected"


@pytest.mark.asyncio
async def test_health_database_disconnected(async_client: AsyncClient) -> None:
    """Test health returns degraded when database disconnected."""
    # Mock MQTT as connected
    mock_mqtt = MagicMock()
    mock_mqtt.is_connected = True
    app.state.mqtt = mock_mqtt

    with patch('src.main.check_database_health', return_value=(False, "Connection error")):
        response = await async_client.get("/api/health")

    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "degraded"
    assert data["components"]["database"]["status"] == "disconnected"
    assert data["components"]["database"]["message"] == "Connection error"
    assert data["components"]["mqtt"]["status"] == "connected"


@pytest.mark.asyncio
async def test_health_all_disconnected(async_client: AsyncClient) -> None:
    """Test health returns unhealthy when all components disconnected."""
    # Mock MQTT as disconnected
    mock_mqtt = MagicMock()
    mock_mqtt.is_connected = False
    app.state.mqtt = mock_mqtt

    with patch('src.main.check_database_health', return_value=(False, "Connection error")):
        response = await async_client.get("/api/health")

    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "unhealthy"
    assert data["components"]["database"]["status"] == "disconnected"
    assert data["components"]["mqtt"]["status"] == "disconnected"


@pytest.mark.asyncio
async def test_ready_returns_503_when_not_ready(async_client: AsyncClient) -> None:
    """Test ready returns 503 when components disconnected."""
    # Mock MQTT as disconnected
    mock_mqtt = MagicMock()
    mock_mqtt.is_connected = False
    app.state.mqtt = mock_mqtt

    with patch('src.main.check_database_health', return_value=(True, None)):
        response = await async_client.get("/api/ready")

    assert response.status_code == 503
    data = response.json()
    assert data["ready"] is False
    assert data["checks"]["database"] is True
    assert data["checks"]["mqtt"] is False


@pytest.mark.asyncio
async def test_ready_returns_200_when_ready(async_client: AsyncClient) -> None:
    """Test ready returns 200 when all components connected."""
    # Mock MQTT as connected
    mock_mqtt = MagicMock()
    mock_mqtt.is_connected = True
    app.state.mqtt = mock_mqtt

    with patch('src.main.check_database_health', return_value=(True, None)):
        response = await async_client.get("/api/ready")

    assert response.status_code == 200
    data = response.json()
    assert data["ready"] is True
    assert data["checks"]["database"] is True
    assert data["checks"]["mqtt"] is True


@pytest.mark.asyncio
async def test_ready_returns_503_when_database_down(async_client: AsyncClient) -> None:
    """Test ready returns 503 when database is down."""
    # Mock MQTT as connected
    mock_mqtt = MagicMock()
    mock_mqtt.is_connected = True
    app.state.mqtt = mock_mqtt

    with patch('src.main.check_database_health', return_value=(False, "Connection error")):
        response = await async_client.get("/api/ready")

    assert response.status_code == 503
    data = response.json()
    assert data["ready"] is False
    assert data["checks"]["database"] is False
    assert data["checks"]["mqtt"] is True
