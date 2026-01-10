# Handoff: Task 051 - Frontend Status Overlays + Hover Tooltips

## Summary

Added real-time status indicators and hover tooltips to plants on the Designer canvas. Each plant now displays a status dot (green/yellow/red/gray) indicating health status and shows detailed sensor readings on hover. Offline plants are visually dimmed.

## Files Created

### New Files
- `frontend/src/utils/plantStatus.ts` - Plant status calculation utilities
  - `getPlantStatus(plant)` - Returns 'online' | 'warning' | 'critical' | 'offline'
  - `formatRelativeTime(timestamp)` - Formats "2 min ago" style strings
  
- `frontend/src/components/designer/PlantTooltip.tsx` - Tooltip component
  - Shows plant name, sensor readings (soil, temp, humidity, light)
  - Shows "last updated" relative time
  - Shows "No sensor data" for offline plants
  
- `frontend/src/utils/__tests__/plantStatus.test.ts` - Tests for status utilities
- `frontend/src/components/designer/__tests__/PlantTooltip.test.tsx` - Tests for tooltip component

### Modified Files
- `frontend/src/components/designer/DesignerCanvas.tsx` - Added:
  - `StatusDot` sub-component for health indicator circles
  - `calculateTooltipPosition()` for smart positioning (avoids canvas overflow)
  - Hover state management on PlantMarker
  - Offline styling (50% opacity, gray text)
  - Status dot positioned at bottom-right of plant icon
  
- `frontend/src/components/designer/index.ts` - Added exports for PlantTooltip

## Component API

### PlantTooltip
```tsx
interface PlantTooltipProps {
  plant: Plant;                        // Plant with optional telemetry
  visible: boolean;                    // Show/hide tooltip
  position: { x: number; y: number };  // Position relative to plant
}
```

### getPlantStatus
```tsx
function getPlantStatus(plant: Plant): 'online' | 'warning' | 'critical' | 'offline'
```

Status logic:
- `offline`: No telemetry data
- `critical`: Sensor values beyond 10% margin of thresholds
- `warning`: Sensor values outside thresholds
- `online`: All values within thresholds (or no thresholds configured)

### formatRelativeTime
```tsx
function formatRelativeTime(timestamp: string): string
// Returns: "Just now", "2 min ago", "5h ago", "3d ago"
```

## Status Colors (Semantic Tokens)

The status dots use the semantic color tokens from Feature 4:

| Status | Color | Hex Value |
|--------|-------|-----------|
| online | status-success | #22c55e (green) |
| warning | status-warning | #eab308 (yellow) |
| critical | status-error | #ef4444 (red) |
| offline | status-neutral | #9ca3af (gray) |

## Visual Behavior

1. **Status Dots**: 
   - Positioned at bottom-right of plant icon (x=18, y=18)
   - 5px radius with white stroke for visibility

2. **Hover Tooltips**:
   - Positioned intelligently to avoid canvas edges
   - Shows all sensor readings with units
   - Shows "--" for null sensor values
   - Shows relative time since last update

3. **Offline Plants**:
   - 50% opacity applied to entire plant group
   - Plant icon uses gray color instead of normal
   - Status dot shows gray (neutral)
   - Tooltip shows "No sensor data"

## How to Verify

```bash
# Run full check (142 backend tests + frontend build)
make check

# TypeScript type checking
npm run lint --prefix frontend
```

Manual verification:
1. View Designer canvas with plants that have position data
2. Hover over any plant - tooltip should appear with sensor readings
3. Verify status dot color matches plant health:
   - Green = all values in range
   - Yellow = value outside threshold
   - Red = value significantly outside threshold
   - Gray = no telemetry data
4. Offline plants should appear dimmed (50% opacity)
5. Tooltip should reposition if near canvas edge

## Test Coverage

### plantStatus.test.ts (12 tests)
- Returns offline when no telemetry
- Returns offline when latest_telemetry is undefined
- Returns online with telemetry but no thresholds
- Returns online when all values within thresholds
- Returns warning for various threshold violations
- Returns critical for severe violations
- Handles null sensor values gracefully
- Handles partial thresholds
- Prioritizes critical over warning
- formatRelativeTime for various time intervals

### PlantTooltip.test.tsx (7 tests)
- Renders plant name and sensor readings
- Shows "No sensor data" when telemetry is null
- Formats relative time correctly
- Returns null when not visible
- Shows dashes for null sensor values
- Renders at specified position

## Definition of Done Verification

- [x] Status dots appear on each plant (using semantic tokens)
- [x] Hover tooltip shows sensor readings
- [x] Tooltip shows "last updated" timestamp
- [x] Tooltip shows "No sensor data" for offline plants
- [x] Offline plants are visually dimmed (opacity: 50%)
- [x] Tooltip positions correctly (doesn't overflow canvas)
- [x] Tests written for PlantTooltip and plantStatus
- [x] `make check` passes (142 backend tests + frontend build)

## Risks / Follow-ups

1. **SVG foreignObject**: The tooltip uses `<foreignObject>` within SVG to render HTML. This works in modern browsers but may have issues in older browsers or when printing.

2. **Performance**: For many plants, consider debouncing hover events or using a single tooltip instance that repositions.

3. **Threshold configuration**: Status calculation assumes thresholds are configured per-plant. Plants without thresholds will always show "online" if they have telemetry.

4. **Real-time updates**: Currently status is calculated on render. For real-time updates, consider WebSocket integration.
