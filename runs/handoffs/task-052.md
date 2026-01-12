# Handoff: Task 052 - Frontend Designer Page with Sidebar

## Summary

Successfully implemented the Designer page with a sidebar for unplaced plants, drag-and-drop functionality from sidebar to canvas, and view/edit mode toggle. The `/designer` route has been added and integrated with the navigation.

## Files Touched

### Created
- `/home/genge/dev-ash/foundry-nodevenv/cholitas/challenge-001-plantops/frontend/src/pages/Designer.tsx` - Main Designer page component with edit mode state, plant separation (placed/unplaced), position change handlers, and navigation
- `/home/genge/dev-ash/foundry-nodevenv/cholitas/challenge-001-plantops/frontend/src/components/designer/DesignerSidebar.tsx` - Sidebar component showing unplaced plants with drag support in edit mode
- `/home/genge/dev-ash/foundry-nodevenv/cholitas/challenge-001-plantops/frontend/src/components/designer/DesignerToolbar.tsx` - Toolbar with View/Edit mode toggle buttons
- `/home/genge/dev-ash/foundry-nodevenv/cholitas/challenge-001-plantops/frontend/src/pages/__tests__/Designer.test.tsx` - Designer page tests
- `/home/genge/dev-ash/foundry-nodevenv/cholitas/challenge-001-plantops/frontend/src/components/designer/__tests__/DesignerSidebar.test.tsx` - Sidebar component tests
- `/home/genge/dev-ash/foundry-nodevenv/cholitas/challenge-001-plantops/frontend/src/components/designer/__tests__/DesignerToolbar.test.tsx` - Toolbar component tests

### Modified
- `/home/genge/dev-ash/foundry-nodevenv/cholitas/challenge-001-plantops/frontend/src/components/designer/DesignerCanvas.tsx` - Added `onDrop` prop and drag-drop handlers for sidebar plants
- `/home/genge/dev-ash/foundry-nodevenv/cholitas/challenge-001-plantops/frontend/src/components/designer/index.ts` - Added exports for DesignerSidebar and DesignerToolbar
- `/home/genge/dev-ash/foundry-nodevenv/cholitas/challenge-001-plantops/frontend/src/pages/index.ts` - Added Designer export
- `/home/genge/dev-ash/foundry-nodevenv/cholitas/challenge-001-plantops/frontend/src/App.tsx` - Added `/designer` route
- `/home/genge/dev-ash/foundry-nodevenv/cholitas/challenge-001-plantops/frontend/src/components/Navigation.tsx` - Added Designer link to navigation
- `/home/genge/dev-ash/foundry-nodevenv/cholitas/challenge-001-plantops/frontend/src/api/client.ts` - Added `updatePosition` API function
- `/home/genge/dev-ash/foundry-nodevenv/cholitas/challenge-001-plantops/frontend/src/hooks/usePlants.ts` - Added `useUpdatePlantPosition` hook
- `/home/genge/dev-ash/foundry-nodevenv/cholitas/challenge-001-plantops/frontend/src/hooks/index.ts` - Exported `useUpdatePlantPosition`

## Components Added

### Designer Page (`Designer.tsx`)
- State management for edit mode toggle
- Fetches plants via `usePlants()` hook
- Separates plants into placed (has position) and unplaced (position is null)
- Handles position updates via `useUpdatePlantPosition()` mutation
- Handles plant clicks for navigation to detail page
- Loading, error, and empty states

### DesignerSidebar (`DesignerSidebar.tsx`)
- Displays unplaced plants
- Hidden when all plants are placed and not in edit mode
- Items are draggable only in edit mode
- Uses PlantIcon for plant display
- Sets `plantId` in dataTransfer on drag start

### DesignerToolbar (`DesignerToolbar.tsx`)
- View/Edit mode toggle buttons
- Primary variant on active mode
- Accessibility attributes (aria-pressed, role="group")

### DesignerCanvas Updates
- Added `onDrop` prop for sidebar drop handling
- Calculates drop position relative to SVG viewBox
- Applies grid snapping and bounds clamping

## Interfaces/Contracts

### API Addition
```typescript
plantApi.updatePosition(id: string, position: { x: number; y: number }) => Promise<Plant>
// PUT /api/plants/{id}/position
```

### New Hook
```typescript
useUpdatePlantPosition() => UseMutationResult
// Invalidates 'plants' query on success
```

### DesignerCanvasProps Update
```typescript
interface DesignerCanvasProps {
  // ... existing props
  onDrop?: (plantId: string, x: number, y: number) => void; // NEW
}
```

## How to Verify

```bash
# Run check command (should pass)
make check

# Manual verification:
# 1. Navigate to /designer from the navigation menu
# 2. See sidebar with unplaced plants (if any exist)
# 3. Click "Edit" button to enter edit mode
# 4. Drag a plant from sidebar to canvas
# 5. Verify plant appears on canvas at drop position
# 6. Refresh page to verify position persists
# 7. Click "View" button to exit edit mode
# 8. Click a plant on canvas to navigate to its detail page
# 9. With no plants, see empty state with "Add Plants" action
```

## Next Steps / Risks

- **Test Framework**: Frontend tests are written following existing patterns but vitest is not configured in package.json. Tests will work once vitest, @testing-library/react, and jsdom are installed.
- **Performance**: For large numbers of plants, consider virtualization for the sidebar list.
- **Touch Support**: Current drag-and-drop implementation uses mouse events. Touch support would require additional event handlers.
- **Undo/Redo**: No undo functionality for position changes currently implemented.
