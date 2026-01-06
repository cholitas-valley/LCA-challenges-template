# Post-Run Action Plan

**Created:** 2026-01-06
**Run:** run/001 (challenge-001-plantops)
**Status:** To be executed after run completes

This document prioritizes fixes to apply to main branch after the current run.

---

## Priority Levels

| Level | Description | Action |
|-------|-------------|--------|
| **P0** | Critical - blocks future runs | Fix immediately |
| **P1** | High - causes significant issues | Fix before next run |
| **P2** | Medium - improves reliability | Fix soon |
| **P3** | Low - nice to have | Fix when time permits |

---

## Phase 1: Critical Fixes (P0)

These must be fixed before starting another run.

### 1.1 Fix Orchestrator Post-Agent Invocation

**Issue:** #11 - Orchestrator not invoking lca-gitops
**Impact:** Zero commits during entire run, all code untracked, arbiter blind
**Effort:** 1-2 hours

**Files to change:**
- `CLAUDE.md` - Update execution loop step 4

**Changes:**
```markdown
### 4) Post agents
If `post` includes additional agents:
- **For EACH agent in the `post` array (in order):**
  - Update `current_role` to the post agent name
  - Invoke the agent subagent
  - Wait for completion
  - Verify handoff file was created at expected path
  - If handoff missing after 2 retries, log error and continue
```

**Verification:**
- Run a test task with `post: [lca-docs, lca-gitops]`
- Confirm both `task-XXX-docs.md` AND `task-XXX-gitops.md` handoffs created
- Confirm git commit was made

---

### 1.2 Add Post-Agent Validation

**Issue:** #12 - No validation that post agents completed
**Impact:** Silent failures go unnoticed
**Effort:** 30 minutes

**Files to change:**
- `CLAUDE.md` - Add validation step after post agents

**Changes:**
```markdown
### 4b) Verify post agents
After invoking all post agents:
- Check each expected handoff exists:
  - `runs/handoffs/task-{ID}-{agent}.md` for each agent in `post`
- If any missing:
  - Log warning to `runs/notes.md`
  - Consider retrying or setting phase=BLOCKED
```

---

## Phase 2: High Priority Fixes (P1)

Fix before next run to avoid repeating issues.

### 2.1 Arbiter State Updates

**Issue:** #5 - Arbiter state.json not being updated
**Impact:** Timestamps/tokens never reset, thresholds meaningless
**Effort:** 30 minutes

**Files to change:**
- `.claude/agents/lca-arbiter.md`

**Changes:**
Add to outputs section:
```markdown
## Outputs (required)
4) Update `runs/arbiter/state.json`:
   - `last_checkpoint_epoch`: current Unix timestamp
   - `last_checkpoint_tokens`: total tokens from pending.json
   - `last_checkpoint_tasks`: count of completed tasks
```

---

### 2.2 Planner Must Include lca-gitops

**Issue:** #8 - Tasks 001-009 had no gitops in post
**Impact:** No commits = no checkpoints = risky
**Effort:** 15 minutes

**Files to change:**
- `.claude/agents/lca-planner.md`

**Changes:**
```markdown
## Task File Format
...
post: [lca-docs, lca-gitops]  # ALWAYS include both
```

---

### 2.3 Fix Arbiter Timestamp Bug

**Issue:** #4 - Minutes since checkpoint shows 56 years
**Impact:** Threshold calculations wrong
**Effort:** 15 minutes

**Files to change:**
- `.claude/hooks/arbiter-scheduler.py`

**Changes:**
```python
# Handle first-run case where epoch is 0
last_epoch = int(arb_state.get("last_checkpoint_epoch") or 0)
if last_epoch == 0:
    last_epoch = now_epoch  # Treat as just happened
```

---

### 2.4 Arbiter Clears pending.json

**Issue:** #2 - pending.json not cleared after checkpoint
**Impact:** Arbiter may re-trigger on stale data
**Effort:** 15 minutes

**Files to change:**
- `.claude/agents/lca-arbiter.md`

**Changes:**
```markdown
## Outputs (required)
...
5) **Delete** `runs/arbiter/pending.json` after writing decision.json
```

---

### 2.5 Debug E2E Test Failures

**Issue:** #13 - 14/15 E2E tests failing
**Impact:** Quality gate incomplete
**Effort:** 2-4 hours

**Investigation steps:**
1. Run with trace: `npx playwright test --trace on`
2. Check for console errors in trace
3. Verify `VITE_API_BASE_URL` in frontend Docker build
4. Check CORS headers on backend
5. Test API fetch manually in browser dev tools

**Likely fixes:**
- Set correct API URL in frontend build args
- Add CORS headers to backend for frontend origin
- Fix TanStack Query configuration

---

## Phase 3: Medium Priority (P2)

Improve reliability and observability.

### 3.1 Switch Arbiter to Haiku Model

**Issue:** #1 - Arbiter too expensive (22k tokens per checkpoint)
**Effort:** 5 minutes

**Files to change:**
- `.claude/agents/lca-arbiter.md`

**Changes:**
```yaml
model: haiku  # was: sonnet
```

---

### 3.2 Add Task-Based Arbiter Trigger

**Issue:** #6 - Arbiter only triggers on token/time thresholds
**Effort:** 30 minutes

**Files to change:**
- `.claude/hooks/arbiter-scheduler.py`
- `runs/arbiter/config.json`

**Changes to config.json:**
```json
{
  "min_tasks_between_checkpoints": 3
}
```

**Changes to scheduler:**
```python
tasks_since = len(state.get("completed_task_ids", [])) - arb_state.get("last_checkpoint_tasks", 0)
if tasks_since >= cfg.get("min_tasks_between_checkpoints", 3):
    # Trigger checkpoint
```

---

### 3.3 Implement Tiered Severity

**Issue:** #7 - Binary needs_human is limiting
**Effort:** 1 hour

**Files to change:**
- `.claude/agents/lca-arbiter.md`
- `CLAUDE.md`

**Changes:** See notes.md issue #7 for full details.

---

### 3.4 Add Usage Reporting

**Issue:** #9 - No visibility into token usage during run
**Effort:** 1 hour

**Create:** `.claude/hooks/usage-reporter.py`

Triggered on `Stop` or phase transitions. Writes summary to `runs/usage/summary.md`.

---

### 3.5 Planner File Creation Constraint

**Issue:** #14 - Planner dumped specs to notes.md
**Effort:** 15 minutes

**Files to change:**
- `.claude/agents/lca-planner.md`

**Changes:**
```markdown
## Constraints
- If you cannot create task files directly, STOP and signal to orchestrator
- NEVER output task specifications to notes.md, handoffs, or other files
- Request orchestrator assistance for file creation
```

---

## Phase 4: Low Priority (P3)

Nice-to-have improvements.

### 4.1 Standardize Handoff Naming

**Issue:** #15 - Inconsistent naming (task-XXX-docs.md vs docs-task-XXX.md)
**Effort:** 15 minutes

**Files to change:**
- `.claude/agents/lca-docs.md`
- `.claude/agents/lca-gitops.md`

**Standard format:** `task-{ID}-{agent}.md`

---

### 4.2 Expand Tool Logging

**Issue:** #10 - Only Bash tools logged
**Effort:** 30 minutes

**Files to change:**
- `.claude/settings.json`

**Changes:**
```json
"PreToolUse": [
  {
    "matcher": "Bash|Edit|Write",
    "hooks": [...]
  }
]
```

---

## Cleanup Tasks

After applying fixes, also:

1. **Remove task specs from notes.md** - Delete lines 390+ (planner dump)
2. **Commit current run work** - Stage and commit all untracked files on run/001 branch
3. **Merge to main** - After fixes verified, merge run/001 to main
4. **Reset arbiter state** - Clear `runs/arbiter/` for fresh start

---

## Execution Checklist

```
[ ] Phase 1.1 - Fix orchestrator post-agent invocation
[ ] Phase 1.2 - Add post-agent validation
[ ] Phase 2.1 - Arbiter state updates
[ ] Phase 2.2 - Planner includes lca-gitops
[ ] Phase 2.3 - Fix arbiter timestamp bug
[ ] Phase 2.4 - Arbiter clears pending.json
[ ] Phase 2.5 - Debug E2E test failures
[ ] Phase 3.1 - Switch arbiter to haiku
[ ] Phase 3.2 - Task-based arbiter trigger
[ ] Phase 3.3 - Tiered severity
[ ] Phase 3.4 - Usage reporting
[ ] Phase 3.5 - Planner file creation constraint
[ ] Phase 4.1 - Standardize handoff naming
[ ] Phase 4.2 - Expand tool logging
[ ] Cleanup - Remove task specs from notes.md
[ ] Cleanup - Commit run/001 work
[ ] Cleanup - Merge to main
[ ] Cleanup - Reset arbiter state
```

---

## Estimated Total Effort

| Phase | Items | Effort |
|-------|-------|--------|
| P0 Critical | 2 | 2-3 hours |
| P1 High | 5 | 3-5 hours |
| P2 Medium | 5 | 3-4 hours |
| P3 Low | 2 | 45 minutes |
| Cleanup | 4 | 30 minutes |
| **Total** | **18** | **~10-13 hours** |

---

## Dependencies

```
Phase 1.1 (orchestrator fix) ─┬─► Phase 2.2 (planner gitops)
                              │
Phase 1.2 (validation)       ─┘

Phase 2.1 (arbiter state) ───► Phase 2.3 (timestamp bug)
                              │
                              └─► Phase 2.4 (clear pending)

Phase 2.5 (E2E debug) ───────► Standalone (can do in parallel)

Phase 3.* ───────────────────► All depend on Phase 1-2 complete
```

---

## Success Criteria

After applying all P0/P1 fixes:

1. **Test run with 3 tasks** - Verify:
   - [ ] lca-gitops invoked after each task
   - [ ] Git commits made with proper messages
   - [ ] Arbiter state.json updated after checkpoint
   - [ ] pending.json deleted after arbiter runs
   - [ ] Both docs and gitops handoffs created

2. **E2E tests** - Verify:
   - [ ] At least 10/15 tests passing
   - [ ] Plant cards render in Playwright

3. **Arbiter effectiveness** - Verify:
   - [ ] Can see code changes in git diff
   - [ ] Timestamps/thresholds calculate correctly
   - [ ] Checkpoints trigger on task count
