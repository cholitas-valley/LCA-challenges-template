# Handoff: Task 054 - Copy Assets & Create PlantImage Component

## Summary

Successfully copied all PNG assets from `plants-png/` to `frontend/src/assets/` and created the PlantImage component for rendering botanically accurate plant illustrations.

## Files Touched

### Assets Copied
- `frontend/src/assets/room.png` - Scandinavian room background (~10MB)
- `frontend/src/assets/plants/` - 20 plant PNG files:
  - monstera.png, snakeplant.png, pothos.png, fiddle.png, spider.png
  - peacelily.png, rubber.png, zzplant.png, philondendron.png, aloevera.png
  - boston.png, chinese.png, dracaena.png, jade.png, stringofpearls.png
  - calathea.png, birdofparadise.png, englishivy.png, succulenta.png, cactus.png

### Components Created
- `frontend/src/components/designer/PlantImage.tsx` - PNG-based plant image component

### Tests Created
- `frontend/src/components/designer/__tests__/PlantImage.test.tsx` - Comprehensive tests

### Modified
- `frontend/src/components/designer/index.ts` - Added PlantImage export

## Component Features

### PlantImage Component

1. **Props Interface**:
   - `species: string` - Plant species name (normalized for matching)
   - `size?: 'small' | 'medium' | 'large'` - Size variant (default: 'medium')
   - `className?: string` - Additional CSS classes
   - `alt?: string` - Alt text override

2. **Size Variants**:
   - Small: 80x100px (for shelf placement)
   - Medium: 120x150px (for sideboard placement)
   - Large: 160x200px (for floor placement)

3. **Species Mapping**:
   - Comprehensive mapping for all 20 plant species
   - Multiple name variations supported (e.g., "snake plant", "snakeplant", "sansevieria")
   - Fallback to monstera for unknown species

4. **Loading/Error Handling**:
   - Loading placeholder while image loads
   - Fallback to monstera if image fails to load
   - Lazy loading enabled for performance

5. **Exported Utilities**:
   - `normalizeSpecies()` - Normalize species strings
   - `getPlantImage()` - Get image URL for species
   - `IMAGE_MAP` - Species-to-image mapping
   - `SIZE_MAP` - Size dimensions
   - `FALLBACK_IMAGE` - Fallback image URL

## How to Verify

```bash
# Verify assets copied (21 files total: 1 room + 20 plants)
ls frontend/src/assets/room.png
ls frontend/src/assets/plants/*.png | wc -l  # Should be 20

# Run full check
make check

# Build frontend (includes type checking)
cd frontend && npm run build
```

## Test Coverage

Tests cover:
- Species normalization (case, special chars, whitespace)
- Image lookup with fallback
- All 20 plant species mapped
- Size variants (small, medium, large)
- Custom className and alt text
- Lazy loading attribute
- Load and error event handling

Note: Frontend vitest is not configured in this project. Tests are prepared for when vitest is added. The `make check` command runs backend tests + frontend build (TypeScript type checking), which both pass.

## Interfaces/Contracts

```typescript
export interface PlantImageProps {
  species: string;
  size?: 'small' | 'medium' | 'large';
  className?: string;
  alt?: string;
}
```

## Risks/Follow-ups

1. **Large Asset Size**: Each plant PNG is 6-9MB. The build output shows all images included. Consider:
   - Implementing dynamic imports for code splitting
   - Converting to WebP format for smaller file sizes
   - Using a CDN for production

2. **No Frontend Test Runner**: vitest is not yet configured. Tests exist but cannot be run until vitest is added to the project.

3. **PlantIcon Still Available**: The existing PlantIcon component (SVG-based) is preserved and can be used as fallback for lighter-weight rendering.
