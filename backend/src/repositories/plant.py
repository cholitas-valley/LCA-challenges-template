"""Plant repository for database operations."""
from datetime import datetime
import json

import asyncpg


async def create_plant(
    conn: asyncpg.Connection,
    plant_id: str,
    name: str,
    species: str | None = None,
    thresholds: dict | None = None,
) -> dict:
    """
    Create a new plant in the database.
    
    Args:
        conn: Database connection
        plant_id: Unique plant ID (UUID)
        name: Plant name
        species: Plant species
        thresholds: Threshold configuration as dict
        
    Returns:
        Plant record as dict
    """
    # Convert thresholds dict to JSONB
    thresholds_json = json.dumps(thresholds) if thresholds else None
    
    row = await conn.fetchrow(
        """
        INSERT INTO plants (id, name, species, thresholds, created_at)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING *
        """,
        plant_id,
        name,
        species,
        thresholds_json,
        datetime.now(),
    )
    return dict(row)


async def get_plant_by_id(conn: asyncpg.Connection, plant_id: str) -> dict | None:
    """
    Get plant by ID.
    
    Args:
        conn: Database connection
        plant_id: Plant ID
        
    Returns:
        Plant record as dict or None if not found
    """
    row = await conn.fetchrow(
        "SELECT * FROM plants WHERE id = $1",
        plant_id,
    )
    return dict(row) if row else None


async def list_plants(
    conn: asyncpg.Connection,
    limit: int = 100,
    offset: int = 0,
) -> tuple[list[dict], int]:
    """
    List plants with pagination.
    
    Args:
        conn: Database connection
        limit: Maximum number of plants to return
        offset: Number of plants to skip
        
    Returns:
        Tuple of (list of plant dicts, total count)
    """
    # Get total count
    total = await conn.fetchval("SELECT COUNT(*) FROM plants")
    
    # Get paginated plants
    rows = await conn.fetch(
        """
        SELECT * FROM plants
        ORDER BY created_at DESC
        LIMIT $1 OFFSET $2
        """,
        limit,
        offset,
    )
    
    plants = [dict(row) for row in rows]
    return plants, total


async def update_plant(
    conn: asyncpg.Connection,
    plant_id: str,
    name: str | None = None,
    species: str | None = None,
    thresholds: dict | None = None,
) -> dict | None:
    """
    Update plant fields.
    
    Args:
        conn: Database connection
        plant_id: Plant ID
        name: New name (if provided)
        species: New species (if provided)
        thresholds: New thresholds (if provided)
        
    Returns:
        Updated plant record as dict or None if not found
    """
    # Build dynamic UPDATE query based on provided fields
    updates = []
    params = []
    param_count = 1
    
    if name is not None:
        updates.append(f"name = ${param_count}")
        params.append(name)
        param_count += 1
    
    if species is not None:
        updates.append(f"species = ${param_count}")
        params.append(species)
        param_count += 1
    
    if thresholds is not None:
        updates.append(f"thresholds = ${param_count}")
        params.append(json.dumps(thresholds))
        param_count += 1
    
    if not updates:
        # No fields to update, just return current plant
        return await get_plant_by_id(conn, plant_id)
    
    # Add plant_id as last parameter
    params.append(plant_id)
    
    query = f"""
        UPDATE plants
        SET {', '.join(updates)}
        WHERE id = ${param_count}
        RETURNING *
    """
    
    row = await conn.fetchrow(query, *params)
    return dict(row) if row else None


async def delete_plant(conn: asyncpg.Connection, plant_id: str) -> bool:
    """
    Delete plant by ID. Also unassigns all devices from this plant.
    
    Args:
        conn: Database connection
        plant_id: Plant ID
        
    Returns:
        True if plant was deleted, False if not found
    """
    # First, unassign all devices from this plant
    await conn.execute(
        "UPDATE devices SET plant_id = NULL WHERE plant_id = $1",
        plant_id,
    )
    
    # Then delete the plant
    result = await conn.execute(
        "DELETE FROM plants WHERE id = $1",
        plant_id,
    )
    # result is like "DELETE 1" or "DELETE 0"
    return result.split()[-1] == "1"


async def get_plant_device_count(conn: asyncpg.Connection, plant_id: str) -> int:
    """
    Get count of devices assigned to a plant.
    
    Args:
        conn: Database connection
        plant_id: Plant ID
        
    Returns:
        Number of devices assigned to this plant
    """
    count = await conn.fetchval(
        "SELECT COUNT(*) FROM devices WHERE plant_id = $1",
        plant_id,
    )
    return count or 0
