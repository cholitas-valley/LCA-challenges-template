# Task 002 Handoff: Database Schema and Migrations

## Summary

Successfully implemented the complete database module with connection pool management and migration runner. Created all 6 migration files for the core database schema (plants, devices, telemetry, alerts, settings, care_plans) using asyncpg with idempotent migrations and graceful TimescaleDB handling.

## Files Created

### Database Module (backend/src/db/)
- `/home/genge/dev-ash/foundry-nodevenv/cholitas/challenge-001-plantops/backend/src/db/__init__.py` - Package exports
- `/home/genge/dev-ash/foundry-nodevenv/cholitas/challenge-001-plantops/backend/src/db/connection.py` - AsyncPG connection pool management
- `/home/genge/dev-ash/foundry-nodevenv/cholitas/challenge-001-plantops/backend/src/db/migrations.py` - Migration runner with tracking

### Migration Files (backend/src/db/migrations/)
- `/home/genge/dev-ash/foundry-nodevenv/cholitas/challenge-001-plantops/backend/src/db/migrations/__init__.py` - Package marker
- `/home/genge/dev-ash/foundry-nodevenv/cholitas/challenge-001-plantops/backend/src/db/migrations/001_create_plants.py` - Plants table
- `/home/genge/dev-ash/foundry-nodevenv/cholitas/challenge-001-plantops/backend/src/db/migrations/002_create_devices.py` - Devices table with indexes
- `/home/genge/dev-ash/foundry-nodevenv/cholitas/challenge-001-plantops/backend/src/db/migrations/003_create_telemetry.py` - Telemetry table with TimescaleDB hypertable
- `/home/genge/dev-ash/foundry-nodevenv/cholitas/challenge-001-plantops/backend/src/db/migrations/004_create_alerts.py` - Alerts table with index
- `/home/genge/dev-ash/foundry-nodevenv/cholitas/challenge-001-plantops/backend/src/db/migrations/005_create_settings.py` - Settings key-value table
- `/home/genge/dev-ash/foundry-nodevenv/cholitas/challenge-001-plantops/backend/src/db/migrations/006_create_care_plans.py` - Care plans table

## Interfaces/Contracts

### Database Connection Pool (src.db.connection)

**Functions:**
- `init_pool() -> asyncpg.Pool` - Initialize pool from DATABASE_URL (call at app startup)
- `close_pool() -> None` - Close pool (call at app shutdown)
- `get_pool() -> asyncpg.Pool` - Get current pool instance
- `get_db() -> AsyncGenerator[asyncpg.Connection, None]` - FastAPI dependency for DB connections

**Configuration:**
- Pool size: min=2, max=10
- Command timeout: 60 seconds
- Requires DATABASE_URL environment variable

**Usage Example:**
```python
from fastapi import Depends
from src.db import get_db

@app.get("/plants")
async def list_plants(db: asyncpg.Connection = Depends(get_db)):
    return await db.fetch("SELECT * FROM plants")
```

### Migration Runner (src.db.migrations)

**Functions:**
- `run_migrations(database_url: str) -> None` - Apply all pending migrations
- `get_migration_files() -> List[Tuple[str, Path]]` - Get migration files in order
- `apply_migration(conn, version, filepath) -> None` - Apply single migration

**Features:**
- Tracks applied migrations in `schema_migrations` table
- Runs migrations in filename order (001, 002, 003, ...)
- Idempotent (safe to run multiple times)
- Migration files must define `async def up(conn)` function

**Usage Example:**
```python
from src.db.migrations import run_migrations
import os

await run_migrations(os.getenv("DATABASE_URL"))
```

### Database Schema

**Tables Created:**

1. **plants** - Plant profiles with thresholds
   - `id TEXT PRIMARY KEY`
   - `name TEXT NOT NULL`
   - `species TEXT`
   - `thresholds JSONB` - JSON object with sensor thresholds
   - `created_at TIMESTAMPTZ DEFAULT NOW()`

2. **devices** - IoT device registration
   - `id TEXT PRIMARY KEY`
   - `mac_address TEXT UNIQUE`
   - `mqtt_username TEXT UNIQUE`
   - `mqtt_password_hash TEXT NOT NULL`
   - `plant_id TEXT` → references plants (nullable)
   - `status TEXT DEFAULT 'provisioning'`
   - `firmware_version TEXT`
   - `sensor_types JSONB`
   - `last_seen_at TIMESTAMPTZ`
   - `created_at TIMESTAMPTZ DEFAULT NOW()`
   - Indexes: `plant_id`, `status`

3. **telemetry** - Time-series sensor data (TimescaleDB hypertable if extension available)
   - `time TIMESTAMPTZ NOT NULL`
   - `device_id TEXT` → references devices
   - `plant_id TEXT` → references plants (nullable)
   - `soil_moisture FLOAT`
   - `temperature FLOAT`
   - `humidity FLOAT`
   - `light_level FLOAT`
   - Indexes: `(device_id, time DESC)`, `(plant_id, time DESC)`

4. **alerts** - Threshold violation alerts
   - `id SERIAL PRIMARY KEY`
   - `plant_id TEXT` → references plants
   - `device_id TEXT` → references devices
   - `metric TEXT NOT NULL`
   - `value FLOAT NOT NULL`
   - `threshold FLOAT NOT NULL`
   - `direction TEXT NOT NULL`
   - `sent_at TIMESTAMPTZ DEFAULT NOW()`
   - Index: `(plant_id, sent_at DESC)`

5. **settings** - Application configuration
   - `key TEXT PRIMARY KEY`
   - `value TEXT NOT NULL`
   - `updated_at TIMESTAMPTZ DEFAULT NOW()`

6. **care_plans** - LLM-generated care recommendations
   - `id SERIAL PRIMARY KEY`
   - `plant_id TEXT` → references plants (unique constraint)
   - `plan_data JSONB NOT NULL`
   - `generated_at TIMESTAMPTZ DEFAULT NOW()`

**Migration Tracking:**
- `schema_migrations` table automatically created
  - `version TEXT PRIMARY KEY`
  - `applied_at TIMESTAMPTZ DEFAULT NOW()`

## How to Verify

### 1. Check module structure
```bash
find backend/src/db -type f -name "*.py" | sort
```

Expected output:
```
backend/src/db/__init__.py
backend/src/db/connection.py
backend/src/db/migrations.py
backend/src/db/migrations/__init__.py
backend/src/db/migrations/001_create_plants.py
backend/src/db/migrations/002_create_devices.py
backend/src/db/migrations/003_create_telemetry.py
backend/src/db/migrations/004_create_alerts.py
backend/src/db/migrations/005_create_settings.py
backend/src/db/migrations/006_create_care_plans.py
```

### 2. Verify Python syntax
```bash
python3 -m py_compile backend/src/db/connection.py backend/src/db/migrations.py backend/src/db/migrations/*.py
```
Should complete with no errors.

### 3. Run check command (in Docker container with dependencies)
```bash
cd backend && python -c "from src.db import migrations; print('migrations module OK')"
```
Expected output: `migrations module OK`

### 4. When database is running, test migrations
```bash
docker compose up -d db
docker compose exec backend python -c "
import asyncio
import os
from src.db.migrations import run_migrations
asyncio.run(run_migrations(os.getenv('DATABASE_URL')))
"
```

## Implementation Details

### Connection Pool
- Uses asyncpg's native connection pooling
- Global pool instance managed by module
- Pool initialized once at startup, reused across requests
- Proper lifecycle management (init/close)
- FastAPI dependency pattern for request-scoped connections

### Migration Runner
- Simple Python-based (no heavy migration frameworks)
- Extracts version from filename prefix (001, 002, etc.)
- Uses exec() to dynamically load and run migration modules
- Each migration defines `async def up(conn)` function
- Migrations receive asyncpg connection directly
- Version tracking prevents re-running migrations

### Idempotency
- All table creations use `CREATE TABLE IF NOT EXISTS`
- All index creations use `CREATE INDEX IF NOT EXISTS`
- Schema_migrations table created with `IF NOT EXISTS`
- Safe to run migrations multiple times

### TimescaleDB Handling
- Migration 003 attempts to create hypertable on telemetry table
- Wrapped in try/except to handle missing extension gracefully
- Prints warning but continues if extension not available
- Falls back to regular table if TimescaleDB unavailable

## Next Steps

The next task can build upon:
- Database schema fully defined and ready to apply
- Migration runner ready to execute on startup or via script
- Connection pool ready to integrate with FastAPI app
- All tables support the IoT device provisioning and telemetry storage
- Schema supports LLM care plan generation and storage
- Alert table ready for threshold monitoring

## Constraints Followed

- Did NOT start the database
- Did NOT run migrations
- Used asyncpg (not SQLAlchemy)
- Kept migrations as simple SQL strings in Python files
- Handled TimescaleDB extension being optional
- Only modified files in `backend/**` (allowed_paths)
- No refactoring of unrelated code
- No features beyond task scope

## Risks/Follow-ups

- DATABASE_URL environment variable must be set before init_pool()
- Migrations should be run during application startup or via init script
- TimescaleDB extension must be installed in PostgreSQL for hypertable optimization
- No down migrations implemented (only up migrations)
- Migration runner uses exec() - only run trusted migration files
- Connection pool must be explicitly closed during shutdown to prevent warnings

---

# Recorder: task-002

## Changes Summary

Implemented complete database module with asyncpg connection pool and Python-based migration runner. Created 6 migration files defining core schema: plants, devices, telemetry (with optional TimescaleDB hypertable), alerts, settings, care_plans. All migrations are idempotent with CREATE IF NOT EXISTS. Migration tracking table automatically manages applied versions.

## Key Files

- `backend/src/db/__init__.py`: Package exports for connection and migration functions
- `backend/src/db/connection.py`: AsyncPG pool management (init_pool, close_pool, get_pool, get_db)
- `backend/src/db/migrations.py`: Migration runner with version tracking and idempotency
- `backend/src/db/migrations/001_create_plants.py`: Plants table (id, name, species, thresholds JSONB)
- `backend/src/db/migrations/002_create_devices.py`: Devices table (id, mac_address, mqtt_username, mqtt_password_hash, plant_id FK, status, firmware_version, sensor_types, last_seen_at)
- `backend/src/db/migrations/003_create_telemetry.py`: Telemetry hypertable (time, device_id FK, plant_id FK, soil_moisture/temperature/humidity/light_level)
- `backend/src/db/migrations/004_create_alerts.py`: Alerts table (id, plant_id FK, device_id FK, metric, value, threshold, direction, sent_at)
- `backend/src/db/migrations/005_create_settings.py`: Settings key-value table
- `backend/src/db/migrations/006_create_care_plans.py`: Care plans table with LLM plan data

## Interfaces for Next Task

### Database Connection (src.db.connection)

Public API:
- `init_pool(database_url: str) -> asyncpg.Pool` - Initialize at app startup
- `close_pool() -> None` - Close at app shutdown
- `get_pool() -> asyncpg.Pool` - Get active pool instance
- `get_db() -> AsyncGenerator[asyncpg.Connection, None]` - FastAPI dependency for request-scoped connections

Configuration: min=2, max=10 connections, 60-second command timeout

### Migration Runner (src.db.migrations)

Public API:
- `run_migrations(database_url: str) -> None` - Execute all pending migrations (idempotent)
- `get_migration_files() -> List[Tuple[str, Path]]` - List migrations in order
- `apply_migration(conn, version, filepath) -> None` - Apply single migration

Tracking: schema_migrations table stores version and applied_at timestamp

### Database Schema

Six tables ready:
1. **plants** - Plant profiles (id, name, species, thresholds JSONB)
2. **devices** - IoT registration (id, mac_address UNIQUE, mqtt_username UNIQUE, mqtt_password_hash, plant_id FK, status default 'provisioning', firmware_version, sensor_types JSONB, last_seen_at)
3. **telemetry** - Time-series data (time, device_id FK, plant_id FK, soil_moisture/temperature/humidity/light_level floats)
4. **alerts** - Threshold violations (id serial, plant_id FK, device_id FK, metric, value, threshold, direction, sent_at)
5. **settings** - Configuration key-value store
6. **care_plans** - LLM recommendations (id serial, plant_id FK unique, plan_data JSONB, generated_at)

Indexes: devices(plant_id), devices(status), telemetry(device_id, time DESC), telemetry(plant_id, time DESC), alerts(plant_id, sent_at DESC)

## Notes

- All migrations use CREATE TABLE IF NOT EXISTS and CREATE INDEX IF NOT EXISTS - safe to run multiple times
- Migration 003 wraps TimescaleDB hypertable creation in try/except - falls back to regular table if extension unavailable
- Migration runner uses exec() to load Python modules dynamically - only safe with trusted files
- No down migrations implemented (only up migrations)
- Connection pool must be explicitly closed during app shutdown
- DATABASE_URL environment variable required (from .env)
- Next task can import and use get_db() dependency immediately in FastAPI routes
- All migrations run on startup via run_migrations() call - idempotent so safe to call repeatedly
