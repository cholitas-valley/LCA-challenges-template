"""Settings repository for database operations."""
from datetime import datetime

import asyncpg


async def get_setting(conn: asyncpg.Connection, key: str) -> str | None:
    """
    Get setting value by key.

    Args:
        conn: Database connection
        key: Setting key

    Returns:
        Setting value as string or None if not found
    """
    row = await conn.fetchrow(
        "SELECT value FROM settings WHERE key = $1",
        key,
    )
    return row["value"] if row else None


async def set_setting(conn: asyncpg.Connection, key: str, value: str) -> None:
    """
    Set setting value (insert or update).

    Args:
        conn: Database connection
        key: Setting key
        value: Setting value
    """
    await conn.execute(
        """
        INSERT INTO settings (key, value, updated_at)
        VALUES ($1, $2, $3)
        ON CONFLICT (key) DO UPDATE
        SET value = $2, updated_at = $3
        """,
        key,
        value,
        datetime.now(),
    )


async def delete_setting(conn: asyncpg.Connection, key: str) -> None:
    """
    Delete setting by key.

    Args:
        conn: Database connection
        key: Setting key
    """
    await conn.execute(
        "DELETE FROM settings WHERE key = $1",
        key,
    )


async def get_setting_with_timestamp(
    conn: asyncpg.Connection, key: str
) -> tuple[str, datetime] | None:
    """
    Get setting value and updated_at timestamp.

    Args:
        conn: Database connection
        key: Setting key

    Returns:
        Tuple of (value, updated_at) or None if not found
    """
    row = await conn.fetchrow(
        "SELECT value, updated_at FROM settings WHERE key = $1",
        key,
    )
    return (row["value"], row["updated_at"]) if row else None
