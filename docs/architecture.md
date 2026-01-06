# Architecture

> 001 — PlantOps

## System Overview

Plant monitoring pipeline:

**MQTT ingestion → DB (time-series) → Dashboard + Alerts**

Primary runtime goal: ingest telemetry for multiple plants, persist history, display current status + charts, and trigger Discord alerts when thresholds are breached.

## System Components

| Component | Purpose |
|-----------|---------|
| MQTT Broker (Mosquitto) | Message bus for sensor telemetry |
| Simulator | Publishes plant telemetry (e.g., 6 plants) to MQTT |
| Backend | MQTT subscriber + REST API for dashboard/config |
| Database (PostgreSQL + TimescaleDB) | Time-series storage + configuration tables |
| Worker | Threshold evaluation + Discord alerts (with cooldown/idempotency) |
| Frontend | Dashboard with plant cards + history charts |

## System Data Flow

```
Simulator → MQTT → Backend → Database
                               ↓
                        Worker → Discord
                               ↓
                        Frontend (polls API)
```

Notes (high-level):
- Telemetry arrives on MQTT topics like `plants/<plant_id>/telemetry`.
- Backend validates payloads and writes to DB (including out-of-order timestamps).
- Worker evaluates thresholds (per-plant config) and emits alerts with cooldown.
- Frontend queries backend API for current state + 24h history.

---

## AI Agent Architecture (Claude Code)

This challenge uses **Claude Code** as a multi-agent orchestrated system. The goal is to run long-horizon "plan → implement → check → docs → commit" loops with **role-specific constraints** and **explicit handoffs**.

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
│   └── lca-qa.md            # Check/fix loop
├── hooks/
│   └── usage-record.py      # Token tracking (no LLM overhead)
└── skills/
    └── lca-protocol/
        └── SKILL.md         # Protocol definition (task/state/handoff formats)

runs/
├── plan.md                  # Generated: architecture decisions + task outline
├── state.json               # Generated: current task + completed tasks + latest handoff
├── tasks/                   # Generated: task-XXX.md (YAML frontmatter + DoD)
├── handoffs/                # Generated: task-XXX.md (what changed + verify + next steps)
├── usage/                   # Generated: usage.jsonl (token usage records)
└── notes.md                 # Generated: blocking notes (if stuck)
```

### Orchestration Flow

The orchestrator is defined in `CLAUDE.md` (the "protocol controller").

```
1. Boot:
   * If no tasks/state exist → invoke lca-planner to generate runs/plan.md + runs/tasks/* + runs/state.json

2. Execute:
   * Read runs/state.json → open current runs/tasks/task-XXX.md
   * Invoke the task's role agent (backend/frontend/docs/qa/gitops)

3. Validate (inside the role agent):
   * Run task.check_command until it passes (fix failures and re-run)

4. Handoff:
   * Role agent writes runs/handoffs/task-XXX.md
   * If task specifies post agents → invoke them in order (e.g., docs → gitops)

5. Advance:
   * Orchestrator updates runs/state.json and proceeds to next task
```

### Role Agents

| Agent | Primary responsibility | Typical constraints |
|-------|-------------------------|---------------------|
| `lca-planner` | Generate plan + task queue + state | edits **runs/** only; no Bash |
| `lca-backend` | Ingestion, API, DB schema, worker logic | obey `allowed_paths`; run checks |
| `lca-frontend` | Dashboard UI, charts, client state | obey `allowed_paths`; run checks |
| `lca-docs` | README + docs updates | docs-only (README.md, docs/**) unless task allows more |
| `lca-qa` | Run checks, diagnose failures, minimal fixes | smallest-diff fixes; do not weaken tests |
| `lca-gitops` | Branch/commit/push workflow | commit after checks pass; push may require approval |

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

### Permissions Model

* **Project-wide baseline** permissions live in `.claude/settings.json` (shared).
* **Per-agent differences** are controlled via each subagent file's YAML frontmatter:
  * `tools` (what the agent can do)
  * `permissionMode` (how aggressively it auto-approves)
  * `model` (optional)
* **Per-participant overrides** should go in `.claude/settings.local.json` (not committed), if needed.

Sensitive file reads (e.g. `.env`, private keys) are denied by default in project settings.

---

## Configuration

See `.env.example`.
