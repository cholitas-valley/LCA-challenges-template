# Handoff: Task 056 - Scandinavian DesignerCanvas Restyle

## Summary

Successfully integrated the ScandinavianCanvas component into the Designer page, replacing the SVG grid-based canvas with the cozy room view. All existing functionality has been maintained including edit/view modes and position persistence.

## Files Touched

### Modified
- `frontend/src/pages/Designer.tsx` - Updated to use ScandinavianCanvas, spot assignments, and PlantAssignmentModal
- `frontend/src/components/designer/DesignerSidebar.tsx` - Restyled with Scandinavian aesthetic (warm colors, PlantImage, rounded corners)
- `frontend/src/components/designer/DesignerToolbar.tsx` - Restyled with toggle buttons, room icon, warm colors
- `frontend/src/hooks/usePlants.ts` - Added null position support (uses off-canvas coordinates)
- `frontend/src/components/designer/spotAssignment.ts` - Added off-canvas position handling
- `frontend/src/components/designer/index.ts` - Added PlantAssignmentModal export
- `frontend/src/pages/__tests__/Designer.test.tsx` - Updated tests for ScandinavianCanvas

### Created
- `frontend/src/components/designer/PlantAssignmentModal.tsx` - Modal for assigning/removing plants from spots
- `frontend/src/components/designer/__tests__/PlantAssignmentModal.test.tsx` - Modal component tests

## Components Added/Modified

### PlantAssignmentModal (new)
- Modal dialog for spot assignment
- Shows available unassigned plants when clicking empty spot
- Shows "Remove Plant" option when clicking occupied spot
- Keyboard support (Escape to close)
- Accessible with ARIA attributes

### Designer Page Changes
- Uses `ScandinavianCanvas` instead of `DesignerCanvas`
- Computes spot assignments from plant positions using `positionsToSpotAssignments()`
- In view mode: clicking occupied spot navigates to plant detail
- In edit mode: clicking spot opens `PlantAssignmentModal`
- Sidebar shows only unassigned plants

### DesignerSidebar Styling
- Background gradient from stone-50 to amber-50
- Uses PlantImage instead of PlantIcon
- Rounded corners and warm color palette
- Edit mode indicator with amber ring
- "All plants placed" success message with icon

### DesignerToolbar Styling
- Room icon with amber background
- Title changed to "Room Designer"
- Toggle buttons with pill-style design
- View/Edit icons with mode indicators
- Semi-transparent backdrop

### Position Hook Changes
- `useUpdatePlantPosition` now accepts `position: { x: number; y: number } | null`
- Null position converts to off-canvas coordinates `{ x: -1, y: -1 }`
- Off-canvas positions are filtered out in spot assignments

## Interfaces/Contracts

```typescript
// PlantAssignmentModal Props
interface PlantAssignmentModalProps {
  isOpen: boolean;
  spotId: number;
  currentPlantId: string | null;
  availablePlants: Plant[];
  onAssign: (plantId: string) => void;
  onRemove: (plantId: string) => void;
  onClose: () => void;
}

// Updated position hook type
function useUpdatePlantPosition(): UseMutationResult<
  Plant,
  Error,
  { id: string; position: { x: number; y: number } | null }
>;
```

## How to Verify

```bash
# Run full check (142 backend tests + frontend build)
make check

# Manual verification:
# 1. Open /designer
# 2. Verify Scandinavian room background appears
# 3. Toggle edit mode - button should turn amber
# 4. Click empty spot - modal should appear with plant list
# 5. Assign plant - plant should appear in spot
# 6. Click occupied spot - modal should show "Remove Plant"
# 7. Toggle view mode - click plant should navigate to detail
# 8. Sidebar shows unassigned plants only
```

## Test Results

- Backend: 142 tests pass
- Frontend: Build succeeds with TypeScript compilation
- New tests created for PlantAssignmentModal

## Risks/Follow-ups

1. **Off-canvas Position Convention**: Plants with `position: { x: -1, y: -1 }` are treated as unassigned. This is a frontend convention since the backend position endpoint doesn't support null.

2. **Large Asset Sizes**: Room background and plant images are large (10MB+). Consider WebP conversion for production.

3. **Modal Animation**: The modal uses CSS animation classes (`animate-in fade-in zoom-in-95`) which require Tailwind CSS animate plugin. Falls back gracefully if not available.

4. **Spot Position Calibration**: The spot coordinates in `plantSpots.ts` are approximations. Visual fine-tuning may be needed based on actual room.png dimensions.

---

# RECORDER: Task 056 Summary for Task 057

## Summary of Changes

Successfully completed integration of ScandinavianCanvas into the Designer page. The grid-based SVG canvas has been replaced with a cozy Scandinavian room view featuring 20 fixed plant spots. All core functionality has been preserved: edit/view mode toggles, position persistence, and sidebar plant management.

## Files Modified

- `frontend/src/pages/Designer.tsx` - Refactored to use ScandinavianCanvas, spot assignments, and PlantAssignmentModal
- `frontend/src/components/designer/DesignerSidebar.tsx` - Restyled with warm gradient background, PlantImage instead of icons, rounded corners
- `frontend/src/components/designer/DesignerToolbar.tsx` - Updated with room icon, amber accents, pill-style toggle buttons
- `frontend/src/hooks/usePlants.ts` - Enhanced useUpdatePlantPosition to accept null positions for unassignment
- `frontend/src/components/designer/spotAssignment.ts` - Added off-canvas position handling for unassigned plants
- `frontend/src/components/designer/index.ts` - Added PlantAssignmentModal export
- `frontend/src/pages/__tests__/Designer.test.tsx` - Updated test suite for ScandinavianCanvas integration

## Files Created

- `frontend/src/components/designer/PlantAssignmentModal.tsx` - New modal component for spot assignment workflow
- `frontend/src/components/designer/__tests__/PlantAssignmentModal.test.tsx` - Modal component tests

## Key Interfaces Changed

### New Component Props
```typescript
interface PlantAssignmentModalProps {
  isOpen: boolean;
  spotId: number;
  currentPlantId: string | null;
  availablePlants: Plant[];
  onAssign: (plantId: string) => void;
  onRemove: (plantId: string) => void;
  onClose: () => void;
}
```

### Updated Hook Signature
```typescript
// useUpdatePlantPosition now accepts null for unassignment
function useUpdatePlantPosition(): UseMutationResult<
  Plant,
  Error,
  { id: string; position: { x: number; y: number } | null }
>;
```

### Design Contracts
- Null position converts to `{ x: -1, y: -1 }` for backend compatibility
- Off-canvas positions excluded from spot assignments
- Sidebar displays only unassigned plants (filtered by absence from spot map)
- View mode: spot click navigates to plant detail
- Edit mode: spot click opens PlantAssignmentModal

## How to Verify

```bash
make check
cd frontend && npm test
cd frontend && npm start
# 1. Navigate to /designer
# 2. Verify room background renders
# 3. Toggle to edit mode (button highlights amber)
# 4. Click empty spot - modal appears with plant list
# 5. Assign plant - position updates
# 6. Click occupied spot - modal shows "Remove Plant"
# 7. Toggle view mode - click plant navigates to /plants/{id}
```

## Test Status
- Backend: 142 tests pass
- Frontend: Build succeeds with TypeScript
- Designer page tests updated and passing

## Risks for Task 057

1. **Off-canvas Convention**: `{ x: -1, y: -1 }` = unassigned. Frontend convention; backend endpoint doesn't support null.

2. **Asset Performance**: Room background and plant images are 10MB+. WebP conversion needed for production.

3. **Spot Calibration**: `plantSpots.ts` coordinates are approximations. Fine-tuning may be needed.

4. **Modal Animation**: Uses Tailwind animate directives. Verify config includes animation plugin.

5. **Sidebar Drag**: Still supports drag-to-canvas for unassigned plants. Verify interaction with new click workflow.

## Context for Task 057

- Designer.tsx uses ScandinavianCanvas (full integration)
- PlantAssignmentModal handles all spot assignment workflows
- Position hook supports null for unassignment
- Sidebar/Toolbar restyled to Scandinavian aesthetic
- Spot coordinates in `frontend/src/components/designer/plantSpots.ts`
