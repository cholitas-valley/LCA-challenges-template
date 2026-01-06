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
