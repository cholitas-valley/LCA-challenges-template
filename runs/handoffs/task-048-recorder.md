# Task 048 Recorder: Backend Position Column + API

## Changes Summary

Successfully implemented position storage infrastructure for the Designer Space feature (Feature 5). Added JSONB position column to plants table, extended all plant API endpoints to include position data, and created a dedicated PUT endpoint for updating plant positions on the canvas.

**Status:** Complete - 142 tests passing (3 new tests added)

## Files Touched

### Created
- `backend/src/db/migrations/007_add_plant_position.py` - Migration for position JSONB column

### Modified
- `backend/src/models/plant.py` - Added PlantPosition, PlantPositionUpdate models; updated PlantResponse
- `backend/src/repositories/plant.py` - Added position parsing and update_plant_position() function
- `backend/src/routers/plants.py` - Updated all endpoints to include position; added PUT /api/plants/{id}/position
- `backend/tests/test_plants.py` - Added 3 new position tests
- `docs/api.md` - Documented new position endpoint

## Interfaces Changed

### Database Schema
**plants table:**
- Added `position JSONB` column (nullable)
- Format: `{"x": 120.0, "y": 80.0}`
- Defaults to null for new plants

### API Contracts

**PlantResponse Model** (all endpoints affected):
```json
{
  "id": "plant-123",
  "name": "Monstera",
  "species": "...",
  "thresholds": {...},
  "position": {"x": 120.0, "y": 80.0},
  "created_at": "...",
  "latest_telemetry": {...},
  "device_count": 1
}
```

**New Endpoint:**
- `PUT /api/plants/{id}/position` - Update plant position
- Request: `{"x": float, "y": float}`
- Response: Full PlantResponse with updated position
- Errors: 404 (plant not found), 422 (invalid data)

## Critical for Next Tasks

**Task 050 (DesignerCanvas Frontend)** needs this:
- PUT `/api/plants/{id}/position` endpoint is ready
- PlantResponse includes position field in all responses
- Position defaults to null for new/unplaced plants

---

**Recorded by:** lca-recorder
**Timestamp:** 2026-01-10
