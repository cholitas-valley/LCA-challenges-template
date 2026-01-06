---
task_id: task-008
title: Dashboard UI with plant cards and real-time status
role: lca-frontend
follow_roles: []
post: [lca-docs]
depends_on: [task-007]
inputs:
  - runs/handoffs/task-007.md
  - runs/plan.md
allowed_paths:
  - frontend/src/**
check_command: make typecheck && npm run build --prefix frontend
handoff: runs/handoffs/task-008.md
---

## Goal

Build the main dashboard UI with plant status cards that display real-time telemetry, visual health indicators, and threshold configuration. Implement auto-polling for live updates and interactive elements for threshold management.

## Context

Task-007 completed frontend scaffolding. The application structure, API client, and TanStack Query setup are in place. The current Dashboard.tsx shows a simple list of plant names. This task transforms it into a rich, interactive dashboard with visual cards.

## Requirements

### 1. Plant Card Component
Create `frontend/src/components/PlantCard.tsx`:
- Displays plant information in a card layout
- Props: `plant` (Plant type from api/types.ts)
- Card sections:
  - **Header**: Plant name
  - **Status badge**: Health indicator (Healthy / Warning / Critical)
  - **Telemetry display**: Soil moisture, light, temperature with icons
  - **Last updated**: Timestamp of latest telemetry
  - **Config button**: Opens threshold configuration modal

Visual design:
- Use Tailwind cards with shadow and rounded corners
- Color-coded status badge:
  - Green: All metrics within thresholds
  - Yellow: One metric approaching threshold
  - Red: One or more metrics breaching thresholds
- Icons from lucide-react: Droplet (moisture), Sun (light), Thermometer (temperature)

### 2. Telemetry Display Sub-component
Create `frontend/src/components/TelemetryDisplay.tsx`:
- Props: `value`, `unit`, `icon`, `threshold_min`, `threshold_max`, `label`
- Visual representation:
  - Icon + label
  - Current value with unit
  - Color indicator based on threshold

### 3. Plant Status Calculator
Create `frontend/src/utils/plantStatus.ts`:
- Function: `calculatePlantStatus(plant: Plant): 'healthy' | 'warning' | 'critical' | 'unknown'`
- Logic:
  - `unknown`: No telemetry data
  - `critical`: Any metric outside thresholds
  - `warning`: Any metric in warning zone (80-100% of threshold)
  - `healthy`: All metrics within safe range

### 4. Threshold Configuration Modal
Create `frontend/src/components/ThresholdConfigModal.tsx`:
- Props: `plant`, `isOpen`, `onClose`, `onSave`
- Form fields for thresholds:
  - Soil moisture min/max
  - Light min
  - Temperature min/max
  - Alert cooldown minutes
- Use controlled inputs with validation
- Submit button calls `useUpdatePlantConfig` mutation
- Loading state during save operation

### 5. Dashboard Grid Layout
Update `frontend/src/pages/Dashboard.tsx`:
- Replace plant name list with grid layout
- Responsive grid:
  - Desktop: 3 columns
  - Tablet: 2 columns
  - Mobile: 1 column
- Display PlantCard for each plant
- Auto-refresh with TanStack Query (5-second interval)
- Loading skeleton for cards while fetching
- Error state with retry button

### 6. Loading Skeleton
Create `frontend/src/components/PlantCardSkeleton.tsx`:
- Animated skeleton matching PlantCard layout
- Use Tailwind pulse animation

### 7. Time Formatting Utilities
Create `frontend/src/utils/dateTime.ts`:
- Function: `formatTimestamp(timestamp: string): string`
- Format examples: "2 minutes ago", "15 seconds ago"

## Constraints

- **No chart implementation** - Task-009 will add history charts
- **Use existing API queries** - No new API endpoints
- **TypeScript strict mode** - All props and state typed
- **No external UI libraries** - Build with Tailwind + Lucide icons only
- **Performance** - Use React.memo for PlantCard

## Definition of Done

- [ ] PlantCard component displays all plant info with status indicators
- [ ] TelemetryDisplay shows metrics with color-coded health status
- [ ] PlantStatus calculator correctly identifies healthy/warning/critical states
- [ ] ThresholdConfigModal allows editing and saving plant thresholds
- [ ] Dashboard grid layout responsive across all screen sizes
- [ ] Loading skeleton shows during data fetch
- [ ] Time formatting utilities display human-readable timestamps
- [ ] All components pass TypeScript type checking
- [ ] `make typecheck` passes
- [ ] `npm run build --prefix frontend` succeeds
- [ ] Dashboard displays 6 plant cards with live telemetry
- [ ] Clicking config button opens modal with editable thresholds
- [ ] Saving thresholds updates backend and refreshes dashboard
- [ ] Status badges correctly reflect plant health
- [ ] Handoff document created at `runs/handoffs/task-008.md`
