"""
Migration 005: Create settings table.
"""


async def up(conn):
    """
    Create the settings table for storing key-value configuration.
    """
    await conn.execute("""
        CREATE TABLE IF NOT EXISTS settings (
            key TEXT PRIMARY KEY,
            value TEXT NOT NULL,
            updated_at TIMESTAMPTZ DEFAULT NOW()
        )
    """)
