# Run Plan: PlantOps Challenge (run/001)

## Objective

Build a self-hosted plant monitoring system that ingests sensor telemetry via MQTT, stores time-series data in PostgreSQL+TimescaleDB, displays live dashboard with history charts, and sends Discord alerts when plants need attention.

**Challenge spec:** [challenge-001-plantops.md](https://github.com/cholitas-valley/liga-cholita-autonoma/blob/main/challenges/challenge-001-plantops.md)

## Architecture Overview

### System Components

1. **MQTT Broker (Mosquitto)**: Message bus for sensor telemetry
2. **Simulator**: Publishes telemetry for 6 plants to `plants/<plant_id>/telemetry`
3. **Backend (Node.js/TypeScript)**: MQTT subscriber + REST API
4. **Database (PostgreSQL + TimescaleDB)**: Time-series storage + configuration
5. **Worker (Node.js/TypeScript)**: Threshold evaluation + Discord alerts with cooldown
6. **Frontend (React/TypeScript)**: Dashboard with plant cards + 24h history charts

### Data Flow

```
Simulator → MQTT → Backend → PostgreSQL+TimescaleDB
                                   ↓
                            Worker → Discord
                                   ↓
                            Frontend (REST API)
```

### Key Topics & Interfaces

**MQTT Topics:**
- `plants/<plant_id>/telemetry` - JSON: `{timestamp, soil_moisture, light, temperature}`

**REST API Endpoints:**
- `GET /api/plants` - List all plants with current status
- `GET /api/plants/:id/history?hours=24` - Time-series data
- `POST /api/plants/:id/config` - Update thresholds
- `GET /api/health` - Service health check

**Database Schema:**
- `plants` table - configuration (id, name, thresholds, alert_cooldown)
- `telemetry` hypertable - time-series (timestamp, plant_id, soil_moisture, light, temperature)
- `alerts` table - alert history (timestamp, plant_id, alert_type, message, sent_to_discord)

## Technology Decisions

### Backend Stack
- **Node.js + TypeScript** (target: v20 LTS)
- **MQTT.js** for MQTT client
- **Express** for REST API
- **pg + TimescaleDB extension** for time-series database
- **node-postgres** for DB queries
- **Zod** for payload validation

### Frontend Stack
- **React + TypeScript** (with Vite)
- **TanStack Query** for API state management
- **Recharts** for 24h history charts
- **Tailwind CSS** for styling

### Infrastructure
- **Docker Compose** for one-command orchestration
- **Separate containers**: mosquitto, postgres, backend, worker, frontend, simulator
- **Health checks** for all services
- **Volume mounts** for DB persistence

### Quality Gates
- **ESLint + Prettier** for linting
- **TypeScript strict mode** for type checking
- **Jest + Supertest** for backend tests
- **Playwright** for e2e tests
- **Makefile** with `lint`, `typecheck`, `test`, `e2e` targets

## Key Risks & Mitigation

### Risk 1: Out-of-order telemetry
**Mitigation:** Backend accepts any timestamp, TimescaleDB handles ordering. Use `ON CONFLICT DO NOTHING` if duplicate timestamps occur.

### Risk 2: Alert spam (threshold oscillation)
**Mitigation:** Worker implements per-plant alert cooldown (e.g., 30 minutes). Store `last_alert_sent_at` in DB.

### Risk 3: Discord rate limits
**Mitigation:** Cooldown + idempotency key (hash of plant_id + alert_type + day). Log all alerts to DB regardless of Discord success.

### Risk 4: Backend crash during MQTT flood
**Mitigation:** Use MQTT QoS 1, buffer incoming messages in memory queue, batch DB inserts every 1-2 seconds.

### Risk 5: Frontend polling overhead
**Mitigation:** Use 5-second polling interval for current status, 30-second for history. Consider SSE or WebSockets in future iteration.

## Task Phases (Rolling Plan)

### Phase 1: Infrastructure Foundation (tasks 001-003)
- Scaffold project structure (Makefile, docker-compose.yml, .env.example)
- Set up PostgreSQL + TimescaleDB schema + migrations
- Set up MQTT broker + simulator

### Phase 2: Backend Core (tasks 004-006) - TASKS GENERATED
- **task-004**: MQTT subscriber + DB ingestion (batched inserts)
- **task-005**: REST API with Express (4 endpoints: plants list, history, config, health)
- **task-006**: Worker service (threshold evaluation + Discord alerts with cooldown)

### Phase 3: Frontend (tasks 007-009) - TASKS GENERATED
- **task-007**: Frontend scaffolding (React + Vite + TanStack Query + Tailwind)
- **task-008**: Dashboard UI with plant cards and real-time status
- **task-009**: History charts with Recharts (24h time-series visualization)

### Phase 4: Testing & Documentation (tasks 010-013) - TASKS GENERATED
- **task-010**: Unit tests for backend and worker (Jest + Supertest)
- **task-011**: E2E tests with Playwright (docker compose integration)
- **task-012**: Final documentation polish (README, architecture.md, score.md, evidence/)
- **task-013**: Integration verification and final scoring (docker compose up validation)

## Definition of Done (Challenge Requirements)

- [ ] Working implementation (`docker compose up` starts all services)
- [ ] Commands pass: `make lint`, `make typecheck`, `make test`, `make e2e`
- [ ] `.env.example` with all required variables
- [ ] `README.md` with setup/run instructions
- [ ] `docs/architecture.md` updated
- [ ] `docs/score.md` completed with tokens/queries/interventions
- [ ] `docs/evidence/` with terminal output proofs
- [ ] Dashboard shows 6 plants with current status + 24h charts
- [ ] Discord alerts triggered when thresholds breached (with cooldown)
- [ ] All components run in Docker containers
- [ ] Database persists data across restarts

---

**Plan created:** 2026-01-06T15:30:00Z
**Last updated:** 2026-01-06T18:30:00Z
**Run branch:** run/001
**Current phase:** Phase 4 (Testing & Documentation) - Planning Complete
**Next task:** task-010 (Backend and Worker Unit Tests)

## Rolling Plan Status

**Phase 1: COMPLETE** (tasks 001-003)
- All infrastructure in place
- Docker Compose, PostgreSQL+TimescaleDB, MQTT broker, simulator working

**Phase 2: READY** (tasks 004-006)
- task-004: Backend MQTT subscriber + DB ingestion
- task-005: Backend REST API (Express + 4 endpoints)
- task-006: Worker service (thresholds + Discord alerts)

**Phase 3: COMPLETE** (tasks 007-009)
- task-007: Frontend scaffolding (React + Vite + TanStack Query + Tailwind CSS) ✓
- task-008: Dashboard UI with plant cards and real-time status ✓
- task-009: History charts with Recharts (24h time-series visualization) ✓

**Phase 4: READY** (tasks 010-013)
- task-010: Backend and Worker Unit Tests (Jest + Supertest) - QA role
- task-011: E2E Tests with Playwright (full integration testing) - QA role
- task-012: Final Documentation Polish (README, architecture, score, evidence) - Docs role
- task-013: Integration Verification (docker compose up validation, final checklist) - QA role

**IMPORTANT NOTE:**
Task specifications have been generated and documented in `runs/notes.md` (lines 989-1834). However, the planner role cannot create new files directly. The orchestrator must create the following task files before execution can begin:
- `runs/tasks/task-010.md`
- `runs/tasks/task-011.md`
- `runs/tasks/task-012.md`
- `runs/tasks/task-013.md`

Copy the markdown content from `runs/notes.md` sections to the respective task files.
