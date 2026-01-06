---
task_id: task-004
title: Backend MQTT subscriber and database ingestion
role: lca-backend
post: [lca-docs]
depends_on: [task-003]
inputs:
  - runs/plan.md
  - runs/handoffs/task-003.md
  - backend/package.json
  - database/schema.sql
allowed_paths:
  - backend/src/**
  - backend/package.json
  - backend/package-lock.json
  - backend/Dockerfile
  - backend/.dockerignore
check_command: make typecheck && cd backend && npm run build
handoff: runs/handoffs/task-004.md
---

## Goal

Implement the backend MQTT subscriber that:
1. Connects to the Mosquitto MQTT broker
2. Subscribes to `plants/+/telemetry` topic with QoS 1
3. Validates incoming telemetry payloads using Zod
4. Inserts telemetry data into the TimescaleDB `telemetry` hypertable
5. Handles reconnection, error recovery, and graceful shutdown
6. Provides logging for debugging

## Scope

**Install dependencies:**
- Add `mqtt@^5.3.5` to backend/package.json
- Add `zod@^3.22.4` to backend/package.json

**Create files:**
- `backend/src/mqtt/client.ts` - MQTT connection singleton with reconnection logic
- `backend/src/mqtt/subscriber.ts` - Topic subscription and message handler
- `backend/src/schema/telemetry.ts` - Zod validation schema for telemetry payloads
- `backend/src/db/telemetry-repository.ts` - Database insert logic with batching (100 messages OR 2 seconds)

**Update files:**
- `backend/src/index.ts` - Initialize MQTT subscriber on startup
- `.env.example` - Add MQTT_BROKER_URL and MQTT_CLIENT_ID

**Telemetry schema validates:**
- `timestamp` (ISO 8601 string, converted to Date)
- `soil_moisture` (number, 0-100)
- `light` (number, 0-100)
- `temperature` (number, 15-35)

**MQTT client features:**
- Connect to `mqtt://mosquitto:1883` (read from env: `MQTT_BROKER_URL`)
- Reconnect automatically with exponential backoff (max 30 seconds)
- Log connection, disconnection, error events to console
- Subscribe to `plants/+/telemetry` with QoS 1

**Message handler:**
- Extract `plant_id` from topic path (`plants/<plant_id>/telemetry`)
- Parse JSON payload
- Validate with Zod schema
- Add to batch buffer
- Log validation errors (do not crash on invalid messages)

**Database repository:**
- Batch inserts: flush when buffer reaches 100 messages OR 2 seconds elapsed
- Use parameterized query: `INSERT INTO telemetry (timestamp, plant_id, soil_moisture, light, temperature) VALUES ... ON CONFLICT DO NOTHING`
- Handle database errors gracefully (log error, continue processing)
- Clear timer on graceful shutdown

**Graceful shutdown:**
- Handle SIGTERM/SIGINT signals
- Flush remaining batch before closing
- Unsubscribe from MQTT topics
- Close MQTT connection
- Close database pool

## Constraints

- Use existing `pg` connection pool from task-002 (database/init.sql already set up)
- Must handle duplicate messages (use `ON CONFLICT DO NOTHING`)
- Must respect MQTT QoS 1 (at-least-once delivery)
- Plant IDs must match database seed: `monstera`, `snake-plant`, `pothos`, `fiddle-leaf`, `spider-plant`, `peace-lily`
- Use TypeScript strict mode
- No hardcoded values (read MQTT_BROKER_URL from environment)

## Definition of Done

- [ ] Backend package.json includes `mqtt@^5.3.5` and `zod@^3.22.4`
- [ ] All files created as specified in Scope
- [ ] MQTT client connects and subscribes to `plants/+/telemetry`
- [ ] Telemetry validation schema created with Zod
- [ ] Batch insert logic implemented (100 messages OR 2 seconds)
- [ ] Graceful shutdown handlers registered
- [ ] Environment variables added to `.env.example`
- [ ] `make typecheck` passes for backend
- [ ] `cd backend && npm run build` succeeds
- [ ] Integration verified:
  - `docker compose up -d postgres mosquitto simulator backend`
  - Backend logs show MQTT connection successful
  - Telemetry data appears in TimescaleDB within 10 seconds
  - `docker exec plantops-postgres psql -U plantops -d plantops -c "SELECT COUNT(*) FROM telemetry;"` shows increasing count
- [ ] Handoff file created at `runs/handoffs/task-004.md`
