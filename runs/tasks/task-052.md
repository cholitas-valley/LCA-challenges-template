---
task_id: task-052
title: "Frontend: Designer Page with Sidebar"
role: lca-frontend
follow_roles: []
post: [lca-recorder, code-simplifier, lca-gitops]
depends_on: [task-051]
inputs:
  - objective.md
  - runs/plan.md
  - runs/handoffs/task-051.md
  - frontend/src/components/designer/DesignerCanvas.tsx
  - frontend/src/pages/Dashboard.tsx
  - frontend/src/App.tsx
allowed_paths:
  - frontend/**
check_command: make check
handoff: runs/handoffs/task-052.md
---

# Task 052: Frontend Designer Page with Sidebar

## Goal

Create the Designer page with a sidebar for unplaced plants, drag-and-drop from sidebar to canvas, and view/edit mode toggle. Add the `/designer` route and integrate with navigation.

## Context

This task brings together all Designer Space components into a complete page. Users can:
- View their floor plan with placed plants
- See unplaced plants in a sidebar
- Drag plants from sidebar to canvas (edit mode)
- Switch between view and edit modes
- Click plants to see details

**Dependencies:**
- task-051: Status overlays and tooltips
- Existing navigation and layout components

## Requirements

### 1. Designer Page Component

Create `frontend/src/pages/Designer.tsx`:

```tsx
export function Designer() {
  const [editMode, setEditMode] = useState(false);
  const { data: plants, isLoading } = usePlants();
  
  const placedPlants = plants?.filter(p => p.position) ?? [];
  const unplacedPlants = plants?.filter(p => !p.position) ?? [];

  const handlePositionChange = async (plantId: string, x: number, y: number) => {
    await updatePlantPosition(plantId, { x, y });
    // Refetch plants or update cache
  };

  const handlePlantClick = (plantId: string) => {
    navigate(`/plants/${plantId}`);
  };

  const handleDropFromSidebar = async (plantId: string, x: number, y: number) => {
    await updatePlantPosition(plantId, { x, y });
    // Plant moves from sidebar to canvas
  };

  return (
    <div className="flex h-full">
      {/* Sidebar */}
      <DesignerSidebar
        plants={unplacedPlants}
        editMode={editMode}
        onDragStart={handleDragStart}
      />
      
      {/* Main canvas area */}
      <div className="flex-1 flex flex-col">
        {/* Toolbar */}
        <DesignerToolbar
          editMode={editMode}
          onEditModeChange={setEditMode}
        />
        
        {/* Canvas */}
        <div className="flex-1 p-4">
          <DesignerCanvas
            plants={placedPlants}
            editMode={editMode}
            onPositionChange={handlePositionChange}
            onPlantClick={handlePlantClick}
            onDrop={handleDropFromSidebar}
          />
        </div>
      </div>
    </div>
  );
}
```

### 2. DesignerSidebar Component

Create `frontend/src/components/designer/DesignerSidebar.tsx`:

```tsx
interface DesignerSidebarProps {
  plants: Plant[];
  editMode: boolean;
}

export function DesignerSidebar({ plants, editMode }: DesignerSidebarProps) {
  if (plants.length === 0 && !editMode) {
    return null; // Hide sidebar when all plants are placed and not editing
  }

  return (
    <aside className="w-64 bg-gray-50 border-r border-gray-200 p-4">
      <h2 className="text-sm font-medium text-gray-700 mb-4">
        Unplaced Plants
      </h2>
      
      {plants.length === 0 ? (
        <p className="text-sm text-gray-500">All plants are placed!</p>
      ) : (
        <div className="space-y-2">
          {plants.map(plant => (
            <SidebarPlantItem
              key={plant.id}
              plant={plant}
              draggable={editMode}
            />
          ))}
        </div>
      )}
    </aside>
  );
}

function SidebarPlantItem({ plant, draggable }: { plant: Plant; draggable: boolean }) {
  return (
    <div
      className={cn(
        "flex items-center gap-3 p-2 rounded-lg bg-white border border-gray-200",
        draggable && "cursor-grab hover:border-gray-300"
      )}
      draggable={draggable}
      onDragStart={(e) => {
        e.dataTransfer.setData('plantId', plant.id);
      }}
    >
      <PlantIcon species={plant.species} size={32} className="text-gray-600" />
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium text-gray-900 truncate">
          {plant.name}
        </div>
        <div className="text-xs text-gray-500 truncate">
          {plant.species || 'Unknown species'}
        </div>
      </div>
    </div>
  );
}
```

### 3. DesignerToolbar Component

Create toolbar for mode switching:

```tsx
interface DesignerToolbarProps {
  editMode: boolean;
  onEditModeChange: (edit: boolean) => void;
}

export function DesignerToolbar({ editMode, onEditModeChange }: DesignerToolbarProps) {
  return (
    <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 bg-white">
      <h1 className="text-lg font-semibold text-gray-900">Designer Space</h1>
      
      <div className="flex items-center gap-2">
        <Button
          variant={editMode ? 'secondary' : 'primary'}
          size="sm"
          onClick={() => onEditModeChange(false)}
        >
          View
        </Button>
        <Button
          variant={editMode ? 'primary' : 'secondary'}
          size="sm"
          onClick={() => onEditModeChange(true)}
        >
          Edit
        </Button>
      </div>
    </div>
  );
}
```

### 4. Drag-and-Drop from Sidebar to Canvas

Update DesignerCanvas to handle drops from sidebar:

```tsx
interface DesignerCanvasProps {
  // ... existing props
  onDrop?: (plantId: string, x: number, y: number) => void;
}

// In DesignerCanvas component
const handleDrop = (e: React.DragEvent) => {
  e.preventDefault();
  const plantId = e.dataTransfer.getData('plantId');
  if (!plantId || !onDrop) return;
  
  // Calculate drop position relative to canvas
  const rect = svgRef.current?.getBoundingClientRect();
  if (!rect) return;
  
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;
  
  onDrop(plantId, snapToGrid(x), snapToGrid(y));
};

const handleDragOver = (e: React.DragEvent) => {
  e.preventDefault(); // Required to allow drop
};

// In SVG element
<svg
  ref={svgRef}
  onDrop={handleDrop}
  onDragOver={handleDragOver}
  // ...
>
```

### 5. Add Route

Update `frontend/src/App.tsx`:

```tsx
import { Designer } from './pages/Designer';

// In Routes
<Route path="/designer" element={<Designer />} />
```

### 6. Add Navigation Link

Update `frontend/src/components/Navigation.tsx`:

```tsx
const navItems = [
  { path: '/', label: 'Dashboard', icon: HomeIcon },
  { path: '/plants', label: 'Plants', icon: PlantIcon },
  { path: '/devices', label: 'Devices', icon: DeviceIcon },
  { path: '/designer', label: 'Designer', icon: GridIcon },  // ADD
  { path: '/settings', label: 'Settings', icon: SettingsIcon },
];
```

### 7. API Integration

Create or update API functions:

```tsx
// frontend/src/api/plants.ts

export async function updatePlantPosition(
  plantId: string, 
  position: { x: number; y: number }
): Promise<Plant> {
  const response = await fetch(`/api/plants/${plantId}/position`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(position),
  });
  
  if (!response.ok) {
    throw new Error('Failed to update plant position');
  }
  
  return response.json();
}
```

### 8. Loading State

Handle loading state for the page:

```tsx
if (isLoading) {
  return (
    <div className="flex h-full items-center justify-center">
      <LoadingSpinner />
    </div>
  );
}
```

### 9. Empty State

Handle no plants case:

```tsx
if (!plants || plants.length === 0) {
  return (
    <EmptyState
      title="No Plants Yet"
      description="Create some plants to arrange them in your space."
      action={
        <Button onClick={() => navigate('/plants')}>
          Add Plants
        </Button>
      }
    />
  );
}
```

### 10. Tests

Create page tests:

```tsx
// frontend/src/pages/__tests__/Designer.test.tsx
describe('Designer', () => {
  it('renders canvas with placed plants');
  it('renders sidebar with unplaced plants');
  it('toggles between view and edit modes');
  it('allows dragging plants from sidebar to canvas');
  it('navigates to plant detail on click');
});
```

## Files to Create/Modify

1. `frontend/src/pages/Designer.tsx` - CREATE
2. `frontend/src/components/designer/DesignerSidebar.tsx` - CREATE
3. `frontend/src/components/designer/DesignerToolbar.tsx` - CREATE
4. `frontend/src/components/designer/DesignerCanvas.tsx` - MODIFY (add drop handler)
5. `frontend/src/components/designer/index.ts` - MODIFY (add exports)
6. `frontend/src/App.tsx` - MODIFY (add route)
7. `frontend/src/components/Navigation.tsx` - MODIFY (add nav item)
8. `frontend/src/api/plants.ts` - MODIFY (add position API)
9. `frontend/src/pages/__tests__/Designer.test.tsx` - CREATE

## Layout Structure

```
┌──────────────────────────────────────────────────┐
│ Designer Space                        [View][Edit]│
├───────────┬──────────────────────────────────────┤
│           │                                      │
│ Unplaced: │                                      │
│ ┌───────┐ │     ┌────────────────────────┐      │
│ │🌿 Mon │ │     │                        │      │
│ └───────┘ │     │      CANVAS AREA       │      │
│ ┌───────┐ │     │                        │      │
│ │🪴 Sna │ │     │    🌿         🪴       │      │
│ └───────┘ │     │                        │      │
│           │     └────────────────────────┘      │
│           │                                      │
└───────────┴──────────────────────────────────────┘
```

## Definition of Done

1. `/designer` route is accessible
2. Navigation includes Designer link
3. Sidebar shows unplaced plants
4. Canvas shows placed plants
5. Drag from sidebar to canvas works (edit mode)
6. View/Edit mode toggle works
7. Click plant navigates to detail
8. Position persists via API
9. Loading and empty states handled
10. Tests pass
11. `make check` passes (139 tests)

## Verification

```bash
# Run tests
make check

# Manual verification
# - Navigate to /designer from menu
# - See sidebar with unplaced plants
# - Switch to edit mode
# - Drag plant from sidebar to canvas
# - Verify position saves (refresh page)
# - Switch to view mode
# - Click plant to navigate to detail
```
