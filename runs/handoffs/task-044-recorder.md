# Task 044 Recorder: Page Migration (Plants, PlantDetail)

## Summary

Migrated 6 files in the Plants section to use design system components.

## Files Modified

| File | Changes |
|------|---------|
| `Plants.tsx` | Button primary, semantic link colors |
| `PlantDetail.tsx` | Button, StatusBadge with mapHealthStatus() |
| `PlantCard.tsx` | Semantic status tokens |
| `CreatePlantModal.tsx` | Button, semantic error colors |
| `ThresholdForm.tsx` | Button primary with loading |
| `PlantDeviceList.tsx` | Button danger, StatusBadge |

## Components Used

- `<Button variant="primary|secondary|danger" loading={...}>`
- `<StatusBadge status={mapHealthStatus(health)}/>`
- Semantic tokens: `text-action-primary`, `text-status-*-text`

## New Helper Function

```typescript
function mapHealthStatus(health: string): StatusType {
  switch (health) {
    case 'optimal': return 'online';
    case 'warning': return 'warning';
    case 'critical': return 'error';
    default: return 'info';
  }
}
```

## Context for Task 045

Apply same pattern to Settings.tsx, PlantCare.tsx, and remaining components.
