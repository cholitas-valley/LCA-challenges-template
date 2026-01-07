"""Tests for device registration and management endpoints."""
from datetime import datetime
from unittest.mock import AsyncMock, patch

import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_register_new_device(async_client: AsyncClient):
    """Test registering a new device returns credentials."""
    # Mock the database repository functions and MQTT auth
    with patch("src.repositories.device.get_device_by_mac") as mock_get_by_mac, \
         patch("src.repositories.device.create_device") as mock_create, \
         patch("src.routers.devices.mqtt_auth") as mock_mqtt:

        # No existing device
        mock_get_by_mac.return_value = None

        # Mock create device to return None (we just need it to not fail)
        mock_create.return_value = None

        # Mock MQTT auth service
        mock_mqtt.generate_credentials.return_value = ("device_test123", "test_password_xyz")

        response = await async_client.post(
            "/api/devices/register",
            json={
                "mac_address": "AA:BB:CC:DD:EE:FF",
                "firmware_version": "1.0.0",
                "sensor_types": ["temperature", "humidity"],
            },
        )

        assert response.status_code == 200
        data = response.json()

        # Check response structure
        assert "device_id" in data
        assert "mqtt_username" in data
        assert "mqtt_password" in data
        assert "mqtt_host" in data
        assert "mqtt_port" in data

        # Check MQTT credentials
        assert data["mqtt_username"].startswith("device_")
        assert len(data["mqtt_password"]) > 0
        assert data["mqtt_password"] != "<stored_securely>"  # Should be plaintext on registration

        # Verify MQTT user was added
        mock_mqtt.add_user.assert_called_once()


@pytest.mark.asyncio
async def test_register_same_mac_returns_same_device(async_client: AsyncClient):
    """Test that registering the same MAC address is idempotent."""
    mac = "11:22:33:44:55:66"

    with patch("src.repositories.device.get_device_by_mac") as mock_get_by_mac, \
         patch("src.repositories.device.create_device") as mock_create, \
         patch("src.routers.devices.mqtt_auth") as mock_mqtt:

        # First registration - no existing device
        mock_get_by_mac.return_value = None
        mock_create.return_value = None
        mock_mqtt.generate_credentials.return_value = ("device_abc123", "secret_pass")

        response1 = await async_client.post(
            "/api/devices/register",
            json={"mac_address": mac},
        )
        assert response1.status_code == 200
        data1 = response1.json()
        device_id1 = data1["device_id"]
        username1 = data1["mqtt_username"]

        # Second registration with same MAC - return existing device
        mock_get_by_mac.return_value = {
            "id": device_id1,
            "mac_address": mac,
            "mqtt_username": username1,
            "mqtt_password_hash": "hashed",
            "status": "provisioning",
            "firmware_version": None,
            "sensor_types": None,
            "plant_id": None,
            "last_seen_at": None,
            "created_at": datetime.now(),
        }

        response2 = await async_client.post(
            "/api/devices/register",
            json={"mac_address": mac},
        )
        assert response2.status_code == 200
        data2 = response2.json()

        # Should return same device
        assert data2["device_id"] == device_id1
        assert data2["mqtt_username"] == username1
        # Note: password will be "<stored_securely>" on subsequent requests
        assert data2["mqtt_password"] == "<stored_securely>"


@pytest.mark.asyncio
async def test_list_devices_returns_list_with_total(async_client: AsyncClient):
    """Test listing devices returns proper list with total count."""
    with patch("src.repositories.device.list_devices") as mock_list:
        # Mock return value with 2 devices
        mock_list.return_value = (
            [
                {
                    "id": "device-1",
                    "mac_address": "AA:BB:CC:DD:EE:01",
                    "mqtt_username": "device_01",
                    "status": "provisioning",
                    "firmware_version": None,
                    "sensor_types": None,
                    "plant_id": None,
                    "last_seen_at": None,
                    "created_at": datetime.now(),
                },
                {
                    "id": "device-2",
                    "mac_address": "AA:BB:CC:DD:EE:02",
                    "mqtt_username": "device_02",
                    "status": "provisioning",
                    "firmware_version": None,
                    "sensor_types": None,
                    "plant_id": None,
                    "last_seen_at": None,
                    "created_at": datetime.now(),
                },
            ],
            2,
        )

        # List devices
        response = await async_client.get("/api/devices")
        assert response.status_code == 200

        data = response.json()
        assert "devices" in data
        assert "total" in data
        assert data["total"] == 2
        assert len(data["devices"]) == 2

        # Check device structure
        device = data["devices"][0]
        assert "id" in device
        assert "mac_address" in device
        assert "mqtt_username" in device
        assert "status" in device
        assert device["status"] == "provisioning"


@pytest.mark.asyncio
async def test_list_devices_pagination(async_client: AsyncClient):
    """Test listing devices with pagination parameters."""
    with patch("src.repositories.device.list_devices") as mock_list:
        # Mock first page (2 of 3 devices)
        mock_list.return_value = (
            [
                {
                    "id": "device-1",
                    "mac_address": "AA:BB:CC:DD:EE:01",
                    "mqtt_username": "device_01",
                    "status": "provisioning",
                    "firmware_version": None,
                    "sensor_types": None,
                    "plant_id": None,
                    "last_seen_at": None,
                    "created_at": datetime.now(),
                },
                {
                    "id": "device-2",
                    "mac_address": "AA:BB:CC:DD:EE:02",
                    "mqtt_username": "device_02",
                    "status": "provisioning",
                    "firmware_version": None,
                    "sensor_types": None,
                    "plant_id": None,
                    "last_seen_at": None,
                    "created_at": datetime.now(),
                },
            ],
            3,
        )

        # Get first page
        response = await async_client.get("/api/devices?limit=2&offset=0")
        assert response.status_code == 200
        data = response.json()
        assert data["total"] == 3
        assert len(data["devices"]) == 2

        # Mock second page (1 device)
        mock_list.return_value = (
            [
                {
                    "id": "device-3",
                    "mac_address": "AA:BB:CC:DD:EE:03",
                    "mqtt_username": "device_03",
                    "status": "provisioning",
                    "firmware_version": None,
                    "sensor_types": None,
                    "plant_id": None,
                    "last_seen_at": None,
                    "created_at": datetime.now(),
                },
            ],
            3,
        )

        # Get second page
        response = await async_client.get("/api/devices?limit=2&offset=2")
        assert response.status_code == 200
        data = response.json()
        assert data["total"] == 3
        assert len(data["devices"]) == 1


@pytest.mark.asyncio
async def test_delete_device_removes_it(async_client: AsyncClient):
    """Test deleting a device removes it from the list."""
    with patch("src.repositories.device.get_device_by_id") as mock_get, \
         patch("src.repositories.device.delete_device") as mock_delete, \
         patch("src.routers.devices.mqtt_auth") as mock_mqtt:
        # Mock device exists
        mock_get.return_value = {
            "id": "test-device-id",
            "mqtt_username": "device_test123"
        }
        # Mock successful deletion
        mock_delete.return_value = True

        # Delete the device
        response = await async_client.delete("/api/devices/test-device-id")
        assert response.status_code == 200

        # Verify delete was called
        mock_delete.assert_called_once()
        # Verify MQTT user was removed
        mock_mqtt.remove_user.assert_called_once_with("device_test123")


@pytest.mark.asyncio
async def test_delete_nonexistent_device_returns_404(async_client: AsyncClient):
    """Test deleting a nonexistent device returns 404."""
    with patch("src.repositories.device.get_device_by_id") as mock_get:
        # Mock device not found
        mock_get.return_value = None

        response = await async_client.delete("/api/devices/nonexistent-id")
        assert response.status_code == 404
