# PlantOps Design System

This document describes the design tokens, components, and usage guidelines for the PlantOps frontend.

## Overview

The PlantOps design system is built on a **3-layer semantic color token architecture** that ensures:
- **Consistency**: All interactive elements use the same color language
- **Clarity**: Status indicators are visually distinct from action buttons
- **Accessibility**: Color contrast meets WCAG AA standards (4.5:1 minimum)
- **Maintainability**: Changes propagate through semantic tokens

## Color Token Architecture

### Layer 1: Primitives
Tailwind's default color palette (green, red, yellow, blue, gray). These are **never used directly** in components.

### Layer 2: Semantic Tokens
Purpose-based tokens defined in `tailwind.config.js`:
- **action.\*** - For interactive elements (buttons, links, form controls)
- **status.\*** - For non-interactive indicators (badges, alerts, status dots)

### Layer 3: Component Styles
Components apply semantic tokens via Tailwind classes.

---

## Color Tokens

### Action Colors

Used for **interactive elements** (buttons, links, form controls).

| Token | Value | Usage | Example |
|-------|-------|-------|---------|
| `action-primary` | `#16a34a` | Primary CTAs, main actions | "Add Plant", "Save" |
| `action-primary-hover` | `#15803d` | Primary button hover state | - |
| `action-primary-text` | `#ffffff` | Text on primary background | - |
| `action-secondary` | `#f3f4f6` | Secondary actions, alternative | "Cancel", "Back" |
| `action-secondary-hover` | `#e5e7eb` | Secondary button hover state | - |
| `action-secondary-text` | `#374151` | Text on secondary background | - |
| `action-secondary-border` | `#d1d5db` | Secondary button border | - |
| `action-danger` | `#dc2626` | Destructive actions only | "Delete", "Remove" |
| `action-danger-hover` | `#b91c1c` | Danger button hover state | - |
| `action-danger-text` | `#ffffff` | Text on danger background | - |
| `action-ghost` | `transparent` | Tertiary actions, minimal weight | "View Details" |
| `action-ghost-hover` | `#f3f4f6` | Ghost button hover state | - |
| `action-ghost-text` | `#374151` | Text on ghost buttons | - |

**Usage in code:**
```tsx
// Primary button
<button className="bg-action-primary hover:bg-action-primary-hover text-action-primary-text">
  Save
</button>

// Or use the Button component
<Button variant="primary">Save</Button>
```

### Status Colors

Used for **non-interactive indicators** (badges, alerts, status dots).

| Token | Value | Usage | Example |
|-------|-------|-------|---------|
| `status-success` | `#22c55e` | Positive states | Online, healthy, completed |
| `status-success-light` | `#dcfce7` | Success background | Badge background |
| `status-success-text` | `#166534` | Success text (WCAG AA) | Badge text |
| `status-warning` | `#eab308` | Caution states | Degraded, needs attention |
| `status-warning-light` | `#fef9c3` | Warning background | Badge background |
| `status-warning-text` | `#854d0e` | Warning text (WCAG AA) | Badge text |
| `status-error` | `#ef4444` | Error states | Offline, failed, critical |
| `status-error-light` | `#fee2e2` | Error background | Badge background |
| `status-error-text` | `#991b1b` | Error text (WCAG AA) | Badge text |
| `status-info` | `#3b82f6` | Informational states | Tips, notes |
| `status-info-light` | `#dbeafe` | Info background | Badge background |
| `status-info-text` | `#1e40af` | Info text (WCAG AA) | Badge text |
| `status-neutral` | `#9ca3af` | Neutral states | Disabled, unknown |
| `status-neutral-light` | `#f3f4f6` | Neutral background | Badge background |
| `status-neutral-text` | `#374151` | Neutral text (WCAG AA) | Badge text |

**Usage in code:**
```tsx
// Success badge
<span className="bg-status-success-light text-status-success-text">
  Online
</span>

// Or use the StatusBadge component
<StatusBadge status="online" />
```

### Action vs Status: Key Differences

| Aspect | Action Colors | Status Colors |
|--------|---------------|---------------|
| **Purpose** | Trigger actions | Display state |
| **Interactive** | Yes (clickable) | No (read-only) |
| **Green Usage** | Primary buttons, CTAs | Healthy/online indicators |
| **Red Usage** | Delete/remove buttons | Error/offline indicators |
| **Example** | "Assign Device" button | "Online" status badge |

**IMPORTANT:** Never mix action and status colors. An "Online" badge should never be clickable, and a "Delete" button should never be used to show error state.

---

## Components

### Button

The primary interactive component with 4 variants.

**Props:**
```tsx
interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  disabled?: boolean;
}
```

**Variants:**

| Variant | Visual | Usage | Example |
|---------|--------|-------|---------|
| `primary` | Green filled | Main CTA (one per section max) | "Add Plant", "Save Changes" |
| `secondary` | Gray outlined | Alternative actions | "Cancel", "Back" |
| `ghost` | Transparent | Tertiary actions, navigation | "View Details", breadcrumbs |
| `danger` | Red filled | Destructive actions only | "Delete Plant", "Remove Device" |

**Examples:**
```tsx
import { Button } from '@/components/ui';

// Primary button
<Button variant="primary">Add Plant</Button>

// Secondary button
<Button variant="secondary">Cancel</Button>

// Ghost button (minimal)
<Button variant="ghost">View Details</Button>

// Danger button (destructive)
<Button variant="danger">Delete</Button>

// With loading state
<Button loading>Saving...</Button>

// Different sizes
<Button size="sm">Small</Button>
<Button size="md">Medium</Button>  {/* Default */}
<Button size="lg">Large</Button>
```

**Button Hierarchy Guidelines:**
1. **One primary per section**: Each logical section should have at most one primary button
2. **Secondary for alternatives**: Use secondary for cancel, back, or alternative actions
3. **Ghost for low priority**: Use ghost for tertiary actions that don't need emphasis
4. **Danger sparingly**: Only for destructive, irreversible actions

**Accessibility:**
- All buttons have visible focus states: `focus:ring-2`
- Loading state disables interaction and shows spinner
- Disabled state reduces opacity to 50%

---

### StatusBadge

Displays non-interactive status indicators with color and text.

**Props:**
```tsx
interface StatusBadgeProps {
  status: 'online' | 'offline' | 'error' | 'warning' | 'provisioning' | 'info';
  label?: string;          // Override default label
  showDot?: boolean;       // Show colored dot (default: true)
  size?: 'sm' | 'md';      // Size variant (default: 'md')
}
```

**Status Types:**

| Status | Color | Default Label | Usage |
|--------|-------|---------------|-------|
| `online` | Green | "Online" | Device/service is active and healthy |
| `offline` | Gray | "Offline" | Device/service is inactive |
| `error` | Red | "Error" | Critical failure or error state |
| `warning` | Yellow | "Warning" | Degraded state or needs attention |
| `provisioning` | Yellow | "Provisioning" | Setup in progress |
| `info` | Blue | "Info" | Informational state |

**Examples:**
```tsx
import { StatusBadge } from '@/components/ui';

// Basic status badges
<StatusBadge status="online" />
<StatusBadge status="offline" />
<StatusBadge status="error" />
<StatusBadge status="warning" />

// Custom label
<StatusBadge status="online" label="Active" />

// Without dot
<StatusBadge status="error" showDot={false} />

// Small size
<StatusBadge status="online" size="sm" />
```

**Accessibility:**
- Each badge has `role="status"` for screen readers
- ARIA label announces "Status: {label}"
- Text labels ensure color is not the only indicator
- Color contrast meets WCAG AA (4.5:1 on light backgrounds)

**Do NOT use for:**
- Interactive elements (use Button instead)
- Counts or metrics (use plain text or custom span)
- Filter toggles (use FilterPills instead)

---

### FilterPills

Toggle/selection component for filtering content. Visually distinct from buttons.

**Props:**
```tsx
interface FilterOption<T extends string = string> {
  value: T;
  label: string;
  count?: number;  // Optional count to display
}

interface FilterPillsProps<T extends string = string> {
  options: FilterOption<T>[];
  value: T;
  onChange: (value: T) => void;
}
```

**Examples:**
```tsx
import { FilterPills } from '@/components/ui';

// Status filter
type StatusFilter = 'all' | 'online' | 'offline';

const statusOptions: FilterOption<StatusFilter>[] = [
  { value: 'all', label: 'All', count: 10 },
  { value: 'online', label: 'Online', count: 6 },
  { value: 'offline', label: 'Offline', count: 4 },
];

<FilterPills
  options={statusOptions}
  value={filter}
  onChange={setFilter}
/>

// Simple filter without counts
const viewOptions = [
  { value: 'grid', label: 'Grid' },
  { value: 'list', label: 'List' },
];

<FilterPills
  options={viewOptions}
  value={view}
  onChange={setView}
/>
```

**Visual Differences from Buttons:**

| Aspect | FilterPills | Button (primary) |
|--------|-------------|------------------|
| Shape | Pill (fully rounded) | Rounded corners |
| Active state | Dark gray fill | Brand green fill |
| Inactive state | Light gray | N/A (buttons are always "active") |
| Purpose | Toggle selection | Trigger action |
| Group behavior | Radio group (one selected) | Standalone |

**Accessibility:**
- Uses `role="group"` with `aria-label="Filter options"`
- Each pill has `role="radio"` and `aria-checked`
- Visible focus rings on keyboard navigation
- Active state clearly distinguished

---

### Skeleton

Loading placeholder components that maintain layout during data fetching.

**Components:**
```tsx
// Base skeleton (build your own)
<Skeleton className="h-4 w-full" />

// Pre-built patterns
<SkeletonCard />
<SkeletonCardGrid count={6} />
<SkeletonTable rows={5} columns={6} />
<SkeletonTableRow columns={5} />
```

**Examples:**
```tsx
import { 
  Skeleton, 
  SkeletonCard, 
  SkeletonCardGrid, 
  SkeletonTable 
} from '@/components/ui';

// Loading cards
{isLoading ? (
  <SkeletonCardGrid count={6} />
) : (
  <div className="grid grid-cols-3 gap-6">
    {plants.map(plant => <PlantCard key={plant.id} plant={plant} />)}
  </div>
)}

// Loading table
{isLoading ? (
  <SkeletonTable rows={5} columns={4} />
) : (
  <table>
    {/* actual table content */}
  </table>
)}

// Custom skeleton
<div className="space-y-4">
  <Skeleton className="h-8 w-1/3" />
  <Skeleton className="h-4 w-full" />
  <Skeleton className="h-4 w-5/6" />
</div>
```

**Design Principles:**
- Match the shape and size of the actual content
- Use gray-200 background with pulse animation
- Maintain layout to prevent content shift
- Users with `prefers-reduced-motion` see static skeletons

---

## Accessibility Features

### Focus States
All interactive elements have visible focus indicators:
- **Buttons**: `focus:ring-2 focus:ring-offset-2 focus:ring-{color}`
- **Links**: `focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-action-primary`
- **Form inputs**: `focus:ring-2 focus:ring-action-primary focus:border-action-primary`
- **FilterPills**: `focus:ring-2 focus:ring-offset-1 focus:ring-gray-400`

### Color Contrast
All color combinations meet **WCAG AA** standards (4.5:1 minimum):
- Primary button: `#16a34a` on white text (meets AA)
- Danger button: `#dc2626` on white text (meets AA)
- Status badges: All use `*-800` text on `*-100` backgrounds (meets AA)
- Body text: `gray-900` on white (>4.5:1)

### ARIA Labels
- **StatusBadge**: `role="status"` with `aria-label="Status: {label}"`
- **FilterPills**: `role="group"` with `aria-label="Filter options"`
- Individual pills: `role="radio"` with `aria-checked`

### Skip Link
The Layout component includes a skip-to-content link:
```tsx
<a 
  href="#main-content"
  className="sr-only focus:not-sr-only"
>
  Skip to content
</a>
```
- Visually hidden until focused (keyboard users)
- Allows skipping navigation and jumping to main content

### Reduced Motion
Users with `prefers-reduced-motion: reduce` system preference see:
- No pulse animations (skeletons render statically)
- No spin animations
- No transition animations

Defined in `frontend/src/index.css`:
```css
@media (prefers-reduced-motion: reduce) {
  .animate-pulse { animation: none; }
  .animate-spin { animation: none; }
  .transition-colors, .transition { transition: none; }
}
```

---

## Usage Guidelines

### When to Use Each Component

| Component | Use When | Don't Use When |
|-----------|----------|----------------|
| **Button (primary)** | Main CTA, critical action | More than 1 per section |
| **Button (secondary)** | Alternative action, cancel | Destructive actions |
| **Button (ghost)** | Tertiary action, navigation | Main CTA |
| **Button (danger)** | Destructive, irreversible | Error status display |
| **StatusBadge** | Display-only state | Clickable element |
| **FilterPills** | Toggle filters, selections | Trigger actions |
| **Skeleton** | Loading state | Error state |

### Color Usage Rules

1. **Never use raw utilities**
   ```tsx
   // ❌ BAD
   <button className="bg-green-600 text-white">Save</button>
   
   // ✅ GOOD
   <Button variant="primary">Save</Button>
   ```

2. **Separate actions from status**
   ```tsx
   // ❌ BAD - Status badge that's clickable
   <button className="bg-status-success-light">Online</button>
   
   // ✅ GOOD - Separate status and action
   <StatusBadge status="online" />
   <Button variant="secondary">View Details</Button>
   ```

3. **One primary button per section**
   ```tsx
   // ❌ BAD - Too many primary buttons
   <div>
     <Button variant="primary">Save</Button>
     <Button variant="primary">Save & Continue</Button>
   </div>
   
   // ✅ GOOD - One primary, one secondary
   <div>
     <Button variant="primary">Save</Button>
     <Button variant="secondary">Cancel</Button>
   </div>
   ```

4. **Danger for destructive only**
   ```tsx
   // ❌ BAD - Using danger for all red actions
   <Button variant="danger">Stop Monitoring</Button>
   
   // ✅ GOOD - Danger only for destructive
   <Button variant="danger">Delete Plant</Button>
   <Button variant="secondary">Stop Monitoring</Button>
   ```

### Component Composition Examples

**Form with buttons:**
```tsx
<form onSubmit={handleSubmit}>
  {/* Form fields */}
  <div className="flex gap-3">
    <Button type="submit" variant="primary" loading={isSubmitting}>
      Save Changes
    </Button>
    <Button type="button" variant="secondary" onClick={onCancel}>
      Cancel
    </Button>
  </div>
</form>
```

**List with status and actions:**
```tsx
<div className="flex items-center justify-between">
  <div className="flex items-center gap-3">
    <h3>{device.name}</h3>
    <StatusBadge status={device.status} />
  </div>
  <div className="flex gap-2">
    <Button variant="ghost" size="sm">View</Button>
    <Button variant="danger" size="sm">Remove</Button>
  </div>
</div>
```

**Filter with pills:**
```tsx
<div className="space-y-4">
  <FilterPills
    options={filterOptions}
    value={filter}
    onChange={setFilter}
  />
  
  {isLoading ? (
    <SkeletonCardGrid count={6} />
  ) : (
    <div className="grid grid-cols-3 gap-6">
      {filteredItems.map(item => <Card key={item.id} {...item} />)}
    </div>
  )}
</div>
```

---

## Migration Guide

If you're updating existing components to use the design system:

### 1. Replace raw color utilities
```tsx
// Before
<button className="bg-green-600 hover:bg-green-700 text-white">

// After
<Button variant="primary">
```

### 2. Separate status from actions
```tsx
// Before
<span className="bg-green-600 text-white">Online</span>

// After
<StatusBadge status="online" />
```

### 3. Use FilterPills for toggles
```tsx
// Before
<div className="flex gap-2">
  <button className={filter === 'all' ? 'bg-green-600' : 'bg-gray-200'}>
    All
  </button>
  {/* ... */}
</div>

// After
<FilterPills options={options} value={filter} onChange={setFilter} />
```

### 4. Add loading states
```tsx
// Before
{!data && <div>Loading...</div>}
{data && <Table data={data} />}

// After
{!data && <SkeletonTable rows={5} columns={4} />}
{data && <Table data={data} />}
```

---

## File Locations

- **Color tokens**: `frontend/tailwind.config.js`
- **Components**:
  - `frontend/src/components/ui/Button.tsx`
  - `frontend/src/components/ui/StatusBadge.tsx`
  - `frontend/src/components/ui/FilterPills.tsx`
  - `frontend/src/components/ui/Skeleton.tsx`
  - `frontend/src/components/ui/index.ts` (exports)
- **Global styles**: `frontend/src/index.css` (reduced motion)

---

## References

- [WCAG 2.1 Level AA](https://www.w3.org/WAI/WCAG21/quickref/?levels=aa)
- [Tailwind CSS](https://tailwindcss.com)
- [MDN ARIA Practices](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA)
