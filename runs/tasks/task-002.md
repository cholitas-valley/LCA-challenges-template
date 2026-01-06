---
task_id: task-002
title: Database schema and TimescaleDB setup
role: lca-backend
post: [lca-docs]
depends_on: [task-001]
inputs:
  - runs/plan.md
  - runs/handoffs/task-001.md
  - docker-compose.yml
allowed_paths:
  - backend/migrations/**
  - backend/src/db/**
  - backend/package.json
  - backend/tsconfig.json
  - backend/Dockerfile
  - backend/.dockerignore
check_command: make check
handoff: runs/handoffs/task-002.md
---

## Goal

Set up PostgreSQL with TimescaleDB extension and create the database schema with migrations for plants configuration, telemetry hypertable, and alerts history.

## Scope

**Create:**
- `backend/migrations/001_initial_schema.sql` with:
  - Enable TimescaleDB extension
  - Create `plants` table (id, name, soil_moisture_min, soil_moisture_max, light_min, temperature_min, temperature_max, alert_cooldown_minutes, last_alert_sent_at)
  - Create `telemetry` table (timestamp, plant_id, soil_moisture, light, temperature)
  - Convert `telemetry` to hypertable on `timestamp`
  - Create indexes for efficient queries
  - Create `alerts` table (id, timestamp, plant_id, alert_type, message, sent_to_discord)
  - Insert seed data for 6 plants

- `backend/src/db/client.ts` - PostgreSQL connection pool with pg
- `backend/src/db/migrate.ts` - Migration runner script
- `backend/package.json` - Initial dependencies (pg, @types/pg)
- `backend/tsconfig.json` - TypeScript configuration (strict mode)
- `backend/Dockerfile` - Node.js 20 Alpine image
- `backend/.dockerignore`

**Seed data for 6 plants:**
1. Monstera Deliciosa
2. Snake Plant
3. Pothos
4. Fiddle Leaf Fig
5. Spider Plant
6. Peace Lily

Each with reasonable default thresholds (e.g., soil_moisture_min: 20, soil_moisture_max: 80).

## Constraints

- Use TimescaleDB hypertable for `telemetry` table
- Primary key for telemetry: (timestamp, plant_id)
- Use `TIMESTAMPTZ` for all timestamps
- Migration must be idempotent (safe to re-run)
- Use `ON CONFLICT DO NOTHING` for seed data inserts
- Connection pool should be initialized once and exported
- Migration runner should run on backend container startup

## Definition of Done

- [ ] `backend/migrations/001_initial_schema.sql` exists with all tables and hypertable setup
- [ ] `backend/src/db/client.ts` exports a pg Pool instance
- [ ] `backend/src/db/migrate.ts` can run migrations from migrations directory
- [ ] `backend/package.json` has pg and TypeScript dependencies
- [ ] `backend/tsconfig.json` configured with strict mode
- [ ] `backend/Dockerfile` builds successfully
- [ ] Docker Compose can start postgres service with TimescaleDB
- [ ] Running `docker compose exec postgres psql -U plantops -d plantops -c '\dt'` shows all tables
- [ ] `SELECT * FROM plants` returns 6 seed plants
- [ ] `make typecheck` passes for backend code
