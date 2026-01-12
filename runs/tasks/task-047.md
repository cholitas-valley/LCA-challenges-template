---
task_id: task-047
title: Feature 4 Final QA
role: lca-qa
follow_roles: []
post: [lca-recorder, lca-docs, lca-gitops]
depends_on: [task-046]
inputs:
  - objective.md
  - runs/plan.md
  - runs/handoffs/task-046.md
  - frontend/tailwind.config.js
  - frontend/src/components/ui/Button.tsx
  - frontend/src/components/ui/StatusBadge.tsx
  - frontend/src/components/ui/FilterPills.tsx
  - frontend/src/components/ui/Skeleton.tsx
allowed_paths:
  - frontend/**
  - docs/**
  - runs/**
check_command: make check
handoff: runs/handoffs/task-047.md
---

# Task 047: Feature 4 Final QA

## Goal

Perform final quality assurance for Feature 4 (UI/UX Refactor), verify all Definition of Done items are complete, and create design system documentation.

## Context

All implementation tasks are complete:
- task-038: Semantic color tokens
- task-039: Button component
- task-040: StatusBadge component
- task-041: FilterPills component
- task-042: Skeleton loading states
- task-043-045: Page migrations
- task-046: Accessibility audit

This task verifies everything works and documents the design system.

## Requirements

### 1. Verify Definition of Done

From objective.md Feature 4:

**Color System:**
- [ ] 3-layer token architecture in tailwind.config.js (primitives, semantic, component)
- [ ] No raw color utilities in components (verify: `grep -r "bg-green-600" frontend/src/`)
- [ ] Status colors separate from action colors
- [ ] Color contrast meets WCAG AA (4.5:1 for text)

**Components:**
- [ ] Button component with Primary/Secondary/Ghost/Danger variants
- [ ] StatusBadge component for online/offline/error states
- [ ] FilterPills component for filter toggles
- [ ] All buttons use consistent hierarchy

**States:**
- [ ] Skeleton loading for tables and cards
- [ ] Empty states with clear CTAs
- [ ] Focus states visible on all interactive elements

**Quality:**
- [ ] `make check` passes (build + 139 tests)
- [ ] Visual review confirms professional appearance
- [ ] No duplicate color definitions

### 2. Run Full Test Suite

```bash
make check
# Expect: 139 tests passing, build success
```

### 3. Verify No Raw Color Utilities

```bash
# Should return 0 results
grep -r "bg-green-600\|bg-red-600" frontend/src/ --include="*.tsx" | wc -l

# Check for text colors too
grep -r "text-green-600\|text-red-600" frontend/src/ --include="*.tsx" | grep -v node_modules | wc -l
```

### 4. Create Design System Documentation

Create `docs/design-system.md`:

```markdown
# PlantOps Design System

## Color Tokens

### Action Colors
Used for interactive elements (buttons, links).

| Token | Value | Usage |
|-------|-------|-------|
| `action-primary` | #16a34a | Primary CTAs |
| `action-primary-hover` | #15803d | Primary hover state |
| `action-secondary` | #f3f4f6 | Secondary actions |
| `action-danger` | #dc2626 | Destructive actions |
| `action-ghost` | transparent | Tertiary actions |

### Status Colors
Used for indicators and badges (non-interactive).

| Token | Value | Usage |
|-------|-------|-------|
| `status-success` | #22c55e | Online, healthy |
| `status-warning` | #eab308 | Caution, degraded |
| `status-error` | #ef4444 | Error, offline |
| `status-info` | #3b82f6 | Informational |
| `status-neutral` | #9ca3af | Neutral, disabled |

## Components

### Button
```tsx
import { Button } from '@/components/ui';

<Button variant="primary">Primary</Button>
<Button variant="secondary">Secondary</Button>
<Button variant="ghost">Ghost</Button>
<Button variant="danger">Danger</Button>
```

### StatusBadge
```tsx
import { StatusBadge } from '@/components/ui';

<StatusBadge status="online" />
<StatusBadge status="offline" />
<StatusBadge status="error" />
<StatusBadge status="warning" />
```

### FilterPills
```tsx
import { FilterPills } from '@/components/ui';

<FilterPills
  options={[
    { value: 'all', label: 'All', count: 10 },
    { value: 'active', label: 'Active', count: 5 },
  ]}
  value={filter}
  onChange={setFilter}
/>
```

### Skeleton
```tsx
import { SkeletonCardGrid, SkeletonTable } from '@/components/ui';

// For card layouts
<SkeletonCardGrid count={6} />

// For tables
<SkeletonTable rows={5} columns={6} />
```

## Accessibility

- All interactive elements have visible focus states
- Color contrast meets WCAG AA (4.5:1 minimum)
- Status indicators include text, not just color
- Skip link available for keyboard navigation
- Reduced motion support for animations

## Usage Guidelines

### Button Hierarchy
1. **Primary**: One per section, main CTA
2. **Secondary**: Alternative actions, cancel
3. **Ghost**: Tertiary actions, navigation
4. **Danger**: Destructive only (delete, remove)

### Status vs Action
- **StatusBadge**: Display-only, shows state
- **Button**: Interactive, triggers action

Never use action colors for status or vice versa.
```

### 5. Update README if Needed

If README.md mentions styling or components, update to reference the design system.

## Files to Create/Verify

1. `docs/design-system.md` - CREATE
2. All frontend components - VERIFY no raw colors
3. `make check` - VERIFY passes

## QA Checklist

- [ ] `make check` passes with 139 tests
- [ ] `npm run build` succeeds
- [ ] `npm run lint` passes
- [ ] Zero raw color utilities in components
- [ ] Button component has 4 variants
- [ ] StatusBadge component works for all status types
- [ ] FilterPills component works with options
- [ ] Skeleton components render correctly
- [ ] Focus states visible when tabbing
- [ ] Design system documentation created
- [ ] Visual appearance is professional and consistent

## Definition of Done

1. All Feature 4 DoD items verified and checked
2. `make check` passes (139 tests)
3. Zero raw color utilities in frontend/src
4. `docs/design-system.md` created and complete
5. Visual review confirms professional appearance

## Verification

```bash
# Full verification script
make check
grep -r "bg-green-600\|bg-red-600\|text-green-600\|text-red-600" frontend/src/ --include="*.tsx" | wc -l
ls -la docs/design-system.md
```
