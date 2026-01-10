## Review: task-040
Status: APPROVED

### Definition of Done Verification
- [x] `frontend/src/components/ui/StatusBadge.tsx` created
- [x] Component exported from `ui/index.ts` (lines 15-16)
- [x] Supports all 6 status types: online, offline, error, warning, provisioning, info
- [x] Uses semantic status color tokens (`bg-status-*`, `text-status-*-text`)
- [x] Has sm and md size variants (lines 66-67, 74-77)
- [x] Shows dot indicator by default (`showDot = true`)
- [x] `npm run build` succeeds (verified)
- [x] `npm run lint` passes (verified)

### Code Quality
- Clean TypeScript implementation with proper type exports
- Uses `cn` utility for class merging (follows project patterns)
- Sensible defaults for optional props (`showDot = true`, `size = 'md'`)
- No logic bugs - pure presentational component
- Semantic tokens correctly reference Tailwind config from task-038

### Constraint Compliance
- Only modifies files in `frontend/**` - PASS
- Uses only semantic status tokens - PASS
- Does not update existing components - PASS (deferred to task-043+)
- Component is not interactive - PASS

### Files Reviewed
- `/home/genge/dev-ash/foundry-nodevenv/cholitas/challenge-001-plantops/frontend/src/components/ui/StatusBadge.tsx` (87 lines)
- `/home/genge/dev-ash/foundry-nodevenv/cholitas/challenge-001-plantops/frontend/src/components/ui/index.ts` (17 lines)

### Notes
- No unit tests for this component, but task scope did not require them
- Chunk size warning is pre-existing (noted in handoff) - unrelated to this task
- Visual verification will occur during integration in follow-up tasks
