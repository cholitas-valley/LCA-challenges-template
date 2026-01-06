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
