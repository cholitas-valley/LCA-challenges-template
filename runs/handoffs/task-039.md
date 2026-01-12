# Handoff: Task 039 - Button Component with Variants

## Summary

Created a reusable Button component with Primary, Secondary, Ghost, and Danger variants using the semantic color tokens from task-038. The component includes comprehensive JSDoc documentation, loading/disabled states, and proper accessibility features including focus rings for keyboard navigation.

## Files Touched

- `frontend/src/components/ui/Button.tsx` (created) - Main button component with variants
- `frontend/src/components/ui/index.ts` (created) - Barrel export for ui components

## Components Added

### Button Component (`frontend/src/components/ui/Button.tsx`)

A fully-featured button component with:

**Variants:**
- `primary` - Green background, white text (bg-action-primary, text-action-primary-text)
- `secondary` - Gray background with border (bg-action-secondary, border-action-secondary-border)
- `ghost` - Transparent background (bg-action-ghost)
- `danger` - Red background, white text (bg-action-danger, text-action-danger-text)

**Sizes:**
- `sm` - px-3 py-1.5 text-sm
- `md` - px-4 py-2 text-sm (default)
- `lg` - px-6 py-3 text-base

**States:**
- Loading - Shows animated spinner, disables button
- Disabled - Reduces opacity to 50%, shows cursor-not-allowed
- Focus - Shows 2px ring with ring-offset-2 for accessibility

**Features:**
- Uses `forwardRef` for ref forwarding
- Uses semantic tokens from tailwind.config.js (task-038)
- Uses `cn()` utility for intelligent class merging
- Comprehensive JSDoc with usage examples and guidelines table
- Default `type="button"` to prevent form submission issues
- `aria-hidden="true"` on spinner SVG for screen readers

## How to Verify

```bash
# Build succeeds
npm run build --prefix frontend

# Lint passes
npm run lint --prefix frontend
```

Both commands pass successfully.

## Usage Example

```tsx
import { Button } from '../components/ui';

// Primary button (main CTA)
<Button variant="primary">Add Plant</Button>

// Secondary button (alternative actions)
<Button variant="secondary">Cancel</Button>

// Ghost button (tertiary actions)
<Button variant="ghost" size="sm">View Details</Button>

// Danger button (destructive actions)
<Button variant="danger">Delete</Button>

// Loading state
<Button loading>Saving...</Button>

// Disabled state
<Button disabled>Not Available</Button>
```

## Semantic Tokens Used

| Token | CSS Class | Resolved Value |
|-------|-----------|----------------|
| action.primary.DEFAULT | bg-action-primary | #16a34a (green-600) |
| action.primary.hover | hover:bg-action-primary-hover | #15803d (green-700) |
| action.primary.text | text-action-primary-text | #ffffff |
| action.secondary.DEFAULT | bg-action-secondary | #f3f4f6 (gray-100) |
| action.secondary.hover | hover:bg-action-secondary-hover | #e5e7eb (gray-200) |
| action.secondary.text | text-action-secondary-text | #374151 (gray-700) |
| action.secondary.border | border-action-secondary-border | #d1d5db (gray-300) |
| action.ghost.DEFAULT | bg-action-ghost | transparent |
| action.ghost.hover | hover:bg-action-ghost-hover | #f3f4f6 (gray-100) |
| action.ghost.text | text-action-ghost-text | #374151 (gray-700) |
| action.danger.DEFAULT | bg-action-danger | #dc2626 (red-600) |
| action.danger.hover | hover:bg-action-danger-hover | #b91c1c (red-700) |
| action.danger.text | text-action-danger-text | #ffffff |

## Risks / Follow-ups

1. **No component migration yet** - Existing components still use inline Tailwind classes. Task-043+ will migrate existing buttons to use this component.

2. **Focus ring color for secondary/ghost** - Currently uses `focus:ring-gray-400` instead of a semantic token. Could be enhanced if a semantic focus token is added.

3. **Chunk size warning** - Pre-existing warning about bundle size (>500kB). Unrelated to this task but noted for context.

## Definition of Done Status

- [x] `frontend/src/components/ui/Button.tsx` created with all four variants
- [x] `frontend/src/components/ui/index.ts` barrel export created
- [x] Button uses semantic color tokens (not raw utilities)
- [x] Loading state shows spinner
- [x] Disabled state shows reduced opacity and cursor-not-allowed
- [x] Focus states visible (ring)
- [x] `npm run build` succeeds
- [x] `npm run lint` passes
