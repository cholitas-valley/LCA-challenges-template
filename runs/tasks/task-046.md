---
task_id: task-046
title: Accessibility Audit and Focus States
role: lca-frontend
follow_roles: []
post: [lca-recorder, code-simplifier, lca-gitops]
depends_on: [task-045]
inputs:
  - runs/plan.md
  - runs/handoffs/task-045.md
  - frontend/src/components/ui/Button.tsx
  - frontend/src/components/ui/StatusBadge.tsx
  - frontend/src/components/ui/FilterPills.tsx
  - .claude/skills/color-theory/skill.yaml
allowed_paths:
  - frontend/**
check_command: make check
handoff: runs/handoffs/task-046.md
---

# Task 046: Accessibility Audit and Focus States

## Goal

Audit the entire frontend for accessibility issues, ensuring all interactive elements have visible focus states and color contrast meets WCAG AA standards.

## Context

All components have been migrated to use semantic colors. Now we need to verify accessibility:
1. Focus states visible on all interactive elements
2. Color contrast meets 4.5:1 for text
3. Color is not the only indicator (icons/text accompany)
4. Keyboard navigation works

## Requirements

### 1. Verify Focus States

Check all interactive elements have visible focus rings:

**Buttons (via Button.tsx):**
```tsx
// Verify this exists in Button component
'focus:outline-none focus:ring-2 focus:ring-offset-2'
```

**Links:**
Add focus styles to all navigation links:
```tsx
<Link className="... focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-action-primary">
```

**Form Inputs:**
Ensure all inputs have focus states:
```tsx
<input className="... focus:ring-2 focus:ring-action-primary focus:border-action-primary">
```

**Modals:**
Ensure modal triggers and close buttons have focus states.

### 2. Verify Color Contrast

Use the semantic colors and verify contrast ratios:

| Element | Background | Text | Required Ratio |
|---------|------------|------|----------------|
| Primary button | action-primary (#16a34a) | white | 4.5:1+ |
| Danger button | action-danger (#dc2626) | white | 4.5:1+ |
| Success badge | status-success-light (#dcfce7) | status-success-text (#166534) | 4.5:1+ |
| Error badge | status-error-light (#fee2e2) | status-error-text (#991b1b) | 4.5:1+ |
| Body text | white | gray-900 | 4.5:1+ |
| Muted text | white | gray-500 | 4.5:1+ |

If any fail, adjust the color tokens in tailwind.config.js.

### 3. Add Skip Link

Add a skip-to-content link for keyboard users:

Create or update `frontend/src/components/Layout.tsx`:
```tsx
// Add at the very beginning of Layout
<a
  href="#main-content"
  className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-white focus:text-gray-900 focus:ring-2 focus:ring-action-primary focus:rounded"
>
  Skip to main content
</a>

// Add id to main content area
<main id="main-content" ...>
```

### 4. Verify ARIA Labels

Check StatusBadge has proper ARIA:
```tsx
<span
  role="status"
  aria-label={`Status: ${displayLabel}`}
  className={...}
>
```

Check FilterPills has proper ARIA (already has role="group" and role="radio").

### 5. Check Color-Blind Accessibility

Ensure status indicators don't rely solely on color:
- StatusBadge has text label (good)
- Health indicators have text (good)
- Error messages have icon + text (good)

If any status only uses color, add icon or text.

### 6. Reduced Motion Support

Add reduced motion preference to animations:
```css
/* In frontend/src/index.css or globals.css */
@media (prefers-reduced-motion: reduce) {
  .animate-pulse {
    animation: none;
  }
  .transition-colors {
    transition: none;
  }
}
```

## Files to Modify/Audit

1. `frontend/src/components/ui/Button.tsx` - verify focus states
2. `frontend/src/components/ui/StatusBadge.tsx` - add ARIA label
3. `frontend/src/components/ui/FilterPills.tsx` - verify ARIA
4. `frontend/src/components/Layout.tsx` - add skip link
5. `frontend/tailwind.config.js` - adjust colors if contrast fails
6. `frontend/src/index.css` - add reduced motion support
7. All form inputs across components - verify focus states

## Accessibility Checklist

- [ ] All buttons have visible focus ring
- [ ] All links have visible focus ring
- [ ] All form inputs have visible focus ring
- [ ] Primary button text passes 4.5:1 contrast
- [ ] All status badge text passes 4.5:1 contrast
- [ ] Body text passes 4.5:1 contrast
- [ ] StatusBadge has role="status" and aria-label
- [ ] FilterPills uses role="group" with aria-label
- [ ] Skip link added to Layout
- [ ] Reduced motion media query added
- [ ] No status relies solely on color (all have text)

## Constraints

- Do NOT change functionality
- Run `make check` to verify 139 tests still pass
- Focus on a11y improvements only

## Definition of Done

1. All interactive elements have visible focus states
2. All color combinations pass WCAG AA (4.5:1 for text)
3. Skip link added for keyboard navigation
4. Proper ARIA labels on status components
5. Reduced motion support added
6. All existing tests pass (139)
7. `make check` succeeds

## Verification

```bash
make check

# Manual testing:
# 1. Tab through the app - can you see where focus is?
# 2. Use keyboard only to navigate
# 3. Check colors in browser DevTools accessibility panel
```
