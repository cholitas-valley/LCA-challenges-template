# Task 043: Page Migration (Dashboard, Devices) - Handoff

## Summary

Migrated Dashboard.tsx, Devices.tsx, DeviceTable.tsx, and EmptyState.tsx to use the new design system components (Button, StatusBadge, FilterPills, Skeleton). All raw Tailwind color utilities for primary actions (`bg-green-600`) have been replaced with semantic component imports.

## Files Touched

1. **frontend/src/pages/Dashboard.tsx**
   - Replaced raw `<button>` with `<Button variant="primary">` for "Add Plant"
   - Replaced `<LoadingSpinner>` with `<SkeletonCardGrid count={6} />`
   - Removed `LoadingSpinner` import, added `Button`, `SkeletonCardGrid` imports

2. **frontend/src/pages/Devices.tsx**
   - Replaced raw `<button>` with `<Button variant="primary">` for "Register Device"
   - Replaced 4 individual filter buttons with `<FilterPills>` component
   - Replaced `<LoadingSpinner>` with `<SkeletonTable rows={5} columns={6} />`
   - Removed `LoadingSpinner` import, added `Button`, `FilterPills`, `SkeletonTable` imports

3. **frontend/src/components/DeviceTable.tsx**
   - Replaced status dot rendering with `<StatusBadge status={device.status} />`
   - Replaced "Assign/Reassign" link-style button with `<Button variant="ghost" size="sm">`
   - Replaced "Unassign" button with `<Button variant="secondary" size="sm">`
   - Replaced "Delete" button with `<Button variant="danger" size="sm">`
   - Removed `getStatusColor()` and `getStatusLabel()` functions (now handled by StatusBadge)
   - Added `Button`, `StatusBadge`, `StatusType` imports

4. **frontend/src/components/EmptyState.tsx**
   - Replaced raw `<button>` with `<Button variant="primary">`
   - Added `Button` import from `./ui`

## Components Used

| Component | Location | Usage |
|-----------|----------|-------|
| `Button` | Dashboard, Devices, DeviceTable, EmptyState | Primary, ghost, secondary, danger variants |
| `StatusBadge` | DeviceTable | Device status display with semantic colors |
| `FilterPills` | Devices | Status filter (All/Online/Offline/Unassigned) |
| `SkeletonCardGrid` | Dashboard | Loading placeholder for plant cards |
| `SkeletonTable` | Devices | Loading placeholder for device list |

## Verification

```bash
# All tests pass
make check
# 139 passed

# No bg-green-600 in migrated files
grep -c "bg-green-600" frontend/src/pages/Dashboard.tsx frontend/src/pages/Devices.tsx frontend/src/components/DeviceTable.tsx frontend/src/components/EmptyState.tsx
# All 0

# Only ConfirmDialog passthrough has bg-red-600 (acceptable)
grep -c "bg-red-600" frontend/src/components/DeviceTable.tsx
# 1 (in ConfirmDialog confirmButtonClass prop)
```

## Migration Checklist

- [x] Dashboard: "Add Plant" button -> Button primary
- [x] Dashboard: Loading state -> SkeletonCardGrid
- [x] Devices: Filter buttons -> FilterPills
- [x] Devices: "Register Device" button -> Button primary
- [x] Devices: Loading state -> SkeletonTable
- [x] DeviceTable: Status dots -> StatusBadge
- [x] DeviceTable: Assign button -> Button ghost
- [x] DeviceTable: Delete button -> Button danger
- [x] EmptyState: Action button -> Button primary
- [x] Remove all `bg-green-600` from these files
- [x] Remove all `bg-red-600` from these files (except ConfirmDialog passthrough)

## Risks / Follow-ups

1. **ConfirmDialog still uses raw color classes**: The `confirmButtonClass` props on ConfirmDialog pass raw Tailwind colors (`bg-yellow-600`, `bg-red-600`). Consider migrating ConfirmDialog to use the Button component internally in a future task.

2. **Visual regression testing**: The StatusBadge now renders with pill-shaped backgrounds instead of just dots. Recommend visual verification that this new styling is acceptable.

3. **TypeScript casting**: DeviceTable uses `device.status as StatusType` - this is safe because Device['status'] values match StatusType, but could be improved with stricter typing.

## How to Verify

1. Start the dev server: `cd frontend && npm run dev`
2. Visit Dashboard page - verify:
   - "Add Plant" button has green styling
   - Loading shows skeleton card grid
   - Empty state button works
3. Visit Devices page - verify:
   - Filter pills work and show counts
   - "Register Device" button has green styling
   - Device table shows status badges
   - Assign/Delete buttons have correct styling
