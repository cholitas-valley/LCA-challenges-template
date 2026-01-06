---
task_id: task-001
title: Project scaffolding and infrastructure setup
role: lca-backend
post: [lca-docs]
depends_on: []
inputs:
  - README.md
  - docs/architecture.md
  - runs/plan.md
allowed_paths:
  - Makefile
  - docker-compose.yml
  - .env.example
  - .gitignore
  - backend/**
  - worker/**
  - simulator/**
  - scripts/**
check_command: make lint
handoff: runs/handoffs/task-001.md
---

## Goal

Create the foundational project structure with Docker Compose orchestration, Makefile targets, and environment configuration. This establishes the infrastructure baseline for all subsequent implementation tasks.

## Scope

**Create:**
- `Makefile` with targets: `up`, `down`, `logs`, `lint`, `typecheck`, `test`, `e2e`, `check`
- `docker-compose.yml` with services: mosquitto, postgres, backend, worker, frontend, simulator
- `.env.example` with all required environment variables
- `scripts/check.sh` that runs all quality gates
- Update `.gitignore` for Node.js, Docker, and environment files

**Docker services to define:**
1. `mosquitto` - MQTT broker (eclipse-mosquitto:2)
2. `postgres` - PostgreSQL 15 with TimescaleDB extension
3. `backend` - Node.js service (will be implemented in later tasks)
4. `worker` - Node.js service (will be implemented in later tasks)
5. `frontend` - React app with Vite (will be implemented in later tasks)
6. `simulator` - Node.js service that publishes MQTT telemetry

**Environment variables required:**
- `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB`
- `MQTT_BROKER_URL` (e.g., mqtt://mosquitto:1883)
- `DISCORD_WEBHOOK_URL`
- `DATABASE_URL` (connection string)
- `NODE_ENV`

## Constraints

- Use Docker Compose v2 syntax
- All services must have health checks
- PostgreSQL must use TimescaleDB image (timescale/timescaledb:latest-pg15)
- Use volume mounts for database persistence
- Makefile must be POSIX-compatible
- `make check` must run: lint, typecheck, test, e2e (in that order)

## Definition of Done

- [ ] `Makefile` exists with all required targets
- [ ] `docker-compose.yml` defines all 6 services with health checks
- [ ] `.env.example` contains all environment variables with example values
- [ ] `scripts/check.sh` exists and is executable
- [ ] `.gitignore` updated for Node.js, Docker, .env files
- [ ] `make lint` runs successfully (even if no code exists yet, should exit 0)
- [ ] `docker compose config` validates the compose file
- [ ] File structure is ready for backend/worker/frontend/simulator implementation

## Notes

- For now, `make lint`, `make typecheck`, `make test`, `make e2e` can be minimal stubs that exit 0
- Actual linting/testing logic will be added as each component is implemented
- Backend/worker/frontend/simulator Dockerfiles will be created in subsequent tasks
