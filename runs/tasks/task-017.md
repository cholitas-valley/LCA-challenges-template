---
task_id: task-017
title: Dashboard plant cards
role: lca-frontend
follow_roles: []
post:
  - lca-recorder
  - lca-gitops
depends_on:
  - task-016
  - task-007
inputs:
  - objective.md
  - runs/plan.md
  - runs/handoffs/task-016.md
allowed_paths:
  - frontend/**
check_command: cd frontend && npm run build
handoff: runs/handoffs/task-017.md
---

# Task 017: Dashboard Plant Cards

## Goal

Implement the main dashboard with plant cards showing live status, current readings, and alert indicators.

## Requirements

### Dashboard Page (frontend/src/pages/Dashboard.tsx)

- Fetch plants using usePlants() hook
- Display grid of plant cards
- Show loading state while fetching
- Show empty state when no plants
- Auto-refresh every 10 seconds

### PlantCard Component (frontend/src/components/PlantCard.tsx)

```typescript
interface PlantCardProps {
  plant: Plant;
}

export function PlantCard({ plant }: PlantCardProps) {
  // Display:
  // - Plant name and species
  // - Status indicator (healthy/warning/critical)
  // - Latest sensor readings
  // - Device count
  // - Link to plant detail
}
```

Card layout:
```
┌─────────────────────────┐
│ 🌿 Monstera Deliciosa   │
│ Status: ● Healthy       │
├─────────────────────────┤
│ Moisture: 45%  ████░░   │
│ Temp: 22.5°C            │
│ Humidity: 65%           │
│ Light: 800 lux          │
├─────────────────────────┤
│ 2 devices attached      │
│            [View →]     │
└─────────────────────────┘
```

### Status Calculation

Determine plant status from latest telemetry + thresholds:
- **Healthy** (green): All values within thresholds
- **Warning** (yellow): Any value approaching threshold (within 10%)
- **Critical** (red): Any value outside threshold

### Sensor Display Component (frontend/src/components/SensorReading.tsx)

Reusable component for displaying a sensor value:
```typescript
interface SensorReadingProps {
  label: string;
  value: number | null;
  unit: string;
  min?: number;
  max?: number;
}
```

Visual bar showing value relative to min/max range.

### Add Plant Button

- Button to create new plant
- Opens modal/form (can be simplified modal for now)

### Plant Creation Modal (frontend/src/components/CreatePlantModal.tsx)

Simple form:
- Name (required)
- Species (optional)
- Submit creates plant via API
- Refresh list on success

## Definition of Done

- [ ] Dashboard shows grid of plant cards
- [ ] Cards display plant info and latest readings
- [ ] Status indicator shows health state
- [ ] Empty state shown when no plants
- [ ] Loading spinner during fetch
- [ ] "Add Plant" button opens creation form
- [ ] Creating plant refreshes list
- [ ] Build passes

## Constraints

- Use React Query hooks from task-015
- Cards link to /plants/{id} detail page
- Handle API errors gracefully
- Keep modal simple (full form in later task if needed)
