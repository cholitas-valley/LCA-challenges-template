---
task_id: task-001
title: Project scaffolding
role: lca-backend
follow_roles: []
post:
  - lca-recorder
  - lca-gitops
depends_on: []
inputs:
  - objective.md
  - runs/plan.md
allowed_paths:
  - docker-compose.yml
  - Makefile
  - .env.example
  - backend/**
  - mosquitto/**
  - .gitignore
check_command: docker compose config --quiet && make help
handoff: runs/handoffs/task-001.md
---

# Task 001: Project Scaffolding

## Goal

Set up the foundational project structure including Docker Compose configuration, Makefile, and backend Python project skeleton. This establishes the development environment that all subsequent tasks will build upon.

## Requirements

### Docker Compose (docker-compose.yml)

Create services for:
- **db**: PostgreSQL 15 with TimescaleDB extension
  - Port 5432
  - Volume for data persistence
  - Health check
- **mosquitto**: Eclipse Mosquitto 2.x
  - Ports 1883 (MQTT), 9001 (WebSocket)
  - Volume for config and password file
  - Password file authentication enabled
- **backend**: Python FastAPI application
  - Port 8000
  - Depends on db and mosquitto
  - Environment variables from .env
- **frontend**: React development server (placeholder for now)
  - Port 5173
  - Depends on backend

### Makefile

Create targets:
- `help`: List available commands
- `up`: Start all services (`docker compose up -d`)
- `down`: Stop all services
- `logs`: Show logs (`docker compose logs -f`)
- `db-shell`: Connect to PostgreSQL
- `check`: Run all checks (lint, type-check, test)
- `test`: Run pytest

### Backend Skeleton (backend/)

Create:
- `backend/pyproject.toml`: Dependencies (fastapi, uvicorn, asyncpg, pydantic, pytest, etc.)
- `backend/Dockerfile`: Python 3.11 slim image
- `backend/src/main.py`: FastAPI app with health endpoint
- `backend/src/__init__.py`: Package init
- `backend/tests/__init__.py`: Test package init
- `backend/tests/test_health.py`: Test for health endpoint

### Mosquitto Config (mosquitto/)

Create:
- `mosquitto/mosquitto.conf`: Basic config with password_file auth
- `mosquitto/passwd`: Empty password file (will be populated by device registration)

### Environment (.env.example)

Template with:
- DATABASE_URL
- MQTT_HOST, MQTT_PORT
- DISCORD_WEBHOOK_URL (optional)
- ENCRYPTION_KEY (for LLM API key storage)

## Definition of Done

- [ ] `docker compose config --quiet` exits 0 (valid compose file)
- [ ] `make help` displays available targets
- [ ] backend/pyproject.toml exists with required dependencies
- [ ] backend/Dockerfile exists
- [ ] backend/src/main.py exists with FastAPI app
- [ ] mosquitto/mosquitto.conf exists with password_file directive
- [ ] .env.example exists with all required variables
- [ ] .gitignore includes .env, __pycache__, .venv, etc.

## Constraints

- Do NOT start services or run database migrations
- Do NOT implement any business logic
- Keep Dockerfile simple (no multi-stage yet)
- Use standard library where possible
