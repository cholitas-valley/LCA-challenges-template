"""
Migration 007: Add position column to plants table.
"""


async def up(conn):
    """
    Add position JSONB column for designer coordinates.
    """
    await conn.execute("""
        ALTER TABLE plants ADD COLUMN IF NOT EXISTS position JSONB
    """)
