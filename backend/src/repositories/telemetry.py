"""Telemetry repository for database operations."""
from datetime import datetime, timedelta

import asyncpg


async def insert_telemetry(
    conn: asyncpg.Connection,
    time: datetime,
    device_id: str,
    plant_id: str | None,
    soil_moisture: float | None = None,
    temperature: float | None = None,
    humidity: float | None = None,
    light_level: float | None = None,
) -> None:
    """
    Insert telemetry record into database.
    
    Args:
        conn: Database connection
        time: Timestamp of the reading
        device_id: Device ID that sent the telemetry
        plant_id: Plant ID (nullable for unassigned devices)
        soil_moisture: Soil moisture reading
        temperature: Temperature reading
        humidity: Humidity reading
        light_level: Light level reading
    """
    await conn.execute(
        """
        INSERT INTO telemetry (
            time, device_id, plant_id,
            soil_moisture, temperature, humidity, light_level
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        """,
        time,
        device_id,
        plant_id,
        soil_moisture,
        temperature,
        humidity,
        light_level,
    )


async def get_latest_by_device(
    conn: asyncpg.Connection,
    device_id: str,
) -> dict | None:
    """
    Get the most recent telemetry reading for a device.
    
    Args:
        conn: Database connection
        device_id: Device ID
        
    Returns:
        Telemetry record as dict or None if no readings exist
    """
    row = await conn.fetchrow(
        """
        SELECT time, device_id, plant_id,
               soil_moisture, temperature, humidity, light_level
        FROM telemetry
        WHERE device_id = $1
        ORDER BY time DESC
        LIMIT 1
        """,
        device_id,
    )
    return dict(row) if row else None


async def get_latest_by_plant(
    conn: asyncpg.Connection,
    plant_id: str,
) -> dict | None:
    """
    Get the most recent telemetry reading for a plant.
    
    Args:
        conn: Database connection
        plant_id: Plant ID
        
    Returns:
        Telemetry record as dict or None if no readings exist
    """
    row = await conn.fetchrow(
        """
        SELECT time, device_id, plant_id,
               soil_moisture, temperature, humidity, light_level
        FROM telemetry
        WHERE plant_id = $1
        ORDER BY time DESC
        LIMIT 1
        """,
        plant_id,
    )
    return dict(row) if row else None


async def get_history(
    conn: asyncpg.Connection,
    plant_id: str,
    start_time: datetime | None = None,
    end_time: datetime | None = None,
    limit: int = 1000,
) -> list[dict]:
    """
    Get telemetry history for a plant within a time range.
    
    Args:
        conn: Database connection
        plant_id: Plant ID
        start_time: Start of time range (defaults to 24 hours ago)
        end_time: End of time range (defaults to now)
        limit: Maximum number of records to return
        
    Returns:
        List of telemetry records as dicts, ordered by time DESC
    """
    if end_time is None:
        end_time = datetime.now()
    if start_time is None:
        start_time = end_time - timedelta(hours=24)
    
    rows = await conn.fetch(
        """
        SELECT time, device_id, plant_id,
               soil_moisture, temperature, humidity, light_level
        FROM telemetry
        WHERE plant_id = $1
          AND time >= $2
          AND time <= $3
        ORDER BY time DESC
        LIMIT $4
        """,
        plant_id,
        start_time,
        end_time,
        limit,
    )
    
    return [dict(row) for row in rows]
