# Task 045: Page Migration (Settings, PlantCare) - Handoff

## Summary

Completed the final page migration by updating Settings, PlantCare pages and all remaining components to use the design system's semantic color tokens and Button component.

## Files Modified

1. **frontend/src/pages/PlantCare.tsx**
   - Added Button import from ui/Button
   - Replaced breadcrumb links: `text-green-600 hover:text-green-700` -> `text-action-primary hover:text-action-primary-hover`
   - Replaced error panel: `bg-red-50 border-red-400 text-red-400/text-red-700` -> `bg-status-error-light border-status-error text-status-error/text-status-error-text`
   - Replaced loading panel: `bg-blue-50 border-blue-400 text-blue-700` -> `bg-status-info-light border-status-info text-status-info-text`
   - Replaced Generate Care Plan button: raw `<button>` with `bg-green-600` -> `<Button variant="primary" size="lg">`

2. **frontend/src/components/LLMSettings.tsx**
   - Added Button import from ui/Button
   - Replaced radio button colors: `text-green-600 focus:ring-green-500` -> `text-action-primary focus:ring-action-primary`
   - Replaced input focus colors: `focus:ring-green-500 focus:border-green-500` -> `focus:ring-action-primary focus:border-action-primary`
   - Replaced "Not configured" text: `text-red-600` -> `text-status-error`
   - Replaced success message panel: `bg-green-50 border-green-200 text-green-600/text-green-700` -> `bg-status-success-light border-status-success text-status-success/text-status-success-text`
   - Replaced error message panel: `bg-red-50 border-red-200 text-red-600/text-red-700` -> `bg-status-error-light border-status-error text-status-error/text-status-error-text`
   - Replaced Test/Save buttons: raw buttons -> `<Button variant="secondary">` and `<Button variant="primary">`

3. **frontend/src/components/CarePlanDisplay.tsx**
   - Added Button import from ui/Button
   - Replaced Regenerate button: raw `<button>` with `bg-green-600` -> `<Button variant="primary" loading={...}>`
   - Replaced alert text color: `text-red-700` -> `text-status-error-text`

4. **frontend/src/components/AssignDeviceModal.tsx**
   - Added Button import from ui/Button
   - Replaced select focus color: `focus:ring-green-500` -> `focus:ring-action-primary`
   - Replaced error message: `bg-red-50 border-red-200 text-red-700` -> `bg-status-error-light border-status-error text-status-error-text`
   - Replaced Cancel/Assign buttons: raw buttons -> `<Button variant="secondary">` and `<Button variant="primary" loading={...}>`

5. **frontend/src/components/RegisterDeviceModal.tsx**
   - Added Button import from ui/Button
   - Replaced input focus color: `focus:ring-green-500 focus:border-green-500` -> `focus:ring-action-primary focus:border-action-primary`
   - Replaced required asterisk color: `text-red-500` -> `text-status-error`
   - Replaced error message: `bg-red-50 border-red-200 text-red-600` -> `bg-status-error-light border-status-error text-status-error-text`
   - Replaced Cancel/Register buttons: raw buttons -> `<Button variant="secondary">` and `<Button variant="primary" loading={...}>`

6. **frontend/src/components/ConfirmDialog.tsx**
   - Added Button import from ui/Button
   - Added new `variant` prop (`'primary' | 'danger'`) with default 'danger'
   - Deprecated `confirmButtonClass` prop (backwards-compatible)
   - Replaced Cancel/Confirm buttons: raw buttons -> `<Button variant="secondary">` and `<Button variant={variant} loading={...}>`

7. **frontend/src/components/Navigation.tsx**
   - Replaced active state colors: `border-green-500 text-green-600` -> `border-action-primary text-action-primary`

8. **frontend/src/components/ErrorMessage.tsx**
   - Replaced container: `bg-red-50 border-red-200` -> `bg-status-error-light border-status-error`
   - Replaced icon color: `text-red-600` -> `text-status-error`
   - Replaced heading/message colors: `text-red-800/text-red-700` -> `text-status-error-text`
   - Replaced retry button colors: `text-red-600 hover:text-red-500` -> `text-status-error hover:text-status-error-text`

9. **frontend/src/components/SensorReading.tsx**
   - Added cn utility import
   - Added `getStatusColor()` function for dynamic status colors based on percentage:
     - 30-70%: `bg-status-success` (optimal)
     - 15-30% or 70-85%: `bg-status-warning` (warning)
     - <15% or >85%: `bg-status-error` (critical)
   - Replaced progress bar: static `bg-green-600` -> dynamic status colors

10. **frontend/src/components/DeviceTable.tsx** (additional fix)
    - Updated ConfirmDialog usage: `confirmButtonClass="bg-red-600..."` -> `variant="danger"`
    - Updated ConfirmDialog usage: `confirmButtonClass="bg-yellow-600..."` -> `variant="primary"` (unassign action)

## Verification

```bash
# All tests pass
make check
# Output: 139 passed

# Zero instances of raw green-600/red-600 colors
grep -r "bg-green-600\|bg-red-600\|text-green-600\|text-red-600" frontend/src/ --include="*.tsx" | wc -l
# Output: 0
```

## Component Changes

### Button Component Usage
All action buttons now use the Button component from `./ui/Button`:
- `variant="primary"`: Primary actions (save, submit, assign)
- `variant="secondary"`: Cancel/back actions
- `variant="danger"`: Destructive actions (delete)
- `loading={boolean}`: Shows spinner and disables button

### ConfirmDialog Component API
Updated to support semantic variants:
```tsx
// New API (preferred)
<ConfirmDialog variant="danger" ... />

// Old API (deprecated but supported)
<ConfirmDialog confirmButtonClass="bg-red-600..." ... />
```

### SensorReading Component
Now uses dynamic status colors based on sensor value percentage:
- Optimal (30-70%): Green
- Warning (15-30%, 70-85%): Yellow
- Critical (<15%, >85%): Red

## Risks / Follow-ups

1. **Minor follow-up**: Other components like ThresholdForm, CreatePlantModal, LoadingSpinner, Header still have `focus:ring-green-500` or `bg-green-500`. These are not `green-600` so technically within DoD, but could be migrated in a future consistency pass.

2. **ConfirmDialog deprecation**: The `confirmButtonClass` prop is deprecated. Consumers should migrate to use `variant` prop.

## How to Verify

1. Navigate to `/settings` - LLM settings form should show proper action and status colors
2. Navigate to `/plants/{id}/care` - Care plan page should show:
   - Green breadcrumb links
   - Status-colored error/success/info messages
   - Button component for Generate Care Plan
3. Navigate to `/devices` - DeviceTable actions should work with proper button variants
4. Check any modal dialogs - Buttons should use semantic colors
