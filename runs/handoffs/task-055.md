# Handoff: Task 055 - Room Background & Fixed Position System

## Summary

Successfully created the fixed position spot system and Scandinavian room canvas component. This establishes the foundation for the new visual style with 20 pre-defined plant placement spots overlaying the room background.

## Files Touched

### Components Created
- `frontend/src/components/designer/plantSpots.ts` - 20 fixed spot definitions with coordinates
- `frontend/src/components/designer/PlantSpot.tsx` - Interactive spot component
- `frontend/src/components/designer/ScandinavianCanvas.tsx` - Room canvas with spots overlay
- `frontend/src/components/designer/spotAssignment.ts` - Position-to-spot conversion utilities

### Tests Created
- `frontend/src/components/designer/__tests__/plantSpots.test.ts` - Spot definitions and utility tests
- `frontend/src/components/designer/__tests__/PlantSpot.test.tsx` - PlantSpot component tests
- `frontend/src/components/designer/__tests__/ScandinavianCanvas.test.tsx` - Canvas component tests
- `frontend/src/components/designer/__tests__/spotAssignment.test.ts` - Assignment utility tests

### Modified
- `frontend/src/components/designer/index.ts` - Added new exports

## Component Features

### plantSpots.ts
- Defines 20 fixed spots distributed across:
  - Floating shelves (spots 1-6): small/medium plants
  - Sideboard surface (spots 7-14): small/medium plants
  - Floor (spots 15-20): large plants
- Types: `SpotLocation`, `SpotSize`, `PlantSpot`
- Utilities: `getSpotById()`, `findNearestSpot()`
- Coordinates use percentages (0-100) for responsive scaling

### PlantSpot.tsx
- Renders empty state with dashed outline in edit mode
- Renders PlantImage component when occupied
- Supports hover and click handlers
- Accessible with proper aria-labels and keyboard navigation
- Size variants: small (60x80), medium (90x120), large (120x160)

### ScandinavianCanvas.tsx
- Displays room.png background with lazy loading
- Renders all 20 PlantSpot components at fixed positions
- Handles spot click events with current plant ID
- Shows edit mode hint overlay
- Supports plant hover callback for tooltips

### spotAssignment.ts
- `positionsToSpotAssignments()` - Converts existing 800x600 positions to spot assignments
- `spotToPosition()` - Converts spot back to pixel coordinates for storage
- Prevents duplicate spot assignments

## Interfaces/Contracts

```typescript
// Spot Definition
interface PlantSpot {
  id: number;
  location: 'shelf' | 'sideboard' | 'floor';
  x: number;  // 0-100 percentage
  y: number;  // 0-100 percentage
  size: 'small' | 'medium' | 'large';
  label: string;
}

// Spot Component Props
interface PlantSpotProps {
  spot: PlantSpot;
  plant: Plant | null;
  editMode: boolean;
  onClick: () => void;
  onHover?: (hovered: boolean) => void;
  className?: string;
}

// Canvas Props
interface ScandinavianCanvasProps {
  plants: Plant[];
  spotAssignments: Record<number, string>;
  editMode: boolean;
  onSpotClick: (spotId: number, currentPlantId: string | null) => void;
  onPlantHover?: (plantId: string | null, position: { x: number; y: number } | null) => void;
  className?: string;
}
```

## How to Verify

```bash
# Verify 20 spots defined
grep -c "{ id:" frontend/src/components/designer/plantSpots.ts  # Should be 20

# Run full check (142+ backend tests + frontend build)
make check

# Verify new exports work
cd frontend && npx tsc --noEmit
```

## Test Coverage

Tests verify:
- 20 unique spot IDs from 1-20
- 6 shelf spots, 8 sideboard spots, 6 floor spots
- All coordinates within 0-100 range
- `getSpotById()` returns correct spots
- `findNearestSpot()` finds closest spots
- PlantSpot renders empty and occupied states correctly
- ScandinavianCanvas renders room background
- Edit mode shows hint overlay
- Click and hover handlers work correctly
- Position-to-spot conversion maintains uniqueness

## Risks/Follow-ups

1. **Spot Position Calibration**: The spot coordinates are approximations based on the room.png layout. Visual testing recommended to fine-tune positions.

2. **Frontend Tests Not Running**: vitest is not configured in the project. Test files are prepared for when vitest is added.

3. **Large Asset Sizes**: Room background is 10MB. Consider:
   - WebP conversion for smaller sizes
   - CDN deployment for production
   - Image optimization pipeline

4. **Migration of Existing Positions**: Plants with existing position data will need migration using `positionsToSpotAssignments()` utility.

---

# RECORDER: Task 055 Summary for Task 056

## What Was Done

Task 055 completed the fixed position spot system for the Scandinavian room view. This is the visual foundation for Feature 6, replacing freeform positioning with 20 pre-defined spots.

## Files Created

1. **`frontend/src/components/designer/plantSpots.ts`** - Core spot definitions (20 spots)
   - Exports: `PLANT_SPOTS` constant array with spot ID 1-20
   - Functions: `getSpotById()`, `findNearestSpot()`
   - Types: `PlantSpot`, `SpotLocation`, `SpotSize`

2. **`frontend/src/components/designer/PlantSpot.tsx`** - Interactive spot component
   - Renders empty (dashed outline) or occupied (plant image) states
   - Supports edit mode with click and hover handlers
   - Accessible with aria-labels and keyboard navigation
   - Size variants: small (60x80), medium (90x120), large (120x160)

3. **`frontend/src/components/designer/ScandinavianCanvas.tsx`** - Room canvas component
   - Renders `room.png` background with lazy loading
   - Renders all 20 PlantSpot components as overlay
   - Handles spot clicks and plant hover callbacks
   - Shows edit mode hint overlay

4. **`frontend/src/components/designer/spotAssignment.ts`** - Utility functions
   - `positionsToSpotAssignments()` - Converts old 800x600 positions to spot IDs
   - `spotToPosition()` - Converts spot back to pixel coordinates
   - Prevents duplicate assignments

5. **Test files created:**
   - `frontend/src/components/designer/__tests__/plantSpots.test.ts`
   - `frontend/src/components/designer/__tests__/PlantSpot.test.tsx`
   - `frontend/src/components/designer/__tests__/ScandinavianCanvas.test.tsx`
   - `frontend/src/components/designer/__tests__/spotAssignment.test.ts`

## Files Modified

- **`frontend/src/components/designer/index.ts`** - Added exports for all new components and types

## Key Interfaces/Contracts

```typescript
// Spot Definition
interface PlantSpot {
  id: number;              // 1-20
  location: 'shelf' | 'sideboard' | 'floor';
  x: number;               // 0-100 percentage
  y: number;               // 0-100 percentage
  size: 'small' | 'medium' | 'large';
  label: string;
}

// Component Props
interface PlantSpotProps {
  spot: PlantSpot;
  plant: Plant | null;
  editMode: boolean;
  onClick: () => void;
  onHover?: (hovered: boolean) => void;
  className?: string;
}

interface ScandinavianCanvasProps {
  plants: Plant[];
  spotAssignments: Record<number, string>;
  editMode: boolean;
  onSpotClick: (spotId: number, currentPlantId: string | null) => void;
  onPlantHover?: (plantId: string | null, position: { x: number; y: number } | null) => void;
  className?: string;
}
```

## Verification

```bash
# Check spot count
grep -c "{ id:" frontend/src/components/designer/plantSpots.ts  # Should be 20

# Verify exports
cd frontend && npx tsc --noEmit

# Run checks
make check  # Should include 142+ backend tests + frontend build
```

## Spot Distribution Implemented

- **Floating shelves (spots 1-6)**: 3 per side, top area (y=18%)
- **Sideboard (spots 7-14)**: 8 spots, middle area (y=52%)
- **Floor (spots 15-20)**: 6 spots, bottom area (y=82-88%)

## What Task 056 Inherits

Task 056 (Plant Card Click Handler) will inherit:
1. The `ScandinavianCanvas` component with working spot rendering
2. The `spotAssignments` data structure (Record<spotId, plantId>)
3. `onSpotClick` callback ready to handle plant assignment UI
4. All type definitions and utilities for spot management
5. Test infrastructure for canvas interactions

## Known Limitations

1. **Frontend tests not running** - vitest not configured; test files prepared for future setup
2. **Spot calibration** - Positions are approximations; visual fine-tuning recommended
3. **Asset size** - room.png is 10MB; WebP optimization needed for production
4. **Position migration** - Existing plants need one-time migration via `positionsToSpotAssignments()`
