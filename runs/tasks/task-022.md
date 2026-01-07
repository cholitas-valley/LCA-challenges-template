---
task_id: task-022
title: Care plan generation
role: lca-backend
follow_roles: []
post:
  - lca-recorder
  - lca-gitops
depends_on:
  - task-021
inputs:
  - objective.md
  - runs/plan.md
  - runs/handoffs/task-021.md
allowed_paths:
  - backend/**
check_command: cd backend && python -m pytest tests/test_care_plan.py -v --tb=short
handoff: runs/handoffs/task-022.md
---

# Task 022: Care Plan Generation

## Goal

Implement the LLM-powered care plan generation that analyzes plant data and provides personalized care recommendations.

## Requirements

### Models (backend/src/models/care_plan.py)

```python
class CarePlanWatering(BaseModel):
    frequency: str  # "Every 5-7 days"
    amount: str  # "Until water drains"
    next_date: str | None  # ISO date

class CarePlanMetric(BaseModel):
    current: str | float
    ideal: str
    recommendation: str

class CarePlan(BaseModel):
    summary: str
    watering: CarePlanWatering
    light: CarePlanMetric
    humidity: CarePlanMetric
    temperature: CarePlanMetric | None = None
    alerts: list[str]  # Current issues
    tips: list[str]  # General care tips
    generated_at: datetime

class CarePlanResponse(BaseModel):
    plant_id: str
    plant_name: str
    species: str | None
    care_plan: CarePlan | None
    last_generated: datetime | None
```

### LLM Service (backend/src/services/llm.py)

```python
class LLMService:
    def __init__(self, provider: str, api_key: str, model: str):
        self.provider = provider
        self.api_key = api_key
        self.model = model
        
    async def generate_care_plan(
        self,
        plant_name: str,
        species: str | None,
        current_readings: dict,
        history_summary: dict,
        thresholds: dict | None
    ) -> CarePlan:
        """Generate care plan using LLM."""
```

### LLM Prompt

Create a system prompt that:
1. Explains the role (plant care advisor)
2. Provides context (sensor types, readings)
3. Requests structured JSON output
4. Includes species-specific knowledge

Example prompt structure:
```
You are a plant care advisor. Analyze the following plant data and provide care recommendations.

Plant: {name}
Species: {species}

Current Readings:
- Soil Moisture: {soil_moisture}%
- Temperature: {temperature}°C
- Humidity: {humidity}%
- Light Level: {light_level} lux

24-Hour Trends:
- Moisture: {moisture_trend} (avg, min, max)
- Temperature: {temp_trend}

Thresholds:
{thresholds}

Provide a care plan in the following JSON format:
{json_schema}
```

### Provider Implementations

**Anthropic (Claude):**
- Use anthropic Python SDK
- claude-sonnet-4-20250514 default model
- Handle rate limits

**OpenAI (GPT):**
- Use openai Python SDK
- gpt-4o default model
- Handle rate limits

### Care Plan Router (add to backend/src/routers/plants.py)

Endpoints:

**POST /api/plants/{plant_id}/analyze**
- Generate new care plan
- Store in database
- Return generated plan

**GET /api/plants/{plant_id}/care-plan**
- Return stored care plan
- Include generated_at timestamp
- Return null if no plan exists

### Care Plan Repository (backend/src/repositories/care_plan.py)

Database operations:
- `get_care_plan(plant_id) -> CarePlan | None`
- `save_care_plan(plant_id, plan: CarePlan)`
- `delete_care_plan(plant_id)`

### Error Handling

Handle gracefully:
- LLM API errors (rate limit, auth, timeout)
- Invalid JSON response from LLM
- Missing plant data
- LLM not configured

### Tests (backend/tests/test_care_plan.py)

Test cases:
- Generate care plan with mock LLM
- Parse LLM JSON response correctly
- Save and retrieve care plan
- Handle LLM error gracefully
- Return 503 when LLM not configured

## Definition of Done

- [ ] `POST /api/plants/{id}/analyze` generates care plan
- [ ] Care plan stored in database
- [ ] `GET /api/plants/{id}/care-plan` returns stored plan
- [ ] Works with both Anthropic and OpenAI
- [ ] Graceful error handling
- [ ] All tests pass

## Constraints

- Do NOT call real LLM APIs in tests
- Cache care plans (don't regenerate on every request)
- Handle LLM timeout (30 second max)
- Return 503 if LLM not configured

## Dependencies

Add to pyproject.toml:
- `anthropic>=0.18.0`
- `openai>=1.10.0`
- `cryptography>=41.0.0`  # For Fernet
