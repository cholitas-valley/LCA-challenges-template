# Task 043 Recorder: Page Migration (Dashboard, Devices)

## Summary

Migrated Dashboard.tsx, Devices.tsx, DeviceTable.tsx, and EmptyState.tsx to use design system components.

## Files Modified

| File | Changes |
|------|---------|
| `Dashboard.tsx` | Button primary, SkeletonCardGrid |
| `Devices.tsx` | Button, FilterPills, SkeletonTable |
| `DeviceTable.tsx` | StatusBadge, Button variants (ghost, secondary, danger) |
| `EmptyState.tsx` | Button primary |

## Components Used

- `<Button variant="primary">` - main CTAs
- `<Button variant="ghost" size="sm">` - table actions
- `<Button variant="danger" size="sm">` - destructive actions
- `<StatusBadge status={device.status}/>` - device status display
- `<FilterPills options={...}/>` - filter toggles
- `<SkeletonCardGrid count={6}/>` - dashboard loading
- `<SkeletonTable rows={5} columns={6}/>` - table loading

## Removed

- All `bg-green-600` from migrated files
- `getStatusColor()` and `getStatusLabel()` helpers from DeviceTable

## Context for Task 044

Apply same pattern to:
- Plants.tsx
- PlantDetail.tsx
- PlantCard.tsx
- CreatePlantModal.tsx

Import pattern:
```typescript
import { Button, StatusBadge, Skeleton, SkeletonCardGrid } from '../components/ui';
```
