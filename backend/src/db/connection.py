"""
Database connection pool management using asyncpg.
"""
import os
from typing import AsyncGenerator
import asyncpg


# Global pool instance
_pool: asyncpg.Pool | None = None


async def init_pool() -> asyncpg.Pool:
    """
    Initialize the asyncpg connection pool.
    Should be called during application startup.
    """
    global _pool
    
    database_url = os.getenv("DATABASE_URL")
    if not database_url:
        raise ValueError("DATABASE_URL environment variable is required")
    
    _pool = await asyncpg.create_pool(
        database_url,
        min_size=2,
        max_size=10,
        command_timeout=60,
    )
    return _pool


async def close_pool() -> None:
    """
    Close the connection pool.
    Should be called during application shutdown.
    """
    global _pool
    if _pool:
        await _pool.close()
        _pool = None


def get_pool() -> asyncpg.Pool:
    """
    Get the current connection pool.
    Raises RuntimeError if pool is not initialized.
    """
    if _pool is None:
        raise RuntimeError("Database pool not initialized. Call init_pool() first.")
    return _pool


async def get_db() -> AsyncGenerator[asyncpg.Connection, None]:
    """
    FastAPI dependency for getting a database connection.
    
    Usage:
        @app.get("/items")
        async def list_items(db: asyncpg.Connection = Depends(get_db)):
            return await db.fetch("SELECT * FROM items")
    """
    pool = get_pool()
    async with pool.acquire() as connection:
        yield connection
