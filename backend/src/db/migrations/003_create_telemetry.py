"""
Migration 003: Create telemetry table with TimescaleDB hypertable.
"""


async def up(conn):
    """
    Create the telemetry table and convert to hypertable if TimescaleDB is available.
    """
    await conn.execute("""
        CREATE TABLE IF NOT EXISTS telemetry (
            time TIMESTAMPTZ NOT NULL,
            device_id TEXT REFERENCES devices(id) ON DELETE CASCADE,
            plant_id TEXT REFERENCES plants(id) ON DELETE SET NULL,
            soil_moisture FLOAT,
            temperature FLOAT,
            humidity FLOAT,
            light_level FLOAT
        )
    """)
    
    # Try to create hypertable - gracefully handle if TimescaleDB is not installed
    try:
        await conn.execute("""
            SELECT create_hypertable('telemetry', 'time', if_not_exists => TRUE)
        """)
    except Exception as e:
        # Log but don't fail if TimescaleDB extension is not available
        print(f"Warning: Could not create TimescaleDB hypertable: {e}")
        print("Continuing without hypertable (telemetry will be a regular table)")
    
    await conn.execute("""
        CREATE INDEX IF NOT EXISTS idx_telemetry_device ON telemetry(device_id, time DESC)
    """)
    
    await conn.execute("""
        CREATE INDEX IF NOT EXISTS idx_telemetry_plant ON telemetry(plant_id, time DESC)
    """)
