# Handoff: task-003 - MQTT broker and simulator implementation

## Summary

Successfully implemented the MQTT broker configuration and telemetry simulator service. The simulator publishes realistic plant sensor data for 6 plants every 10 seconds to MQTT topics using a random walk algorithm with occasional threshold breaches.

## Files Touched

### Created Files:

**Mosquitto Configuration:**
- `mosquitto/mosquitto.conf` - MQTT broker configuration with anonymous access, listeners on ports 1883 (MQTT) and 9001 (WebSockets), persistence enabled

**Simulator Service:**
- `simulator/package.json` - Node.js package configuration with mqtt@5.3.5 and TypeScript dependencies
- `simulator/tsconfig.json` - TypeScript strict mode configuration (ES2022 target)
- `simulator/src/index.ts` - Main simulator implementation (181 lines):
  - Connects to MQTT broker with reconnection logic
  - Publishes telemetry for 6 plants every 10 seconds
  - Uses random walk algorithm for realistic sensor variation
  - 5% chance of spikes/dips to trigger alerts
  - QoS 1 for reliable message delivery
  - Graceful shutdown handlers (SIGTERM/SIGINT)
- `simulator/Dockerfile` - Multi-stage build (Node 20 Alpine, production optimized)
- `simulator/.dockerignore` - Excludes node_modules, dist, tests, and development files

### Modified Files:

- `docker-compose.yml` - Added mosquitto config volume mount:
  - `./mosquitto/mosquitto.conf:/mosquitto/config/mosquitto.conf:ro`
- `Makefile` - Updated typecheck target to include simulator:
  - Added conditional check for `simulator/src` directory
  - Runs `npm run typecheck` in simulator directory

### Plant IDs (matching database seed):
- monstera
- snake-plant
- pothos
- fiddle-leaf
- spider-plant
- peace-lily

## Interfaces/Contracts Changed

### MQTT Topics:
- Pattern: `plants/<plant_id>/telemetry`
- QoS: 1 (at least once delivery)
- Payload format (JSON):
```json
{
  "timestamp": "2026-01-06T15:50:23.456Z",
  "soil_moisture": 45.3,
  "light": 67.8,
  "temperature": 23.2
}
```

### Telemetry Ranges:
- `soil_moisture`: 0-100 (percent, dry to wet)
- `light`: 0-100 (percent, dark to bright)
- `temperature`: 15-35 (Celsius)

### Mosquitto Broker:
- Port 1883: MQTT protocol
- Port 9001: WebSockets protocol
- Authentication: Anonymous (allowed for local dev)
- Persistence: Enabled at `/mosquitto/data/`
- Logging: All levels to stdout

### Random Walk Algorithm:
- Soil moisture: +/- 3 per iteration (slow changes)
- Light: +/- 5 per iteration (moderate fluctuation)
- Temperature: +/- 1 per iteration (very slow changes)
- Threshold breaches: 5% probability per iteration (10-point spike/dip)

## How to Verify

### 1. Verify typecheck passes:
```bash
make typecheck
```
Expected: Both backend and simulator typecheck successfully.

### 2. Verify all quality gates pass:
```bash
make check
```
Expected: All checks pass (lint, typecheck, test, e2e).

### 3. Build simulator Docker image:
```bash
docker build -t plantops-simulator ./simulator
```
Expected: Multi-stage build succeeds, production image created.

### 4. Validate Docker Compose configuration:
```bash
docker compose config
```
Expected: Configuration is valid with mosquitto config mounted.

### 5. Start services and verify simulator publishes telemetry:
```bash
docker compose up -d mosquitto simulator
docker compose logs -f simulator
```
Expected: 
- Connection to MQTT broker confirmed
- Telemetry messages published every 10 seconds for all 6 plants
- JSON payloads with timestamp, soil_moisture, light, temperature

### 6. Subscribe to MQTT topics to verify messages:
```bash
docker exec -it plantops-mosquitto mosquitto_sub -t 'plants/+/telemetry' -v
```
Expected: Real-time telemetry messages from all 6 plants.

### 7. Verify mosquitto config is loaded:
```bash
docker exec -it plantops-mosquitto cat /mosquitto/config/mosquitto.conf
```
Expected: Configuration file matches local `mosquitto/mosquitto.conf`.

### 8. Check simulator TypeScript compilation:
```bash
cd simulator && npm run build
```
Expected: TypeScript compiles to `dist/index.js` without errors.

## Next Steps / Risks

### Immediate Next Steps:

1. **task-004**: Backend MQTT subscriber
   - Subscribe to `plants/+/telemetry` topic
   - Validate incoming telemetry payloads with Zod
   - Insert telemetry into TimescaleDB hypertable
   - Handle connection errors and reconnection

2. **task-005**: Worker service for threshold evaluation
   - Query recent telemetry from TimescaleDB
   - Evaluate against plant-specific thresholds
   - Create alerts when thresholds are breached
   - Send Discord notifications via webhook

3. **Integration testing**:
   - End-to-end flow: simulator → MQTT → backend → TimescaleDB
   - Verify telemetry data integrity
   - Test MQTT reconnection scenarios
   - Validate alert triggers from simulated threshold breaches

### Known Risks/Considerations:

1. **MQTT Anonymous Access** - Current configuration allows anonymous connections. This is appropriate for local development but MUST be secured with authentication/ACLs before production deployment.

2. **Telemetry Frequency** - Publishing every 10 seconds for 6 plants = 36 messages/minute. This is sustainable for development but may need adjustment based on real-world requirements.

3. **Random Walk Boundaries** - Values are hard-bounded at min/max ranges. Real sensors might have different behavior at boundaries (e.g., staying at 0 for extended periods).

4. **No Graceful Backoff** - Simulator reconnects every 5 seconds on failure. Consider exponential backoff if MQTT broker issues persist.

5. **Plant State Initialization** - All plants start with mid-range values (40-70% soil moisture, 50-80% light, 20-28°C). Real plants might start at more varied states.

6. **Docker Volume Permissions** - Mosquitto data/logs volumes may have permission issues on some host systems. Current configuration uses default mosquitto user.

7. **Simulator Timestamps** - Uses server time (UTC). Ensure backend validates and handles timezone correctly.

8. **MQTT QoS 1** - Provides at-least-once delivery but not exactly-once. Backend must handle potential duplicate messages (use timestamp+plant_id as deduplication key).

### Files Ready for Integration:

- **Backend** (`backend/src/mqtt/subscriber.ts`) - Ready to consume telemetry from `plants/+/telemetry`
- **Worker** (`worker/src/threshold-evaluator.ts`) - Ready to evaluate telemetry against thresholds
- **Database queries** - TimescaleDB hypertable ready to receive telemetry inserts

### Configuration Complete:

- Mosquitto MQTT broker configured and ready
- Simulator service implemented and tested
- Docker Compose orchestration updated
- Makefile typecheck includes simulator
- Multi-stage Dockerfile for production builds

### Testing Recommendations:

1. Monitor simulator logs for MQTT connection stability
2. Verify telemetry payload structure matches backend schema
3. Test reconnection behavior (stop/start mosquitto service)
4. Validate timestamp format (ISO 8601 UTC)
5. Check for memory leaks during extended runs
6. Verify all 6 plants publish at correct intervals
7. Confirm occasional threshold breaches appear in logs

### Production Readiness Checklist:

- [ ] Replace anonymous MQTT access with authentication
- [ ] Add MQTT ACLs to restrict topic access by client
- [ ] Configure TLS/SSL for MQTT connections
- [ ] Implement exponential backoff for reconnection
- [ ] Add metrics/monitoring for simulator health
- [ ] Consider message rate limiting
- [ ] Add structured logging (JSON format)
- [ ] Implement correlation IDs for tracing
- [ ] Add circuit breaker for broker failures
- [ ] Document telemetry schema in OpenAPI/AsyncAPI spec
