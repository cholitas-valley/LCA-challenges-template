"""Tests for heartbeat handling and offline device detection."""
import asyncio
from datetime import datetime, timedelta
from unittest.mock import AsyncMock, MagicMock, patch

import pytest

from src.repositories import device as device_repo
from src.services.heartbeat_handler import HeartbeatHandler


class AsyncContextManagerMock:
    """Mock for async context managers (like pool.acquire())."""

    def __init__(self, conn_mock):
        self.conn_mock = conn_mock

    async def __aenter__(self):
        return self.conn_mock

    async def __aexit__(self, exc_type, exc_val, exc_tb):
        pass


@pytest.mark.asyncio
async def test_update_last_seen():
    """Test updating device last_seen_at."""
    conn_mock = AsyncMock()
    device_id = "device-123"
    now = datetime.now()

    # Mock the database update
    conn_mock.fetchrow.return_value = {
        "id": device_id,
        "last_seen_at": now,
        "status": "online",
        "mac_address": "AA:BB:CC:DD:EE:FF",
        "mqtt_username": "device_123",
        "mqtt_password_hash": "hash",
        "plant_id": None,
        "firmware_version": "1.0.0",
        "sensor_types": None,
        "created_at": now,
    }

    result = await device_repo.update_last_seen(conn_mock, device_id, now)

    assert result is not None
    assert result["id"] == device_id
    assert result["last_seen_at"] == now
    assert result["status"] == "online"

    # Verify SQL was called with correct parameters
    conn_mock.fetchrow.assert_called_once()
    call_args = conn_mock.fetchrow.call_args[0]
    assert "UPDATE devices" in call_args[0]
    assert call_args[1] == now
    assert call_args[2] == device_id


@pytest.mark.asyncio
async def test_get_stale_devices():
    """Test finding stale devices."""
    conn_mock = AsyncMock()
    threshold_seconds = 180

    # Mock devices that are stale
    stale_time = datetime.now() - timedelta(seconds=200)
    conn_mock.fetch.return_value = [
        {"id": "device-1"},
        {"id": "device-2"},
    ]

    result = await device_repo.get_stale_devices(conn_mock, threshold_seconds)

    assert len(result) == 2
    assert "device-1" in result
    assert "device-2" in result

    # Verify SQL was called
    conn_mock.fetch.assert_called_once()
    call_args = conn_mock.fetch.call_args[0]
    assert "SELECT id FROM devices" in call_args[0]
    assert "status = 'online'" in call_args[0]
    assert "last_seen_at < $1" in call_args[0]


@pytest.mark.asyncio
async def test_get_stale_devices_empty():
    """Test finding stale devices when none exist."""
    conn_mock = AsyncMock()
    threshold_seconds = 180

    # No stale devices
    conn_mock.fetch.return_value = []

    result = await device_repo.get_stale_devices(conn_mock, threshold_seconds)

    assert len(result) == 0


@pytest.mark.asyncio
async def test_mark_devices_offline():
    """Test marking devices offline."""
    conn_mock = AsyncMock()
    device_ids = ["device-1", "device-2", "device-3"]

    # Mock the update result
    conn_mock.execute.return_value = "UPDATE 3"

    result = await device_repo.mark_devices_offline(conn_mock, device_ids)

    assert result == 3

    # Verify SQL was called
    conn_mock.execute.assert_called_once()
    call_args = conn_mock.execute.call_args[0]
    assert "UPDATE devices" in call_args[0]
    assert "SET status = 'offline'" in call_args[0]
    assert call_args[1] == device_ids


@pytest.mark.asyncio
async def test_mark_devices_offline_empty_list():
    """Test marking devices offline with empty list."""
    conn_mock = AsyncMock()

    result = await device_repo.mark_devices_offline(conn_mock, [])

    assert result == 0
    conn_mock.execute.assert_not_called()


@pytest.mark.asyncio
async def test_heartbeat_handler_updates_last_seen():
    """Test heartbeat handler updates last_seen_at."""
    handler = HeartbeatHandler()
    device_id = "device-123"
    payload = {"timestamp": "2026-01-07T12:00:00Z", "uptime_seconds": 3600}

    # Mock pool and connection
    pool_mock = MagicMock()
    conn_mock = AsyncMock()
    pool_mock.acquire.return_value = AsyncContextManagerMock(conn_mock)

    # Mock device lookup
    conn_mock.fetchrow.side_effect = [
        # First call: get_device_by_id
        {
            "id": device_id,
            "mac_address": "AA:BB:CC:DD:EE:FF",
            "status": "provisioning",
        },
        # Second call: update_last_seen
        {
            "id": device_id,
            "last_seen_at": datetime.now(),
            "status": "online",
        },
    ]

    with patch("src.services.heartbeat_handler.get_pool", return_value=pool_mock):
        await handler.handle_heartbeat(device_id, payload)

    # Verify fetchrow was called twice (lookup + update)
    assert conn_mock.fetchrow.call_count == 2


@pytest.mark.asyncio
async def test_heartbeat_handler_unknown_device():
    """Test heartbeat handler with unknown device."""
    handler = HeartbeatHandler()
    device_id = "unknown-device"
    payload = {}

    # Mock pool and connection
    pool_mock = MagicMock()
    conn_mock = AsyncMock()
    pool_mock.acquire.return_value = AsyncContextManagerMock(conn_mock)

    # Mock device not found
    conn_mock.fetchrow.return_value = None

    with patch("src.services.heartbeat_handler.get_pool", return_value=pool_mock):
        # Should not raise, just log warning
        await handler.handle_heartbeat(device_id, payload)

    # Only one call (lookup), no update
    assert conn_mock.fetchrow.call_count == 1


@pytest.mark.asyncio
async def test_check_offline_devices():
    """Test checking for offline devices."""
    handler = HeartbeatHandler(timeout_seconds=180)

    # Mock pool and connection
    pool_mock = MagicMock()
    conn_mock = AsyncMock()
    pool_mock.acquire.return_value = AsyncContextManagerMock(conn_mock)

    # Mock stale devices
    conn_mock.fetch.return_value = [
        {"id": "device-1"},
        {"id": "device-2"},
    ]
    conn_mock.execute.return_value = "UPDATE 2"

    with patch("src.services.heartbeat_handler.get_pool", return_value=pool_mock):
        result = await handler.check_offline_devices()

    assert len(result) == 2
    assert "device-1" in result
    assert "device-2" in result

    # Verify fetch and execute were called
    conn_mock.fetch.assert_called_once()
    conn_mock.execute.assert_called_once()


@pytest.mark.asyncio
async def test_check_offline_devices_none_stale():
    """Test checking for offline devices when none are stale."""
    handler = HeartbeatHandler(timeout_seconds=180)

    # Mock pool and connection
    pool_mock = MagicMock()
    conn_mock = AsyncMock()
    pool_mock.acquire.return_value = AsyncContextManagerMock(conn_mock)

    # No stale devices
    conn_mock.fetch.return_value = []

    with patch("src.services.heartbeat_handler.get_pool", return_value=pool_mock):
        result = await handler.check_offline_devices()

    assert len(result) == 0

    # Verify fetch was called but not execute
    conn_mock.fetch.assert_called_once()
    conn_mock.execute.assert_not_called()


@pytest.mark.asyncio
async def test_heartbeat_sets_status_online():
    """Test that heartbeat sets device status to online."""
    handler = HeartbeatHandler()
    device_id = "device-123"
    payload = {}

    # Mock pool and connection
    pool_mock = MagicMock()
    conn_mock = AsyncMock()
    pool_mock.acquire.return_value = AsyncContextManagerMock(conn_mock)

    # Mock device that was offline
    conn_mock.fetchrow.side_effect = [
        # get_device_by_id
        {
            "id": device_id,
            "mac_address": "AA:BB:CC:DD:EE:FF",
            "status": "offline",
        },
        # update_last_seen - now online
        {
            "id": device_id,
            "last_seen_at": datetime.now(),
            "status": "online",
        },
    ]

    with patch("src.services.heartbeat_handler.get_pool", return_value=pool_mock):
        await handler.handle_heartbeat(device_id, payload)

    # Verify update was called
    assert conn_mock.fetchrow.call_count == 2
    # Second call should be update with status='online'
    update_call = conn_mock.fetchrow.call_args_list[1]
    assert "status = 'online'" in update_call[0][0]


@pytest.mark.asyncio
async def test_multiple_offline_devices_handled():
    """Test that multiple offline devices are handled correctly."""
    handler = HeartbeatHandler(timeout_seconds=180)

    # Mock pool and connection
    pool_mock = MagicMock()
    conn_mock = AsyncMock()
    pool_mock.acquire.return_value = AsyncContextManagerMock(conn_mock)

    # Mock 5 stale devices
    conn_mock.fetch.return_value = [
        {"id": f"device-{i}"} for i in range(1, 6)
    ]
    conn_mock.execute.return_value = "UPDATE 5"

    with patch("src.services.heartbeat_handler.get_pool", return_value=pool_mock):
        result = await handler.check_offline_devices()

    assert len(result) == 5
    for i in range(1, 6):
        assert f"device-{i}" in result


@pytest.mark.asyncio
async def test_configurable_timeout():
    """Test that timeout is configurable."""
    # Custom timeout of 300 seconds
    handler = HeartbeatHandler(timeout_seconds=300)

    assert handler.timeout_seconds == 300

    # Default timeout
    default_handler = HeartbeatHandler()
    assert default_handler.timeout_seconds == 180
