# Task 048 Handoff: Backend Position Column + API

## Summary

Successfully implemented position storage and API endpoints for the Designer Space feature. Added a JSONB column to the plants table to store x/y coordinates, updated all relevant endpoints to include position in responses, and created a dedicated PUT endpoint to update plant positions.

## Files Modified

### Created
- `backend/src/db/migrations/007_add_plant_position.py` - Migration to add position JSONB column

### Modified
- `backend/src/models/plant.py` - Added PlantPosition and PlantPositionUpdate models, updated PlantResponse to include position field
- `backend/src/repositories/plant.py` - Added position parsing and update_plant_position() function
- `backend/src/routers/plants.py` - Updated all plant endpoints to include position in responses, added PUT /api/plants/{id}/position endpoint
- `backend/tests/test_plants.py` - Added 3 new tests for position functionality
- `docs/api.md` - Documented the new PUT /api/plants/{id}/position endpoint

## Interfaces Changed

### Database Schema
- **plants table**: Added `position JSONB` column (nullable)
  - Format: `{"x": 120.0, "y": 80.0}`
  - null when plant not placed on canvas

### API Changes

#### PlantResponse Model (all plant endpoints)
Added optional position field:
```json
{
  "id": "plant-123",
  "name": "Monstera",
  "species": "...",
  "thresholds": {...},
  "position": {"x": 120.0, "y": 80.0},  // NEW - null if not set
  "created_at": "...",
  "latest_telemetry": {...},
  "device_count": 1
}
```

#### New Endpoint
**PUT /api/plants/{id}/position**
- Request: `{"x": float, "y": float}`
- Response: Full PlantResponse with updated position
- Errors: 404 (plant not found), 422 (invalid data)

### Updated Endpoints
All endpoints now return position field:
- POST /api/plants
- GET /api/plants
- GET /api/plants/{id}
- PUT /api/plants/{id}

## How to Verify

### Run Tests
```bash
make check
# Result: 142 tests passed (3 new tests added)
```

### Manual Testing
```bash
# Create a plant
curl -X POST http://localhost:8000/api/plants \
  -H "Content-Type: application/json" \
  -d '{"name": "Test Plant"}'

# Update position
curl -X PUT http://localhost:8000/api/plants/{id}/position \
  -H "Content-Type: application/json" \
  -d '{"x": 120.0, "y": 80.0}'

# Verify in list (should show position)
curl http://localhost:8000/api/plants
```

## Implementation Notes

### Position Field Handling
- Position is optional (nullable) - defaults to null for new plants
- All existing plant endpoints now parse and return position
- Position is stored as JSONB in PostgreSQL for flexibility
- PlantPosition model enforces x and y as float values

### Migration
- Migration 007 uses `IF NOT EXISTS` to be idempotent
- Safe to run on existing databases
- Existing plants will have position = null

### Repository Pattern
- Added `update_plant_position()` dedicated function for atomic position updates
- Updated `_parse_plant_row()` to handle position deserialization from JSONB

### Tests
Added comprehensive test coverage:
1. `test_update_plant_position` - Happy path for position update
2. `test_update_position_nonexistent_plant` - 404 error handling
3. `test_get_plants_includes_position` - Verifies position in list responses (both null and set values)

## Next Steps

Frontend team can now:
1. Call PUT /api/plants/{id}/position when user drags plants on canvas
2. Read position field from GET /api/plants to render plants at saved positions
3. Handle null position (render in default location or prompt user to place)

## Risks / Follow-ups

None identified. Implementation is complete and all tests pass.
