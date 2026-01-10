# Task 056 Recorder Handoff

## Summary

Task-056 completed: Scandinavian DesignerCanvas Restyle

## Changes Made

### Files Modified (7)
- `frontend/src/pages/Designer.tsx` - Integrated ScandinavianCanvas with spot assignments
- `frontend/src/components/designer/DesignerSidebar.tsx` - Warm Scandinavian styling with PlantImage
- `frontend/src/components/designer/DesignerToolbar.tsx` - Toggle pills with amber accents
- `frontend/src/hooks/usePlants.ts` - Null position support for unassignment
- `frontend/src/components/designer/spotAssignment.ts` - Off-canvas position filtering
- `frontend/src/components/designer/index.ts` - Added PlantAssignmentModal export
- `frontend/src/pages/__tests__/Designer.test.tsx` - Updated for ScandinavianCanvas

### Files Created (2)
- `frontend/src/components/designer/PlantAssignmentModal.tsx` - Modal for spot assignment
- `frontend/src/components/designer/__tests__/PlantAssignmentModal.test.tsx` - Modal tests

## Key Interfaces

```typescript
interface PlantAssignmentModalProps {
  isOpen: boolean;
  spotId: number;
  currentPlantId: string | null;
  availablePlants: Plant[];
  onAssign: (plantId: string) => void;
  onRemove: (plantId: string) => void;
  onClose: () => void;
}

// Null position → off-canvas { x: -1, y: -1 }
useUpdatePlantPosition() accepts position: { x, y } | null
```

## Context for Task 057 (Cozy Tooltips & Status Indicators)

Task 057 can now:
1. Add tooltips to PlantSpot component (hover shows sensor data)
2. Add status ring/indicator around plants
3. ScandinavianCanvas handles onPlantHover callback
4. Designer.tsx manages hovered plant state

## Design Contracts

- Off-canvas position `{ x: -1, y: -1 }` = unassigned
- View mode: click plant → navigate to detail
- Edit mode: click spot → open PlantAssignmentModal
- Sidebar shows unassigned plants only
