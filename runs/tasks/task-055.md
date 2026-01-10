---
task_id: task-055
title: "Room Background & Fixed Position System"
role: lca-frontend
follow_roles: []
post: [lca-recorder, code-simplifier, lca-gitops]
depends_on: [task-054]
inputs:
  - objective.md
  - runs/plan.md
  - runs/handoffs/task-054.md
  - frontend/src/assets/room.png
  - frontend/src/components/designer/PlantImage.tsx
allowed_paths:
  - frontend/**
check_command: make check
handoff: runs/handoffs/task-055.md
---

# Task 055: Room Background & Fixed Position System

## Goal

Create the fixed position spot system and Scandinavian room canvas component. This establishes the foundation for the new visual style with 20 pre-defined plant placement spots overlaying the room background.

## Context

Feature 6 replaces free positioning with 20 fixed spots distributed across:
- Floating shelves (spots 1-6): Small to medium plants
- Sideboard surface (spots 7-14): Varying sizes
- Floor (spots 15-20): Larger plants

The room background (`frontend/src/assets/room.png`) shows a Scandinavian living room with clear spaces for plants on shelves, sideboard, and floor.

## Requirements

### 1. Define Plant Spots Constant

Create `frontend/src/components/designer/plantSpots.ts`:

```typescript
/**
 * Fixed plant placement spots for Scandinavian Room View.
 * Each spot has a fixed position relative to the room background image.
 * Coordinates are percentages (0-100) of the canvas dimensions.
 */

export type SpotLocation = 'shelf' | 'sideboard' | 'floor';
export type SpotSize = 'small' | 'medium' | 'large';

export interface PlantSpot {
  /** Unique spot ID (1-20) */
  id: number;
  /** Location category */
  location: SpotLocation;
  /** X position as percentage (0-100) */
  x: number;
  /** Y position as percentage (0-100) */
  y: number;
  /** Recommended plant size for this spot */
  size: SpotSize;
  /** Optional label for accessibility */
  label: string;
}

/**
 * 20 fixed plant spots distributed across the room.
 * Positions are calibrated to match the room.png illustration.
 */
export const PLANT_SPOTS: PlantSpot[] = [
  // Floating shelves (spots 1-6) - top area of room
  { id: 1, location: 'shelf', x: 15, y: 18, size: 'small', label: 'Left shelf, position 1' },
  { id: 2, location: 'shelf', x: 25, y: 18, size: 'small', label: 'Left shelf, position 2' },
  { id: 3, location: 'shelf', x: 35, y: 18, size: 'medium', label: 'Left shelf, position 3' },
  { id: 4, location: 'shelf', x: 60, y: 18, size: 'small', label: 'Right shelf, position 1' },
  { id: 5, location: 'shelf', x: 70, y: 18, size: 'small', label: 'Right shelf, position 2' },
  { id: 6, location: 'shelf', x: 80, y: 18, size: 'medium', label: 'Right shelf, position 3' },

  // Sideboard surface (spots 7-14) - middle area
  { id: 7, location: 'sideboard', x: 12, y: 52, size: 'small', label: 'Sideboard left end' },
  { id: 8, location: 'sideboard', x: 22, y: 52, size: 'medium', label: 'Sideboard left-center' },
  { id: 9, location: 'sideboard', x: 32, y: 52, size: 'small', label: 'Sideboard center-left' },
  { id: 10, location: 'sideboard', x: 42, y: 52, size: 'medium', label: 'Sideboard center' },
  { id: 11, location: 'sideboard', x: 52, y: 52, size: 'small', label: 'Sideboard center-right' },
  { id: 12, location: 'sideboard', x: 62, y: 52, size: 'medium', label: 'Sideboard right-center' },
  { id: 13, location: 'sideboard', x: 72, y: 52, size: 'small', label: 'Sideboard right' },
  { id: 14, location: 'sideboard', x: 82, y: 52, size: 'medium', label: 'Sideboard right end' },

  // Floor (spots 15-20) - bottom area
  { id: 15, location: 'floor', x: 8, y: 82, size: 'large', label: 'Floor far left' },
  { id: 16, location: 'floor', x: 22, y: 85, size: 'large', label: 'Floor left' },
  { id: 17, location: 'floor', x: 40, y: 88, size: 'large', label: 'Floor center-left' },
  { id: 18, location: 'floor', x: 58, y: 88, size: 'large', label: 'Floor center-right' },
  { id: 19, location: 'floor', x: 75, y: 85, size: 'large', label: 'Floor right' },
  { id: 20, location: 'floor', x: 90, y: 82, size: 'large', label: 'Floor far right' },
];

/**
 * Get a spot by its ID.
 */
export function getSpotById(id: number): PlantSpot | undefined {
  return PLANT_SPOTS.find(spot => spot.id === id);
}

/**
 * Find the nearest spot to given coordinates.
 * Used for mapping existing plant positions to fixed spots.
 */
export function findNearestSpot(x: number, y: number): PlantSpot {
  let nearest = PLANT_SPOTS[0];
  let minDistance = Infinity;

  for (const spot of PLANT_SPOTS) {
    const dx = spot.x - x;
    const dy = spot.y - y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    if (distance < minDistance) {
      minDistance = distance;
      nearest = spot;
    }
  }

  return nearest;
}
```

### 2. Create PlantSpot Component

Create `frontend/src/components/designer/PlantSpot.tsx`:

```typescript
/**
 * PlantSpot Component
 *
 * Interactive fixed position spot for placing plants.
 * Shows empty state (dashed outline) or occupied state (plant image).
 */

import { PlantSpot as SpotType, SpotSize } from './plantSpots';
import { PlantImage } from './PlantImage';
import { Plant } from '../../types/plant';
import { cn } from '../../lib/cn';

export interface PlantSpotProps {
  /** Spot configuration */
  spot: SpotType;
  /** Plant assigned to this spot (null if empty) */
  plant: Plant | null;
  /** Whether editing is enabled */
  editMode: boolean;
  /** Click handler for spot interaction */
  onClick: () => void;
  /** Hover state handler */
  onHover?: (hovered: boolean) => void;
  /** Additional CSS classes */
  className?: string;
}

// Pixel sizes for each spot size category
const SPOT_SIZES: Record<SpotSize, { width: number; height: number }> = {
  small: { width: 60, height: 80 },
  medium: { width: 90, height: 120 },
  large: { width: 120, height: 160 },
};

export function PlantSpot({
  spot,
  plant,
  editMode,
  onClick,
  onHover,
  className,
}: PlantSpotProps) {
  const size = SPOT_SIZES[spot.size];
  const isEmpty = plant === null;

  return (
    <div
      className={cn(
        'absolute transform -translate-x-1/2 -translate-y-1/2',
        'transition-all duration-200 ease-in-out',
        editMode && 'cursor-pointer',
        editMode && isEmpty && 'hover:scale-105',
        className
      )}
      style={{
        left: `${spot.x}%`,
        top: `${spot.y}%`,
        width: size.width,
        height: size.height,
      }}
      onClick={onClick}
      onMouseEnter={() => onHover?.(true)}
      onMouseLeave={() => onHover?.(false)}
      role="button"
      aria-label={isEmpty ? `Empty spot: ${spot.label}` : `${plant.name} at ${spot.label}`}
      tabIndex={editMode ? 0 : -1}
    >
      {isEmpty ? (
        // Empty spot indicator (dashed outline in edit mode)
        editMode && (
          <div
            className={cn(
              'w-full h-full',
              'border-2 border-dashed border-gray-300 rounded-lg',
              'bg-white/30 backdrop-blur-sm',
              'flex items-center justify-center',
              'hover:border-gray-400 hover:bg-white/50'
            )}
          >
            <span className="text-gray-400 text-xs">+</span>
          </div>
        )
      ) : (
        // Plant image
        <PlantImage
          species={plant.species ?? 'unknown'}
          size={spot.size}
          alt={plant.name}
          className="w-full h-full object-contain"
        />
      )}
    </div>
  );
}
```

### 3. Create ScandinavianCanvas Component

Create `frontend/src/components/designer/ScandinavianCanvas.tsx`:

```typescript
/**
 * ScandinavianCanvas Component
 *
 * Room view canvas with Scandinavian illustration background
 * and 20 fixed plant placement spots.
 */

import { useState } from 'react';
import roomBackground from '../../assets/room.png';
import { PLANT_SPOTS, PlantSpot as SpotType } from './plantSpots';
import { PlantSpot } from './PlantSpot';
import { Plant } from '../../types/plant';
import { cn } from '../../lib/cn';

export interface ScandinavianCanvasProps {
  /** All plants (positioned and unpositioned) */
  plants: Plant[];
  /** Mapping of spot ID to plant ID */
  spotAssignments: Record<number, string>;
  /** Enable edit mode for spot assignment */
  editMode: boolean;
  /** Handler for spot click (empty spot or reassign) */
  onSpotClick: (spotId: number, currentPlantId: string | null) => void;
  /** Handler for plant hover (shows tooltip) */
  onPlantHover?: (plantId: string | null, position: { x: number; y: number } | null) => void;
  /** Additional CSS classes */
  className?: string;
}

export function ScandinavianCanvas({
  plants,
  spotAssignments,
  editMode,
  onSpotClick,
  onPlantHover,
  className,
}: ScandinavianCanvasProps) {
  const [hoveredSpot, setHoveredSpot] = useState<number | null>(null);

  // Create a map of plantId -> Plant for quick lookup
  const plantMap = new Map(plants.map(p => [p.id, p]));

  // Get plant for a spot (if assigned)
  const getPlantForSpot = (spotId: number): Plant | null => {
    const plantId = spotAssignments[spotId];
    if (!plantId) return null;
    return plantMap.get(plantId) ?? null;
  };

  const handleSpotHover = (spotId: number, hovered: boolean) => {
    setHoveredSpot(hovered ? spotId : null);
    
    if (onPlantHover) {
      const plant = getPlantForSpot(spotId);
      if (hovered && plant) {
        const spot = PLANT_SPOTS.find(s => s.id === spotId);
        if (spot) {
          onPlantHover(plant.id, { x: spot.x, y: spot.y });
        }
      } else {
        onPlantHover(null, null);
      }
    }
  };

  return (
    <div
      className={cn(
        'relative w-full aspect-[4/3] max-w-4xl mx-auto',
        'rounded-lg overflow-hidden shadow-lg',
        className
      )}
    >
      {/* Room background image */}
      <img
        src={roomBackground}
        alt="Scandinavian living room"
        className="absolute inset-0 w-full h-full object-cover"
        loading="lazy"
      />

      {/* Plant spots overlay */}
      <div className="absolute inset-0">
        {PLANT_SPOTS.map(spot => (
          <PlantSpot
            key={spot.id}
            spot={spot}
            plant={getPlantForSpot(spot.id)}
            editMode={editMode}
            onClick={() => onSpotClick(spot.id, spotAssignments[spot.id] ?? null)}
            onHover={(hovered) => handleSpotHover(spot.id, hovered)}
          />
        ))}
      </div>

      {/* Edit mode overlay hint */}
      {editMode && (
        <div className="absolute bottom-4 left-4 right-4 text-center">
          <span className="bg-white/80 backdrop-blur-sm px-3 py-1.5 rounded-full text-sm text-gray-600">
            Click an empty spot to place a plant, or click a plant to reassign
          </span>
        </div>
      )}
    </div>
  );
}
```

### 4. Spot Assignment Logic Utility

Create `frontend/src/components/designer/spotAssignment.ts`:

```typescript
/**
 * Utility functions for managing spot assignments.
 */

import { Plant, PlantPosition } from '../../types/plant';
import { PLANT_SPOTS, findNearestSpot, PlantSpot } from './plantSpots';

/**
 * Convert plant positions to spot assignments.
 * Maps existing position data to nearest fixed spots.
 */
export function positionsToSpotAssignments(
  plants: Plant[]
): Record<number, string> {
  const assignments: Record<number, string> = {};
  const usedSpots = new Set<number>();

  // Sort plants by position to give priority to clearly positioned plants
  const positionedPlants = plants
    .filter(p => p.position !== null)
    .sort((a, b) => {
      // Prioritize plants with positions closer to spot centers
      return 0; // Simple first-come-first-served for now
    });

  for (const plant of positionedPlants) {
    if (!plant.position) continue;

    // Convert position to percentage (assuming 800x600 canvas from Feature 5)
    const xPercent = (plant.position.x / 800) * 100;
    const yPercent = (plant.position.y / 600) * 100;

    // Find nearest available spot
    const nearestSpot = findNearestSpotAvailable(xPercent, yPercent, usedSpots);
    if (nearestSpot) {
      assignments[nearestSpot.id] = plant.id;
      usedSpots.add(nearestSpot.id);
    }
  }

  return assignments;
}

/**
 * Find nearest spot that is not already used.
 */
function findNearestSpotAvailable(
  x: number,
  y: number,
  usedSpots: Set<number>
): PlantSpot | null {
  let nearest: PlantSpot | null = null;
  let minDistance = Infinity;

  for (const spot of PLANT_SPOTS) {
    if (usedSpots.has(spot.id)) continue;

    const dx = spot.x - x;
    const dy = spot.y - y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    if (distance < minDistance) {
      minDistance = distance;
      nearest = spot;
    }
  }

  return nearest;
}

/**
 * Convert spot assignment back to position for backend storage.
 * Uses spot coordinates converted to the 800x600 canvas coordinate system.
 */
export function spotToPosition(spotId: number): PlantPosition {
  const spot = PLANT_SPOTS.find(s => s.id === spotId);
  if (!spot) {
    return { x: 400, y: 300 }; // Default center
  }

  return {
    x: Math.round((spot.x / 100) * 800),
    y: Math.round((spot.y / 100) * 600),
  };
}
```

### 5. Export Updates

Update `frontend/src/components/designer/index.ts`:

```typescript
// Add new exports
export { PLANT_SPOTS, getSpotById, findNearestSpot } from './plantSpots';
export type { PlantSpot as PlantSpotType, SpotLocation, SpotSize } from './plantSpots';
export { PlantSpot } from './PlantSpot';
export type { PlantSpotProps } from './PlantSpot';
export { ScandinavianCanvas } from './ScandinavianCanvas';
export type { ScandinavianCanvasProps } from './ScandinavianCanvas';
export { positionsToSpotAssignments, spotToPosition } from './spotAssignment';
```

### 6. Tests

Create tests for new components:

**`frontend/src/components/designer/__tests__/plantSpots.test.ts`**
```typescript
import { PLANT_SPOTS, getSpotById, findNearestSpot } from '../plantSpots';

describe('plantSpots', () => {
  it('defines 20 spots', () => {
    expect(PLANT_SPOTS).toHaveLength(20);
  });

  it('has unique IDs', () => {
    const ids = PLANT_SPOTS.map(s => s.id);
    expect(new Set(ids).size).toBe(20);
  });

  it('getSpotById returns correct spot', () => {
    const spot = getSpotById(1);
    expect(spot?.id).toBe(1);
    expect(spot?.location).toBe('shelf');
  });

  it('findNearestSpot returns closest spot', () => {
    const spot = findNearestSpot(15, 18); // Near spot 1
    expect(spot.id).toBe(1);
  });
});
```

**`frontend/src/components/designer/__tests__/ScandinavianCanvas.test.tsx`**
```typescript
import { render, screen } from '@testing-library/react';
import { ScandinavianCanvas } from '../ScandinavianCanvas';

describe('ScandinavianCanvas', () => {
  const mockPlants = [
    { id: 'p1', name: 'Test Plant', species: 'Monstera', position: null },
  ];

  it('renders room background', () => {
    render(
      <ScandinavianCanvas
        plants={mockPlants}
        spotAssignments={{}}
        editMode={false}
        onSpotClick={() => {}}
      />
    );
    const img = screen.getByAltText('Scandinavian living room');
    expect(img).toBeInTheDocument();
  });

  it('shows edit hint in edit mode', () => {
    render(
      <ScandinavianCanvas
        plants={mockPlants}
        spotAssignments={{}}
        editMode={true}
        onSpotClick={() => {}}
      />
    );
    expect(screen.getByText(/Click an empty spot/)).toBeInTheDocument();
  });
});
```

## Constraints

- Position coordinates use percentage (0-100) for responsive scaling
- Maintain backward compatibility with existing position data (800x600 pixel coordinates)
- Room background must load lazily due to file size
- Spot positions must be visually calibrated to match room.png

## Files to Create/Modify

1. `frontend/src/components/designer/plantSpots.ts` - CREATE
2. `frontend/src/components/designer/PlantSpot.tsx` - CREATE
3. `frontend/src/components/designer/ScandinavianCanvas.tsx` - CREATE
4. `frontend/src/components/designer/spotAssignment.ts` - CREATE
5. `frontend/src/components/designer/index.ts` - MODIFY
6. `frontend/src/components/designer/__tests__/plantSpots.test.ts` - CREATE
7. `frontend/src/components/designer/__tests__/ScandinavianCanvas.test.tsx` - CREATE

## Definition of Done

1. 20 fixed spots defined with correct coordinates
2. PlantSpot component renders empty and occupied states
3. ScandinavianCanvas renders room background with spots
4. Spot assignment utilities work correctly
5. Edit mode shows clickable empty spots
6. Tests pass for all new components
7. `make check` passes (142+ tests)

## Verification

```bash
# Check spot definitions
grep -c "id:" frontend/src/components/designer/plantSpots.ts  # Should be 20

# Run tests
cd frontend && npm test -- plantSpots ScandinavianCanvas

# Full check
make check
```
