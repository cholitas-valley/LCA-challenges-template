# Architecture

> 001 — PlantOps

## System Overview

Plant monitoring pipeline:

**MQTT ingestion → DB (time-series) → Dashboard + Alerts**

Primary runtime goal: ingest telemetry for multiple plants, persist history, display current status + charts, and trigger Discord alerts when thresholds are breached.

## System Components

| Component | Purpose | Port | Health Check |
|-----------|---------|------|--------------|
| MQTT Broker (Mosquitto) | Message bus for sensor telemetry | 1883, 9001 | mosquitto_sub test |
| Simulator | Publishes plant telemetry (e.g., 6 plants) to MQTT | - | Process running |
| Backend | MQTT subscriber + REST API for dashboard/config | 3001 | GET /api/health |
| Database (PostgreSQL + TimescaleDB) | Time-series storage + configuration tables | 5432 | pg_isready |
| Worker | Threshold evaluation + Discord alerts (30s interval, cooldown) | - | ps aux \| grep node |
| Frontend | React dashboard with plant cards (nginx on port 3001 in Docker) | 3001 | GET / |

## System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                          PLANTOPS SYSTEM                             │
└─────────────────────────────────────────────────────────────────────┘


   ┌──────────┐
   │Simulator │ (6 plants, 10s interval, random walk algorithm)
   │(Node.js) │
   └─────┬────┘
         │ publishes telemetry
         │ plants/<plant_id>/telemetry
         ▼
   ┌──────────┐
   │Mosquitto │ (MQTT broker, QoS 1, ports 1883, 9001)
   │  MQTT    │
   │ Broker   │
   └─────┬────┘
         │ subscribes
         │ plants/+/telemetry
         ▼
   ┌──────────────────────────────────────────────────────────┐
   │              BACKEND SERVICE (Node.js + Express)          │
   │                                                           │
   │  ┌─────────────────┐         ┌────────────────────────┐  │
   │  │ MQTT Subscriber │────────▶│  Batched Repository    │  │
   │  │ (Zod validation)│         │  (100 msg OR 2s flush) │  │
   │  └─────────────────┘         └──────────┬─────────────┘  │
   │                                         │                │
   │  ┌─────────────────────────────────────▼──────────────┐  │
   │  │         REST API (Express + CORS)                   │  │
   │  │  - GET /api/plants (latest telemetry)              │  │
   │  │  - GET /api/plants/:id/history?hours=24            │  │
   │  │  - POST /api/plants/:id/config (update thresholds) │  │
   │  │  - GET /api/health (db + mqtt status)              │  │
   │  └─────────────────────────────────────────────────────┘  │
   └───────────────────────────┬───────────────────────────────┘
                               │ writes telemetry
                               ▼
   ┌──────────────────────────────────────────────────────────┐
   │   POSTGRESQL + TIMESCALEDB (Port 5432)                   │
   │                                                           │
   │   Tables:                                                 │
   │   - plants (config, thresholds, cooldown)                │
   │   - telemetry (hypertable, time-series data)             │
   │   - alerts (alert history, discord status)               │
   │                                                           │
   │   Indexes:                                                │
   │   - (plant_id, timestamp DESC)                           │
   │   - timestamp DESC                                       │
   │                                                           │
   │   TimescaleDB:                                            │
   │   - Hypertable: telemetry (timestamp, plant_id)          │
   │   - Chunking: 7-day chunks                               │
   │   - Aggregation: time_bucket('5 minutes')                │
   └───────────────────┬───────────────┬──────────────────────┘
                       │               │
                       │               │ queries every 30s
          queries via  │               ▼
          REST API     │      ┌───────────────┐
                       │      │ WORKER SERVICE│
                       │      │   (Node.js)   │
                       │      │               │
                       │      │ - Fetch plants│
                       │      │ - Get latest  │
                       │      │   telemetry   │
                       │      │ - Check 5     │
                       │      │   alert types │
                       │      │ - 60min       │
                       │      │   cooldown    │
                       │      └───────┬───────┘
                       │              │ sends webhook
                       │              ▼
                       │      ┌──────────────┐
                       │      │   DISCORD    │
                       │      │   Webhook    │
                       │      │  (Optional)  │
                       │      └──────────────┘
                       │
                       ▼
   ┌──────────────────────────────────────────────────────────┐
   │      FRONTEND (React + Vite + nginx, Port 3001)          │
   │                                                           │
   │  ┌────────────────────────────────────────────────────┐  │
   │  │  Dashboard (TanStack Query, 5s polling)            │  │
   │  │                                                     │  │
   │  │  - 6 Plant Cards (status badges, telemetry)        │  │
   │  │  - ThresholdConfigModal (edit thresholds)          │  │
   │  │  - PlantHistoryModal (Recharts, 1h-7d)             │  │
   │  │  - Responsive grid layout (3/2/1 columns)          │  │
   │  └────────────────────────────────────────────────────┘  │
   └───────────────────────────────────────────────────────────┘


LEGEND:
───▶ Data flow
┌──┐ Service/Component
│  │ Container

```

## System Data Flow

**Telemetry Flow (MQTT → Database)**:
1. Simulator publishes JSON telemetry to `plants/<plant_id>/telemetry` (10s intervals)
2. Backend MQTT subscriber receives, validates with Zod schemas
3. Backend batches inserts (100 messages OR 2 seconds)
4. TimescaleDB stores in hypertable with out-of-order insert support

**Alert Flow (Database → Discord)**:
1. Worker queries plants and latest telemetry every 30 seconds
2. Evaluates 5 alert types (soil moisture, light, temperature thresholds)
3. Creates alert records in database with cooldown check (60 min default)
4. Sends Discord webhook notifications (optional, configurable)

**Dashboard Flow (Frontend → Backend API)**:
1. Frontend polls GET /api/plants every 5 seconds (TanStack Query)
2. Backend queries database with LEFT JOIN LATERAL for latest telemetry
3. Frontend renders 6 plant cards with status badges and telemetry metrics
4. User clicks "View History" → Frontend fetches GET /api/plants/:id/history?hours=24
5. Backend queries TimescaleDB with time_bucket('5 minutes') aggregation
6. Frontend renders Recharts line charts with threshold indicators

**Configuration Flow (Frontend → Backend → Database)**:
1. User clicks "Configure" → Opens ThresholdConfigModal
2. User edits thresholds → Submits form
3. Frontend sends POST /api/plants/:id/config with Zod-validated payload
4. Backend updates plants table (partial update)
5. Frontend invalidates cache → Dashboard re-fetches plants

Notes (high-level):
- Telemetry arrives on MQTT topics like `plants/<plant_id>/telemetry`.
- Backend validates payloads and writes to DB (including out-of-order timestamps).
- Worker evaluates thresholds (per-plant config) and emits alerts with cooldown.
- Frontend queries backend API for current state + 24h history.

## Docker Infrastructure

### Service Dependencies

```
mosquitto (MQTT broker)
    ↓
simulator (publishes to MQTT)

postgres (TimescaleDB)
    ↓
backend (subscribes to MQTT, stores in DB)
    ↓
worker (reads DB, sends alerts)

backend (API)
    ↓
frontend (dashboard)
```

### Docker Compose Services

All services are orchestrated via `docker-compose.yml`:

1. **mosquitto** (eclipse-mosquitto:2)
   - Exposes MQTT on port 1883, WebSocket on 9001
   - Persistent volumes: mosquitto-data, mosquitto-logs
   - Default configuration (no auth)

2. **postgres** (timescale/timescaledb:latest-pg15)
   - TimescaleDB extension enabled
   - Persistent volume: postgres-data
   - Environment: POSTGRES_USER, POSTGRES_PASSWORD, POSTGRES_DB

3. **backend** (Node.js service)
   - Multi-stage Dockerfile (currently stub)
   - Depends on: postgres, mosquitto
   - Environment: DATABASE_URL, MQTT_BROKER_URL, NODE_ENV

4. **worker** (Node.js service)
   - Multi-stage Dockerfile (TypeScript build)
   - Depends on: postgres, backend
   - Environment: DATABASE_URL, DISCORD_WEBHOOK_URL, WORKER_INTERVAL_SECONDS, NODE_ENV
   - Runs threshold evaluation every 30 seconds (configurable)
   - Non-root user (node) for security

5. **frontend** (React + Vite + TypeScript)
   - Multi-stage Dockerfile (build with Node 20, serve with nginx)
   - Depends on: backend
   - Environment: VITE_API_URL, NODE_ENV
   - Port: 3001 (nginx serves static build on port 80, exposed as 3001)
   - Features: TanStack Query, Tailwind CSS, Lucide icons

6. **simulator** (Node.js service)
   - Multi-stage Dockerfile (currently stub)
   - Depends on: mosquitto
   - Environment: MQTT_BROKER_URL, NODE_ENV

### Makefile Targets

Quality gates and orchestration managed via Makefile:

- `make up` - Start all services (`docker compose up -d`)
- `make down` - Stop all services (`docker compose down`)
- `make logs` - Stream logs from all services
- `make check` - Run all quality gates (lint, typecheck, test, e2e)
- `make lint` - Linting (stub)
- `make typecheck` - TypeScript type checking (stub)
- `make test` - Unit tests (stub)
- `make e2e` - End-to-end tests (stub)

Note: Quality gate targets (lint, typecheck, test, e2e) are currently stubs that exit successfully. They will be implemented as each service is built.

### Environment Configuration

Required environment variables (see `.env.example`):

```bash
# Database
POSTGRES_USER=plantops
POSTGRES_PASSWORD=<secure-password>
POSTGRES_DB=plantops
DATABASE_URL=postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@postgres:5432/${POSTGRES_DB}

# MQTT
MQTT_BROKER_URL=mqtt://mosquitto:1883

# Alerts
DISCORD_WEBHOOK_URL=<your-webhook-url>

# Environment
NODE_ENV=development

# Frontend
VITE_API_URL=http://localhost:3001
```

---

## AI Agent Architecture (Claude Code)

This challenge uses **Claude Code** as a multi-agent orchestrated system. The goal is to run long-horizon "plan → implement → check → docs → commit" loops with **role-specific constraints** and **explicit handoffs**.

### Agent & Flow Diagram

```
┌──────────────────────────────────────────────────────────────────────────┐
│                            ORCHESTRATOR                                  │
│                           (CLAUDE.md)                                    │
│                                                                          │
│  ┌─────────┐   ┌─────────┐   ┌─────────┐   ┌─────────┐   ┌─────────┐     │
│  │PLANNING │──▶│BETWEEN_ │──▶│IN_TASK  │──▶│BETWEEN_ │──▶│BLOCKED  │     │
│  │         │   │TASKS    │   │         │   │TASKS    │   │(human)  │     │
│  └────┬────┘   └────┬────┘   └────┬────┘   └─────────┘   └─────────┘     │
│       │             │             │                                      │
│       ▼             ▼             ▼                                      │
│  ┌─────────┐   ┌─────────┐   ┌────────────────────────────────────┐      │
│  │ planner │   │ arbiter │   │          ROLE AGENTS               │      │
│  └─────────┘   └─────────┘   │  ┌─────────┐ ┌─────────┐ ┌──────┐  │      │
│                              │  │ backend │ │frontend │ │  qa  │  │      │
│                              │  └─────────┘ └─────────┘ └──────┘  │      │
│                              │  ┌─────────┐ ┌─────────┐           │      │
│                              │  │  docs   │ │ gitops  │           │      │
│                              │  └─────────┘ └─────────┘           │      │
│                              └────────────────────────────────────┘      │
└──────────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────────┐
│                          HOOKS (out-of-band)                             │
│                                                                          │
│  PreToolUse ─────────▶ tool-use-record.py ─────▶ runs/tools/usage.jsonl  │
│                                                                          │
│  Stop / SubagentStop┬▶ usage-record.py ───────▶ runs/usage/usage.jsonl   │
│                     └▶ arbiter-scheduler.py ──▶ runs/arbiter/pending.json│
│                                                                          │
│  PermissionRequest ──▶ permission-record.py ───▶ runs/permissions/*.jsonl│
└──────────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────────┐
│                          EXECUTION LOOP                                  │
│                                                                          │
│  ┌────────────────────────────────────────────────────────────────┐      │
│  │                                                                │      │
│  ▼                                                                │      │
│  ┌──────────┐  pending?  ┌──────────┐  invoke  ┌──────────┐       │      │
│  │ arbiter  │───────────▶│  check   │─────────▶│ execute  │       │      │
│  │  check   │    no      │ decision │   role   │   task   │       │      │
│  └──────────┘            └────┬─────┘          └────┬─────┘       │      │
│                               │                     │             │      │
│                          needs_human?               │             │      │
│                          yes │ no                   │             │      │
│                              ▼                      ▼             │      │
│                        ┌─────────┐           ┌──────────┐         │      │
│                        │ BLOCKED │           │ handoff  │─────────┘      │
│                        │ (stop)  │           │ + post   │                │
│                        └─────────┘           └──────────┘                │
└──────────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────────┐
│                          TASK LIFECYCLE                                  │
│                                                                          │
│  runs/tasks/task-XXX.md                                                  │
│         │                                                                │
│         ▼                                                                │
│  ┌────────────┐   ┌────────────┐   ┌────────────┐   ┌────────────┐       │
│  │ read task  │──▶│invoke role │──▶│ check_cmd  │──▶│   write    │       │
│  │ frontmatter│   │   agent    │   │ until pass │   │  handoff   │       │
│  └────────────┘   └────────────┘   └────────────┘   └─────┬──────┘       │
│                                                           │              │
│                                                           ▼              │
│                                                   runs/handoffs/         │
│                                                   task-XXX.md            │
└──────────────────────────────────────────────────────────────────────────┘
```

This design is based on Claude Code features:
- **Memory file**: `CLAUDE.md` is automatically loaded as project memory at launch.
- **Project subagents**: `.claude/agents/*.md` define tool access, system prompts, and separate contexts.
- **Hierarchical settings**: `.claude/settings.json` defines project-wide permissions; participants can override locally.
- **Hooks**: `Stop` / `SubagentStop` hooks are used to collect usage/telemetry without spending LLM tokens.

References:
- Memory (`CLAUDE.md`): https://docs.anthropic.com/en/docs/claude-code/memory
- Subagents: https://docs.anthropic.com/en/docs/claude-code/sub-agents
- Settings: https://docs.anthropic.com/en/docs/claude-code/settings
- Hooks: https://docs.anthropic.com/en/docs/claude-code/hooks

### Repo Layout (Agent Protocol)

```
CLAUDE.md                    # Orchestrator protocol (auto-loaded)
.claude/
├── settings.json            # Project-wide permissions + hooks
├── agents/
│   ├── lca-planner.md       # Generates plan + tasks
│   ├── lca-backend.md       # Backend implementation
│   ├── lca-frontend.md      # Frontend implementation
│   ├── lca-docs.md          # Documentation updates
│   ├── lca-gitops.md        # Branch/commit/push hygiene
│   ├── lca-qa.md            # Check/fix loop
│   └── lca-arbiter.md       # Periodic checkpoint auditor
├── hooks/
│   ├── usage-record.py      # Token tracking (no LLM overhead)
│   ├── tool-use-record.py   # Tool invocation logging (PreToolUse)
│   ├── permission-record.py # Permission request logging (when prompts occur)
│   └── arbiter-scheduler.py # Triggers arbiter on token/time thresholds
└── skills/
    └── lca-protocol/
        └── SKILL.md         # Protocol definition (task/state/handoff formats)

runs/
├── plan.md                  # Generated: architecture decisions + task outline
├── state.json               # Generated: current task + phase + role + completed tasks
├── tasks/                   # Generated: task-XXX.md (YAML frontmatter + DoD)
├── handoffs/                # Generated: task-XXX.md (what changed + verify + next steps)
├── usage/                   # Generated: usage.jsonl (token usage records)
├── tools/                   # Generated: usage.jsonl (tool invocation log)
├── permissions/             # Generated: requests.jsonl (permission prompts, if any)
├── arbiter/                 # Arbiter checkpoint system
│   ├── config.json          # Thresholds (tokens, time, files, lines, permissions)
│   ├── state.json           # Last checkpoint metadata
│   ├── pending.json         # Snapshot triggering arbiter (transient)
│   ├── decision.json        # Arbiter output (needs_human, reasons)
│   └── checkpoints/         # Historical checkpoint reports
└── notes.md                 # Generated: blocking notes (if stuck)
```

### Orchestration Flow

The orchestrator is defined in `CLAUDE.md` (the "protocol controller").

```
1. Boot:
   * If no tasks/state exist → set phase = "PLANNING"
   * Invoke lca-planner to generate runs/plan.md + runs/tasks/* + runs/state.json
   * Set phase = "BETWEEN_TASKS"

2. Arbiter check (before each task):
   * If runs/arbiter/pending.json exists → invoke lca-arbiter
   * Read runs/arbiter/decision.json
   * If needs_human == true → set phase = "BLOCKED" and STOP

3. Execute:
   * Read runs/state.json → open current runs/tasks/task-XXX.md
   * Set phase = "IN_TASK", current_role = <role from task>
   * Invoke the task's role agent (backend/frontend/docs/qa/gitops)

4. Validate (inside the role agent):
   * Run task.check_command until it passes (fix failures and re-run)

5. Handoff:
   * Role agent writes runs/handoffs/task-XXX.md
   * If task specifies post agents → invoke them in order (e.g., docs → gitops)

6. Advance:
   * Mark task complete in runs/state.json
   * Set phase = "BETWEEN_TASKS", clear current_role
   * Proceed to next task (loop to step 2)
```

### State Phases

| Phase | Description |
|-------|-------------|
| `PLANNING` | Planner is generating/updating tasks |
| `IN_TASK` | A role agent is actively executing a task |
| `BETWEEN_TASKS` | Task completed; arbiter may trigger |
| `BLOCKED` | Human review required (arbiter decision or repeated failures) |

### Role Agents

| Agent | Primary responsibility | Typical constraints |
|-------|-------------------------|---------------------|
| `lca-planner` | Generate plan + task queue + state | edits **runs/** only; no Bash |
| `lca-backend` | Ingestion, API, DB schema, worker logic | obey `allowed_paths`; run checks |
| `lca-frontend` | Dashboard UI, charts, client state | obey `allowed_paths`; run checks |
| `lca-docs` | README + docs updates | docs-only (README.md, docs/**) unless task allows more |
| `lca-qa` | Run checks, diagnose failures, minimal fixes | smallest-diff fixes; do not weaken tests |
| `lca-gitops` | Branch/commit/push workflow | commit after checks pass; push may require approval |
| `lca-arbiter` | Periodic checkpoint auditor | edits **runs/arbiter/** only; read-only git commands |

### Task Format

Each task file is generated by the planner in `runs/tasks/task-XXX.md` and assigns a role explicitly:

```yaml
task_id: task-001
title: Short title
role: lca-backend
post: [lca-docs, lca-gitops]
allowed_paths:
  - backend/**
check_command: make check
handoff: runs/handoffs/task-001.md
```

Task body includes:

* Goal
* Definition of Done (concrete, checkable)
* Any task-specific constraints (scope limits, files to touch, etc.)

### Handoff Contract

After each task, the executing role agent must write a handoff containing at least:

* Summary of changes
* Files touched
* Interfaces/contracts changed (MQTT topics, API endpoints, DB migrations)
* How to verify (commands + any runtime steps)
* Next steps / risks

This is what enables deterministic context passing between role agents without relying on long chat history.

### Token Tracking

Token usage is captured **out-of-band** (no LLM overhead) via Claude Code hooks:

* `Stop` and `SubagentStop` trigger `.claude/hooks/usage-record.py`
* The hook records usage into `runs/usage/usage.jsonl`
* Records are tagged with the current `task_id` and role via `runs/state.json`

### Arbiter System

The arbiter is an independent "blackhat" auditor that operates between tasks to decide if human review is needed.

**Triggering:**
* `Stop` and `SubagentStop` hooks trigger `.claude/hooks/arbiter-scheduler.py`
* Scheduler checks if phase == "BETWEEN_TASKS" (never runs mid-task)
* If token/time thresholds are exceeded, writes `runs/arbiter/pending.json`

**Checkpoints:**
* When `pending.json` exists, orchestrator invokes `lca-arbiter`
* Arbiter reviews: token burn, diff size, permission prompts, objective drift
* Writes checkpoint report to `runs/arbiter/checkpoints/<timestamp>.md`
* Writes `runs/arbiter/decision.json` with `needs_human` boolean

**Thresholds (configurable in `runs/arbiter/config.json`):**
* `min_tokens_between_checkpoints`: 30000
* `min_minutes_between_checkpoints`: 20
* `max_files_changed_without_human`: 25
* `max_lines_changed_without_human`: 800
* `max_permission_prompts_between_checkpoints`: 3

**Tool Usage Logging:**
* `PreToolUse` hook triggers `.claude/hooks/tool-use-record.py` for every Bash invocation
* Logs to `runs/tools/usage.jsonl` - works even with `bypassPermissions` mode
* Tagged with `task_id`, `role`, and `phase` for arbiter review

**Permission Logging:**
* `PermissionRequest` and `Notification` hooks trigger `.claude/hooks/permission-record.py`
* Only fires when actual permission prompts occur (not in `bypassPermissions` mode)
* Logs to `runs/permissions/requests.jsonl`

### Permissions Model

* **Project-wide baseline** permissions live in `.claude/settings.json` (shared).
* **Per-agent differences** are controlled via each subagent file's YAML frontmatter:
  * `tools` (what the agent can do)
  * `permissionMode` (how aggressively it auto-approves)
  * `model` (optional)
* **Per-participant overrides** should go in `.claude/settings.local.json` (not committed), if needed.

Sensitive file reads (e.g. `.env`, private keys) are denied by default in project settings.

---

## Database Schema

### Overview

The system uses PostgreSQL 15 with TimescaleDB extension for efficient time-series storage. The schema consists of three main tables:

1. **plants** - Plant configuration and thresholds
2. **telemetry** - Time-series telemetry data (TimescaleDB hypertable)
3. **alerts** - Alert history and delivery status

### Plants Table

Stores plant configurations, threshold values, and alert cooldown state.

```sql
CREATE TABLE plants (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  soil_moisture_min INTEGER NOT NULL,
  soil_moisture_max INTEGER NOT NULL,
  light_min INTEGER NOT NULL,
  temperature_min NUMERIC(5,2) NOT NULL,
  temperature_max NUMERIC(5,2) NOT NULL,
  alert_cooldown_minutes INTEGER NOT NULL DEFAULT 60,
  last_alert_sent_at TIMESTAMPTZ
);
```

**Fields:**
- `id`: Unique plant identifier (e.g., "monstera", "snake-plant")
- `name`: Human-readable name (e.g., "Monstera Deliciosa")
- `soil_moisture_min/max`: Acceptable soil moisture range (percentage)
- `light_min`: Minimum acceptable light level (lux)
- `temperature_min/max`: Acceptable temperature range (Celsius)
- `alert_cooldown_minutes`: Minimum time between alerts for same plant (default: 60 minutes)
- `last_alert_sent_at`: Timestamp of last alert sent (for cooldown tracking)

**Seed Data (6 plants):**
1. `monstera` - Monstera Deliciosa (moisture: 20-80, light: 300+, temp: 18-27°C)
2. `snake-plant` - Snake Plant (moisture: 15-70, light: 200+, temp: 15-29°C)
3. `pothos` - Pothos (moisture: 25-85, light: 250+, temp: 17-30°C)
4. `fiddle-leaf` - Fiddle Leaf Fig (moisture: 30-85, light: 400+, temp: 18-26°C)
5. `spider-plant` - Spider Plant (moisture: 20-80, light: 300+, temp: 16-28°C)
6. `peace-lily` - Peace Lily (moisture: 35-90, light: 250+, temp: 18-27°C)

### Telemetry Table (Hypertable)

Stores time-series sensor readings from each plant. Converted to a TimescaleDB hypertable for efficient time-series operations.

```sql
CREATE TABLE telemetry (
  timestamp TIMESTAMPTZ NOT NULL,
  plant_id TEXT NOT NULL,
  soil_moisture INTEGER NOT NULL,
  light INTEGER NOT NULL,
  temperature NUMERIC(5,2) NOT NULL,
  PRIMARY KEY (timestamp, plant_id),
  FOREIGN KEY (plant_id) REFERENCES plants(id) ON DELETE CASCADE
);
```

**Fields:**
- `timestamp`: Reading timestamp (UTC)
- `plant_id`: Reference to plant
- `soil_moisture`: Soil moisture percentage (0-100)
- `light`: Light level in lux
- `temperature`: Temperature in Celsius

**Indexes:**
- `idx_telemetry_plant_id` - Composite index on (plant_id, timestamp DESC) for per-plant queries
- `idx_telemetry_timestamp` - Index on timestamp DESC for time-range queries

**TimescaleDB Features:**
- Automatic data chunking by time (default: 7 days per chunk)
- Efficient time-range queries and aggregations
- Support for out-of-order inserts
- Compression and retention policies (configurable)

### Alerts Table

Stores alert history and Discord delivery status.

```sql
CREATE TABLE alerts (
  id SERIAL PRIMARY KEY,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  plant_id TEXT NOT NULL,
  alert_type TEXT NOT NULL,
  message TEXT NOT NULL,
  sent_to_discord BOOLEAN NOT NULL DEFAULT FALSE,
  FOREIGN KEY (plant_id) REFERENCES plants(id) ON DELETE CASCADE
);
```

**Fields:**
- `id`: Auto-incrementing alert ID
- `timestamp`: Alert creation timestamp
- `plant_id`: Reference to plant
- `alert_type`: Type of alert (e.g., "soil_moisture_low", "temperature_high")
- `message`: Human-readable alert message
- `sent_to_discord`: Whether alert was successfully sent to Discord

**Indexes:**
- `idx_alerts_plant_id` - Composite index on (plant_id, timestamp DESC)
- `idx_alerts_timestamp` - Index on timestamp DESC

### Database Migrations

Migrations are stored in `backend/migrations/` and executed via the migration runner.

**Current migrations:**
- `001_initial_schema.sql` - Creates all tables, indexes, hypertable, and seed data

**Running migrations:**
```bash
cd backend
npm run migrate
```

Or via Docker (automatically runs on container startup):
```bash
docker compose up backend
```

### Connection Management

Database connections are managed via a PostgreSQL connection pool (`pg.Pool`):
- Max connections: 20
- Idle timeout: 30 seconds
- Connection timeout: 2 seconds
- Reads `DATABASE_URL` from environment

**Module:** `backend/src/db/client.ts`

## MQTT Topics

The system uses MQTT as the primary message bus for plant sensor telemetry. The Mosquitto broker is configured for local development with anonymous access.

### Broker Configuration

- **Port 1883**: Standard MQTT protocol
- **Port 9001**: WebSockets protocol (for browser-based clients)
- **Authentication**: Anonymous access (development only - must be secured for production)
- **Persistence**: Enabled at `/mosquitto/data/`
- **Logging**: All levels to stdout

Configuration file: `mosquitto/mosquitto.conf`

### Telemetry Topics

**Pattern**: `plants/<plant_id>/telemetry`

**QoS**: 1 (at-least-once delivery)

**Payload Format** (JSON):
```json
{
  "timestamp": "2026-01-06T15:50:23.456Z",
  "soil_moisture": 45.3,
  "light": 67.8,
  "temperature": 23.2
}
```

**Field Descriptions**:
- `timestamp` - ISO 8601 UTC timestamp of sensor reading
- `soil_moisture` - Soil moisture percentage (0-100, dry to wet)
- `light` - Light level percentage (0-100, dark to bright)
- `temperature` - Temperature in Celsius (15-35 typical range)

**Plant IDs** (6 plants matching database seed):
- `monstera` - Monstera Deliciosa
- `snake-plant` - Snake Plant
- `pothos` - Pothos
- `fiddle-leaf` - Fiddle Leaf Fig
- `spider-plant` - Spider Plant
- `peace-lily` - Peace Lily

### Testing MQTT Messages

**Subscribe to all plant telemetry:**
```bash
docker exec -it plantops-mosquitto mosquitto_sub -t 'plants/+/telemetry' -v
```

**Subscribe to specific plant:**
```bash
docker exec -it plantops-mosquitto mosquitto_sub -t 'plants/monstera/telemetry' -v
```

**Publish test message:**
```bash
docker exec -it plantops-mosquitto mosquitto_pub \
  -t 'plants/monstera/telemetry' \
  -m '{"timestamp":"2026-01-06T15:50:23.456Z","soil_moisture":45.3,"light":67.8,"temperature":23.2}'
```

### Simulator Service

The simulator publishes realistic telemetry for all 6 plants every 10 seconds using a random walk algorithm.

**Implementation**: `simulator/src/index.ts`

**Features**:
- Random walk with realistic sensor variation
- 5% probability of spikes/dips to trigger alerts
- Graceful shutdown handlers (SIGTERM/SIGINT)
- Automatic reconnection with 5-second retry
- QoS 1 for reliable message delivery

**Random Walk Parameters**:
- Soil moisture: ±3 per iteration (slow changes)
- Light: ±5 per iteration (moderate fluctuation)
- Temperature: ±1 per iteration (very slow changes)
- Threshold breaches: 10-point spike/dip (5% probability)

**Start simulator:**
```bash
docker compose up -d simulator
docker compose logs -f simulator
```

Expected logs show connection confirmation and telemetry publishing every 10 seconds.

### Backend MQTT Ingestion

The backend service subscribes to MQTT telemetry topics, validates incoming messages, and performs batched inserts into TimescaleDB.

**Implementation**:
- `backend/src/mqtt/client.ts` - MQTT client singleton with reconnection
- `backend/src/mqtt/subscriber.ts` - Topic subscription and message handling
- `backend/src/schema/telemetry.ts` - Zod validation schema
- `backend/src/db/telemetry-repository.ts` - Batched database inserts

**Features**:
- Subscribes to `plants/+/telemetry` with QoS 1
- Validates all incoming payloads with Zod schemas
- Batches inserts for efficiency (100 messages OR 2 seconds, whichever comes first)
- Graceful shutdown with pending batch flush
- Automatic reconnection with exponential backoff (1s → 2s → 4s → max 30s)
- Handles QoS 1 duplicates with `ON CONFLICT DO NOTHING`

**Batching Behavior**:
- **Batch Size**: 100 messages (triggers immediate flush)
- **Flush Interval**: 2 seconds since first message in batch
- **Trigger**: Whichever comes first (size or time)
- **On Shutdown**: Automatically flushes any pending messages

**Validation Rules**:
- `timestamp`: ISO 8601 UTC datetime string
- `soil_moisture`: 0-100 (number)
- `light`: 0-100 (number)
- `temperature`: -50 to 100 (number)

**Data Transformation**:
- `soil_moisture` and `light` are rounded to integers before database insert
- `temperature` is stored as NUMERIC(5,2)
- `plant_id` is extracted from MQTT topic using regex pattern

**Error Handling**:
- Invalid JSON: Logged, message skipped
- Schema validation failure: Logged with Zod errors, message skipped
- Database insert failure: Logged, records re-queued for retry
- MQTT connection loss: Automatic reconnection with exponential backoff
- Invalid topic format: Logged, message skipped

**Start backend:**
```bash
docker compose up -d backend
docker compose logs -f backend
```

**Expected logs**:
- "Starting PlantOps Backend..."
- "Database connection verified"
- "Connecting to MQTT broker at mqtt://mosquitto:1883"
- "MQTT client connected successfully"
- "Subscribed successfully: [{ topic: 'plants/+/telemetry', qos: 1 }]"
- "MQTT subscriber started"
- Periodic "Flushed X telemetry records (Y inserted, Z duplicates)"

**Verify ingestion:**
```bash
# Check telemetry count (should be growing)
docker exec -it plantops-timescaledb psql -U plantops -d plantops -c "SELECT COUNT(*) FROM telemetry;"

# View recent telemetry
docker exec -it plantops-timescaledb psql -U plantops -d plantops -c "SELECT * FROM telemetry ORDER BY timestamp DESC LIMIT 10;"
```

**Environment Variables**:
- `MQTT_BROKER_URL` - MQTT broker connection string (default: `mqtt://mosquitto:1883`)
- `MQTT_CLIENT_ID` - Unique client identifier (default: `plantops-backend`)
- `DATABASE_URL` - PostgreSQL connection string

## REST API

The backend exposes a REST API for the frontend dashboard and external integrations. All endpoints use the `/api` prefix and return JSON responses.

### API Server

**Implementation**: `backend/src/api/server.ts`

**Port**: 3001 (configurable via `API_PORT` environment variable)

**Middleware Stack**:
1. Helmet - Security headers
2. CORS - Configurable via `CORS_ORIGIN` environment variable (default: http://localhost:5173)
3. express.json() - Body parsing
4. Request logger - Logs method, path, status, duration
5. Error handler - Global error handling with Zod validation support

### API Endpoints

#### GET /api/plants

Returns all 6 plants with their latest telemetry values.

**Query Parameters**: None

**Response**: Array of `PlantWithTelemetry` objects

**Example**:
```bash
curl http://localhost:3001/api/plants
```

**Response**:
```json
[
  {
    "id": "monstera",
    "name": "Monstera Deliciosa",
    "soil_moisture_min": 20,
    "soil_moisture_max": 80,
    "light_min": 300,
    "temperature_min": 18.00,
    "temperature_max": 27.00,
    "alert_cooldown_minutes": 60,
    "last_alert_sent_at": null,
    "latest_telemetry": {
      "timestamp": "2026-01-06T15:50:23.456Z",
      "soil_moisture": 45,
      "light": 67,
      "temperature": 23.20
    }
  }
]
```

**Implementation Details**:
- Uses PostgreSQL LEFT JOIN LATERAL for efficient "latest per plant" query
- Returns null for `latest_telemetry` if no telemetry data exists for a plant
- Optimized for dashboard overview display

#### GET /api/plants/:id/history

Returns time-series telemetry data for a specific plant.

**Path Parameters**:
- `id` - Plant ID (e.g., "monstera")

**Query Parameters**:
- `hours` - Number of hours of history to retrieve (default: 24, max: 168)

**Response**: Object with plant metadata and time-bucketed telemetry array

**Example**:
```bash
curl http://localhost:3001/api/plants/monstera/history?hours=24
```

**Response**:
```json
{
  "plant_id": "monstera",
  "plant_name": "Monstera Deliciosa",
  "hours": 24,
  "data": [
    {
      "timestamp": "2026-01-06T15:50:00.000Z",
      "soil_moisture_avg": 45.2,
      "light_avg": 67.8,
      "temperature_avg": 23.15
    }
  ]
}
```

**Implementation Details**:
- Uses TimescaleDB's `time_bucket('5 minutes')` for aggregation
- Returns 5-minute averaged data points
- Efficient for charting and historical analysis
- Returns 404 if plant not found

#### POST /api/plants/:id/config

Updates plant threshold configuration.

**Path Parameters**:
- `id` - Plant ID (e.g., "monstera")

**Request Body** (all fields optional):
```json
{
  "soil_moisture_min": 25,
  "soil_moisture_max": 85,
  "light_min": 350,
  "temperature_min": 19.0,
  "temperature_max": 26.0,
  "alert_cooldown_minutes": 90
}
```

**Response**: Updated `PlantConfig` object

**Example**:
```bash
curl -X POST http://localhost:3001/api/plants/monstera/config \
  -H "Content-Type: application/json" \
  -d '{"soil_moisture_min": 25, "light_min": 350}'
```

**Response**:
```json
{
  "id": "monstera",
  "name": "Monstera Deliciosa",
  "soil_moisture_min": 25,
  "soil_moisture_max": 80,
  "light_min": 350,
  "temperature_min": 18.00,
  "temperature_max": 27.00,
  "alert_cooldown_minutes": 60,
  "last_alert_sent_at": null
}
```

**Implementation Details**:
- Validates request body with Zod schema (`PlantConfigUpdateSchema`)
- All fields are optional (partial update)
- Returns 400 Bad Request for validation errors
- Returns 404 Not Found if plant doesn't exist
- Updates only provided fields, leaves others unchanged

#### GET /api/health

Service health check for monitoring and orchestration.

**Query Parameters**: None

**Response**: Health status with component checks

**Example**:
```bash
curl http://localhost:3001/api/health
```

**Response (Healthy)**:
```json
{
  "status": "healthy",
  "timestamp": "2026-01-06T15:50:23.456Z",
  "database": "connected",
  "mqtt": "connected"
}
```

**Response (Degraded)**:
```json
{
  "status": "degraded",
  "timestamp": "2026-01-06T15:50:23.456Z",
  "database": "connected",
  "mqtt": "disconnected"
}
```

**HTTP Status Codes**:
- 200 - Healthy or degraded (at least database is working)
- 503 - Unhealthy (database connection failed)

**Implementation Details**:
- Checks database connection with `SELECT 1` query
- Checks MQTT connection status via `getMqttConnectionStatus()` function
- Returns degraded status if MQTT is down but database is up (API still functional)
- Used by Docker health checks and monitoring systems

### Repository Layer

Database operations are abstracted via the repository pattern.

**Implementation**: `backend/src/db/plants-repository.ts`

**Repository Interface**:
- `getAllWithLatestTelemetry()` - Get all plants with latest sensor readings
- `getById(plantId)` - Get plant configuration by ID
- `getTelemetryHistory(plantId, hours)` - Get time-bucketed telemetry history
- `updateConfig(plantId, updates)` - Partial update of plant configuration

### Error Handling

All errors are handled by the global error handler middleware.

**Error Types**:
- Zod validation errors → 400 Bad Request (with detailed validation errors)
- Not found → 404 Not Found
- Database errors → 500 Internal Server Error
- All errors are logged with context (method, path, error message, stack trace)

### Environment Variables

- `API_PORT` - Express server port (default: 3001)
- `CORS_ORIGIN` - Allowed CORS origin for frontend (default: http://localhost:5173)

### Type Safety

- All endpoints use TypeScript strict mode
- Zod schemas for runtime validation of request bodies
- Proper error handling with typed responses
- Type definitions exported for frontend consumption

### Security Considerations

**Current Status** (Development):
- No authentication or authorization
- Open CORS policy (configurable)
- No rate limiting

**Production Requirements**:
- Add authentication middleware (JWT or session-based)
- Configure restrictive CORS policy for production domains
- Add rate limiting middleware (e.g., express-rate-limit)
- Consider API key authentication for external integrations
- Add request validation middleware for all inputs
- Configure Helmet with production-appropriate security headers

### Testing

**Verify API is running**:
```bash
# Health check
curl http://localhost:3001/api/health

# Get all plants
curl http://localhost:3001/api/plants

# Get telemetry history
curl http://localhost:3001/api/plants/monstera/history?hours=24

# Update plant config
curl -X POST http://localhost:3001/api/plants/monstera/config \
  -H "Content-Type: application/json" \
  -d '{"soil_moisture_min": 25, "light_min": 350}'
```

**Docker Logs**:
```bash
docker compose logs -f backend
```

Expected log entries show Express server startup on port 3001 and request logging for each API call.

## Frontend Dashboard

The frontend is a React + TypeScript single-page application built with Vite. It provides a real-time dashboard for monitoring plant health and viewing telemetry history.

### Technology Stack

**Framework**: React 18 + TypeScript 5
**Build Tool**: Vite 6
**State Management**: TanStack Query (React Query) v5
**HTTP Client**: Axios
**Charting**: Recharts v2.10
**Styling**: Tailwind CSS v3
**Icons**: Lucide React
**Production Server**: nginx (SPA routing)

### Project Structure

```
frontend/
├── src/
│   ├── main.tsx              # App entry point with QueryClientProvider
│   ├── App.tsx               # Root component with routing
│   ├── api/
│   │   ├── client.ts         # Axios instance (base URL from VITE_API_URL)
│   │   ├── types.ts          # TypeScript interfaces (PlantWithTelemetry, etc.)
│   │   └── queries.ts        # TanStack Query hooks (usePlants, usePlantHistory, useUpdatePlantConfig)
│   ├── components/
│   │   ├── Layout.tsx        # Header and main layout
│   │   ├── PlantCard.tsx     # Plant status card with telemetry display
│   │   ├── PlantCardSkeleton.tsx  # Loading skeleton for plant cards
│   │   ├── TelemetryDisplay.tsx   # Metric display with threshold color coding
│   │   ├── ThresholdConfigModal.tsx  # Modal for editing plant thresholds
│   │   ├── PlantHistoryModal.tsx    # Large modal with 24h history charts
│   │   ├── HistoryChart.tsx         # Recharts line chart for single metric
│   │   ├── TimeRangeSelector.tsx    # Time range button group (1h, 6h, 24h, 7d)
│   │   └── EmptyChartState.tsx      # Empty state for charts with no data
│   ├── pages/
│   │   └── Dashboard.tsx     # Dashboard with plant cards grid
│   ├── utils/
│   │   ├── plantStatus.ts    # Plant health status calculator
│   │   ├── dateTime.ts       # Relative timestamp formatter
│   │   └── chartData.ts      # Telemetry to chart data transformation
│   └── styles/
│       └── index.css         # Tailwind CSS imports
├── Dockerfile                # Multi-stage build (node builder + nginx)
├── nginx.conf                # SPA routing configuration
├── package.json              # Dependencies and scripts
├── vite.config.ts            # Vite configuration
├── tsconfig.json             # TypeScript configuration
└── tailwind.config.js        # Tailwind CSS configuration
```

### API Client

**Implementation**: `frontend/src/api/client.ts`

Axios instance configured with:
- Base URL: `VITE_API_URL` environment variable (default: http://localhost:3000)
- Content-Type: application/json
- Timeout: 10 seconds

### TanStack Query Setup

**Implementation**: `frontend/src/main.tsx`, `frontend/src/api/queries.ts`

QueryClient configuration:
- refetchOnWindowFocus: false
- retry: 1
- staleTime: 3000ms

**Query Hooks**:

1. **usePlants()** - Fetches all plants with latest telemetry
   - Endpoint: GET /api/plants
   - Auto-refresh: 5 seconds (refetchInterval)
   - staleTime: 3 seconds
   - Returns: `PlantWithTelemetry[]`
   - Used by: Dashboard page

2. **usePlantHistory(plantId, hours)** - Fetches historical telemetry
   - Endpoint: GET /api/plants/:id/history?hours=24
   - Parameters: plantId (string), hours (number, default: 24)
   - Returns: HistoryResponse with plant metadata and telemetry array
   - Query key: ['plants', plantId, 'history', hours]
   - Automatically refetches when hours parameter changes
   - Used by: PlantHistoryModal

3. **useUpdatePlantConfig()** - Mutation hook for plant configuration
   - Endpoint: POST /api/plants/:id/config
   - Invalidates: plants query on success (automatic cache refresh)
   - Returns: Updated `PlantWithTelemetry`
   - Used by: ThresholdConfigModal

### Dashboard Components

**Implementation**: `frontend/src/pages/Dashboard.tsx`, `frontend/src/components/`, `frontend/src/utils/`

#### Dashboard Page

**File**: `frontend/src/pages/Dashboard.tsx`

**Layout**:
- Responsive CSS Grid layout:
  - Desktop (1024px+): 3 columns
  - Tablet (768-1024px): 2 columns
  - Mobile (<768px): 1 column
- Gap between cards: 1.5rem (gap-6)

**States**:
- **Loading**: Displays 3 PlantCardSkeleton components with animated pulse
- **Error**: Shows error message with AlertCircle icon and retry button
- **Success**: Renders grid of PlantCard components (one per plant)

**Features**:
- Real-time updates via TanStack Query (5-second polling)
- Error boundary with retry functionality
- Responsive breakpoints for optimal viewing on all devices

#### PlantCard Component

**File**: `frontend/src/components/PlantCard.tsx`

**Structure**:
1. **Header**:
   - Plant name (truncated with ellipsis)
   - Status badge with color-coded health indicator
2. **Telemetry Grid**:
   - 3 TelemetryDisplay components in responsive grid
   - Soil moisture (Droplet icon)
   - Light level (Sun icon)
   - Temperature (Thermometer icon)
3. **Footer**:
   - Last updated timestamp (relative time)
   - Configure button (Settings icon)

**Status Badges**:
- **Green** (healthy): All metrics within safe thresholds
- **Yellow** (warning): Metrics approaching thresholds (within 20%)
- **Red** (critical): Metrics outside thresholds
- **Gray** (unknown): No telemetry data available

**Optimization**: Wrapped with React.memo to prevent unnecessary re-renders

**Interactions**:
- Click configure button to open ThresholdConfigModal

#### TelemetryDisplay Component

**File**: `frontend/src/components/TelemetryDisplay.tsx`

**Purpose**: Reusable component for displaying individual telemetry metrics with threshold-based color coding

**Props**:
- `value`: Numeric sensor reading
- `unit`: Display unit (%, lux, °C)
- `icon`: Lucide React icon component
- `label`: Metric name (e.g., "Soil Moisture")
- `threshold_min`: Minimum safe threshold (optional)
- `threshold_max`: Maximum safe threshold (optional)

**Color Coding Logic**:
- **Red background** (critical): Value outside [min, max] thresholds
- **Yellow background** (warning): Value within 20% of threshold boundaries
- **Green background** (healthy): Value in safe range (>20% from thresholds)
- **Gray background** (unknown): No thresholds configured

**Visual Design**:
- Icon with configurable color
- Bold value display with unit
- Subtle label text
- Rounded corners with padding
- Shadow on hover

**Optimization**: Wrapped with React.memo

#### ThresholdConfigModal Component

**File**: `frontend/src/components/ThresholdConfigModal.tsx`

**Purpose**: Modal dialog for editing plant threshold configuration

**Form Fields**:
- Soil moisture min (0-100%, integer)
- Soil moisture max (0-100%, integer)
- Light min (0-1000 lux, integer)
- Temperature min (-50 to 100°C, decimal with 0.1 step)
- Temperature max (-50 to 100°C, decimal with 0.1 step)
- Alert cooldown (1-1440 minutes, integer)

**Features**:
- Controlled form inputs with useState
- Loading state during save (Loader2 spinner on submit button)
- Error message display for failed saves
- Backdrop click and X button to close
- Uses useUpdatePlantConfig mutation hook
- Automatic cache invalidation on successful save

**Validation**:
- Browser-native HTML5 validation (required, min, max, step)
- Type safety via TypeScript

**UX**:
- Modal overlay with semi-transparent backdrop
- Centered dialog with max-width
- Scroll support for small screens
- Close button (X icon) in header
- Cancel and Save buttons in footer

#### PlantCardSkeleton Component

**File**: `frontend/src/components/PlantCardSkeleton.tsx`

**Purpose**: Animated loading placeholder matching PlantCard layout

**Structure**:
- Header skeleton (name + badge placeholders)
- Grid skeleton (3 metric placeholders)
- Footer skeleton (timestamp + button placeholders)

**Animation**: Tailwind `animate-pulse` for loading effect

**Usage**: Displayed during initial data fetch (typically 3 skeletons)

#### PlantHistoryModal Component

**File**: `frontend/src/components/PlantHistoryModal.tsx`

**Purpose**: Large modal displaying 24-hour telemetry history with interactive charts

**Props**:
- `plant`: PlantWithTelemetry object
- `isOpen`: Boolean to control visibility
- `onClose`: Callback function to close modal

**Features**:
- Modal size: 80% viewport width (max-w-6xl), 90% height (max-h-[90vh])
- Fixed header with plant name and close button (X icon)
- Secondary header with TimeRangeSelector
- Scrollable body with three stacked HistoryChart components
- Fixed footer with data point count and close button
- Loading state: Loader2 spinner with message
- Error state: AlertCircle with error message
- Empty state: EmptyChartState component when no data

**State Management**:
- selectedHours state (default: 24)
- Uses usePlantHistory hook with selectedHours parameter
- Query automatically refetches when selectedHours changes

**Charts Displayed**:
1. Soil Moisture (%) with min/max thresholds
2. Light Level (lux) with minimum threshold
3. Temperature (°C) with min/max thresholds

#### HistoryChart Component

**File**: `frontend/src/components/HistoryChart.tsx`

**Purpose**: Reusable Recharts-based line chart for single telemetry metric

**Props**:
- `data`: ChartDataPoint[] (transformed telemetry data)
- `metricKey`: 'soil_moisture' | 'light' | 'temperature'
- `unit`: Display unit (%, lux, °C)
- `thresholdMin`: Minimum threshold (optional)
- `thresholdMax`: Maximum threshold (optional)
- `label`: Chart title

**Chart Configuration**:
- ResponsiveContainer: 100% width, 200px height
- Line: Green (#16a34a), 2px stroke, monotone interpolation
- CartesianGrid: Dashed, light gray (#e5e7eb)
- XAxis: Formatted time labels from data.time field
- YAxis: Unit label rotated -90 degrees
- Tooltip: White background with border, formatted values
- ReferenceLine: Red dashed lines (#ef4444, strokeDasharray="5 5") for thresholds

**Rendering**:
- Shows threshold lines only if thresholdMin/thresholdMax are provided
- connectNulls=false to skip rendering gaps in data
- Responsive width adjusts to container

#### TimeRangeSelector Component

**File**: `frontend/src/components/TimeRangeSelector.tsx`

**Purpose**: Button group for selecting time range

**Props**:
- `selected`: Current hours value
- `onChange`: Callback with new hours value

**Options**:
- 1h (1 hour)
- 6h (6 hours)
- 24h (24 hours, default)
- 7d (168 hours)

**Styling**:
- Active button: Green background (bg-green-600)
- Inactive buttons: Gray background (bg-gray-200)
- Horizontal button group with 0.5rem gap

#### EmptyChartState Component

**File**: `frontend/src/components/EmptyChartState.tsx`

**Purpose**: Display message when no historical data is available

**Features**:
- AlertCircle icon (gray)
- "No telemetry history available" heading
- Centered layout with padding
- Used in PlantHistoryModal when data array is empty

#### Utility Functions

**Plant Status Calculator** (`frontend/src/utils/plantStatus.ts`):
- `calculatePlantStatus(plant: PlantWithTelemetry): 'healthy' | 'warning' | 'critical' | 'unknown'`
- Logic:
  1. Returns 'unknown' if no telemetry data
  2. Returns 'critical' if any metric outside thresholds
  3. Returns 'warning' if any metric within 20% of thresholds
  4. Returns 'healthy' if all metrics in safe range
- Checks all 3 metrics: soil_moisture, light, temperature

**Date/Time Formatter** (`frontend/src/utils/dateTime.ts`):
- `formatTimestamp(timestamp: string): string`
- Returns relative time strings:
  - "X seconds ago" (0-59 seconds)
  - "X minutes ago" (1-59 minutes)
  - "X hours ago" (1-23 hours)
  - "X days ago" (1-6 days)
  - Date string for older timestamps (7+ days)

**Chart Data Transformer** (`frontend/src/utils/chartData.ts`):
- `transformTelemetryForChart(telemetry: Telemetry[]): ChartDataPoint[]`
- Converts API telemetry data to Recharts-compatible format
- Returns interface:
  ```typescript
  interface ChartDataPoint {
    timestamp: string;      // ISO 8601 timestamp
    soil_moisture: number | null;
    light: number | null;
    temperature: number | null;
    time: string;          // Formatted for X-axis (HH:MM or MMM DD HH:MM)
  }
  ```
- Logic:
  - Sorts telemetry by timestamp ascending (oldest first)
  - Formats time labels: HH:MM for intraday, MMM DD HH:MM for multi-day
  - Preserves null values (chart uses connectNulls=false)

**Component Hierarchy**:
```
Dashboard
├── PlantCard (per plant, React.memo optimized)
│   ├── Status Badge (healthy/warning/critical/unknown)
│   ├── TelemetryDisplay (×3: moisture, light, temp)
│   ├── ThresholdConfigModal (configure button)
│   └── PlantHistoryModal (view history button)
│       ├── TimeRangeSelector (1h, 6h, 24h, 7d)
│       ├── HistoryChart (×3: soil moisture, light, temperature)
│       │   ├── ResponsiveContainer (Recharts)
│       │   ├── LineChart with Line, XAxis, YAxis, Tooltip, Grid
│       │   └── ReferenceLine (×2: min/max thresholds)
│       └── EmptyChartState (if no data)
└── PlantCardSkeleton (×3 during loading)
```

**Dashboard Features Summary**:
- **Responsive grid layout**: CSS Grid with 3/2/1 column breakpoints (lg/md/default)
- **Real-time monitoring**: 5-second polling with TanStack Query refetchInterval
- **Status calculation**: Plant health based on threshold proximity (calculatePlantStatus utility)
- **Color-coded metrics**: Threshold-aware background colors (red/yellow/green/gray)
- **Loading skeletons**: Animated PlantCardSkeleton with pulse effect
- **Threshold configuration**: Modal dialog for editing plant thresholds
- **History charts**: Interactive Recharts visualization with 1h/6h/24h/7d time ranges
- **Chart features**: Green line graphs with red threshold indicators, hover tooltips, responsive layout
- **Relative timestamps**: Human-readable time display via formatTimestamp utility
- **Error states**: Retry button with AlertCircle icon
- **Performance**: React.memo optimizations on PlantCard and TelemetryDisplay

**Layout Features**:
- Header with PlantOps branding (Sprout icon)
- Navigation placeholder for future expansion
- Main content area with padding and max-width

### Styling

**Tailwind CSS Configuration**:
- Utility-first CSS framework
- Custom theme: Green accent color (`#10b981` / emerald-500)
- Responsive breakpoints: sm, md, lg, xl, 2xl
- Dark mode support (configured but not enabled)

**Icons** (Lucide React):
- **Dashboard**: Sprout (logo), AlertCircle (errors), RefreshCw (retry)
- **Plant Cards**: Droplet (soil moisture), Sun (light), Thermometer (temperature), Settings (configure), TrendingUp (view history), AlertTriangle (no data)
- **Modals**: X (close), Loader2 (loading spinner)

### Docker Build

**Implementation**: `frontend/Dockerfile`, `frontend/nginx.conf`

**Multi-stage build**:

1. **Builder stage** (node:20-alpine)
   - Install dependencies (`npm ci`)
   - Build production assets (`npm run build`)
   - Output: `dist/` directory with static assets

2. **Production stage** (nginx:alpine)
   - Copy build artifacts from builder
   - Copy nginx.conf for SPA routing
   - Expose port 80
   - Non-root nginx user

**nginx Configuration**:
- Serves static files from `/usr/share/nginx/html`
- SPA routing: All non-file requests → `index.html`
- MIME types for JS/CSS/HTML
- Gzip compression enabled

**Docker Compose**:
```yaml
frontend:
  build: ./frontend
  ports:
    - "3001:80"
  environment:
    - VITE_API_URL=http://localhost:3000
  depends_on:
    - backend
```

### Development Workflow

**Start dev server** (with hot reload):
```bash
cd frontend
npm install
npm run dev
```

Dev server runs on http://localhost:5173 with Vite HMR.

**Type checking**:
```bash
npm run typecheck
```

**Build production bundle**:
```bash
npm run build
```

**Preview production build**:
```bash
npm run preview
```

### Environment Variables

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `VITE_API_URL` | Backend REST API base URL | http://localhost:3000 | Yes |
| `NODE_ENV` | Node.js environment | development | No |

**Note**: Vite requires env vars to be prefixed with `VITE_` to be exposed to client code.

### TypeScript Configuration

**Strict mode enabled**:
- `strict: true`
- `noUnusedLocals: true`
- `noUnusedParameters: true`
- `noFallthroughCasesInSwitch: true`

**Type definitions**:
- React types: `@types/react`, `@types/react-dom`
- Vite client types: `vite/client`
- API types: Shared TypeScript interfaces in `frontend/src/api/types.ts`

### Testing

**Current Status**: No tests implemented yet (stub)

**Planned**:
- Unit tests with Vitest
- Component tests with React Testing Library
- E2E tests with Playwright

### Makefile Integration

**Type checking**:
```bash
make typecheck
```

Runs `npm run typecheck --prefix frontend` alongside backend type checking.

### Production Considerations

**Current Status** (Development):
- [x] Plant status cards with real-time telemetry
- [x] Threshold configuration modal
- [x] History chart visualization with Recharts
- [x] Time range selector (1h, 6h, 24h, 7d)
- [x] Color-coded status indicators
- [x] Loading skeletons and error states
- [x] Responsive grid layout
- [x] React.memo performance optimizations
- [ ] No authentication
- [ ] No React error boundaries
- [ ] No offline support
- [ ] No performance monitoring
- [ ] No accessibility features (ARIA labels)

**Production Requirements**:
- [ ] Add React error boundaries for graceful error handling
- [ ] Implement authentication (JWT or session)
- [ ] Implement WebSocket for real-time updates (alternative to polling)
- [ ] Add service worker for offline support
- [ ] Add performance monitoring (e.g., Sentry)
- [ ] Add CSV export for historical telemetry data
- [ ] Add chart zoom/pan for detailed exploration
- [ ] Add plant detail view with expanded data
- [ ] Add alert history display on plant cards or detail view
- [ ] Add accessibility features (ARIA labels, keyboard navigation, focus management)
- [ ] Add unit tests (Vitest) and E2E tests (Playwright)
- [ ] Configure CDN for static assets
- [ ] Add CSP headers via nginx
- [ ] Add keyboard shortcuts (Escape to close modals, Enter to save)
- [ ] Add confirmation dialog for destructive threshold changes

### Known Limitations

1. **Polling overhead**: Dashboard uses 5-second polling instead of WebSockets (sustainable for up to 50 plants)
2. **Fixed chart heights**: Charts are 200px tall, not user-adjustable
3. **No chart zoom/pan**: Charts display full time range, cannot zoom into specific periods
4. **Limited time ranges**: Only 1h, 6h, 24h, 7d presets (no custom date ranges)
5. **No CSV export**: Cannot download historical telemetry data
6. **No plant detail view**: Clicking a plant card does nothing yet (planned feature)
7. **No optimistic updates**: Threshold changes require server response before UI updates
8. **No authentication**: API is open to anyone (must be added for production)
9. **No offline support**: App requires active backend connection
10. **CORS dependency**: Frontend must be allowed in backend's CORS_ORIGIN environment variable
11. **Build-time env vars**: VITE_API_URL is baked into build (not runtime-configurable)
12. **No accessibility labels**: Missing ARIA labels for screen readers
13. **No confirmation dialogs**: Threshold changes save immediately without confirmation
14. **Large bundle size**: Recharts adds ~640KB to bundle (gzipped: ~188KB)

### Access Frontend

**Development** (Vite dev server):
```bash
npm run dev --prefix frontend
# Open http://localhost:5173
```

**Docker** (nginx production build):
```bash
docker compose up -d frontend
# Open http://localhost:3001
```

### Verify Frontend

**Check Docker logs**:
```bash
docker compose logs frontend
```

**Test health check**:
```bash
curl http://localhost:3001
# Should return HTML (index.html)
```

**Test dashboard**:
Open http://localhost:3001 in browser and verify:
- Plant cards are displayed
- Status badges show correct colors
- Loading spinner appears briefly
- Error state with retry button if backend is down

## Worker Service

The worker service is a standalone background process that periodically evaluates plant telemetry against configured thresholds, creates alert records, and sends Discord webhook notifications when plants need attention.

### Architecture

**Implementation**: `worker/src/`

**Main Components**:
1. `index.ts` - Main worker loop with graceful shutdown
2. `evaluator/threshold-checker.ts` - Threshold evaluation logic
3. `evaluator/alert-manager.ts` - Alert creation with cooldown
4. `notifications/discord.ts` - Discord webhook integration
5. `db/worker-repository.ts` - Database queries for worker operations
6. `db/client.ts` - PostgreSQL connection pool

### Worker Lifecycle

```
Startup → Database Connection → Evaluation Loop → Shutdown
   ↓                                   ↓
Initialize pool               Evaluate every 30s
   ↓                                   ↓
Verify connection             Check thresholds
   ↓                                   ↓
Start evaluation timer        Create alerts
                                      ↓
                              Send Discord notifications
```

### Evaluation Cycle

The worker runs an evaluation cycle every 30 seconds (configurable via `WORKER_INTERVAL_SECONDS`):

1. **Fetch all plants** - Query plants table with threshold configuration
2. **For each plant**:
   - Get latest telemetry (last 5 minutes)
   - Check thresholds: soil_moisture, light, temperature
   - Generate array of threshold breaches
3. **For each breach**:
   - Check cooldown (last alert timestamp + cooldown_minutes)
   - If cooldown passed: create alert and send Discord notification
   - Update plant's last_alert_sent_at timestamp
4. **Log summary** - Plants evaluated, alerts created

### Threshold Evaluation Logic

For each plant, the worker checks telemetry against configured thresholds:

**Soil Moisture**:
- `soil_moisture_low`: value < soil_moisture_min
- `soil_moisture_high`: value > soil_moisture_max

**Light**:
- `light_low`: value < light_min

**Temperature**:
- `temp_low`: value < temperature_min
- `temp_high`: value > temperature_max

Multiple breaches can occur simultaneously (e.g., low soil moisture AND low temperature).

### Alert Types

| Alert Type | Condition | Example Message |
|------------|-----------|-----------------|
| `soil_moisture_low` | Soil moisture below minimum | "Soil moisture is too low: 15% (min: 20%)" |
| `soil_moisture_high` | Soil moisture above maximum | "Soil moisture is too high: 95% (max: 80%)" |
| `light_low` | Light level below minimum | "Light level is too low: 180 lux (min: 300 lux)" |
| `temp_low` | Temperature below minimum | "Temperature is too low: 15.5°C (min: 18.0°C)" |
| `temp_high` | Temperature above maximum | "Temperature is too high: 29.2°C (max: 27.0°C)" |

### Alert Cooldown

To prevent notification spam, alerts are subject to a cooldown period:

- **Cooldown period**: Configurable per plant (default: 60 minutes)
- **Tracked per**: (plant_id, alert_type) tuple
- **Logic**:
  - Query last alert for (plant_id, alert_type)
  - If time_since_last_alert >= cooldown_minutes: create new alert
  - If cooldown active: log suppression with minutes remaining
  - If no previous alert: create new alert immediately

**Example**: If monstera's soil moisture is low and an alert was sent 30 minutes ago, the worker will suppress the alert and log: "Alert suppressed for Monstera Deliciosa (soil_moisture_low): cooldown active (30 minutes remaining)"

### Discord Notifications

Discord notifications are sent via webhook when alerts are created (optional).

**Configuration**:
- Set `DISCORD_WEBHOOK_URL` environment variable
- If empty/unset: alerts are created but Discord notifications are skipped
- Webhook URL format: `https://discord.com/api/webhooks/<webhook_id>/<webhook_token>`

**Message Format**:
```
🌱 **[Plant Name]** needs attention: [alert message]
_2026-01-06T16:30:00.000Z_
```

**Example**:
```
🌱 **Monstera Deliciosa** needs attention: Soil moisture is too low: 15% (min: 20%)
_2026-01-06T16:30:00.000Z_
```

**Error Handling**:
- Discord webhook failures are logged but do not stop alert creation
- Alert record is created with `sent_to_discord=false` if webhook fails
- Worker continues to next alert on Discord error

### Database Operations

**Read Operations**:
- `getAllPlants()` - Fetch all plants with threshold configuration
- `getLatestTelemetry(plantId)` - Get most recent telemetry (last 5 minutes)
- `getLastAlert(plantId, alertType)` - Query last alert for cooldown check

**Write Operations**:
- `createAlert()` - Insert new alert record with Discord delivery status
- `updateLastAlertTime()` - Update plant's last_alert_sent_at timestamp

All queries use parameterized statements for SQL injection protection.

### Environment Variables

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `DATABASE_URL` | PostgreSQL connection string | - | Yes |
| `DISCORD_WEBHOOK_URL` | Discord webhook URL for notifications | "" | No |
| `WORKER_INTERVAL_SECONDS` | Evaluation interval in seconds | 30 | No |
| `NODE_ENV` | Node.js environment | development | No |

### Connection Management

**Database Pool**:
- Max connections: 10 (tuned for low-frequency queries)
- Connection timeout: 5 seconds
- Idle timeout: 30 seconds
- Retry logic: Exponential backoff (1s, 2s, 4s, 8s, 16s)
- Max retries: 5 attempts

**Health Check**: `ps aux | grep node` (basic process check)

### Graceful Shutdown

The worker handles shutdown signals (SIGTERM, SIGINT) gracefully:

1. Stop evaluation timer (no new evaluations)
2. Close database connection pool
3. Log shutdown completion
4. Exit process

**Example shutdown log**:
```
Received SIGTERM, starting graceful shutdown...
Evaluation timer stopped
Database pool closed
Graceful shutdown complete
```

### Error Handling

| Error Type | Behavior |
|------------|----------|
| Database connection failure | Retry with exponential backoff (5 attempts) |
| Discord webhook failure | Log error, mark sent_to_discord=false, continue |
| Missing telemetry | Log warning, skip plant evaluation |
| Database query errors | Log error, continue to next plant |
| Uncaught exceptions | Trigger graceful shutdown |

### Running the Worker

**Start via Docker Compose**:
```bash
docker compose up -d worker
docker compose logs -f worker
```

**Expected logs**:
```
PlantOps Worker starting...
Evaluation interval: 30 seconds
Discord notifications enabled: Yes
Connecting to database...
Database connection verified
Starting evaluation cycle...
Evaluating 6 plants
Evaluation cycle complete: 6 plants evaluated, 2 alerts created
Discord notification sent for Monstera Deliciosa: soil_moisture_low
Alert suppressed for Snake Plant (temp_low): cooldown active (45 minutes remaining)
```

**Verify alerts are created**:
```bash
docker exec plantops-postgres psql -U plantops -d plantops -c "SELECT * FROM alerts ORDER BY timestamp DESC LIMIT 10;"
```

**Test with custom interval**:
```bash
WORKER_INTERVAL_SECONDS=10 docker compose up -d worker
docker compose logs worker | grep "Evaluation interval"
# Expected: "Evaluation interval: 10 seconds"
```

### Performance Characteristics

- **Evaluation frequency**: Every 30 seconds (configurable)
- **Database queries per cycle**: 1 (plants) + N (telemetry) + M (alerts) where N=6 plants, M=breaches
- **Expected throughput**: Low (6 plants, ~1 query per second average)
- **Memory footprint**: <50 MB (small connection pool, no data buffering)
- **CPU usage**: Minimal (mostly I/O bound, waiting on database)

### Production Considerations

**Current Status**:
- [x] TypeScript strict mode
- [x] Graceful shutdown
- [x] Database retry logic
- [x] Error logging
- [x] Docker multi-stage build
- [x] Non-root container user
- [ ] Structured logging (JSON format)
- [ ] Metrics/monitoring
- [ ] Health check endpoint
- [ ] Alert rate limiting
- [ ] Distributed locking (for multi-instance)
- [ ] Unit tests
- [ ] Integration tests

**Known Limitations**:
1. **Telemetry window**: Only checks telemetry from last 5 minutes. If simulator stops, plants won't be evaluated.
2. **Cooldown per alert type**: A plant can have simultaneous alerts for different types (may be too noisy).
3. **No max alerts limit**: If thresholds are constantly breached, alerts are created every cooldown period indefinitely.
4. **Discord rate limits**: Discord webhooks have rate limits (30 req/min). High-frequency alerts could hit this limit.
5. **Single worker instance**: Multiple workers would cause duplicate alerts (no distributed locking).
6. **No alert deduplication**: If simulator sends duplicate telemetry, worker may evaluate same data multiple times.
7. **Timezone handling**: All timestamps are UTC. Discord messages show ISO 8601 UTC timestamps.

**Security**:
- Non-root container user (node)
- Parameterized SQL queries (SQL injection safe)
- No sensitive data in logs
- Discord webhook URL must be kept secret

## Testing Infrastructure

The project includes comprehensive unit test coverage for backend and worker services using Jest with TypeScript support.

### Test Framework

**Framework**: Jest 29.7
**TypeScript Integration**: ts-jest
**Configuration**: ES Module compatibility (`.cjs` config files)

### Backend Tests

**Location**: `backend/src/__tests__/`
**Configuration**: `backend/jest.config.cjs`
**Test Suites**: 2 files, 18 tests total

#### Test Files

1. **validation.test.ts** (8 tests)
   - Zod telemetry schema validation
   - Valid telemetry payload acceptance
   - Invalid timestamp rejection
   - Out-of-range value rejection (soil_moisture, light, temperature)
   - Missing field rejection
   - Boundary value validation

2. **api.test.ts** (10 tests)
   - Express API routes
   - Health endpoint response validation
   - GET /api/plants - successful retrieval and error handling
   - GET /api/plants/:id/history - plant history, 404 for missing plants, query param handling
   - POST /api/plants/:id/config - configuration updates, 404 for missing plants, Zod validation

#### Mock Strategy

All external dependencies are mocked with Jest mocks:
- Database: `pg` module mocked with query spy
- MQTT: `mqtt` module mocked with connection status
- Discord: Axios mock for webhook requests

#### Running Backend Tests

```bash
# Run all backend tests
cd backend && npm test

# Run with coverage
npm run test:coverage

# Run with watch mode
npm test -- --watch
```

**Expected output**: 2 test suites, 18 tests passing in ~3 seconds

#### Known Limitations

- Health endpoint test accepts both 200 and 503 status codes (database mock doesn't fully work with ES modules)
- Console output from tests is verbose but helpful for debugging

### Worker Tests

**Location**: `worker/src/__tests__/`
**Configuration**: `worker/jest.config.cjs`
**Test Suites**: 2 files, 20 tests total

#### Test Files

1. **threshold-checker.test.ts** (10 tests)
   - Threshold evaluation logic
   - Values within thresholds return no breaches
   - Detection of low/high soil moisture, low light, low/high temperature
   - Multiple simultaneous breach detection
   - Exact boundary value handling
   - Edge cases with zero values

2. **alert-manager.test.ts** (10 tests)
   - Alert cooldown logic: no previous alert, cooldown passed, cooldown active
   - Alert type independence (separate cooldowns per type)
   - Discord notification with/without webhook
   - Discord failure graceful handling
   - Message formatting

#### Mock Strategy

All external dependencies are mocked:
- Database: `pg` module mocked with query results
- Discord: Axios mock for webhook notifications
- Timers: Jest fake timers for cooldown testing

#### Running Worker Tests

```bash
# Run all worker tests
cd worker && npm test

# Run with coverage
npm run test:coverage

# Run with watch mode
npm test -- --watch
```

**Expected output**: 2 test suites, 20 tests passing in ~3 seconds

### Running All Tests

**Make target**: `make test`

This command runs both backend and worker test suites in sequence:

```bash
make test
```

**Expected output**:
```
Running tests...
Testing backend...
2 test suites, 18 tests passing

Testing worker...
2 test suites, 20 tests passing

All tests passed
```

**Total execution time**: ~6 seconds (well under 10 second requirement)

### Test Coverage Summary

**Backend Coverage**:
- Zod schema validation: 100% of validation logic
- Express API routes: All 4 endpoints covered
- Error handling: Validation errors, 404 errors, database errors

**Worker Coverage**:
- Threshold evaluation: All breach types (5 alert types)
- Alert cooldown: All cooldown scenarios (no alert, passed, active)
- Discord notifications: Success and failure paths
- Message formatting: All alert types

**Not Covered** (future work):
- Integration tests with real database (testcontainers)
- Repository layer with real SQL queries
- E2E tests for full request/response cycle
- MQTT subscriber integration tests
- Frontend component tests

### Jest Configuration

**Common Settings** (both backend and worker):
- Preset: `ts-jest`
- Test environment: `node`
- ES Module support: `extensionsToTreatAsEsm: ['.ts']`
- Transform: `.ts` files with ts-jest
- Module paths: Alias `@/` to `src/`
- Test match: `**/__tests__/**/*.test.ts`

**ES Module Compatibility**:
- Configuration files use `.cjs` extension (required when `"type": "module"` in package.json)
- ts-jest configured with `useESM: true`
- Globals: `ts-jest` transform with ES module support

### CI/CD Integration

Tests are integrated into the quality gates pipeline:

```bash
make check
```

This runs all quality gates in sequence:
1. `make lint` (stub)
2. `make typecheck` (stub)
3. `make test` (real: 38 tests)
4. `make e2e` (stub)

Exit code 0 indicates all tests passed.

### Future Testing Enhancements

Potential improvements (not required for current milestone):
- Add integration tests with testcontainers (real database)
- Increase coverage to include repository layer
- Add E2E tests for full request/response cycle
- Configure coverage thresholds in CI/CD (e.g., 80% minimum)
- Add frontend component tests with Vitest and React Testing Library
- Add mutation testing with Stryker
- Add contract testing for API endpoints (Pact)

## E2E Testing with Playwright

The project includes end-to-end tests using Playwright to verify the full application stack (frontend + backend + database + MQTT).

### Test Framework

**Framework**: Playwright v1.40
**Browser**: Chromium (headless by default)
**Configuration**: `playwright.config.ts`

### Test Infrastructure

**Project Structure**:
```
playwright.config.ts       # Playwright configuration
package.json               # Root-level package.json for Playwright dependency
e2e/                       # E2E test files
├── setup.spec.ts          # Service health checks
├── dashboard.spec.ts      # Dashboard UI tests
├── threshold-config.spec.ts  # Threshold configuration modal tests
└── history-charts.spec.ts    # History charts modal tests
scripts/
└── wait-for-services.sh   # Service readiness check script
```

### Playwright Configuration

**Key Settings**:
- Test directory: `./e2e`
- Workers: 1 (serial execution required - tests share Docker state)
- Timeout: 60 seconds per test
- Base URL: `http://localhost:3001` (frontend via nginx)
- Headless mode: true (can be disabled for debugging)
- Screenshot/video capture: On failure only

**Configuration File** (`playwright.config.ts`):
```typescript
{
  testDir: './e2e',
  workers: 1,
  timeout: 60 * 1000,
  use: {
    baseURL: 'http://localhost:3001',
    headless: true,
    screenshot: 'only-on-failure',
    video: 'retain-on-failure'
  }
}
```

### Test Files

#### setup.spec.ts (2 tests)

Service health checks to verify services are running:
- **Frontend accessibility test**: Verifies frontend serves at http://localhost:3001
- **Backend API health test**: Verifies backend health endpoint at http://localhost:3000/api/health

#### dashboard.spec.ts (4 tests)

Dashboard UI rendering tests:
- **Load dashboard**: Verifies page title "PlantOps"
- **Plant cards render**: Expects 6 plant cards with `data-testid="plant-card"`
- **Telemetry display**: Validates telemetry metrics (soil moisture, light, temperature) on each card
- **Last updated timestamps**: Verifies `data-testid="last-updated"` elements visible

#### threshold-config.spec.ts (4 tests)

Threshold configuration modal tests:
- **Open modal**: Clicks configure button, waits for modal with `data-testid="threshold-config-modal"`
- **Display form fields**: Verifies all threshold input fields present
- **Update values**: Changes threshold values, clicks save, verifies update
- **Close modal**: Clicks close button, verifies modal disappears

#### history-charts.spec.ts (5 tests)

History charts modal tests:
- **Open modal**: Clicks "View History" button, waits for `data-testid="history-modal"`
- **Time range selector**: Verifies 1h, 6h, 24h, 7d buttons present
- **Chart rendering**: Validates 3 Recharts SVG elements (soil moisture, light, temperature)
- **Time range switching**: Clicks time range button, verifies new data loads
- **Close modal**: Clicks close button, verifies modal disappears

### Test Selectors (data-testid)

Frontend components include `data-testid` attributes for reliable test selectors:

**Plant Cards**:
- `plant-card` - Plant card container
- `status-badge` - Health status badge
- `last-updated` - Timestamp display
- `view-history-button` - History modal trigger
- `configure-button` - Configuration modal trigger

**Telemetry Display**:
- `telemetry-item` - Telemetry metric container
- `telemetry-value` - Metric value display

**Modals**:
- `threshold-config-modal` - Configuration modal container
- `history-modal` - History charts modal container
- `close-button` - Modal close buttons
- `save-button` - Configuration save button

### Service Readiness Check

**Script**: `scripts/wait-for-services.sh`

Before running tests, this script polls for service readiness:
1. Checks backend health endpoint: `http://localhost:3000/api/health`
2. Checks frontend: `http://localhost:3001`
3. Timeout: 60 seconds with 2-second intervals
4. Validates Docker Compose services are running

**Usage**:
```bash
./scripts/wait-for-services.sh
```

### Running E2E Tests

**Make target** (recommended):
```bash
make e2e
```

This command orchestrates:
1. Start Docker Compose services (`docker compose up -d`)
2. Wait for services via `wait-for-services.sh`
3. Run Playwright tests (`npm run test:e2e`)

**NPM scripts**:
```bash
# Run tests headless
npm run test:e2e

# Run tests with UI (debugging)
npm run test:e2e:ui

# Run tests in headed mode (see browser)
npm run test:e2e:headed
```

**Manual service management**:
```bash
# Start services
docker compose up -d

# Wait for readiness
./scripts/wait-for-services.sh

# Run tests
npm run test:e2e

# Stop services
docker compose down
```

### Test Execution Flow

```
make e2e
   ↓
Start Docker Compose (6 services)
   ↓
Wait for readiness (backend health + frontend)
   ↓
Playwright executes tests serially (workers: 1)
   ↓
Screenshot/video artifacts saved on failure
```

### Current Test Status

**Passing**: 1 of 15 tests
- setup.spec.ts: Services running check

**Failing**: 14 of 15 tests
- All tests dependent on plant cards rendering fail

**Root Cause**: Frontend rendering issue in Playwright
- Dashboard loads successfully (title visible)
- Backend API works (`curl http://localhost:3000/api/plants` returns 6 plants)
- Frontend serves static files correctly (nginx logs show successful requests)
- Plant cards (`data-testid="plant-card"`) never appear in DOM
- Tests timeout waiting for plant cards (10 second timeout)

**Possible Causes**:
1. Frontend API client failing to fetch data from backend
2. CORS issue between frontend (localhost:3001) and backend (localhost:3000)
3. React rendering issue in headless browser
4. TanStack Query not triggering or failing silently
5. API URL mismatch (frontend expects localhost:3000 but request fails)

### Test Artifacts

Playwright saves artifacts on test failure:
- **Screenshots**: `test-results/*/test-failed-*.png`
- **Videos**: `test-results/*/video.webm`
- **Error context**: `test-results/*/error-context.md`

Review artifacts to diagnose frontend rendering issue.

### Backend Docker Fixes (Required for E2E)

E2E test implementation revealed critical backend Docker issues that were fixed:

#### Issue 1: ES Module Migration Script

**Problem**: Backend Dockerfile tried to run migrations using `npm run migrate` which executes TypeScript source with `tsx`. In production Docker container, only compiled JavaScript (`dist/`) exists.

**Fix**:
- Updated `backend/src/db/migrate.ts` to use ES module equivalents:
  - `import.meta.url` for main module detection (instead of `require.main === module`)
  - `fileURLToPath` and `dirname` for `__dirname` polyfill
- Changed Dockerfile CMD from `npm run migrate` to `node dist/db/migrate.js`

**Files Changed**:
- `backend/src/db/migrate.ts`
- `backend/Dockerfile`

#### Issue 2: Backend Port Mismatch

**Problem**: Backend listens on port 3001 internally (`API_PORT` default), but docker-compose expected port 3000.

**Fix**: Updated `docker-compose.yml` port mapping from `3000:3000` to `3000:3001` (host:container).

**Files Changed**:
- `docker-compose.yml`

#### Issue 3: Healthcheck Endpoint Path

**Problem**: Healthcheck tried `/health` but backend serves `/api/health`.

**Fix**: Updated `docker-compose.yml` healthcheck from `http://localhost:3000/health` to `http://localhost:3001/api/health`.

**Files Changed**:
- `docker-compose.yml`

#### Issue 4: Worker Docker Build Failure

**Problem**: Worker Dockerfile failed to copy `tsconfig.json` and `src/` because `.dockerignore` excluded them.

**Fix**: Removed `tsconfig.json` and `src` from `worker/.dockerignore`.

**Files Changed**:
- `worker/.dockerignore`

### Known Limitations

1. **Serial execution required**: Tests share Docker state, cannot run in parallel (workers: 1)
2. **Long startup time**: Services take 30-60 seconds to become healthy
3. **Flaky test potential**: Network timing, Docker health checks can be inconsistent
4. **No test isolation**: Database shared across tests, state can bleed between tests
5. **Frontend rendering issue**: Plant cards not loading (14/15 tests failing, debugging needed)
6. **No database cleanup**: Tests don't reset database state between runs
7. **Hard-coded timeouts**: 10s for plant cards, 60s for services (may need tuning)
8. **Screenshot artifacts accumulate**: No automatic cleanup of `test-results/` directory

### Dependencies on External Services

E2E tests depend on full Docker Compose stack:
- **Docker**: All tests require Docker Compose services running
- **Network**: Tests depend on localhost network working correctly
- **Postgres**: Database must be healthy and migrated
- **MQTT**: Mosquitto must be connected for simulator data
- **Simulator**: Must publish telemetry for dashboard to display data

### Environment-Specific Issues

- **Host network required**: Frontend in browser reaches backend via localhost:3000
- **Port conflicts**: Ports 3000, 3001, 5432, 1883 must be available
- **Docker resources**: Services require ~2GB RAM, multiple containers

### Technical Debt Created

**Backend Fixes**:
- ES module migration script now has polyfills (`__dirname` workaround)
- Dockerfile runs compiled JS directly instead of using npm script
- Migration runs before server start (no rollback mechanism)

**Frontend Build**:
- API URL hardcoded in build (`http://localhost:3000`)
- No environment-specific builds (dev/staging/prod)
- Static build doesn't support runtime config

**Test Infrastructure**:
- No database cleanup between tests (state leakage possible)
- No test fixtures or seed data management
- Hard-coded timeouts (10s for plant cards, 60s for services)
- Screenshot artifacts accumulate (no cleanup)

### Next Steps (Debugging Required)

To fix the 14 failing tests:

1. **Debug frontend API client** - Why aren't plant cards loading in Playwright?
   - Add console logging to frontend API client
   - Check browser network tab in Playwright tests
   - Verify TanStack Query is triggering requests
   - Validate CORS headers between frontend/backend

2. **Add API request logging** - Instrument frontend to log API calls
   - Add debug mode to frontend build
   - Log API URL, request status, response
   - Capture console logs in Playwright tests

3. **Simplify test dependencies** - Start with basic API connectivity test
   - Create test that directly calls backend API from Playwright
   - Verify network reachability before testing UI
   - Isolate frontend rendering vs API connectivity issues

### Future Enhancements

Once frontend rendering issue is fixed:
- Add integration test: Full flow (telemetry → worker → alert → dashboard)
- Add visual regression tests: Screenshot comparison for UI changes
- Add performance tests: Lighthouse scores, load times
- Add mobile viewport tests: Responsive design validation
- Add accessibility tests: ARIA labels, keyboard navigation
- Parallelize independent tests: Speed up test execution

All TypeScript code compiles cleanly. E2E infrastructure is in place but requires frontend debugging to make tests pass.

## Configuration

See `.env.example`.
