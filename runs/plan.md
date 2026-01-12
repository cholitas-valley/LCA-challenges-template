# PlantOps Implementation Plan

> Run 007 - Feature 6: Scandinavian Room View

## Run/007 Status: PLANNING

```
┌──────┬─────────────────────────────────────────┬────────┐
│ Task │                  Title                  │ Status │
├──────┼─────────────────────────────────────────┼────────┤
│ 054  │ Copy Assets & Create PlantImage         │ -      │
├──────┼─────────────────────────────────────────┼────────┤
│ 055  │ Room Background & Fixed Positions       │ -      │
├──────┼─────────────────────────────────────────┼────────┤
│ 056  │ Scandinavian DesignerCanvas Restyle     │ -      │
├──────┼─────────────────────────────────────────┼────────┤
│ 057  │ Cozy Tooltips & Status Indicators       │ -      │
├──────┼─────────────────────────────────────────┼────────┤
│ 058  │ QA: Feature 6 Final Validation          │ -      │
└──────┴─────────────────────────────────────────┴────────┘
```

---

## Previous Runs

### Run/006 Status: COMPLETE
- Feature 5: Designer Space (tasks 048-053)
- 142 tests passing

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

This plan implements Feature 6: Scandinavian Room View. The feature transforms the existing Designer Space from a technical blueprint aesthetic into a cozy, inviting Scandinavian-style room illustration with botanically accurate plant artwork.

**Key Change:** This is a frontend-only visual redesign of the `/designer` page. The existing backend position storage from Feature 5 is reused without modification.

**Scope:** Frontend only (`frontend/`)

**Primary Roles:**
- `lca-frontend` for all implementation tasks (tasks 054-057)
- `lca-qa` for final validation (task-058)

**Test Baseline:** 142 tests passing (must not regress)

## Pre-created Assets

All visual assets are READY in `plants-png/` and must NOT be regenerated:

| Asset | Source | Destination |
|-------|--------|-------------|
| `plants-png/room.png` | Scandinavian room (~10MB) | `frontend/src/assets/room.png` |
| `plants-png/monstera.png` | Monstera illustration | `frontend/src/assets/plants/monstera.png` |
| `plants-png/snakeplant.png` | Snake Plant illustration | `frontend/src/assets/plants/snakeplant.png` |
| `plants-png/pothos.png` | Pothos illustration | `frontend/src/assets/plants/pothos.png` |
| `plants-png/fiddle.png` | Fiddle Leaf Fig | `frontend/src/assets/plants/fiddle.png` |
| `plants-png/spider.png` | Spider Plant | `frontend/src/assets/plants/spider.png` |
| `plants-png/peacelily.png` | Peace Lily | `frontend/src/assets/plants/peacelily.png` |
| `plants-png/rubber.png` | Rubber Plant | `frontend/src/assets/plants/rubber.png` |
| `plants-png/zzplant.png` | ZZ Plant | `frontend/src/assets/plants/zzplant.png` |
| `plants-png/philondendron.png` | Philodendron | `frontend/src/assets/plants/philondendron.png` |
| `plants-png/aloevera.png` | Aloe Vera | `frontend/src/assets/plants/aloevera.png` |
| `plants-png/boston.png` | Boston Fern | `frontend/src/assets/plants/boston.png` |
| `plants-png/chinese.png` | Chinese Evergreen | `frontend/src/assets/plants/chinese.png` |
| `plants-png/dracaena.png` | Dracaena | `frontend/src/assets/plants/dracaena.png` |
| `plants-png/jade.png` | Jade Plant | `frontend/src/assets/plants/jade.png` |
| `plants-png/stringofpearls.png` | String of Pearls | `frontend/src/assets/plants/stringofpearls.png` |
| `plants-png/calathea.png` | Calathea | `frontend/src/assets/plants/calathea.png` |
| `plants-png/birdofparadise.png` | Bird of Paradise | `frontend/src/assets/plants/birdofparadise.png` |
| `plants-png/englishivy.png` | English Ivy | `frontend/src/assets/plants/englishivy.png` |
| `plants-png/succulenta.png` | Succulent | `frontend/src/assets/plants/succulenta.png` |
| `plants-png/cactus.png` | Cactus | `frontend/src/assets/plants/cactus.png` |

## Design Philosophy

**"Minimalist Scandinavian Plant Room" Style:**
- 2D flat-lay illustration viewed from the front like a diorama
- Cozy, inviting aesthetic (not technical blueprint)
- Soft, muted, natural color palette:
  - Whites and creams (walls)
  - Light woods: birch, ash (furniture)
  - Soft greens (plants)
  - Touches of grey and pastel blue (accents)

**Key Difference from Feature 5:**
- Feature 5: Top-down SVG line art, monochrome, free positioning
- Feature 6: Front-view PNG illustrations, soft colors, 20 fixed spots

## Architecture

### No Backend Changes
Feature 6 reuses the existing position storage from Feature 5:
- `position JSONB` column in plants table (already exists)
- `PUT /api/plants/{id}/position` endpoint (already exists)
- `GET /api/plants` returns position (already exists)

The fixed spot system will map spot IDs (1-20) to fixed X/Y coordinates on the frontend.

### Frontend Components

```
frontend/src/
  assets/
    room.png                     # Scandinavian room background (NEW)
    plants/                      # PNG plant illustrations (NEW)
      monstera.png
      snakeplant.png
      ...
  components/
    designer/
      PlantImage.tsx             # PNG image component with species mapping (NEW)
      ScandinavianCanvas.tsx     # New canvas with room background (NEW)
      PlantSpot.tsx              # Fixed position spot component (NEW)
      CozyTooltip.tsx            # Soft-styled tooltip (NEW)
      PlantIcon.tsx              # Existing SVG icons (KEEP as fallback)
      DesignerCanvas.tsx         # Existing canvas (MODIFY or replace)
      PlantTooltip.tsx           # Existing tooltip (MODIFY for cozy style)
      DesignerSidebar.tsx        # Keep with minor styling updates
      DesignerToolbar.tsx        # Keep with minor styling updates
```

### Fixed Plant Positions (20 Spots)

```typescript
interface PlantSpot {
  id: number;           // 1-20
  location: 'shelf' | 'sideboard' | 'floor';
  x: number;            // Fixed X coordinate (% of canvas)
  y: number;            // Fixed Y coordinate (% of canvas)
  size: 'small' | 'medium' | 'large';
  plantId: string | null;
}

// Distribution:
// - Floating shelves: spots 1-6 (small to medium plants)
// - Sideboard surface: spots 7-14 (varying sizes)
// - Floor: spots 15-20 (larger plants)
```

### Data Flow

```
1. User opens /designer
2. Fetch plants from GET /api/plants (includes position data)
3. Map plant positions to fixed spots (position.x/y matches spot coordinates)
4. Render room background with plants at their assigned spots
5. Click empty spot (edit mode) -> open plant assignment UI
6. Click occupied spot -> view plant details or reassign
7. Tooltips show sensor readings with cozy styling
```

## Implementation Tasks

### Task 054: Copy Assets & Create PlantImage Component
- Copy room.png and all plant PNGs from `plants-png/` to `frontend/src/assets/`
- Create PlantImage component with species-to-filename mapping
- Fallback to generic plant image for unknown species
- Handle image loading states
- Tests for PlantImage component

### Task 055: Room Background & Fixed Position System
- Create PLANT_SPOTS constant with 20 fixed positions
- Create PlantSpot component for interactive spots
- Create ScandinavianCanvas component with room background
- Implement spot assignment logic (click empty spot to assign plant)
- Visual indicator for empty vs occupied spots

### Task 056: Scandinavian DesignerCanvas Restyle
- Replace/update DesignerCanvas to use ScandinavianCanvas
- Remove grid overlay (replaced by room illustration)
- Update Designer page to use new canvas
- Maintain edit/view mode functionality
- Ensure plants render correctly at fixed positions

### Task 057: Cozy Tooltips & Status Indicators
- Create CozyTooltip with soft rounded corners, cream background
- Update status indicator colors to muted Scandinavian palette:
  - Healthy: Soft sage green (not bright)
  - Warning: Muted amber/gold
  - Critical: Dusty rose/coral (not harsh red)
  - Offline: Light grey, faded plant
- Add subtle status ring around plant pot
- Smooth hover transitions

### Task 058: QA Feature 6 Final Validation
- Verify all Definition of Done items
- Test spot assignment workflow
- Verify tooltip styling and content
- Test position persistence (spots map to backend positions)
- Visual review of cozy Scandinavian aesthetic
- Cross-browser/device testing

## Documentation

Documentation updates for `docs/`:

- `docs/designer.md` - Update existing documentation
  - Sections to update: Overview (new visual style), View Mode, Edit Mode
  - Add: Fixed position spots explanation
  - Updated by: task-058

## Task Outline

### Feature 6: Scandinavian Room View

| ID | Title | Role | Depends On |
|----|-------|------|------------|
| 054 | Copy Assets & Create PlantImage | frontend | - |
| 055 | Room Background & Fixed Positions | frontend | 054 |
| 056 | Scandinavian DesignerCanvas Restyle | frontend | 055 |
| 057 | Cozy Tooltips & Status Indicators | frontend | 056 |
| 058 | QA: Feature 6 Final Validation | qa | 057 |

**Serial Execution:** Tasks depend on each other in sequence.

## Risks and Mitigations

| Risk | Mitigation |
|------|------------|
| Large PNG file sizes (~6-9MB each) | Use lazy loading, consider image optimization |
| Position mapping complexity | Clear spot ID to coordinate mapping, well-documented |
| Visual consistency | Stick to pre-created assets, no regeneration |
| Breaking existing tests | Minimal changes to tested logic, add new components |
| Responsive layout challenges | Test on multiple screen sizes, use percentage positioning |

## Success Criteria (Feature 6)

From objective.md Definition of Done:

**Room Scene:**
- [ ] Background renders in Designer page
- [ ] Room image copied to `frontend/src/assets/` and imported
- [ ] Responsive scaling works
- [ ] Plants layer correctly on top of room background

**Plant Positions:**
- [ ] 20 fixed spots defined (6 shelf, 8 sideboard, 6 floor)
- [ ] Click-to-assign interaction
- [ ] Visual indicator for empty vs occupied spots
- [ ] Position assignment persists to backend

**Plant Illustrations:**
- [ ] Plant images copied to `frontend/src/assets/plants/` and imported
- [ ] `<PlantImage species="monstera" />` component renders correct image
- [ ] Fallback image for unknown species
- [ ] Images scale appropriately for shelf/sideboard/floor positions

**UI Polish:**
- [ ] Tooltip matches cozy aesthetic
- [ ] Status indicators are subtle (not harsh colors)
- [ ] Smooth transitions/animations
- [ ] Works on desktop and tablet

**Quality:**
- [ ] `make check` passes
- [ ] Visual review confirms cozy Scandinavian feel
- [ ] Plants are identifiable by species
- [ ] No visual clutter - maintains minimalism

## Skills Reference

Available skills in `.claude/skills/`:
- `ui-design` - Component patterns, illustration integration
- `ux-design` - Interaction patterns, delight details
- `tailwind-css` - Styling, color palette
- `frontend` - React component structure
- `design-systems` - Consistent visual language

---

*Generated by lca-planner for run/007*
