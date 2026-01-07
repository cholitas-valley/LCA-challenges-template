"""Tests for device-plant association endpoints."""
import pytest
from unittest.mock import AsyncMock, patch
from datetime import datetime
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_provision_device_to_plant(async_client: AsyncClient):
    """Test provisioning a device to a plant."""
    device_id = "device-123"
    plant_id = "plant-456"
    
    # Mock device and plant existence
    mock_device = {
        "id": device_id,
        "mac_address": "AA:BB:CC:DD:EE:FF",
        "mqtt_username": "device_user",
        "plant_id": None,
        "status": "provisioning",
        "firmware_version": "1.0.0",
        "sensor_types": ["temperature", "humidity"],
        "last_seen_at": None,
        "created_at": datetime.now(),
    }
    
    mock_plant = {
        "id": plant_id,
        "name": "Basil",
        "species": "Ocimum basilicum",
        "thresholds": None,
        "created_at": datetime.now(),
    }
    
    mock_updated_device = {
        **mock_device,
        "plant_id": plant_id,
        "status": "online",
    }
    
    with patch("src.routers.devices.device_repo.get_device_by_id", new=AsyncMock(return_value=mock_device)), \
         patch("src.routers.devices.plant_repo.get_plant_by_id", new=AsyncMock(return_value=mock_plant)), \
         patch("src.routers.devices.device_repo.assign_device_to_plant", new=AsyncMock(return_value=mock_updated_device)):
        
        response = await async_client.post(
            f"/api/devices/{device_id}/provision",
            json={"plant_id": plant_id}
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["id"] == device_id
        assert data["plant_id"] == plant_id
        assert data["status"] == "online"
        assert data["message"] == "Device provisioned successfully"


@pytest.mark.asyncio
async def test_provision_device_not_found(async_client: AsyncClient):
    """Test provisioning with invalid device ID."""
    device_id = "invalid-device"
    plant_id = "plant-456"
    
    with patch("src.routers.devices.device_repo.get_device_by_id", new=AsyncMock(return_value=None)):
        response = await async_client.post(
            f"/api/devices/{device_id}/provision",
            json={"plant_id": plant_id}
        )
        
        assert response.status_code == 404
        assert response.json()["detail"] == "Device not found"


@pytest.mark.asyncio
async def test_provision_plant_not_found(async_client: AsyncClient):
    """Test provisioning with invalid plant ID."""
    device_id = "device-123"
    plant_id = "invalid-plant"
    
    mock_device = {
        "id": device_id,
        "mac_address": "AA:BB:CC:DD:EE:FF",
        "status": "provisioning",
    }
    
    with patch("src.routers.devices.device_repo.get_device_by_id", new=AsyncMock(return_value=mock_device)), \
         patch("src.routers.devices.plant_repo.get_plant_by_id", new=AsyncMock(return_value=None)):
        
        response = await async_client.post(
            f"/api/devices/{device_id}/provision",
            json={"plant_id": plant_id}
        )
        
        assert response.status_code == 404
        assert response.json()["detail"] == "Plant not found"


@pytest.mark.asyncio
async def test_get_plant_devices(async_client: AsyncClient):
    """Test getting devices for a plant."""
    plant_id = "plant-456"
    
    mock_plant = {
        "id": plant_id,
        "name": "Basil",
        "species": "Ocimum basilicum",
        "thresholds": None,
        "created_at": datetime.now(),
    }
    
    mock_devices = [
        {
            "id": "device-1",
            "mac_address": "AA:BB:CC:DD:EE:FF",
            "mqtt_username": "device_user_1",
            "plant_id": plant_id,
            "status": "online",
            "firmware_version": "1.0.0",
            "sensor_types": ["temperature"],
            "last_seen_at": datetime.now(),
            "created_at": datetime.now(),
        },
        {
            "id": "device-2",
            "mac_address": "11:22:33:44:55:66",
            "mqtt_username": "device_user_2",
            "plant_id": plant_id,
            "status": "online",
            "firmware_version": "1.0.0",
            "sensor_types": ["humidity"],
            "last_seen_at": None,
            "created_at": datetime.now(),
        },
    ]
    
    with patch("src.routers.plants.plant_repo.get_plant_by_id", new=AsyncMock(return_value=mock_plant)), \
         patch("src.routers.plants.device_repo.get_devices_by_plant", new=AsyncMock(return_value=mock_devices)):
        
        response = await async_client.get(f"/api/plants/{plant_id}/devices")
        
        assert response.status_code == 200
        data = response.json()
        assert data["total"] == 2
        assert len(data["devices"]) == 2
        assert data["devices"][0]["id"] == "device-1"
        assert data["devices"][1]["id"] == "device-2"


@pytest.mark.asyncio
async def test_get_plant_devices_plant_not_found(async_client: AsyncClient):
    """Test getting devices for non-existent plant."""
    plant_id = "invalid-plant"
    
    with patch("src.routers.plants.plant_repo.get_plant_by_id", new=AsyncMock(return_value=None)):
        response = await async_client.get(f"/api/plants/{plant_id}/devices")
        
        assert response.status_code == 404
        assert response.json()["detail"] == "Plant not found"


@pytest.mark.asyncio
async def test_reassign_device_to_different_plant(async_client: AsyncClient):
    """Test reassigning a device from one plant to another."""
    device_id = "device-123"
    old_plant_id = "plant-456"
    new_plant_id = "plant-789"
    
    # Device currently assigned to old_plant_id
    mock_device = {
        "id": device_id,
        "mac_address": "AA:BB:CC:DD:EE:FF",
        "mqtt_username": "device_user",
        "plant_id": old_plant_id,
        "status": "online",
        "firmware_version": "1.0.0",
        "sensor_types": ["temperature"],
        "last_seen_at": datetime.now(),
        "created_at": datetime.now(),
    }
    
    mock_new_plant = {
        "id": new_plant_id,
        "name": "Tomato",
        "species": "Solanum lycopersicum",
        "thresholds": None,
        "created_at": datetime.now(),
    }
    
    mock_updated_device = {
        **mock_device,
        "plant_id": new_plant_id,
    }
    
    with patch("src.routers.devices.device_repo.get_device_by_id", new=AsyncMock(return_value=mock_device)), \
         patch("src.routers.devices.plant_repo.get_plant_by_id", new=AsyncMock(return_value=mock_new_plant)), \
         patch("src.routers.devices.device_repo.assign_device_to_plant", new=AsyncMock(return_value=mock_updated_device)):
        
        response = await async_client.post(
            f"/api/devices/{device_id}/provision",
            json={"plant_id": new_plant_id}
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["id"] == device_id
        assert data["plant_id"] == new_plant_id
        assert data["status"] == "online"


@pytest.mark.asyncio
async def test_unassign_device(async_client: AsyncClient):
    """Test unassigning a device from a plant."""
    device_id = "device-123"
    plant_id = "plant-456"
    
    mock_device = {
        "id": device_id,
        "mac_address": "AA:BB:CC:DD:EE:FF",
        "mqtt_username": "device_user",
        "plant_id": plant_id,
        "status": "online",
        "firmware_version": "1.0.0",
        "sensor_types": ["temperature"],
        "last_seen_at": datetime.now(),
        "created_at": datetime.now(),
    }
    
    mock_updated_device = {
        **mock_device,
        "plant_id": None,
    }
    
    with patch("src.routers.devices.device_repo.get_device_by_id", new=AsyncMock(return_value=mock_device)), \
         patch("src.routers.devices.device_repo.unassign_device", new=AsyncMock(return_value=mock_updated_device)):
        
        response = await async_client.post(f"/api/devices/{device_id}/unassign")
        
        assert response.status_code == 200
        data = response.json()
        assert data["message"] == "Device unassigned successfully"


@pytest.mark.asyncio
async def test_unassign_device_not_found(async_client: AsyncClient):
    """Test unassigning a non-existent device."""
    device_id = "invalid-device"
    
    with patch("src.routers.devices.device_repo.get_device_by_id", new=AsyncMock(return_value=None)):
        response = await async_client.post(f"/api/devices/{device_id}/unassign")
        
        assert response.status_code == 404
        assert response.json()["detail"] == "Device not found"
