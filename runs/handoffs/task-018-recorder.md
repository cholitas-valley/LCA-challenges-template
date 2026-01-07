# Recorder: task-018

## Changes Summary

Implemented device management page with table, status filtering, assignment modal, and confirmation dialogs.

## Key Files

- `frontend/src/components/DeviceTable.tsx`: Table with status, ID, MAC, plant, last seen, actions
- `frontend/src/components/AssignDeviceModal.tsx`: Device-to-plant assignment modal
- `frontend/src/components/ConfirmDialog.tsx`: Reusable confirmation dialog
- `frontend/src/pages/Devices.tsx`: Device management page with filtering

## Interfaces for Next Task

### ConfirmDialog
```typescript
interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
  isLoading?: boolean;
  variant?: 'danger' | 'warning';
}
```

### AssignDeviceModal
```typescript
interface AssignDeviceModalProps {
  isOpen: boolean;
  device: Device | null;
  onClose: () => void;
  onAssigned: () => void;
}
```

### DeviceTable
```typescript
interface DeviceTableProps {
  devices: Device[];
  plants: Plant[];
  onAssign: (device: Device) => void;
  onUnassign: (device: Device) => void;
  onDelete: (device: Device) => void;
}
```

### Status Colors
- online: green-500
- offline: gray-400
- provisioning: yellow-500
- error: red-500

## Notes

- Status filter: all/online/offline/unassigned
- Relative time for last seen
- Confirmation before destructive actions
