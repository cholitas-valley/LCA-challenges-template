# Task 041 Handoff: FilterPills Component

## Summary

Created the FilterPills component for filter toggle patterns. This component is visually distinct from action buttons, using neutral gray colors and pill shapes to communicate selection behavior rather than triggering actions.

## Files Touched

- `frontend/src/components/ui/FilterPills.tsx` (created)
- `frontend/src/components/ui/index.ts` (updated)

## Components Added

### FilterPills

A generic toggle/selection component with:

- **Generic type support**: `<T extends string>` for type-safe filter values
- **FilterOption interface**: `{ value: T, label: string, count?: number }`
- **FilterPillsProps interface**: `{ options, value, onChange, className? }`
- **Active state**: Dark gray (`bg-gray-900 text-white`)
- **Inactive state**: Light gray (`bg-gray-100 text-gray-600`)
- **Shape**: Pill (`rounded-full`)
- **ARIA**: `role="group"` container, `role="radio"` + `aria-checked` per pill

### Visual Distinction from Button

| Aspect          | FilterPills         | Button (primary)    |
|-----------------|---------------------|---------------------|
| Shape           | Pill (rounded-full) | Rounded-md          |
| Active state    | Dark gray fill      | Brand green fill    |
| Inactive state  | Light gray          | N/A                 |
| Purpose         | Toggle/select       | Trigger action      |
| Group behavior  | Radio group         | Standalone          |

## Exports Added

```typescript
export { FilterPills } from './FilterPills';
export type { FilterPillsProps, FilterOption } from './FilterPills';
```

## How to Verify

```bash
# Build and lint pass
cd frontend && npm run build && npm run lint
```

## Usage Example

```tsx
import { FilterPills, type FilterOption } from '@/components/ui';

type StatusFilter = 'all' | 'online' | 'offline' | 'unassigned';

const statusOptions: FilterOption<StatusFilter>[] = [
  { value: 'all', label: 'All', count: 10 },
  { value: 'online', label: 'Online', count: 6 },
  { value: 'offline', label: 'Offline', count: 3 },
  { value: 'unassigned', label: 'Unassigned', count: 1 },
];

<FilterPills
  options={statusOptions}
  value={statusFilter}
  onChange={setStatusFilter}
/>
```

## Next Steps

- Task 043 will integrate FilterPills into Devices.tsx to replace the current filter buttons

## Risks

- None identified. Component is isolated and does not affect existing functionality.
