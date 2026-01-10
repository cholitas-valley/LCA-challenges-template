---
task_id: task-045
title: Page Migration (Settings, PlantCare)
role: lca-frontend
follow_roles: []
post: [lca-recorder, code-simplifier, lca-gitops]
depends_on: [task-044]
inputs:
  - runs/plan.md
  - runs/handoffs/task-044.md
  - frontend/src/pages/Settings.tsx
  - frontend/src/pages/PlantCare.tsx
  - frontend/src/components/LLMSettings.tsx
  - frontend/src/components/CarePlanDisplay.tsx
  - frontend/src/components/AssignDeviceModal.tsx
  - frontend/src/components/RegisterDeviceModal.tsx
  - frontend/src/components/ConfirmDialog.tsx
  - frontend/src/components/Navigation.tsx
  - frontend/src/components/ErrorMessage.tsx
  - frontend/src/components/SensorReading.tsx
allowed_paths:
  - frontend/**
check_command: make check
handoff: runs/handoffs/task-045.md
---

# Task 045: Page Migration (Settings, PlantCare)

## Goal

Complete the migration by updating Settings, PlantCare pages and all remaining components to use the design system.

## Context

This is the final page migration task. After this, all components should use semantic colors and the design system components.

## Requirements

### 1. Migrate Settings.tsx

Settings page is mostly a container. Ensure any buttons or status elements use proper components.

### 2. Migrate PlantCare.tsx

**Replace buttons:**
```tsx
// OLD
<button className="mt-6 px-6 py-3 bg-green-600 text-white...">
  Generate Care Plan
</button>

// NEW
<Button variant="primary" size="lg" onClick={handleGenerate}>
  Generate Care Plan
</Button>
```

**Replace error state:**
```tsx
// OLD
<svg className="h-5 w-5 text-red-400" ...>
<p className="text-sm text-red-700">{error}</p>

// NEW: Use semantic status colors
<svg className="h-5 w-5 text-status-error" ...>
<p className="text-sm text-status-error-text">{error}</p>
```

**Replace breadcrumb links:**
```tsx
// OLD
<Link className="text-green-600 hover:text-green-700">Dashboard</Link>

// NEW
<Link className="text-action-primary hover:text-action-primary-hover">Dashboard</Link>
```

### 3. Migrate LLMSettings.tsx

**Replace radio button styling:**
```tsx
// OLD
className="h-4 w-4 text-green-600 focus:ring-green-500"

// NEW
className="h-4 w-4 text-action-primary focus:ring-action-primary"
```

**Replace success/error messages:**
```tsx
// OLD
<span className="text-red-600">Not configured</span>
<p className="text-sm text-green-700">{successMessage}</p>

// NEW
<span className="text-status-error">Not configured</span>
<p className="text-sm text-status-success-text">{successMessage}</p>
```

**Replace save button:**
```tsx
<Button variant="primary" type="submit" loading={isSubmitting}>
  Save Settings
</Button>
```

### 4. Migrate CarePlanDisplay.tsx

**Replace generate button:**
```tsx
<Button variant="primary" onClick={onGenerate} loading={isGenerating}>
  Generate Care Plan
</Button>
```

**Replace alert text:**
```tsx
// OLD
<li className="text-red-700">{alert}</li>

// NEW
<li className="text-status-error-text">{alert}</li>
```

### 5. Migrate AssignDeviceModal.tsx

**Replace buttons:**
```tsx
<Button variant="primary" onClick={handleAssign} loading={isPending}>
  Assign
</Button>
<Button variant="secondary" onClick={onClose}>
  Cancel
</Button>
```

**Replace error message:**
```tsx
// OLD
<div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-red-700">

// NEW
<div className="mb-4 p-3 bg-status-error-light border border-status-error rounded text-status-error-text">
```

### 6. Migrate RegisterDeviceModal.tsx

Same pattern as CreatePlantModal - use Button component and semantic error colors.

### 7. Migrate ConfirmDialog.tsx

Update the confirm button to accept variant prop or use Button component:
```tsx
// The confirmButtonClass prop can be replaced with variant
<Button variant="danger" onClick={onConfirm} loading={isLoading}>
  {confirmText}
</Button>
<Button variant="secondary" onClick={onClose}>
  {cancelText}
</Button>
```

### 8. Migrate Navigation.tsx

**Replace active state color:**
```tsx
// OLD
const activeClasses = 'border-green-500 text-green-600';

// NEW
const activeClasses = 'border-action-primary text-action-primary';
```

### 9. Migrate ErrorMessage.tsx

**Replace error colors:**
```tsx
// OLD
<svg className="w-6 h-6 text-red-600">
<h3 className="text-sm font-medium text-red-800">Error</h3>
<p className="mt-1 text-sm text-red-700">{message}</p>

// NEW
<svg className="w-6 h-6 text-status-error">
<h3 className="text-sm font-medium text-status-error-text">Error</h3>
<p className="mt-1 text-sm text-status-error-text">{message}</p>
```

### 10. Migrate SensorReading.tsx

**Replace progress bar color:**
```tsx
// OLD
<div className="bg-green-600 h-1.5 rounded-full" style={{width: `${percentage}%`}}>

// NEW: Use status colors based on value
<div className={cn(
  "h-1.5 rounded-full",
  isOptimal ? "bg-status-success" : isWarning ? "bg-status-warning" : "bg-status-error"
)} style={{width: `${percentage}%`}}>
```

## Files to Modify

1. `frontend/src/pages/Settings.tsx`
2. `frontend/src/pages/PlantCare.tsx`
3. `frontend/src/components/LLMSettings.tsx`
4. `frontend/src/components/CarePlanDisplay.tsx`
5. `frontend/src/components/AssignDeviceModal.tsx`
6. `frontend/src/components/RegisterDeviceModal.tsx`
7. `frontend/src/components/ConfirmDialog.tsx`
8. `frontend/src/components/Navigation.tsx`
9. `frontend/src/components/ErrorMessage.tsx`
10. `frontend/src/components/SensorReading.tsx`

## Migration Checklist

- [ ] PlantCare.tsx: Buttons, breadcrumbs, error states
- [ ] LLMSettings.tsx: Radio buttons, success/error, save button
- [ ] CarePlanDisplay.tsx: Generate button, alert text
- [ ] AssignDeviceModal.tsx: Buttons, error message
- [ ] RegisterDeviceModal.tsx: Buttons, error message
- [ ] ConfirmDialog.tsx: Action buttons using Button component
- [ ] Navigation.tsx: Active state color
- [ ] ErrorMessage.tsx: Error icon and text colors
- [ ] SensorReading.tsx: Progress bar colors

## Constraints

- Keep functionality identical
- Run `make check` to verify 139 tests still pass
- This is the final migration - ALL raw colors should be replaced

## Definition of Done

1. All 10 files migrated
2. Zero instances of `bg-green-600` or `bg-red-600` in entire frontend/src
3. Zero instances of `text-green-600` or `text-red-600` as action colors
4. All existing tests pass (139)
5. `make check` succeeds

## Verification

```bash
make check
# Final check - no raw green/red in any component
grep -r "bg-green-600\|bg-red-600\|text-green-600\|text-red-600" frontend/src/ --include="*.tsx" | grep -v node_modules | wc -l
# Expected: 0 (or only in test files if any)
```
