---
task_id: task-006
title: Worker service with threshold evaluation and Discord alerts
role: lca-backend
post: [lca-docs]
depends_on: [task-004, task-005]
inputs:
  - runs/plan.md
  - runs/handoffs/task-004.md
  - runs/handoffs/task-005.md
  - database/schema.sql
allowed_paths:
  - worker/**
  - docker-compose.yml
  - .env.example
check_command: make typecheck && cd worker && npm run build
handoff: runs/handoffs/task-006.md
---

## Goal

Implement a worker service that:
1. Periodically evaluates recent telemetry against plant-specific thresholds
2. Creates alert records in the database when thresholds are breached
3. Sends Discord webhook notifications for new alerts
4. Implements per-plant alert cooldown to prevent spam
5. Runs as a separate containerized service

This worker ensures plants get timely attention when sensor readings indicate problems.

## Scope

**Create worker service structure:**
- `worker/package.json` - Node.js dependencies (pg, zod, discord webhook library)
- `worker/tsconfig.json` - TypeScript configuration (strict mode, ES2022)
- `worker/src/index.ts` - Main worker loop with graceful shutdown
- `worker/src/evaluator/threshold-checker.ts` - Threshold evaluation logic
- `worker/src/evaluator/alert-manager.ts` - Alert creation and cooldown logic
- `worker/src/notifications/discord.ts` - Discord webhook integration
- `worker/src/db/worker-repository.ts` - Database queries for plants and telemetry
- `worker/Dockerfile` - Multi-stage build (Node 20 Alpine)
- `worker/.dockerignore` - Standard Node.js excludes

**Install dependencies:**
- `pg@^8.11.3` - PostgreSQL client
- `@types/pg@^8.10.9` - TypeScript types
- `axios@^1.6.5` - HTTP client for Discord webhooks
- `zod@^3.22.4` - Schema validation
- `tsx@^4.7.0` - TypeScript execution (dev)
- `typescript@^5.3.3` - TypeScript compiler

**Update files:**
- `docker-compose.yml` - Add worker service definition
- `.env.example` - Add DISCORD_WEBHOOK_URL, WORKER_INTERVAL_SECONDS=30

**Worker logic:**

1. **Main loop (every 30 seconds):**
   - Fetch all plants with their thresholds
   - For each plant, get the most recent telemetry (last 5 minutes)
   - Evaluate thresholds
   - Create alerts if breached and cooldown period has passed
   - Send Discord notifications for new alerts
   - Log processing summary

2. **Threshold evaluation:**
   - Check soil_moisture: alert if < soil_moisture_min OR > soil_moisture_max
   - Check light: alert if < light_min OR > light_max
   - Check temperature: alert if < temp_min OR > temp_max
   - Use the LATEST telemetry reading for each plant

3. **Alert cooldown logic:**
   - Query most recent alert for (plant_id, alert_type) combination
   - If last_alert_at + cooldown_minutes < now, create new alert
   - Otherwise, skip (log that alert was suppressed due to cooldown)

4. **Alert creation:**
   - Insert into alerts table: (timestamp, plant_id, alert_type, message, sent_to_discord)
   - alert_type: "soil_moisture_low" | "soil_moisture_high" | "light_low" | "light_high" | "temp_low" | "temp_high"
   - Generate human-readable message: "🌱 [Plant Name] needs attention: Soil moisture is low (15%)"

5. **Discord notifications:**
   - Send POST to DISCORD_WEBHOOK_URL with JSON payload
   - Format: `{ content: "[timestamp] 🌱 [Plant Name] needs attention: [alert message]" }`
   - Set sent_to_discord=true on success, false on failure
   - Log Discord API errors (do not crash worker)
   - If DISCORD_WEBHOOK_URL is empty/not set, skip Discord but still create alert records

6. **Graceful shutdown:**
   - Handle SIGTERM/SIGINT
   - Complete current evaluation cycle
   - Close database connections
   - Exit cleanly

## Constraints

- Worker runs independently from backend (separate container)
- Use same PostgreSQL connection as backend (shared database)
- Evaluation interval: configurable via WORKER_INTERVAL_SECONDS (default: 30)
- Must handle database connection errors (retry with exponential backoff, max 5 attempts)
- Must handle Discord webhook failures gracefully (log error, continue processing)
- Alert cooldown: use alert_cooldown_minutes from plants table (default: 30 minutes per plant)
- Use TypeScript strict mode
- No hardcoded values (read from environment variables)

## Definition of Done

- [ ] Worker directory structure created with all files
- [ ] worker/package.json includes all required dependencies
- [ ] worker/tsconfig.json configured with strict mode
- [ ] All source files created as specified in Scope
- [ ] Threshold evaluation logic implemented for all 3 metrics
- [ ] Alert cooldown logic prevents spam (respects alert_cooldown_minutes)
- [ ] Discord webhook integration working (with graceful failure handling)
- [ ] Database queries use parameterized statements
- [ ] Graceful shutdown handlers registered
- [ ] worker/Dockerfile builds successfully
- [ ] docker-compose.yml includes worker service with health check
- [ ] Environment variables added to `.env.example`
- [ ] `make typecheck` passes for worker (update Makefile if needed)
- [ ] `cd worker && npm run build` succeeds
- [ ] Integration testing verified:
  - `docker compose up -d postgres mosquitto simulator backend worker`
  - Worker logs show evaluation cycle every 30 seconds
  - Alerts created in database when thresholds breached
  - Discord webhook receives notifications (if configured)
  - `docker exec plantops-postgres psql -U plantops -d plantops -c "SELECT * FROM alerts ORDER BY timestamp DESC LIMIT 10;"` shows alerts
  - Cooldown prevents duplicate alerts within 30 minutes
- [ ] Handoff file created at `runs/handoffs/task-006.md`

## Implementation Notes

**Threshold breach detection:**
```typescript
// Example logic for soil moisture
if (latestTelemetry.soil_moisture < plant.soil_moisture_min) {
  alertType = 'soil_moisture_low';
  message = `Soil moisture is low (${latestTelemetry.soil_moisture}%)`;
}
```

**Cooldown check:**
```sql
SELECT timestamp FROM alerts 
WHERE plant_id = $1 AND alert_type = $2 
ORDER BY timestamp DESC LIMIT 1;
```

**Discord webhook payload:**
```json
{
  "content": "🌱 **Monstera** needs attention: Soil moisture is low (15%)\n_2026-01-06 16:30:00 UTC_"
}
```

**Worker service definition (docker-compose.yml):**
```yaml
worker:
  build: ./worker
  container_name: plantops-worker
  environment:
    DATABASE_URL: postgresql://plantops:plantops@postgres:5432/plantops
    DISCORD_WEBHOOK_URL: ${DISCORD_WEBHOOK_URL}
    WORKER_INTERVAL_SECONDS: ${WORKER_INTERVAL_SECONDS:-30}
  depends_on:
    - postgres
  restart: unless-stopped
```
