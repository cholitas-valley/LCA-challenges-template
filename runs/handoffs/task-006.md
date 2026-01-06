# Task 006 Handoff: Worker Service with Threshold Evaluation and Discord Alerts

## Summary

Successfully implemented a standalone worker service that periodically evaluates plant telemetry against configured thresholds, creates alert records in the database when breaches occur, and sends Discord webhook notifications. The worker runs as a separate containerized service with graceful shutdown, database retry logic, and per-plant alert cooldown to prevent notification spam.

## Files Created

### Worker Configuration
- `worker/package.json` - Dependencies: pg, axios, zod, typescript, tsx
- `worker/tsconfig.json` - TypeScript strict mode, ES2022 target
- `worker/.dockerignore` - Excludes node_modules, src, dev files

### Database Layer
- `worker/src/db/client.ts` (39 lines) - PostgreSQL connection pool with health check
  - Connection pool with max 10 connections
  - Test connection function with error handling
  - Graceful pool closure
  
- `worker/src/db/worker-repository.ts` (110 lines) - Database queries for worker operations
  - `getAllPlants()` - Fetch all plants with threshold config
  - `getLatestTelemetry(plantId)` - Get most recent telemetry (last 5 min)
  - `getLastAlert(plantId, alertType)` - Query last alert for cooldown check
  - `createAlert()` - Insert new alert record
  - `updateLastAlertTime()` - Update plant's last_alert_sent_at timestamp

### Evaluation Logic
- `worker/src/evaluator/threshold-checker.ts` (65 lines) - Threshold evaluation logic
  - Checks soil_moisture (low/high), light (low), temperature (low/high)
  - Returns array of ThresholdBreach objects
  - Type-safe AlertType union type
  
- `worker/src/evaluator/alert-manager.ts` (82 lines) - Alert creation and cooldown
  - `shouldCreateAlert()` - Checks if cooldown period has passed
  - `processThresholdBreach()` - Creates alert and sends Discord notification
  - Logs cooldown suppression with minutes remaining
  - Graceful Discord failure handling (continues on error)

### Notifications
- `worker/src/notifications/discord.ts` (29 lines) - Discord webhook integration
  - POST request with JSON payload
  - 5-second timeout
  - Formatted message with timestamp
  - Axios error handling

### Application Entry Point
- `worker/src/index.ts` (174 lines) - Main worker loop
  - Configurable interval via WORKER_INTERVAL_SECONDS (default: 30s)
  - Database connection with exponential backoff retry (max 5 attempts)
  - Periodic evaluation cycle
  - Graceful shutdown handlers (SIGTERM, SIGINT)
  - Uncaught exception handlers

## Files Modified

### Docker Configuration
- `worker/Dockerfile` - Updated from stub to multi-stage build
  - Builder stage: installs deps, compiles TypeScript
  - Production stage: Node 20 Alpine, production deps only
  - Runs as non-root user (node)
  - Entry point: `node dist/index.js`

- `docker-compose.yml` - Added worker environment variables
  - `WORKER_INTERVAL_SECONDS` - Configurable (default: 30)
  - `DISCORD_WEBHOOK_URL` - Optional webhook URL (empty by default)

### Build System
- `Makefile` - Added worker to typecheck target
  - Runs `npm run typecheck` in worker directory if src exists

## Interfaces & Contracts

### Environment Variables
- `DATABASE_URL` - PostgreSQL connection string (required)
- `DISCORD_WEBHOOK_URL` - Discord webhook URL (optional, empty = skip Discord)
- `WORKER_INTERVAL_SECONDS` - Evaluation interval in seconds (default: 30)

### Worker Evaluation Cycle
1. Fetch all plants from database
2. For each plant, get latest telemetry (last 5 minutes)
3. Check thresholds: soil_moisture, light, temperature
4. For each breach:
   - Check cooldown (last alert timestamp + cooldown_minutes)
   - If cooldown passed: create alert and send Discord notification
   - Update plant's last_alert_sent_at timestamp
5. Log summary: plants evaluated, alerts created

### Alert Types
- `soil_moisture_low` - Soil moisture below minimum threshold
- `soil_moisture_high` - Soil moisture above maximum threshold
- `light_low` - Light level below minimum threshold
- `light_high` - Light level above maximum (not in current schema but included)
- `temp_low` - Temperature below minimum threshold
- `temp_high` - Temperature above maximum threshold

### Discord Message Format
```
🌱 **[Plant Name]** needs attention: [alert message]
_2026-01-06T16:30:00.000Z_
```

### Database Operations
- **Read**: plants (thresholds), telemetry (latest per plant), alerts (last per plant+type)
- **Write**: alerts (new records), plants (update last_alert_sent_at)
- All queries use parameterized statements (SQL injection safe)

### Alert Cooldown Logic
- Queries last alert for (plant_id, alert_type) tuple
- Calculates: `time_since_last_alert >= cooldown_minutes * 60 * 1000`
- If cooldown active: logs suppression with minutes remaining
- If cooldown passed or no previous alert: creates new alert

### Error Handling
- **Database connection failure**: Retry with exponential backoff (5 attempts)
- **Discord webhook failure**: Log error, mark sent_to_discord=false, continue
- **Missing telemetry**: Log and skip plant (no alert)
- **Database query errors**: Log and continue to next plant
- **Uncaught exceptions**: Trigger graceful shutdown

## How to Verify

### 1. Type check and build
```bash
make typecheck
npm run build --prefix worker
```
Expected: No TypeScript errors, compilation succeeds, `worker/dist/` directory created.

### 2. Verify dependencies
```bash
npm list --prefix worker pg axios zod
```
Expected: pg@8.11.3, axios@1.6.5, zod@3.22.4

### 3. Start services (without worker first)
```bash
docker compose up -d postgres mosquitto simulator backend
docker compose logs -f backend
```
Wait for backend to process telemetry for 1-2 minutes.

### 4. Check telemetry data exists
```bash
docker exec plantops-postgres psql -U plantops -d plantops -c "SELECT plant_id, COUNT(*) FROM telemetry GROUP BY plant_id;"
```
Expected: 6 plants with telemetry records.

### 5. Start worker
```bash
docker compose up -d worker
docker compose logs -f worker
```
Expected output:
- "PlantOps Worker starting..."
- "Evaluation interval: 30 seconds"
- "Database connection verified"
- "Starting evaluation cycle..."
- "Evaluating 6 plants"
- "Evaluation cycle complete: X plants evaluated, Y alerts created"

### 6. Verify alerts are created
```bash
docker exec plantops-postgres psql -U plantops -d plantops -c "SELECT * FROM alerts ORDER BY timestamp DESC LIMIT 10;"
```
Expected: Alert records if any thresholds are breached.

### 7. Test Discord notification (if webhook configured)
```bash
# Set Discord webhook in .env
DISCORD_WEBHOOK_URL=https://discord.com/api/webhooks/YOUR_WEBHOOK_ID/YOUR_WEBHOOK_TOKEN

docker compose restart worker
docker compose logs -f worker
```
Expected: "Discord notification sent for [Plant Name]: [alert_type]"

### 8. Verify cooldown logic
```bash
# Wait for an alert to be created
docker exec plantops-postgres psql -U plantops -d plantops -c "SELECT plant_id, alert_type, timestamp FROM alerts ORDER BY timestamp DESC LIMIT 5;"

# Wait 1-2 minutes (less than 60 min cooldown)
docker compose logs -f worker | grep "suppressed"
```
Expected: "Alert suppressed for [Plant Name] ([alert_type]): cooldown active (X minutes remaining)"

### 9. Test graceful shutdown
```bash
docker compose stop worker
docker compose logs worker | tail -20
```
Expected:
- "Received SIGTERM, starting graceful shutdown..."
- "Evaluation timer stopped"
- "Database pool closed"
- "Graceful shutdown complete"

### 10. Verify environment variable configuration
```bash
# Test custom interval
WORKER_INTERVAL_SECONDS=10 docker compose up -d worker
docker compose logs worker | grep "Evaluation interval"
```
Expected: "Evaluation interval: 10 seconds"

## Technical Details

### Threshold Evaluation Logic
For each plant:
1. Fetch latest telemetry (timestamp within last 5 minutes)
2. If no telemetry: skip plant (log warning)
3. If telemetry exists: check each metric
   - Soil moisture: `value < min` OR `value > max`
   - Light: `value < min`
   - Temperature: `value < min` OR `value > max`
4. Return array of breaches (can have multiple simultaneous breaches)

### Alert Creation Flow
For each breach:
1. Query last alert for (plant_id, alert_type)
2. If no previous alert: create new alert
3. If previous alert exists:
   - Calculate time since last alert
   - If >= cooldown_minutes: create new alert
   - If < cooldown_minutes: skip (log suppression)
4. Send Discord notification (if webhook configured)
5. Update plant.last_alert_sent_at timestamp

### Database Connection Management
- Pool size: 10 connections (tuned for low-frequency queries)
- Connection timeout: 5 seconds
- Idle timeout: 30 seconds
- Retry logic: exponential backoff (1s, 2s, 4s, 8s, 16s)
- Max retries: 5 attempts

### Worker Interval Timing
- Default: 30 seconds
- Configurable via WORKER_INTERVAL_SECONDS
- Evaluation runs immediately on startup, then on interval
- Graceful shutdown stops interval timer

## Next Steps / Risks

### Immediate Next Steps
1. **Integration testing** - End-to-end test with all services running
2. **Discord webhook setup** - Configure production webhook URL
3. **Monitoring** - Add health check endpoint or metrics export
4. **Alert history API** - Expose alerts via REST API for frontend display

### Follow-up Tasks
- Add structured logging (JSON format) for better observability
- Add metrics export (Prometheus format) for monitoring
- Consider adding alert resolution logic (mark alerts as resolved)
- Add WebSocket notifications for real-time frontend updates
- Implement alert aggregation (single notification for multiple breaches)

### Known Risks/Considerations

1. **No health check endpoint** - Current health check uses `ps aux | grep node` which is basic. Consider adding HTTP health endpoint.

2. **Telemetry window** - Worker only checks telemetry from last 5 minutes. If simulator stops, plants won't be evaluated. This is intentional (prevents stale alerts) but should be documented.

3. **Cooldown per alert type** - Cooldown is tracked per (plant_id, alert_type) tuple, not globally per plant. A plant can have simultaneous soil_moisture_low and temp_low alerts. This may be too noisy.

4. **No max alerts limit** - If thresholds are constantly breached, cooldown will create alerts every 60 minutes indefinitely. Consider adding daily/weekly limits.

5. **Discord rate limits** - Discord webhooks have rate limits (30 requests per minute per webhook). High-frequency alerts could hit this limit. Current implementation has no retry or backoff for Discord errors.

6. **Database lock contention** - Worker and backend both update the plants table (last_alert_sent_at). At current scale this is fine, but high-frequency updates could cause lock contention.

7. **No alert prioritization** - All alerts are treated equally. Consider adding severity levels (warning, critical) for different threshold margins.

8. **Timezone handling** - All timestamps are UTC. Discord messages show ISO 8601 UTC timestamps, which may not be user-friendly. Consider formatting for user's timezone.

9. **Single worker instance** - Current design assumes single worker. Multiple workers would cause duplicate alerts (no distributed locking). If scaling needed, implement leader election or distributed lock.

10. **No alert deduplication** - If simulator sends duplicate telemetry (QoS 1), worker may evaluate same data multiple times within 5-minute window. Cooldown prevents duplicate alerts, but evaluation is wasted. Consider caching evaluated telemetry timestamps.

### Performance Characteristics
- **Evaluation frequency**: Every 30 seconds (configurable)
- **Database queries per cycle**: 1 (plants) + N (telemetry) + M (alerts) where N=6 plants, M=breaches
- **Expected throughput**: Low (6 plants, ~1 query per second average)
- **Memory footprint**: <50 MB (small connection pool, no data buffering)
- **CPU usage**: Minimal (mostly I/O bound, waiting on database)

### Production Readiness
- [x] TypeScript strict mode
- [x] Graceful shutdown
- [x] Database retry logic
- [x] Error logging
- [x] Docker multi-stage build
- [x] Non-root container user
- [ ] Structured logging (JSON)
- [ ] Metrics/monitoring
- [ ] Health check endpoint
- [ ] Alert rate limiting
- [ ] Distributed locking (for multi-instance)
- [ ] Unit tests
- [ ] Integration tests

## Integration Points

1. **Worker → PostgreSQL**: Reads plants, telemetry; writes alerts
2. **Worker → Discord**: HTTP webhook for notifications (optional)
3. **Backend → PostgreSQL**: Writes telemetry (consumed by worker)
4. **Simulator → MQTT → Backend → PostgreSQL → Worker** (full data flow)

All TypeScript code compiles cleanly with strict mode, uses ES modules (`.js` imports), and follows project conventions established in backend/simulator services.
