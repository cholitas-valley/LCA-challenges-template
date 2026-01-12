# Recorder: task-004

## Changes Summary

Implemented Device Registration API with self-registration flow for IoT devices. Devices can register with MAC address and receive unique MQTT credentials.

## Key Files

- `backend/src/models/device.py`: Pydantic models (DeviceRegisterRequest/Response, DeviceResponse, DeviceListResponse)
- `backend/src/repositories/device.py`: Database CRUD operations using asyncpg
- `backend/src/repositories/__init__.py`: Repository package init
- `backend/src/routers/devices.py`: API endpoints (POST register, GET list, DELETE)
- `backend/src/main.py`: Added devices router and db pool lifecycle
- `backend/tests/test_devices.py`: 6 unit tests with mocked repository
- `backend/pyproject.toml`: Added bcrypt dependency

## Interfaces for Next Task

### API Endpoints
- `POST /api/devices/register` - Register device, get MQTT credentials
- `GET /api/devices?limit=10&offset=0` - List devices with pagination
- `DELETE /api/devices/{device_id}` - Remove device

### Repository Functions
```python
from src.repositories.device import (
    create_device, get_device_by_id, get_device_by_mac,
    list_devices, delete_device, update_device_status
)
```

### Models
```python
from src.models.device import (
    DeviceRegisterRequest, DeviceRegisterResponse,
    DeviceResponse, DeviceListResponse
)
```

## Notes

- Password hashed with bcrypt before storage
- Plaintext password returned ONLY on initial registration
- Same MAC address returns existing device (idempotent)
- Tests use mocked repository (no real DB needed)
- Device status defaults to "provisioning"
- Mosquitto integration deferred to task-006
- Device-plant association deferred to task-008
