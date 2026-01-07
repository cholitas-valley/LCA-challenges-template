---
task_id: task-010
title: Telemetry ingestion and storage
role: lca-backend
follow_roles: []
post:
  - lca-recorder
  - lca-gitops
depends_on:
  - task-009
inputs:
  - objective.md
  - runs/plan.md
  - runs/handoffs/task-009.md
allowed_paths:
  - backend/**
check_command: cd backend && python -m pytest tests/test_telemetry.py -v --tb=short
handoff: runs/handoffs/task-010.md
---

# Task 010: Telemetry Ingestion and Storage

## Goal

Implement the telemetry handler that processes incoming sensor data, validates it, associates with plants, and stores in the database. Also add API endpoints for retrieving telemetry history.

## Requirements

### Telemetry Models (backend/src/models/telemetry.py)

```python
class TelemetryPayload(BaseModel):
    timestamp: datetime | None = None  # Defaults to server time if not provided
    soil_moisture: float | None = None
    temperature: float | None = None
    humidity: float | None = None
    light_level: float | None = None

class TelemetryRecord(BaseModel):
    time: datetime
    device_id: str
    plant_id: str | None
    soil_moisture: float | None
    temperature: float | None
    humidity: float | None
    light_level: float | None

class TelemetryHistoryResponse(BaseModel):
    records: list[TelemetryRecord]
    count: int
```

### Telemetry Handler (backend/src/services/telemetry_handler.py)

```python
class TelemetryHandler:
    async def handle_telemetry(self, device_id: str, payload: dict) -> None:
        """Process incoming telemetry from MQTT."""
        # 1. Validate payload
        # 2. Look up device to get plant_id
        # 3. Store in database
        # 4. Trigger threshold evaluation (async, don't wait)
```

### Telemetry Repository (backend/src/repositories/telemetry.py)

Database operations:
- `insert_telemetry(time, device_id, plant_id, soil_moisture, temperature, humidity, light_level)`
- `get_latest_by_device(device_id)`
- `get_latest_by_plant(plant_id)`
- `get_history(plant_id, start_time, end_time, limit)`
- `get_aggregated_history(plant_id, interval, start_time, end_time)` - For charts

### API Endpoints

**GET /api/plants/{plant_id}/history**

Query params:
- `hours`: int = 24 (default 24 hours)
- `interval`: str = "5m" (aggregation interval: 1m, 5m, 15m, 1h)

Response:
```json
{
  "records": [
    {
      "time": "2026-01-07T12:00:00Z",
      "soil_moisture": 45.2,
      "temperature": 22.5,
      "humidity": 65.0,
      "light_level": 800
    }
  ],
  "count": 288
}
```

**GET /api/devices/{device_id}/telemetry/latest**

Get most recent telemetry for a device.

### Integration

Connect handler to MQTT subscriber (from task-009):
```python
mqtt.register_handler("devices/+/telemetry", telemetry_handler.handle_telemetry)
```

### Tests (backend/tests/test_telemetry.py)

Test cases:
- Insert telemetry record
- Get latest telemetry by device
- Get latest telemetry by plant
- Get history returns records in time range
- Invalid device_id is handled gracefully
- Telemetry without plant_id is stored (unassigned device)

## Definition of Done

- [ ] TelemetryHandler processes MQTT messages
- [ ] Telemetry stored with device and plant context
- [ ] `GET /api/plants/{id}/history` returns time-series data
- [ ] `GET /api/devices/{id}/telemetry/latest` returns latest reading
- [ ] Unassigned device telemetry stored with null plant_id
- [ ] All tests pass

## Constraints

- Do NOT implement threshold evaluation yet (that is task-012)
- Handle missing fields gracefully (partial telemetry OK)
- Use server timestamp if device timestamp is missing or invalid
- Batch inserts if performance is an issue (later optimization)
