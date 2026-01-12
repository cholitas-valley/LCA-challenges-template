# Recorder: task-022

## Changes Summary

Implemented LLM-powered care plan generation with Anthropic/OpenAI support. Plants can be analyzed to generate personalized care recommendations.

## Key Files

- `backend/src/models/care_plan.py`: CarePlan, CarePlanWatering, CarePlanMetric models
- `backend/src/services/llm.py`: LLMService with generate_care_plan method
- `backend/src/repositories/care_plan.py`: Care plan database operations
- `backend/src/routers/plants.py`: Added /analyze and /care-plan endpoints
- `backend/tests/test_care_plan.py`: 10 tests

## Interfaces for Next Task

### Endpoints
```
POST /api/plants/{id}/analyze    - Generate new care plan
GET  /api/plants/{id}/care-plan  - Get stored care plan
```

### CarePlan Model
```python
class CarePlan(BaseModel):
    summary: str
    watering: CarePlanWatering
    light: CarePlanMetric
    humidity: CarePlanMetric
    temperature: CarePlanMetric | None
    alerts: list[str]
    tips: list[str]
    generated_at: datetime
```

### LLMService
```python
service = LLMService(provider, api_key, model)
plan = await service.generate_care_plan(
    plant_name, species, current_readings, history_summary, thresholds
)
```

## Notes

- 30-second timeout for LLM calls
- Returns 503 if LLM not configured
- Care plans cached in database
- Added anthropic>=0.18.0, openai>=1.10.0 dependencies
