"""
Migration 001: Create plants table.
"""


async def up(conn):
    """
    Create the plants table.
    """
    await conn.execute("""
        CREATE TABLE IF NOT EXISTS plants (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            species TEXT,
            thresholds JSONB,
            created_at TIMESTAMPTZ DEFAULT NOW()
        )
    """)
