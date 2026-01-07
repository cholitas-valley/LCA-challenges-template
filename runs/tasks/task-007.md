---
task_id: task-007
title: Plant CRUD API
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
check_command: cd backend && python -m pytest tests/test_plants.py -v --tb=short
handoff: runs/handoffs/task-007.md
---

# Task 007: Plant CRUD API

## Goal

Implement the plant management API for creating, reading, updating, and deleting plants. Plants are the core entities that sensors monitor.

## Requirements

### Pydantic Models (backend/src/models/plant.py)

```python
class ThresholdConfig(BaseModel):
    min: float | None = None
    max: float | None = None

class PlantThresholds(BaseModel):
    soil_moisture: ThresholdConfig | None = None
    temperature: ThresholdConfig | None = None
    humidity: ThresholdConfig | None = None
    light_level: ThresholdConfig | None = None

class PlantCreate(BaseModel):
    name: str
    species: str | None = None
    thresholds: PlantThresholds | None = None

class PlantUpdate(BaseModel):
    name: str | None = None
    species: str | None = None
    thresholds: PlantThresholds | None = None

class PlantResponse(BaseModel):
    id: str
    name: str
    species: str | None
    thresholds: PlantThresholds | None
    created_at: datetime
    # Latest telemetry (optional, populated by service)
    latest_telemetry: dict | None = None
    device_count: int = 0

class PlantListResponse(BaseModel):
    plants: list[PlantResponse]
    total: int
```

### Plant Router (backend/src/routers/plants.py)

Endpoints:
- `POST /api/plants` - Create plant
  - Generate unique plant_id (uuid4)
  - Validate thresholds format
  - Return created plant

- `GET /api/plants` - List all plants
  - Include latest telemetry summary (optional query param)
  - Include device count
  - Pagination (limit/offset)

- `GET /api/plants/{plant_id}` - Get single plant
  - Include latest telemetry
  - Return 404 if not found

- `PUT /api/plants/{plant_id}` - Update plant
  - Partial update supported
  - Return updated plant

- `DELETE /api/plants/{plant_id}` - Delete plant
  - Cascade: unassign devices (set plant_id = NULL)
  - Return 204 No Content

### Plant Repository (backend/src/repositories/plant.py)

Database operations:
- `create_plant(name, species, thresholds)`
- `get_plant_by_id(plant_id)`
- `list_plants(limit, offset, include_telemetry)`
- `update_plant(plant_id, updates)`
- `delete_plant(plant_id)`
- `get_plant_device_count(plant_id)`

### Tests (backend/tests/test_plants.py)

Test cases:
- Create plant with name only
- Create plant with species and thresholds
- List plants returns created plants
- Get single plant by ID
- Update plant name
- Update plant thresholds
- Delete plant returns 204
- Get deleted plant returns 404

## Definition of Done

- [ ] `POST /api/plants` creates plant with ID
- [ ] `GET /api/plants` returns list with pagination
- [ ] `GET /api/plants/{id}` returns single plant
- [ ] `PUT /api/plants/{id}` updates plant fields
- [ ] `DELETE /api/plants/{id}` removes plant
- [ ] Thresholds stored as JSONB
- [ ] All tests pass

## Constraints

- Do NOT implement telemetry queries yet (that is task-010)
- Do NOT implement device listing for plant (that is task-008)
- Plant ID is generated server-side (uuid4)
- Use asyncpg for database operations
