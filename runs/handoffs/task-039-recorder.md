# Task 039 Recorder: Button Component with Variants

## Summary

Created reusable Button component with semantic color variants, establishing foundation for consistent UI across PlantOps.

## Files Created

| File | Purpose |
|------|---------|
| `frontend/src/components/ui/Button.tsx` | Button component with 4 variants |
| `frontend/src/components/ui/index.ts` | Barrel export |

## Component Interface

```typescript
interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
}
```

## Semantic Tokens Used

- `bg-action-primary`, `hover:bg-action-primary-hover`
- `bg-action-secondary`, `hover:bg-action-secondary-hover`
- `bg-action-ghost`, `hover:bg-action-ghost-hover`
- `bg-action-danger`, `hover:bg-action-danger-hover`

## Context for Next Tasks

- **Task 040 (StatusBadge)**: Will use `status-*` tokens for indicators
- **Task 043+ (Migrations)**: Will replace inline buttons with `<Button variant="..."/>`

## Import Pattern

```typescript
import { Button } from '@/components/ui';
```

## Verification

```bash
cd frontend && npm run build && npm run lint
```
