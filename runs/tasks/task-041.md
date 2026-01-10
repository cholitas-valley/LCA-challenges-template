---
task_id: task-041
title: FilterPills Component
role: lca-frontend
follow_roles: []
post: [lca-recorder, code-simplifier, lca-gitops]
depends_on: [task-038]
inputs:
  - runs/plan.md
  - runs/handoffs/task-038.md
  - frontend/src/pages/Devices.tsx
  - .claude/skills/ui-design/skill.yaml
allowed_paths:
  - frontend/**
check_command: cd frontend && npm run build && npm run lint
handoff: runs/handoffs/task-041.md
---

# Task 041: FilterPills Component

## Goal

Create a FilterPills component for filter toggle patterns that is visually distinct from action buttons. Filters are selection states, not actions.

## Context

The Devices page uses buttons styled identically to primary action buttons for its filter toggles (All, Online, Offline, Unassigned). This creates confusion between "selecting a filter" and "performing an action." FilterPills provides a distinct toggle pattern.

Current problematic code in `Devices.tsx`:
```tsx
<button
  onClick={() => setStatusFilter('all')}
  className={'px-4 py-2 rounded-md font-medium transition-colors ' + 
    (statusFilter === 'all' ? 'bg-green-600 text-white' : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50')}
>
  All ({data.devices.length})
</button>
```

## Requirements

### 1. Create FilterPills Component

Create `frontend/src/components/ui/FilterPills.tsx`:

```typescript
import { cn } from '../../lib/cn';

export interface FilterOption<T extends string = string> {
  value: T;
  label: string;
  count?: number;
}

export interface FilterPillsProps<T extends string = string> {
  options: FilterOption<T>[];
  value: T;
  onChange: (value: T) => void;
  className?: string;
}

export function FilterPills<T extends string = string>({
  options,
  value,
  onChange,
  className,
}: FilterPillsProps<T>) {
  return (
    <div
      role="group"
      aria-label="Filter options"
      className={cn('inline-flex gap-2 flex-wrap', className)}
    >
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          role="radio"
          aria-checked={value === option.value}
          onClick={() => onChange(option.value)}
          className={cn(
            'px-3 py-1.5 rounded-full text-sm font-medium transition-colors',
            'focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-gray-400',
            value === option.value
              ? 'bg-gray-900 text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          )}
        >
          {option.label}
          {option.count !== undefined && (
            <span
              className={cn(
                'ml-1.5',
                value === option.value ? 'text-gray-300' : 'text-gray-400'
              )}
            >
              ({option.count})
            </span>
          )}
        </button>
      ))}
    </div>
  );
}
```

### 2. Update ui/index.ts

Add export to `frontend/src/components/ui/index.ts`:
```typescript
export { FilterPills } from './FilterPills';
export type { FilterPillsProps, FilterOption } from './FilterPills';
```

## FilterPills vs Button Design

| Aspect | FilterPills | Button (primary) |
|--------|-------------|------------------|
| Shape | Pill (rounded-full) | Rounded-md |
| Active state | Dark gray fill | Brand green fill |
| Inactive state | Light gray | N/A |
| Purpose | Toggle/select | Trigger action |
| Group behavior | Radio group | Standalone |

## Accessibility

- Uses `role="group"` for the container with `aria-label`
- Each pill has `role="radio"` and `aria-checked`
- This communicates toggle/selection behavior to screen readers
- Focus states visible with ring

## Usage Example

```tsx
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

## Constraints

- Do NOT update Devices.tsx to use this component yet (that's task-043)
- FilterPills uses neutral colors (gray), NOT action colors
- Visually distinct from Button component
- Support optional count display
- Type-safe with generic T extends string

## Definition of Done

1. `frontend/src/components/ui/FilterPills.tsx` created
2. Component exported from `ui/index.ts`
3. Supports typed options with value, label, and optional count
4. Active state visually distinct from Button primary
5. Proper ARIA attributes for accessibility
6. Generic type support for type-safe usage
7. `npm run build` succeeds
8. `npm run lint` passes

## Verification

```bash
cd frontend && npm run build && npm run lint
```
