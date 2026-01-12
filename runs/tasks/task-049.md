---
task_id: task-049
title: "Frontend: SVG Plant Icon Library"
role: lca-frontend
follow_roles: []
post: [lca-recorder, code-simplifier, lca-gitops]
depends_on: []
inputs:
  - objective.md
  - runs/plan.md
  - frontend/src/components/ui/index.ts
allowed_paths:
  - frontend/**
check_command: make check
handoff: runs/handoffs/task-049.md
---

# Task 049: Frontend SVG Plant Icon Library

## Goal

Create 20 SVG plant icons (top-down line art) and a PlantIcon component that renders the appropriate icon based on plant species. This provides the visual foundation for the Designer Space feature.

## Context

The Designer Space uses a "clean technical" aesthetic with monochrome line art icons viewed from above. Each plant needs a distinct silhouette that is recognizable from a top-down perspective.

**Design constraints:**
- Stroke-only (no fills)
- Monochrome (inherit color from parent via `currentColor`)
- Line weight: 1.5-2px
- Viewbox: 64x64
- Simple geometric forms

## Requirements

### 1. Create SVG Icons Directory

Create directory structure:
```
frontend/src/components/icons/plants/
  monstera.svg
  snake-plant.svg
  pothos.svg
  fiddle-leaf-fig.svg
  spider-plant.svg
  peace-lily.svg
  rubber-plant.svg
  zz-plant.svg
  philodendron.svg
  aloe-vera.svg
  boston-fern.svg
  chinese-evergreen.svg
  dracaena.svg
  jade-plant.svg
  string-of-pearls.svg
  calathea.svg
  bird-of-paradise.svg
  english-ivy.svg
  succulent.svg
  cactus.svg
  unknown.svg  # fallback icon
```

### 2. SVG Icon Specifications

Each icon must follow this template:

```svg
<svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="..." stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
</svg>
```

**Top 20 plants with design notes:**

| # | Plant | Top-Down Description |
|---|-------|---------------------|
| 1 | Monstera Deliciosa | Large split leaves radiating from center, distinctive holes |
| 2 | Snake Plant | Cluster of pointed sword-shaped leaves from center |
| 3 | Pothos | Heart-shaped leaves trailing/cascading |
| 4 | Fiddle Leaf Fig | Large oval leaves with prominent veins |
| 5 | Spider Plant | Long arching fronds radiating outward |
| 6 | Peace Lily | Oval leaves with one central flower spike |
| 7 | Rubber Plant | Large simple oval leaves |
| 8 | ZZ Plant | Compound leaves with oval leaflets on stems |
| 9 | Philodendron | Heart-shaped cluster of leaves |
| 10 | Aloe Vera | Pointed rosette pattern, succulent leaves |
| 11 | Boston Fern | Dense fronds arching in all directions |
| 12 | Chinese Evergreen | Oval pointed leaves from center |
| 13 | Dracaena | Sword-shaped leaves in cluster |
| 14 | Jade Plant | Small round succulent leaves on branches |
| 15 | String of Pearls | Trailing dots/beads pattern |
| 16 | Calathea | Striped oval leaves |
| 17 | Bird of Paradise | Large paddle-shaped leaves |
| 18 | English Ivy | Star-shaped trailing leaves |
| 19 | Succulent | Generic rosette pattern |
| 20 | Cactus | Simple round/oval with spines |
| 21 | Unknown | Generic plant silhouette (fallback) |

### 3. PlantIcon Component

Create `frontend/src/components/designer/PlantIcon.tsx`:

```tsx
interface PlantIconProps {
  species: string;
  size?: number;
  className?: string;
}

export function PlantIcon({ species, size = 48, className }: PlantIconProps) {
  // Map species to icon
  // Return SVG with appropriate size and className
  // Use fallback icon for unknown species
}
```

**Species mapping:**
- Normalize species string (lowercase, remove special chars)
- Match against known species
- Fall back to `unknown.svg` if no match

Example usage:
```tsx
<PlantIcon species="Monstera Deliciosa" size={48} />
<PlantIcon species="snake plant" size={64} className="text-gray-700" />
<PlantIcon species="unknown-variety" size={48} /> // Uses fallback
```

### 4. Export from Components

Add export to `frontend/src/components/designer/index.ts`:

```tsx
export { PlantIcon } from './PlantIcon';
```

### 5. Basic Tests

Create `frontend/src/components/designer/__tests__/PlantIcon.test.tsx`:

```tsx
describe('PlantIcon', () => {
  it('renders monstera icon for monstera species');
  it('renders fallback icon for unknown species');
  it('applies size prop correctly');
  it('applies className correctly');
});
```

## Files to Create

1. `frontend/src/components/icons/plants/*.svg` - 21 SVG icons
2. `frontend/src/components/designer/PlantIcon.tsx` - Component
3. `frontend/src/components/designer/index.ts` - Exports
4. `frontend/src/components/designer/__tests__/PlantIcon.test.tsx` - Tests

## Icon Design Guidelines

**Line Style:**
- Stroke width: 1.5px (thin, elegant)
- Stroke linecap: round
- Stroke linejoin: round
- No fills, only strokes

**Composition:**
- Center the plant in the 64x64 viewbox
- Leave ~4px padding from edges
- Use simple geometric shapes
- Capture distinctive features (monstera holes, aloe spikes, etc.)

**Example Monstera Icon:**
```svg
<svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
  <!-- Large split leaf shape with characteristic holes -->
  <path d="M32 8 C20 12 12 24 14 36 C16 48 24 56 32 56 C40 56 48 48 50 36 C52 24 44 12 32 8" 
        stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
  <circle cx="24" cy="28" r="3" stroke="currentColor" stroke-width="1.5"/>
  <circle cx="40" cy="28" r="3" stroke="currentColor" stroke-width="1.5"/>
  <!-- Splits in leaf -->
  <path d="M32 32 L32 48" stroke="currentColor" stroke-width="1.5"/>
</svg>
```

## Definition of Done

1. 21 SVG icons created (20 plants + 1 fallback)
2. All icons use stroke-only, monochrome style
3. PlantIcon component renders correct icon for species
4. Unknown species use fallback icon
5. Size and className props work correctly
6. Component exported from designer module
7. Tests pass
8. `make check` passes (139 tests)

## Verification

```bash
# Run tests
make check

# Visual verification
# Start dev server and test component in isolation
# Each icon should be clean, recognizable, consistent style
```
