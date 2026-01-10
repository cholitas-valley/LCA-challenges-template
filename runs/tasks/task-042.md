---
task_id: task-042
title: Loading States (Skeletons)
role: lca-frontend
follow_roles: []
post: [lca-recorder, code-simplifier, lca-gitops]
depends_on: [task-038]
inputs:
  - runs/plan.md
  - runs/handoffs/task-038.md
  - frontend/src/components/LoadingSpinner.tsx
  - .claude/skills/ux-design/skill.yaml
allowed_paths:
  - frontend/**
check_command: cd frontend && npm run build && npm run lint
handoff: runs/handoffs/task-042.md
---

# Task 042: Loading States (Skeletons)

## Goal

Create skeleton loading components to replace the generic spinner during data fetches. Skeletons show content structure while loading, reducing perceived wait time.

## Context

Currently, `LoadingSpinner.tsx` shows a generic spinner for all loading states. Skeleton screens provide better UX by:
1. Showing where content will appear
2. Reducing layout shift when content loads
3. Feeling faster than spinners

## Requirements

### 1. Create Skeleton Base Component

Create `frontend/src/components/ui/Skeleton.tsx`:

```typescript
import { cn } from '../../lib/cn';

export interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className }: SkeletonProps) {
  return (
    <div
      className={cn(
        'animate-pulse rounded-md bg-gray-200',
        className
      )}
    />
  );
}

// Pre-built skeleton patterns for common use cases

export function SkeletonCard({ className }: SkeletonProps) {
  return (
    <div className={cn('bg-white rounded-lg shadow p-6', className)}>
      <div className="flex items-start gap-4">
        <Skeleton className="h-12 w-12 rounded-full" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-5 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
        </div>
      </div>
      <div className="mt-4 space-y-3">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
        <Skeleton className="h-4 w-4/6" />
      </div>
      <div className="mt-4 flex gap-2">
        <Skeleton className="h-8 w-20" />
        <Skeleton className="h-8 w-20" />
      </div>
    </div>
  );
}

export function SkeletonTableRow({ columns = 5 }: { columns?: number }) {
  return (
    <tr className="border-b border-gray-200">
      {Array.from({ length: columns }).map((_, i) => (
        <td key={i} className="px-6 py-4">
          <Skeleton className="h-4 w-full" />
        </td>
      ))}
    </tr>
  );
}

export function SkeletonTable({ rows = 5, columns = 5 }: { rows?: number; columns?: number }) {
  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <table className="min-w-full">
        <thead className="bg-gray-50 border-b border-gray-200">
          <tr>
            {Array.from({ length: columns }).map((_, i) => (
              <th key={i} className="px-6 py-3 text-left">
                <Skeleton className="h-4 w-20" />
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: rows }).map((_, i) => (
            <SkeletonTableRow key={i} columns={columns} />
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function SkeletonCardGrid({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  );
}
```

### 2. Update ui/index.ts

Add exports to `frontend/src/components/ui/index.ts`:
```typescript
export { 
  Skeleton, 
  SkeletonCard, 
  SkeletonTableRow, 
  SkeletonTable, 
  SkeletonCardGrid 
} from './Skeleton';
export type { SkeletonProps } from './Skeleton';
```

## Skeleton Components

| Component | Use Case |
|-----------|----------|
| `Skeleton` | Base building block for custom patterns |
| `SkeletonCard` | Plant cards, device cards |
| `SkeletonTable` | Device table, any table |
| `SkeletonTableRow` | Individual table row |
| `SkeletonCardGrid` | Dashboard plant grid |

## Animation

Uses Tailwind's `animate-pulse` for the shimmer effect:
- 2s duration
- ease-in-out timing
- Infinite loop

## Constraints

- Do NOT update pages to use skeletons yet (that's task-043+)
- Keep existing LoadingSpinner for backwards compatibility
- Skeletons should roughly match the size/shape of real content
- Use neutral gray colors only

## Definition of Done

1. `frontend/src/components/ui/Skeleton.tsx` created
2. Base Skeleton and pre-built patterns exported
3. Animate-pulse animation working
4. SkeletonCard matches PlantCard structure roughly
5. SkeletonTable matches DeviceTable structure roughly
6. Exported from `ui/index.ts`
7. `npm run build` succeeds
8. `npm run lint` passes

## Verification

```bash
cd frontend && npm run build && npm run lint
```
