# Task 009 Handoff: MQTT Subscriber Service

## Summary

Implemented the MQTT subscriber service that connects to Mosquitto and listens for device telemetry and heartbeat messages. The service provides:
- Async MQTT client connection with authentication
- Handler registration for topic patterns (supports MQTT wildcards)
- Automatic reconnection with exponential backoff
- Integration with FastAPI lifespan for startup/shutdown
- Topic parsing utilities for extracting device IDs

## Files Created

### 1. backend/src/services/mqtt_subscriber.py
**Status:** NEW FILE

Complete MQTT subscriber implementation with:
- MQTTSubscriber class with async connect/disconnect/subscribe methods
- Handler registration for topic patterns
- Message listening loop with reconnection logic
- Topic matching with MQTT wildcards (+ and #)
- parse_device_id() utility function

**Key Features:**
- Uses aiomqtt async client library
- Exponential backoff reconnection (1s to 60s max)
- Graceful shutdown handling
- Handler dispatch with error isolation (handler failures do not crash listener)

### 2. backend/tests/test_mqtt_subscriber.py
**Status:** NEW FILE

Unit tests covering:
- MQTTSubscriber instantiation
- parse_device_id() with valid and invalid formats
- Handler registration (single and multiple)
- Topic matching with wildcards (+ and #)
- Exact topic matching

**Note:** Tests focus on logic and instantiation. No actual MQTT broker connection tests (as per task constraints).

## Files Modified

### 1. backend/src/config.py
**Changes:**
- Added mqtt_backend_username: str = "plantops_backend"
- Added mqtt_backend_password: str (required env var)

These credentials allow the backend service to authenticate with Mosquitto.

### 2. backend/src/main.py
**Changes:**
- Added imports: asyncio, logging, settings, MQTTSubscriber
- Added placeholder handlers: handle_telemetry() and handle_heartbeat()
- Updated lifespan() to initialize and connect MQTT subscriber
- Registers handlers for devices/+/telemetry and devices/+/heartbeat topics
- Starts listener in background task
- Stores mqtt instance in app.state.mqtt
- Disconnects on shutdown

### 3. backend/src/services/__init__.py
**Changes:**
- Added MQTTSubscriber to imports and __all__ exports

## Interfaces/Contracts

### MQTT Subscriber API

The MQTTSubscriber class provides these methods:
- __init__(host, port, username, password)
- async connect() -> None
- async disconnect() -> None
- async subscribe(topic, handler) -> None
- async start() -> None
- register_handler(topic_pattern, handler) -> None

### Handler Signature

Handlers must be async functions with this signature:
- async def handler(topic: str, payload: bytes) -> None

### Topic Patterns

- devices/+/telemetry - Matches all device telemetry (+ is single-level wildcard)
- devices/+/heartbeat - Matches all device heartbeats
- devices/# - Matches all device topics (# is multi-level wildcard)

### Device ID Extraction

The parse_device_id() function extracts device ID from topic:
- parse_device_id("devices/abc123/telemetry") returns "abc123"

### Settings Contract

Backend requires these environment variables:
- MQTT_BACKEND_PASSWORD (NEW - required)
- DATABASE_URL
- ENCRYPTION_KEY

## How to Verify

### 1. Check Command (PASSING)
```
cd backend && python -c "from src.services.mqtt_subscriber import MQTTSubscriber; print('MQTT subscriber OK')"
```
Result: PASSED

### 2. Test Import and Instantiation
```
python3 -c "import sys; sys.path.insert(0, 'backend'); from src.services.mqtt_subscriber import MQTTSubscriber; sub = MQTTSubscriber('localhost', 1883, 'user', 'pass'); print('OK')"
```

### 3. Test Topic Parsing
```
python3 -c "import sys; sys.path.insert(0, 'backend'); from src.services.mqtt_subscriber import parse_device_id; assert parse_device_id('devices/abc123/telemetry') == 'abc123'; print('OK')"
```

### 4. Integration Test (After Services Running)

Prerequisites:
- Add MQTT_BACKEND_PASSWORD to .env file
- Create backend MQTT user in Mosquitto password file

Start services and check logs:
```
docker compose up -d
docker compose logs backend | grep -i "mqtt"
```

Expected output:
- Connecting to MQTT broker at mosquitto:1883
- Connected to MQTT broker
- Subscribed to: devices/+/telemetry
- Subscribed to: devices/+/heartbeat
- MQTT subscriber started

## Definition of Done - Status

- [x] MQTTSubscriber class exists with all methods
- [x] Backend MQTT credentials configured in Settings
- [x] Topic pattern matching works for device_id extraction
- [x] Handler registration and dispatch implemented
- [x] Integration with FastAPI lifespan
- [x] Module imports without errors (check command passes)

## Constraints Followed

- [x] Used aiomqtt (already in pyproject.toml dependencies)
- [x] Did NOT process telemetry data (left as TODO for task-010)
- [x] Did NOT test actual MQTT connections (unit tests only test logic)
- [x] Implemented reconnection with exponential backoff (1s to 60s)

## Next Steps

### Task-010 (Telemetry Processing)
Will need to:
- Implement handle_telemetry() to parse and store sensor readings
- Implement handle_heartbeat() to update device last_seen timestamp
- Store readings in TimescaleDB via database layer

### Required Before Services Start
1. Add MQTT_BACKEND_PASSWORD to backend .env file
2. Create plantops_backend user in Mosquitto password file

## Risks/Limitations

### Low Risk
- Pure implementation task, no database or external dependencies
- Uses well-tested aiomqtt library
- Graceful reconnection handles broker restarts

### Known Limitations
1. MQTT user must be created manually before backend starts with MQTT enabled
2. Telemetry handlers are stubs - they log but do not process (deferred to task-010)
3. No authentication failure handling - if credentials are wrong, reconnection loop continues

### Connection Failure Modes
- If Mosquitto is not running: exponential backoff retry forever
- If credentials are invalid: aiomqtt raises exception, caught and logged
- If network is down: same as broker not running

## Technical Notes

### Reconnection Logic
- Initial delay: 1 second
- Exponential backoff: delay multiplied by 2
- Maximum delay: 60 seconds
- On successful reconnection: automatically re-subscribes to all registered topics

### Topic Matching Algorithm
- Supports MQTT standard wildcards
- Handler isolation: each handler runs in try/except block
- Handler failures logged but do not crash listener

---

**Status:** Implementation complete. Check command passes. Ready for task-010 (telemetry processing).
**Handoff Complete:** YES
