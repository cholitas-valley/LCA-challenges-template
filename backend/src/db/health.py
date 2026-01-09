"""Database health check utilities."""
from src.db.connection import get_pool


async def check_database_health() -> tuple[bool, str | None]:
    """
    Check database connectivity.
    
    Returns:
        Tuple of (is_healthy, error_message)
    """
    try:
        pool = get_pool()
        async with pool.acquire() as conn:
            await conn.fetchval("SELECT 1")
        return True, None
    except Exception as e:
        return False, str(e)
