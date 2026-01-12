---
task_id: task-024
title: Per-plant care pages
role: lca-frontend
follow_roles: []
post:
  - lca-recorder
  - lca-gitops
depends_on:
  - task-022
  - task-023
inputs:
  - objective.md
  - runs/plan.md
  - runs/handoffs/task-022.md
  - runs/handoffs/task-023.md
allowed_paths:
  - frontend/**
check_command: cd frontend && npm run build
handoff: runs/handoffs/task-024.md
---

# Task 024: Per-Plant Care Pages

## Goal

Implement the plant care page that displays AI-generated care recommendations for each plant.

## Requirements

### Plant Care Page (frontend/src/pages/PlantCare.tsx)

Route: `/plants/{id}/care`

Sections:
1. Plant header (name, species, status)
2. Care plan summary
3. Detailed recommendations
4. Regenerate button

### Care Plan Display Component (frontend/src/components/CarePlanDisplay.tsx)

Display care plan with sections:

```
┌─────────────────────────────────────────────────────────────┐
│  Care Plan for Monstera Deliciosa                           │
│  Generated: 2 hours ago                    [Regenerate]     │
├─────────────────────────────────────────────────────────────┤
│  Summary                                                    │
│  ────────                                                   │
│  Your Monstera is slightly underwatered and could use       │
│  more humidity. Light levels are good.                      │
├─────────────────────────────────────────────────────────────┤
│  💧 Watering                                                │
│  ────────────                                               │
│  Frequency: Every 5-7 days                                  │
│  Amount: Water until it drains from bottom                  │
│  Next watering: January 12, 2026                            │
├─────────────────────────────────────────────────────────────┤
│  ☀️ Light                                                   │
│  ────────                                                   │
│  Current: 800 lux (Good)                                    │
│  Ideal: Bright indirect light (500-1500 lux)                │
│  Tip: Current position is working well                      │
├─────────────────────────────────────────────────────────────┤
│  💨 Humidity                                                │
│  ────────────                                               │
│  Current: 45%                                               │
│  Ideal: 60-80%                                              │
│  Tip: Consider using a humidifier or pebble tray            │
├─────────────────────────────────────────────────────────────┤
│  ⚠️ Current Alerts                                          │
│  ────────────────                                           │
│  • Soil moisture critically low                             │
│  • Humidity below optimal range                             │
├─────────────────────────────────────────────────────────────┤
│  💡 Care Tips                                               │
│  ──────────                                                 │
│  • Monsteras prefer to dry out slightly between waterings   │
│  • Wipe leaves monthly to remove dust                       │
│  • Rotate plant quarterly for even growth                   │
└─────────────────────────────────────────────────────────────┘
```

### States

**No Care Plan:**
- Display message explaining AI analysis
- Show "Generate Care Plan" button
- Indicate LLM must be configured

**LLM Not Configured:**
- Show message directing to Settings
- Link to /settings

**Loading:**
- Spinner while generating
- Estimated time message

**Error:**
- Display error message
- Retry button

### API Hooks (frontend/src/hooks/useCarePlan.ts)

```typescript
export function useCarePlan(plantId: string) {
  return useQuery({
    queryKey: ['plants', plantId, 'care-plan'],
    queryFn: () => plantApi.getCarePlan(plantId),
  });
}

export function useGenerateCarePlan() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (plantId: string) => plantApi.analyze(plantId),
    onSuccess: (_, plantId) => {
      queryClient.invalidateQueries({ queryKey: ['plants', plantId, 'care-plan'] });
    },
  });
}
```

### Navigation

- Add "Care" tab/link to plant detail page
- Breadcrumb: Dashboard > Plants > {Name} > Care
- Back to plant detail

### Types (frontend/src/types/care.ts)

```typescript
export interface CarePlanWatering {
  frequency: string;
  amount: string;
  next_date: string | null;
}

export interface CarePlanMetric {
  current: string | number;
  ideal: string;
  recommendation: string;
}

export interface CarePlan {
  summary: string;
  watering: CarePlanWatering;
  light: CarePlanMetric;
  humidity: CarePlanMetric;
  temperature?: CarePlanMetric;
  alerts: string[];
  tips: string[];
  generated_at: string;
}
```

## Definition of Done

- [ ] Care page accessible at /plants/{id}/care
- [ ] Displays care plan with all sections
- [ ] Regenerate button calls API
- [ ] Loading state during generation
- [ ] Error handling for LLM issues
- [ ] Shows message when LLM not configured
- [ ] Navigation from plant detail
- [ ] Build passes

## Constraints

- Handle long generation times (show progress)
- Graceful degradation when no plan exists
- Link to settings when LLM not configured
- Keep design consistent with rest of app
