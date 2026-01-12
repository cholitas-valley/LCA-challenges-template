# Handoff: Task 040 - StatusBadge Component

## Summary

Created a StatusBadge component that displays status indicators using the semantic status color tokens from task-038. The component supports 6 status types (online, offline, error, warning, provisioning, info) with colored dot indicators, light backgrounds, and WCAG AA compliant text colors.

## Files Touched

- `frontend/src/components/ui/StatusBadge.tsx` - New StatusBadge component
- `frontend/src/components/ui/index.ts` - Added StatusBadge export

## Component API

```typescript
export type StatusType = 'online' | 'offline' | 'error' | 'warning' | 'provisioning' | 'info';

export interface StatusBadgeProps {
  status: StatusType;
  label?: string;      // Custom label (defaults to status name capitalized)
  showDot?: boolean;   // Show colored dot indicator (default: true)
  size?: 'sm' | 'md';  // Size variant (default: 'md')
  className?: string;  // Additional classes
}
```

## Status Token Mapping

| Status | Dot Color | Background | Text Color |
|--------|-----------|------------|------------|
| online | status-success (green) | status-success-light | status-success-text |
| offline | status-neutral (gray) | status-neutral-light | status-neutral-text |
| error | status-error (red) | status-error-light | status-error-text |
| warning | status-warning (yellow) | status-warning-light | status-warning-text |
| provisioning | status-warning (yellow) | status-warning-light | status-warning-text |
| info | status-info (blue) | status-info-light | status-info-text |

## Design Details

- Colored dot for color-blind accessibility (shape + color)
- Pill shape (rounded-full)
- Two size variants:
  - `sm`: px-2 py-0.5 text-xs, dot: h-1.5 w-1.5
  - `md`: px-2.5 py-1 text-sm, dot: h-2 w-2
- Uses `cn()` utility for class merging
- Non-interactive (display only)

## Usage Example

```tsx
import { StatusBadge } from '../components/ui';

// Basic usage
<StatusBadge status="online" />                    // Green dot + "Online"
<StatusBadge status="offline" />                   // Gray dot + "Offline"
<StatusBadge status="error" />                     // Red dot + "Error"

// Custom label
<StatusBadge status="online" label="Connected" />  // Green dot + "Connected"

// Without dot
<StatusBadge status="warning" showDot={false} />   // Just "Warning" badge

// Small size
<StatusBadge status="info" size="sm" />            // Smaller badge
```

## How to Verify

```bash
cd frontend && npm run build && npm run lint
```

Both commands pass successfully.

## Definition of Done Status

- [x] `frontend/src/components/ui/StatusBadge.tsx` created
- [x] Component exported from `ui/index.ts`
- [x] Supports all 6 status types: online, offline, error, warning, provisioning, info
- [x] Uses semantic status color tokens (bg-status-*, text-status-*-text)
- [x] Has sm and md size variants
- [x] Shows dot indicator by default
- [x] `npm run build` succeeds
- [x] `npm run lint` passes

## Risks / Follow-ups

1. **Components not yet updated** - Existing components (DeviceTable, etc.) still use raw Tailwind classes. Follow-up tasks (task-043+) will migrate them to use StatusBadge.

2. **Chunk size warning** - Pre-existing warning about chunk size > 500kB. Unrelated to this task but should be addressed with code splitting.

3. **No visual testing** - Component created but not visible in the app yet. Integration in task-043+ will allow visual verification.
