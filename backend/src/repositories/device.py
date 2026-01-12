"""Device repository for database operations."""
from datetime import datetime, timedelta

import asyncpg


async def create_device(
    conn: asyncpg.Connection,
    device_id: str,
    mac_address: str,
    mqtt_username: str,
    mqtt_password_hash: str,
    firmware_version: str | None = None,
    sensor_types: list[str] | None = None,
) -> dict:
    """
    Create a new device in the database.
    
    Args:
        conn: Database connection
        device_id: Unique device ID (UUID)
        mac_address: Device MAC address
        mqtt_username: MQTT username
        mqtt_password_hash: Bcrypt hash of MQTT password
        firmware_version: Device firmware version
        sensor_types: List of sensor types
        
    Returns:
        Device record as dict
    """
    row = await conn.fetchrow(
        """
        INSERT INTO devices (
            id, mac_address, mqtt_username, mqtt_password_hash,
            firmware_version, sensor_types, status, created_at
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING *
        """,
        device_id,
        mac_address,
        mqtt_username,
        mqtt_password_hash,
        firmware_version,
        sensor_types,
        "provisioning",
        datetime.now(),
    )
    return dict(row)


async def get_device_by_id(conn: asyncpg.Connection, device_id: str) -> dict | None:
    """
    Get device by ID.
    
    Args:
        conn: Database connection
        device_id: Device ID
        
    Returns:
        Device record as dict or None if not found
    """
    row = await conn.fetchrow(
        "SELECT * FROM devices WHERE id = $1",
        device_id,
    )
    return dict(row) if row else None


async def get_device_by_mac(conn: asyncpg.Connection, mac_address: str) -> dict | None:
    """
    Get device by MAC address.
    
    Args:
        conn: Database connection
        mac_address: MAC address
        
    Returns:
        Device record as dict or None if not found
    """
    row = await conn.fetchrow(
        "SELECT * FROM devices WHERE mac_address = $1",
        mac_address,
    )
    return dict(row) if row else None


async def list_devices(
    conn: asyncpg.Connection,
    limit: int = 100,
    offset: int = 0,
) -> tuple[list[dict], int]:
    """
    List devices with pagination.
    
    Args:
        conn: Database connection
        limit: Maximum number of devices to return
        offset: Number of devices to skip
        
    Returns:
        Tuple of (list of device dicts, total count)
    """
    # Get total count
    total = await conn.fetchval("SELECT COUNT(*) FROM devices")
    
    # Get paginated devices
    rows = await conn.fetch(
        """
        SELECT * FROM devices
        ORDER BY created_at DESC
        LIMIT $1 OFFSET $2
        """,
        limit,
        offset,
    )
    
    devices = [dict(row) for row in rows]
    return devices, total


async def delete_device(conn: asyncpg.Connection, device_id: str) -> bool:
    """
    Delete device by ID.

    Args:
        conn: Database connection
        device_id: Device ID

    Returns:
        True if device was deleted, False if not found
    """
    result = await conn.execute(
        "DELETE FROM devices WHERE id = $1",
        device_id,
    )
    # result is like "DELETE 1" or "DELETE 0"
    return result.split()[-1] == "1"


async def assign_device_to_plant(
    conn: asyncpg.Connection,
    device_id: str,
    plant_id: str,
) -> dict | None:
    """
    Assign device to a plant and update status to 'online'.

    Args:
        conn: Database connection
        device_id: Device ID
        plant_id: Plant ID

    Returns:
        Updated device record as dict or None if not found
    """
    row = await conn.fetchrow(
        """
        UPDATE devices
        SET plant_id = $1, status = 'online'
        WHERE id = $2
        RETURNING *
        """,
        plant_id,
        device_id,
    )
    return dict(row) if row else None


async def unassign_device(conn: asyncpg.Connection, device_id: str) -> dict | None:
    """
    Remove device from plant (set plant_id to NULL).

    Args:
        conn: Database connection
        device_id: Device ID

    Returns:
        Updated device record as dict or None if not found
    """
    row = await conn.fetchrow(
        """
        UPDATE devices
        SET plant_id = NULL
        WHERE id = $1
        RETURNING *
        """,
        device_id,
    )
    return dict(row) if row else None


async def get_devices_by_plant(
    conn: asyncpg.Connection,
    plant_id: str,
) -> list[dict]:
    """
    Get all devices assigned to a plant.

    Args:
        conn: Database connection
        plant_id: Plant ID

    Returns:
        List of device records as dicts
    """
    rows = await conn.fetch(
        """
        SELECT * FROM devices
        WHERE plant_id = $1
        ORDER BY created_at DESC
        """,
        plant_id,
    )
    return [dict(row) for row in rows]


async def update_last_seen(
    conn: asyncpg.Connection,
    device_id: str,
    timestamp: datetime,
) -> dict | None:
    """
    Update device last_seen_at timestamp and set status to 'online'.

    Args:
        conn: Database connection
        device_id: Device ID
        timestamp: Timestamp to set for last_seen_at

    Returns:
        Updated device record as dict or None if not found
    """
    row = await conn.fetchrow(
        """
        UPDATE devices
        SET last_seen_at = $1, status = 'online'
        WHERE id = $2
        RETURNING *
        """,
        timestamp,
        device_id,
    )
    return dict(row) if row else None


async def get_stale_devices(
    conn: asyncpg.Connection,
    threshold_seconds: int,
) -> list[str]:
    """
    Get device IDs that haven't been seen within threshold_seconds.

    Only considers devices with status 'online' to avoid repeatedly marking
    already-offline devices.

    Args:
        conn: Database connection
        threshold_seconds: Number of seconds without activity to consider stale

    Returns:
        List of device IDs that are stale
    """
    cutoff_time = datetime.now() - timedelta(seconds=threshold_seconds)

    rows = await conn.fetch(
        """
        SELECT id FROM devices
        WHERE status = 'online'
          AND last_seen_at IS NOT NULL
          AND last_seen_at < $1
        """,
        cutoff_time,
    )
    return [row["id"] for row in rows]


async def mark_devices_offline(
    conn: asyncpg.Connection,
    device_ids: list[str],
) -> int:
    """
    Mark multiple devices as offline.

    Args:
        conn: Database connection
        device_ids: List of device IDs to mark offline

    Returns:
        Number of devices updated
    """
    if not device_ids:
        return 0

    result = await conn.execute(
        """
        UPDATE devices
        SET status = 'offline'
        WHERE id = ANY($1::text[])
        """,
        device_ids,
    )
    # result is like "UPDATE 3"
    return int(result.split()[-1])
