---
task_id: task-051
title: "Frontend: Status Overlays + Hover Tooltips"
role: lca-frontend
follow_roles: []
post: [lca-recorder, code-simplifier, lca-gitops]
depends_on: [task-050]
inputs:
  - objective.md
  - runs/plan.md
  - runs/handoffs/task-050.md
  - frontend/src/components/designer/DesignerCanvas.tsx
  - frontend/src/components/ui/StatusBadge.tsx
allowed_paths:
  - frontend/**
check_command: make check
handoff: runs/handoffs/task-051.md
---

# Task 051: Frontend Status Overlays + Hover Tooltips

## Goal

Add real-time status indicators and hover tooltips to plants on the Designer canvas. Each plant should show a status dot (green/yellow/red/gray) and display sensor readings on hover.

## Context

The Designer Space needs to show plant health at a glance. Status dots use the existing semantic color tokens from Feature 4. Tooltips provide detailed sensor readings without navigating away from the floor plan view.

**Dependencies:**
- task-050: DesignerCanvas component
- Existing semantic color tokens (status-success, status-warning, etc.)
- Existing telemetry data in plant responses

## Requirements

### 1. PlantTooltip Component

Create `frontend/src/components/designer/PlantTooltip.tsx`:

```tsx
interface PlantTooltipProps {
  plant: Plant;
  visible: boolean;
  position: { x: number; y: number };
}

export function PlantTooltip({ plant, visible, position }: PlantTooltipProps) {
  if (!visible) return null;
  
  const telemetry = plant.latest_telemetry;
  const lastUpdated = telemetry?.timestamp 
    ? formatRelativeTime(telemetry.timestamp)
    : 'No data';

  return (
    <div 
      className="absolute bg-white border border-gray-200 rounded-lg shadow-lg p-3 z-50"
      style={{ left: position.x, top: position.y }}
    >
      <div className="font-medium text-gray-900 mb-2">{plant.name}</div>
      <div className="text-xs text-gray-500 border-t border-gray-100 pt-2 space-y-1">
        {telemetry ? (
          <>
            <div className="flex items-center gap-2">
              <span>Soil:</span>
              <span>{telemetry.soil_moisture?.toFixed(0)}%</span>
            </div>
            <div className="flex items-center gap-2">
              <span>Temp:</span>
              <span>{telemetry.temperature?.toFixed(1)}C</span>
            </div>
            <div className="flex items-center gap-2">
              <span>Humidity:</span>
              <span>{telemetry.humidity?.toFixed(0)}%</span>
            </div>
            <div className="flex items-center gap-2">
              <span>Light:</span>
              <span>{telemetry.light_level?.toFixed(0)} lx</span>
            </div>
          </>
        ) : (
          <div className="text-gray-400">No sensor data</div>
        )}
      </div>
      <div className="text-xs text-gray-400 mt-2 pt-2 border-t border-gray-100">
        Last: {lastUpdated}
      </div>
    </div>
  );
}
```

### 2. Status Dot Component

Create status indicator for plant markers:

```tsx
interface StatusDotProps {
  status: 'online' | 'warning' | 'critical' | 'offline';
  className?: string;
}

function StatusDot({ status, className }: StatusDotProps) {
  const colorClass = {
    online: 'bg-status-success',
    warning: 'bg-status-warning',
    critical: 'bg-status-error',
    offline: 'bg-status-neutral'
  }[status];

  return (
    <circle
      r="4"
      className={cn(colorClass, className)}
      fill="currentColor"
    />
  );
}
```

### 3. Update PlantMarker with Status

Modify the PlantMarker in DesignerCanvas to include status dot:

```tsx
function PlantMarker({ plant, editMode, onDragEnd, onClick }) {
  const [hovered, setHovered] = useState(false);
  
  const status = getPlantStatus(plant);
  const isOffline = status === 'offline';

  return (
    <g
      transform={`translate(${plant.position.x}, ${plant.position.y})`}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className={cn(isOffline && 'opacity-50')}
    >
      {/* Plant icon */}
      <PlantIcon 
        species={plant.species} 
        size={48}
        className={cn('text-gray-700', isOffline && 'text-gray-400')}
      />
      
      {/* Status dot (bottom-right of icon) */}
      <StatusDot 
        status={status}
        transform="translate(20, 20)"
      />
      
      {/* Name label */}
      <text 
        y="36" 
        textAnchor="middle" 
        className="text-xs fill-gray-600"
      >
        {plant.name}
      </text>

      {/* Tooltip on hover */}
      {hovered && (
        <PlantTooltip 
          plant={plant}
          visible={hovered}
          position={{ x: 60, y: -20 }}
        />
      )}
    </g>
  );
}
```

### 4. Status Calculation Logic

Create utility for determining plant status:

```tsx
// frontend/src/utils/plantStatus.ts

export function getPlantStatus(plant: Plant): 'online' | 'warning' | 'critical' | 'offline' {
  // Check if device is offline (no recent telemetry)
  if (!plant.latest_telemetry) return 'offline';
  
  const telemetry = plant.latest_telemetry;
  const thresholds = plant.thresholds;
  
  // Check if any sensor is in critical range
  if (thresholds) {
    const isCritical = checkCriticalThresholds(telemetry, thresholds);
    if (isCritical) return 'critical';
    
    const isWarning = checkWarningThresholds(telemetry, thresholds);
    if (isWarning) return 'warning';
  }
  
  return 'online';
}

function checkCriticalThresholds(telemetry: Telemetry, thresholds: Thresholds): boolean {
  // Check if values are significantly outside thresholds
  // Example: soil_moisture < min - 10 or > max + 10
  return false; // Implement based on business logic
}

function checkWarningThresholds(telemetry: Telemetry, thresholds: Thresholds): boolean {
  // Check if values are outside thresholds but not critical
  return false; // Implement based on business logic
}
```

### 5. Offline Visual Treatment

Plants without recent telemetry should appear dimmed:

```tsx
// In PlantMarker
const isOffline = status === 'offline';

<g className={cn(isOffline && 'opacity-50')}>
  <PlantIcon 
    className={cn('text-gray-700', isOffline && 'text-gray-400')}
  />
</g>
```

### 6. Tooltip Positioning

Handle tooltip edge cases:

```tsx
function calculateTooltipPosition(
  plantPos: { x: number; y: number },
  canvasSize: { width: number; height: number }
): { x: number; y: number } {
  let x = plantPos.x + 60;  // Default: right of plant
  let y = plantPos.y - 20;  // Default: above center
  
  // Adjust if near right edge
  if (x + 180 > canvasSize.width) {
    x = plantPos.x - 180;  // Show to left
  }
  
  // Adjust if near top edge
  if (y < 0) {
    y = plantPos.y + 60;  // Show below
  }
  
  return { x, y };
}
```

### 7. Relative Time Formatting

Add utility for "2 min ago" formatting:

```tsx
function formatRelativeTime(timestamp: string): string {
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  
  if (diffMin < 1) return 'Just now';
  if (diffMin < 60) return `${diffMin} min ago`;
  const diffHours = Math.floor(diffMin / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  return `${Math.floor(diffHours / 24)}d ago`;
}
```

### 8. Tests

Add tests for new components:

```tsx
// PlantTooltip.test.tsx
describe('PlantTooltip', () => {
  it('renders plant name and sensor readings');
  it('shows "No sensor data" when telemetry is null');
  it('formats relative time correctly');
});

// plantStatus.test.ts
describe('getPlantStatus', () => {
  it('returns offline when no telemetry');
  it('returns online when all values in range');
  it('returns warning when values outside thresholds');
  it('returns critical when values far outside thresholds');
});
```

## Files to Create/Modify

1. `frontend/src/components/designer/PlantTooltip.tsx` - CREATE
2. `frontend/src/utils/plantStatus.ts` - CREATE
3. `frontend/src/components/designer/DesignerCanvas.tsx` - MODIFY (add status dots, tooltips)
4. `frontend/src/components/designer/index.ts` - MODIFY (add exports)
5. `frontend/src/components/designer/__tests__/PlantTooltip.test.tsx` - CREATE
6. `frontend/src/utils/__tests__/plantStatus.test.ts` - CREATE

## Definition of Done

1. Status dots appear on each plant (using semantic tokens)
2. Hover tooltip shows sensor readings
3. Tooltip shows "last updated" timestamp
4. Tooltip shows "No sensor data" for offline plants
5. Offline plants are visually dimmed (opacity: 50%)
6. Tooltip positions correctly (doesn't overflow canvas)
7. Tests pass
8. `make check` passes (139 tests)

## Verification

```bash
# Run tests
make check

# Manual verification
# - Hover over plant, verify tooltip shows readings
# - Verify status dot colors match plant health
# - Verify offline plant is dimmed with gray dot
# - Verify tooltip shows relative time ("2 min ago")
```
