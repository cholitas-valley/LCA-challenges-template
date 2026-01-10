---
task_id: task-056
title: "Scandinavian DesignerCanvas Restyle"
role: lca-frontend
follow_roles: []
post: [lca-recorder, code-simplifier, lca-gitops]
depends_on: [task-055]
inputs:
  - objective.md
  - runs/plan.md
  - runs/handoffs/task-055.md
  - frontend/src/pages/Designer.tsx
  - frontend/src/components/designer/DesignerCanvas.tsx
  - frontend/src/components/designer/ScandinavianCanvas.tsx
allowed_paths:
  - frontend/**
check_command: make check
handoff: runs/handoffs/task-056.md
---

# Task 056: Scandinavian DesignerCanvas Restyle

## Goal

Integrate the ScandinavianCanvas component into the Designer page, replacing the SVG grid-based canvas with the cozy room view. Maintain all existing functionality (edit/view modes, position persistence) while transitioning to the fixed spot system.

## Context

The ScandinavianCanvas component (created in task-055) provides:
- Room background image
- 20 fixed plant spots
- Click-to-assign interaction

This task connects the new canvas to the Designer page and ensures:
- Plants are assigned to spots correctly
- Position updates are persisted to the backend
- Edit/view mode toggle works
- Sidebar shows unassigned plants

## Requirements

### 1. Update Designer Page

Modify `frontend/src/pages/Designer.tsx` to use ScandinavianCanvas:

```typescript
/**
 * Designer Page - Scandinavian Room View
 *
 * Interactive room view for arranging plants in fixed spots.
 * Displays a cozy Scandinavian illustration with 20 plant placement spots.
 */

import { useState, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout, LoadingSpinner, EmptyState } from '../components';
import { 
  ScandinavianCanvas, 
  DesignerSidebar, 
  DesignerToolbar,
  positionsToSpotAssignments,
  spotToPosition,
  PLANT_SPOTS
} from '../components/designer';
import { usePlants, useUpdatePlantPosition } from '../hooks';
import { PlantAssignmentModal } from '../components/designer/PlantAssignmentModal';

export function Designer() {
  const navigate = useNavigate();
  const [editMode, setEditMode] = useState(false);
  const [selectedSpot, setSelectedSpot] = useState<number | null>(null);
  const { data, isLoading, isError } = usePlants();
  const updatePosition = useUpdatePlantPosition();

  const plants = data?.plants ?? [];

  // Compute spot assignments from plant positions
  const spotAssignments = useMemo(() => {
    return positionsToSpotAssignments(plants);
  }, [plants]);

  // Get unassigned plants (not in any spot)
  const assignedPlantIds = new Set(Object.values(spotAssignments));
  const unassignedPlants = plants.filter(p => !assignedPlantIds.has(p.id));

  // Handle spot click
  const handleSpotClick = useCallback((spotId: number, currentPlantId: string | null) => {
    if (!editMode) {
      // In view mode, navigate to plant detail if occupied
      if (currentPlantId) {
        navigate(`/plants/${currentPlantId}`);
      }
      return;
    }

    // In edit mode, open assignment modal
    setSelectedSpot(spotId);
  }, [editMode, navigate]);

  // Handle plant assignment to spot
  const handleAssignPlant = useCallback(async (plantId: string) => {
    if (selectedSpot === null) return;

    const position = spotToPosition(selectedSpot);
    await updatePosition.mutateAsync({ id: plantId, position });
    setSelectedSpot(null);
  }, [selectedSpot, updatePosition]);

  // Handle removing plant from spot
  const handleRemovePlant = useCallback(async (plantId: string) => {
    // Set position to null to unassign
    await updatePosition.mutateAsync({ id: plantId, position: null });
    setSelectedSpot(null);
  }, [updatePosition]);

  // Loading state
  if (isLoading) {
    return (
      <Layout>
        <div className="flex h-[calc(100vh-200px)] items-center justify-center">
          <LoadingSpinner />
        </div>
      </Layout>
    );
  }

  // Error state
  if (isError) {
    return (
      <Layout>
        <div className="flex h-[calc(100vh-200px)] items-center justify-center">
          <EmptyState
            title="Error Loading Plants"
            description="Failed to load plants. Please try again."
            action={{
              label: 'Retry',
              onClick: () => window.location.reload(),
            }}
          />
        </div>
      </Layout>
    );
  }

  // Empty state
  if (plants.length === 0) {
    return (
      <Layout>
        <div className="flex h-[calc(100vh-200px)] items-center justify-center">
          <EmptyState
            title="No Plants Yet"
            description="Create some plants to arrange them in your room."
            action={{
              label: 'Add Plants',
              onClick: () => navigate('/plants'),
            }}
          />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="flex h-[calc(100vh-140px)]">
        {/* Sidebar with unassigned plants */}
        <DesignerSidebar plants={unassignedPlants} editMode={editMode} />
        
        {/* Main canvas area */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Toolbar */}
          <DesignerToolbar editMode={editMode} onEditModeChange={setEditMode} />
          
          {/* Scandinavian Room Canvas */}
          <div className="flex-1 p-4 overflow-auto bg-gray-50">
            <ScandinavianCanvas
              plants={plants}
              spotAssignments={spotAssignments}
              editMode={editMode}
              onSpotClick={handleSpotClick}
            />
          </div>
        </div>

        {/* Plant Assignment Modal */}
        {selectedSpot !== null && (
          <PlantAssignmentModal
            isOpen={true}
            spotId={selectedSpot}
            currentPlantId={spotAssignments[selectedSpot] ?? null}
            availablePlants={unassignedPlants}
            onAssign={handleAssignPlant}
            onRemove={handleRemovePlant}
            onClose={() => setSelectedSpot(null)}
          />
        )}
      </div>
    </Layout>
  );
}
```

### 2. Create PlantAssignmentModal Component

Create `frontend/src/components/designer/PlantAssignmentModal.tsx`:

```typescript
/**
 * PlantAssignmentModal Component
 *
 * Modal for selecting which plant to assign to a spot,
 * or removing the current plant from a spot.
 */

import { Plant } from '../../types/plant';
import { Button, Modal } from '../common';
import { getSpotById } from './plantSpots';

export interface PlantAssignmentModalProps {
  isOpen: boolean;
  spotId: number;
  currentPlantId: string | null;
  availablePlants: Plant[];
  onAssign: (plantId: string) => void;
  onRemove: (plantId: string) => void;
  onClose: () => void;
}

export function PlantAssignmentModal({
  isOpen,
  spotId,
  currentPlantId,
  availablePlants,
  onAssign,
  onRemove,
  onClose,
}: PlantAssignmentModalProps) {
  const spot = getSpotById(spotId);
  const isOccupied = currentPlantId !== null;

  if (!spot) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`${spot.label}`}>
      <div className="space-y-4">
        {isOccupied ? (
          // Occupied spot - show remove option
          <div>
            <p className="text-sm text-gray-600 mb-4">
              This spot is currently occupied.
            </p>
            <div className="flex gap-2">
              <Button
                variant="danger"
                onClick={() => onRemove(currentPlantId)}
              >
                Remove Plant
              </Button>
              <Button variant="secondary" onClick={onClose}>
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          // Empty spot - show plant selection
          <div>
            {availablePlants.length === 0 ? (
              <p className="text-sm text-gray-500">
                No unassigned plants available. Create a new plant or remove one from another spot.
              </p>
            ) : (
              <>
                <p className="text-sm text-gray-600 mb-3">
                  Select a plant to place in this spot:
                </p>
                <div className="max-h-60 overflow-y-auto space-y-2">
                  {availablePlants.map(plant => (
                    <button
                      key={plant.id}
                      className="w-full p-3 text-left border rounded-lg hover:bg-gray-50 transition-colors"
                      onClick={() => onAssign(plant.id)}
                    >
                      <div className="font-medium">{plant.name}</div>
                      <div className="text-sm text-gray-500">
                        {plant.species ?? 'Unknown species'}
                      </div>
                    </button>
                  ))}
                </div>
              </>
            )}
            <div className="mt-4">
              <Button variant="secondary" onClick={onClose}>
                Cancel
              </Button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}
```

### 3. Update DesignerSidebar for Scandinavian Style

Modify `frontend/src/components/designer/DesignerSidebar.tsx`:

```typescript
// Update styling to match Scandinavian aesthetic
// - Softer background colors (cream/off-white)
// - Rounded corners
// - Subtle shadows
// - Use PlantImage instead of PlantIcon for consistency
```

Key changes:
- Replace `PlantIcon` with `PlantImage` in sidebar items
- Update background to `bg-stone-50` or similar warm tone
- Add `rounded-lg` and `shadow-sm` for softer appearance
- Update drag styling for touch devices

### 4. Update DesignerToolbar Styling

Modify `frontend/src/components/designer/DesignerToolbar.tsx`:

```typescript
// Update toolbar to match room aesthetic:
// - Softer button colors
// - Rounded toggle for edit/view mode
// - Warm accent colors
```

### 5. Update Position Hook for Null Support

Ensure `useUpdatePlantPosition` supports setting position to null (unassign):

```typescript
// In frontend/src/hooks/usePlants.ts or similar
interface UpdatePositionParams {
  id: string;
  position: { x: number; y: number } | null;
}
```

### 6. Export Updates

Update `frontend/src/components/designer/index.ts`:

```typescript
export { PlantAssignmentModal } from './PlantAssignmentModal';
export type { PlantAssignmentModalProps } from './PlantAssignmentModal';
```

### 7. Tests

Update and create tests for the modified Designer page:

**`frontend/src/pages/__tests__/Designer.test.tsx`**
```typescript
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClientProvider, QueryClient } from '@tanstack/react-query';
import { Designer } from '../Designer';

// Mock the hooks
jest.mock('../../hooks', () => ({
  usePlants: () => ({
    data: { plants: mockPlants },
    isLoading: false,
    isError: false,
  }),
  useUpdatePlantPosition: () => ({
    mutateAsync: jest.fn(),
  }),
}));

describe('Designer', () => {
  it('renders ScandinavianCanvas', () => {
    render(
      <QueryClientProvider client={new QueryClient()}>
        <MemoryRouter>
          <Designer />
        </MemoryRouter>
      </QueryClientProvider>
    );
    expect(screen.getByAltText('Scandinavian living room')).toBeInTheDocument();
  });

  it('shows assignment modal when spot clicked in edit mode', async () => {
    // Test implementation
  });
});
```

## Constraints

- Maintain backward compatibility with existing plant position data
- Existing tests for DesignerCanvas may need updates or removal
- Do not break navigation or routing
- Preserve edit/view mode functionality

## Files to Create/Modify

1. `frontend/src/pages/Designer.tsx` - MODIFY (use ScandinavianCanvas)
2. `frontend/src/components/designer/PlantAssignmentModal.tsx` - CREATE
3. `frontend/src/components/designer/DesignerSidebar.tsx` - MODIFY (styling)
4. `frontend/src/components/designer/DesignerToolbar.tsx` - MODIFY (styling)
5. `frontend/src/hooks/usePlants.ts` - MODIFY (null position support)
6. `frontend/src/components/designer/index.ts` - MODIFY (export modal)
7. `frontend/src/pages/__tests__/Designer.test.tsx` - MODIFY/CREATE

## Definition of Done

1. Designer page uses ScandinavianCanvas instead of old DesignerCanvas
2. Spot click opens assignment modal in edit mode
3. Spot click navigates to plant detail in view mode
4. Plant assignments persist to backend via position API
5. Sidebar shows unassigned plants only
6. Sidebar and toolbar match Scandinavian aesthetic
7. All existing tests pass or are updated
8. `make check` passes (142+ tests)

## Verification

```bash
# Run tests
cd frontend && npm test -- Designer

# Manual verification:
# 1. Open /designer
# 2. Toggle edit mode
# 3. Click empty spot - should show modal
# 4. Assign plant - should appear in spot
# 5. Click occupied spot - should show remove option
# 6. Toggle view mode - click plant should navigate

# Full check
make check
```
