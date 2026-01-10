---
task_id: task-053
title: "QA: Feature 5 Final Validation"
role: lca-qa
follow_roles: []
post: [lca-recorder, lca-docs, lca-gitops]
depends_on: [task-052]
inputs:
  - objective.md
  - runs/plan.md
  - runs/handoffs/task-052.md
  - frontend/src/pages/Designer.tsx
  - frontend/src/components/designer/DesignerCanvas.tsx
  - backend/src/routes/plants.py
allowed_paths:
  - frontend/**
  - backend/**
  - docs/**
  - runs/**
check_command: make check
handoff: runs/handoffs/task-053.md
---

# Task 053: QA Feature 5 Final Validation

## Goal

Perform final quality assurance for Feature 5 (Designer Space), verify all Definition of Done items are complete, ensure tests pass, and create Designer Space documentation.

## Context

All implementation tasks are complete:
- task-048: Backend position API
- task-049: SVG plant icon library
- task-050: DesignerCanvas component
- task-051: Status overlays and tooltips
- task-052: Designer page with sidebar

This task validates everything works correctly and documents the feature.

## Requirements

### 1. Verify Definition of Done

From objective.md Feature 5:

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

### 2. Run Full Test Suite

```bash
make check
# Expect: 139+ tests passing, build success
```

### 3. Icon Verification

Check all 20 plant icons exist and render correctly:

```bash
# List all SVG icons
ls frontend/src/components/icons/plants/*.svg | wc -l
# Should be 21 (20 plants + 1 fallback)

# Verify SVG structure
grep -l 'stroke="currentColor"' frontend/src/components/icons/plants/*.svg | wc -l
# Should match icon count (all use stroke-only)
```

### 4. API Verification

Test position API endpoint:

```bash
# Create a plant
curl -X POST http://localhost:8000/api/plants \
  -H "Content-Type: application/json" \
  -d '{"name": "Test Plant", "species": "Monstera"}'

# Set position
curl -X PUT http://localhost:8000/api/plants/{id}/position \
  -H "Content-Type: application/json" \
  -d '{"x": 100, "y": 200}'

# Verify position in GET
curl http://localhost:8000/api/plants | jq '.plants[0].position'
# Should return {"x": 100, "y": 200}
```

### 5. Create Designer Documentation

Create `docs/designer.md`:

```markdown
# Designer Space

The Designer Space provides a visual floor plan view where you can arrange your plants spatially and see their real-time status at a glance.

## Overview

The Designer uses a "clean technical" aesthetic with top-down plant icons. Each plant shows:
- A line-art icon based on species
- A status indicator (green/yellow/red/gray dot)
- The plant name

## Accessing the Designer

Navigate to `/designer` or click "Designer" in the main navigation.

## View Mode

In View Mode (default):
- See all your plants arranged on the canvas
- Hover over plants to see sensor readings
- Click a plant to go to its detail page

## Edit Mode

Switch to Edit Mode to rearrange plants:
1. Click the "Edit" button in the toolbar
2. Drag plants to reposition them
3. Drag plants from the sidebar to place them
4. Switch back to "View" when done

Positions are saved automatically.

## Sidebar

The sidebar shows plants that haven't been placed on the canvas yet. In Edit Mode, drag them onto the canvas to position them.

## Status Indicators

Each plant has a status dot:
- **Green**: Online, readings within thresholds
- **Yellow**: Warning, some readings outside optimal range
- **Red**: Critical, readings significantly outside thresholds
- **Gray**: Offline, no recent sensor data

## Tooltips

Hover over any plant to see current readings:
- Soil moisture (%)
- Temperature (C)
- Humidity (%)
- Light level (lux)
- Last updated timestamp

## Touch Support

On tablets and touch devices:
- Tap and hold to drag plants (Edit Mode)
- Tap a plant to see tooltip
- Tap again to navigate to details

## Keyboard Navigation

- Tab: Move focus between plants
- Enter: Navigate to focused plant's detail page
- Arrow keys: Move focused plant (Edit Mode)
```

### 6. Visual Review Checklist

Perform manual visual review:

- [ ] Icons are consistent style (line-art, no fills)
- [ ] Status dots use correct semantic colors
- [ ] Tooltips are readable and positioned correctly
- [ ] Canvas has clean, minimal appearance
- [ ] Grid is subtle (not distracting)
- [ ] Sidebar integrates well with layout
- [ ] Mode toggle is clear and accessible
- [ ] Responsive at different screen sizes

### 7. Accessibility Check

- [ ] Designer page has proper heading hierarchy
- [ ] Plants are keyboard navigable
- [ ] Focus states are visible
- [ ] Color is not the only status indicator (dots have tooltips)
- [ ] Screen reader can identify plants

### 8. Cross-browser/Device Testing

Test on:
- [ ] Chrome (desktop)
- [ ] Firefox (desktop)
- [ ] Safari (if available)
- [ ] Mobile viewport (responsive)

## Files to Create/Verify

1. `docs/designer.md` - CREATE
2. All 21 SVG icons - VERIFY exist
3. All designer components - VERIFY functional
4. Position API - VERIFY working
5. Navigation - VERIFY Designer link present

## QA Checklist

- [ ] `make check` passes with 139+ tests
- [ ] `npm run build` succeeds
- [ ] `npm run lint` passes
- [ ] 21 SVG icons exist and render
- [ ] PlantIcon shows fallback for unknown species
- [ ] DesignerCanvas renders plants correctly
- [ ] Drag-and-drop works in edit mode
- [ ] Position saves via API
- [ ] Tooltips show sensor readings
- [ ] Status dots use semantic colors
- [ ] Offline plants are dimmed
- [ ] `/designer` route accessible
- [ ] Navigation includes Designer link
- [ ] Edit/View toggle works
- [ ] Documentation created

## Definition of Done

1. All Feature 5 DoD items verified and checked
2. `make check` passes (139+ tests)
3. All visual elements match "clean technical" aesthetic
4. `docs/designer.md` created and complete
5. Cross-browser/device testing complete
6. No accessibility regressions

## Verification

```bash
# Full verification script
make check

# Icon count
ls frontend/src/components/icons/plants/*.svg | wc -l

# Doc exists
cat docs/designer.md | head -20

# Manual testing of designer page
# - Open /designer
# - Toggle edit mode
# - Drag plants
# - Check tooltips
# - Verify positions persist
```
