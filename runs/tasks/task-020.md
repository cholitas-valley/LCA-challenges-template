---
task_id: task-020
title: Feature 1 QA - Core Platform
role: lca-qa
follow_roles: []
post:
  - lca-recorder
  - lca-docs
  - lca-gitops
depends_on:
  - task-019
  - task-013
inputs:
  - objective.md
  - runs/plan.md
  - runs/handoffs/task-019.md
  - runs/handoffs/task-013.md
allowed_paths:
  - backend/**
  - frontend/**
  - Makefile
  - docker-compose.yml
check_command: make check
handoff: runs/handoffs/task-020.md
---

# Task 020: Feature 1 QA - Core Platform

## Goal

Validate the complete Feature 1 implementation: device provisioning, plant management, telemetry pipeline, and alerts. Ensure all components work together end-to-end.

## Requirements

### Test Coverage

Ensure adequate test coverage for:

**Backend:**
- Device registration and provisioning
- Plant CRUD operations
- Telemetry ingestion
- Threshold evaluation
- Alert generation

**Frontend:**
- Build completes without errors
- TypeScript strict mode passes

### Integration Testing

Create/update integration tests:
- Device registration -> MQTT auth -> telemetry flow
- Threshold breach -> alert generation
- Device offline detection

### End-to-End Checklist

Verify manually or via tests:

1. **Device Provisioning**
   - [ ] Device can register via API
   - [ ] MQTT credentials returned
   - [ ] Device added to password file
   - [ ] Device appears in device list

2. **Plant Management**
   - [ ] Can create plant with name
   - [ ] Can set thresholds
   - [ ] Can assign device to plant
   - [ ] Plant shows in dashboard

3. **Telemetry Flow**
   - [ ] MQTT subscriber connects
   - [ ] Telemetry stored in database
   - [ ] Latest reading shown on dashboard
   - [ ] History endpoint returns data

4. **Device Status**
   - [ ] Heartbeat updates last_seen
   - [ ] Offline detection works (after timeout)
   - [ ] Status reflected in UI

5. **Alerts**
   - [ ] Threshold violation detected
   - [ ] Alert stored in database
   - [ ] Cooldown prevents spam
   - [ ] Discord notification sent (if configured)

### Fix Issues

If any issues found:
- Fix backend/frontend code
- Add missing tests
- Update documentation

### Makefile Check Target

Ensure `make check` runs:
```makefile
check:
	cd backend && python -m pytest tests/ -v
	cd frontend && npm run build
	cd frontend && npm run lint  # if configured
```

## Definition of Done

- [ ] All backend tests pass
- [ ] Frontend builds without errors
- [ ] `make check` exits 0
- [ ] Device provisioning flow works
- [ ] Telemetry pipeline works
- [ ] Alerts trigger correctly
- [ ] No TypeScript errors

## Constraints

- Fix bugs, don't add new features
- Keep changes minimal and focused
- Document any workarounds needed
- If Discord webhook not configured, verify logging instead

## Notes

This is a QA/validation task. The goal is to ensure Feature 1 is complete and working before moving to Feature 2 (LLM integration).
