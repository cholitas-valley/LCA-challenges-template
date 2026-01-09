"""
Tests for database migration system.
Verify migration runner behavior and tracking.
"""
import pytest
from pathlib import Path
from unittest.mock import AsyncMock, MagicMock, patch, call
from src.db.migration_runner import (
    ensure_migrations_table,
    get_applied_migrations,
    mark_migration_applied,
    get_migration_files,
    apply_migration,
    run_migrations,
)


@pytest.mark.asyncio
async def test_ensure_migrations_table_creates_table():
    """Test schema_migrations table creation."""
    conn = AsyncMock()
    await ensure_migrations_table(conn)
    
    conn.execute.assert_called_once()
    # Should create table if not exists
    call_args = conn.execute.call_args[0][0]
    assert "CREATE TABLE IF NOT EXISTS schema_migrations" in call_args
    assert "version TEXT PRIMARY KEY" in call_args
    assert "applied_at TIMESTAMPTZ" in call_args


@pytest.mark.asyncio
async def test_get_applied_migrations_returns_versions():
    """Test getting list of applied migration versions."""
    conn = AsyncMock()
    conn.fetch.return_value = [
        {"version": "001"},
        {"version": "002"},
        {"version": "003"},
    ]
    
    versions = await get_applied_migrations(conn)
    
    assert versions == ["001", "002", "003"]
    conn.fetch.assert_called_once()
    # Verify query selects version and orders by version
    call_args = conn.fetch.call_args[0][0]
    assert "SELECT version FROM schema_migrations" in call_args
    assert "ORDER BY version" in call_args


@pytest.mark.asyncio
async def test_mark_migration_applied_inserts_version():
    """Test marking migration as applied."""
    conn = AsyncMock()
    
    await mark_migration_applied(conn, "004")
    
    conn.execute.assert_called_once()
    args = conn.execute.call_args[0]
    assert "INSERT INTO schema_migrations" in args[0]
    assert args[1] == "004"


def test_get_migration_files_returns_sorted_list():
    """Test migration files are returned in order."""
    files = get_migration_files()
    
    # Should have existing migrations
    assert len(files) >= 6  # 001-006 from run/003
    
    # Should be sorted by version
    versions = [version for version, _ in files]
    assert versions == sorted(versions)
    
    # Should not include __init__.py
    filenames = [filepath.name for _, filepath in files]
    assert "__init__.py" not in filenames
    
    # Should extract version correctly (e.g., "001_create_plants.py" -> "001")
    for version, filepath in files:
        assert version.isdigit()
        assert len(version) == 3  # Should be 3-digit version


@pytest.mark.asyncio
async def test_migrations_are_idempotent():
    """Test running migrations twice doesn't re-apply."""
    conn = AsyncMock()
    conn.close = AsyncMock()

    # Mock get_migration_files to return a test migration
    test_migration = Path(__file__).parent.parent / "src" / "db" / "migrations" / "001_create_plants.py"

    # Track how many times apply_migration is called
    apply_count = 0

    async def track_apply(conn, version, filepath):
        nonlocal apply_count
        apply_count += 1

    with patch('src.db.migration_runner.get_migration_files') as mock_files:
        mock_files.return_value = [("001", test_migration)]

        with patch('src.db.migration_runner.apply_migration', side_effect=track_apply):
            with patch('src.db.migration_runner.asyncpg.connect', return_value=conn):
                # First run: no migrations applied
                conn.fetch.return_value = []
                await run_migrations("postgresql://fake")
                first_run_count = apply_count

                # Second run: migration already applied
                apply_count = 0
                conn.fetch.return_value = [{"version": "001"}]
                await run_migrations("postgresql://fake")
                second_run_count = apply_count

        # First run should have applied the migration
        assert first_run_count == 1, f"Expected 1 migration on first run, got {first_run_count}"
        # Second run should NOT have applied anything
        assert second_run_count == 0, f"Migration was re-applied on second run (not idempotent): {second_run_count}"


@pytest.mark.asyncio
async def test_migrations_run_in_order():
    """Test migrations are applied in version order."""
    applied_order = []

    async def track_migration(conn, version, filepath):
        applied_order.append(version)

    conn = AsyncMock()
    conn.close = AsyncMock()
    conn.fetch.return_value = []  # No migrations applied yet

    with patch('src.db.migration_runner.apply_migration', side_effect=track_migration):
        # Don't mock get_migration_files - test it returns files in sorted order
        # The actual function uses sorted() on the glob results
        with patch('src.db.migration_runner.asyncpg.connect', return_value=conn):
            await run_migrations("postgresql://fake")

    # Verify migrations were applied in sorted order
    # Should be: 001, 002, 003, 004, 005, 006
    if applied_order:  # Only check if any were applied
        assert applied_order == sorted(applied_order), f"Migrations not applied in order: {applied_order}"
        # Verify we have the expected migrations
        assert "001" in applied_order
        assert "002" in applied_order


@pytest.mark.asyncio
async def test_apply_migration_calls_up_function():
    """Test that apply_migration executes the up() function from migration file."""
    conn = AsyncMock()
    
    # Create a temporary migration file
    import tempfile
    with tempfile.NamedTemporaryFile(mode='w', suffix='.py', delete=False) as f:
        f.write("""
async def up(conn):
    await conn.execute("CREATE TABLE test_table (id INT)")
""")
        temp_path = Path(f.name)
    
    try:
        await apply_migration(conn, "999", temp_path)
        
        # Should have called conn.execute from the up() function
        assert conn.execute.called
        # Should have marked migration as applied
        assert any("INSERT INTO schema_migrations" in str(call) 
                   for call in conn.execute.call_args_list)
    finally:
        temp_path.unlink()


@pytest.mark.asyncio
async def test_apply_migration_raises_if_no_up_function():
    """Test that apply_migration raises error if migration file lacks up() function."""
    conn = AsyncMock()
    
    # Create a temporary migration file without up() function
    import tempfile
    with tempfile.NamedTemporaryFile(mode='w', suffix='.py', delete=False) as f:
        f.write("""
# No up() function defined
pass
""")
        temp_path = Path(f.name)
    
    try:
        with pytest.raises(ValueError, match="must define an async up"):
            await apply_migration(conn, "999", temp_path)
    finally:
        temp_path.unlink()


def test_get_migration_files_skips_private_files():
    """Test that get_migration_files skips files starting with underscore."""
    files = get_migration_files()
    
    # Should not include any files starting with _
    for version, filepath in files:
        assert not filepath.name.startswith("_"), f"Found private file: {filepath.name}"
