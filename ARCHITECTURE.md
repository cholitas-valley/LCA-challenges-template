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
│                              │  ┌─────────┐ ┌─────────┐ ┌──────┐  │      │
│                              │  │recorder │ │  docs   │ │gitops│  │      │
│                              │  └─────────┘ └─────────┘ └──────┘  │      │
│                              │  ┌──────────┐ ┌──────────┐         │      │
│                              │  │ reviewer │ │ enforcer │         │      │
│                              │  └──────────┘ └──────────┘         │      │
│                              │  ┌─────────────────────────┐       │      │
│                              │  │ code-simplifier (plugin)│       │      │
│                              │  └─────────────────────────┘       │      │
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
ARCHITECTURE.md              # This file - AI agent architecture (protocol only)
docs/                        # Implementation docs (lca-docs writes here)
.claude/
├── settings.json            # Project-wide permissions + hooks
├── agents/
│   ├── lca-planner.md       # Generates plan + tasks
│   ├── lca-backend.md       # Backend implementation
│   ├── lca-frontend.md      # Frontend implementation
│   ├── lca-recorder.md      # Records task changes in handoffs
│   ├── lca-docs.md          # Implementation documentation for readers
│   ├── lca-gitops.md        # Branch/commit/push hygiene
│   ├── lca-qa.md            # Check/fix loop
│   ├── lca-reviewer.md      # Code quality gate (automatic)
│   ├── lca-enforcer.md      # Protocol compliance gate (automatic)
│   └── lca-arbiter.md       # Periodic checkpoint auditor
├── hooks/
│   ├── session-start.py     # SessionStart: LCA state + arbiter alerts on resume
│   ├── session-summary.py   # Stop: writes session summary for easier resume
│   ├── tool-record.py       # PostToolUse: tool outcomes (Bash/Edit/Write)
│   ├── usage-record.py      # Stop: token tracking (no LLM overhead)
│   ├── permission-record.py # PermissionRequest: permission prompt logging
│   └── arbiter-scheduler.py # Stop: triggers arbiter on token/time thresholds
└── skills/                  # Active skills (copied from .spawner/ per feature)
    ├── lca-protocol/        # Protocol definition (task/state/handoff formats)
    ├── lca-feature-setup/   # Interactive feature setup checklist
    ├── color-theory/        # Design: color systems, semantic tokens
    ├── design-systems/      # Design: component patterns, consistency
    ├── ui-design/           # Design: layout, hierarchy, spacing
    ├── ux-design/           # Design: UX patterns, user flows
    ├── tailwind-css/        # Design: Tailwind patterns, utilities
    ├── python-backend/      # Backend: FastAPI, async patterns
    ├── api-design/          # Backend: REST/GraphQL design
    ├── error-handling/      # Backend: error strategies
    ├── queue-workers/       # Backend: async job processing
    ├── postgres-wizard/     # Data: PostgreSQL patterns
    ├── database-migrations/ # Data: schema evolution
    ├── docker/              # DevOps: containerization
    ├── logging-strategies/  # DevOps: structured logging
    ├── security/            # Security: auth, OWASP patterns
    ├── embedded-systems/    # Hardware: IoT patterns
    ├── sensor-fusion/       # Hardware: sensor data processing
    ├── testing-strategies/  # Testing: test patterns
    ├── frontend/            # Frontend: React patterns
    └── state-management/    # Frontend: state patterns

.spawner/                    # Reference skills (project-local, git-ignored)
└── skills/
    ├── ai/                  # LLM patterns
    ├── ai-agents/           # Agent orchestration patterns
    ├── backend/             # FastAPI, API design, queues
    ├── data/                # PostgreSQL, Redis
    ├── design/              # UI/UX, design systems
    ├── development/         # Docs, migrations
    ├── devops/              # Docker, CI/CD, git
    ├── frameworks/          # React, Next.js
    ├── frontend/            # React, state management
    ├── hardware/            # IoT, sensors
    ├── security/            # Auth patterns
    └── testing/             # Test strategies, code review

runs/
├── plan.md                  # Generated: architecture, task outline, docs structure
├── state.json               # Generated: current task + phase + role + completed tasks
├── tasks/                   # Generated: task-XXX.md (YAML frontmatter + DoD)
├── handoffs/                # Generated: task-XXX.md (what changed + verify + next steps)
├── review/                  # Generated: task-XXX-review.md, task-XXX-enforcer.md
├── usage/                   # Generated: usage.jsonl (token usage records)
├── tools/                   # Generated: usage.jsonl (tool invocation log)
├── permissions/             # Generated: requests.jsonl (permission prompts, if any)
├── sessions/                # Generated: session start logs + summaries
│   ├── starts.jsonl         # Session start events
│   ├── <session_id>-summary.md  # Per-session summary
│   └── latest-summary.md    # Most recent session summary
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
| `lca-planner` | Generate plan + task queue + state + docs structure | edits **runs/** only; no Bash |
| `lca-backend` | Ingestion, API, DB schema, worker logic | obey `allowed_paths`; run checks |
| `lca-frontend` | Dashboard UI, charts, client state | obey `allowed_paths`; run checks |
| `lca-recorder` | Record task changes in handoffs | **runs/handoffs/** only; internal coordination |
| `lca-docs` | Write implementation docs for readers | **docs/** only; follows plan structure |
| `lca-qa` | Run checks, diagnose failures, minimal fixes | smallest-diff fixes; do not weaken tests |
| `lca-gitops` | Branch/commit/push workflow | commit after checks pass; push may require approval |
| `lca-reviewer` | Code quality gate (auto after role) | read-only; can reject back to role |
| `lca-enforcer` | Protocol compliance gate (auto after reviewer) | read-only; can reject back to role |
| `lca-arbiter` | Periodic checkpoint auditor | edits **runs/arbiter/** only; read-only git commands |
| `code-simplifier` | Code clarity/consistency (Claude plugin) | post agent; preserves functionality; no handoff |

### Model Assignment

| Agent | Model | Rationale |
|-------|-------|-----------|
| `lca-arbiter` | **opus** | Critical judgment - decides if run should stop |
| `lca-planner` | **opus** | Architecture decisions, task decomposition |
| `lca-reviewer` | **opus** | Quality judgment - validates code and tests |
| `lca-backend` | sonnet | Complex implementation work |
| `lca-frontend` | sonnet | Complex implementation work |
| `lca-qa` | sonnet | Debugging and test fixes |
| `lca-docs` | sonnet | Quality documentation for readers |
| `lca-enforcer` | sonnet | Rule-based protocol checks |
| `lca-recorder` | haiku | Simple summarization |
| `lca-gitops` | haiku | Simple git commands |
| `code-simplifier` | **opus** | High-quality code refactoring (plugin default) |

### Task Format

Each task file is generated by the planner in `runs/tasks/task-XXX.md` and assigns a role explicitly:

```yaml
task_id: task-001
title: Short title
role: lca-backend
post: [lca-recorder, code-simplifier, lca-gitops]
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

### Hooks System

Claude Code hooks provide out-of-band automation without LLM token overhead:

| Hook | Scripts | Purpose |
|------|---------|---------|
| `SessionStart` | `session-start.py` | LCA state + arbiter alerts on session resume |
| `PostToolUse` | `tool-record.py` | Tool outcomes (Bash/Edit/Write) with success/failure |
| `Stop` | `usage-record.py`, `arbiter-scheduler.py`, `session-summary.py` | Tokens + arbiter trigger + session summary |
| `SubagentStop` | (same as Stop) | Same hooks for subagent completion |
| `PermissionRequest` | `permission-record.py` | Permission prompt logging |
| `Notification` | `permission-record.py` | Permission prompt logging |

**SessionStart Hook:**
* Injects LCA protocol state on session start/resume
* Shows arbiter alerts if `pending.json` exists or phase is `BLOCKED`
* Provides one-line state summary: `[LCA: phase=IN_TASK, task=task-038, role=lca-backend, completed=12]`
* Logs session starts to `runs/sessions/starts.jsonl`

**PostToolUse Hook (tool-record.py):**
* Logs tool outcomes (replaces PreToolUse for richer data)
* Captures: tool name, success/failure, command, task context
* Detects check_command executions (`make check`, `pytest`, etc.)
* Includes result preview for errors and check commands
* Logs to `runs/tools/usage.jsonl`

**Session Summary Hook:**
* Writes `runs/sessions/<session_id>-summary.md` on session end
* Includes: LCA state, files modified, recent actions, failure count
* Also writes `runs/sessions/latest-summary.md` for easy access
* Helps with session resume and debugging

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
* `trigger_after_tokens`: 100000 (arbiter runs after 100k tokens)
* `trigger_after_minutes`: 20
* `trigger_after_tasks`: 1 (arbiter runs after each task)
* `max_files_changed_without_human`: 25
* `max_lines_changed_without_human`: 800
* `max_permission_prompts_between_checkpoints`: 3

**Permission Logging:**
* `PermissionRequest` and `Notification` hooks trigger `.claude/hooks/permission-record.py`
* Only fires when actual permission prompts occur (not in `bypassPermissions` mode)
* Logs to `runs/permissions/requests.jsonl`

### Plugins

Claude Code plugins extend functionality with reusable components:

**Installed Plugins:**

| Plugin | Source | Purpose |
|--------|--------|---------|
| `code-simplifier` | claude-plugins-official | Code clarity/consistency (post agent) |
| `security-guidance` | claude-plugins-official | Security pattern warnings on file edits |

**security-guidance Plugin:**
* PreToolUse hook on Edit/Write operations
* Warns about security patterns before code is written:
  - `os.system` - Python command injection
  - `eval()` - Code injection
  - `pickle` - Unsafe deserialization
  - `dangerouslySetInnerHTML` - React XSS
  - `.innerHTML` - XSS
  - `document.write` - XSS
  - `child_process.exec` - Node.js command injection
  - `new Function` - Code injection
  - GitHub Actions workflow injection
* Blocks execution (exit code 2) until acknowledged
* Shows each warning once per file per session

**Installation:**
```bash
claude plugin install security-guidance
claude plugin install code-simplifier
```

### Communication Model

All agent communication is **centralized through the orchestrator**:

1. **Agents write to files** — never to each other directly
   - Role agents → `runs/handoffs/task-{ID}.md`
   - Reviewer → `runs/review/task-{ID}-review.md`
   - Enforcer → `runs/review/task-{ID}-enforcer.md`
   - Post agents → `runs/handoffs/task-{ID}-{agent}.md`

2. **Orchestrator reads and passes context**
   - Reads outputs from previous step
   - Passes relevant context to next agent via prompt
   - Agents never read other agents' output directly

3. **Benefits**
   - Clear audit trail in `runs/`
   - No hidden agent-to-agent dependencies
   - Orchestrator controls information flow
   - Easy to debug handoff issues

### Permissions Model

* **Project-wide baseline** permissions live in `.claude/settings.json` (shared).
* **Per-agent differences** are controlled via each subagent file's YAML frontmatter:
  * `tools` (what the agent can do)
  * `permissionMode` (how aggressively it auto-approves)
  * `model` (optional)
* **Per-participant overrides** should go in `.claude/settings.local.json` (not committed), if needed.

Sensitive file reads (e.g. `.env`, private keys) are denied by default in project settings.

### Reference Skills System

Agents have access to **domain expertise** via reference skills stored in `.spawner/skills/`. These are YAML files containing patterns, anti-patterns, and production gotchas that agents consult during implementation.

**Source:** [vibeship-spawner-skills](https://github.com/vibeforge1111/vibeship-spawner-skills) (project-local install)

```
.spawner/
└── skills/
    ├── ai/                 # LLM architecture, embeddings
    ├── ai-agents/          # Agent patterns, guardrails, orchestration
    ├── backend/            # FastAPI, API design, queues, realtime
    ├── data/               # PostgreSQL, Redis, migrations
    ├── design/             # UI/UX, design systems, Tailwind
    ├── development/        # Docs, migrations, technical debt
    ├── devops/             # Docker, CI/CD, git workflow
    ├── frameworks/         # React, Next.js, Tailwind
    ├── frontend/           # React patterns, state management
    ├── hardware/           # IoT, sensors, embedded (future)
    ├── security/           # Auth, OWASP patterns
    └── testing/            # Test strategies, code review
```

**Skill File Structure:**
```yaml
# .spawner/skills/<category>/<skill>/skill.yaml
id: python-backend
name: Python Backend
category: backend

patterns:
  - name: FastAPI Application Structure
    description: Production-ready project layout
    example: |
      # Code patterns...

anti_patterns:
  - name: Sync in Async
    description: Blocking calls in async functions
    why: Blocks the event loop
    instead: |
      # Correct approach...
```

**Agent → Skill Mapping:**

| Agent | Reference Skills |
|-------|------------------|
| `lca-backend` | `backend/python-backend`, `backend/api-design`, `backend/queue-workers`, `backend/realtime-engineer`, `data/postgres-wizard` |
| `lca-frontend` | `frontend/frontend`, `frontend/state-management`, `design/ui-design`, `design/ux-design`, `design/tailwind-css` |
| `lca-qa` | `testing/testing-strategies`, `testing/test-architect`, `testing/qa-engineering` |
| `lca-reviewer` | `testing/code-review`, `testing/code-reviewer`, + anti-patterns from domain skills |
| `lca-gitops` | `devops/git-workflow`, `devops/cicd-pipelines` |
| `lca-planner` | `ai-agents/autonomous-agents`, `ai-agents/multi-agent-orchestration` |
| `lca-arbiter` | `ai-agents/autonomous-agents` (guardrails), `ai-agents/agent-evaluation` |
| `lca-docs` | `development/docs-engineer`, `backend/api-design` |

**Usage:**
Agents read skill YAML files when implementing to:
- Follow established patterns
- Avoid documented anti-patterns
- Apply production lessons ("sharp edges")

Skills are **reference documentation**, not executable code. Agents decide when to consult them based on the task at hand.

### Active Skills

Skills copied to `.claude/skills/` for the current feature. Unlike `.spawner/skills/` (reference library), these are actively available to agents during execution.

**Current Active Skills:**

| Category | Skills |
|----------|--------|
| Protocol | `lca-protocol`, `lca-feature-setup` |
| Design | `color-theory`, `design-systems`, `ui-design`, `ux-design`, `tailwind-css` |
| Backend | `python-backend`, `api-design`, `error-handling`, `queue-workers` |
| Data | `postgres-wizard`, `database-migrations` |
| DevOps | `docker`, `logging-strategies` |
| Security | `security` |
| Hardware | `embedded-systems`, `sensor-fusion` |
| Testing | `testing-strategies` |
| Frontend | `frontend`, `state-management` |

**Copying Skills:**
```bash
cp -r .spawner/skills/<category>/<skill> .claude/skills/
```

### Interactive Skills

Skills for human+Claude interactive sessions (not autonomous execution).

**lca-feature-setup:**
Interactive checklist for setting up a new feature. Triggered by "start feature X" or "new feature".

Steps:
1. Define feature in `objective.md`
2. Prepare skills (copy from `.spawner/skills/`)
3. Create run branch (`run/<NNN>`)
4. Clean previous run artifacts (arbiter pending.json, notes.md)
5. Update `runs/state.json` with `phase=PLANNING`
6. Verify setup
7. Handoff to user for autonomous session

**Usage:**
```
User: "start feature 5"
Claude: [follows lca-feature-setup checklist interactively]
```

After setup, user starts a new session where the autonomous orchestrator takes over.

### Code Simplifier Plugin

The `code-simplifier` is an official Anthropic Claude Code plugin that runs as a post agent after code implementation tasks.

**Installation:**
```bash
claude plugin install code-simplifier
```

**Source:** [claude-plugins-official](https://github.com/anthropics/claude-plugins-official/tree/main/plugins/code-simplifier)

**What it does:**
- Simplifies and refines code for clarity, consistency, and maintainability
- Preserves exact functionality - never changes what code does, only how
- Focuses on recently modified files in the current task
- Runs on Opus model for high-quality refactoring

**Principles:**
1. **Preserve Functionality** - All original features, outputs, and behaviors remain intact
2. **Apply Project Standards** - ES modules, proper imports, explicit types, React patterns
3. **Enhance Clarity** - Reduce nesting, eliminate redundancy, improve naming
4. **Maintain Balance** - Avoid over-simplification that reduces readability

**Post Agent Order:**
```
lca-recorder → code-simplifier → lca-gitops
     │               │                │
     ▼               ▼                ▼
  records         refines          commits
  changes         code             changes
```

**When to include:**

| Role | Post Array |
|------|------------|
| `lca-backend` | `[lca-recorder, code-simplifier, lca-gitops]` |
| `lca-frontend` | `[lca-recorder, code-simplifier, lca-gitops]` |
| `lca-qa` | `[lca-recorder, lca-gitops]` |
| `lca-docs` | `[lca-recorder, lca-gitops]` |

Only coding roles (backend, frontend) get code-simplifier. QA and docs skip it.

**Invocation:**
Unlike subagents (Task tool), plugins are invoked via Skill tool:
```
Skill tool with skill: "code-simplifier"
```

**Note:** Unlike other post agents, `code-simplifier` does not write a handoff file. It's a plugin that operates on the working tree directly.

---

## Configuration

See `.env.example`.
