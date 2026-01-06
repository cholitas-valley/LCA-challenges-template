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
