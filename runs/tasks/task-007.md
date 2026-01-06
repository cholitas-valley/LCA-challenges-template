---
task_id: task-007
title: Frontend scaffolding with React + Vite + TanStack Query + Tailwind CSS
role: lca-frontend
follow_roles: []
post: [lca-docs]
depends_on: [task-006]
inputs:
  - runs/plan.md
  - runs/handoffs/task-006.md
allowed_paths:
  - frontend/**
  - docker-compose.yml
  - Makefile
check_command: make typecheck && npm run build --prefix frontend
handoff: runs/handoffs/task-007.md
---

## Goal

Create a React + TypeScript frontend application using Vite as the build tool, with TanStack Query for API state management and Tailwind CSS for styling. Set up the development environment, configure Docker containerization, and establish the project structure for the dashboard UI.

## Context

Phase 2 (Backend Core) is complete. The backend provides REST API endpoints:
- `GET /api/plants` - List all plants with latest telemetry
- `GET /api/plants/:id/history?hours=24` - Time-series data
- `POST /api/plants/:id/config` - Update thresholds
- `GET /api/health` - Health check

The frontend will be a single-page application that displays plant status cards and 24-hour history charts, with real-time polling for updates.

## Requirements

### 1. Vite + React + TypeScript Setup
- Initialize Vite project in `frontend/` directory
- Configure TypeScript with strict mode
- Set up path aliases (`@/` for `src/`)
- Target ES2022, module type ESNext

### 2. Dependencies
Install core dependencies:
- `react` + `react-dom` (v18+)
- `@tanstack/react-query` (v5+) - API state management
- `axios` - HTTP client for API calls
- `tailwindcss` + `postcss` + `autoprefixer` - Styling
- `lucide-react` - Icon library

Dev dependencies:
- `typescript` + `@types/*`
- `vite` + `@vitejs/plugin-react`

### 3. Project Structure
```
frontend/
├── src/
│   ├── main.tsx              # Entry point
│   ├── App.tsx               # Root component
│   ├── api/
│   │   ├── client.ts         # Axios instance configuration
│   │   ├── queries.ts        # TanStack Query hooks
│   │   └── types.ts          # API response types
│   ├── components/
│   │   ├── Layout.tsx        # App layout with header
│   │   └── ErrorBoundary.tsx # Error boundary component
│   ├── pages/
│   │   └── Dashboard.tsx     # Main dashboard page (stub)
│   └── styles/
│       └── index.css         # Global styles + Tailwind imports
├── public/                   # Static assets
├── index.html                # HTML template
├── vite.config.ts            # Vite configuration
├── tailwind.config.js        # Tailwind CSS configuration
├── postcss.config.js         # PostCSS configuration
├── tsconfig.json             # TypeScript configuration
├── package.json              # Dependencies and scripts
└── .dockerignore             # Docker ignore patterns
```

### 4. API Client Setup
Create `frontend/src/api/client.ts`:
- Axios instance with base URL from env var (`VITE_API_URL`)
- Default timeout (10 seconds)
- Content-Type: application/json

Create `frontend/src/api/types.ts`:
- TypeScript interfaces matching backend API contracts:
  - `Plant` (id, name, thresholds, latest telemetry)
  - `Telemetry` (timestamp, soil_moisture, light, temperature)
  - `PlantConfig` (thresholds, cooldown_minutes)

Create `frontend/src/api/queries.ts`:
- `useHealthCheck()` - Query for `GET /api/health`
- `usePlants()` - Query for `GET /api/plants` with 5-second refetch interval
- `usePlantHistory(plantId, hours)` - Query for `GET /api/plants/:id/history`
- `useUpdatePlantConfig(plantId)` - Mutation for `POST /api/plants/:id/config`

### 5. TanStack Query Setup
In `main.tsx`:
- Create `QueryClient` with default options:
  - `refetchOnWindowFocus: false`
  - `retry: 1`
  - `staleTime: 3000`
- Wrap `App` in `QueryClientProvider`

### 6. Tailwind CSS Configuration
- Configure `tailwind.config.js` with custom theme
- Import Tailwind directives in `src/styles/index.css`

### 7. Layout Component
Create `frontend/src/components/Layout.tsx`:
- Header with app title: "PlantOps Dashboard"
- Main content area for page rendering

### 8. Dashboard Stub
Create `frontend/src/pages/Dashboard.tsx`:
- Use `usePlants()` to test API connection
- Display loading state
- Display error state with retry button
- Display simple list of plant names (no cards yet)

### 9. Docker Configuration
Create `frontend/Dockerfile`:
- Multi-stage build:
  - Builder stage: install deps, build Vite production bundle
  - Production stage: serve with `nginx:alpine`
- Copy build output to nginx html directory

Update `docker-compose.yml`:
- Add/update `frontend` service
- Expose port 3000
- Set environment variables
- Depends on: backend
- Health check

Create nginx configuration file `frontend/nginx.conf`:
- Serve static files
- Fallback to `index.html` for SPA routing

### 10. Build System Integration
Update `Makefile`:
- Add frontend to `typecheck` target

## Constraints

- **No implementation of plant cards or charts** - This is scaffolding only
- **TypeScript strict mode** - All code must type check
- **No inline styles** - Use Tailwind classes only
- **API base URL must be configurable** - Use environment variable

## Definition of Done

- [ ] `frontend/` directory exists with Vite + React + TypeScript
- [ ] Dependencies installed: TanStack Query, Axios, Tailwind CSS, Lucide React
- [ ] `frontend/src/api/` with client.ts, types.ts, queries.ts
- [ ] TanStack Query configured with QueryClientProvider
- [ ] Tailwind CSS configured and working
- [ ] Layout component with header
- [ ] Dashboard stub page that fetches and displays plant names
- [ ] Docker multi-stage build with nginx
- [ ] `docker-compose.yml` updated with frontend service
- [ ] `Makefile` updated with frontend targets
- [ ] `make typecheck` passes for frontend
- [ ] `npm run build --prefix frontend` succeeds
- [ ] Handoff document created at `runs/handoffs/task-007.md`
