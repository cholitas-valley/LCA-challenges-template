# PlantOps Implementation Plan

> Run 006 - Feature 5: Designer Space (Visual Floor Plan)

## Run/006 Status: PLANNING

```
┌──────┬─────────────────────────────────────────┬────────┐
│ Task │                  Title                  │ Status │
├──────┼─────────────────────────────────────────┼────────┤
│ 048  │ Backend: Position Column + API          │ -      │
├──────┼─────────────────────────────────────────┼────────┤
│ 049  │ Frontend: SVG Plant Icon Library        │ -      │
├──────┼─────────────────────────────────────────┼────────┤
│ 050  │ Frontend: DesignerCanvas Component      │ -      │
├──────┼─────────────────────────────────────────┼────────┤
│ 051  │ Frontend: Status Overlays + Tooltips    │ -      │
├──────┼─────────────────────────────────────────┼────────┤
│ 052  │ Frontend: Designer Page with Sidebar    │ -      │
├──────┼─────────────────────────────────────────┼────────┤
│ 053  │ QA: Feature 5 Final Validation          │ -      │
└──────┴─────────────────────────────────────────┴────────┘
```

---

## Previous Runs

### Run/005 Status: COMPLETE
- Feature 4: UI/UX Refactor (tasks 038-047)
- 139 tests passing

### Run/004 Status: COMPLETE
- Feature 3: Production Hardening (tasks 026-037)
- 139 tests passing

### Run/003 Status: COMPLETE
- Feature 1: Core Platform + Feature 2: LLM Care Advisor (tasks 001-025)
- 116 tests passing

---

## Overview

This plan implements Feature 5: Designer Space for PlantOps. The feature adds a visual floor plan view where users can see plants spatially arranged with real-time status overlays.

**Scope:**
- Backend: Position storage (`backend/`)
- Frontend: SVG icons, canvas, designer page (`frontend/`)

**Primary Roles:**
- `lca-backend` for position API (task-048)
- `lca-frontend` for all UI tasks (tasks 049-052)
- `lca-qa` for final validation (task-053)

**Test Baseline:** 139 tests passing (must not regress)

## Design Philosophy

**"Clean Technical" Style:**
- Top-down 2D view (architectural floor plan aesthetic)
- Monochrome lines (black/dark grey) on white background
- No shading, shadows, or 3D effects
- Simple geometric plant outlines
- Status colors (green/yellow/red) pop against monochrome base

## Architecture

### Backend Changes

```
Database:
- ALTER TABLE plants ADD COLUMN position JSONB
- Position format: { "x": 120, "y": 80 }

API:
- PUT /api/plants/{id}/position - Set plant position
- GET /api/plants - Returns position in response (existing endpoint)
```

### Frontend Components

```
frontend/src/components/
  designer/
    PlantIcon.tsx           # SVG icon component with species mapping
    DesignerCanvas.tsx      # Interactive canvas with drag-drop
    PlantTooltip.tsx        # Hover tooltip with sensor readings
    DesignerSidebar.tsx     # Unplaced plants list
  icons/
    plants/                 # 20 SVG plant icons
      monstera.svg
      snake-plant.svg
      ...

frontend/src/pages/
  Designer.tsx              # /designer route
```

### Data Flow

```
1. User opens /designer
2. Fetch plants with positions from GET /api/plants
3. Render placed plants on canvas, unplaced in sidebar
4. User drags plant from sidebar → canvas
5. PUT /api/plants/{id}/position saves position
6. Real-time status from existing telemetry data
7. Hover shows tooltip with sensor readings
```

## Implementation Tasks

### Task 048: Backend Position API
- Add `position JSONB` column to plants table (migration 007)
- Add `PUT /api/plants/{id}/position` endpoint
- Update plant models to include position
- Update GET /api/plants to return position
- Tests for new endpoint

### Task 049: SVG Plant Icon Library
- Create 20 SVG plant icons (top-down line art)
- PlantIcon component with species prop
- Fallback icon for unknown species
- Icons use stroke-only, monochrome style

### Task 050: DesignerCanvas Component
- SVG-based canvas rendering
- Grid system with optional snap-to-grid
- Render plants at their positions
- Click plant to navigate to detail page
- Responsive to container size

### Task 051: Status Overlays + Hover Tooltips
- Status dots on each plant (uses semantic tokens)
- Hover tooltip showing sensor readings:
  - Soil moisture, temperature, humidity, light
  - Last updated timestamp
  - "No data" for offline plants
- Offline plants visually dimmed

### Task 052: Designer Page with Sidebar
- New `/designer` route
- Sidebar with unplaced plants
- Drag-and-drop from sidebar to canvas
- Edit/View mode toggle
- Navigation integration

### Task 053: Feature 5 Final QA
- Verify all Definition of Done items
- Test drag-and-drop functionality
- Verify tooltips on all plants
- Test position persistence
- Visual review of "clean technical" aesthetic

## Documentation

Documentation updates for `docs/`:

- `docs/designer.md` - Designer Space documentation (NEW)
  - Sections: Overview, Plant Icons, Canvas Usage, Keyboard Shortcuts
  - Created by: task-053

- `docs/api.md` - API documentation update
  - Add: PUT /api/plants/{id}/position endpoint
  - Updated by: task-048

## Task Outline

### Feature 5: Designer Space

| ID | Title | Role | Depends On |
|----|-------|------|------------|
| 048 | Backend: Position Column + API | backend | - |
| 049 | Frontend: SVG Plant Icon Library | frontend | - |
| 050 | Frontend: DesignerCanvas Component | frontend | 048, 049 |
| 051 | Frontend: Status Overlays + Tooltips | frontend | 050 |
| 052 | Frontend: Designer Page with Sidebar | frontend | 051 |
| 053 | QA: Feature 5 Final Validation | qa | 052 |

**Parallelization:** Tasks 048 and 049 can run in parallel (no dependencies).

## Risks and Mitigations

| Risk | Mitigation |
|------|------------|
| Drag-and-drop complexity | Use proven library (react-dnd or native HTML5 drag) |
| SVG performance with many plants | Limit to reasonable count (100 max), virtualize if needed |
| Position API conflicts | Use PUT (idempotent), handle concurrent updates |
| Icon consistency | Define strict style guide before creating icons |
| Touch device support | Test on tablet, ensure touch-friendly drag handles |

## Success Criteria (Feature 5)

From objective.md Definition of Done:

**Icons:**
- [ ] 20 SVG plant icons created (top-down line art)
- [ ] Icons accessible via `<PlantIcon species="monstera" />`
- [ ] Fallback icon for unknown species

**Canvas:**
- [ ] DesignerCanvas component renders plants at positions
- [ ] Drag-and-drop to reposition (edit mode)
- [ ] Click plant navigates to plant detail
- [ ] Responsive canvas sizing

**Status:**
- [ ] Status dots use semantic tokens
- [ ] Real-time updates (polling or existing data)
- [ ] Offline plants visually dimmed
- [ ] Hover tooltip shows sensor readings (soil, temp, humidity, light)
- [ ] Tooltip shows "last updated" timestamp

**Backend:**
- [ ] `position` column added to plants table
- [ ] `PUT /api/plants/{id}/position` endpoint
- [ ] Position included in `GET /api/plants` response

**Page:**
- [ ] `/designer` route added
- [ ] Sidebar shows unplaced plants
- [ ] Edit/View mode toggle
- [ ] Integrates with existing navigation

**Quality:**
- [ ] `make check` passes
- [ ] Visual matches "clean technical" aesthetic
- [ ] Touch-friendly (works on tablet)

## Skills Reference

Available skills in `.claude/skills/`:
- `ui-design` - Component patterns, visual hierarchy
- `ux-design` - Interaction patterns, drag-and-drop
- `tailwind-css` - Styling approach
- `frontend` - React patterns
- `design-systems` - Consistent token usage

---

*Generated by lca-planner for run/006*
