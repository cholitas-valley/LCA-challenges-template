---
task_id: task-012
title: Threshold evaluation worker
role: lca-backend
follow_roles: []
post:
  - lca-recorder
  - lca-gitops
depends_on:
  - task-010
inputs:
  - objective.md
  - runs/plan.md
  - runs/handoffs/task-010.md
allowed_paths:
  - backend/**
check_command: cd backend && python -m pytest tests/test_threshold.py -v --tb=short
handoff: runs/handoffs/task-012.md
---

# Task 012: Threshold Evaluation Worker

## Goal

Implement the threshold evaluation logic that compares incoming telemetry against plant thresholds and determines when alerts should be triggered. Includes cooldown to prevent alert spam.

## Requirements

### Threshold Evaluator (backend/src/services/threshold_evaluator.py)

```python
@dataclass
class ThresholdViolation:
    plant_id: str
    device_id: str
    metric: str  # soil_moisture, temperature, humidity, light_level
    value: float
    threshold: float
    direction: str  # 'min' or 'max'

class ThresholdEvaluator:
    def __init__(self, cooldown_seconds: int = 3600):
        self.cooldown_seconds = cooldown_seconds
        
    async def evaluate(
        self, 
        plant_id: str, 
        device_id: str,
        telemetry: TelemetryPayload,
        thresholds: PlantThresholds
    ) -> list[ThresholdViolation]:
        """Check telemetry against thresholds, return violations."""
        
    async def should_alert(self, violation: ThresholdViolation) -> bool:
        """Check if alert should be sent (not in cooldown)."""
        
    async def record_alert(self, violation: ThresholdViolation) -> None:
        """Record that alert was sent (for cooldown tracking)."""
```

### Alert Repository (backend/src/repositories/alert.py)

Database operations:
- `create_alert(plant_id, device_id, metric, value, threshold, direction)`
- `get_latest_alert(plant_id, metric)` - For cooldown check
- `list_alerts(plant_id, limit)` - For history

### Threshold Logic

For each metric in thresholds:
```python
# Example: soil_moisture threshold { min: 20, max: 80 }
if thresholds.soil_moisture:
    if thresholds.soil_moisture.min and value < thresholds.soil_moisture.min:
        # Violation: below minimum
        violations.append(ThresholdViolation(
            metric="soil_moisture",
            value=value,
            threshold=thresholds.soil_moisture.min,
            direction="min"
        ))
    if thresholds.soil_moisture.max and value > thresholds.soil_moisture.max:
        # Violation: above maximum
        violations.append(ThresholdViolation(
            metric="soil_moisture",
            value=value,
            threshold=thresholds.soil_moisture.max,
            direction="max"
        ))
```

### Cooldown Logic

- Default cooldown: 1 hour (3600 seconds) per metric per plant
- Check last alert time for same metric+plant
- If last alert < cooldown_seconds ago, skip alerting
- Different metrics have independent cooldowns

### Integration with Telemetry Handler

In TelemetryHandler (from task-010):
```python
async def handle_telemetry(self, device_id: str, payload: dict):
    # ... existing storage logic ...
    
    # Only evaluate if device is assigned to plant
    if plant_id:
        plant = await plant_repo.get_plant_by_id(plant_id)
        if plant.thresholds:
            violations = await threshold_evaluator.evaluate(
                plant_id, device_id, telemetry, plant.thresholds
            )
            for v in violations:
                if await threshold_evaluator.should_alert(v):
                    await alert_queue.put(v)  # For Discord worker
                    await threshold_evaluator.record_alert(v)
```

### Tests (backend/tests/test_threshold.py)

Test cases:
- Value below min triggers violation
- Value above max triggers violation
- Value within range has no violation
- Cooldown prevents repeated alerts
- Cooldown allows alert after timeout
- Missing threshold (None) is ignored
- Multiple metrics evaluated independently

## Definition of Done

- [ ] ThresholdEvaluator compares telemetry to thresholds
- [ ] ThresholdViolation dataclass captures all alert info
- [ ] Cooldown prevents alert spam (1 hour default)
- [ ] Alerts stored in database with timestamp
- [ ] Integration with telemetry handler
- [ ] All tests pass

## Constraints

- Do NOT send Discord alerts yet (that is task-013)
- Only evaluate for assigned devices (plant_id not null)
- Cooldown is per-metric per-plant
- Handle null thresholds gracefully
