# Task 011 Handoff: Device Heartbeat and Status Tracking

## Summary

Implemented complete device heartbeat handling and automatic offline detection system. The system now:
- Receives heartbeat messages from devices via MQTT
- Updates device `last_seen_at` timestamp and sets status to 'online'
- Runs background task every 60 seconds to detect offline devices
- Marks devices as offline after 3 missed heartbeats (180 seconds)
- Returns list of newly offline devices (ready for alerting in task-013)
- Gracefully handles unknown devices and network errors

## Files Created

### 1. backend/src/services/heartbeat_handler.py
**Status:** NEW FILE

`HeartbeatHandler` class with configurable timeout (default 180s):
- `handle_heartbeat(device_id, payload)`: Processes heartbeat MQTT messages
  - Updates device.last_seen_at to current timestamp
  - Sets device status to 'online' (even if previously offline)
  - Validates device exists before updating
  - Logs warnings for unknown devices
  - Error handling doesn't raise (fault tolerant for MQTT processing)

- `check_offline_devices()`: Finds and marks stale devices as offline
  - Queries devices with last_seen_at > timeout_seconds ago
  - Only considers currently 'online' devices (avoids re-marking)
  - Updates status to 'offline' in single batch operation
  - Returns list of device_ids marked offline (for alerting)
  - Error handling returns empty list on failure

### 2. backend/tests/test_heartbeat.py
**Status:** NEW FILE

Comprehensive test suite with 12 tests covering:
- Repository functions (update_last_seen, get_stale_devices, mark_devices_offline)
- HeartbeatHandler with known and unknown devices
- Offline detection with various scenarios (stale, not stale, multiple)
- Status transitions (offline → online on heartbeat)
- Empty/edge cases (empty device lists, no stale devices)
- Configurable timeout validation

**Test Results:** All 12 tests passed

## Files Modified

### 1. backend/src/repositories/device.py
**Changes:** Added three new repository functions:

- `update_last_seen(conn, device_id, timestamp)`:
  - Updates device.last_seen_at field
  - Sets status to 'online' atomically
  - Returns updated device record or None

- `get_stale_devices(conn, threshold_seconds)`:
  - Queries devices with last_seen_at older than threshold
  - Only includes devices with status='online'
  - Returns list of stale device IDs
  - Uses NOW() - interval for cutoff calculation

- `mark_devices_offline(conn, device_ids)`:
  - Bulk updates status to 'offline' for given device IDs
  - Uses PostgreSQL ANY() for efficient batch update
  - Returns count of devices updated
  - Handles empty list gracefully

### 2. backend/src/services/__init__.py
**Changes:**
- Added `HeartbeatHandler` import and export
- Updated `__all__` to include HeartbeatHandler

### 3. backend/src/main.py
**Changes:**

- Imported `HeartbeatHandler` from services
- Created global `heartbeat_handler` instance with default 180s timeout
- Updated `handle_heartbeat()` function:
  - Parses device_id from MQTT topic
  - Decodes JSON payload (handles empty payloads gracefully)
  - Calls heartbeat_handler.handle_heartbeat()
  - Logs warnings for invalid JSON (doesn't crash listener)
  - Error handling for all exceptions

- Added `offline_checker_task()` background coroutine:
  - Infinite loop with 60-second sleep interval
  - Calls heartbeat_handler.check_offline_devices()
  - Logs count of newly offline devices
  - Handles CancelledError for graceful shutdown
  - Catches all exceptions to prevent task crash

- Updated `lifespan()` context manager:
  - Creates offline_task using asyncio.create_task()
  - Stores task in app.state.offline_task
  - Cancels task on shutdown before MQTT disconnect
  - Awaits task with CancelledError handling

## Interfaces/Contracts

### MQTT Heartbeat Integration
The `handle_heartbeat()` function processes MQTT messages:
- Topic pattern: `devices/+/heartbeat`
- Extracts device_id from topic using `parse_device_id()`
- Parses JSON payload (optional fields)
- Delegates to HeartbeatHandler

### Heartbeat Payload Format
```json
{
  "timestamp": "2026-01-07T12:00:00Z",  // Optional
  "uptime_seconds": 3600,                // Optional
  "free_memory": 50000                   // Optional
}
```
All fields are optional. Empty payload `{}` is valid.

### Device Status Values
- `provisioning`: Just registered, not yet assigned to plant
- `online`: Active and sending heartbeats
- `offline`: Missed heartbeats (no activity for 180+ seconds)
- `error`: Device reported error state (not used in this task)

### Repository API
All functions require asyncpg connection:
```python
# Update device heartbeat
await update_last_seen(conn, device_id, timestamp)

# Query stale devices
stale_ids = await get_stale_devices(conn, threshold_seconds=180)

# Mark devices offline
count = await mark_devices_offline(conn, device_ids)
```

### Background Task
- Runs every 60 seconds (non-blocking)
- Detects devices offline for 180+ seconds
- Marks them as 'offline' status
- Returns device IDs for alerting (not yet implemented)
- Integrated with FastAPI lifespan management

## How to Verify

### 1. Run Check Command (PASSING)
```bash
cd backend && python -m pytest tests/test_heartbeat.py -v --tb=short
```
**Result:** 12 tests passed

Environment variables needed:
```bash
export MQTT_PASSWD_FILE="/tmp/test_passwd"
export DATABASE_URL="postgresql://test:test@localhost/test"
export MQTT_BACKEND_PASSWORD="test"
export ENCRYPTION_KEY="test_key_32_chars_1234567890ab"
```

### 2. Verify Module Imports
```bash
python3 -c "from backend.src.services.heartbeat_handler import HeartbeatHandler; print('OK')"
python3 -c "from backend.src.repositories.device import update_last_seen; print('OK')"
```

### 3. Integration Test (After Services Running)
Once backend, database, and MQTT are running:

**Send heartbeat via MQTT:**
```bash
mosquitto_pub -h localhost -p 1883 \
  -u device_xxx -P password_xxx \
  -t "devices/device-id-123/heartbeat" \
  -m '{"timestamp": "2026-01-07T12:00:00Z", "uptime_seconds": 3600}'
```

**Verify device status updated:**
```bash
# Query device via API
curl http://localhost:8000/api/devices/device-id-123

# Response should show:
# - status: "online"
# - last_seen_at: recent timestamp
```

**Test offline detection:**
```bash
# Stop sending heartbeats for device
# Wait 180+ seconds (3 minutes)
# Check device status again - should show "offline"
```

## Definition of Done - Status

- [x] HeartbeatHandler processes heartbeat messages
- [x] Device last_seen_at updated on heartbeat
- [x] Background task checks for offline devices every 60s
- [x] Devices marked offline after 180s without heartbeat
- [x] List of newly offline devices returned (for alerting)
- [x] All tests pass (12/12)

## Constraints Followed

- [x] Did NOT send alerts (deferred to task-013)
- [x] Heartbeat timeout configurable (default 180 seconds)
- [x] Handled clock skew gracefully (uses server timestamps)
- [x] Background task non-blocking (uses asyncio.create_task)
- [x] Only modified files in `backend/**` allowed paths

## Technical Notes

### HeartbeatHandler Design
- Configurable timeout (default 180s for 3 missed 60s heartbeats)
- Server-side timestamp (immune to device clock skew)
- Fault tolerant error handling (doesn't crash MQTT listener)
- Validates device exists before updating
- Logs all important events (warnings, info, debug)

### Repository Design
- `update_last_seen` atomically updates timestamp AND status
- `get_stale_devices` only queries currently 'online' devices
  - Prevents re-marking already-offline devices
  - More efficient query (uses status index)
- `mark_devices_offline` uses batch update with ANY()
  - Single SQL statement for multiple devices
  - Returns count for verification

### Background Task Design
- 60-second interval (checks every minute)
- Non-blocking (runs as asyncio task)
- Graceful cancellation on shutdown
- Error handling prevents task crash
- Integrated with FastAPI lifespan
- Logs detected offline devices for monitoring

### MQTT Integration
- Heartbeat handler registered for `devices/+/heartbeat` topic
- Parses device_id from topic using existing parse_device_id()
- Handles empty and invalid JSON payloads gracefully
- Error handling doesn't crash MQTT listener loop

### Database Design
- Uses existing `devices` table with `last_seen_at` field
- Status field supports: provisioning, online, offline, error
- Index on status field for efficient stale device queries

## Next Steps

The next task can build upon:
- Heartbeats now flowing from MQTT → Handler → Database
- Device online/offline status automatically tracked
- Background task detects offline devices every 60s
- List of offline devices ready for alerting (task-013)
- Foundation for threshold evaluation (task-012)
- Device status visible via existing API endpoints

## Risks/Limitations

### Low Risk
- Well-tested with comprehensive unit tests
- Graceful error handling throughout
- Fault-tolerant (errors don't crash services)
- Uses existing database schema (no migrations needed)

### Known Limitations
1. **No persistence of offline events**: Devices are marked offline but no history/log of when they went offline (could add events table later)
2. **No configurable check interval**: Background task hardcoded to 60s (could make configurable via settings)
3. **Clock skew**: Uses server time, ignores device timestamp in payload (trade-off for reliability)
4. **No partial outage handling**: If database is down, heartbeats are lost (acceptable for this use case)

### Future Enhancements
- Add configurable check interval via settings
- Track offline event history in events table
- Add metrics/monitoring for heartbeat processing rate
- Add admin API to manually mark device online/offline
- Support custom timeout per device (some devices may heartbeat slower)

---

**Status:** Implementation complete. All tests passing. Check command successful. Ready for task-013 (alerting) or task-012 (threshold evaluation).
**Handoff Complete:** YES
