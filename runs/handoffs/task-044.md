# Task 044 Handoff: Page Migration (Plants, PlantDetail)

## Summary

Successfully migrated 6 components (Plants.tsx, PlantDetail.tsx, PlantCard.tsx, CreatePlantModal.tsx, ThresholdForm.tsx, PlantDeviceList.tsx) to use the design system components (Button, StatusBadge) and semantic color tokens.

## Files Modified

1. `/home/genge/dev-ash/foundry-nodevenv/cholitas/challenge-001-plantops/frontend/src/pages/Plants.tsx`
   - Replaced "Add Plant" button with `<Button variant="primary">`
   - Replaced plant name links with semantic `text-action-primary` color
   - Replaced View/Delete actions with styled Link and `<Button variant="danger">`

2. `/home/genge/dev-ash/foundry-nodevenv/cholitas/challenge-001-plantops/frontend/src/pages/PlantDetail.tsx`
   - Added `mapHealthStatus()` helper function for StatusBadge mapping
   - Replaced breadcrumb links with semantic action colors
   - Replaced inline name edit buttons with `<Button>` components
   - Replaced "View Care Plan" link with semantic primary styling
   - Replaced "Delete Plant" button with `<Button variant="danger" loading={...}>`
   - Replaced health status badge with `<StatusBadge>` component

3. `/home/genge/dev-ash/foundry-nodevenv/cholitas/challenge-001-plantops/frontend/src/components/PlantCard.tsx`
   - Updated `getStatusColor()` to use semantic tokens (`text-status-success-text`, `text-status-warning-text`, `text-status-error-text`)
   - Replaced "View" link with semantic action primary color

4. `/home/genge/dev-ash/foundry-nodevenv/cholitas/challenge-001-plantops/frontend/src/components/CreatePlantModal.tsx`
   - Replaced required field asterisk with `text-status-error`
   - Replaced error message box with semantic status error colors
   - Replaced submit/cancel buttons with `<Button variant="primary">` and `<Button variant="secondary">`

5. `/home/genge/dev-ash/foundry-nodevenv/cholitas/challenge-001-plantops/frontend/src/components/ThresholdForm.tsx`
   - Replaced save button with `<Button variant="primary" loading={...}>`

6. `/home/genge/dev-ash/foundry-nodevenv/cholitas/challenge-001-plantops/frontend/src/components/PlantDeviceList.tsx`
   - Removed inline `getStatusColor()` and `getStatusLabel()` functions
   - Replaced status indicator with `<StatusBadge>` component
   - Replaced "Unassign" button with `<Button variant="danger" size="sm">`

## Component Imports Added

- `Button` from `../components/ui` (or `./ui`)
- `StatusBadge` from `../components/ui` (or `./ui`)
- `StatusType` type from `../components/ui` (or `./ui`)

## Verification

```bash
make check
# All 139 tests passed
# Frontend build succeeded

# Verify no raw color utilities remain:
grep -c "bg-green-600\|bg-red-600" frontend/src/pages/Plants.tsx ...
# All return 0

grep -c "text-green-600" frontend/src/pages/Plants.tsx ...
# All return 0
```

## Migration Checklist Completed

- [x] Plants.tsx: Add Plant button -> Button primary
- [x] Plants.tsx: View/Delete actions -> Button ghost/danger (styled Link + Button)
- [x] PlantDetail.tsx: All buttons -> Button variants
- [x] PlantDetail.tsx: Health indicators -> StatusBadge
- [x] PlantCard.tsx: Status colors -> semantic tokens
- [x] PlantCard.tsx: View link -> semantic action color
- [x] CreatePlantModal.tsx: Submit/Cancel buttons -> Button
- [x] CreatePlantModal.tsx: Error text -> semantic status colors
- [x] ThresholdForm.tsx: Save button -> Button primary
- [x] PlantDeviceList.tsx: Unassign button -> Button danger
- [x] PlantDeviceList.tsx: Status indicators -> StatusBadge

## Patterns Used

### Button Component
- `variant="primary"` for main CTAs (Add Plant, Save, Create)
- `variant="secondary"` for cancel actions
- `variant="danger"` for destructive actions (Delete, Unassign)
- `loading` prop for async operation states
- `size="sm"` for table action buttons

### StatusBadge Component
- Used for health status in PlantDetail (`mapHealthStatus()` helper)
- Used for device status in PlantDeviceList
- Maps health strings (optimal, warning, critical) to StatusType (online, warning, error)

### Semantic Color Tokens
- `text-action-primary` / `text-action-primary-hover` for links
- `text-status-success-text`, `text-status-warning-text`, `text-status-error-text` for status colors
- `bg-action-primary`, `text-action-primary-text` for button-like links

## Next Steps

- No remaining files in the Plants section require migration
- All design system components are now consistently used
- Consider extracting common Link styling into a reusable component if more pages need migration

## Risks

- None identified. All existing functionality preserved.
