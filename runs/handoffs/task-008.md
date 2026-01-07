# Task 008 Handoff: Device-Plant Association

## Summary

Successfully implemented device provisioning endpoints to associate devices with plants. Created three new API endpoints: provision device to plant, list devices for a plant, and unassign device from plant. Added repository methods for device-plant operations and comprehensive test coverage with 8 test cases.

## Files Created

### Tests
- `/home/genge/dev-ash/foundry-nodevenv/cholitas/challenge-001-plantops/backend/tests/test_device_plant.py` - 8 test cases covering:
  - Provision device to plant
  - Provision with invalid device ID (404)
  - Provision with invalid plant ID (404)
  - Get devices for a plant
  - Get devices for non-existent plant (404)
  - Reassign device to different plant
  - Unassign device from plant
  - Unassign non-existent device (404)

## Files Modified

### Models
- `/home/genge/dev-ash/foundry-nodevenv/cholitas/challenge-001-plantops/backend/src/models/device.py` - Added:
  - `DeviceProvisionRequest` - Request model with plant_id field
  - `DeviceProvisionResponse` - Response model with id, plant_id, status, and message

- `/home/genge/dev-ash/foundry-nodevenv/cholitas/challenge-001-plantops/backend/src/models/__init__.py` - Exported new models

### Repository
- `/home/genge/dev-ash/foundry-nodevenv/cholitas/challenge-001-plantops/backend/src/repositories/device.py` - Added three methods:
  - `assign_device_to_plant(conn, device_id, plant_id)` - Assigns device to plant and sets status to "online"
  - `unassign_device(conn, device_id)` - Sets plant_id to NULL while keeping device registered
  - `get_devices_by_plant(conn, plant_id)` - Returns list of devices for a plant

### Routers
- `/home/genge/dev-ash/foundry-nodevenv/cholitas/challenge-001-plantops/backend/src/routers/devices.py` - Added two endpoints:
  - `POST /api/devices/{device_id}/provision` - Provision device to plant
  - `POST /api/devices/{device_id}/unassign` - Remove device from plant

- `/home/genge/dev-ash/foundry-nodevenv/cholitas/challenge-001-plantops/backend/src/routers/plants.py` - Added one endpoint:
  - `GET /api/plants/{plant_id}/devices` - List devices for a plant

## Interfaces/Contracts

### Device Provisioning Models

**DeviceProvisionRequest:**
```python
class DeviceProvisionRequest(BaseModel):
    plant_id: str
```

**DeviceProvisionResponse:**
```python
class DeviceProvisionResponse(BaseModel):
    id: str
    plant_id: str
    status: str
    message: str
```

### Device Repository Methods

**assign_device_to_plant:**
```python
async def assign_device_to_plant(
    conn: asyncpg.Connection,
    device_id: str,
    plant_id: str,
) -> dict | None
```
- Updates device's plant_id
- Sets status to "online"
- Returns updated device record or None if not found

**unassign_device:**
```python
async def unassign_device(
    conn: asyncpg.Connection,
    device_id: str,
) -> dict | None
```
- Sets plant_id to NULL
- Keeps device registered
- Returns updated device record or None if not found

**get_devices_by_plant:**
```python
async def get_devices_by_plant(
    conn: asyncpg.Connection,
    plant_id: str,
) -> list[dict]
```
- Returns all devices where plant_id matches
- Ordered by created_at DESC
- Returns empty list if no devices found

### API Endpoints

#### POST /api/devices/{device_id}/provision

**Request:**
```json
{
  "plant_id": "uuid-of-plant"
}
```

**Response (200):**
```json
{
  "id": "device-id",
  "plant_id": "plant-id",
  "status": "online",
  "message": "Device provisioned successfully"
}
```

**Error Responses:**
- 404: Device not found
- 404: Plant not found

**Behavior:**
- Verifies device exists
- Verifies plant exists
- Assigns device to plant (updates plant_id)
- Sets device status to "online"
- Reassignment allowed (can move device from one plant to another)

#### POST /api/devices/{device_id}/unassign

**Response (200):**
```json
{
  "message": "Device unassigned successfully"
}
```

**Error Responses:**
- 404: Device not found

**Behavior:**
- Sets plant_id to NULL
- Keeps device registered (credentials remain valid)
- Status unchanged

#### GET /api/plants/{plant_id}/devices

**Response (200):**
```json
{
  "devices": [
    {
      "id": "device-id",
      "mac_address": "AA:BB:CC:DD:EE:FF",
      "mqtt_username": "device_user",
      "plant_id": "plant-id",
      "status": "online",
      "firmware_version": "1.0.0",
      "sensor_types": ["temperature", "humidity"],
      "last_seen_at": "2026-01-07T12:00:00Z",
      "created_at": "2026-01-07T10:00:00Z"
    }
  ],
  "total": 1
}
```

**Error Responses:**
- 404: Plant not found

**Behavior:**
- Verifies plant exists
- Returns all devices assigned to the plant
- Returns empty list if no devices assigned

## How to Verify

### 1. Run check command (as specified in task)
```bash
cd backend && python -m pytest tests/test_device_plant.py -v --tb=short
```

Expected output: 8 tests passed

### 2. Run all backend tests
```bash
docker compose run --rm backend python -m pytest tests/ -v --tb=short
```

Expected output: 36 tests passed (includes 8 new tests)

### 3. Manual API testing
```bash
# Start services
docker compose up backend

# 1. Register a device
curl -X POST http://localhost:8000/api/devices/register \
  -H "Content-Type: application/json" \
  -d '{"mac_address": "AA:BB:CC:DD:EE:FF", "firmware_version": "1.0.0"}'
# Save device_id from response

# 2. Create a plant
curl -X POST http://localhost:8000/api/plants \
  -H "Content-Type: application/json" \
  -d '{"name": "Basil", "species": "Ocimum basilicum"}'
# Save plant_id from response

# 3. Provision device to plant
curl -X POST http://localhost:8000/api/devices/{device_id}/provision \
  -H "Content-Type: application/json" \
  -d '{"plant_id": "{plant_id}"}'

# 4. List devices for plant
curl http://localhost:8000/api/plants/{plant_id}/devices

# 5. Unassign device
curl -X POST http://localhost:8000/api/devices/{device_id}/unassign
```

## Implementation Details

### Repository Layer
- Used asyncpg for all database operations
- `assign_device_to_plant` updates both plant_id and status in single query
- `get_devices_by_plant` uses WHERE clause with plant_id filter
- All methods return dicts (asyncpg Record objects converted)

### API Endpoints
- Added import of plant_repo to devices router for plant existence validation
- Added import of device_repo to plants router for device listing
- Provision endpoint validates both device and plant existence before assignment
- Unassign only validates device existence (no plant_id needed)
- Plant devices endpoint validates plant existence before querying devices

### Tests
- Used AsyncMock for repository method mocking
- Used patch context manager for all mocks
- Tests follow async/await pattern with AsyncClient
- Mock data includes realistic timestamps and device attributes
- Tests verify both success cases and error cases (404 responses)

## Definition of Done - Verified

- [x] `POST /api/devices/{id}/provision` assigns device to plant
- [x] `GET /api/plants/{id}/devices` lists plant's devices
- [x] `POST /api/devices/{id}/unassign` removes plant association
- [x] Device status updated to "online" on provision
- [x] Validation for plant and device existence (404 errors)
- [x] All 8 tests pass

## Constraints Followed

- Device can only belong to one plant (single plant_id field)
- Unassigned devices remain registered (only plant_id set to NULL, credentials intact)
- Did NOT implement telemetry association (future task)
- Only modified files in `backend/**` (allowed_paths)
- No refactoring of unrelated code
- No features beyond task scope

## Next Steps

The device-plant association is complete and ready for:
- Telemetry ingestion (task-009) - devices can now send data to MQTT topics
- Telemetry-plant linking (task-010) - associate telemetry records with plants via devices
- Alert monitoring (future) - check telemetry against plant thresholds
- Device status tracking - last_seen_at updates when telemetry received

## Risks/Follow-ups

- No validation that device is in "provisioning" state before provisioning (can provision device in any state)
- Reassignment is implicit (no explicit "move device" endpoint, just provision to new plant)
- No cascade behavior if plant deleted (handled by task-007: devices.plant_id set to NULL)
- Status set to "online" on provision, but no heartbeat mechanism yet
- No audit trail for device reassignments (no history of which plants device was assigned to)
- GET /api/plants/{plant_id}/devices returns all devices (no pagination, may be issue with many devices)

## Database Schema Impact

No schema changes required - existing columns used:
- `devices.plant_id` - Foreign key to plants.id (allows NULL)
- `devices.status` - Updated to "online" on provision

## Key Files for Next Task

1. **src/repositories/device.py** - `assign_device_to_plant` ready for telemetry association
2. **src/models/device.py** - DeviceProvisionResponse model available for API responses
3. **Database schema** - devices.plant_id ready for telemetry queries via device
4. **Tests** - test_device_plant.py provides examples of device-plant operations

## API Summary

All new endpoints follow RESTful conventions:
- POST for state changes (provision, unassign)
- GET for queries (list devices)
- Proper status codes: 200 (success), 404 (not found)
- Consistent response models: DeviceProvisionResponse, DeviceListResponse
- Error responses via HTTPException (converted to ErrorResponse by exception handlers)
