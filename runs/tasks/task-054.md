---
task_id: task-054
title: "Copy Assets & Create PlantImage Component"
role: lca-frontend
follow_roles: []
post: [lca-recorder, code-simplifier, lca-gitops]
depends_on: []
inputs:
  - objective.md
  - runs/plan.md
  - plants-png/room.png
  - plants-png/*.png
  - frontend/src/components/designer/PlantIcon.tsx
allowed_paths:
  - frontend/**
  - plants-png/**
check_command: make check
handoff: runs/handoffs/task-054.md
---

# Task 054: Copy Assets & Create PlantImage Component

## Goal

Copy all pre-created PNG assets from `plants-png/` to `frontend/src/assets/` and create a new PlantImage component that renders botanically accurate plant illustrations based on species name.

## Context

Feature 6 transforms the Designer Space from SVG line art to PNG illustrations. All assets have been pre-created using Google Gemini and are ready in `plants-png/`:
- `room.png` - Scandinavian room background (~10MB)
- 20 plant PNG files (~6-9MB each)

The existing `PlantIcon.tsx` component uses SVG files. The new `PlantImage.tsx` component will use PNG images with a similar API but different visual style.

## Requirements

### 1. Copy Assets

Copy files from `plants-png/` to `frontend/src/assets/`:

```bash
# Create directories
mkdir -p frontend/src/assets/plants

# Copy room background
cp plants-png/room.png frontend/src/assets/

# Copy all plant PNGs
cp plants-png/monstera.png frontend/src/assets/plants/
cp plants-png/snakeplant.png frontend/src/assets/plants/
cp plants-png/pothos.png frontend/src/assets/plants/
cp plants-png/fiddle.png frontend/src/assets/plants/
cp plants-png/spider.png frontend/src/assets/plants/
cp plants-png/peacelily.png frontend/src/assets/plants/
cp plants-png/rubber.png frontend/src/assets/plants/
cp plants-png/zzplant.png frontend/src/assets/plants/
cp plants-png/philondendron.png frontend/src/assets/plants/
cp plants-png/aloevera.png frontend/src/assets/plants/
cp plants-png/boston.png frontend/src/assets/plants/
cp plants-png/chinese.png frontend/src/assets/plants/
cp plants-png/dracaena.png frontend/src/assets/plants/
cp plants-png/jade.png frontend/src/assets/plants/
cp plants-png/stringofpearls.png frontend/src/assets/plants/
cp plants-png/calathea.png frontend/src/assets/plants/
cp plants-png/birdofparadise.png frontend/src/assets/plants/
cp plants-png/englishivy.png frontend/src/assets/plants/
cp plants-png/succulenta.png frontend/src/assets/plants/
cp plants-png/cactus.png frontend/src/assets/plants/
```

### 2. Create PlantImage Component

Create `frontend/src/components/designer/PlantImage.tsx`:

```typescript
/**
 * PlantImage Component
 *
 * Renders PNG plant illustrations based on species name.
 * Used in the Scandinavian Room View for botanically accurate plant images.
 *
 * @example
 * ```tsx
 * <PlantImage species="Monstera Deliciosa" size="medium" />
 * <PlantImage species="snake plant" size="small" />
 * <PlantImage species="unknown-variety" /> // Uses fallback
 * ```
 */

export interface PlantImageProps {
  /** Plant species name (normalized for matching) */
  species: string;
  /** Size variant: small (shelf), medium (sideboard), large (floor) */
  size?: 'small' | 'medium' | 'large';
  /** Additional CSS classes */
  className?: string;
  /** Alt text override */
  alt?: string;
}

// Size dimensions in pixels
const SIZE_MAP = {
  small: { width: 80, height: 100 },
  medium: { width: 120, height: 150 },
  large: { width: 160, height: 200 },
};

// Species to filename mapping
const IMAGE_MAP: Record<string, string> = {
  'monstera': 'monstera.png',
  'monstera deliciosa': 'monstera.png',
  'snake plant': 'snakeplant.png',
  'snakeplant': 'snakeplant.png',
  'sansevieria': 'snakeplant.png',
  'pothos': 'pothos.png',
  'devils ivy': 'pothos.png',
  'fiddle leaf fig': 'fiddle.png',
  'ficus lyrata': 'fiddle.png',
  'spider plant': 'spider.png',
  'chlorophytum': 'spider.png',
  'peace lily': 'peacelily.png',
  'spathiphyllum': 'peacelily.png',
  'rubber plant': 'rubber.png',
  'ficus elastica': 'rubber.png',
  'zz plant': 'zzplant.png',
  'zamioculcas': 'zzplant.png',
  'philodendron': 'philondendron.png',
  'aloe vera': 'aloevera.png',
  'aloe': 'aloevera.png',
  'boston fern': 'boston.png',
  'fern': 'boston.png',
  'chinese evergreen': 'chinese.png',
  'aglaonema': 'chinese.png',
  'dracaena': 'dracaena.png',
  'dragon tree': 'dracaena.png',
  'jade plant': 'jade.png',
  'jade': 'jade.png',
  'crassula': 'jade.png',
  'string of pearls': 'stringofpearls.png',
  'senecio': 'stringofpearls.png',
  'calathea': 'calathea.png',
  'prayer plant': 'calathea.png',
  'bird of paradise': 'birdofparadise.png',
  'strelitzia': 'birdofparadise.png',
  'english ivy': 'englishivy.png',
  'ivy': 'englishivy.png',
  'hedera': 'englishivy.png',
  'succulent': 'succulenta.png',
  'echeveria': 'succulenta.png',
  'cactus': 'cactus.png',
  'cacti': 'cactus.png',
};

// Default fallback image (use monstera as generic plant)
const FALLBACK_IMAGE = 'monstera.png';
```

### 3. Image Import Strategy

Use dynamic imports or static imports depending on bundle strategy:

```typescript
// Static imports for better tree-shaking
import monsteraImg from '../../assets/plants/monstera.png';
import snakeplantImg from '../../assets/plants/snakeplant.png';
// ... etc

// Or use a URL-based approach
function getPlantImageUrl(filename: string): string {
  return `/assets/plants/${filename}`;
}
```

### 4. Component Features

- **Species normalization**: lowercase, remove special chars (same as PlantIcon)
- **Size variants**: small (80x100), medium (120x150), large (160x200)
- **Loading state**: Show placeholder while image loads
- **Error handling**: Fallback to generic plant if image fails to load
- **Alt text**: Automatically generated from species name

### 5. Tests

Create `frontend/src/components/designer/__tests__/PlantImage.test.tsx`:

```typescript
describe('PlantImage', () => {
  it('renders image for known species', () => {
    render(<PlantImage species="Monstera" />);
    const img = screen.getByRole('img');
    expect(img).toHaveAttribute('alt', expect.stringContaining('Monstera'));
  });

  it('uses fallback for unknown species', () => {
    render(<PlantImage species="unknown-plant-xyz" />);
    const img = screen.getByRole('img');
    expect(img).toBeInTheDocument();
  });

  it('applies correct size dimensions', () => {
    render(<PlantImage species="Pothos" size="large" />);
    const img = screen.getByRole('img');
    expect(img).toHaveStyle({ width: '160px', height: '200px' });
  });

  it('normalizes species names', () => {
    render(<PlantImage species="SNAKE PLANT" />);
    const img = screen.getByRole('img');
    expect(img).toHaveAttribute('src', expect.stringContaining('snakeplant'));
  });
});
```

### 6. Export from Index

Update `frontend/src/components/designer/index.ts`:

```typescript
export { PlantImage } from './PlantImage';
export type { PlantImageProps } from './PlantImage';
```

## Constraints

- Do NOT regenerate any PNG files - use existing assets from `plants-png/`
- Do NOT remove PlantIcon.tsx - it may be used as fallback
- Large image files: consider lazy loading strategy
- Maintain consistent API with PlantIcon where possible

## Files to Create/Modify

1. `frontend/src/assets/room.png` - COPY from plants-png/
2. `frontend/src/assets/plants/*.png` - COPY from plants-png/
3. `frontend/src/components/designer/PlantImage.tsx` - CREATE
4. `frontend/src/components/designer/__tests__/PlantImage.test.tsx` - CREATE
5. `frontend/src/components/designer/index.ts` - MODIFY (add export)

## Definition of Done

1. All 21 PNG files copied to `frontend/src/assets/`
2. PlantImage component created with species mapping
3. All 20 plant species map to correct images
4. Fallback works for unknown species
5. Size variants (small/medium/large) work correctly
6. Tests pass for PlantImage component
7. `make check` passes (142+ tests)

## Verification

```bash
# Verify assets copied
ls frontend/src/assets/room.png
ls frontend/src/assets/plants/*.png | wc -l  # Should be 20

# Run tests
cd frontend && npm test -- PlantImage

# Full check
make check
```
