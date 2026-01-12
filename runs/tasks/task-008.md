---
task_id: task-008
title: Device-plant association
role: lca-backend
follow_roles: []
post:
  - lca-recorder
  - lca-gitops
depends_on:
  - task-007
inputs:
  - objective.md
  - runs/plan.md
  - runs/handoffs/task-007.md
allowed_paths:
  - backend/**
check_command: cd backend && python -m pytest tests/test_device_plant.py -v --tb=short
handoff: runs/handoffs/task-008.md
---

# Task 008: Device-Plant Association

## Goal

Implement the device provisioning endpoint that associates a device with a plant. This completes the device lifecycle: register -> provision -> active.

## Requirements

### New Endpoint

**POST /api/devices/{device_id}/provision**

Request:
```json
{
  "plant_id": "uuid-of-plant"
}
```

Response:
```json
{
  "id": "device-id",
  "plant_id": "uuid-of-plant",
  "status": "online",
  "message": "Device provisioned successfully"
}
```

Behavior:
- Verify device exists (404 if not)
- Verify plant exists (404 if not)
- Update device's plant_id
- Update device status to "online"
- Return updated device

### Additional Endpoints

**GET /api/plants/{plant_id}/devices**

List all devices associated with a plant:
```json
{
  "devices": [
    {
      "id": "device-1",
      "mac_address": "AA:BB:CC:DD:EE:FF",
      "status": "online",
      "last_seen_at": "2026-01-07T12:00:00Z"
    }
  ],
  "total": 1
}
```

**POST /api/devices/{device_id}/unassign**

Remove device from plant:
- Set plant_id = NULL
- Keep device registered (can be reassigned)
- Status remains unchanged

### Device Status Updates

Add method to device repository:
- `assign_device_to_plant(device_id, plant_id)`
- `unassign_device(device_id)`

### Validation

- Device can only be assigned to one plant at a time
- Reassigning automatically removes from previous plant
- Plant must exist before assignment

### Tests (backend/tests/test_device_plant.py)

Test cases:
- Provision device to plant
- Device appears in plant's device list
- Provision device to different plant (reassign)
- Unassign device from plant
- Provision with invalid plant_id returns 404
- Provision with invalid device_id returns 404

## Definition of Done

- [ ] `POST /api/devices/{id}/provision` assigns device to plant
- [ ] `GET /api/plants/{id}/devices` lists plant's devices
- [ ] `POST /api/devices/{id}/unassign` removes plant association
- [ ] Device status updated on provision
- [ ] Validation for plant and device existence
- [ ] All tests pass

## Constraints

- Do NOT implement telemetry association yet
- Device can only belong to one plant
- Unassigned devices remain registered (credentials valid)
