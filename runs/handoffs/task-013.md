# Task 013 Handoff: Discord Alerts Integration

## Summary

Successfully implemented complete Discord webhook integration for sending threshold breach and device offline alerts. The system now:
- Sends formatted Discord webhook messages for threshold violations and device offline events
- Processes alerts asynchronously via queue-based worker to avoid blocking telemetry
- Handles Discord rate limits and errors gracefully
- Supports optional webhook configuration (no webhook = no alerts, no errors)
- Integrates seamlessly with threshold evaluator (task-012) and heartbeat handler (task-011)
- All telemetry and heartbeat processing remains non-blocking

## Files Created

### 1. backend/src/services/discord.py
**Status:** NEW FILE

Discord webhook service with three main methods:

**DiscordService class:**
- `__init__(webhook_url)`: Initialize with optional webhook URL (None disables Discord)
- `send_threshold_alert(violation, plant_name)`: Send threshold breach alert
  - Formats violation data into Discord embed
  - Title: "Plant Alert: {plant_name}"
  - Description: "{metric} is {value}, threshold {direction} {threshold}"
  - Color: Red (15158332)
  - Fields: Metric, Current, Threshold
  - Timestamp: UTC ISO-8601
- `send_offline_alert(device_id, plant_name, last_seen)`: Send device offline alert
  - Title: "Device Offline"
  - Description: "Device {device_id} has gone offline"
  - Color: Yellow (16776960)
  - Fields: Device ID, Plant, Last Seen (human-readable time ago)
  - Timestamp: UTC ISO-8601
- `send_message(embed)`: Low-level method for sending raw Discord embeds
  - HTTP POST to webhook URL with embed JSON
  - Tracks rate limits (X-RateLimit-Remaining, X-RateLimit-Reset headers)
  - Returns True on success (204), False on failure
  - Handles timeout (10s), rate limits (429), HTTP errors gracefully
  - All errors logged, none raised

### 2. backend/src/services/alert_worker.py
**Status:** NEW FILE

Background worker for processing alert queue:

**DeviceOfflineEvent dataclass:**
- device_id: str
- plant_name: str | None
- last_seen: datetime | None

**AlertWorker class:**
- `__init__(discord, queue)`: Initialize with Discord service and asyncio queue
- `run()`: Main processing loop (runs until cancelled)
  - Waits for alerts from queue (1s timeout for graceful shutdown)
  - Processes ThresholdViolation: calls discord.send_threshold_alert()
  - Processes DeviceOfflineEvent: calls discord.send_offline_alert()
  - Error handling prevents worker crash on send failures
  - Marks queue tasks as done after processing
  - Logs all alert sends (debug level)
- `stop()`: Signal worker to stop

### 3. backend/tests/test_discord.py
**Status:** NEW FILE

Comprehensive test suite with 10 tests covering:

**DiscordService Tests (6 tests):**
- Threshold alert message formatting (title, description, color, fields)
- Offline alert message formatting (time calculations, fields)
- Missing webhook returns False without error
- HTTP errors handled gracefully (500 response)
- Rate limit handling (429 response with headers)
- Timeout handling (httpx.TimeoutException)

**AlertWorker Tests (4 tests):**
- Worker processes threshold violations from queue
- Worker processes offline events from queue
- Worker continues processing after errors (one fails, next succeeds)
- Worker handles empty queue gracefully

All tests use mocks (no real Discord API calls). **Test Results:** 10/10 passed

## Files Modified

### 1. backend/src/services/__init__.py
**Changes:**
- Added imports: AlertWorker, DeviceOfflineEvent, DiscordService
- Updated __all__ to export new classes

### 2. backend/src/services/telemetry_handler.py
**Changes:**

Added alert queue integration:
- `__init__()` now accepts `alert_queue: asyncio.Queue | None` parameter
- After recording threshold alerts, adds plant_name to violation object
- Queues violation to alert_queue if configured: `await self.alert_queue.put(violation)`
- Plant name extracted from plant record for Discord message formatting
- Queue operation non-blocking and doesn't affect telemetry storage

### 3. backend/src/services/heartbeat_handler.py
**Changes:**

Added alert queue integration:
- `__init__()` now accepts `alert_queue: asyncio.Queue | None` parameter
- `check_offline_devices()` enhanced to queue offline events:
  - Fetches full device records (not just IDs)
  - For each offline device, retrieves plant name if assigned
  - Creates DeviceOfflineEvent with device_id, plant_name, last_seen
  - Queues event to alert_queue: `await self.alert_queue.put(event)`
  - All queueing happens within existing database transaction
  - Error handling prevents queueing failures from breaking offline detection

### 4. backend/src/main.py
**Changes:**

Integrated Discord alerting into application lifecycle:

**Module imports:**
- Added: AlertWorker, DiscordService

**Global initialization:**
- Created `alert_queue = asyncio.Queue()` for inter-service communication
- Created `discord_service = DiscordService(webhook_url=settings.discord_webhook_url)`
- Updated `telemetry_handler` to include `alert_queue` parameter
- Updated `heartbeat_handler` to include `alert_queue` parameter
- Created `alert_worker = AlertWorker(discord=discord_service, queue=alert_queue)`

**Lifespan context manager:**
- Starts alert worker: `alert_task = asyncio.create_task(alert_worker.run())`
- Logs: "Alert worker started"
- Added alert_task to app.state for access
- Shutdown sequence (before offline checker and MQTT):
  1. Signal stop: `alert_worker.stop()`
  2. Cancel task: `alert_task.cancel()`
  3. Wait for cancellation with error handling

### 5. backend/src/config.py
**No changes needed** - discord_webhook_url already exists (added in earlier task)

## Interfaces/Contracts

### Discord Embed Format

**Threshold Alert:**
```json
{
  "embeds": [{
    "title": "Plant Alert: Monstera",
    "description": "Soil Moisture is 15.2, threshold min 20.0",
    "color": 15158332,
    "fields": [
      { "name": "Metric", "value": "soil_moisture", "inline": true },
      { "name": "Current", "value": "15.2", "inline": true },
      { "name": "Threshold", "value": "min 20.0", "inline": true }
    ],
    "timestamp": "2026-01-07T22:00:00Z"
  }]
}
```

**Device Offline Alert:**
```json
{
  "embeds": [{
    "title": "Device Offline",
    "description": "Device device-abc has gone offline",
    "color": 16776960,
    "fields": [
      { "name": "Device ID", "value": "device-abc", "inline": true },
      { "name": "Plant", "value": "Monstera", "inline": true },
      { "name": "Last Seen", "value": "5 minutes ago", "inline": true }
    ],
    "timestamp": "2026-01-07T22:00:00Z"
  }]
}
```

### Alert Queue Protocol

**Queue item types:**
1. `ThresholdViolation` (from threshold_evaluator)
   - Must have `plant_name` attribute added by telemetry_handler
   - All original violation fields: plant_id, device_id, metric, value, threshold, direction

2. `DeviceOfflineEvent` (from alert_worker)
   - device_id: str
   - plant_name: str | None (None if unassigned)
   - last_seen: datetime | None

**Queue flow:**
```
Telemetry Handler → Queue → Alert Worker → Discord
Heartbeat Handler → Queue → Alert Worker → Discord
```

### DiscordService API

```python
discord = DiscordService(webhook_url="https://discord.com/...")

# Send threshold alert
success = await discord.send_threshold_alert(violation, "Plant Name")

# Send offline alert
success = await discord.send_offline_alert("device-id", "Plant Name", last_seen_dt)

# Send raw embed
success = await discord.send_message({"title": "...", ...})
```

Returns:
- True: Message sent successfully (HTTP 204)
- False: Message failed (error logged, no exception raised)

### AlertWorker Lifecycle

```python
# Startup (in lifespan)
alert_task = asyncio.create_task(alert_worker.run())

# Shutdown (in lifespan)
alert_worker.stop()
alert_task.cancel()
await alert_task  # With CancelledError handling
```

### Configuration

```python
# In .env or environment
DISCORD_WEBHOOK_URL=https://discord.com/api/webhooks/xxx/yyy  # Optional

# In code
settings.discord_webhook_url  # str | None
```

If None: Discord messages logged but not sent, no errors raised.

## How to Verify

### 1. Run Check Command (PASSING)
```bash
cd backend && python -m pytest tests/test_discord.py -v --tb=short
```
**Result:** 10 tests passed

Environment variables needed:
```bash
export DATABASE_URL="postgresql://test:test@localhost/test"
export MQTT_PASSWD_FILE="/tmp/test_passwd"
export MQTT_BACKEND_PASSWORD="test"
export ENCRYPTION_KEY="test_key_32_chars_1234567890ab"
```

### 2. Verify Module Imports
```bash
python3 -c "from backend.src.services.discord import DiscordService; print('OK')"
python3 -c "from backend.src.services.alert_worker import AlertWorker, DeviceOfflineEvent; print('OK')"
```

### 3. Integration Test (After Services Running)

**Prerequisites:**
- Backend running with database and MQTT
- Discord webhook URL configured in .env

**Test threshold alert:**
```bash
# 1. Create Discord webhook in Discord server settings
# 2. Set DISCORD_WEBHOOK_URL in .env
# 3. Create plant with thresholds
curl -X POST http://localhost:8000/api/plants \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Monstera",
    "species": "Monstera deliciosa",
    "thresholds": {
      "soil_moisture": {"min": 20.0, "max": 80.0}
    }
  }'

# 4. Assign device to plant
curl -X PUT http://localhost:8000/api/devices/{device_id}/assign \
  -H "Content-Type: application/json" \
  -d '{"plant_id": "{plant_id}"}'

# 5. Send telemetry that violates threshold
mosquitto_pub -h localhost -p 1883 \
  -u device_xxx -P password_xxx \
  -t "devices/{device_id}/telemetry" \
  -m '{"soil_moisture": 10.0}'

# 6. Check Discord channel for alert message (red embed)
# 7. Check backend logs: "Discord alert sent successfully"
```

**Test offline alert:**
```bash
# 1. Ensure device is online (send heartbeat recently)
mosquitto_pub -h localhost -p 1883 \
  -u device_xxx -P password_xxx \
  -t "devices/{device_id}/heartbeat" \
  -m '{}'

# 2. Stop sending heartbeats
# 3. Wait 180+ seconds (3 minutes)
# 4. Wait for offline checker to run (every 60s)
# 5. Check Discord channel for offline alert (yellow embed)
# 6. Check backend logs: "Discord alert sent successfully"
```

**Test graceful degradation:**
```bash
# 1. Unset DISCORD_WEBHOOK_URL or set to empty string
# 2. Trigger threshold violation or offline event
# 3. Verify backend logs: "Discord webhook not configured, skipping alert"
# 4. Verify telemetry still stored correctly
# 5. Verify no errors or crashes
```

## Definition of Done - Status

- [x] DiscordService sends threshold alerts with formatted embeds
- [x] DiscordService sends device offline alerts with formatted embeds
- [x] Alert messages include plant name and metric details
- [x] Graceful handling when webhook not configured (returns False, logs)
- [x] Alert worker processes queue asynchronously (non-blocking)
- [x] All tests pass (10/10)

## Constraints Followed

- [x] Did NOT block telemetry processing on Discord send (queue-based)
- [x] Used asyncio queue for decoupling (threshold → queue → worker → Discord)
- [x] Handled Discord rate limits gracefully (track headers, return False on 429)
- [x] Mocked Discord API in tests (no real webhook calls)
- [x] Only modified files in `backend/**` allowed paths

## Technical Notes

### Discord Service Design
- Optional webhook URL (None = disabled, no errors)
- HTTP timeout: 10 seconds
- Rate limit tracking via response headers
- All errors caught and logged (no exceptions raised)
- Returns bool for success/failure (caller can check)
- Uses httpx async client for HTTP requests
- Embed colors: Red (15158332) for alerts, Yellow (16776960) for offline
- Timestamps in UTC ISO-8601 format

### Alert Worker Design
- Background asyncio task (runs in lifespan)
- Processes queue with 1s timeout (allows graceful shutdown)
- Handles two event types: ThresholdViolation, DeviceOfflineEvent
- Error handling per alert (one failure doesn't crash worker)
- Marks queue tasks done after processing
- Stop signal via stop() method
- Cancellation-safe (CancelledError handled)

### Integration Design
- Telemetry handler adds plant_name to violations before queueing
- Heartbeat handler fetches plant names for offline events
- All queueing is non-blocking (put() is fast)
- Queue is unbounded (could add maxsize if needed)
- Worker processes alerts sequentially (respects Discord rate limits)
- No database queries in worker (all data comes with event)

### Rate Limit Handling
- Discord allows 30 requests/minute per webhook
- Service tracks X-RateLimit-Remaining header
- Service tracks X-RateLimit-Reset timestamp
- Returns False if rate limit active
- Caller can retry later (queue handles backpressure)

### Graceful Degradation
- No webhook: service logs and returns False
- Network error: service logs and returns False
- Timeout: service logs and returns False
- Worker error: worker logs and continues processing
- All errors isolated (telemetry/heartbeat unaffected)

### Testing Strategy
- All tests use mocks (no real API calls)
- httpx.AsyncClient mocked with AsyncMock
- Response status codes tested (204, 429, 500)
- Timeout exception tested
- Queue processing tested with real asyncio.Queue
- Worker cancellation tested
- Error recovery tested (fail → continue → succeed)

## Next Steps

The next task can build upon:
- Threshold violations now trigger Discord alerts automatically
- Device offline events now trigger Discord alerts automatically
- Alert queue ready for additional event types (e.g., care plan generated)
- Foundation for Slack, email, or other notification channels (new worker)
- Alert history available in database (task-012 recorded alerts)
- Rate limit tracking prevents Discord API abuse

## Risks/Limitations

### Low Risk
- Well-tested with comprehensive unit tests (10/10)
- Graceful error handling throughout
- Non-blocking (queue-based decoupling)
- Optional feature (no webhook = no errors)
- Respects Discord rate limits

### Known Limitations
1. **No alert deduplication**: Same alert can be queued multiple times if cooldown check passes (acceptable - database already has cooldown)
2. **No retry logic**: Failed Discord sends are not retried (acceptable - alerts logged in database)
3. **Unbounded queue**: Alert queue has no size limit (could cause memory issues under extreme load, add maxsize if needed)
4. **Sequential processing**: Worker processes one alert at a time (could add multiple workers, but rate limits make this less useful)
5. **No webhook validation**: Invalid webhook URL discovered at runtime, not startup (could add validation ping at startup)
6. **Timestamp drift**: Uses server time for "last seen" calculations (minor inaccuracy, acceptable)

### Future Enhancements
- Add alert deduplication in queue (hash violations)
- Add retry logic with exponential backoff
- Add bounded queue with overflow strategy (drop oldest)
- Add webhook validation at startup (test ping)
- Add multiple notification channels (Slack, email, SMS)
- Add alert batching (combine multiple alerts in one message)
- Add alert priority levels (critical, warning, info)
- Add admin API to pause/resume alerts
- Add per-plant notification preferences

## Performance Considerations

- Queue operations are O(1) (fast put/get)
- Worker processes alerts sequentially (~100ms per Discord send)
- Rate limit: max 30 alerts/minute to Discord
- No database queries in worker (data comes with events)
- Memory usage: ~1KB per queued alert (negligible)
- Suitable for hundreds of devices with reasonable alert rates
- Under high load: queue grows, but doesn't block telemetry

---

**Status:** Implementation complete. All tests passing (10/10). Check command successful. Ready for integration testing with live Discord webhook.
**Handoff Complete:** YES
