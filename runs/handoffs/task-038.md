# Handoff: Task 038 - Semantic Color Token Architecture

## Summary

Implemented a 3-tier semantic color token system in Tailwind CSS that separates action colors (for interactive elements) from status colors (for indicators). Created a `cn` utility function using `clsx` and `tailwind-merge` for intelligent class name merging.

## Files Touched

- `frontend/package.json` - Added `clsx` (^2.1.0) and `tailwind-merge` (^2.2.0) dependencies, added `lint` script
- `frontend/tailwind.config.js` - Complete rewrite of color configuration with semantic tokens
- `frontend/src/lib/cn.ts` - New file with class name utility

## Changes Made

### 1. Tailwind Config (tailwind.config.js)

Removed unused `plant.*` tokens and added semantic color architecture:

**Action Colors** (for buttons, links, interactive elements):
- `action.primary` - Green-based primary actions (DEFAULT, hover, text)
- `action.secondary` - Gray-based secondary actions (DEFAULT, hover, text, border)
- `action.danger` - Red-based destructive actions (DEFAULT, hover, text)
- `action.ghost` - Transparent background, minimal visual weight

**Status Colors** (for indicators, badges, alerts):
- `status.success` - Green palette (DEFAULT, light, text)
- `status.warning` - Yellow palette (DEFAULT, light, text)
- `status.error` - Red palette (DEFAULT, light, text)
- `status.info` - Blue palette (DEFAULT, light, text)
- `status.neutral` - Gray palette (DEFAULT, light, text)

All status text colors meet WCAG AA contrast requirements (4.5:1) on their light backgrounds.

### 2. cn Utility (src/lib/cn.ts)

Created a utility function that combines:
- `clsx` for conditional class construction
- `tailwind-merge` for intelligent conflict resolution

Usage examples included in JSDoc comments.

### 3. Package.json Updates

- Added `clsx: ^2.1.0` dependency
- Added `tailwind-merge: ^2.2.0` dependency
- Added `lint: tsc --noEmit` script for TypeScript type checking

## How to Verify

```bash
cd frontend && npm install && npm run build && npm run lint
```

All commands pass successfully.

## Token Usage Examples

```jsx
// Action buttons
<button className="bg-action-primary hover:bg-action-primary-hover text-action-primary-text">
  Save
</button>

// Status badges
<span className="bg-status-success-light text-status-success-text">
  Healthy
</span>

// Using cn utility for conditional classes
import { cn } from '@/lib/cn';
<div className={cn('p-4', isActive && 'bg-action-primary')}>
  ...
</div>
```

## Risks / Follow-ups

1. **No component updates yet** - Components still use raw Tailwind classes (`bg-green-600`, etc.). A follow-up task should migrate components to use the new semantic tokens.

2. **Chunk size warning** - Build outputs a warning about chunk size (>500kB). This is pre-existing and unrelated to this task but should be addressed with code splitting.

3. **Path alias** - The `@/lib/cn` import pattern requires tsconfig path mapping to work. Components will need to import using relative paths (`../../lib/cn`) unless path aliases are configured.

## Definition of Done Status

- [x] tailwind.config.js updated with semantic color tokens under `action` and `status` namespaces
- [x] frontend/src/lib/cn.ts created with clsx + tailwind-merge utility
- [x] clsx and tailwind-merge added as dependencies
- [x] Unused plant.* tokens removed from config
- [x] npm run build succeeds (no breaking changes)
- [x] npm run lint passes
- [x] New tokens are documented in comments in tailwind.config.js
