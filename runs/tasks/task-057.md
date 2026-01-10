---
task_id: task-057
title: "Cozy Tooltips & Status Indicators"
role: lca-frontend
follow_roles: []
post: [lca-recorder, code-simplifier, lca-gitops]
depends_on: [task-056]
inputs:
  - objective.md
  - runs/plan.md
  - runs/handoffs/task-056.md
  - frontend/src/components/designer/PlantTooltip.tsx
  - frontend/src/components/designer/ScandinavianCanvas.tsx
allowed_paths:
  - frontend/**
check_command: make check
handoff: runs/handoffs/task-057.md
---

# Task 057: Cozy Tooltips & Status Indicators

## Goal

Create cozy, Scandinavian-styled tooltips and subtle status indicators that match the warm room aesthetic. Replace the technical-looking status dots with soft, organic visual cues.

## Context

Feature 5 used technical status indicators:
- Bright green/yellow/red dots
- Simple tooltip with sensor readings

Feature 6 requires:
- Soft, muted color palette
- Cozy tooltip design (cream background, rounded corners)
- Subtle status ring around plant pots
- Smooth hover transitions

## Requirements

### 1. Create CozyTooltip Component

Create `frontend/src/components/designer/CozyTooltip.tsx`:

```typescript
/**
 * CozyTooltip Component
 *
 * A warm, Scandinavian-styled tooltip for displaying plant information.
 * Features soft colors, rounded corners, and gentle shadows.
 */

import { Plant } from '../../types/plant';
import { getPlantStatus } from '../../utils/plantStatus';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '../../lib/cn';

export interface CozyTooltipProps {
  /** Plant to display information for */
  plant: Plant;
  /** Whether tooltip is visible */
  visible: boolean;
  /** Position relative to plant (percentage) */
  position: { x: number; y: number };
  /** Additional CSS classes */
  className?: string;
}

/**
 * Muted Scandinavian status colors.
 */
const STATUS_COLORS = {
  online: 'bg-sage-100 text-sage-700 border-sage-200',  // Soft sage green
  warning: 'bg-amber-50 text-amber-700 border-amber-200',  // Muted amber
  critical: 'bg-rose-50 text-rose-700 border-rose-200',  // Dusty rose
  offline: 'bg-gray-100 text-gray-500 border-gray-200',  // Light grey
};

/**
 * Status label text.
 */
const STATUS_LABELS = {
  online: 'Thriving',
  warning: 'Needs attention',
  critical: 'Help needed',
  offline: 'No sensor data',
};

export function CozyTooltip({
  plant,
  visible,
  position,
  className,
}: CozyTooltipProps) {
  const status = getPlantStatus(plant);
  const latestTelemetry = plant.latest_telemetry;
  const lastUpdate = latestTelemetry?.timestamp
    ? formatDistanceToNow(new Date(latestTelemetry.timestamp), { addSuffix: true })
    : 'Never';

  if (!visible) return null;

  return (
    <div
      className={cn(
        'absolute z-50 pointer-events-none',
        'transform -translate-x-1/2 transition-all duration-200',
        visible ? 'opacity-100 scale-100' : 'opacity-0 scale-95',
        className
      )}
      style={{
        left: `${position.x}%`,
        top: `${position.y - 15}%`,  // Position above plant
      }}
      role="tooltip"
      aria-label={`Information for ${plant.name}`}
    >
      <div
        className={cn(
          'bg-cream-50 border border-stone-200',
          'rounded-xl shadow-lg',
          'px-4 py-3 min-w-[180px]',
          'backdrop-blur-sm'
        )}
        style={{
          backgroundColor: '#FFFBF5',  // Warm cream
        }}
      >
        {/* Plant name */}
        <div className="flex items-center gap-2 mb-2">
          <span className="text-lg">🌿</span>
          <h3 className="font-medium text-stone-800">{plant.name}</h3>
        </div>

        {/* Divider */}
        <div className="border-t border-stone-200 my-2" />

        {/* Status badge */}
        <div className={cn(
          'inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs mb-3',
          STATUS_COLORS[status]
        )}>
          <span className="w-1.5 h-1.5 rounded-full bg-current" />
          {STATUS_LABELS[status]}
        </div>

        {/* Sensor readings */}
        {latestTelemetry ? (
          <div className="space-y-1.5 text-sm">
            <div className="flex items-center gap-2 text-stone-600">
              <span className="text-base">💧</span>
              <span>Soil: {latestTelemetry.soil_moisture?.toFixed(0) ?? '--'}%</span>
            </div>
            <div className="flex items-center gap-2 text-stone-600">
              <span className="text-base">🌡️</span>
              <span>Temp: {latestTelemetry.temperature?.toFixed(1) ?? '--'}°C</span>
            </div>
            <div className="flex items-center gap-2 text-stone-600">
              <span className="text-base">💨</span>
              <span>Humidity: {latestTelemetry.humidity?.toFixed(0) ?? '--'}%</span>
            </div>
            <div className="flex items-center gap-2 text-stone-600">
              <span className="text-base">☀️</span>
              <span>Light: {formatLightLevel(latestTelemetry.light_level)}</span>
            </div>
          </div>
        ) : (
          <p className="text-sm text-stone-500 italic">No sensor data available</p>
        )}

        {/* Divider */}
        <div className="border-t border-stone-200 my-2" />

        {/* Last updated */}
        <p className="text-xs text-stone-400">
          Updated {lastUpdate}
        </p>
      </div>

      {/* Tooltip arrow */}
      <div
        className="absolute left-1/2 -translate-x-1/2 -bottom-2"
        style={{
          width: 0,
          height: 0,
          borderLeft: '8px solid transparent',
          borderRight: '8px solid transparent',
          borderTop: '8px solid #FFFBF5',
        }}
      />
    </div>
  );
}

/**
 * Format light level to human-readable text.
 */
function formatLightLevel(lux: number | null | undefined): string {
  if (lux == null) return '--';
  if (lux < 200) return 'Low';
  if (lux < 500) return 'Medium';
  if (lux < 1000) return 'Good';
  return 'Bright';
}
```

### 2. Create Scandinavian Color Tokens

Add to `frontend/tailwind.config.js`:

```javascript
module.exports = {
  theme: {
    extend: {
      colors: {
        // Scandinavian palette
        cream: {
          50: '#FFFBF5',
          100: '#FFF7EB',
          200: '#FFEFD6',
        },
        sage: {
          50: '#F2F7F2',
          100: '#E3EFE3',
          200: '#C7DFC7',
          500: '#6B8E6B',
          700: '#4A6B4A',
        },
        birch: {
          50: '#FAF9F7',
          100: '#F5F3EF',
          200: '#EBE7E0',
        },
        // Muted status colors
        'status-cozy': {
          success: '#8BA888',   // Soft sage
          warning: '#D4A574',   // Muted amber
          error: '#C88B8B',     // Dusty rose
          neutral: '#9CA3AF',   // Light grey
        },
      },
    },
  },
};
```

### 3. Create StatusRing Component

Create `frontend/src/components/designer/StatusRing.tsx`:

```typescript
/**
 * StatusRing Component
 *
 * A subtle colored ring that appears around plant pots
 * to indicate health status without harsh colors.
 */

import { PlantStatusType } from '../../utils/plantStatus';
import { cn } from '../../lib/cn';

export interface StatusRingProps {
  status: PlantStatusType;
  size: 'small' | 'medium' | 'large';
  className?: string;
}

const RING_COLORS: Record<PlantStatusType, string> = {
  online: 'ring-sage-300 ring-opacity-60',
  warning: 'ring-amber-300 ring-opacity-60',
  critical: 'ring-rose-300 ring-opacity-60',
  offline: 'ring-gray-300 ring-opacity-40',
};

const RING_SIZES: Record<string, string> = {
  small: 'ring-2',
  medium: 'ring-[3px]',
  large: 'ring-4',
};

const GLOW_COLORS: Record<PlantStatusType, string> = {
  online: 'shadow-sage-200/50',
  warning: 'shadow-amber-200/50',
  critical: 'shadow-rose-200/50',
  offline: 'shadow-gray-200/30',
};

export function StatusRing({ status, size, className }: StatusRingProps) {
  return (
    <div
      className={cn(
        'absolute inset-0 rounded-full',
        RING_SIZES[size],
        RING_COLORS[status],
        'shadow-lg',
        GLOW_COLORS[status],
        'transition-all duration-300',
        status === 'offline' && 'opacity-50',
        className
      )}
      aria-hidden="true"
    />
  );
}
```

### 4. Update PlantSpot with Status Ring

Modify `frontend/src/components/designer/PlantSpot.tsx`:

```typescript
import { StatusRing } from './StatusRing';
import { getPlantStatus } from '../../utils/plantStatus';

// In the PlantSpot component, wrap the PlantImage with StatusRing:
{!isEmpty && (
  <div className="relative w-full h-full">
    <StatusRing status={getPlantStatus(plant)} size={spot.size} />
    <PlantImage
      species={plant.species ?? 'unknown'}
      size={spot.size}
      alt={plant.name}
      className={cn(
        'w-full h-full object-contain',
        'transition-opacity duration-200',
        getPlantStatus(plant) === 'offline' && 'opacity-60'
      )}
    />
  </div>
)}
```

### 5. Update ScandinavianCanvas with Tooltip

Modify `frontend/src/components/designer/ScandinavianCanvas.tsx`:

```typescript
import { CozyTooltip } from './CozyTooltip';

// Add tooltip state and rendering:
const [tooltipPlant, setTooltipPlant] = useState<{
  plant: Plant;
  position: { x: number; y: number };
} | null>(null);

// In the render:
{tooltipPlant && (
  <CozyTooltip
    plant={tooltipPlant.plant}
    visible={true}
    position={tooltipPlant.position}
  />
)}
```

### 6. Add Smooth Transitions

Add hover animations to PlantSpot:

```typescript
// In PlantSpot.tsx
<div
  className={cn(
    'transition-transform duration-200 ease-out',
    hovered && !editMode && 'scale-105',
    editMode && hovered && 'scale-110',
  )}
>
  {/* Plant content */}
</div>
```

### 7. Tests

Create `frontend/src/components/designer/__tests__/CozyTooltip.test.tsx`:

```typescript
import { render, screen } from '@testing-library/react';
import { CozyTooltip } from '../CozyTooltip';

describe('CozyTooltip', () => {
  const mockPlant = {
    id: 'p1',
    name: 'Test Monstera',
    species: 'Monstera',
    latest_telemetry: {
      timestamp: new Date().toISOString(),
      soil_moisture: 45,
      temperature: 22,
      humidity: 65,
      light_level: 800,
    },
    position: { x: 100, y: 200 },
  };

  it('renders plant name', () => {
    render(
      <CozyTooltip
        plant={mockPlant}
        visible={true}
        position={{ x: 50, y: 50 }}
      />
    );
    expect(screen.getByText('Test Monstera')).toBeInTheDocument();
  });

  it('shows sensor readings', () => {
    render(
      <CozyTooltip
        plant={mockPlant}
        visible={true}
        position={{ x: 50, y: 50 }}
      />
    );
    expect(screen.getByText(/Soil: 45%/)).toBeInTheDocument();
    expect(screen.getByText(/Temp: 22.0°C/)).toBeInTheDocument();
  });

  it('shows status badge', () => {
    render(
      <CozyTooltip
        plant={mockPlant}
        visible={true}
        position={{ x: 50, y: 50 }}
      />
    );
    expect(screen.getByText('Thriving')).toBeInTheDocument();
  });

  it('is hidden when not visible', () => {
    render(
      <CozyTooltip
        plant={mockPlant}
        visible={false}
        position={{ x: 50, y: 50 }}
      />
    );
    expect(screen.queryByText('Test Monstera')).not.toBeInTheDocument();
  });
});
```

### 8. Export Updates

Update `frontend/src/components/designer/index.ts`:

```typescript
export { CozyTooltip } from './CozyTooltip';
export type { CozyTooltipProps } from './CozyTooltip';
export { StatusRing } from './StatusRing';
export type { StatusRingProps } from './StatusRing';
```

## Constraints

- Use muted Scandinavian color palette (no harsh reds/greens)
- Maintain accessibility (contrast ratios, screen reader support)
- Smooth animations (200-300ms transitions)
- Tooltip must not overflow canvas bounds

## Files to Create/Modify

1. `frontend/src/components/designer/CozyTooltip.tsx` - CREATE
2. `frontend/src/components/designer/StatusRing.tsx` - CREATE
3. `frontend/src/components/designer/PlantSpot.tsx` - MODIFY (add StatusRing)
4. `frontend/src/components/designer/ScandinavianCanvas.tsx` - MODIFY (add tooltip)
5. `frontend/tailwind.config.js` - MODIFY (add color tokens)
6. `frontend/src/components/designer/index.ts` - MODIFY (add exports)
7. `frontend/src/components/designer/__tests__/CozyTooltip.test.tsx` - CREATE

## Definition of Done

1. CozyTooltip renders with warm cream background
2. Sensor readings display with emoji icons
3. Status badge shows human-readable status text
4. StatusRing wraps plants with subtle colored glow
5. Offline plants are visually faded
6. Hover transitions are smooth (200ms)
7. All tests pass
8. `make check` passes (142+ tests)

## Verification

```bash
# Run tests
cd frontend && npm test -- CozyTooltip StatusRing

# Manual verification:
# 1. Hover over plant - tooltip should appear
# 2. Check tooltip styling (cream bg, rounded corners)
# 3. Verify status ring colors are muted
# 4. Check offline plant appearance (faded)
# 5. Verify smooth hover animations

# Full check
make check
```
