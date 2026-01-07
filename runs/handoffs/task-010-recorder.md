# Recorder: task-010

## Changes Summary

Implemented telemetry ingestion system. MQTT messages are processed, validated, and stored with device/plant context. Added history and latest reading API endpoints.

## Key Files

- `backend/src/models/telemetry.py`: TelemetryPayload, TelemetryRecord, TelemetryHistoryResponse
- `backend/src/repositories/telemetry.py`: insert, get_latest, get_history operations
- `backend/src/services/telemetry_handler.py`: TelemetryHandler for MQTT message processing
- `backend/src/routers/plants.py`: Added GET /api/plants/{id}/history
- `backend/src/routers/devices.py`: Added GET /api/devices/{id}/telemetry/latest
- `backend/tests/test_telemetry.py`: 14 unit tests

## Interfaces for Next Task

### TelemetryHandler
```python
from src.services.telemetry_handler import TelemetryHandler
handler = TelemetryHandler()
await handler.handle_telemetry(device_id, payload_dict)
```

### Repository Functions
```python
from src.repositories.telemetry import (
    insert_telemetry, get_latest_by_device, get_latest_by_plant,
    get_history
)
```

### API Endpoints
- `GET /api/plants/{plant_id}/history?hours=24` - Time-series history
- `GET /api/devices/{device_id}/telemetry/latest` - Latest reading

## Notes

- Server timestamp used when device timestamp missing
- Partial sensor data OK (all fields optional)
- Unassigned devices store with plant_id=NULL
- Threshold evaluation deferred to task-012
- Integrated with MQTT subscriber from task-009
