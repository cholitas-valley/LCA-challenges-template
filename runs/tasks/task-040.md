---
task_id: task-040
title: StatusBadge Component
role: lca-frontend
follow_roles: []
post: [lca-recorder, code-simplifier, lca-gitops]
depends_on: [task-038]
inputs:
  - runs/plan.md
  - runs/handoffs/task-038.md
  - frontend/tailwind.config.js
  - frontend/src/components/DeviceTable.tsx
  - .claude/skills/ui-design/skill.yaml
allowed_paths:
  - frontend/**
check_command: cd frontend && npm run build && npm run lint
handoff: runs/handoffs/task-040.md
---

# Task 040: StatusBadge Component

## Goal

Create a StatusBadge component that displays status indicators (online, offline, error, warning, etc.) using semantic status colors. This separates status display from action buttons.

## Context

Currently, status indicators in `DeviceTable.tsx` use raw Tailwind classes like `bg-green-500`, `bg-red-500`. These are the same colors used for action buttons, creating visual confusion. A dedicated StatusBadge component with status-specific colors solves this.

## Requirements

### 1. Create StatusBadge Component

Create `frontend/src/components/ui/StatusBadge.tsx`:

```typescript
import { cn } from '../../lib/cn';

export type StatusType = 'online' | 'offline' | 'error' | 'warning' | 'provisioning' | 'info';

export interface StatusBadgeProps {
  status: StatusType;
  label?: string;
  showDot?: boolean;
  size?: 'sm' | 'md';
  className?: string;
}

const statusConfig: Record<StatusType, { dot: string; bg: string; text: string; label: string }> = {
  online: {
    dot: 'bg-status-success',
    bg: 'bg-status-success-light',
    text: 'text-status-success-text',
    label: 'Online',
  },
  offline: {
    dot: 'bg-status-neutral',
    bg: 'bg-status-neutral-light',
    text: 'text-status-neutral-text',
    label: 'Offline',
  },
  error: {
    dot: 'bg-status-error',
    bg: 'bg-status-error-light',
    text: 'text-status-error-text',
    label: 'Error',
  },
  warning: {
    dot: 'bg-status-warning',
    bg: 'bg-status-warning-light',
    text: 'text-status-warning-text',
    label: 'Warning',
  },
  provisioning: {
    dot: 'bg-status-warning',
    bg: 'bg-status-warning-light',
    text: 'text-status-warning-text',
    label: 'Provisioning',
  },
  info: {
    dot: 'bg-status-info',
    bg: 'bg-status-info-light',
    text: 'text-status-info-text',
    label: 'Info',
  },
};

export function StatusBadge({
  status,
  label,
  showDot = true,
  size = 'md',
  className,
}: StatusBadgeProps) {
  const config = statusConfig[status];
  const displayLabel = label ?? config.label;

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full font-medium',
        size === 'sm' && 'px-2 py-0.5 text-xs',
        size === 'md' && 'px-2.5 py-1 text-sm',
        config.bg,
        config.text,
        className
      )}
    >
      {showDot && (
        <span
          className={cn(
            'rounded-full',
            size === 'sm' && 'h-1.5 w-1.5',
            size === 'md' && 'h-2 w-2',
            config.dot
          )}
        />
      )}
      {displayLabel}
    </span>
  );
}
```

### 2. Update ui/index.ts

Add export to `frontend/src/components/ui/index.ts`:
```typescript
export { StatusBadge } from './StatusBadge';
export type { StatusBadgeProps, StatusType } from './StatusBadge';
```

## StatusBadge Design

The StatusBadge has:
- Colored dot (indicator)
- Light background (pill style)
- Dark text for contrast
- Pill shape (rounded-full)

Visual hierarchy:
- Dot color is the primary indicator
- Background provides visual grouping
- Text provides accessible label

## Status Mapping for Devices

| Device Status | StatusBadge Status | Dot Color |
|---------------|-------------------|-----------|
| `online` | `online` | Green |
| `offline` | `offline` | Gray |
| `provisioning` | `provisioning` | Yellow |
| `error` | `error` | Red |

## Constraints

- Do NOT update existing components to use this StatusBadge yet (that's task-043+)
- Use only semantic status tokens (`bg-status-success`, etc.)
- StatusBadge is NOT interactive (no click handlers)
- Include dot for color-blind accessibility (shape + color)

## Definition of Done

1. `frontend/src/components/ui/StatusBadge.tsx` created
2. Component exported from `ui/index.ts`
3. Supports all 6 status types: online, offline, error, warning, provisioning, info
4. Uses semantic status color tokens
5. Has sm and md size variants
6. Shows dot indicator by default
7. `npm run build` succeeds
8. `npm run lint` passes

## Verification

```bash
cd frontend && npm run build && npm run lint
```
