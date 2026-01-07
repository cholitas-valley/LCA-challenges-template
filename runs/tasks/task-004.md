---
task_id: task-004
title: Device registration API
role: lca-backend
follow_roles: []
post:
  - lca-recorder
  - lca-gitops
depends_on:
  - task-003
inputs:
  - objective.md
  - runs/plan.md
  - runs/handoffs/task-003.md
allowed_paths:
  - backend/**
check_command: cd backend && python -m pytest tests/test_devices.py -v --tb=short
handoff: runs/handoffs/task-004.md
---

# Task 004: Device Registration API

## Goal

Implement the device registration endpoint that allows IoT devices to self-register and receive MQTT credentials. This is the first step in the device provisioning flow.

## Requirements

### Pydantic Models (backend/src/models/device.py)

```python
class DeviceRegisterRequest(BaseModel):
    mac_address: str
    firmware_version: str | None = None
    sensor_types: list[str] | None = None

class DeviceRegisterResponse(BaseModel):
    device_id: str
    mqtt_username: str
    mqtt_password: str  # Plaintext, returned only on registration
    mqtt_host: str
    mqtt_port: int

class DeviceResponse(BaseModel):
    id: str
    mac_address: str
    mqtt_username: str
    plant_id: str | None
    status: str
    firmware_version: str | None
    sensor_types: list[str] | None
    last_seen_at: datetime | None
    created_at: datetime

class DeviceListResponse(BaseModel):
    devices: list[DeviceResponse]
    total: int
```

### Device Router (backend/src/routers/devices.py)

Endpoints:
- `POST /api/devices/register` - Register new device
  - Generate unique device_id (uuid4)
  - Generate unique mqtt_username (e.g., `device_{short_id}`)
  - Generate random mqtt_password (32 chars)
  - Hash password with bcrypt before storing
  - Return credentials to device
  - If mac_address exists, return existing device credentials (idempotent)

- `GET /api/devices` - List all devices
  - Return all devices with status
  - Include pagination (limit/offset)

- `DELETE /api/devices/{device_id}` - Decommission device
  - Mark device as decommissioned or delete
  - Cascade properly

### Device Repository (backend/src/repositories/device.py)

Database operations:
- `create_device(mac_address, mqtt_username, mqtt_password_hash, firmware_version, sensor_types)`
- `get_device_by_id(device_id)`
- `get_device_by_mac(mac_address)`
- `list_devices(limit, offset)`
- `delete_device(device_id)`
- `update_device_status(device_id, status)`

### Tests (backend/tests/test_devices.py)

Test cases:
- Register new device returns credentials
- Register same MAC returns same device (idempotent)
- List devices returns empty list initially
- Delete device removes it from list

## Definition of Done

- [ ] `POST /api/devices/register` creates device and returns MQTT credentials
- [ ] MAC address uniqueness enforced (same MAC returns same device)
- [ ] `GET /api/devices` returns device list with pagination
- [ ] `DELETE /api/devices/{id}` removes device
- [ ] Password stored as bcrypt hash
- [ ] All tests pass

## Constraints

- Do NOT integrate with Mosquitto yet (that is task-006)
- Do NOT implement device-plant association yet (that is task-008)
- Password returned ONLY on registration response
- Use asyncpg for database operations
