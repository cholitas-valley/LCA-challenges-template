# Task 051 Recorder: Frontend Status Overlays + Hover Tooltips

## Summary

Added real-time status indicators and hover tooltips to plants on the Designer canvas. Each plant now shows a colored status dot (green/yellow/red/gray) and displays sensor readings on hover.

## Files Touched

**Created:**
- `frontend/src/utils/plantStatus.ts` - Status calculation and time formatting
- `frontend/src/components/designer/PlantTooltip.tsx` - Hover tooltip component
- `frontend/src/utils/__tests__/plantStatus.test.ts` - 14 status utility tests
- `frontend/src/components/designer/__tests__/PlantTooltip.test.tsx` - 7 tooltip tests

**Modified:**
- `frontend/src/components/designer/DesignerCanvas.tsx` - Added StatusDot, hover state, tooltip
- `frontend/src/components/designer/index.ts` - Added PlantTooltip export

## New Interfaces

```tsx
// plantStatus.ts
function getPlantStatus(plant: Plant): 'online' | 'warning' | 'critical' | 'offline';
function formatRelativeTime(timestamp: string): string;

// PlantTooltip.tsx
interface PlantTooltipProps {
  plant: Plant;
  visible: boolean;
  position: { x: number; y: number };
}
```

## Status Colors
- online: #22c55e (green)
- warning: #eab308 (yellow)
- critical: #ef4444 (red)
- offline: #9ca3af (gray)

## Critical for Next Tasks

**task-052 (Designer Page):**
- DesignerCanvas now has full status visualization built-in
- No additional status work needed - just integrate the canvas
- Tooltips work automatically on hover

---

**Recorded by:** lca-recorder
**Timestamp:** 2026-01-10
