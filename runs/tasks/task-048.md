---
task_id: task-048
title: "Backend: Position Column + API"
role: lca-backend
follow_roles: []
post: [lca-recorder, code-simplifier, lca-gitops]
depends_on: []
inputs:
  - objective.md
  - runs/plan.md
  - backend/src/models/plant.py
  - backend/src/db/migrations/006_create_care_plans.py
allowed_paths:
  - backend/**
  - docs/api.md
check_command: make check
handoff: runs/handoffs/task-048.md
---

# Task 048: Backend Position Column + API

## Goal

Add position storage to the plants table and create an API endpoint for updating plant positions. This enables the Designer Space feature to persist plant locations on the visual floor plan.

## Context

The Designer Space feature (Feature 5) requires storing x/y coordinates for each plant so they can be rendered in a spatial layout. The position data should be optional (null for plants not yet placed on the canvas).

**Current state:**
- Plants table has: id, name, species, thresholds, created_at
- No position column exists
- GET /api/plants returns list of plants without position data

## Requirements

### 1. Database Migration (007_add_plant_position.py)

Create migration to add position column:

```python
"""
Migration 007: Add position column to plants table.
"""

async def up(conn):
    """Add position JSONB column for designer coordinates."""
    await conn.execute("""
        ALTER TABLE plants ADD COLUMN IF NOT EXISTS position JSONB
    """)
```

**Position format:**
```json
{ "x": 120, "y": 80 }
```

- `x`: horizontal position (pixels from left)
- `y`: vertical position (pixels from top)
- `null`: plant not placed on canvas (default)

### 2. Update Plant Models

Update `backend/src/models/plant.py`:

```python
class PlantPosition(BaseModel):
    """Position on the designer canvas."""
    x: float
    y: float

class PlantResponse(BaseModel):
    """Response model for plant information."""
    id: str
    name: str
    species: str | None
    thresholds: PlantThresholds | None
    position: PlantPosition | None = None  # ADD THIS
    created_at: datetime
    latest_telemetry: dict | None = None
    device_count: int = 0

class PlantPositionUpdate(BaseModel):
    """Request model for updating plant position."""
    x: float
    y: float
```

### 3. API Endpoint

Add `PUT /api/plants/{id}/position`:

```python
@router.put("/plants/{plant_id}/position")
async def update_plant_position(
    plant_id: str,
    position: PlantPositionUpdate,
    conn = Depends(get_db_connection)
) -> PlantResponse:
    """Update plant position for designer canvas."""
    # Verify plant exists
    # Update position JSONB
    # Return updated plant
```

**Request:**
```json
PUT /api/plants/abc123/position
{
  "x": 120,
  "y": 80
}
```

**Response:** Full PlantResponse with updated position

**Errors:**
- 404 if plant not found
- 422 if invalid position data

### 4. Update GET /api/plants

Ensure the existing `GET /api/plants` endpoint returns the position field:

```json
{
  "plants": [
    {
      "id": "abc123",
      "name": "Monstera",
      "species": "Monstera Deliciosa",
      "position": { "x": 120, "y": 80 },
      ...
    }
  ]
}
```

Plants with no position return `"position": null`.

### 5. Tests

Add tests for the new endpoint:

```python
# test_plants.py additions

async def test_update_plant_position():
    """Test setting plant position."""
    # Create plant
    # PUT position
    # Verify response has position
    # GET plant and verify position persisted

async def test_update_position_nonexistent_plant():
    """Test 404 for missing plant."""
    
async def test_get_plants_includes_position():
    """Test GET /api/plants returns position field."""
```

### 6. Update API Documentation

Update `docs/api.md` with the new endpoint:

```markdown
### PUT /api/plants/{id}/position

Update plant position for the designer canvas.

**Request:**
| Field | Type | Description |
|-------|------|-------------|
| x | float | Horizontal position in pixels |
| y | float | Vertical position in pixels |

**Response:** PlantResponse object with updated position.

**Errors:**
- 404: Plant not found
- 422: Invalid position data
```

## Files to Create/Modify

1. `backend/src/db/migrations/007_add_plant_position.py` - CREATE
2. `backend/src/models/plant.py` - MODIFY (add position fields)
3. `backend/src/routes/plants.py` - MODIFY (add position endpoint)
4. `backend/tests/test_plants.py` - MODIFY (add position tests)
5. `docs/api.md` - MODIFY (add endpoint documentation)

## Definition of Done

1. Migration 007 adds `position JSONB` column to plants table
2. `PUT /api/plants/{id}/position` endpoint works correctly
3. `GET /api/plants` returns position field (null if not set)
4. New tests pass for position endpoint
5. `make check` passes (139+ tests)
6. API documentation updated

## Verification

```bash
# Run tests
make check

# Manual verification
curl -X PUT http://localhost:8000/api/plants/{id}/position \
  -H "Content-Type: application/json" \
  -d '{"x": 100, "y": 200}'

curl http://localhost:8000/api/plants
# Should show position in response
```
