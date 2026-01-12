# Recorder: task-008

## Changes Summary

Implemented device provisioning to associate devices with plants. Completes device lifecycle: register -> provision -> active.

## Key Files

- `backend/src/models/device.py`: DeviceProvisionRequest, DeviceProvisionResponse
- `backend/src/repositories/device.py`: assign_device_to_plant, unassign_device, get_devices_by_plant
- `backend/src/routers/devices.py`: provision and unassign endpoints
- `backend/src/routers/plants.py`: GET /api/plants/{id}/devices
- `backend/tests/test_device_plant.py`: 8 unit tests

## Interfaces for Next Task

### API Endpoints
- `POST /api/devices/{device_id}/provision` - Assign device to plant
- `POST /api/devices/{device_id}/unassign` - Remove plant association
- `GET /api/plants/{plant_id}/devices` - List plant's devices

### Repository Functions
```python
from src.repositories.device import (
    assign_device_to_plant,
    unassign_device,
    get_devices_by_plant
)
```

### Device Lifecycle
1. Register: POST /api/devices/register -> status: "provisioning"
2. Provision: POST /api/devices/{id}/provision -> status: "online"
3. Unassign: POST /api/devices/{id}/unassign -> keeps credentials, removes plant

## Notes

- Device can only belong to one plant
- Reassigning moves device to new plant automatically
- Unassigned devices remain registered with valid MQTT credentials
- Status changes to "online" on provision
