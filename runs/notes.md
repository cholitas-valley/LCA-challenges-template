# Post-Run Changes

Changes to apply after this run completes (on main branch).

---

## Arbiter Issues

### 1. Switch arbiter to haiku model

**File:** `.claude/agents/lca-arbiter.md`

**Problem:** Arbiter used 22.2k tokens just to clear - too expensive for routine checks.

**Change:**
```yaml
model: haiku  # was: sonnet
tools: Read, Bash, Edit  # reduced from: Read, Grep, Glob, LS, Bash, Edit
```

**Savings:** ~10x cheaper ($0.02 vs $0.20 per checkpoint)

---

### 2. Arbiter not clearing pending.json

**File:** `.claude/agents/lca-arbiter.md`

**Problem:** After completing checkpoint, `runs/arbiter/pending.json` still exists. Arbiter should delete it.

**Evidence:** `pending.json` exists alongside `decision.json` after checkpoint completed.

**Change:** Add explicit instruction to arbiter agent:
```markdown
## Outputs (required)
...
3) **Delete** `runs/arbiter/pending.json` after writing decision.json
```

---

### 3. Arbiter blind to untracked files (major)

**Problem:** Git diff only shows tracked file changes. New implementation files (backend/src/*.ts, etc.) are untracked because no commits are made. Arbiter sees:
- 3 doc files changed (1023 lines)
- Implementation files listed as "untracked" but can't review them

**Evidence from decision.json:**
```json
"implementation_files_untracked": [
  "backend/src/",
  "simulator/src/",
  "worker/",
  "frontend/"
]
```

**Root cause:** No lca-gitops in task post agents = no commits = arbiter can't diff code.

**Fix:** See item #5 (lca-gitops in post agents)

---

### 4. Timestamp calculation bug in arbiter-scheduler.py

**File:** `.claude/hooks/arbiter-scheduler.py`

**Problem:** `minutes_since_last_checkpoint: 29461893.3` (~56 years) - clearly wrong.

**Cause:** `runs/arbiter/state.json` probably has `last_checkpoint_epoch: 0`, and the calculation doesn't handle first-run case.

**Fix:** Initialize `last_checkpoint_epoch` to current time on first run, or handle 0 case:
```python
last_epoch = int(arb_state.get("last_checkpoint_epoch") or now_epoch)
```

---

### 5. Arbiter state.json not being updated

**File:** `.claude/agents/lca-arbiter.md`

**Problem:** After checkpoint, `runs/arbiter/state.json` should be updated with:
- `last_checkpoint_epoch`: current time
- `last_checkpoint_tokens`: current total

**Decision:** Arbiter agent updates state.json (keeps all arbiter state in one place).

**Change:** Add to arbiter agent outputs:
```markdown
## Outputs (required)
...
4) Update `runs/arbiter/state.json`:
   - `last_checkpoint_epoch`: current Unix timestamp
   - `last_checkpoint_tokens`: total tokens from pending.json
```

---

### 6. Add task-based trigger (not just thresholds)

**File:** `.claude/hooks/arbiter-scheduler.py` + `runs/arbiter/config.json`

**Problem:** Arbiter only triggers on token/time thresholds. Should also trigger after N tasks.

**Change to config.json:**
```json
{
  "min_tasks_between_checkpoints": 3,
  ...
}
```

**Change to scheduler:**
```python
tasks_completed = len(state.get("completed_task_ids") or [])
tasks_at_last = int(arb_state.get("last_checkpoint_tasks") or 0)
tasks_since = tasks_completed - tasks_at_last

# Trigger if ANY threshold exceeded
if (dt_tokens >= cfg["min_tokens_between_checkpoints"] or
    dt_minutes >= cfg["min_minutes_between_checkpoints"] or
    tasks_since >= cfg["min_tasks_between_checkpoints"]):
    # write pending.json
```

---

### 7. Tiered severity (warnings vs blocks)

**File:** `.claude/agents/lca-arbiter.md`

**Problem:** Currently binary (needs_human: true/false). Should have tiers.

**Change to decision.json schema:**
```json
{
  "severity": "INFO | WARNING | BLOCK",
  "needs_human": false,
  "reasons": [...],
  ...
}
```

**Severity levels:**
| Level | Action | Examples |
|-------|--------|----------|
| INFO | Log only, continue | Normal progress, thresholds OK |
| WARNING | Log to notes.md, continue | High token burn, many files changed |
| BLOCK | Set phase=BLOCKED, stop | No progress, repeated failures, security concern |

**Change to CLAUDE.md orchestrator:**
```markdown
### 1) Check arbiter
If `runs/arbiter/pending.json` exists:
- Invoke `lca-arbiter`
- Read `runs/arbiter/decision.json`
- If `severity == "BLOCK"`: set `phase = "BLOCKED"` and STOP
- If `severity == "WARNING"`: append to `runs/notes.md`, continue
- If `severity == "INFO"`: continue
```

---

---

## Planner/Protocol Issues

### 8. Include lca-gitops in task post agents

**File:** `.claude/agents/lca-planner.md`

**Problem:** Planner created tasks with `post: [lca-docs]` but no gitops. Commits batched at end = no checkpoints, risky if run fails.

**Change:** Update planner instructions to include `lca-gitops` after each task or phase:
```yaml
post: [lca-docs, lca-gitops]
```

---

## Observability Issues

### 9. Add usage/cost reporting per phase

**Problem:** No visibility into token usage during run.

**Change:** Create a hook or skill that reports usage summary at phase transitions:
- After each phase completes
- Include table format with tokens + estimated cost
- Write to `runs/usage/phase-summary.md`

**Format:**
```
| Metric                    | Total     |
|---------------------------|-----------|
| Input tokens (non-cached) | X         |
| Output tokens             | X         |
| Cache read tokens         | X         |
| Cache creation tokens     | X         |

Estimated cost: $X.XX
```

---

### 10. (Optional) Add more tools to PreToolUse logging

**File:** `.claude/settings.json`

**Current:** Only logs `Bash` tool uses.

**Consider:** Log all tool uses (Edit, Write, Read) for full audit trail.

---

---

## Orchestrator Issues

### 11. Orchestrator not invoking lca-gitops (CRITICAL)

**File:** `CLAUDE.md`

**Problem:** Even when `lca-gitops` is specified in a task's `post` array, the orchestrator never invokes it. Evidence:
- Tasks 010-013 all have `post: [lca-docs, lca-gitops]`
- Only `*-docs.md` handoffs exist, NO gitops handoffs
- Result: **Zero commits during entire 13-task run** - all implementation code is untracked

**Evidence:**
```bash
$ ls runs/handoffs/ | grep gitops
# (empty - no gitops handoffs)

$ git status --porcelain | head -10
?? backend/
?? frontend/
?? worker/
?? simulator/
# All implementation code untracked!
```

**Root cause:** Orchestrator's "Post agents" step in execution loop is either:
1. Not implemented
2. Not iterating through the `post` array correctly
3. Stopping after first post agent (lca-docs)

**Fix:** Update CLAUDE.md execution loop step 4:
```markdown
### 4) Post agents
If `post` includes additional agents (e.g., `docs`, `gitops`):
- For EACH agent in the `post` array:
  - Update `current_role` to the post agent
  - Invoke the agent
  - Verify handoff file was created
  - If handoff missing, retry or log error
```

---

### 12. No validation that post agents completed

**File:** `CLAUDE.md`

**Problem:** Orchestrator advances to next task without verifying post agents wrote their handoffs.

**Evidence:** No gitops handoffs exist even though lca-gitops was in post array.

**Fix:** Add validation step after post agents:
```markdown
### 4b) Verify post agents
For each post agent that ran:
- Check handoff file exists (e.g., `runs/handoffs/task-XXX-gitops.md`)
- If missing: retry agent or set phase=BLOCKED
- Log which post agents completed
```

---

---

## Implementation Issues

### 13. E2E tests failing (14/15)

**File:** `e2e/*.spec.ts`, `frontend/src/api/client.ts`

**Problem:** 14 of 15 Playwright E2E tests fail. Plant cards don't render in headless browser.

**Evidence from task-011 handoff:**
- Dashboard loads (title visible)
- Backend API works (`curl http://localhost:3000/api/plants` returns 6 plants)
- But `data-testid="plant-card"` elements never appear
- Tests timeout after 10 seconds

**Possible causes:**
1. Frontend API client fails to fetch data in browser context
2. CORS issue between frontend (localhost:3001) and backend (localhost:3000)
3. `VITE_API_BASE_URL` not set correctly in Docker build
4. TanStack Query not triggering requests in headless mode

**Fix:** Debug with Playwright trace/screenshots:
```bash
npx playwright test --trace on
# Then check trace artifacts for console errors, network failures
```

---

---

## Planner Issues

### 14. Planner dumped task specs into notes.md

**File:** `.claude/agents/lca-planner.md`

**Problem:** Instead of signaling that it cannot create files, the planner dumped full task specifications (tasks 007-013) directly into `runs/notes.md`. This added ~1600 lines of task specs to a file meant for notes.

**Evidence:** Lines 239-1834 of notes.md contain task specifications that should be in `runs/tasks/`.

**Root cause:** Planner agent said "cannot create new files directly" but continued outputting anyway.

**Fix:** Update planner agent instructions:
```markdown
## Constraints
- If you cannot create task files directly, STOP and report to orchestrator
- Do NOT output task specifications to other files (notes.md, handoffs, etc.)
- Request orchestrator to create files on your behalf
```

---

### 15. Inconsistent handoff naming convention

**File:** `.claude/agents/lca-docs.md`

**Problem:** Post-agent handoff files use inconsistent naming:
- Some: `task-010-docs.md`
- Others: `docs-task-010.md`
- Others: `task-009-docs.md` vs `docs-task-009.md`

**Fix:** Standardize naming in lca-docs agent:
```markdown
## Outputs
Write handoff to: `runs/handoffs/task-{ID}-docs.md`
(Always use task ID first, then agent suffix)
```

---

---

## Summary

| # | Issue | Category | Priority |
|---|-------|----------|----------|
| 1 | Arbiter too expensive | Cost | Medium |
| 2 | pending.json not cleared | Bug | Low |
| 3 | Blind to untracked files | Major gap | High |
| 4 | Timestamp bug (epoch 0) | Bug | Medium |
| 5 | state.json not updated | Bug | High |
| 6 | No task-based trigger | Feature | Medium |
| 7 | No tiered severity | Feature | Medium |
| 8 | No gitops in post agents | Planner gap | High |
| 9 | No usage reporting | Observability | Medium |
| 10 | Limited tool logging | Observability | Low |
| **11** | **Orchestrator not invoking gitops** | **Orchestrator bug** | **CRITICAL** |
| **12** | **No post-agent validation** | **Orchestrator gap** | **High** |
| **13** | **E2E tests failing (14/15)** | **Implementation** | **High** |
| **14** | **Planner dumped specs to notes.md** | **Planner bug** | **Medium** |
| **15** | **Inconsistent handoff naming** | **Protocol** | **Low** |

---

**Created:** 2026-01-06
**Updated:** 2026-01-06 (added issues 11-15)
**Status:** Run in progress (task-013)

---

## CLEANUP REQUIRED

**Lines 239+ of this file contain task specifications that were incorrectly dumped by lca-planner.**

These should be removed after the run. The task specs are already in `runs/tasks/task-007.md` through `task-013.md`.

---

---

## Phase 3 Frontend Tasks - CREATED BY LCA-PLANNER

**Note:** The planner role cannot create new files directly. These task specifications need to be written to `runs/tasks/task-007.md`, `task-008.md`, and `task-009.md` by the orchestrator or a role with file creation capabilities.

### Task 007: Frontend Scaffolding

**File:** `runs/tasks/task-007.md`

```markdown
---
task_id: task-007
title: Frontend scaffolding with React + Vite + TanStack Query + Tailwind CSS
role: lca-frontend
follow_roles: []
post: [lca-docs, lca-gitops]
depends_on: [task-006]
inputs:
  - objective.md
  - runs/plan.md
  - runs/handoffs/task-006.md
allowed_paths:
  - frontend/**
  - docker-compose.yml
  - Makefile
  - .env.example
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
- Set up ESLint + Prettier for code quality
- Configure path aliases (`@/` for `src/`)
- Target ES2022, module type ESNext

### 2. Dependencies
Install core dependencies:
- `react` + `react-dom` (v18+)
- `@tanstack/react-query` (v5+) - API state management
- `axios` - HTTP client for API calls
- `tailwindcss` + `postcss` + `autoprefixer` - Styling
- `lucide-react` - Icon library (plant, thermometer, droplet, sun icons)

Dev dependencies:
- `typescript` + `@types/*`
- `vite` + `@vitejs/plugin-react`
- `eslint` + `prettier`

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
├── tsconfig.node.json        # TypeScript for Vite config
├── package.json              # Dependencies and scripts
└── .dockerignore             # Docker ignore patterns
```

### 4. API Client Setup
Create `frontend/src/api/client.ts`:
- Axios instance with base URL from env var (`VITE_API_BASE_URL`)
- Default timeout (10 seconds)
- Request/response interceptors for error handling
- Content-Type: application/json

Create `frontend/src/api/types.ts`:
- TypeScript interfaces matching backend API contracts:
  - `Plant` (id, name, location, thresholds, last_alert_sent_at, latest telemetry)
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
- Add `ReactQueryDevtools` in development mode

### 6. Tailwind CSS Configuration
- Configure `tailwind.config.js` with custom theme:
  - Plant-themed color palette (green shades, earth tones)
  - Custom spacing for card layouts
  - Dark mode support (optional)
- Import Tailwind directives in `src/styles/index.css`

### 7. Layout Component
Create `frontend/src/components/Layout.tsx`:
- Header with app title: "PlantOps Dashboard"
- Navigation placeholder (future: settings, alerts)
- Footer with health check indicator (green dot if healthy)
- Main content area for page rendering

### 8. Error Boundary
Create `frontend/src/components/ErrorBoundary.tsx`:
- React error boundary for graceful error handling
- Display friendly error message with retry button
- Log errors to console in development

### 9. Dashboard Stub
Create `frontend/src/pages/Dashboard.tsx`:
- Use `usePlants()` to test API connection
- Display loading state
- Display error state with retry button
- Display simple list of plant names (no cards yet)
- This is a placeholder for task-008

### 10. Docker Configuration
Create `frontend/Dockerfile`:
- Multi-stage build:
  - Builder stage: install deps, build Vite production bundle
  - Production stage: serve with `nginx:alpine`
- Copy build output to nginx html directory
- Configure nginx to serve SPA (fallback to index.html)

Update `docker-compose.yml`:
- Add `frontend` service
- Expose port 3000
- Set environment variables:
  - `VITE_API_BASE_URL=http://backend:3001`
- Depends on: backend
- Health check: curl http://localhost:3000

Create nginx configuration file `frontend/nginx.conf`:
- Serve static files from `/usr/share/nginx/html`
- Fallback to `index.html` for SPA routing
- Gzip compression enabled
- Security headers (X-Frame-Options, X-Content-Type-Options)

### 11. Build System Integration
Update `Makefile`:
- Add frontend to `lint` target (runs `npm run lint --prefix frontend`)
- Add frontend to `typecheck` target (runs `npm run typecheck --prefix frontend`)
- Add frontend to `build` target (runs `npm run build --prefix frontend`)

Update `.env.example`:
- Add `VITE_API_BASE_URL=http://localhost:3001`

## Constraints

- **No implementation of plant cards or charts** - This is scaffolding only, task-008 will add UI components
- **TypeScript strict mode** - All code must type check with `strict: true`
- **No inline styles** - Use Tailwind classes only
- **API base URL must be configurable** - Use environment variable
- **Docker build must succeed** - Multi-stage build with production-ready nginx config

## Definition of Done

- [ ] `frontend/` directory exists with Vite + React + TypeScript
- [ ] Dependencies installed: TanStack Query, Axios, Tailwind CSS, Lucide React
- [ ] `frontend/src/api/` with client.ts, types.ts, queries.ts
- [ ] TanStack Query configured with QueryClientProvider
- [ ] Tailwind CSS configured and working
- [ ] Layout component with header and health check indicator
- [ ] Error boundary component
- [ ] Dashboard stub page that fetches and displays plant names
- [ ] Docker multi-stage build with nginx serving static files
- [ ] `docker-compose.yml` updated with frontend service
- [ ] `Makefile` updated with frontend targets
- [ ] `.env.example` updated with VITE_API_BASE_URL
- [ ] `make typecheck` passes for frontend
- [ ] `npm run build --prefix frontend` succeeds
- [ ] `docker compose up frontend` serves dashboard at http://localhost:3000
- [ ] Dashboard connects to backend API and displays plant list
- [ ] Handoff document created at `runs/handoffs/task-007.md`

## Verification Steps

1. **Type check**:
   ```bash
   make typecheck
   ```
   Expected: No TypeScript errors in frontend code.

2. **Build frontend**:
   ```bash
   npm run build --prefix frontend
   ```
   Expected: Build succeeds, `frontend/dist/` directory created with index.html and assets.

3. **Start services**:
   ```bash
   docker compose up -d postgres mosquitto simulator backend worker
   docker compose up -d frontend
   ```
   Expected: All services healthy.

4. **Test frontend**:
   ```bash
   curl http://localhost:3000
   ```
   Expected: HTML response with React app.

5. **Test API connection**:
   Open http://localhost:3000 in browser.
   Expected: Dashboard displays list of 6 plant names (no cards yet).

6. **Check health indicator**:
   Expected: Green dot in footer indicating backend is healthy.

7. **Test error handling**:
   Stop backend: `docker compose stop backend`
   Refresh dashboard.
   Expected: Error message displayed with retry button.
```

---

### Task 008: Dashboard UI with Plant Cards

**File:** `runs/tasks/task-008.md`

```markdown
---
task_id: task-008
title: Dashboard UI with plant cards and real-time status
role: lca-frontend
follow_roles: []
post: [lca-docs, lca-gitops]
depends_on: [task-007]
inputs:
  - runs/handoffs/task-007.md
  - runs/plan.md
allowed_paths:
  - frontend/src/**
check_command: make typecheck && npm run build --prefix frontend
handoff: runs/handoffs/task-008.md
---

## Goal

Build the main dashboard UI with plant status cards that display real-time telemetry, visual health indicators, and threshold configuration. Implement auto-polling for live updates and interactive elements for threshold management.

## Context

Task-007 completed frontend scaffolding. The application structure, API client, and TanStack Query setup are in place. The current Dashboard.tsx shows a simple list of plant names. This task transforms it into a rich, interactive dashboard with visual cards.

## Requirements

### 1. Plant Card Component
Create `frontend/src/components/PlantCard.tsx`:
- Displays plant information in a card layout
- Props: `plant` (Plant type from api/types.ts)
- Card sections:
  - **Header**: Plant name, location
  - **Status badge**: Health indicator (Healthy / Warning / Critical)
  - **Telemetry display**: Soil moisture, light, temperature with icons
  - **Last updated**: Timestamp of latest telemetry
  - **Alert indicator**: Shows if plant has recent alerts
  - **Config button**: Opens threshold configuration modal

Visual design:
- Use Tailwind cards with shadow and rounded corners
- Color-coded status badge:
  - Green: All metrics within thresholds
  - Yellow: One metric approaching threshold (80-100% of limit)
  - Red: One or more metrics breaching thresholds
- Icons from lucide-react: Droplet (moisture), Sun (light), Thermometer (temperature)
- Display values with units: % for moisture, lux for light, °C for temperature

### 2. Telemetry Display Sub-component
Create `frontend/src/components/TelemetryDisplay.tsx`:
- Props: `value`, `unit`, `icon`, `threshold_min`, `threshold_max`, `label`
- Visual representation:
  - Icon + label
  - Current value with unit
  - Color indicator based on threshold:
    - Gray: No telemetry data
    - Green: Within thresholds
    - Yellow: 80-100% of threshold range (warning zone)
    - Red: Outside thresholds
  - Small bar indicator showing value relative to min/max range

### 3. Plant Status Calculator
Create `frontend/src/utils/plantStatus.ts`:
- Function: `calculatePlantStatus(plant: Plant): 'healthy' | 'warning' | 'critical' | 'unknown'`
- Logic:
  - `unknown`: No telemetry data
  - `critical`: Any metric outside thresholds
  - `warning`: Any metric in warning zone (80-100% of threshold)
  - `healthy`: All metrics within safe range
- Export color helpers: `getStatusColor()`, `getStatusBadgeClass()`

### 4. Threshold Configuration Modal
Create `frontend/src/components/ThresholdConfigModal.tsx`:
- Props: `plant`, `isOpen`, `onClose`, `onSave`
- Form fields for thresholds:
  - Soil moisture min/max (0-100%)
  - Light min/max (0-100000 lux)
  - Temperature min/max (-10 to 50°C)
  - Alert cooldown minutes (1-1440)
- Use controlled inputs with validation
- Display current values as placeholders
- Submit button calls `useUpdatePlantConfig` mutation
- Success/error toast notifications
- Loading state during save operation

### 5. Dashboard Grid Layout
Update `frontend/src/pages/Dashboard.tsx`:
- Replace plant name list with grid layout
- Responsive grid:
  - Desktop: 3 columns
  - Tablet: 2 columns
  - Mobile: 1 column
- Display PlantCard for each plant
- Auto-refresh with TanStack Query (5-second interval already configured)
- Loading skeleton for cards while fetching
- Empty state if no plants found
- Error state with retry button

### 6. Loading Skeleton
Create `frontend/src/components/PlantCardSkeleton.tsx`:
- Animated skeleton matching PlantCard layout
- Use Tailwind pulse animation
- Display 6 skeletons during initial load

### 7. Toast Notifications
Create `frontend/src/components/Toast.tsx`:
- Simple toast notification system
- Types: success, error, info
- Auto-dismiss after 3 seconds
- Position: top-right corner
- Stack multiple toasts
- Use React Context for global toast management

Create `frontend/src/contexts/ToastContext.tsx`:
- Context provider for toast state
- Hook: `useToast()` with `showToast(message, type)` function

### 8. Time Formatting Utilities
Create `frontend/src/utils/dateTime.ts`:
- Function: `formatTimestamp(timestamp: string): string`
- Format examples:
  - "2 minutes ago"
  - "15 seconds ago"
  - "3 hours ago"
- Function: `formatFullDate(timestamp: string): string`
- Format: "Jan 6, 2026 3:45 PM"

### 9. Auto-refresh Indicator
Create `frontend/src/components/RefreshIndicator.tsx`:
- Shows last refresh time
- Countdown to next refresh
- Manual refresh button
- Uses TanStack Query's refetch function
- Position: top-right of dashboard

### 10. Responsive Design
- Ensure all components work on mobile, tablet, desktop
- Touch-friendly button sizes (min 44x44px)
- Readable text sizes (min 16px base)
- Adequate spacing for touch targets
- Test breakpoints: 640px (sm), 768px (md), 1024px (lg), 1280px (xl)

## Constraints

- **No chart implementation** - Task-009 will add history charts
- **Use existing API queries** - No new API endpoints
- **TypeScript strict mode** - All props and state typed
- **No external UI libraries** - Build with Tailwind + Lucide icons only
- **Accessibility** - Use semantic HTML, ARIA labels where needed
- **Performance** - Minimize re-renders, use React.memo for PlantCard

## Definition of Done

- [ ] PlantCard component displays all plant info with status indicators
- [ ] TelemetryDisplay shows metrics with color-coded health status
- [ ] PlantStatus calculator correctly identifies healthy/warning/critical states
- [ ] ThresholdConfigModal allows editing and saving plant thresholds
- [ ] Dashboard grid layout responsive across all screen sizes
- [ ] Loading skeleton shows during data fetch
- [ ] Toast notifications work for success/error messages
- [ ] Time formatting utilities display human-readable timestamps
- [ ] Auto-refresh indicator shows refresh status
- [ ] All components pass TypeScript type checking
- [ ] `make typecheck` passes
- [ ] `npm run build --prefix frontend` succeeds
- [ ] Dashboard displays 6 plant cards with live telemetry
- [ ] Clicking config button opens modal with editable thresholds
- [ ] Saving thresholds updates backend and refreshes dashboard
- [ ] Status badges correctly reflect plant health
- [ ] Handoff document created at `runs/handoffs/task-008.md`

## Verification Steps

1. **Start all services**:
   ```bash
   docker compose up -d
   ```

2. **Open dashboard**: http://localhost:3000
   Expected: 6 plant cards in grid layout with telemetry data.

3. **Verify status colors**:
   - Identify a plant with all metrics in range (green badge)
   - Identify a plant with breached threshold (red badge)

4. **Test threshold configuration**:
   - Click config button on any plant card
   - Modal opens with current threshold values
   - Change soil_moisture_min from 20 to 30
   - Click Save
   - Expected: Success toast, modal closes, card updates

5. **Verify API mutation**:
   ```bash
   docker exec plantops-postgres psql -U plantops -d plantops -c "SELECT soil_moisture_min FROM plants WHERE id = 'orchid-001';"
   ```
   Expected: Updated value (30).

6. **Test auto-refresh**:
   - Note current telemetry values on a card
   - Wait 5-10 seconds
   - Expected: Values update automatically (simulator generates new data)

7. **Test responsive design**:
   - Resize browser to mobile width (375px)
   - Expected: Single column layout, all elements readable

8. **Test error handling**:
   - Stop backend: `docker compose stop backend`
   - Try to save threshold config
   - Expected: Error toast displayed

9. **Test loading states**:
   - Hard refresh page (Cmd+Shift+R)
   - Expected: Loading skeletons appear briefly before cards load

## Notes

- Status calculation should be client-side (no backend changes)
- Threshold config saves via existing `POST /api/plants/:id/config` endpoint
- Auto-refresh uses TanStack Query's `refetchInterval` (already configured in task-007)
- Time formatting should handle stale data (show "No data" if > 5 minutes old)
- Consider adding visual progress bar for metric values relative to thresholds
```

---

### Task 009: History Charts with Recharts

**File:** `runs/tasks/task-009.md`

```markdown
---
task_id: task-009
title: 24-hour history charts with Recharts and time-series visualization
role: lca-frontend
follow_roles: []
post: [lca-docs, lca-gitops]
depends_on: [task-008]
inputs:
  - runs/handoffs/task-008.md
  - runs/plan.md
allowed_paths:
  - frontend/src/**
  - frontend/package.json
check_command: make typecheck && npm run build --prefix frontend
handoff: runs/handoffs/task-009.md
---

## Goal

Add interactive 24-hour history charts to the dashboard using Recharts library. Display time-series telemetry data with threshold indicators, enable chart zooming/panning, and provide time range selection (1h, 6h, 24h, 7d).

## Context

Task-008 completed the plant card UI with real-time telemetry display. Now we add historical context by visualizing sensor trends over time. This helps users identify patterns, diagnose issues, and verify that recent threshold adjustments are working.

The backend provides `GET /api/plants/:id/history?hours=24` endpoint that returns time-series data.

## Requirements

### 1. Install Recharts
Add dependency to `frontend/package.json`:
- `recharts@^2.10.0` - React charting library

### 2. Plant History Modal
Create `frontend/src/components/PlantHistoryModal.tsx`:
- Props: `plant`, `isOpen`, `onClose`
- Full-screen or large modal (80% viewport)
- Header: Plant name, location, close button
- Time range selector: 1h / 6h / 24h / 7d buttons
- Three stacked charts (one per metric):
  - Soil Moisture (%)
  - Light (lux)
  - Temperature (°C)
- Each chart shows:
  - Line graph of metric over time
  - Threshold lines (min/max as dashed horizontal lines)
  - Color-coded area: green (safe zone), red (breach zones)
  - X-axis: Time labels (HH:MM format)
  - Y-axis: Metric value with unit
- Loading state while fetching history data
- Error state if API call fails
- Empty state if no historical data available

### 3. History Chart Component
Create `frontend/src/components/HistoryChart.tsx`:
- Props: `data`, `metricKey`, `unit`, `thresholdMin`, `thresholdMax`, `label`
- Uses Recharts components:
  - `LineChart` with responsive container
  - `Line` for telemetry data (stroke color based on breach status)
  - `ReferenceLine` for threshold min/max (dashed, labeled)
  - `ReferenceArea` for safe zone (light green fill)
  - `XAxis` with time formatter
  - `YAxis` with unit label
  - `Tooltip` showing timestamp + value
  - `CartesianGrid` for readability
  - `Legend` (optional, for threshold labels)
- Interactive features:
  - Hover tooltip shows exact value + timestamp
  - Zoom in/out with scroll wheel (optional)
  - Click and drag to pan (optional)

### 4. Time Range Selector
Create `frontend/src/components/TimeRangeSelector.tsx`:
- Props: `selected`, `onChange`
- Button group with options: "1h", "6h", "24h", "7d"
- Active button highlighted
- Calls `onChange(hours)` when clicked
- Triggers refetch of history data with new hours parameter

### 5. History Data Hook
Update `frontend/src/api/queries.ts`:
- Ensure `usePlantHistory(plantId, hours)` is implemented
- Fetches `GET /api/plants/:id/history?hours=${hours}`
- Returns: `{ data, isLoading, isError, error, refetch }`
- Cache key includes hours parameter
- Stale time: 30 seconds (history doesn't change rapidly)

### 6. Data Transformation Utility
Create `frontend/src/utils/chartData.ts`:
- Function: `transformTelemetryForChart(telemetry: Telemetry[]): ChartDataPoint[]`
- Converts API response to Recharts format:
  ```typescript
  type ChartDataPoint = {
    timestamp: number; // Unix timestamp for sorting
    time: string; // Formatted time string for display
    soil_moisture: number;
    light: number;
    temperature: number;
  }
  ```
- Sorts data by timestamp ascending
- Handles missing data points (gaps in telemetry)
- Filters out null/undefined values

### 7. Threshold Visualization
Create `frontend/src/components/ThresholdIndicators.tsx`:
- Helper component for rendering threshold lines on charts
- Props: `min`, `max`, `label`, `color`
- Uses Recharts `ReferenceLine` for min/max
- Uses `ReferenceArea` to shade safe zone between min/max
- Legend explaining threshold colors

### 8. Chart Interaction Tooltips
Create `frontend/src/components/CustomChartTooltip.tsx`:
- Custom Recharts tooltip component
- Props: `active`, `payload`, `label`
- Displays:
  - Formatted timestamp
  - Metric value with unit
  - Threshold status indicator (✓ safe / ⚠ warning / ✗ breach)
  - Visual color coding
- Styled with Tailwind for consistency

### 9. Add Chart Button to Plant Card
Update `frontend/src/components/PlantCard.tsx`:
- Add "View History" button below telemetry display
- Button opens PlantHistoryModal for that plant
- Icon: TrendingUp or LineChart from lucide-react

### 10. Chart Responsive Design
- Ensure charts adapt to modal width
- Use Recharts `ResponsiveContainer` with 100% width/height
- Adjust chart aspect ratio for mobile (taller, narrower)
- Font sizes readable on small screens
- Touch-friendly tooltip interactions

### 11. Empty State Handling
Create `frontend/src/components/EmptyChartState.tsx`:
- Display when no historical data available
- Message: "No telemetry history available for this plant"
- Explanation: "Data will appear once the simulator starts sending readings"
- Icon: AlertCircle from lucide-react

### 12. Performance Optimization
- Memoize chart data transformations
- Use `React.memo` for HistoryChart component
- Debounce time range selector changes
- Limit data points displayed (downsample if > 1000 points)
- Only render charts when modal is open (lazy load)

## Constraints

- **Use Recharts library only** - No D3, Chart.js, or other charting libraries
- **Match plant card styling** - Consistent colors, fonts, spacing
- **TypeScript strict mode** - All chart props typed
- **No backend changes** - Use existing history endpoint
- **Responsive charts** - Work on mobile, tablet, desktop
- **Performance** - Charts should render smoothly even with 1000+ data points

## Definition of Done

- [ ] Recharts installed and configured
- [ ] PlantHistoryModal displays on "View History" button click
- [ ] HistoryChart renders three separate charts (moisture, light, temperature)
- [ ] Time range selector switches between 1h, 6h, 24h, 7d
- [ ] Threshold lines displayed as dashed horizontal lines on charts
- [ ] Safe zone shaded with light green area between min/max thresholds
- [ ] Custom tooltip shows timestamp, value, threshold status
- [ ] Charts responsive across screen sizes
- [ ] Empty state displayed when no historical data
- [ ] Data transformation utility handles missing/null values
- [ ] Performance optimized (memoization, lazy loading)
- [ ] All components pass TypeScript type checking
- [ ] `make typecheck` passes
- [ ] `npm run build --prefix frontend` succeeds
- [ ] Dashboard shows "View History" button on each plant card
- [ ] Clicking button opens modal with 24h charts by default
- [ ] Switching time ranges updates charts correctly
- [ ] Charts display breach indicators when thresholds exceeded
- [ ] Handoff document created at `runs/handoffs/task-009.md`

## Verification Steps

1. **Start all services**:
   ```bash
   docker compose up -d
   ```

2. **Open dashboard**: http://localhost:3000
   Expected: Plant cards with "View History" buttons.

3. **Click "View History" on any plant**:
   Expected: Modal opens with 3 charts showing 24h history.

4. **Verify chart rendering**:
   - Soil moisture chart shows line graph with threshold lines
   - Safe zone shaded between min/max thresholds
   - X-axis shows time labels (HH:MM)
   - Y-axis shows percentage values

5. **Test time range selector**:
   - Click "1h" button
   - Expected: Charts update to show last hour of data
   - Click "7d" button
   - Expected: Charts update to show last 7 days (if data available)

6. **Test chart interactions**:
   - Hover over data points
   - Expected: Tooltip shows timestamp + exact value + threshold status
   - Tooltip follows cursor smoothly

7. **Verify threshold indicators**:
   - Identify a metric that breached threshold (from task-008 testing)
   - Open history chart
   - Expected: Data points in breach zones displayed in red/orange

8. **Test responsive design**:
   - Resize browser to mobile width (375px)
   - Open history modal
   - Expected: Charts resize to fit viewport, labels readable

9. **Test error handling**:
   - Stop backend: `docker compose stop backend`
   - Try to open history modal
   - Expected: Error message displayed

10. **Test empty state**:
    - Query plant with no telemetry history
    - Expected: Empty state component displayed

11. **Verify API calls**:
    Open browser DevTools Network tab:
    - Click "View History"
    - Expected: `GET /api/plants/<id>/history?hours=24` call
    - Click "1h" button
    - Expected: `GET /api/plants/<id>/history?hours=1` call

12. **Performance test**:
    - Open history modal with 7d data
    - Expected: Charts render within 1-2 seconds
    - Scrolling/interaction smooth (no lag)

## Notes

- Consider adding export functionality (CSV/JSON download) in future iteration
- Could add comparison mode (overlay multiple plants on same chart)
- Could add anomaly detection highlighting on charts
- Consider adding real-time chart updates (append new data points without refetch)
- Recharts has accessibility features - ensure keyboard navigation works
- Consider adding dark mode support for charts
```

---

**Planner Note:** These three task specifications are complete and follow the LCA protocol task file format. They need to be written to their respective files (`runs/tasks/task-007.md`, `task-008.md`, `task-009.md`) before execution can begin.

**Dependency chain:** 007 → 008 → 009 (sequential)

**Phase 3 completion criteria:** All three tasks complete, frontend dashboard fully functional with plant cards and history charts, `docker compose up` serves working UI at http://localhost:3000.

---

## Phase 4 Testing & Documentation Tasks - CREATED BY LCA-PLANNER

**Date:** 2026-01-06T18:30:00Z
**Status:** Tasks generated, awaiting file creation in runs/tasks/

**Note:** The planner role cannot create new files directly. These task specifications need to be written to `runs/tasks/task-010.md`, `task-011.md`, `task-012.md`, and `task-013.md` by the orchestrator or a role with file creation capabilities.

### Task 010: Backend and Worker Unit Tests

**File:** `runs/tasks/task-010.md`

```markdown
---
task_id: task-010
title: Backend and Worker Unit Tests
role: lca-qa
follow_roles: []
post: [lca-docs, lca-gitops]
depends_on: [task-009]
inputs:
  - runs/plan.md
  - runs/handoffs/task-004.md
  - runs/handoffs/task-005.md
  - runs/handoffs/task-006.md
  - backend/src/**
  - worker/src/**
allowed_paths:
  - backend/src/__tests__/**
  - backend/package.json
  - backend/jest.config.js
  - worker/src/__tests__/**
  - worker/package.json
  - worker/jest.config.js
  - Makefile
check_command: make test
handoff: runs/handoffs/task-010.md
---

## Goal

Add unit test coverage for critical backend and worker components to meet the challenge requirement of `make test` passing. Focus on testing core business logic: threshold evaluation, alert creation, telemetry validation, and API endpoints.

## Context

Tasks 004-006 implemented backend MQTT subscriber, REST API, and worker services. The challenge spec requires passing `make test` command. Currently `make test` is a stub that always passes. We need real tests with Jest to validate business logic.

## Requirements

### 1. Install Test Dependencies

Add to `backend/package.json` and `worker/package.json`:
```json
{
  "scripts": {
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage"
  },
  "devDependencies": {
    "@types/jest": "^29.5.11",
    "@types/supertest": "^6.0.2",
    "jest": "^29.7.0",
    "supertest": "^6.3.3",
    "ts-jest": "^29.1.1"
  }
}
```

### 2. Jest Configuration

Create `backend/jest.config.js`:
```javascript
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  testMatch: ['**/__tests__/**/*.test.ts'],
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/index.ts',
    '!src/db/migrations/**',
  ],
};
```

Create `worker/jest.config.js` with same structure.

### 3. Backend Tests

Create tests in `backend/src/__tests__/`:

**validation.test.ts** - Test Zod schemas for telemetry validation
**api.test.ts** - Test Express routes with Supertest (GET /api/plants, /api/health, etc.)
**repository.test.ts** (optional) - Test query logic with mocked database

Focus on:
- Telemetry validation (Zod): valid payload passes, invalid rejected
- API endpoints: 200 responses, 404 for unknown IDs, 400 for invalid bodies
- Error handling and edge cases

### 4. Worker Tests

Create tests in `worker/src/__tests__/`:

**threshold-checker.test.ts** - Test threshold evaluation logic
**alert-manager.test.ts** - Test cooldown logic and Discord notifications (mocked)

Focus on:
- Threshold breaches: soil_moisture_low/high, light_low, temp_low/high
- Cooldown: shouldCreateAlert returns false during cooldown, true after expiry
- Multiple simultaneous breaches
- Null/missing telemetry handling

### 5. Update Makefile

Replace `test` target stub:
```makefile
test:
	@echo "Running tests..."
	@if [ -d backend/src ]; then \
		echo "Testing backend..."; \
		cd backend && npm test; \
	fi
	@if [ -d worker/src ]; then \
		echo "Testing worker..."; \
		cd worker && npm test; \
	fi
	@echo "All tests passed"
```

## Constraints

- **Mock external dependencies**: Database, MQTT, Discord should all be Jest mocks
- **No Docker required**: Tests run without external services
- **Fast execution**: All tests should complete in <10 seconds
- **Focus on business logic**: Don't test infrastructure
- **TypeScript support**: All tests in TypeScript with ts-jest

## Definition of Done

- [ ] Jest and dependencies installed in backend and worker
- [ ] jest.config.js created for backend and worker
- [ ] Backend tests cover telemetry validation, API endpoints, error handling
- [ ] Worker tests cover threshold checker and alert manager (with mocked DB/Discord)
- [ ] Makefile `test` target runs both test suites
- [ ] `make test` exits with code 0
- [ ] All tests pass
- [ ] Tests run in <10 seconds
- [ ] Handoff document at runs/handoffs/task-010.md

## Success Criteria

Run verification:
```bash
cd backend && npm install && cd ..
cd worker && npm install && cd ..
make test
```

Expected output:
- "Running tests..."
- "Testing backend..." with Jest pass summary
- "Testing worker..." with Jest pass summary
- "All tests passed"
- Exit code: 0
```

---

### Task 011: E2E Tests with Playwright

**File:** `runs/tasks/task-011.md`

```markdown
---
task_id: task-011
title: E2E Tests with Playwright
role: lca-qa
follow_roles: []
post: [lca-docs, lca-gitops]
depends_on: [task-010]
inputs:
  - runs/plan.md
  - runs/handoffs/task-008.md
  - runs/handoffs/task-009.md
  - frontend/src/**
allowed_paths:
  - e2e/**
  - playwright.config.ts
  - package.json
  - Makefile
check_command: make e2e
handoff: runs/handoffs/task-011.md
---

## Goal

Add end-to-end tests using Playwright to verify the full system integration. Test critical user flows: viewing dashboard, configuring thresholds, viewing history charts, and alert generation. Ensure `make e2e` passes.

## Context

Phase 1-3 implemented the full stack (infra, backend, worker, frontend). Unit tests (task-010) cover business logic. E2E tests verify the entire system works together: MQTT → Backend → Database → Worker → Discord, and Frontend → API → Database.

## Requirements

### 1. Install Playwright

Create root-level `package.json` for E2E tests:
```json
{
  "name": "plantops-e2e",
  "private": true,
  "scripts": {
    "test:e2e": "playwright test",
    "test:e2e:ui": "playwright test --ui",
    "test:e2e:headed": "playwright test --headed"
  },
  "devDependencies": {
    "@playwright/test": "^1.40.0",
    "@types/node": "^20.10.0"
  }
}
```

### 2. Playwright Configuration

Create `playwright.config.ts`:
```typescript
import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false, // Run serially (tests depend on Docker state)
  timeout: 60000, // 60s per test
  retries: 1,
  workers: 1,
  use: {
    baseURL: 'http://localhost:3001',
    headless: true,
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { browserName: 'chromium' },
    },
  ],
});
```

### 3. E2E Test Structure

Create `e2e/` directory with tests:

**setup.spec.ts** - Verify Docker services are running
**dashboard.spec.ts** - Dashboard loads, plant cards visible, telemetry displays
**threshold-config.spec.ts** - Configure thresholds via modal, verify API update
**history-charts.spec.ts** - View history modal, switch time ranges, charts render
**integration.spec.ts** - Full flow: telemetry ingestion → worker alert → dashboard update

### 4. E2E Test: Dashboard

`e2e/dashboard.spec.ts`:
- Visit dashboard (http://localhost:3001)
- Verify page title "PlantOps Dashboard"
- Count plant cards (should be 6)
- Verify each card has: plant name, status badge, 3 telemetry metrics
- Verify auto-refresh works (wait 5s, check timestamp updates)

### 5. E2E Test: Threshold Configuration

`e2e/threshold-config.spec.ts`:
- Click "Configure" on first plant card
- Modal opens with threshold form
- Change soil_moisture_min value
- Click Save
- Verify success toast appears
- Verify modal closes
- Verify API was called (check Network tab or database)

### 6. E2E Test: History Charts

`e2e/history-charts.spec.ts`:
- Click "View History" on first plant card
- Modal opens with 3 charts
- Verify charts render (canvas or SVG elements present)
- Click "1h" time range button
- Verify charts update (new API call)
- Close modal

### 7. E2E Test: Integration Flow

`e2e/integration.spec.ts`:
- Wait for simulator to publish telemetry (10s)
- Verify telemetry appears in database
- Verify backend ingested data (check logs or query DB)
- Configure low threshold to trigger alert
- Wait for worker cycle (30s)
- Verify alert created in database
- Verify plant card shows critical status

### 8. Update Makefile

Replace `e2e` target stub:
```makefile
e2e:
	@echo "Running e2e tests..."
	@echo "Starting services..."
	@docker compose up -d
	@echo "Waiting for services to be ready..."
	@sleep 10
	@echo "Running Playwright tests..."
	@npm run test:e2e
	@echo "E2E tests passed"
```

### 9. Docker Compose Check

Add helper script `scripts/wait-for-services.sh`:
- Check all services are healthy (postgres, mosquitto, backend, worker, frontend)
- Use `docker compose ps` to verify status
- Retry up to 30 seconds
- Exit 1 if services not ready

## Constraints

- **Requires Docker Compose**: Tests assume services are running
- **Serial execution**: Tests must run one at a time (shared state in database)
- **Fast tests**: Each test should complete in <30 seconds
- **Headless mode**: Default to headless, provide option for headed debugging
- **Screenshots on failure**: Capture evidence for debugging

## Definition of Done

- [ ] Playwright installed with config
- [ ] `e2e/` directory with test files
- [ ] Dashboard test verifies 6 plant cards load
- [ ] Threshold config test verifies modal interaction
- [ ] History charts test verifies modal and time range switching
- [ ] Integration test verifies telemetry → alert flow
- [ ] Makefile `e2e` target starts services and runs Playwright
- [ ] `make e2e` exits with code 0
- [ ] All E2E tests pass
- [ ] Screenshots/videos captured on failure
- [ ] Handoff document at runs/handoffs/task-011.md

## Success Criteria

Run verification:
```bash
make e2e
```

Expected output:
- "Running e2e tests..."
- "Starting services..." (docker compose up)
- "Waiting for services to be ready..." (10s delay)
- "Running Playwright tests..."
- Playwright test runner output with ✓ marks
- "E2E tests passed"
- Exit code: 0
```

---

### Task 012: Final Documentation Polish

**File:** `runs/tasks/task-012.md`

```markdown
---
task_id: task-012
title: Final Documentation and Evidence Collection
role: lca-docs
follow_roles: []
post: [lca-gitops]
depends_on: [task-011]
inputs:
  - runs/plan.md
  - runs/handoffs/**
  - README.md
  - docs/architecture.md
  - docs/score.md
allowed_paths:
  - README.md
  - docs/**
check_command: test -f docs/score.md && test -d docs/evidence
handoff: runs/handoffs/task-012.md
---

## Goal

Polish all documentation to meet challenge submission requirements: complete README, architecture documentation, scoring report, and terminal evidence. Ensure all deliverables are publication-ready.

## Context

Phase 1-4 implementation is complete. Tests pass. System works end-to-end. Final step is documenting the work for competition submission and code review.

## Requirements

### 1. README.md Completions

Verify and update:
- [x] Quick Start section with clear setup steps
- [x] Prerequisites listed
- [x] `make up` command documented
- [x] Service descriptions (all 6 services)
- [x] Environment variables documented
- [x] Project structure overview
- [ ] **Add**: Final deliverables checklist status
- [ ] **Add**: Screenshot of dashboard
- [ ] **Add**: Link to docs/score.md

### 2. docs/architecture.md Enhancements

Complete sections:
- [ ] System architecture diagram (ASCII or link to image)
- [ ] Data flow diagram
- [ ] Database schema (complete with indexes, constraints)
- [ ] MQTT topic structure
- [ ] REST API documentation (all endpoints with request/response examples)
- [ ] Worker evaluation algorithm (threshold logic, cooldown)
- [ ] Frontend component hierarchy
- [ ] Docker service dependencies
- [ ] Security considerations
- [ ] Performance characteristics
- [ ] Scaling considerations

### 3. docs/score.md Completion

Create comprehensive scoring report:

**Format:**
```markdown
# PlantOps Challenge Scoring

## Token Usage

| Model | Input Tokens | Output Tokens | Cache Reads | Cache Writes | Total Cost |
|-------|--------------|---------------|-------------|--------------|------------|
| Sonnet 4.5 | X | Y | Z | W | $XX.XX |

## Query Count

- Total Claude API calls: X
- Average tokens per query: Y
- Peak query: Z tokens

## Human Interventions

- Count: X
- Reasons: [list reasons]
- Resolution: [how resolved]

## Time Breakdown

- Total wall-clock time: X hours
- Planning: Y hours
- Implementation: Z hours
- Testing: W hours

## Challenges Faced

1. [Challenge description]
   - Solution: [how solved]
   - Tokens used: X

2. [Challenge description]
   - Solution: [how solved]
   - Tokens used: X

## Key Decisions

- [Decision with rationale]
- [Decision with rationale]

## What Went Well

- [Highlight]
- [Highlight]

## What Could Improve

- [Learning]
- [Learning]
```

### 4. docs/evidence/ Collection

Create terminal output evidence:

**Required files:**
- `docker-compose-up.txt` - Output of `docker compose up` showing all services starting
- `make-check.txt` - Output of `make check` showing lint, typecheck, test, e2e all passing
- `dashboard-screenshot.png` - Screenshot of dashboard with 6 plant cards
- `history-chart-screenshot.png` - Screenshot of history modal with charts
- `database-query.txt` - Output of telemetry and alerts queries
- `discord-alert.png` - Screenshot of Discord alert message (if configured)
- `api-health.txt` - Output of `curl http://localhost:3001/api/health`

### 5. Challenge Checklist Verification

Review challenge spec and mark completion:

**Competition deliverables:**
- [ ] Working implementation (`docker compose up`)
- [ ] Passing commands: `make lint`, `make typecheck`, `make test`, `make e2e`
- [ ] `.env.example` with all variables
- [ ] `README.md` with run instructions
- [ ] `docs/architecture.md` complete
- [ ] `docs/score.md` complete
- [ ] `docs/evidence/` with proof files

**PlantOps-specific requirements:**
- [ ] MQTT telemetry ingestion working
- [ ] 6 plants with simulated data
- [ ] TimescaleDB storing time-series
- [ ] REST API serving plants and history
- [ ] Worker evaluating thresholds
- [ ] Discord alerts sending (optional but demo-able)
- [ ] Frontend dashboard with cards
- [ ] History charts with 24h data
- [ ] Threshold configuration working

### 6. Quality Checks

Before finalizing:
- [ ] No broken links in documentation
- [ ] All code examples in docs are syntax-highlighted
- [ ] All terminal outputs are properly formatted
- [ ] Screenshots are clear and readable
- [ ] Typos corrected
- [ ] Consistent formatting throughout

## Constraints

- **No implementation changes**: This is documentation-only
- **Evidence must be real**: Capture actual terminal output, not fabricated
- **Completeness**: All sections required by challenge spec must be present
- **Readability**: Documentation should be clear for code reviewers

## Definition of Done

- [ ] README.md complete with all sections
- [ ] docs/architecture.md complete and accurate
- [ ] docs/score.md with token usage, interventions, time breakdown
- [ ] docs/evidence/ with 6+ evidence files
- [ ] Challenge checklist items all verified
- [ ] No TODO or placeholder content in docs
- [ ] All commands in docs tested and working
- [ ] Screenshots captured and included
- [ ] Handoff document at runs/handoffs/task-012.md

## Success Criteria

Manual review:
1. Read README.md - should be clear for new user to get started
2. Read docs/architecture.md - should explain system design comprehensively
3. Review docs/score.md - should have accurate token counts and analysis
4. Check docs/evidence/ - should have proof of working system
5. Verify no broken links or missing images
6. Confirm all challenge requirements documented
```

---

### Task 013: Integration Verification and Final Checklist

**File:** `runs/tasks/task-013.md`

```markdown
---
task_id: task-013
title: Integration Verification and Final Submission Checklist
role: lca-qa
follow_roles: []
post: [lca-docs, lca-gitops]
depends_on: [task-012]
inputs:
  - runs/plan.md
  - README.md
  - docs/**
  - docker-compose.yml
  - Makefile
allowed_paths:
  - docs/evidence/**
  - runs/verification.md
check_command: make check && docker compose up -d && sleep 30 && curl -f http://localhost:3001/api/health
handoff: runs/handoffs/task-013.md
---

## Goal

Perform final integration verification: test one-command startup, validate all services are healthy, verify end-to-end flows work, and complete the final submission checklist. This is the last task before marking the challenge complete.

## Context

Phase 4 complete. Tests pass. Documentation finished. Final step is systematic verification that everything works as specified in the challenge requirements.

## Requirements

### 1. Fresh Environment Test

Simulate fresh clone and setup:
```bash
# Clean slate
docker compose down -v
docker system prune -f

# Follow README.md instructions exactly
cp .env.example .env
make up
```

Verify:
- [ ] All 6 services start successfully
- [ ] No errors in logs
- [ ] Health checks pass for all services

### 2. Service Health Verification

Test each service individually:

**PostgreSQL + TimescaleDB:**
```bash
docker exec plantops-postgres psql -U plantops -d plantops -c "\dt"
```
Expected: tables `plants`, `telemetry`, `alerts`

**Mosquitto MQTT:**
```bash
docker exec plantops-mosquitto mosquitto_sub -t 'plants/+/telemetry' -C 1
```
Expected: JSON telemetry message received

**Simulator:**
```bash
docker compose logs simulator | grep "Published"
```
Expected: Regular telemetry publish logs

**Backend:**
```bash
curl http://localhost:3001/api/health
```
Expected: `{"status":"healthy",...}`

**Worker:**
```bash
docker compose logs worker | grep "Evaluation cycle"
```
Expected: Regular evaluation logs

**Frontend:**
```bash
curl -I http://localhost:3001
```
Expected: 200 OK with HTML

### 3. End-to-End Flow Verification

Test complete data flow:

**Step 1: Telemetry Ingestion**
- Wait 30 seconds for simulator to publish
- Query database: `SELECT COUNT(*) FROM telemetry;`
- Expected: Growing count (>300 records for 6 plants)

**Step 2: API Data Retrieval**
- `curl http://localhost:3001/api/plants`
- Expected: JSON array with 6 plants, each with latest_telemetry

**Step 3: History Query**
- `curl "http://localhost:3001/api/plants/monstera/history?hours=24"`
- Expected: JSON with time-series data array

**Step 4: Threshold Update**
```bash
curl -X POST http://localhost:3001/api/plants/monstera/config \
  -H "Content-Type: application/json" \
  -d '{"soil_moisture_min": 25}'
```
Expected: 200 OK with updated plant config

**Step 5: Alert Generation**
- Configure threshold to trigger alert (very high min value)
- Wait for worker cycle (30s)
- Query: `SELECT * FROM alerts ORDER BY timestamp DESC LIMIT 1;`
- Expected: New alert record

**Step 6: Frontend Dashboard**
- Open http://localhost:3001 in browser
- Expected: 6 plant cards with telemetry data
- Click "Configure" button → modal opens
- Click "View History" → charts display

### 4. Make Targets Verification

Test all quality gates:

```bash
make lint
make typecheck
make test
make e2e
make check
```

Expected: All pass with exit code 0

### 5. Documentation Verification

Check all deliverables exist:
- [ ] `README.md` - complete with setup instructions
- [ ] `.env.example` - all variables documented
- [ ] `docs/architecture.md` - system design documented
- [ ] `docs/score.md` - token usage and scoring filled
- [ ] `docs/evidence/` - terminal outputs and screenshots
- [ ] `Makefile` - targets: up, down, logs, lint, typecheck, test, e2e, check

### 6. Create Verification Report

Create `runs/verification.md`:
```markdown
# Final Verification Report

**Date:** 2026-01-06
**Branch:** run/001
**Verifier:** lca-qa

## Pre-Submission Checklist

### System Functionality
- [x] `docker compose up` starts all services
- [x] All 6 services healthy
- [x] MQTT telemetry flowing
- [x] Backend ingesting to TimescaleDB
- [x] Worker evaluating thresholds
- [x] Frontend dashboard accessible
- [x] API endpoints responding
- [x] Database persisting data

### Quality Gates
- [x] `make lint` passes
- [x] `make typecheck` passes
- [x] `make test` passes
- [x] `make e2e` passes
- [x] `make check` passes

### Documentation
- [x] README.md complete
- [x] .env.example complete
- [x] docs/architecture.md complete
- [x] docs/score.md complete
- [x] docs/evidence/ populated

### End-to-End Flows
- [x] Telemetry: Simulator → MQTT → Backend → Database
- [x] API: Frontend → REST → Database → Response
- [x] Alerts: Worker → Threshold Check → Database → Discord
- [x] Config: Frontend → API → Database → Worker

## Issues Found

[None / List any issues]

## Resolution

[How issues were resolved]

## Final Sign-Off

System ready for submission: YES / NO

Signature: _______________________
Date: 2026-01-06
```

### 7. Cleanup and Optimization

Before final commit:
- [ ] Remove any debug console.logs
- [ ] Remove commented-out code
- [ ] Ensure .dockerignore excludes node_modules
- [ ] Verify .gitignore excludes .env (but includes .env.example)
- [ ] Check for sensitive data in code (API keys, passwords)
- [ ] Verify Docker images build cleanly

## Constraints

- **Real verification**: Manually test, don't assume it works
- **Fresh environment**: Test from clean slate
- **No shortcuts**: Follow README exactly as new user would
- **Document issues**: Any problems found must be noted and fixed

## Definition of Done

- [ ] Fresh `make up` succeeds on clean environment
- [ ] All 6 services healthy
- [ ] End-to-end flows verified (telemetry → database → API → frontend)
- [ ] All make targets pass (lint, typecheck, test, e2e, check)
- [ ] Documentation complete and accurate
- [ ] Verification report created at runs/verification.md
- [ ] No critical issues outstanding
- [ ] System ready for competition submission
- [ ] Handoff document at runs/handoffs/task-013.md

## Success Criteria

**Final validation command:**
```bash
# Clean start
docker compose down -v
git status  # Should be clean or only have expected changes

# One-command setup
cp .env.example .env
make up

# Wait for services
sleep 30

# Verify
make check
curl -f http://localhost:3001/api/health
curl -f http://localhost:3001/api/plants | jq '.[] | .name'

# Expected:
# - make check: all pass
# - health: {"status":"healthy"}
# - plants: 6 plant names listed
```

If all pass: **Challenge complete, ready for submission.**
```

---

**Planner Note:** All four Phase 4 task specifications are complete. These need to be written to `runs/tasks/task-010.md` through `task-013.md` before execution.

**Dependency chain:** 010 → 011 → 012 → 013 (sequential)

**Phase 4 completion criteria:** All tests passing, documentation complete, system verified end-to-end, ready for challenge submission.
