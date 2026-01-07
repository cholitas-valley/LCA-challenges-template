# Recorder: task-012

## Changes Summary

Implemented threshold evaluation worker. Compares telemetry against plant thresholds, detects violations, records alerts with cooldown protection.

## Key Files

- `backend/src/services/threshold_evaluator.py`: ThresholdViolation, ThresholdEvaluator
- `backend/src/repositories/alert.py`: create_alert, get_latest_alert, list_alerts
- `backend/src/services/telemetry_handler.py`: Integration with evaluator
- `backend/tests/test_threshold.py`: 13 unit tests

## Interfaces for Next Task

### ThresholdEvaluator
```python
from src.services.threshold_evaluator import ThresholdEvaluator, ThresholdViolation
evaluator = ThresholdEvaluator(cooldown_seconds=3600)
violations = await evaluator.evaluate(plant_id, device_id, telemetry, thresholds)
if await evaluator.should_alert(violation):
    await evaluator.record_alert(violation)
```

### Alert Repository
```python
from src.repositories.alert import create_alert, get_latest_alert, list_alerts
```

### ThresholdViolation
```python
@dataclass
class ThresholdViolation:
    plant_id: str
    device_id: str
    metric: str  # soil_moisture, temperature, humidity, light_level
    value: float
    threshold: float
    direction: str  # 'min' or 'max'
```

## Notes

- Cooldown: 1 hour per metric per plant
- Only evaluates for assigned devices (plant_id not null)
- Violations recorded to alerts table
- Discord notification deferred to task-013
