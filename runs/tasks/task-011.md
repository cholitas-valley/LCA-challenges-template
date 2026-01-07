---
task_id: task-011
title: Device heartbeat and status tracking
role: lca-backend
follow_roles: []
post:
  - lca-recorder
  - lca-gitops
depends_on:
  - task-010
inputs:
  - objective.md
  - runs/plan.md
  - runs/handoffs/task-010.md
allowed_paths:
  - backend/**
check_command: cd backend && python -m pytest tests/test_heartbeat.py -v --tb=short
handoff: runs/handoffs/task-011.md
---

# Task 011: Device Heartbeat and Status Tracking

## Goal

Implement device heartbeat handling and automatic offline detection. Devices send heartbeat messages every 60 seconds; after 3 missed heartbeats (180 seconds), mark device as offline.

## Requirements

### Heartbeat Handler (backend/src/services/heartbeat_handler.py)

```python
class HeartbeatHandler:
    async def handle_heartbeat(self, device_id: str, payload: dict) -> None:
        """Process heartbeat from device."""
        # 1. Update device.last_seen_at
        # 2. Set status = 'online' if not already
        
    async def check_offline_devices(self) -> list[str]:
        """Find devices that missed heartbeats and mark offline."""
        # 1. Query devices where last_seen_at < (now - 180 seconds)
        # 2. Update status = 'offline'
        # 3. Return list of device_ids that went offline (for alerting)
```

### Device Status Updates

Add to device repository:
- `update_last_seen(device_id, timestamp)`
- `get_stale_devices(threshold_seconds: int) -> list[str]`
- `mark_devices_offline(device_ids: list[str])`

Device status enum:
- `provisioning`: Just registered, not yet assigned
- `online`: Active and sending heartbeats
- `offline`: Missed heartbeats
- `error`: Device reported error state

### Background Task

Create periodic task that runs every 60 seconds:
```python
async def offline_checker_task():
    while True:
        await asyncio.sleep(60)
        offline_ids = await heartbeat_handler.check_offline_devices()
        for device_id in offline_ids:
            await alert_device_offline(device_id)
```

Integrate with FastAPI lifespan.

### MQTT Integration

Register heartbeat handler:
```python
mqtt.register_handler("devices/+/heartbeat", heartbeat_handler.handle_heartbeat)
```

### Heartbeat Payload

Simple payload (optional fields):
```json
{
  "timestamp": "2026-01-07T12:00:00Z",
  "uptime_seconds": 3600,
  "free_memory": 50000
}
```

### Tests (backend/tests/test_heartbeat.py)

Test cases:
- Heartbeat updates last_seen_at
- Heartbeat sets status to online
- Device without heartbeat for 180s is marked offline
- check_offline_devices returns correct device_ids
- Multiple offline devices handled correctly

## Definition of Done

- [ ] HeartbeatHandler processes heartbeat messages
- [ ] Device last_seen_at updated on heartbeat
- [ ] Background task checks for offline devices every 60s
- [ ] Devices marked offline after 180s without heartbeat
- [ ] List of newly offline devices returned (for alerting)
- [ ] All tests pass

## Constraints

- Do NOT send alerts yet (that is task-013)
- Heartbeat timeout configurable (default 180 seconds)
- Handle clock skew gracefully
- Background task must not block main event loop
