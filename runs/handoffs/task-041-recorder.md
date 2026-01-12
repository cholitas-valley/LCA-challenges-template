# Task 041 Recorder: FilterPills Component

## Summary

Created FilterPills component for filter toggle patterns, visually distinct from action buttons.

## Files Created/Modified

| File | Purpose |
|------|---------|
| `frontend/src/components/ui/FilterPills.tsx` | FilterPills component |
| `frontend/src/components/ui/index.ts` | Added exports |

## Component Interface

```typescript
interface FilterOption<T extends string> {
  value: T;
  label: string;
  count?: number;
}

interface FilterPillsProps<T extends string> {
  options: FilterOption<T>[];
  value: T;
  onChange: (value: T) => void;
}
```

## Design Distinction

| Aspect | FilterPills | Button |
|--------|-------------|--------|
| Shape | rounded-full (pill) | rounded-md |
| Active | bg-gray-900 (dark) | bg-action-primary (green) |
| Purpose | Selection/toggle | Action trigger |

## ARIA Accessibility

- Container: `role="group"` with `aria-label`
- Pills: `role="radio"` with `aria-checked`

## Context for Next Tasks

- **Task 043 (Devices)**: Replace filter buttons with `<FilterPills options={...} value={statusFilter} onChange={setStatusFilter}/>`
- **Task 044 (Plants)**: May use for plant type/status filters

## Import Pattern

```typescript
import { FilterPills, type FilterOption } from '@/components/ui';
```
