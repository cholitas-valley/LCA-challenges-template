# Development Guide

This document provides guidance for developers working on the PlantOps platform.

## Database Migrations

### How Migrations Work

PlantOps uses a simple Python-based migration system:

1. Migration files live in `backend/src/db/migrations/`
2. Files are named `NNN_description.py` where NNN is a 3-digit version (e.g., `007_add_column.py`)
3. Each file defines an `async def up(conn)` function that receives a database connection
4. On startup, the backend runs all unapplied migrations in version order
5. Applied migrations are tracked in the `schema_migrations` table with version and timestamp

The migration runner (`backend/src/db/migration_runner.py`) ensures:
- Migrations run in numerical order
- Already-applied migrations are skipped (idempotent)
- All migrations complete before the application starts

### Creating a New Migration

Follow these steps to add a new database migration:

1. **Create the migration file** with the next sequential version number:

   ```python
   # backend/src/db/migrations/007_add_location.py
   """
   Migration 007: Add location column to plants table.
   """
   
   async def up(conn):
       """
       Add location tracking to plants.
       """
       await conn.execute("""
           ALTER TABLE plants ADD COLUMN IF NOT EXISTS location TEXT;
       """)
   ```

2. **Test locally** by restarting the backend:

   ```bash
   make restart-backend
   ```

   The migration will run automatically on startup.

3. **Verify migration was applied**:

   ```bash
   # Connect to database and check
   docker-compose exec postgres psql -U plantops -d plantops
   ```

   ```sql
   -- View all applied migrations
   SELECT * FROM schema_migrations ORDER BY version;
   
   -- Verify schema change
   \d plants
   ```

4. **Commit the migration file**:

   ```bash
   git add backend/src/db/migrations/007_add_location.py
   git commit -m "feat: add location column to plants"
   ```

### Migration Best Practices

- **Idempotent operations**: Use `IF NOT EXISTS` for CREATE, `IF EXISTS` for DROP
  ```sql
  CREATE TABLE IF NOT EXISTS new_table (...);
  ALTER TABLE plants ADD COLUMN IF NOT EXISTS new_col TEXT;
  ```

- **Never modify existing migrations**: Once applied to any environment, treat migration files as immutable. Create a new migration to make changes.

- **Test with production data**: Before deploying, test migrations on a copy of production data to catch edge cases.

- **Keep migrations focused**: Each migration should do one logical change. Split complex changes into multiple migrations.

- **Add comments**: Explain why the migration exists, not just what it does.

- **Handle data transformation carefully**: If migrating data, ensure the transformation is reversible or well-documented.

### Migration File Structure

Each migration file must:
- Define an `async def up(conn)` function
- Accept a single `conn` parameter (asyncpg connection)
- Use `await` for all database operations
- Include docstrings explaining the purpose

Example template:

```python
"""
Migration NNN: Brief description of what this migration does.
"""

async def up(conn):
    """
    Detailed explanation of the schema change.
    Include why this change is needed.
    """
    await conn.execute("""
        -- Your SQL here
        CREATE TABLE IF NOT EXISTS example (
            id TEXT PRIMARY KEY,
            created_at TIMESTAMPTZ DEFAULT NOW()
        );
    """)
```

### Troubleshooting Migrations

**Migration fails on startup:**
1. Check backend logs: `docker-compose logs backend`
2. Verify SQL syntax in the migration file
3. Ensure migration file has an `up()` function
4. Check for conflicts with existing schema

**Migration already applied but changes not visible:**
1. Verify the migration version in `schema_migrations`
2. Check if migration has `IF NOT EXISTS` that prevented actual change
3. Review migration logic for conditional statements

**Need to roll back a migration:**
The system doesn't support automatic rollback. To revert:
1. Create a new migration that reverses the change
2. Example: If migration 007 added a column, create 008 that drops it

**Migration order issues:**
- Migrations run in alphabetical order by version number
- Always use 3-digit padding: `007`, not `7`
- Check `get_migration_files()` returns migrations in correct order

## Running Tests

```bash
# Run all tests
make check

# Run specific test file
cd backend && pytest tests/test_migrations.py -v

# Run with coverage
cd backend && pytest --cov=src.db.migration_runner tests/test_migrations.py
```

## Firmware Development

### PlatformIO Setup

The ESP32 firmware is developed using PlatformIO:

```bash
# Install PlatformIO (if not already installed)
pip install platformio

# Navigate to firmware directory
cd firmware

# Build firmware
pio run

# Flash to connected ESP32
pio run -t upload

# Monitor serial output
pio device monitor
```

### Firmware Structure

```
firmware/
├── include/
│   ├── config.h           # Configuration constants
│   ├── wifi_manager.h     # WiFi portal and connectivity
│   ├── sensors.h          # Sensor reading interface
│   └── mqtt_client.h      # MQTT client with TLS
├── src/
│   ├── main.cpp          # Main application loop
│   ├── wifi_manager.cpp  # WiFi implementation
│   ├── sensors.cpp       # Sensor implementations
│   └── mqtt_client.cpp   # MQTT implementation
└── platformio.ini        # Build configuration
```

### Testing Firmware Changes

1. Update code in `firmware/src/` or `firmware/include/`
2. Build: `pio run`
3. Flash to device: `pio run -t upload`
4. Monitor serial output: `pio device monitor`
5. Verify behavior with backend logs: `make logs`

### Firmware Configuration

Edit `firmware/include/config.h` to change:
- Backend host/port
- MQTT broker host/port
- Sensor pins
- Telemetry intervals

After changes, rebuild and reflash the device.

See [firmware.md](firmware.md) for complete setup and troubleshooting.

## Code Quality

The project uses several tools to maintain code quality:
- `pytest` for testing
- `ruff` for linting (replaces flake8, black, isort)
- Type hints with `mypy`

All checks run via `make check`.

## QA Verification

### Test Suite Status (as of run/004)

The PlantOps platform has been validated with comprehensive QA:

- **Total Tests**: 139 tests (all passing)
- **Test Execution Time**: ~2 seconds
- **Frontend Build**: 796 modules, builds successfully
- **Code Coverage**: All major components tested

### Feature Coverage

**Feature 1 - Core Platform (82 tests)**
- Device registration and provisioning
- Plant CRUD operations
- Telemetry pipeline
- Heartbeat and offline detection
- Discord alerts
- Threshold evaluation
- MQTT authentication

**Feature 2 - LLM Care Advisor (22 tests)**
- LLM settings management (encryption, masking)
- Care plan generation
- Provider support (Anthropic, OpenAI)

**Feature 3 - Production Hardening (35 tests)**
- MQTT TLS and reconnection
- Health and ready endpoints
- Structured logging and correlation IDs
- Database migrations

### Production Readiness Checklist

All Definition of Done items for production deployment verified:

- TLS security configured and tested
- Automatic reconnection for backend and ESP32
- Structured logging with correlation IDs
- Database migrations system operational
- Docker production configuration with resource limits
- ESP32 firmware with WiFi portal and TLS support
- Comprehensive documentation (deployment, API, firmware)

### Known Limitations

1. **TLS Certificates**: Self-signed certificates suitable for home use. Production deployments with external access should use Let's Encrypt or other trusted CA.

2. **Frontend Bundle Size**: 623KB (exceeds 500KB warning). Consider code-splitting for optimization.

3. **MQTT Reconnection**: Backend reconnection tested with unit tests. ESP32 reconnection verified in code but requires physical hardware for integration testing.

4. **Performance**: No load testing performed. System designed for home use (< 100 devices).

### Regression Prevention

When making changes:
1. Run `make check` before committing
2. Verify all 139 tests still pass
3. Check frontend builds without errors
4. Test affected features manually if integration tests don't cover them

The test suite provides regression protection for all three features.
