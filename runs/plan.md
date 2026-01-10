# PlantOps Implementation Plan

> Run 005 - Feature 4: UI/UX Refactor

## Run/005 Status: PLANNING

```
┌──────┬─────────────────────────────────────────┬────────┐
│ Task │                  Title                  │ Status │
├──────┼─────────────────────────────────────────┼────────┤
│ 038  │ Semantic Color Token Architecture       │ -      │
├──────┼─────────────────────────────────────────┼────────┤
│ 039  │ Button Component with Variants          │ -      │
├──────┼─────────────────────────────────────────┼────────┤
│ 040  │ StatusBadge Component                   │ -      │
├──────┼─────────────────────────────────────────┼────────┤
│ 041  │ FilterPills Component                   │ -      │
├──────┼─────────────────────────────────────────┼────────┤
│ 042  │ Loading States (Skeletons)              │ -      │
├──────┼─────────────────────────────────────────┼────────┤
│ 043  │ Page Migration (Dashboard, Devices)     │ -      │
├──────┼─────────────────────────────────────────┼────────┤
│ 044  │ Page Migration (Plants, PlantDetail)    │ -      │
├──────┼─────────────────────────────────────────┼────────┤
│ 045  │ Page Migration (Settings, PlantCare)    │ -      │
├──────┼─────────────────────────────────────────┼────────┤
│ 046  │ Accessibility Audit and Focus States    │ -      │
├──────┼─────────────────────────────────────────┼────────┤
│ 047  │ Feature 4 Final QA                      │ -      │
└──────┴─────────────────────────────────────────┴────────┘
```

---

## Previous Runs

### Run/004 Status: COMPLETE
- Feature 3: Production Hardening (tasks 026-037)
- 139 tests passing

### Run/003 Status: COMPLETE
- Feature 1: Core Platform + Feature 2: LLM Care Advisor (tasks 001-025)
- 116 tests passing

---

## Overview

This plan implements Feature 4: UI/UX Refactor for the PlantOps frontend. This is a **frontend-only** run with no backend changes. The goal is to establish a professional, accessible design system with semantic colors and consistent component patterns.

**Scope:** `frontend/` directory only

**Primary Role:** `lca-frontend` for all implementation tasks

**Test Baseline:** 139 tests passing (must not regress)

## Current Problems Identified

Analysis of the codebase reveals:

1. **Color Chaos (60+ instances)**
   - `bg-green-600` used for primary buttons, links, status indicators, and filters
   - `bg-red-600` used for both delete buttons AND error status
   - No semantic meaning to colors

2. **Button Hierarchy Missing**
   - All primary actions are `bg-green-600` (identical appearance)
   - No visual distinction between primary/secondary/tertiary actions
   - Delete and Assign buttons have same weight

3. **Status vs Actions Confused**
   - Status indicators use same color classes as action buttons
   - "Online" status (green dot) and "Assign" button (green text) blur together
   - Filter pills use button styling

4. **Tailwind Tokens Unused**
   - `tailwind.config.js` has `plant.healthy`, `plant.warning`, `plant.danger` defined
   - Zero usage of these tokens in components
   - All 60+ color references are raw utilities

## Architecture

### Three-Tier Token Architecture

```
Layer 1: Primitives (raw values in tailwind.config.js)
  colors.green.500, colors.red.500, colors.yellow.500, etc.

Layer 2: Semantic (intent-based)
  colors.action.primary      -> for main CTAs
  colors.action.secondary    -> for alternative actions
  colors.action.danger       -> for destructive actions
  colors.status.success      -> for healthy/online indicators
  colors.status.warning      -> for caution indicators
  colors.status.error        -> for critical/offline indicators
  colors.status.info         -> for informational indicators

Layer 3: Component (Tailwind CSS classes via @layer)
  btn-primary, btn-secondary, btn-ghost, btn-danger
  status-badge-online, status-badge-offline, status-badge-error
  filter-pill, filter-pill-active
```

### Component Hierarchy

```
frontend/src/components/
  ui/                          # NEW: Design system primitives
    Button.tsx                 # Primary/Secondary/Ghost/Danger variants
    StatusBadge.tsx            # Dot + text for status indicators
    FilterPills.tsx            # Toggle pattern for filters
    Skeleton.tsx               # Loading skeletons
    cn.ts                      # Class name utility (clsx + tailwind-merge)

  # Existing components (will use new ui/ primitives)
  PlantCard.tsx
  DeviceTable.tsx
  CreatePlantModal.tsx
  ...
```

## Design Decisions

### Color Mapping

| Current (Raw) | New (Semantic) | Usage |
|---------------|----------------|-------|
| `bg-green-600` (buttons) | `btn-primary` | Primary CTAs |
| `bg-green-600` (filters) | `filter-pill-active` | Active filter state |
| `text-green-600` (links) | `text-action-primary` | Action links |
| `bg-green-500` (status) | `status-badge-online` | Online/healthy status |
| `bg-red-600` (delete) | `btn-danger` | Destructive actions |
| `text-red-600` (status) | `status-badge-error` | Error/offline status |
| `bg-yellow-500` (status) | `status-badge-warning` | Warning status |

### Button Variants

```tsx
<Button variant="primary">Add Plant</Button>      // Filled, brand color
<Button variant="secondary">Cancel</Button>       // Outlined/subtle
<Button variant="ghost">View Details</Button>     // Text-only
<Button variant="danger">Delete</Button>          // Filled red, destructive
```

### StatusBadge vs Button

```tsx
// STATUS: Shows state, not clickable
<StatusBadge status="online" />      // Green dot + "Online"
<StatusBadge status="offline" />     // Gray dot + "Offline"
<StatusBadge status="error" />       // Red dot + "Error"

// ACTION: Triggers behavior, clickable
<Button variant="primary">Assign</Button>
<Button variant="danger">Delete</Button>
```

### FilterPills Pattern

```tsx
// Toggle pattern, NOT action buttons
<FilterPills
  options={['All', 'Online', 'Offline', 'Unassigned']}
  value={filter}
  onChange={setFilter}
/>
```

## Implementation Phases

### Phase 19: Design System Foundation (Tasks 038-041)
- Semantic color tokens in tailwind.config.js
- Button component with variants
- StatusBadge component
- FilterPills component

### Phase 20: Page Migration (Tasks 042-045)
- Loading skeletons for tables and cards
- Dashboard and Devices page migration
- Plants and PlantDetail page migration
- Settings and PlantCare page migration

### Phase 21: Accessibility and QA (Tasks 046-047)
- Focus states on all interactive elements
- Contrast ratio verification
- Final visual review
- Test validation

## Documentation

Documentation updates for `docs/`:

- `docs/design-system.md` - Design system documentation (NEW)
  - Sections: Color Tokens, Button Variants, Status Indicators, Loading States
  - Created by: task-047

No updates needed for existing docs (backend unchanged).

## Task Outline

### Feature 4: UI/UX Refactor

| ID | Title | Role | Depends On |
|----|-------|------|------------|
| 038 | Semantic Color Token Architecture | frontend | - |
| 039 | Button Component with Variants | frontend | 038 |
| 040 | StatusBadge Component | frontend | 038 |
| 041 | FilterPills Component | frontend | 038 |
| 042 | Loading States (Skeletons) | frontend | 038 |
| 043 | Page Migration (Dashboard, Devices) | frontend | 039, 040, 041, 042 |
| 044 | Page Migration (Plants, PlantDetail) | frontend | 043 |
| 045 | Page Migration (Settings, PlantCare) | frontend | 044 |
| 046 | Accessibility Audit and Focus States | frontend | 045 |
| 047 | Feature 4 Final QA | qa | 046 |

## Risks and Mitigations

| Risk | Mitigation |
|------|------------|
| Visual regression | Take screenshots before/after each page migration |
| Breaking existing tests | Run `make check` after each task |
| Inconsistent migration | Complete page-by-page, not partial |
| Color contrast failures | Use contrast checker tool during implementation |
| Scope creep | Strictly frontend-only, no backend changes |

## Success Criteria (Feature 4)

From objective.md Definition of Done:

**Color System:**
- [ ] 3-layer token architecture in tailwind.config.js
- [ ] No raw color utilities in components (no `bg-green-600`)
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

## Skills Reference

Design skills available in `.claude/skills/`:
- `color-theory` - Semantic colors, contrast, 60-30-10 rule
- `design-systems` - Token architecture, three-tier structure
- `ui-design` - Component patterns, hierarchy, 8pt grid
- `ux-design` - Loading states, error recovery, zero-state design
- `tailwind-css` - Custom config, cn utility, component extraction

---

*Generated by lca-planner for run/005*
