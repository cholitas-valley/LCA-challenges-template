---
task_id: task-039
title: Button Component with Variants
role: lca-frontend
follow_roles: []
post: [lca-recorder, code-simplifier, lca-gitops]
depends_on: [task-038]
inputs:
  - runs/plan.md
  - runs/handoffs/task-038.md
  - frontend/tailwind.config.js
  - .claude/skills/ui-design/skill.yaml
  - .claude/skills/tailwind-css/skill.yaml
allowed_paths:
  - frontend/**
check_command: cd frontend && npm run build && npm run lint
handoff: runs/handoffs/task-039.md
---

# Task 039: Button Component with Variants

## Goal

Create a reusable Button component with Primary, Secondary, Ghost, and Danger variants using the semantic color tokens from task-038.

## Context

Currently, all buttons across the app use inline Tailwind classes with raw colors (`bg-green-600`). This creates inconsistency and makes it hard to maintain visual hierarchy. A proper Button component establishes clear visual distinction between action types.

## Requirements

### 1. Create Button Component

Create `frontend/src/components/ui/Button.tsx`:

```typescript
import { forwardRef } from 'react';
import { cn } from '../../lib/cn';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', loading, disabled, children, ...props }, ref) => {
    const isDisabled = disabled || loading;
    
    return (
      <button
        ref={ref}
        type="button"
        disabled={isDisabled}
        className={cn(
          // Base styles
          'inline-flex items-center justify-center font-medium rounded-md transition-colors',
          'focus:outline-none focus:ring-2 focus:ring-offset-2',
          
          // Disabled state
          isDisabled && 'opacity-50 cursor-not-allowed',
          
          // Size variants
          size === 'sm' && 'px-3 py-1.5 text-sm',
          size === 'md' && 'px-4 py-2 text-sm',
          size === 'lg' && 'px-6 py-3 text-base',
          
          // Color variants using semantic tokens
          variant === 'primary' && [
            'bg-action-primary text-action-primary-text',
            'hover:bg-action-primary-hover focus:ring-action-primary',
          ],
          variant === 'secondary' && [
            'bg-action-secondary text-action-secondary-text border border-action-secondary-border',
            'hover:bg-action-secondary-hover focus:ring-gray-400',
          ],
          variant === 'ghost' && [
            'bg-action-ghost text-action-ghost-text',
            'hover:bg-action-ghost-hover focus:ring-gray-400',
          ],
          variant === 'danger' && [
            'bg-action-danger text-action-danger-text',
            'hover:bg-action-danger-hover focus:ring-action-danger',
          ],
          
          className
        )}
        {...props}
      >
        {loading && (
          <svg
            className="animate-spin -ml-1 mr-2 h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        )}
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';
```

### 2. Create ui/index.ts Barrel Export

Create `frontend/src/components/ui/index.ts`:
```typescript
export { Button } from './Button';
export type { ButtonProps } from './Button';
```

### 3. Create Components Directory Structure

Ensure the following structure exists:
```
frontend/src/components/
  ui/
    Button.tsx
    index.ts
```

## Button Variant Usage Guidelines

Document in the component file (JSDoc comments):

| Variant | Usage | Example |
|---------|-------|---------|
| `primary` | Main CTA, one per section max | "Add Plant", "Save" |
| `secondary` | Alternative actions | "Cancel", "Back" |
| `ghost` | Tertiary actions, navigation | "View Details", "Learn More" |
| `danger` | Destructive actions only | "Delete", "Remove" |

## Constraints

- Do NOT update existing components to use this Button yet (that's task-043+)
- Use the semantic tokens from task-038 (`bg-action-primary`, etc.)
- Include focus states for keyboard accessibility
- Support disabled and loading states
- Use forwardRef for ref forwarding

## Definition of Done

1. `frontend/src/components/ui/Button.tsx` created with all four variants
2. `frontend/src/components/ui/index.ts` barrel export created
3. Button uses semantic color tokens (not raw utilities)
4. Loading state shows spinner
5. Disabled state shows reduced opacity and cursor-not-allowed
6. Focus states visible (ring)
7. `npm run build` succeeds
8. `npm run lint` passes

## Verification

```bash
cd frontend && npm run build && npm run lint
```
