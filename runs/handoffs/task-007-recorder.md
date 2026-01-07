# Recorder: task-007

## Changes Summary

Implemented Plant CRUD API with full create, read, update, delete operations. Plants are core entities that sensors monitor.

## Key Files

- `backend/src/models/plant.py`: ThresholdConfig, PlantThresholds, PlantCreate, PlantUpdate, PlantResponse
- `backend/src/repositories/plant.py`: create_plant, get_plant_by_id, list_plants, update_plant, delete_plant
- `backend/src/routers/plants.py`: POST/GET/PUT/DELETE /api/plants endpoints
- `backend/tests/test_plants.py`: 11 unit tests

## Interfaces for Next Task

### API Endpoints
- `POST /api/plants` - Create plant (returns 201 + PlantResponse)
- `GET /api/plants?limit=10&offset=0` - List plants
- `GET /api/plants/{plant_id}` - Get single plant
- `PUT /api/plants/{plant_id}` - Update plant
- `DELETE /api/plants/{plant_id}` - Delete plant (returns 204)

### Models
```python
from src.models.plant import (
    PlantCreate, PlantUpdate, PlantResponse, PlantListResponse,
    PlantThresholds, ThresholdConfig
)
```

### Repository
```python
from src.repositories.plant import (
    create_plant, get_plant_by_id, list_plants,
    update_plant, delete_plant, get_plant_device_count
)
```

## Notes

- Plant ID is UUID4, generated server-side
- Thresholds stored as JSONB for flexibility
- Partial updates supported (only update provided fields)
- Delete cascades: unassigns devices (sets plant_id=NULL)
- device_count included in response
- latest_telemetry placeholder (task-010)
