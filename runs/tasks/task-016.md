---
task_id: task-016
title: Layout and navigation
role: lca-frontend
follow_roles: []
post:
  - lca-recorder
  - lca-gitops
depends_on:
  - task-015
inputs:
  - objective.md
  - runs/plan.md
  - runs/handoffs/task-015.md
allowed_paths:
  - frontend/**
check_command: cd frontend && npm run build
handoff: runs/handoffs/task-016.md
---

# Task 016: Layout and Navigation

## Goal

Create the application layout with navigation, header, and page structure. Establish the visual foundation for all pages.

## Requirements

### Layout Component (frontend/src/components/Layout.tsx)

```typescript
interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <nav className="...">
        <Navigation />
      </nav>
      <main className="container mx-auto px-4 py-8">
        {children}
      </main>
    </div>
  );
}
```

### Header Component (frontend/src/components/Header.tsx)

- PlantOps logo/title
- Connection status indicator (optional for now)
- Settings link

### Navigation Component (frontend/src/components/Navigation.tsx)

Navigation links:
- Dashboard (/) - Plant overview
- Plants (/plants) - Plant list/management
- Devices (/devices) - Device management
- Settings (/settings) - LLM configuration

Active state styling for current route.

### Page Components (frontend/src/pages/)

Create placeholder pages:

**pages/Dashboard.tsx:**
```typescript
export function Dashboard() {
  return (
    <Layout>
      <h1 className="text-2xl font-bold mb-6">Dashboard</h1>
      <p className="text-gray-500">Plant overview coming soon...</p>
    </Layout>
  );
}
```

**pages/Plants.tsx** - Plant list page placeholder
**pages/PlantDetail.tsx** - Single plant page placeholder
**pages/Devices.tsx** - Device management placeholder
**pages/Settings.tsx** - Settings placeholder

### Router Setup

Update App.tsx with routes:
```typescript
<Routes>
  <Route path="/" element={<Dashboard />} />
  <Route path="/plants" element={<Plants />} />
  <Route path="/plants/:id" element={<PlantDetail />} />
  <Route path="/devices" element={<Devices />} />
  <Route path="/settings" element={<Settings />} />
</Routes>
```

### Styling

Base styles:
- Clean, minimal design
- Green accent color for branding
- Responsive layout (mobile-friendly)
- Clear visual hierarchy

### Loading/Error States

Create utility components:
- `LoadingSpinner.tsx` - Centered spinner
- `ErrorMessage.tsx` - Error display with retry option
- `EmptyState.tsx` - Empty list placeholder

## Definition of Done

- [ ] Layout wraps all pages consistently
- [ ] Navigation shows all routes
- [ ] Active route is highlighted
- [ ] All placeholder pages render
- [ ] Responsive on mobile viewports
- [ ] Build passes

## Constraints

- Keep pages as placeholders (actual content in later tasks)
- Use TailwindCSS for all styling
- No external UI component libraries
- Navigation must be accessible (keyboard, aria)
