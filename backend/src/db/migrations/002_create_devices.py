"""
Migration 002: Create devices table with indexes.
"""


async def up(conn):
    """
    Create the devices table and indexes.
    """
    await conn.execute("""
        CREATE TABLE IF NOT EXISTS devices (
            id TEXT PRIMARY KEY,
            mac_address TEXT UNIQUE,
            mqtt_username TEXT UNIQUE,
            mqtt_password_hash TEXT NOT NULL,
            plant_id TEXT REFERENCES plants(id) ON DELETE SET NULL,
            status TEXT DEFAULT 'provisioning',
            firmware_version TEXT,
            sensor_types JSONB,
            last_seen_at TIMESTAMPTZ,
            created_at TIMESTAMPTZ DEFAULT NOW()
        )
    """)
    
    await conn.execute("""
        CREATE INDEX IF NOT EXISTS idx_devices_plant_id ON devices(plant_id)
    """)
    
    await conn.execute("""
        CREATE INDEX IF NOT EXISTS idx_devices_status ON devices(status)
    """)
