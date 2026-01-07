---
task_id: task-002
title: Database schema and migrations
role: lca-backend
follow_roles: []
post:
  - lca-recorder
  - lca-gitops
depends_on:
  - task-001
inputs:
  - objective.md
  - runs/plan.md
  - runs/handoffs/task-001.md
allowed_paths:
  - backend/**
check_command: cd backend && python -c "from src.db import migrations; print('migrations module OK')"
handoff: runs/handoffs/task-002.md
---

# Task 002: Database Schema and Migrations

## Goal

Implement the database schema with migrations for all core tables: devices, plants, telemetry, alerts, settings, and care_plans. Use simple Python-based migrations that can be run on startup.

## Requirements

### Database Module (backend/src/db/)

Create:
- `backend/src/db/__init__.py`: Package init with exports
- `backend/src/db/connection.py`: AsyncPG connection pool management
- `backend/src/db/migrations.py`: Migration runner

### Migration Files (backend/src/db/migrations/)

Create migration scripts in order:

**001_create_plants.py**
```sql
CREATE TABLE IF NOT EXISTS plants (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  species TEXT,
  thresholds JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**002_create_devices.py**
```sql
CREATE TABLE IF NOT EXISTS devices (
  id TEXT PRIMARY KEY,
  mac_address TEXT UNIQUE,
  mqtt_username TEXT UNIQUE,
  mqtt_password_hash TEXT NOT NULL,
  plant_id TEXT REFERENCES plants(id) ON DELETE SET NULL,
  status TEXT DEFAULT 'provisioning',
  firmware_version TEXT,
  sensor_types JSONB,
  last_seen_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_devices_plant_id ON devices(plant_id);
CREATE INDEX IF NOT EXISTS idx_devices_status ON devices(status);
```

**003_create_telemetry.py**
```sql
CREATE TABLE IF NOT EXISTS telemetry (
  time TIMESTAMPTZ NOT NULL,
  device_id TEXT REFERENCES devices(id) ON DELETE CASCADE,
  plant_id TEXT REFERENCES plants(id) ON DELETE SET NULL,
  soil_moisture FLOAT,
  temperature FLOAT,
  humidity FLOAT,
  light_level FLOAT
);
-- TimescaleDB hypertable (if extension available)
SELECT create_hypertable('telemetry', 'time', if_not_exists => TRUE);
CREATE INDEX IF NOT EXISTS idx_telemetry_device ON telemetry(device_id, time DESC);
CREATE INDEX IF NOT EXISTS idx_telemetry_plant ON telemetry(plant_id, time DESC);
```

**004_create_alerts.py**
```sql
CREATE TABLE IF NOT EXISTS alerts (
  id SERIAL PRIMARY KEY,
  plant_id TEXT REFERENCES plants(id) ON DELETE CASCADE,
  device_id TEXT REFERENCES devices(id) ON DELETE CASCADE,
  metric TEXT NOT NULL,
  value FLOAT NOT NULL,
  threshold FLOAT NOT NULL,
  direction TEXT NOT NULL,
  sent_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_alerts_plant ON alerts(plant_id, sent_at DESC);
```

**005_create_settings.py**
```sql
CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**006_create_care_plans.py**
```sql
CREATE TABLE IF NOT EXISTS care_plans (
  id SERIAL PRIMARY KEY,
  plant_id TEXT REFERENCES plants(id) ON DELETE CASCADE UNIQUE,
  plan_data JSONB NOT NULL,
  generated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Migration Runner

The migration runner should:
1. Track applied migrations in a `schema_migrations` table
2. Run migrations in filename order
3. Be idempotent (safe to run multiple times)
4. Log which migrations are applied

### Connection Pool

The connection module should:
1. Create asyncpg pool from DATABASE_URL
2. Provide `get_db()` dependency for FastAPI
3. Handle pool lifecycle (startup/shutdown)

## Definition of Done

- [ ] `backend/src/db/connection.py` exists with pool management
- [ ] `backend/src/db/migrations.py` exists with runner
- [ ] All 6 migration files exist in `backend/src/db/migrations/`
- [ ] Migration module can be imported without errors
- [ ] Migrations use CREATE IF NOT EXISTS for idempotency
- [ ] TimescaleDB hypertable creation handles missing extension gracefully

## Constraints

- Do NOT start the database or run migrations
- Use asyncpg (not SQLAlchemy) for direct queries
- Keep migrations simple SQL strings
- Handle TimescaleDB extension being optional (catch error if not available)
