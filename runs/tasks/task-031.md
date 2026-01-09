---
task_id: task-031
title: Migration System Verification and Testing
role: lca-backend
follow_roles: []
post:
  - lca-recorder
  - code-simplifier
  - lca-gitops
depends_on: []
inputs:
  - objective.md
  - runs/plan.md
allowed_paths:
  - backend/**
  - docs/**
check_command: make check
handoff: runs/handoffs/task-031.md
---

# Task 031: Migration System Verification and Testing

## Goal

Verify the existing migration system works correctly, add comprehensive tests, and document the migration process. The system already has schema_migrations tracking and idempotent execution.

## Requirements

### Verify Existing System

The migration system in `backend/src/db/migration_runner.py` already:
- Creates `schema_migrations` table to track applied versions
- Reads migration files from `backend/src/db/migrations/`
- Executes only unapplied migrations
- Records applied migrations with timestamp

Verify these behaviors work correctly through tests.

### Migration Tests

Create `backend/tests/test_migrations.py`:

```python
import pytest
from pathlib import Path
from unittest.mock import AsyncMock, MagicMock, patch
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
    assert "CREATE TABLE IF NOT EXISTS schema_migrations" in conn.execute.call_args[0][0]


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


@pytest.mark.asyncio
async def test_migrations_are_idempotent():
    """Test running migrations twice doesn't re-apply."""
    conn = AsyncMock()
    
    # First run: no migrations applied
    conn.fetch.return_value = []
    
    # After running: migrations marked as applied
    with patch('src.db.migration_runner.apply_migration') as mock_apply:
        with patch('src.db.migration_runner.get_migration_files') as mock_files:
            mock_files.return_value = [("001", Path("001_test.py"))]
            
            # Simulate: first call returns [], second returns ["001"]
            conn.fetch.side_effect = [[], [{"version": "001"}]]
            
            # This would run migration once
            # Second run should skip
```

### Test Migration Order

Add test to verify migrations run in correct order:

```python
@pytest.mark.asyncio
async def test_migrations_run_in_order():
    """Test migrations are applied in version order."""
    applied_order = []
    
    async def track_migration(conn, version, filepath):
        applied_order.append(version)
    
    with patch('src.db.migration_runner.apply_migration', side_effect=track_migration):
        # ... setup and run
        pass
    
    # Verify order
    assert applied_order == sorted(applied_order)
```

### Existing Migration Files

Verify the existing migration files are correct:

```
backend/src/db/migrations/
├── __init__.py
├── 001_create_plants.py
├── 002_create_devices.py
├── 003_create_telemetry.py
├── 004_create_alerts.py
├── 005_create_settings.py
└── 006_create_care_plans.py
```

Each file should have an `async def up(conn)` function.

### Migration Documentation

Update `docs/development.md` with migration documentation:

```markdown
## Database Migrations

### How Migrations Work

1. Migration files live in `backend/src/db/migrations/`
2. Files are named `NNN_description.py` (e.g., `007_add_column.py`)
3. Each file defines an `async def up(conn)` function
4. On startup, the backend runs all unapplied migrations
5. Applied migrations are tracked in `schema_migrations` table

### Creating a New Migration

1. Create a new file with the next version number:
   ```python
   # backend/src/db/migrations/007_add_feature.py
   async def up(conn):
       await conn.execute("""
           ALTER TABLE plants ADD COLUMN location TEXT;
       """)
   ```

2. Restart the backend to apply:
   ```bash
   make restart-backend
   ```

3. Verify migration was applied:
   ```sql
   SELECT * FROM schema_migrations ORDER BY version;
   ```

### Migration Best Practices

- Migrations should be idempotent when possible
- Use `IF NOT EXISTS` for CREATE statements
- Use `IF EXISTS` for DROP statements
- Never modify existing migration files after they've been applied
- Test migrations on a copy of production data before deploying
```

## Constraints

- Do not modify existing migration files
- Do not change the migration runner behavior
- Add tests without breaking existing functionality
- Document the process for future developers

## Definition of Done

- [ ] Tests verify `schema_migrations` table is created
- [ ] Tests verify applied migrations are tracked
- [ ] Tests verify migrations run in order
- [ ] Tests verify migrations are idempotent
- [ ] Tests verify migration files are found correctly
- [ ] Documentation added to `docs/development.md`
- [ ] All existing tests still pass (`make check`)

## Notes

The migration system was implemented in run/003 and is already working. This task focuses on:
1. Adding test coverage
2. Verifying correctness
3. Documenting the process

The existing migrations (001-006) created all tables needed for Features 1 and 2. Feature 3 does not require new database schema changes.

From objective.md DoD:
- [x] Migrations versioned in `migrations/` directory (existing)
- [x] `schema_version` table tracks applied migrations (existing as `schema_migrations`)
- [x] Startup skips already-applied migrations (existing)
