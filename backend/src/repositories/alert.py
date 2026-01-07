"""Alert repository for database operations."""
from datetime import datetime

import asyncpg


async def create_alert(
    conn: asyncpg.Connection,
    plant_id: str,
    device_id: str,
    metric: str,
    value: float,
    threshold: float,
    direction: str,
) -> dict:
    """
    Create a new alert in the database.
    
    Args:
        conn: Database connection
        plant_id: Plant ID
        device_id: Device ID
        metric: Metric name (soil_moisture, temperature, humidity, light_level)
        value: Actual value that triggered the alert
        threshold: Threshold value that was violated
        direction: 'min' or 'max'
        
    Returns:
        Alert record as dict
    """
    row = await conn.fetchrow(
        """
        INSERT INTO alerts (plant_id, device_id, metric, value, threshold, direction, sent_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING *
        """,
        plant_id,
        device_id,
        metric,
        value,
        threshold,
        direction,
        datetime.now(),
    )
    return dict(row)


async def get_latest_alert(
    conn: asyncpg.Connection,
    plant_id: str,
    metric: str,
) -> dict | None:
    """
    Get the latest alert for a specific plant and metric.
    Used for cooldown checks.
    
    Args:
        conn: Database connection
        plant_id: Plant ID
        metric: Metric name
        
    Returns:
        Alert record as dict or None if no alert found
    """
    row = await conn.fetchrow(
        """
        SELECT * FROM alerts
        WHERE plant_id = $1 AND metric = $2
        ORDER BY sent_at DESC
        LIMIT 1
        """,
        plant_id,
        metric,
    )
    return dict(row) if row else None


async def list_alerts(
    conn: asyncpg.Connection,
    plant_id: str,
    limit: int = 50,
) -> list[dict]:
    """
    List alerts for a plant.
    
    Args:
        conn: Database connection
        plant_id: Plant ID
        limit: Maximum number of alerts to return
        
    Returns:
        List of alert dicts
    """
    rows = await conn.fetch(
        """
        SELECT * FROM alerts
        WHERE plant_id = $1
        ORDER BY sent_at DESC
        LIMIT $2
        """,
        plant_id,
        limit,
    )
    return [dict(row) for row in rows]
