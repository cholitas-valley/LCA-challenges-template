# Recorder: task-024

## Changes Summary

Implemented per-plant care pages with AI-generated care recommendations display, regenerate functionality, and LLM configuration warnings.

## Key Files

- `frontend/src/types/care.ts`: CarePlan, CarePlanWatering, CarePlanMetric, CarePlanResponse
- `frontend/src/hooks/useCarePlan.ts`: useCarePlan, useGenerateCarePlan hooks
- `frontend/src/components/CarePlanDisplay.tsx`: Full care plan display with all sections
- `frontend/src/pages/PlantCare.tsx`: /plants/:id/care route page
- `frontend/src/api/client.ts`: Added getCarePlan, analyze methods
- `frontend/src/App.tsx`: Added care route
- `frontend/src/pages/PlantDetail.tsx`: Added "View Care Plan" button

## Interfaces for Next Task

### Care Plan Hooks
```typescript
import { useCarePlan, useGenerateCarePlan } from '../hooks';
const { data: carePlan, isLoading } = useCarePlan(plantId);
const generate = useGenerateCarePlan();
generate.mutate(plantId);
```

### Care Plan API
```typescript
plantApi.getCarePlan(id)   // GET /api/plants/{id}/care-plan
plantApi.analyze(id)       // POST /api/plants/{id}/analyze
```

### Routes
- `/plants/:id/care` - Plant care page

## Notes

- LLM not configured shows warning with link to /settings
- Loading state shows progress message (up to 30 seconds)
- Time ago formatting for generated_at timestamps
- Regenerate clears existing plan and creates new one
