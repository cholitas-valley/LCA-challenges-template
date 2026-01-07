"""Tests for telemetry ingestion and retrieval."""
import json
from datetime import datetime, timedelta
from unittest.mock import AsyncMock, Mock, MagicMock, patch

import pytest

from src.models.telemetry import TelemetryPayload
from src.services.telemetry_handler import TelemetryHandler


class AsyncContextManagerMock:
    """Helper class to mock async context managers."""
    def __init__(self, return_value):
        self.return_value = return_value

    async def __aenter__(self):
        return self.return_value

    async def __aexit__(self, *args):
        return None


@pytest.mark.asyncio
class TestTelemetryRepository:
    """Test telemetry repository functions."""

    async def test_insert_telemetry(self):
        """Test inserting telemetry record."""
        from src.repositories.telemetry import insert_telemetry

        conn = AsyncMock()
        conn.execute = AsyncMock()

        await insert_telemetry(
            conn=conn,
            time=datetime.now(),
            device_id="device-123",
            plant_id="plant-456",
            soil_moisture=45.2,
            temperature=22.5,
            humidity=65.0,
            light_level=800.0,
        )

        # Verify INSERT was called
        conn.execute.assert_called_once()
        call_args = conn.execute.call_args
        assert "INSERT INTO telemetry" in call_args[0][0]

    async def test_get_latest_by_device(self):
        """Test retrieving latest telemetry by device."""
        from src.repositories.telemetry import get_latest_by_device

        conn = AsyncMock()
        mock_row = {
            "time": datetime.now(),
            "device_id": "device-123",
            "plant_id": "plant-456",
            "soil_moisture": 45.2,
            "temperature": 22.5,
            "humidity": 65.0,
            "light_level": 800.0,
        }
        conn.fetchrow = AsyncMock(return_value=mock_row)

        result = await get_latest_by_device(conn, "device-123")

        assert result is not None
        assert result["device_id"] == "device-123"
        assert result["soil_moisture"] == 45.2
        conn.fetchrow.assert_called_once()

    async def test_get_latest_by_device_no_data(self):
        """Test retrieving latest telemetry when no data exists."""
        from src.repositories.telemetry import get_latest_by_device

        conn = AsyncMock()
        conn.fetchrow = AsyncMock(return_value=None)

        result = await get_latest_by_device(conn, "device-nonexistent")

        assert result is None

    async def test_get_latest_by_plant(self):
        """Test retrieving latest telemetry by plant."""
        from src.repositories.telemetry import get_latest_by_plant

        conn = AsyncMock()
        mock_row = {
            "time": datetime.now(),
            "device_id": "device-123",
            "plant_id": "plant-456",
            "soil_moisture": 45.2,
            "temperature": 22.5,
            "humidity": 65.0,
            "light_level": 800.0,
        }
        conn.fetchrow = AsyncMock(return_value=mock_row)

        result = await get_latest_by_plant(conn, "plant-456")

        assert result is not None
        assert result["plant_id"] == "plant-456"
        conn.fetchrow.assert_called_once()

    async def test_get_history(self):
        """Test retrieving telemetry history."""
        from src.repositories.telemetry import get_history

        conn = AsyncMock()
        now = datetime.now()
        mock_rows = [
            {
                "time": now - timedelta(hours=1),
                "device_id": "device-123",
                "plant_id": "plant-456",
                "soil_moisture": 45.2,
                "temperature": 22.5,
                "humidity": 65.0,
                "light_level": 800.0,
            },
            {
                "time": now - timedelta(hours=2),
                "device_id": "device-123",
                "plant_id": "plant-456",
                "soil_moisture": 46.0,
                "temperature": 22.0,
                "humidity": 64.0,
                "light_level": 750.0,
            },
        ]
        conn.fetch = AsyncMock(return_value=mock_rows)

        start_time = now - timedelta(hours=24)
        end_time = now
        results = await get_history(
            conn, "plant-456", start_time=start_time, end_time=end_time
        )

        assert len(results) == 2
        assert results[0]["soil_moisture"] == 45.2
        assert results[1]["soil_moisture"] == 46.0
        conn.fetch.assert_called_once()


@pytest.mark.asyncio
class TestTelemetryHandler:
    """Test telemetry handler service."""

    async def test_handle_telemetry_with_assigned_device(self):
        """Test handling telemetry from device assigned to plant."""
        handler = TelemetryHandler()

        # Mock the database pool and connection
        mock_conn = AsyncMock()
        mock_pool = MagicMock()
        mock_pool.acquire.return_value = AsyncContextManagerMock(mock_conn)

        # Mock device lookup - device exists and is assigned
        mock_device = {
            "id": "device-123",
            "plant_id": "plant-456",
            "status": "online",
        }

        with patch("src.services.telemetry_handler.get_pool", return_value=mock_pool):
            with patch("src.services.telemetry_handler.device_repo.get_device_by_id",
                      new=AsyncMock(return_value=mock_device)):
                with patch("src.services.telemetry_handler.telemetry_repo.insert_telemetry",
                          new=AsyncMock()) as mock_insert:

                    payload = {
                        "soil_moisture": 45.2,
                        "temperature": 22.5,
                        "humidity": 65.0,
                        "light_level": 800.0,
                    }

                    await handler.handle_telemetry("device-123", payload)

                    # Verify telemetry was inserted
                    mock_insert.assert_called_once()
                    call_kwargs = mock_insert.call_args[1]
                    assert call_kwargs["device_id"] == "device-123"
                    assert call_kwargs["plant_id"] == "plant-456"
                    assert call_kwargs["soil_moisture"] == 45.2

    async def test_handle_telemetry_with_unassigned_device(self):
        """Test handling telemetry from device not assigned to plant."""
        handler = TelemetryHandler()

        # Mock the database pool and connection
        mock_conn = AsyncMock()
        mock_pool = MagicMock()
        mock_pool.acquire.return_value = AsyncContextManagerMock(mock_conn)

        # Mock device lookup - device exists but not assigned
        mock_device = {
            "id": "device-123",
            "plant_id": None,
            "status": "provisioning",
        }

        with patch("src.services.telemetry_handler.get_pool", return_value=mock_pool):
            with patch("src.services.telemetry_handler.device_repo.get_device_by_id", 
                      new=AsyncMock(return_value=mock_device)):
                with patch("src.services.telemetry_handler.telemetry_repo.insert_telemetry",
                          new=AsyncMock()) as mock_insert:
                    
                    payload = {
                        "soil_moisture": 45.2,
                    }

                    await handler.handle_telemetry("device-123", payload)

                    # Verify telemetry was inserted with null plant_id
                    mock_insert.assert_called_once()
                    call_kwargs = mock_insert.call_args[1]
                    assert call_kwargs["device_id"] == "device-123"
                    assert call_kwargs["plant_id"] is None

    async def test_handle_telemetry_unknown_device(self):
        """Test handling telemetry from unknown device."""
        handler = TelemetryHandler()

        # Mock the database pool and connection
        mock_conn = AsyncMock()
        mock_pool = MagicMock()
        mock_pool.acquire.return_value = AsyncContextManagerMock(mock_conn)

        # Mock device lookup - device does not exist
        with patch("src.services.telemetry_handler.get_pool", return_value=mock_pool):
            with patch("src.services.telemetry_handler.device_repo.get_device_by_id", 
                      new=AsyncMock(return_value=None)):
                with patch("src.services.telemetry_handler.telemetry_repo.insert_telemetry",
                          new=AsyncMock()) as mock_insert:
                    
                    payload = {
                        "soil_moisture": 45.2,
                    }

                    await handler.handle_telemetry("device-unknown", payload)

                    # Verify telemetry was still inserted with null plant_id
                    mock_insert.assert_called_once()
                    call_kwargs = mock_insert.call_args[1]
                    assert call_kwargs["device_id"] == "device-unknown"
                    assert call_kwargs["plant_id"] is None

    async def test_handle_telemetry_uses_server_timestamp(self):
        """Test that server timestamp is used when device timestamp missing."""
        handler = TelemetryHandler()

        # Mock the database pool and connection
        mock_conn = AsyncMock()
        mock_pool = MagicMock()
        mock_pool.acquire.return_value = AsyncContextManagerMock(mock_conn)

        mock_device = {"id": "device-123", "plant_id": "plant-456"}

        with patch("src.services.telemetry_handler.get_pool", return_value=mock_pool):
            with patch("src.services.telemetry_handler.device_repo.get_device_by_id", 
                      new=AsyncMock(return_value=mock_device)):
                with patch("src.services.telemetry_handler.telemetry_repo.insert_telemetry",
                          new=AsyncMock()) as mock_insert:
                    
                    # Payload without timestamp
                    payload = {
                        "soil_moisture": 45.2,
                    }

                    await handler.handle_telemetry("device-123", payload)

                    # Verify a timestamp was provided
                    mock_insert.assert_called_once()
                    call_kwargs = mock_insert.call_args[1]
                    assert "time" in call_kwargs
                    assert isinstance(call_kwargs["time"], datetime)

    async def test_handle_telemetry_partial_data(self):
        """Test handling telemetry with partial sensor data."""
        handler = TelemetryHandler()

        # Mock the database pool and connection
        mock_conn = AsyncMock()
        mock_pool = MagicMock()
        mock_pool.acquire.return_value = AsyncContextManagerMock(mock_conn)

        mock_device = {"id": "device-123", "plant_id": "plant-456"}

        with patch("src.services.telemetry_handler.get_pool", return_value=mock_pool):
            with patch("src.services.telemetry_handler.device_repo.get_device_by_id", 
                      new=AsyncMock(return_value=mock_device)):
                with patch("src.services.telemetry_handler.telemetry_repo.insert_telemetry",
                          new=AsyncMock()) as mock_insert:
                    
                    # Payload with only one sensor reading
                    payload = {
                        "soil_moisture": 45.2,
                    }

                    await handler.handle_telemetry("device-123", payload)

                    # Verify telemetry was inserted with None for missing fields
                    mock_insert.assert_called_once()
                    call_kwargs = mock_insert.call_args[1]
                    assert call_kwargs["soil_moisture"] == 45.2
                    assert call_kwargs["temperature"] is None
                    assert call_kwargs["humidity"] is None
                    assert call_kwargs["light_level"] is None


@pytest.mark.asyncio
class TestTelemetryAPI:
    """Test telemetry API endpoints."""

    async def test_get_plant_history(self, async_client):
        """Test GET /api/plants/{id}/history."""
        from src.db.connection import get_db

        # Mock database connection
        mock_db = AsyncMock()

        # Mock plant exists
        with patch("src.routers.plants.plant_repo.get_plant_by_id",
                  new=AsyncMock(return_value={"id": "plant-123", "name": "Test Plant"})):
            # Mock telemetry history
            now = datetime.now()
            mock_records = [
                {
                    "time": now,
                    "device_id": "device-123",
                    "plant_id": "plant-123",
                    "soil_moisture": 45.2,
                    "temperature": 22.5,
                    "humidity": 65.0,
                    "light_level": 800.0,
                }
            ]
            with patch("src.routers.plants.telemetry_repo.get_history",
                      new=AsyncMock(return_value=mock_records)):
                
                response = await async_client.get("/api/plants/plant-123/history?hours=24")

                assert response.status_code == 200
                data = response.json()
                assert "records" in data
                assert "count" in data
                assert data["count"] == 1
                assert len(data["records"]) == 1

    async def test_get_plant_history_not_found(self, async_client):
        """Test GET /api/plants/{id}/history for nonexistent plant."""
        with patch("src.routers.plants.plant_repo.get_plant_by_id",
                  new=AsyncMock(return_value=None)):
            
            response = await async_client.get("/api/plants/nonexistent/history")

            assert response.status_code == 404

    async def test_get_device_latest_telemetry(self, async_client):
        """Test GET /api/devices/{id}/telemetry/latest."""
        # Mock device exists
        with patch("src.routers.devices.device_repo.get_device_by_id",
                  new=AsyncMock(return_value={"id": "device-123"})):
            # Mock latest telemetry
            now = datetime.now()
            mock_record = {
                "time": now,
                "device_id": "device-123",
                "plant_id": "plant-456",
                "soil_moisture": 45.2,
                "temperature": 22.5,
                "humidity": 65.0,
                "light_level": 800.0,
            }
            with patch("src.routers.devices.telemetry_repo.get_latest_by_device",
                      new=AsyncMock(return_value=mock_record)):
                
                response = await async_client.get("/api/devices/device-123/telemetry/latest")

                assert response.status_code == 200
                data = response.json()
                assert data["device_id"] == "device-123"
                assert data["plant_id"] == "plant-456"
                assert data["soil_moisture"] == 45.2

    async def test_get_device_latest_telemetry_no_data(self, async_client):
        """Test GET /api/devices/{id}/telemetry/latest with no data."""
        # Mock device exists
        with patch("src.routers.devices.device_repo.get_device_by_id",
                  new=AsyncMock(return_value={"id": "device-123"})):
            # Mock no telemetry data
            with patch("src.routers.devices.telemetry_repo.get_latest_by_device",
                      new=AsyncMock(return_value=None)):
                
                response = await async_client.get("/api/devices/device-123/telemetry/latest")

                assert response.status_code == 404
                assert "No telemetry data" in response.json()["detail"]
