"""
Migration 004: Create alerts table.
"""


async def up(conn):
    """
    Create the alerts table and index.
    """
    await conn.execute("""
        CREATE TABLE IF NOT EXISTS alerts (
            id SERIAL PRIMARY KEY,
            plant_id TEXT REFERENCES plants(id) ON DELETE CASCADE,
            device_id TEXT REFERENCES devices(id) ON DELETE CASCADE,
            metric TEXT NOT NULL,
            value FLOAT NOT NULL,
            threshold FLOAT NOT NULL,
            direction TEXT NOT NULL,
            sent_at TIMESTAMPTZ DEFAULT NOW()
        )
    """)
    
    await conn.execute("""
        CREATE INDEX IF NOT EXISTS idx_alerts_plant ON alerts(plant_id, sent_at DESC)
    """)
