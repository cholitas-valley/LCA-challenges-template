---
task_id: task-018
title: Device management UI
role: lca-frontend
follow_roles: []
post:
  - lca-recorder
  - lca-gitops
depends_on:
  - task-017
  - task-008
inputs:
  - objective.md
  - runs/plan.md
  - runs/handoffs/task-017.md
allowed_paths:
  - frontend/**
check_command: cd frontend && npm run build
handoff: runs/handoffs/task-018.md
---

# Task 018: Device Management UI

## Goal

Implement the device management page showing all devices, their status, and assignment controls.

## Requirements

### Devices Page (frontend/src/pages/Devices.tsx)

- Fetch devices using useDevices() hook
- Display table/list of all devices
- Filter by status (all/online/offline/unassigned)
- Show plant assignment for each device

### Device Table Component (frontend/src/components/DeviceTable.tsx)

Columns:
- Status indicator (colored dot)
- Device ID (short form)
- MAC Address
- Assigned Plant (or "Unassigned")
- Last Seen (relative time)
- Actions (Assign/Unassign/Delete)

```
┌────────┬───────────┬───────────────────┬─────────────┬────────────┬─────────┐
│ Status │ Device ID │ MAC Address       │ Plant       │ Last Seen  │ Actions │
├────────┼───────────┼───────────────────┼─────────────┼────────────┼─────────┤
│   ●    │ abc123    │ AA:BB:CC:DD:EE:FF │ Monstera    │ 2 min ago  │ [...]   │
│   ○    │ def456    │ 11:22:33:44:55:66 │ Unassigned  │ 5 min ago  │ [...]   │
│   ●    │ ghi789    │ AA:11:BB:22:CC:33 │ Fiddle Leaf │ 30 sec ago │ [...]   │
└────────┴───────────┴───────────────────┴─────────────┴────────────┴─────────┘
```

### Device Assignment Modal (frontend/src/components/AssignDeviceModal.tsx)

- Select plant from dropdown
- Submit assigns device to plant
- Show current assignment if already assigned

### Device Status Indicator

- Green dot: online
- Gray dot: offline
- Yellow dot: provisioning
- Red dot: error

### Unassigned Devices Section

Separate section or filter for devices without plant_id:
- Prominently display unassigned devices
- Easy access to assignment action

### Actions

- **Assign**: Open modal to select plant
- **Unassign**: Remove from current plant (confirm dialog)
- **Delete**: Remove device permanently (confirm dialog)

### Device Detail View (optional)

Expandable row or separate page showing:
- Full device info
- Firmware version
- Sensor types
- Registration date

## Definition of Done

- [ ] Devices page shows all devices
- [ ] Status filter works (all/online/offline/unassigned)
- [ ] Can assign device to plant
- [ ] Can unassign device from plant
- [ ] Can delete device (with confirmation)
- [ ] Status indicators match device state
- [ ] Last seen shows relative time
- [ ] Build passes

## Constraints

- Use React Query mutations for assign/unassign/delete
- Confirm before destructive actions
- Handle errors gracefully
- Keep table responsive on mobile (card view?)
