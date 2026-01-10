---
task_id: task-058
title: "QA: Feature 6 Final Validation"
role: lca-qa
follow_roles: []
post: [lca-recorder, lca-docs, lca-gitops]
depends_on: [task-057]
inputs:
  - objective.md
  - runs/plan.md
  - runs/handoffs/task-057.md
  - frontend/src/pages/Designer.tsx
  - frontend/src/components/designer/ScandinavianCanvas.tsx
  - docs/designer.md
allowed_paths:
  - frontend/**
  - docs/**
  - runs/**
check_command: make check
handoff: runs/handoffs/task-058.md
---

# Task 058: QA Feature 6 Final Validation

## Goal

Perform final quality assurance for Feature 6 (Scandinavian Room View), verify all Definition of Done items are complete, ensure tests pass, and update Designer Space documentation.

## Context

All implementation tasks are complete:
- task-054: Copy assets and create PlantImage component
- task-055: Room background and fixed position system
- task-056: Scandinavian DesignerCanvas restyle
- task-057: Cozy tooltips and status indicators

This task validates everything works correctly and updates documentation.

## Requirements

### 1. Verify Definition of Done

From objective.md Feature 6:

**Room Scene:**
- [ ] Background renders in Designer page
- [ ] Room image copied to `frontend/src/assets/` and imported
- [ ] Responsive scaling works
- [ ] Plants layer correctly on top of room background

**Plant Positions:**
- [ ] 20 fixed spots defined (6 shelf, 8 sideboard, 6 floor)
- [ ] Click-to-assign interaction works
- [ ] Visual indicator for empty vs occupied spots
- [ ] Position assignment persists to backend

**Plant Illustrations:**
- [ ] Plant images copied to `frontend/src/assets/plants/` and imported
- [ ] `<PlantImage species="monstera" />` component renders correct image
- [ ] Fallback image for unknown species
- [ ] Images scale appropriately for shelf/sideboard/floor positions

**UI Polish:**
- [ ] Tooltip matches cozy aesthetic (cream background, rounded corners)
- [ ] Status indicators are subtle (muted Scandinavian colors)
- [ ] Smooth transitions/animations (200ms)
- [ ] Works on desktop and tablet

**Quality:**
- [ ] `make check` passes
- [ ] Visual review confirms cozy Scandinavian feel
- [ ] Plants are identifiable by species
- [ ] No visual clutter - maintains minimalism

### 2. Run Full Test Suite

```bash
make check
# Expect: 142+ tests passing, build success
```

### 3. Asset Verification

Check all assets are in place:

```bash
# Room background
ls -la frontend/src/assets/room.png
# Should exist, ~10MB

# Plant images
ls frontend/src/assets/plants/*.png | wc -l
# Should be 20

# Verify all species have images
for species in monstera snakeplant pothos fiddle spider peacelily rubber zzplant philondendron aloevera boston chinese dracaena jade stringofpearls calathea birdofparadise englishivy succulenta cactus; do
  ls frontend/src/assets/plants/${species}.png
done
```

### 4. Component Verification

Test each new component:

```bash
cd frontend

# PlantImage tests
npm test -- PlantImage

# PlantSpot tests
npm test -- PlantSpot

# ScandinavianCanvas tests
npm test -- ScandinavianCanvas

# CozyTooltip tests
npm test -- CozyTooltip

# StatusRing tests
npm test -- StatusRing
```

### 5. Visual Review Checklist

Perform manual visual review:

**Room Scene:**
- [ ] Room background loads and displays correctly
- [ ] No pixelation or stretching
- [ ] Background scales with window size

**Plant Spots:**
- [ ] 20 spots visible in edit mode
- [ ] Empty spots show dashed outline
- [ ] Occupied spots show plant image
- [ ] Spots are positioned correctly on furniture

**Plant Images:**
- [ ] All plant species render their correct image
- [ ] Images scale properly (small/medium/large)
- [ ] No broken image icons
- [ ] Plants look natural in the room

**Tooltips:**
- [ ] Cream background color (#FFFBF5)
- [ ] Rounded corners (xl)
- [ ] Emoji icons for sensor readings
- [ ] Human-readable status labels
- [ ] Arrow points to plant
- [ ] Smooth fade-in animation

**Status Indicators:**
- [ ] Sage green for healthy plants
- [ ] Muted amber for warnings
- [ ] Dusty rose for critical
- [ ] Grey for offline
- [ ] Subtle ring/glow effect
- [ ] Offline plants are faded

**Interactions:**
- [ ] Click empty spot opens modal (edit mode)
- [ ] Click plant shows tooltip (view mode)
- [ ] Click plant navigates to detail (view mode)
- [ ] Edit/View toggle works
- [ ] Sidebar shows unassigned plants

### 6. Update Designer Documentation

Update `docs/designer.md` to reflect Feature 6 changes:

```markdown
# Designer Space

The Designer Space provides a cozy Scandinavian room view where you can arrange your plants in 20 fixed spots and see their real-time status at a glance.

## Overview

The Designer displays a warm, illustrated Scandinavian living room with:
- **Floating shelves** (6 spots for small/medium plants)
- **Sideboard surface** (8 spots for varying sizes)
- **Floor space** (6 spots for larger plants)

Each placed plant shows:
- A botanically accurate illustration
- A subtle status ring (sage green/amber/rose)
- The plant name on hover

## Accessing the Designer

Navigate to `/designer` or click "Designer" in the main navigation.

## View Mode

In View Mode (default):
- See all your plants arranged in the room
- Hover over plants to see sensor readings
- Click a plant to go to its detail page
- Status rings show plant health at a glance

## Edit Mode

Switch to Edit Mode to arrange plants:
1. Click the "Edit" button in the toolbar
2. Click an empty spot to assign a plant
3. Choose from your unassigned plants
4. Click an occupied spot to remove/reassign
5. Switch back to "View" when done

## Sidebar

The sidebar shows plants that haven't been placed in the room yet. In Edit Mode, click a spot to assign one of these plants.

## Status Indicators

Each plant has a subtle status ring:
- **Soft sage green**: Thriving - readings within thresholds
- **Muted amber**: Needs attention - some readings outside optimal
- **Dusty rose**: Help needed - readings significantly outside thresholds
- **Light grey**: No sensor data - device offline or no readings

## Tooltips

Hover over any plant to see current readings:
- Soil moisture (%)
- Temperature (C)
- Humidity (%)
- Light level (Low/Medium/Good/Bright)
- Human-readable status
- Last updated timestamp

## Responsive Design

The room view scales to fit your screen:
- Desktop: Full room view with all 20 spots
- Tablet: Slightly smaller, still fully functional
- Mobile: Scrollable view (limited editing recommended)

## Plant Illustrations

The Designer uses botanically accurate illustrations for 20 common houseplant species:
- Monstera Deliciosa
- Snake Plant
- Pothos
- Fiddle Leaf Fig
- Spider Plant
- Peace Lily
- Rubber Plant
- ZZ Plant
- Philodendron
- Aloe Vera
- Boston Fern
- Chinese Evergreen
- Dracaena
- Jade Plant
- String of Pearls
- Calathea
- Bird of Paradise
- English Ivy
- Succulent
- Cactus

Unknown species display a generic plant illustration.
```

### 7. Accessibility Check

- [ ] All images have alt text
- [ ] Spots are keyboard navigable (edit mode)
- [ ] Focus states are visible
- [ ] Status is not conveyed by color alone (has text labels)
- [ ] Tooltips have proper ARIA attributes
- [ ] Screen reader can identify plants and their status

### 8. Cross-browser Testing

Test on:
- [ ] Chrome (desktop)
- [ ] Firefox (desktop)
- [ ] Safari (if available)
- [ ] Mobile viewport (Chrome DevTools)
- [ ] Tablet viewport (Chrome DevTools)

### 9. Performance Check

- [ ] Room background loads without blocking UI
- [ ] Plant images load progressively
- [ ] No jank during hover/tooltip animations
- [ ] Smooth scrolling on mobile

## QA Checklist

- [ ] `make check` passes with 142+ tests
- [ ] `npm run build` succeeds
- [ ] `npm run lint` passes
- [ ] Room background renders correctly
- [ ] 20 plant images load and display
- [ ] PlantImage shows fallback for unknown species
- [ ] 20 fixed spots work correctly
- [ ] Click-to-assign modal works
- [ ] Position persists to backend
- [ ] Tooltips show sensor readings
- [ ] Status rings use muted colors
- [ ] Offline plants are visually faded
- [ ] Edit/View toggle works
- [ ] Navigation includes Designer link
- [ ] Documentation updated
- [ ] Accessibility requirements met
- [ ] Responsive design works

## Definition of Done

1. All Feature 6 DoD items verified and checked
2. `make check` passes (142+ tests)
3. All visual elements match Scandinavian aesthetic
4. `docs/designer.md` updated for Feature 6
5. Cross-browser/device testing complete
6. No accessibility regressions
7. Performance acceptable (no lag/jank)

## Verification

```bash
# Full verification script
make check

# Asset count
ls frontend/src/assets/plants/*.png | wc -l  # Should be 20
ls frontend/src/assets/room.png  # Should exist

# Component tests
cd frontend && npm test -- PlantImage PlantSpot ScandinavianCanvas CozyTooltip

# Doc exists
cat docs/designer.md | head -30

# Manual testing of designer page:
# 1. Open /designer
# 2. Verify room background displays
# 3. Toggle edit mode
# 4. Click empty spot - modal should open
# 5. Assign plant - should appear in spot
# 6. Hover plant - tooltip should show
# 7. Check status ring colors
# 8. Toggle view mode - click plant should navigate
```

## Files to Verify/Update

1. `frontend/src/assets/room.png` - VERIFY exists
2. `frontend/src/assets/plants/*.png` - VERIFY 20 files
3. `frontend/src/components/designer/PlantImage.tsx` - VERIFY functional
4. `frontend/src/components/designer/ScandinavianCanvas.tsx` - VERIFY functional
5. `frontend/src/components/designer/CozyTooltip.tsx` - VERIFY functional
6. `frontend/src/components/designer/StatusRing.tsx` - VERIFY functional
7. `frontend/src/pages/Designer.tsx` - VERIFY uses new components
8. `docs/designer.md` - UPDATE for Feature 6
