---
task_id: task-050
title: "Frontend: DesignerCanvas Component"
role: lca-frontend
follow_roles: []
post: [lca-recorder, code-simplifier, lca-gitops]
depends_on: [task-048, task-049]
inputs:
  - objective.md
  - runs/plan.md
  - runs/handoffs/task-048.md
  - runs/handoffs/task-049.md
  - frontend/src/components/designer/PlantIcon.tsx
allowed_paths:
  - frontend/**
check_command: make check
handoff: runs/handoffs/task-050.md
---

# Task 050: Frontend DesignerCanvas Component

## Goal

Create the DesignerCanvas component - an interactive SVG canvas that renders plants at their stored positions with support for drag-and-drop repositioning.

## Context

The Designer Space shows a top-down floor plan view where plants are rendered at specific x/y coordinates. Users can drag plants to reposition them (in edit mode), and click plants to navigate to their detail pages.

**Dependencies:**
- task-048: Backend position API (PUT /api/plants/{id}/position)
- task-049: PlantIcon component for rendering plant icons

## Requirements

### 1. DesignerCanvas Component

Create `frontend/src/components/designer/DesignerCanvas.tsx`:

```tsx
interface DesignerCanvasProps {
  plants: Plant[];              // Plants with position data
  editMode: boolean;            // Enable drag-and-drop
  onPositionChange?: (plantId: string, x: number, y: number) => void;
  onPlantClick?: (plantId: string) => void;
  gridSize?: number;            // Snap-to-grid size (0 = disabled)
  className?: string;
}

export function DesignerCanvas({
  plants,
  editMode,
  onPositionChange,
  onPlantClick,
  gridSize = 16,
  className
}: DesignerCanvasProps) {
  // Render SVG canvas with plants at positions
  // Handle drag-and-drop when editMode is true
  // Call onPositionChange when plant is dropped
  // Call onPlantClick when plant is clicked (not dragged)
}
```

### 2. Canvas Rendering

**Canvas structure:**
```tsx
<svg
  viewBox="0 0 800 600"
  className="w-full h-full border border-gray-200 bg-white"
>
  {/* Grid (optional, subtle) */}
  <defs>
    <pattern id="grid" width={gridSize} height={gridSize} patternUnits="userSpaceOnUse">
      <path d={`M ${gridSize} 0 L 0 0 0 ${gridSize}`} fill="none" stroke="#f0f0f0" strokeWidth="0.5"/>
    </pattern>
  </defs>
  <rect width="100%" height="100%" fill="url(#grid)" />
  
  {/* Render each plant */}
  {plants.filter(p => p.position).map(plant => (
    <PlantMarker
      key={plant.id}
      plant={plant}
      editMode={editMode}
      onDragEnd={(x, y) => onPositionChange?.(plant.id, x, y)}
      onClick={() => onPlantClick?.(plant.id)}
    />
  ))}
</svg>
```

### 3. PlantMarker Sub-component

Create internal PlantMarker component for each plant on canvas:

```tsx
interface PlantMarkerProps {
  plant: Plant;
  editMode: boolean;
  onDragEnd: (x: number, y: number) => void;
  onClick: () => void;
}

function PlantMarker({ plant, editMode, onDragEnd, onClick }: PlantMarkerProps) {
  // Render plant icon at position
  // Handle drag events when editMode is true
  // Distinguish between click and drag
}
```

**PlantMarker rendering:**
- Group (`<g>`) positioned at plant.position.x/y
- PlantIcon component for the plant species
- Label with plant name (below icon)
- Cursor changes based on mode (pointer vs grab)

### 4. Drag-and-Drop Implementation

Use native SVG drag or a lightweight approach:

```tsx
function PlantMarker({ plant, editMode, onDragEnd, onClick }) {
  const [dragging, setDragging] = useState(false);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [position, setPosition] = useState(plant.position);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!editMode) return;
    setDragging(true);
    setOffset({
      x: e.clientX - position.x,
      y: e.clientY - position.y
    });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!dragging) return;
    const newX = e.clientX - offset.x;
    const newY = e.clientY - offset.y;
    // Apply grid snapping if enabled
    setPosition({ x: snapToGrid(newX), y: snapToGrid(newY) });
  };

  const handleMouseUp = () => {
    if (dragging) {
      setDragging(false);
      onDragEnd(position.x, position.y);
    }
  };

  const handleClick = (e: React.MouseEvent) => {
    // Only trigger if not dragging
    if (!dragging) {
      onClick();
    }
  };

  // ...
}
```

### 5. Grid Snapping

Implement snap-to-grid utility:

```tsx
function snapToGrid(value: number, gridSize: number): number {
  if (gridSize === 0) return value;
  return Math.round(value / gridSize) * gridSize;
}
```

### 6. Responsive Sizing

Canvas should adapt to container:

```tsx
// Use viewBox for responsive scaling
<svg
  viewBox="0 0 800 600"  // Logical coordinates
  preserveAspectRatio="xMidYMid meet"
  className="w-full h-auto max-h-[600px]"
>
```

### 7. Click Navigation

When a plant is clicked (not dragged), call onPlantClick:

```tsx
// In parent component
const handlePlantClick = (plantId: string) => {
  navigate(`/plants/${plantId}`);
};
```

### 8. Export and Tests

Add to `frontend/src/components/designer/index.ts`:

```tsx
export { DesignerCanvas } from './DesignerCanvas';
```

Create tests in `frontend/src/components/designer/__tests__/DesignerCanvas.test.tsx`:

```tsx
describe('DesignerCanvas', () => {
  it('renders plants at their positions');
  it('calls onPositionChange when plant is dragged in edit mode');
  it('calls onPlantClick when plant is clicked');
  it('ignores drag when not in edit mode');
  it('snaps to grid when gridSize is set');
});
```

## Files to Create/Modify

1. `frontend/src/components/designer/DesignerCanvas.tsx` - CREATE
2. `frontend/src/components/designer/index.ts` - MODIFY (add export)
3. `frontend/src/components/designer/__tests__/DesignerCanvas.test.tsx` - CREATE

## Visual Design

**Canvas appearance:**
- White background with subtle grid
- Plants rendered with PlantIcon component
- Plant names as small labels below icons
- In edit mode: cursor shows grab/grabbing
- Clean, minimal aesthetic

**Plant marker:**
```
    ┌──────┐
    │  🌿  │  <- PlantIcon (48x48)
    └──────┘
    Monstera   <- Name label (small, centered)
```

## Definition of Done

1. DesignerCanvas renders plants at correct positions
2. Drag-and-drop works in edit mode
3. onPositionChange called with new coordinates after drag
4. Click navigates (onPlantClick) when not dragging
5. Grid snapping works when enabled
6. Canvas is responsive to container size
7. Tests pass
8. `make check` passes (139 tests)

## Verification

```bash
# Run tests
make check

# Manual verification
# - Open designer page
# - Verify plants render at correct positions
# - Enable edit mode, drag a plant
# - Verify position persists after refresh
# - Click plant (not drag), verify navigation
```
