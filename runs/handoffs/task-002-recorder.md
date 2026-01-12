# Recorder: task-002

## Changes Summary

Complete database module with AsyncPG connection pool management and 6 migration files for all core tables (plants, devices, telemetry, alerts, settings, care_plans).

## Key Files

- `backend/src/db/__init__.py`: Package exports
- `backend/src/db/connection.py`: AsyncPG pool with get_db() FastAPI dependency
- `backend/src/db/migrations.py`: Migration runner with version tracking
- `backend/src/db/migrations/001_create_plants.py`: Plants table
- `backend/src/db/migrations/002_create_devices.py`: Devices table with indexes
- `backend/src/db/migrations/003_create_telemetry.py`: Telemetry with TimescaleDB hypertable
- `backend/src/db/migrations/004_create_alerts.py`: Alerts table
- `backend/src/db/migrations/005_create_settings.py`: Settings key-value store
- `backend/src/db/migrations/006_create_care_plans.py`: Care plans table

## Interfaces for Next Task

### Database Connection API
- `init_pool()` - Initialize pool from DATABASE_URL
- `close_pool()` - Cleanup on shutdown
- `get_pool()` - Get pool instance
- `get_db()` - FastAPI dependency for connections

### Migration Runner
- `run_migrations()` - Execute pending migrations (idempotent)
- Tracks versions in schema_migrations table

### Tables Available
- plants (id, name, species, thresholds, created_at)
- devices (id, mac_address, mqtt_username, mqtt_password_hash, plant_id, status, ...)
- telemetry (time, device_id, plant_id, soil_moisture, temperature, humidity, light_level)
- alerts (id, plant_id, device_id, metric, value, threshold, direction, sent_at)
- settings (key, value, updated_at)
- care_plans (id, plant_id, plan_data, generated_at)

## Notes

- All migrations use CREATE IF NOT EXISTS for idempotency
- TimescaleDB hypertable wrapped in try/except for graceful fallback
- DATABASE_URL environment variable required
- Pool config: min=2, max=10 connections
