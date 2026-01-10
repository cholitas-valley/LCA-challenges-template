# Task 042 Recorder: Loading States (Skeletons)

## Summary

Created skeleton loading components to replace generic spinners during data fetches.

## Files Created/Modified

| File | Purpose |
|------|---------|
| `frontend/src/components/ui/Skeleton.tsx` | Base + pre-built patterns |
| `frontend/src/components/ui/index.ts` | Added exports |

## Components Created

| Component | Use Case | Default Props |
|-----------|----------|---------------|
| `Skeleton` | Base building block | `className` |
| `SkeletonCard` | Plant/device cards | - |
| `SkeletonTableRow` | Table row | `columns=5` |
| `SkeletonTable` | Full table | `rows=5, columns=5` |
| `SkeletonCardGrid` | Dashboard grids | `count=6` |

## Animation

- Uses Tailwind `animate-pulse` (2s, ease-in-out, infinite)
- Base styling: `rounded-md bg-gray-200`

## Context for Next Tasks

- **Task 043 (Devices)**: Replace LoadingSpinner with `<SkeletonTable/>`
- **Task 044 (Plants)**: Use `<SkeletonCardGrid/>` for dashboard

## Import Pattern

```typescript
import { Skeleton, SkeletonCard, SkeletonTable, SkeletonCardGrid } from '@/components/ui';
```
