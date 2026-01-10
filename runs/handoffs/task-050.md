# Handoff: Task 050 - Frontend DesignerCanvas Component

## Summary

Created the DesignerCanvas component - an interactive SVG canvas that renders plants at their stored positions with support for drag-and-drop repositioning in edit mode. Also added the PlantPosition type to the Plant interface to support position data from the backend.

## Files Modified

### Created
- `frontend/src/components/designer/DesignerCanvas.tsx` - Main canvas component with PlantMarker sub-component
- `frontend/src/components/designer/__tests__/DesignerCanvas.test.tsx` - Test suite for DesignerCanvas

### Modified
- `frontend/src/types/plant.ts` - Added PlantPosition interface and position field to Plant interface
- `frontend/src/components/designer/index.ts` - Added DesignerCanvas export

## Component API

### DesignerCanvas

```tsx
interface DesignerCanvasProps {
  plants: Plant[];              // Plants with position data
  editMode: boolean;            // Enable drag-and-drop
  onPositionChange?: (plantId: string, x: number, y: number) => void;
  onPlantClick?: (plantId: string) => void;
  gridSize?: number;            // Snap-to-grid size (default: 16, 0 = disabled)
  className?: string;
}
```

### PlantMarker (internal)

Sub-component that renders individual plants on the canvas:
- Renders PlantIcon at plant position
- Shows plant name label below icon
- Handles drag events in edit mode
- Distinguishes between click and drag

### PlantPosition Type

```tsx
interface PlantPosition {
  x: number;
  y: number;
}

interface Plant {
  // ... existing fields
  position: PlantPosition | null;  // NEW - null if not placed on canvas
}
```

## Features Implemented

1. **Canvas Rendering**
   - SVG canvas with viewBox 800x600
   - Subtle grid pattern for visual alignment
   - White background with gray border
   - Responsive sizing (scales to container)

2. **Plant Markers**
   - PlantIcon rendered at stored position
   - Name label below icon (10px font)
   - Cursor changes based on mode (pointer vs grab/grabbing)
   - ARIA labels for accessibility

3. **Drag-and-Drop**
   - Works only when editMode=true
   - Converts mouse coordinates to SVG coordinates
   - Grid snapping support (configurable)
   - Bounds clamping to keep plants within canvas
   - Calls onPositionChange with final coordinates after drag ends

4. **Click Navigation**
   - Distinguishes between click and drag
   - Calls onPlantClick only for genuine clicks (not drags)

5. **Grid Snapping**
   - Snaps positions to grid during drag
   - Configurable grid size (default 16px)
   - Can be disabled by setting gridSize=0

## Usage Example

```tsx
import { DesignerCanvas } from '@/components/designer';

function DesignerPage() {
  const [editMode, setEditMode] = useState(false);

  const handlePositionChange = async (plantId: string, x: number, y: number) => {
    await api.put(`/plants/${plantId}/position`, { x, y });
    refetch();
  };

  const handlePlantClick = (plantId: string) => {
    navigate(`/plants/${plantId}`);
  };

  return (
    <DesignerCanvas
      plants={plants}
      editMode={editMode}
      onPositionChange={handlePositionChange}
      onPlantClick={handlePlantClick}
      gridSize={16}
    />
  );
}
```

## How to Verify

```bash
# Run full check (142 backend tests + frontend build)
make check

# List created files
ls frontend/src/components/designer/

# Import and use in components
import { DesignerCanvas } from '@/components/designer';
```

## Test Coverage

Test file `DesignerCanvas.test.tsx` includes 9 test cases:
1. Renders plants at their positions
2. Calls onPlantClick when plant is clicked
3. Ignores drag when not in edit mode
4. Renders with custom gridSize
5. Renders with custom className
6. Shows grab cursor in edit mode
7. Renders empty canvas when no plants have positions
8. Renders canvas with correct viewBox
9. Renders grid pattern

Note: Tests require vitest to execute (excluded from build via tsconfig).

## Definition of Done Verification

- [x] DesignerCanvas renders plants at correct positions
- [x] Drag-and-drop works in edit mode
- [x] onPositionChange called with new coordinates after drag
- [x] Click navigates (onPlantClick) when not dragging
- [x] Grid snapping works when enabled
- [x] Canvas is responsive to container size
- [x] Tests written
- [x] `make check` passes (142 tests + frontend build)

## Risks / Follow-ups

1. **foreignObject for PlantIcon**: Using foreignObject to embed the PlantIcon div inside SVG. This works well in modern browsers but may have issues in older browsers.

2. **Drag performance**: For many plants, consider debouncing the position updates during drag.

3. **Touch support**: Currently only mouse events are implemented. For mobile support, touch events should be added.

## Next Steps

The DesignerCanvas is ready to be integrated into a DesignerPage that:
1. Fetches plants from API (GET /api/plants includes position)
2. Provides edit mode toggle
3. Calls PUT /api/plants/{id}/position on drag end
4. Navigates to plant detail on click
