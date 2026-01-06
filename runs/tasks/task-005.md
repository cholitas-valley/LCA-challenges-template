---
task_id: task-005
title: Backend REST API with Express
role: lca-backend
post: [lca-docs]
depends_on: [task-004]
inputs:
  - runs/plan.md
  - runs/handoffs/task-004.md
  - backend/package.json
  - database/schema.sql
allowed_paths:
  - backend/src/**
  - backend/package.json
  - backend/package-lock.json
check_command: make typecheck && cd backend && npm run build
handoff: runs/handoffs/task-005.md
---

## Goal

Implement the REST API using Express with the following endpoints:
1. `GET /api/plants` - List all plants with current status
2. `GET /api/plants/:id/history?hours=24` - Time-series telemetry data
3. `POST /api/plants/:id/config` - Update plant thresholds
4. `GET /api/health` - Service health check

The API should provide data for the frontend dashboard and allow configuration updates.

## Scope

**Install dependencies:**
- Add `express@^4.18.2` to backend/package.json
- Add `@types/express@^4.17.21` to backend/devDependencies
- Add `cors@^2.8.5` to backend/package.json
- Add `@types/cors@^2.8.17` to backend/devDependencies
- Add `helmet@^7.1.0` for security headers

**Create files:**
- `backend/src/api/server.ts` - Express server setup with middleware
- `backend/src/api/routes/plants.ts` - Plant routes implementation
- `backend/src/api/routes/health.ts` - Health check endpoint
- `backend/src/api/middleware/error-handler.ts` - Global error handling
- `backend/src/db/plants-repository.ts` - Database queries for plants data
- `backend/src/schema/plant-config.ts` - Zod schema for config updates

**Update files:**
- `backend/src/index.ts` - Start Express server alongside MQTT subscriber
- `.env.example` - Add PORT=3000, CORS_ORIGIN=http://localhost:5173

**API Endpoints:**

1. **GET /api/plants**
   - Returns array of plants with current status
   - Include: id, name, current telemetry (latest values), thresholds, last_alert_at
   - Join plants table with latest telemetry data
   - Response: 200 OK with JSON array

2. **GET /api/plants/:id/history**
   - Query param: `hours` (default: 24, max: 168 for 1 week)
   - Returns time-series data for specified plant
   - Use TimescaleDB time_bucket for efficient aggregation (5-minute buckets)
   - Response: 200 OK with JSON array of {timestamp, soil_moisture, light, temperature}
   - Response: 404 Not Found if plant doesn't exist

3. **POST /api/plants/:id/config**
   - Body: `{ soil_moisture_min?, soil_moisture_max?, light_min?, light_max?, temp_min?, temp_max?, alert_cooldown_minutes? }`
   - Validate with Zod schema
   - Update thresholds in plants table
   - Response: 200 OK with updated plant config
   - Response: 400 Bad Request if validation fails
   - Response: 404 Not Found if plant doesn't exist

4. **GET /api/health**
   - Check database connection (simple SELECT 1)
   - Check MQTT connection status
   - Response: 200 OK if healthy: `{ status: "healthy", database: "connected", mqtt: "connected" }`
   - Response: 503 Service Unavailable if unhealthy

**Middleware:**
- CORS: Allow requests from frontend (configurable via CORS_ORIGIN env)
- Helmet: Security headers
- express.json(): Parse JSON bodies
- Error handler: Catch all errors, log, return appropriate HTTP status

## Constraints

- Use Express 4.x (stable, well-documented)
- All endpoints under `/api` prefix
- Return proper HTTP status codes (200, 400, 404, 500, 503)
- Validate all input with Zod schemas
- Use parameterized SQL queries (prevent SQL injection)
- Handle database errors gracefully (return 500 with generic message)
- Log all requests (method, path, status, duration)
- Use async/await for all database operations
- Port configurable via PORT environment variable (default: 3000)

## Definition of Done

- [ ] Backend package.json includes express, cors, helmet, and their type definitions
- [ ] All files created as specified in Scope
- [ ] All 4 endpoints implemented and working
- [ ] Zod validation for POST /api/plants/:id/config
- [ ] Database repository queries use parameterized statements
- [ ] Error handler middleware catches and formats errors
- [ ] CORS configured for frontend origin
- [ ] Health check verifies database and MQTT connections
- [ ] Environment variables added to `.env.example`
- [ ] `make typecheck` passes for backend
- [ ] `cd backend && npm run build` succeeds
- [ ] Manual testing verified:
  - `docker compose up -d postgres mosquitto simulator backend`
  - `curl http://localhost:3000/api/health` returns healthy status
  - `curl http://localhost:3000/api/plants` returns array of 6 plants
  - `curl http://localhost:3000/api/plants/monstera/history?hours=1` returns telemetry
  - `curl -X POST -H "Content-Type: application/json" -d '{"soil_moisture_min":25}' http://localhost:3000/api/plants/monstera/config` updates config
- [ ] Backend container exposes port 3000 in docker-compose.yml
- [ ] Handoff file created at `runs/handoffs/task-005.md`
