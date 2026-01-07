# Task 007 Handoff: Plant CRUD API

## Summary

Successfully implemented complete plant management API with CRUD operations. Created Pydantic models for plant data with threshold configurations, a repository layer for database operations, and REST API endpoints for creating, reading, updating, and deleting plants. All endpoints include proper error handling with 404 responses for non-existent plants.

## Files Created

### Pydantic Models
- `/home/genge/dev-ash/foundry-nodevenv/cholitas/challenge-001-plantops/backend/src/models/plant.py` - Plant-related models:
  - `ThresholdConfig` - Min/max configuration for a single sensor threshold
  - `PlantThresholds` - Threshold configurations for all sensor types (soil_moisture, temperature, humidity, light_level)
  - `PlantCreate` - Request model for creating plants
  - `PlantUpdate` - Request model for updating plants (all fields optional)
  - `PlantResponse` - Response model with plant data, device count, and latest telemetry placeholder
  - `PlantListResponse` - Response model for paginated plant list

### Repository Layer
- `/home/genge/dev-ash/foundry-nodevenv/cholitas/challenge-001-plantops/backend/src/repositories/plant.py` - Database operations:
  - `create_plant()` - Insert new plant with UUID, name, species, and thresholds (JSONB)
  - `get_plant_by_id()` - Fetch single plant by ID
  - `list_plants()` - Paginated list with total count
  - `update_plant()` - Partial update with dynamic SQL based on provided fields
  - `delete_plant()` - Delete plant and unassign all devices (cascade behavior)
  - `get_plant_device_count()` - Count devices assigned to a plant

### Router
- `/home/genge/dev-ash/foundry-nodevenv/cholitas/challenge-001-plantops/backend/src/routers/plants.py` - REST API endpoints:
  - `POST /api/plants` (201) - Create new plant with server-generated UUID
  - `GET /api/plants` (200) - List plants with pagination (limit/offset query params)
  - `GET /api/plants/{plant_id}` (200) - Get single plant by ID
  - `PUT /api/plants/{plant_id}` (200) - Update plant (partial updates supported)
  - `DELETE /api/plants/{plant_id}` (204) - Delete plant and cascade unassign devices

### Tests
- `/home/genge/dev-ash/foundry-nodevenv/cholitas/challenge-001-plantops/backend/tests/test_plants.py` - 11 test cases:
  - Create plant with name only
  - Create plant with species and thresholds
  - List plants returns created plants
  - Get single plant by ID
  - Update plant name
  - Update plant thresholds
  - Delete plant returns 204
  - Get deleted plant returns 404
  - Get non-existent plant returns 404
  - Update non-existent plant returns 404
  - Delete non-existent plant returns 404

## Files Modified

### Model Exports
- `/home/genge/dev-ash/foundry-nodevenv/cholitas/challenge-001-plantops/backend/src/models/__init__.py` - Added plant model exports

### Repository Exports
- `/home/genge/dev-ash/foundry-nodevenv/cholitas/challenge-001-plantops/backend/src/repositories/__init__.py` - Added plant repository to exports

### Application Setup
- `/home/genge/dev-ash/foundry-nodevenv/cholitas/challenge-001-plantops/backend/src/main.py` - Registered plants router with app

## Interfaces/Contracts

### Plant Models (src.models.plant)

**ThresholdConfig:**
```python
class ThresholdConfig(BaseModel):
    min: float | None = None
    max: float | None = None
```

**PlantThresholds:**
```python
class PlantThresholds(BaseModel):
    soil_moisture: ThresholdConfig | None = None
    temperature: ThresholdConfig | None = None
    humidity: ThresholdConfig | None = None
    light_level: ThresholdConfig | None = None
```

**PlantCreate:**
```python
class PlantCreate(BaseModel):
    name: str
    species: str | None = None
    thresholds: PlantThresholds | None = None
```

**PlantUpdate:**
```python
class PlantUpdate(BaseModel):
    name: str | None = None
    species: str | None = None
    thresholds: PlantThresholds | None = None
```

**PlantResponse:**
```python
class PlantResponse(BaseModel):
    id: str
    name: str
    species: str | None
    thresholds: PlantThresholds | None
    created_at: datetime
    latest_telemetry: dict | None = None  # Placeholder for task-010
    device_count: int = 0
```

**PlantListResponse:**
```python
class PlantListResponse(BaseModel):
    plants: list[PlantResponse]
    total: int
```

### Plant Repository (src.repositories.plant)

**Functions:**
- `create_plant(conn, plant_id, name, species=None, thresholds=None) -> dict` - Create plant with JSONB thresholds
- `get_plant_by_id(conn, plant_id) -> dict | None` - Fetch plant by ID
- `list_plants(conn, limit=100, offset=0) -> tuple[list[dict], int]` - Paginated list with total count
- `update_plant(conn, plant_id, name=None, species=None, thresholds=None) -> dict | None` - Partial update with dynamic SQL
- `delete_plant(conn, plant_id) -> bool` - Delete plant and unassign devices, returns True if deleted
- `get_plant_device_count(conn, plant_id) -> int` - Count devices assigned to plant

**Database Schema:**
- Table: `plants` (id TEXT PRIMARY KEY, name TEXT, species TEXT, thresholds JSONB, created_at TIMESTAMPTZ)
- Thresholds stored as JSONB for flexible schema
- Cascade behavior: DELETE plant → UPDATE devices SET plant_id=NULL

### Plant Router (src.routers.plants)

**Endpoints:**

1. **POST /api/plants** (201 Created)
   - Request: `PlantCreate`
   - Response: `PlantResponse`
   - Generates UUID server-side
   - Converts thresholds to dict for storage

2. **GET /api/plants** (200 OK)
   - Query params: `limit` (default: 100), `offset` (default: 0)
   - Response: `PlantListResponse`
   - Includes device count for each plant
   - Ordered by created_at DESC

3. **GET /api/plants/{plant_id}** (200 OK / 404 Not Found)
   - Path param: `plant_id`
   - Response: `PlantResponse`
   - Includes device count
   - Returns 404 if plant not found

4. **PUT /api/plants/{plant_id}** (200 OK / 404 Not Found)
   - Path param: `plant_id`
   - Request: `PlantUpdate` (all fields optional)
   - Response: `PlantResponse`
   - Supports partial updates
   - Returns 404 if plant not found

5. **DELETE /api/plants/{plant_id}** (204 No Content / 404 Not Found)
   - Path param: `plant_id`
   - Response: Empty (204)
   - Unassigns all devices from plant
   - Returns 404 if plant not found

## How to Verify

### 1. Run tests (check command)
```bash
cd backend && python -m pytest tests/test_plants.py -v --tb=short
```

Expected output: 11 tests passed

### 2. Run all backend tests
```bash
cd backend && python -m pytest tests/ -v --tb=short
```

Expected output: All tests pass (including existing device and health tests)

### 3. Test with Docker
```bash
docker compose run --rm backend python -m pytest tests/test_plants.py -v --tb=short
```

### 4. Manual API testing (with running app)
```bash
# Start services
docker compose up backend

# Create a plant
curl -X POST http://localhost:8000/api/plants \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Basil",
    "species": "Ocimum basilicum",
    "thresholds": {
      "soil_moisture": {"min": 30.0, "max": 70.0},
      "temperature": {"min": 15.0, "max": 30.0}
    }
  }'

# List plants
curl http://localhost:8000/api/plants

# Get single plant (use ID from create response)
curl http://localhost:8000/api/plants/{plant_id}

# Update plant
curl -X PUT http://localhost:8000/api/plants/{plant_id} \
  -H "Content-Type: application/json" \
  -d '{"name": "Sweet Basil"}'

# Delete plant
curl -X DELETE http://localhost:8000/api/plants/{plant_id}
```

## Implementation Details

### Models
- Used Pydantic BaseModel for automatic validation
- Thresholds modeled as nested structures: PlantThresholds contains ThresholdConfig objects
- All threshold fields are optional (None allowed)
- PlantUpdate supports partial updates (all fields optional)
- PlantResponse includes device_count and latest_telemetry placeholder for future tasks

### Repository
- Uses asyncpg for database operations
- Thresholds converted to JSON strings for JSONB storage
- Dynamic UPDATE query construction based on provided fields (avoids overwriting with None)
- Delete operation cascades to devices (sets plant_id to NULL)
- All functions return dicts (asyncpg Record objects converted)

### Router
- Follows FastAPI best practices with response models
- Server-side UUID generation (uuid.uuid4())
- Proper HTTP status codes: 201 for create, 204 for delete, 404 for not found
- HTTPException raised for 404 cases
- Device count fetched for each plant in responses
- Pagination support with limit/offset query parameters

### Tests
- Uses unittest.mock.patch to mock repository functions
- Mock database responses with realistic data structures
- Tests all CRUD operations and error cases
- Follows async test pattern with pytest.mark.asyncio
- Tests verify status codes, response structure, and data correctness

## Next Steps

The next task can build upon:
- Plant models ready for telemetry queries (latest_telemetry field is placeholder)
- Device count already calculated and included in responses
- Repository layer ready for JOIN queries with telemetry table
- Threshold structure ready for alert monitoring (task-010+)
- UUID-based plant IDs ready for device assignment

## Definition of Done - Verified

- [x] `POST /api/plants` creates plant with server-generated ID
- [x] `GET /api/plants` returns list with pagination
- [x] `GET /api/plants/{id}` returns single plant
- [x] `PUT /api/plants/{id}` updates plant fields (partial updates)
- [x] `DELETE /api/plants/{id}` removes plant (204 status)
- [x] Thresholds stored as JSONB in database
- [x] All 11 tests pass

## Constraints Followed

- Did NOT implement telemetry queries (task-010)
- Did NOT implement device listing for plant (task-008)
- Plant ID generated server-side using uuid4
- Used asyncpg for all database operations
- Only modified files in `backend/**` (allowed_paths)
- No refactoring of unrelated code
- No features beyond task scope

## Risks/Follow-ups

- Thresholds are stored as JSONB - schema is flexible but not enforced at DB level
- Device count calculated per-request (may need optimization for large datasets)
- Latest telemetry field is placeholder (None) - will be populated in task-010
- Delete cascade only unassigns devices, doesn't delete them (by design)
- No validation that threshold min < max (Pydantic accepts any combination)
- Pagination has no maximum limit constraint (could return very large result sets)

---

## Key Files for Next Task

1. **src/models/plant.py** - PlantResponse.latest_telemetry field ready for telemetry data
2. **src/repositories/plant.py** - Ready for JOIN queries with telemetry table
3. **src/routers/plants.py** - Can add telemetry query param to list_plants endpoint
4. **Database schema** - plants.thresholds JSONB ready for alert comparisons

## API Summary

All plant endpoints follow RESTful conventions:
- Base path: `/api/plants`
- Proper HTTP verbs: POST (create), GET (read), PUT (update), DELETE (delete)
- Proper status codes: 200, 201, 204, 404
- Consistent response models: PlantResponse, PlantListResponse
- Error responses via HTTPException (converted to ErrorResponse by exception handlers)
