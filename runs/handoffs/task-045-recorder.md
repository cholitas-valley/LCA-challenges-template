# Task 045 Recorder: Page Migration (Settings, PlantCare)

## Summary

Final migration complete. 10 files migrated. Zero raw color utilities remain in frontend/src.

## Files Modified

| File | Changes |
|------|---------|
| `PlantCare.tsx` | Button, semantic status colors |
| `LLMSettings.tsx` | Radio buttons, success/error panels |
| `CarePlanDisplay.tsx` | Button with loading state |
| `ConfirmDialog.tsx` | New `variant` prop |
| `Navigation.tsx` | action-primary active state |
| `ErrorMessage.tsx` | Semantic error colors |
| `SensorReading.tsx` | Dynamic status colors |
| `AssignDeviceModal.tsx` | Semantic focus ring, Button |
| `RegisterDeviceModal.tsx` | Semantic focus ring, Button |
| `DeviceTable.tsx` | ConfirmDialog variant usage |

## API Changes

### ConfirmDialog
New `variant` prop: `'primary' | 'danger'` (default: `'danger'`)
- Replaces deprecated `confirmButtonClass`

### SensorReading
Dynamic status colors based on percentage:
- 30-70%: `bg-status-success` (optimal)
- 15-30% / 70-85%: `bg-status-warning`
- <15% / >85%: `bg-status-error` (critical)

## Verification

Zero raw colors in frontend/src:
- No `bg-green-600`, `bg-red-600`
- No `text-green-600`, `text-red-600`

All 139 tests pass.

## Context for Task 046

All migrations complete. Next task is accessibility audit.
