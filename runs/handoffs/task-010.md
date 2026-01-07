# Task 010 Handoff: Telemetry Ingestion and Storage

## Summary

Implemented complete telemetry ingestion pipeline with MQTT integration, database storage, and API endpoints. The system now:
- Receives telemetry from devices via MQTT
- Validates and stores sensor readings in TimescaleDB
- Associates telemetry with devices and plants
- Provides API endpoints for history queries and latest readings
- Handles unassigned devices gracefully
- Uses server timestamps when device timestamps are missing

## Files Created

### 1. backend/src/models/telemetry.py
**Status:** NEW FILE

Pydantic models for telemetry data:
- `TelemetryPayload`: Incoming device payload with optional timestamp and sensor readings
- `TelemetryRecord`: Database record with device/plant context and timestamp
- `TelemetryHistoryResponse`: API response model with list of records and count

All sensor fields are optional to support partial telemetry.

### 2. backend/src/repositories/telemetry.py
**Status:** NEW FILE

Database operations for telemetry:
- `insert_telemetry()`: Store sensor reading with device and plant context
- `get_latest_by_device()`: Get most recent reading for a device
- `get_latest_by_plant()`: Get most recent reading for a plant
- `get_history()`: Query time-range history for a plant (default 24 hours)

All functions use asyncpg connections.

### 3. backend/src/services/telemetry_handler.py
**Status:** NEW FILE

`TelemetryHandler` class with `handle_telemetry()` method that:
1. Validates payload against TelemetryPayload model
2. Looks up device to get plant_id (handles unknown devices)
3. Stores telemetry in database with device and plant context
4. Uses server timestamp if device timestamp missing
5. Logs errors but doesn't raise (fault tolerance for MQTT processing)

### 4. backend/tests/test_telemetry.py
**Status:** NEW FILE

Comprehensive test suite covering:
- Repository functions (insert, get_latest, get_history)
- Handler with assigned/unassigned/unknown devices
- Server timestamp fallback
- Partial sensor data handling
- API endpoints for history and latest telemetry

**Test Results:** 14 tests passed

## Files Modified

### 1. backend/src/models/__init__.py
**Changes:**
- Added imports for `TelemetryPayload`, `TelemetryRecord`, `TelemetryHistoryResponse`
- Added to `__all__` exports

### 2. backend/src/repositories/__init__.py
**Changes:**
- Added `telemetry` module import and export

### 3. backend/src/services/__init__.py
**Changes:**
- Added `TelemetryHandler` import and export

### 4. backend/src/main.py
**Changes:**
- Imported `parse_device_id`, `json`, and `TelemetryHandler`
- Created global `telemetry_handler` instance
- Updated `handle_telemetry()` function to:
  - Parse device_id from MQTT topic
  - Decode JSON payload
  - Call telemetry_handler.handle_telemetry()
  - Handle JSON decode and general errors

### 5. backend/src/routers/plants.py
**Changes:**
- Added imports for telemetry models and repository
- Added `GET /api/plants/{plant_id}/history` endpoint:
  - Query parameter `hours` (default 24)
  - Returns `TelemetryHistoryResponse` with records and count
  - Validates plant exists (404 if not)
  - Queries telemetry for time range

### 6. backend/src/routers/devices.py
**Changes:**
- Added imports for `TelemetryRecord` and `telemetry_repo`
- Added `GET /api/devices/{device_id}/telemetry/latest` endpoint:
  - Returns `TelemetryRecord` with latest reading
  - Validates device exists (404 if not)
  - Returns 404 if no telemetry data exists for device

## Interfaces/Contracts

### MQTT Telemetry Integration
The `handle_telemetry()` function in main.py processes MQTT messages:
- Topic pattern: `devices/+/telemetry`
- Extracts device_id from topic using `parse_device_id()`
- Parses JSON payload
- Delegates to TelemetryHandler

### Telemetry Payload Format
```json
{
  "timestamp": "2026-01-07T12:00:00Z",  // Optional, server time used if missing
  "soil_moisture": 45.2,                  // Optional
  "temperature": 22.5,                    // Optional
  "humidity": 65.0,                       // Optional
  "light_level": 800.0                    // Optional
}
```

### API Endpoints

**GET /api/plants/{plant_id}/history?hours=24**
- Returns telemetry history for plant
- Query param `hours` controls time range (default 24)
- Response: `{ "records": [...], "count": N }`
- 404 if plant not found

**GET /api/devices/{device_id}/telemetry/latest**
- Returns most recent telemetry for device
- Response: Single `TelemetryRecord` object
- 404 if device not found or no telemetry exists

### Database Schema Usage
Uses existing `telemetry` table from migration 003:
- `time TIMESTAMPTZ NOT NULL`
- `device_id TEXT` (references devices)
- `plant_id TEXT` (references plants, nullable for unassigned devices)
- `soil_moisture FLOAT` (nullable)
- `temperature FLOAT` (nullable)
- `humidity FLOAT` (nullable)
- `light_level FLOAT` (nullable)

### Repository API
All functions require asyncpg connection:
```python
await insert_telemetry(conn, time, device_id, plant_id, ...)
latest = await get_latest_by_device(conn, device_id)
latest = await get_latest_by_plant(conn, plant_id)
history = await get_history(conn, plant_id, start_time, end_time, limit)
```

## How to Verify

### 1. Run Check Command (PASSING)
```bash
cd backend && python -m pytest tests/test_telemetry.py -v --tb=short
```
**Result:** 14 tests passed

### 2. Verify Module Imports
```bash
python3 -c "from backend.src.models.telemetry import TelemetryPayload; print('OK')"
python3 -c "from backend.src.repositories.telemetry import insert_telemetry; print('OK')"
python3 -c "from backend.src.services.telemetry_handler import TelemetryHandler; print('OK')"
```

### 3. Integration Test (After Services Running)
Once backend, database, and MQTT are running:

**Publish telemetry via MQTT:**
```bash
mosquitto_pub -h localhost -p 1883 \
  -u device_xxx -P password_xxx \
  -t "devices/device-id-123/telemetry" \
  -m '{"soil_moisture": 45.2, "temperature": 22.5}'
```

**Query telemetry via API:**
```bash
# Get plant history
curl http://localhost:8000/api/plants/{plant_id}/history?hours=24

# Get device latest
curl http://localhost:8000/api/devices/{device_id}/telemetry/latest
```

## Definition of Done - Status

- [x] TelemetryHandler processes MQTT messages
- [x] Telemetry stored with device and plant context
- [x] `GET /api/plants/{id}/history` returns time-series data
- [x] `GET /api/devices/{id}/telemetry/latest` returns latest reading
- [x] Unassigned device telemetry stored with null plant_id
- [x] All tests pass (14/14)

## Constraints Followed

- [x] Did NOT implement threshold evaluation (deferred to task-012)
- [x] Handled missing fields gracefully (all sensor fields optional)
- [x] Used server timestamp if device timestamp missing
- [x] Only modified files in `backend/**` allowed paths

## Technical Notes

### Telemetry Handler Design
- Runs in background MQTT listener loop (non-blocking)
- Error handling doesn't raise exceptions (prevents MQTT listener crash)
- Device lookup determines plant_id context
- Unknown devices store telemetry with null plant_id
- Validation uses Pydantic models

### Database Design
- Uses TimescaleDB hypertable if available (from migration 003)
- Indexes on (device_id, time) and (plant_id, time) for query performance
- Nullable plant_id supports unassigned device telemetry

### API Design
- Plant history endpoint includes time range parameter
- Device latest endpoint for real-time status
- Both validate parent resource exists (404 semantics)

### Test Strategy
- Unit tests for repository functions with mocked connection
- Integration tests for handler with mocked pool and repos
- API tests with mocked dependencies via FastAPI test client
- Helper class `AsyncContextManagerMock` for proper async context manager mocking

## Next Steps

The next task can build upon:
- Telemetry is now flowing from MQTT → Handler → Database
- API endpoints ready for frontend consumption
- Plant history available for charts and trends
- Device status available via latest telemetry
- Ready for threshold evaluation (task-012)
- Ready for alerting based on telemetry (task-013)

## Risks/Limitations

### Low Risk
- Pure implementation, well-tested with mocks
- Graceful error handling in MQTT path
- Fault-tolerant (bad messages don't crash listener)

### Known Limitations
1. No aggregation/downsampling (returns raw telemetry, may be large)
2. History query limit hardcoded to 10000 records
3. No pagination on history endpoint
4. Unassigned device telemetry stored but not queryable via API (only assigned devices accessible)

### Future Enhancements
- Add aggregation endpoint with interval parameter (e.g., 5m, 1h)
- Add pagination to history endpoint
- Add endpoint to list unassigned device telemetry
- Add retention policy for old telemetry data

---

**Status:** Implementation complete. All tests passing. Check command successful. Ready for task-011 (threshold evaluation) or task-012 (alerting).
**Handoff Complete:** YES
