---
task_id: task-019
title: Plant detail with charts
role: lca-frontend
follow_roles: []
post:
  - lca-recorder
  - lca-gitops
depends_on:
  - task-018
  - task-010
inputs:
  - objective.md
  - runs/plan.md
  - runs/handoffs/task-018.md
allowed_paths:
  - frontend/**
check_command: cd frontend && npm run build
handoff: runs/handoffs/task-019.md
---

# Task 019: Plant Detail with Charts

## Goal

Implement the plant detail page with telemetry history charts, threshold configuration, and device list.

## Requirements

### Plant Detail Page (frontend/src/pages/PlantDetail.tsx)

Sections:
1. Header with plant info and actions
2. Current readings (large display)
3. 24-hour history charts
4. Threshold configuration
5. Attached devices list

### Plant Header

- Plant name (editable inline)
- Species
- Status indicator
- Edit/Delete buttons

### Current Readings Section

Large, prominent display of current sensor values:
```
┌─────────────────────────────────────────────────────────┐
│                  Current Readings                        │
├──────────────┬──────────────┬──────────────┬────────────┤
│  💧 45%      │  🌡️ 22.5°C   │  💨 65%      │  ☀️ 800    │
│  Moisture    │  Temperature │  Humidity    │  Light     │
│  (20-80)     │  (18-30)     │  (40-80)     │  (200+)    │
└──────────────┴──────────────┴──────────────┴────────────┘
```

### History Charts

Use a charting library (recharts recommended):
- Line chart for each metric
- 24-hour timeframe
- Threshold lines shown on chart
- Time axis with readable labels

Chart layout:
```
┌─────────────────────────────────────────┐
│ Soil Moisture (24h)                     │
│ ─── Current  ─ ─ Min  ─ ─ Max          │
│                                         │
│    ╭──────╮      ╭─────────╮           │
│ ───┤      ╰──────╯         ╰─────      │
│ ═══════════════════════════════ ← max  │
│                                         │
│ ═══════════════════════════════ ← min  │
│     6am    12pm    6pm    12am         │
└─────────────────────────────────────────┘
```

### Threshold Configuration

Edit thresholds form:
- Min/Max inputs for each metric
- Save button updates plant via API
- Visual feedback on save

### Devices List

Show devices attached to this plant:
- Device ID and status
- Last telemetry time
- Unassign button

### Navigation

- Back button to dashboard
- Breadcrumb: Dashboard > Plants > {Plant Name}

## Definition of Done

- [ ] Plant detail page loads plant data
- [ ] Current readings displayed prominently
- [ ] 24-hour history chart renders
- [ ] Threshold lines shown on charts
- [ ] Can edit thresholds
- [ ] Attached devices listed
- [ ] Can navigate back to dashboard
- [ ] Build passes

## Constraints

- Use recharts or similar lightweight library
- Charts must be responsive
- Handle missing data gracefully
- Loading states for async data

## Dependencies

Add to package.json:
- `recharts: ^2.10.0`
