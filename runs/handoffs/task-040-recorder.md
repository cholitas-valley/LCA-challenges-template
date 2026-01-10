# Task 040 Recorder: StatusBadge Component

## Summary

Created StatusBadge component for semantic status indicators with 6 status types.

## Files Created/Modified

| File | Purpose |
|------|---------|
| `frontend/src/components/ui/StatusBadge.tsx` | StatusBadge component |
| `frontend/src/components/ui/index.ts` | Added exports |

## Component Interface

```typescript
type StatusType = 'online' | 'offline' | 'error' | 'warning' | 'provisioning' | 'info';

interface StatusBadgeProps {
  status: StatusType;
  label?: string;
  showDot?: boolean;
  size?: 'sm' | 'md';
}
```

## Semantic Tokens Used

| Status | Tokens |
|--------|--------|
| online | status-success, status-success-light, status-success-text |
| offline | status-neutral, status-neutral-light, status-neutral-text |
| error | status-error, status-error-light, status-error-text |
| warning | status-warning, status-warning-light, status-warning-text |
| info | status-info, status-info-light, status-info-text |

## Context for Next Tasks

- **Task 041 (FilterPills)**: Similar pill-style component pattern
- **Task 043+ (Migrations)**: Replace DeviceTable status spans with `<StatusBadge status="online"/>`

## Import Pattern

```typescript
import { StatusBadge } from '@/components/ui';
```
