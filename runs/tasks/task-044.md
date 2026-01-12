---
task_id: task-044
title: Page Migration (Plants, PlantDetail)
role: lca-frontend
follow_roles: []
post: [lca-recorder, code-simplifier, lca-gitops]
depends_on: [task-043]
inputs:
  - runs/plan.md
  - runs/handoffs/task-043.md
  - frontend/src/pages/Plants.tsx
  - frontend/src/pages/PlantDetail.tsx
  - frontend/src/components/PlantCard.tsx
  - frontend/src/components/CreatePlantModal.tsx
  - frontend/src/components/ThresholdForm.tsx
  - frontend/src/components/PlantDeviceList.tsx
allowed_paths:
  - frontend/**
check_command: make check
handoff: runs/handoffs/task-044.md
---

# Task 044: Page Migration (Plants, PlantDetail)

## Goal

Migrate Plants.tsx, PlantDetail.tsx, and their associated components to use the new design system components (Button, StatusBadge).

## Context

Dashboard and Devices pages have been migrated (task-043). Now we continue with the Plants section, which includes the plant list, plant detail view, and plant management components.

## Requirements

### 1. Migrate Plants.tsx

**Replace "Add Plant" button:**
```tsx
// OLD
<button
  className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700..."
>
  Add Plant
</button>

// NEW
<Button variant="primary" onClick={() => setIsModalOpen(true)}>
  <span className="mr-2">+</span>
  Add Plant
</Button>
```

**Replace action links:**
```tsx
// OLD
<Link className="text-green-600 hover:text-green-800 font-medium">View</Link>
<button className="text-red-600 hover:text-red-800">Delete</button>

// NEW
<Button variant="ghost" size="sm" asChild>
  <Link to={`/plants/${plant.id}`}>View</Link>
</Button>
<Button variant="danger" size="sm" onClick={() => handleDelete(plant.id)}>
  Delete
</Button>
```

### 2. Migrate PlantDetail.tsx

**Replace buttons:**
- "Edit Thresholds" -> Button primary
- "Add Care Plan" -> Button primary
- "Delete Plant" -> Button danger
- Navigation breadcrumb links -> keep as links but use semantic text colors

**Replace health status indicators:**
```tsx
// OLD
<span className={healthCheck.status === 'optimal' ? 'bg-green-100 text-green-800' : ...}>
  {healthCheck.status}
</span>

// NEW
<StatusBadge status={mapHealthStatus(healthCheck.status)} label={healthCheck.status} />

// Helper function
function mapHealthStatus(health: string): StatusType {
  switch (health) {
    case 'optimal': return 'online';
    case 'warning': return 'warning';
    case 'critical': return 'error';
    default: return 'info';
  }
}
```

### 3. Migrate PlantCard.tsx

**Replace sensor status colors:**
```tsx
// OLD
function getStatusColor(value, metric) {
  return isOptimal ? 'text-green-600' : isCritical ? 'text-red-600' : 'text-yellow-600';
}

// NEW
function getStatusColor(value, metric) {
  return isOptimal ? 'text-status-success-text' : isCritical ? 'text-status-error-text' : 'text-status-warning-text';
}
```

**Replace "View Care Plan" link:**
```tsx
// OLD
<Link className="text-sm font-medium text-green-600 hover:text-green-700">
  View Care Plan
</Link>

// NEW: Use semantic action color
<Link className="text-sm font-medium text-action-primary hover:text-action-primary-hover">
  View Care Plan
</Link>
```

### 4. Migrate CreatePlantModal.tsx

**Replace buttons:**
```tsx
// OLD
<button className="... bg-green-600 ...">Create Plant</button>
<button className="... border-gray-300 ...">Cancel</button>

// NEW
<Button variant="primary" type="submit" loading={isPending}>
  Create Plant
</Button>
<Button variant="secondary" onClick={onClose}>
  Cancel
</Button>
```

**Replace error text:**
```tsx
// OLD
<span className="text-red-500">*</span>
<p className="text-sm text-red-600">{error}</p>

// NEW: Use semantic status colors
<span className="text-status-error">*</span>
<p className="text-sm text-status-error-text">{error}</p>
```

### 5. Migrate ThresholdForm.tsx

**Replace save button:**
```tsx
<Button variant="primary" type="submit" disabled={!isDirty || isSubmitting}>
  {isSubmitting ? 'Saving...' : 'Save Thresholds'}
</Button>
```

### 6. Migrate PlantDeviceList.tsx

**Replace action buttons:**
```tsx
// OLD
<button className="text-red-600 hover:text-red-900">Unassign</button>

// NEW
<Button variant="danger" size="sm" onClick={() => onUnassign(device.id)}>
  Unassign
</Button>
```

## Files to Modify

1. `frontend/src/pages/Plants.tsx`
2. `frontend/src/pages/PlantDetail.tsx`
3. `frontend/src/components/PlantCard.tsx`
4. `frontend/src/components/CreatePlantModal.tsx`
5. `frontend/src/components/ThresholdForm.tsx`
6. `frontend/src/components/PlantDeviceList.tsx`

## Migration Checklist

- [ ] Plants.tsx: Add Plant button -> Button primary
- [ ] Plants.tsx: View/Delete actions -> Button ghost/danger
- [ ] PlantDetail.tsx: All buttons -> Button variants
- [ ] PlantDetail.tsx: Health indicators -> StatusBadge
- [ ] PlantCard.tsx: Status colors -> semantic tokens
- [ ] PlantCard.tsx: View Care Plan link -> semantic action color
- [ ] CreatePlantModal.tsx: Submit/Cancel buttons -> Button
- [ ] CreatePlantModal.tsx: Error text -> semantic status colors
- [ ] ThresholdForm.tsx: Save button -> Button primary
- [ ] PlantDeviceList.tsx: Unassign button -> Button danger

## Constraints

- Keep functionality identical
- Run `make check` to verify 139 tests still pass
- No raw color utilities in migrated files
- Maintain all existing Link navigation

## Definition of Done

1. All 6 files migrated to use design system components
2. Zero instances of `bg-green-600` in these files
3. Zero instances of `text-green-600` action links (use semantic)
4. Health status uses StatusBadge
5. All existing tests pass (139)
6. `make check` succeeds

## Verification

```bash
make check
grep -c "bg-green-600\|bg-red-600" frontend/src/pages/Plants.tsx frontend/src/pages/PlantDetail.tsx frontend/src/components/PlantCard.tsx frontend/src/components/CreatePlantModal.tsx frontend/src/components/ThresholdForm.tsx frontend/src/components/PlantDeviceList.tsx
# Expected: All 0
```
