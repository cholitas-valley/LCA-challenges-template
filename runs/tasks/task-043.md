---
task_id: task-043
title: Page Migration (Dashboard, Devices)
role: lca-frontend
follow_roles: []
post: [lca-recorder, code-simplifier, lca-gitops]
depends_on: [task-039, task-040, task-041, task-042]
inputs:
  - runs/plan.md
  - runs/handoffs/task-039.md
  - runs/handoffs/task-040.md
  - runs/handoffs/task-041.md
  - runs/handoffs/task-042.md
  - frontend/src/pages/Dashboard.tsx
  - frontend/src/pages/Devices.tsx
  - frontend/src/components/DeviceTable.tsx
  - frontend/src/components/EmptyState.tsx
allowed_paths:
  - frontend/**
check_command: make check
handoff: runs/handoffs/task-043.md
---

# Task 043: Page Migration (Dashboard, Devices)

## Goal

Migrate Dashboard.tsx, Devices.tsx, and their associated components to use the new design system components (Button, StatusBadge, FilterPills, Skeleton).

## Context

The foundation components are ready:
- Button (task-039)
- StatusBadge (task-040)
- FilterPills (task-041)
- Skeleton (task-042)

Now we replace raw Tailwind utilities with these semantic components, starting with the Dashboard and Devices pages.

## Requirements

### 1. Migrate Dashboard.tsx

**Replace:**
```tsx
// OLD: Raw button styling
<button
  onClick={() => setIsModalOpen(true)}
  className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
>
  <span className="mr-2">+</span>
  Add Plant
</button>
```

**With:**
```tsx
// NEW: Semantic Button component
import { Button } from '../components/ui';

<Button variant="primary" onClick={() => setIsModalOpen(true)}>
  <span className="mr-2">+</span>
  Add Plant
</Button>
```

**Replace LoadingSpinner with SkeletonCardGrid:**
```tsx
// OLD
{isLoading && (
  <div className="bg-white rounded-lg shadow p-8">
    <LoadingSpinner />
  </div>
)}

// NEW
{isLoading && <SkeletonCardGrid count={6} />}
```

### 2. Migrate Devices.tsx

**Replace filter buttons with FilterPills:**
```tsx
// OLD: 4 separate buttons with raw styling
<button
  onClick={() => setStatusFilter('all')}
  className={'px-4 py-2 rounded-md font-medium transition-colors ' + 
    (statusFilter === 'all' ? 'bg-green-600 text-white' : '...')}
>
  All ({data.devices.length})
</button>
// ... repeated for online, offline, unassigned

// NEW: FilterPills component
import { FilterPills, FilterOption } from '../components/ui';

const statusOptions: FilterOption<StatusFilter>[] = [
  { value: 'all', label: 'All', count: data.devices.length },
  { value: 'online', label: 'Online', count: data.devices.filter(d => d.status === 'online').length },
  { value: 'offline', label: 'Offline', count: data.devices.filter(d => d.status === 'offline').length },
  { value: 'unassigned', label: 'Unassigned', count: data.devices.filter(d => d.plant_id === null).length },
];

<FilterPills
  options={statusOptions}
  value={statusFilter}
  onChange={setStatusFilter}
/>
```

**Replace "Register Device" button:**
```tsx
<Button variant="primary" onClick={() => setIsModalOpen(true)}>
  <span className="mr-2">+</span>
  Register Device
</Button>
```

**Replace LoadingSpinner with SkeletonTable:**
```tsx
{isLoading && <SkeletonTable rows={5} columns={6} />}
```

### 3. Migrate DeviceTable.tsx

**Replace status dot styling with StatusBadge:**
```tsx
// OLD: Raw styling for status
<td className="px-6 py-4 whitespace-nowrap">
  <div className="flex items-center gap-2">
    <div className={'w-3 h-3 rounded-full ' + getStatusColor(device.status)} />
    <span className="text-sm text-gray-900">{getStatusLabel(device.status)}</span>
  </div>
</td>

// NEW: StatusBadge component
import { StatusBadge } from './ui';

<td className="px-6 py-4 whitespace-nowrap">
  <StatusBadge status={device.status as StatusType} />
</td>
```

**Replace action buttons:**
```tsx
// OLD: Raw text buttons
<button
  onClick={() => setAssignDevice(device)}
  className="text-sm text-green-600 hover:text-green-800 font-medium"
>
  Assign
</button>
<button
  onClick={() => setDeleteDevice(device)}
  className="text-sm text-red-600 hover:text-red-800 font-medium disabled:opacity-50"
>
  Delete
</button>

// NEW: Ghost and Danger buttons
<Button variant="ghost" size="sm" onClick={() => setAssignDevice(device)}>
  {device.plant_id ? 'Reassign' : 'Assign'}
</Button>
<Button variant="danger" size="sm" onClick={() => setDeleteDevice(device)} disabled={isDeleting}>
  Delete
</Button>
```

### 4. Migrate EmptyState.tsx

Replace the action button styling with Button component.

## Files to Modify

1. `frontend/src/pages/Dashboard.tsx`
2. `frontend/src/pages/Devices.tsx`
3. `frontend/src/components/DeviceTable.tsx`
4. `frontend/src/components/EmptyState.tsx`

## Migration Checklist

- [ ] Dashboard: "Add Plant" button -> Button primary
- [ ] Dashboard: Loading state -> SkeletonCardGrid
- [ ] Devices: Filter buttons -> FilterPills
- [ ] Devices: "Register Device" button -> Button primary
- [ ] Devices: Loading state -> SkeletonTable
- [ ] DeviceTable: Status dots -> StatusBadge
- [ ] DeviceTable: Assign button -> Button ghost
- [ ] DeviceTable: Delete button -> Button danger
- [ ] EmptyState: Action button -> Button primary
- [ ] Remove all `bg-green-600` from these files
- [ ] Remove all `bg-red-600` from these files

## Constraints

- Keep functionality identical (no behavior changes)
- Run `make check` to verify 139 tests still pass
- No raw color utilities in migrated files
- Maintain accessibility (focus states, ARIA)

## Definition of Done

1. Dashboard.tsx uses Button and SkeletonCardGrid
2. Devices.tsx uses Button, FilterPills, and SkeletonTable
3. DeviceTable.tsx uses Button and StatusBadge
4. EmptyState.tsx uses Button
5. Zero instances of `bg-green-600` in these 4 files
6. Zero instances of `bg-red-600` in these 4 files (except ConfirmDialog passthrough)
7. All existing tests pass (139)
8. `make check` succeeds

## Verification

```bash
make check
grep -c "bg-green-600" frontend/src/pages/Dashboard.tsx frontend/src/pages/Devices.tsx frontend/src/components/DeviceTable.tsx frontend/src/components/EmptyState.tsx
# Expected: All 0
```
