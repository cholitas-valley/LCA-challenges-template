---
task_id: task-038
title: Semantic Color Token Architecture
role: lca-frontend
follow_roles: []
post: [lca-recorder, code-simplifier, lca-gitops]
depends_on: []
inputs:
  - objective.md
  - runs/plan.md
  - frontend/tailwind.config.js
  - .claude/skills/color-theory/skill.yaml
  - .claude/skills/design-systems/skill.yaml
allowed_paths:
  - frontend/**
check_command: cd frontend && npm run build && npm run lint
handoff: runs/handoffs/task-038.md
---

# Task 038: Semantic Color Token Architecture

## Goal

Implement a 3-tier semantic color token system in Tailwind CSS that separates action colors from status colors and provides a foundation for the design system.

## Context

The current frontend uses raw Tailwind utilities (`bg-green-600`, `text-red-600`) with no semantic meaning. The existing `tailwind.config.js` has unused `plant.healthy/warning/danger` tokens. This task establishes proper color architecture.

## Requirements

### 1. Update tailwind.config.js with 3-Tier Architecture

**Layer 1: Primitives** (already exist in Tailwind defaults)
- Keep standard Tailwind color palette (green, red, yellow, blue, gray)

**Layer 2: Semantic Tokens** (add to extend.colors)
```javascript
colors: {
  // ACTION COLORS (for buttons, links, interactive elements)
  action: {
    primary: {
      DEFAULT: '#16a34a',      // green-600
      hover: '#15803d',        // green-700
      text: '#ffffff',
    },
    secondary: {
      DEFAULT: '#f3f4f6',      // gray-100
      hover: '#e5e7eb',        // gray-200
      text: '#374151',         // gray-700
      border: '#d1d5db',       // gray-300
    },
    danger: {
      DEFAULT: '#dc2626',      // red-600
      hover: '#b91c1c',        // red-700
      text: '#ffffff',
    },
    ghost: {
      DEFAULT: 'transparent',
      hover: '#f3f4f6',        // gray-100
      text: '#374151',         // gray-700
    },
  },
  
  // STATUS COLORS (for indicators, badges, non-interactive)
  status: {
    success: {
      DEFAULT: '#22c55e',      // green-500
      light: '#dcfce7',        // green-100
      text: '#166534',         // green-800
    },
    warning: {
      DEFAULT: '#eab308',      // yellow-500
      light: '#fef9c3',        // yellow-100
      text: '#854d0e',         // yellow-800
    },
    error: {
      DEFAULT: '#ef4444',      // red-500
      light: '#fee2e2',        // red-100
      text: '#991b1b',         // red-800
    },
    info: {
      DEFAULT: '#3b82f6',      // blue-500
      light: '#dbeafe',        // blue-100
      text: '#1e40af',         // blue-800
    },
    neutral: {
      DEFAULT: '#9ca3af',      // gray-400
      light: '#f3f4f6',        // gray-100
      text: '#374151',         // gray-700
    },
  },
}
```

### 2. Create cn Utility

Create `frontend/src/lib/cn.ts`:
```typescript
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

### 3. Install Dependencies

Add to frontend package.json:
- `clsx` (for conditional classes)
- `tailwind-merge` (for conflict resolution)

### 4. Remove Unused Plant Tokens

Remove the existing unused `plant.healthy`, `plant.warning`, `plant.danger` tokens since they are being replaced by the semantic system.

## Constraints

- Do NOT modify any component files in this task (only config and utility)
- Do NOT break the existing build
- Ensure all color values meet WCAG AA contrast ratios (4.5:1 for text)
- Use Tailwind's built-in palette as primitives, not custom hex values

## Definition of Done

1. `tailwind.config.js` updated with semantic color tokens under `action` and `status` namespaces
2. `frontend/src/lib/cn.ts` created with clsx + tailwind-merge utility
3. `clsx` and `tailwind-merge` added as dependencies
4. Unused `plant.*` tokens removed from config
5. `npm run build` succeeds (no breaking changes)
6. `npm run lint` passes
7. New tokens are documented in comments in tailwind.config.js

## Verification

```bash
cd frontend && npm install && npm run build && npm run lint
```
