# Recorder: task-011

## Changes Summary

Implemented device heartbeat handling and offline detection. Background task runs every 60s to mark stale devices offline.

## Key Files

- `backend/src/services/heartbeat_handler.py`: HeartbeatHandler class
- `backend/src/repositories/device.py`: Added update_last_seen, get_stale_devices, mark_devices_offline
- `backend/src/main.py`: Background offline_checker_task, heartbeat MQTT handler
- `backend/tests/test_heartbeat.py`: 12 unit tests

## Interfaces for Next Task

### HeartbeatHandler
```python
from src.services.heartbeat_handler import HeartbeatHandler
handler = HeartbeatHandler(timeout_seconds=180)
await handler.handle_heartbeat(device_id, payload)
offline_ids = await handler.check_offline_devices()
```

### Repository Functions
```python
from src.repositories.device import (
    update_last_seen, get_stale_devices, mark_devices_offline
)
```

### Device Status
- `provisioning` - Just registered
- `online` - Active heartbeats
- `offline` - Missed 3+ heartbeats

## Notes

- Background task runs in FastAPI lifespan
- Timeout configurable (default 180s = 3 missed heartbeats)
- Returns list of newly offline devices for alerting (task-013)
- Graceful error handling - failures logged, not raised
