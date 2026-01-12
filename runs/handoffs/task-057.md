# Task 057 Handoff: Cozy Tooltips & Status Indicators

## Summary

Implemented warm, Scandinavian-styled tooltips and subtle status indicators for the plant room view. Added new color tokens for the cozy design system, created CozyTooltip and StatusRing components, and integrated them into PlantSpot and ScandinavianCanvas.

## Files Touched

### Created
- `/home/genge/dev-ash/foundry-nodevenv/cholitas/challenge-001-plantops/frontend/src/components/designer/CozyTooltip.tsx` - Warm cream tooltip with emoji-decorated sensor readings
- `/home/genge/dev-ash/foundry-nodevenv/cholitas/challenge-001-plantops/frontend/src/components/designer/StatusRing.tsx` - Subtle colored ring around plant pots
- `/home/genge/dev-ash/foundry-nodevenv/cholitas/challenge-001-plantops/frontend/src/components/designer/__tests__/CozyTooltip.test.tsx` - Test suite for CozyTooltip

### Modified
- `/home/genge/dev-ash/foundry-nodevenv/cholitas/challenge-001-plantops/frontend/tailwind.config.js` - Added Scandinavian color tokens (cream, sage, birch, status-cozy)
- `/home/genge/dev-ash/foundry-nodevenv/cholitas/challenge-001-plantops/frontend/src/components/designer/PlantSpot.tsx` - Added StatusRing wrapper, hover scale transitions, offline opacity
- `/home/genge/dev-ash/foundry-nodevenv/cholitas/challenge-001-plantops/frontend/src/components/designer/ScandinavianCanvas.tsx` - Added tooltip state and CozyTooltip rendering on hover
- `/home/genge/dev-ash/foundry-nodevenv/cholitas/challenge-001-plantops/frontend/src/components/designer/index.ts` - Added exports for CozyTooltip and StatusRing

## Components Added/Modified

### CozyTooltip
- Warm cream background (#FFFBF5)
- Plant name with plant emoji
- Status badge (Thriving/Needs attention/Help needed/No sensor data)
- Sensor readings with emojis (soil, temp, humidity, light)
- Human-readable light levels (Low/Medium/Good/Bright)
- "Updated X ago" timestamp using existing formatRelativeTime
- Tooltip arrow pointing down
- Accessible (role="tooltip", aria-label)

### StatusRing
- Subtle colored ring around plant pots
- Muted Scandinavian colors:
  - Sage green (online/healthy)
  - Amber (warning)
  - Rose (critical)
  - Grey (offline)
- Size variants (small/medium/large)
- Soft glow effect via shadow classes
- Reduced opacity for offline plants

### PlantSpot Updates
- Wrapped plant images with StatusRing
- Added hover scale transitions (200ms ease-out)
- scale-105 on hover in view mode
- scale-110 on hover in edit mode
- Offline plants have 60% opacity

### ScandinavianCanvas Updates
- Added tooltipPlant state
- CozyTooltip renders on plant hover
- Tooltip position follows hovered spot coordinates

### Tailwind Color Tokens
- cream: { 50, 100, 200 } - Warm cream palette
- sage: { 50, 100, 200, 300, 500, 700 } - Nordic green
- birch: { 50, 100, 200 } - Light neutral
- status-cozy: { success, warning, error, neutral } - Muted status colors

## How to Verify

```bash
# Run full check (backend tests + frontend build)
make check

# Manual verification:
# 1. Start dev server: cd frontend && npm run dev
# 2. Navigate to room view page
# 3. Hover over a plant - cozy tooltip should appear
# 4. Check tooltip styling:
#    - Cream background (#FFFBF5)
#    - Rounded corners (xl)
#    - Plant emoji and name
#    - Status badge with color
#    - Sensor readings with emojis
#    - "Updated X ago" timestamp
#    - Arrow pointing down
# 5. Verify status ring colors are muted
# 6. Check offline plants appear faded (60% opacity)
# 7. Verify smooth hover scale animation (200ms)
```

## Definition of Done Checklist

- [x] CozyTooltip renders with warm cream background (#FFFBF5)
- [x] Sensor readings display with emoji icons
- [x] Status badge shows human-readable status text
- [x] StatusRing wraps plants with subtle colored glow
- [x] Offline plants are visually faded (opacity-60)
- [x] Hover transitions are smooth (200ms duration-200)
- [x] Test file created for CozyTooltip
- [x] `make check` passes (142 backend tests, frontend builds)

## Risks / Follow-ups

1. **Date-fns dependency**: Task specified date-fns but it's not installed. Used existing `formatRelativeTime` from `plantStatus.ts` instead.

2. **Frontend tests not in CI**: Test file created following existing patterns, but vitest is not configured in package.json. Tests serve as documentation/specification.

3. **Tooltip overflow**: Tooltip may overflow canvas bounds at edge positions. Future enhancement could add boundary detection.

4. **Ring appearance on non-circular plants**: StatusRing uses rounded-full which works best for circular containers. Plant images with different aspect ratios may show ring unevenly.
