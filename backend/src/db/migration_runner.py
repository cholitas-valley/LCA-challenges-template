"""
Simple Python-based database migration runner.
"""
import os
import logging
from pathlib import Path
from typing import List, Tuple
import asyncpg


logger = logging.getLogger(__name__)


async def ensure_migrations_table(conn: asyncpg.Connection) -> None:
    """
    Create the schema_migrations table if it doesn't exist.
    Tracks which migrations have been applied.
    """
    await conn.execute("""
        CREATE TABLE IF NOT EXISTS schema_migrations (
            version TEXT PRIMARY KEY,
            applied_at TIMESTAMPTZ DEFAULT NOW()
        )
    """)


async def get_applied_migrations(conn: asyncpg.Connection) -> List[str]:
    """
    Get list of already-applied migration versions.
    """
    rows = await conn.fetch("SELECT version FROM schema_migrations ORDER BY version")
    return [row["version"] for row in rows]


async def mark_migration_applied(conn: asyncpg.Connection, version: str) -> None:
    """
    Record that a migration has been applied.
    """
    await conn.execute(
        "INSERT INTO schema_migrations (version) VALUES ($1)",
        version
    )


def get_migration_files() -> List[Tuple[str, Path]]:
    """
    Get list of migration files in order.
    Returns list of (version, path) tuples.
    """
    migrations_dir = Path(__file__).parent / "migrations"
    if not migrations_dir.exists():
        return []

    files = []
    for filepath in sorted(migrations_dir.glob("*.py")):
        # Skip __init__.py and other non-migration files
        if filepath.name.startswith("_"):
            continue
        # Extract version from filename (e.g., "001_create_plants.py" -> "001")
        version = filepath.stem.split("_")[0]
        files.append((version, filepath))

    return files


async def apply_migration(conn: asyncpg.Connection, version: str, filepath: Path) -> None:
    """
    Apply a single migration file.
    The migration file should define an `up()` async function.
    """
    logger.info(f"Applying migration {version}: {filepath.name}")
    
    # Read the migration file
    migration_code = filepath.read_text()
    
    # Create a namespace and execute the migration module
    namespace = {"asyncpg": asyncpg, "conn": conn}
    exec(migration_code, namespace)
    
    # Call the up() function if it exists
    if "up" in namespace and callable(namespace["up"]):
        await namespace["up"](conn)
    else:
        raise ValueError(f"Migration {filepath.name} must define an async up(conn) function")
    
    # Mark as applied
    await mark_migration_applied(conn, version)
    logger.info(f"Migration {version} applied successfully")


async def run_migrations(database_url: str) -> None:
    """
    Run all pending migrations.
    
    Args:
        database_url: PostgreSQL connection string
    """
    conn = await asyncpg.connect(database_url)
    
    try:
        # Ensure migrations table exists
        await ensure_migrations_table(conn)
        
        # Get already-applied migrations
        applied = await get_applied_migrations(conn)
        logger.info(f"Already applied migrations: {applied}")
        
        # Get all migration files
        migration_files = get_migration_files()
        logger.info(f"Found {len(migration_files)} migration files")
        
        # Apply pending migrations
        for version, filepath in migration_files:
            if version not in applied:
                await apply_migration(conn, version, filepath)
            else:
                logger.debug(f"Skipping already-applied migration {version}")
        
        logger.info("All migrations applied successfully")
    
    finally:
        await conn.close()
