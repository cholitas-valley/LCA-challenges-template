---
task_id: task-025
title: Final QA - Complete System
role: lca-qa
follow_roles: []
post:
  - lca-recorder
  - lca-docs
  - lca-gitops
depends_on:
  - task-024
inputs:
  - objective.md
  - runs/plan.md
  - runs/handoffs/task-024.md
allowed_paths:
  - backend/**
  - frontend/**
  - Makefile
  - docker-compose.yml
  - docs/**
check_command: make check
handoff: runs/handoffs/task-025.md
---

# Task 025: Final QA - Complete System

## Goal

Final validation of the complete PlantOps system including both Feature 1 (Core Platform) and Feature 2 (LLM Care Advisor).

## Requirements

### Complete System Checklist

**Feature 1: Core Platform**
- [ ] Device registration via API works
- [ ] MQTT authentication enforced
- [ ] Plant CRUD operations work
- [ ] Device-plant association works
- [ ] Telemetry pipeline flows end-to-end
- [ ] Dashboard shows live data
- [ ] History charts render
- [ ] Threshold alerts fire
- [ ] Device offline detection works
- [ ] Discord alerts send (if configured)

**Feature 2: LLM Care Advisor**
- [ ] Settings page allows LLM configuration
- [ ] API key stored encrypted
- [ ] Test connection validates key
- [ ] Care plan generation works
- [ ] Care page displays plan
- [ ] Regenerate button works
- [ ] Graceful handling when LLM not configured

### Test Coverage

Verify test suites pass:
- Backend pytest: All tests pass
- Frontend build: No errors

### Integration Tests

Add/verify integration tests:
- Full device lifecycle (register -> provision -> telemetry -> offline)
- Full plant lifecycle (create -> configure -> monitor -> delete)
- LLM care plan flow (configure -> generate -> display)

### Makefile Targets

Ensure `make check` includes:
```makefile
check:
	@echo "Running backend tests..."
	cd backend && python -m pytest tests/ -v
	@echo "Building frontend..."
	cd frontend && npm run build
	@echo "All checks passed!"
```

### Documentation Review

Verify docs are current:
- `docs/system-design.md` matches implementation
- `docs/api.md` covers all endpoints
- `docs/deployment.md` has correct setup steps
- `docs/development.md` has accurate instructions

### Final Bug Fixes

If any issues found:
- Fix in appropriate codebase
- Add regression tests
- Update documentation if needed

### Success Criteria Verification

From objective.md:
1. [ ] Device can self-register via API
2. [ ] Device receives unique MQTT credentials
3. [ ] MQTT broker rejects unauthenticated connections
4. [ ] Plants can be created/updated/deleted via API
5. [ ] Telemetry flows: device -> MQTT -> backend -> DB
6. [ ] Dashboard shows plants with live data
7. [ ] Device status tracked (online/offline)
8. [ ] Discord alert fires on threshold breach
9. [ ] Discord alert fires when device goes offline
10. [ ] User can configure Anthropic or OpenAI API key
11. [ ] LLM generates care plan based on plant species + sensor data
12. [ ] Care plan displays on per-plant care page
13. [ ] `make check` passes

## Definition of Done

- [ ] All Feature 1 criteria verified
- [ ] All Feature 2 criteria verified
- [ ] All backend tests pass
- [ ] Frontend builds without errors
- [ ] `make check` exits 0
- [ ] Documentation is current
- [ ] No known blocking issues

## Constraints

- Fix bugs, don't add new features
- Keep changes minimal
- Document any known limitations
- If LLM API key not available for testing, verify with mocks

## Notes

This is the final QA task. After this task completes successfully, the PlantOps system is considered feature-complete per the objective.

Any issues found should be documented in the handoff, along with recommendations for future improvements.
