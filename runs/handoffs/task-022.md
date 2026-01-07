# Task 022 Handoff: Care Plan Generation

## Summary

Successfully implemented LLM-powered care plan generation that analyzes plant sensor data and provides personalized care recommendations. The system supports both Anthropic (Claude) and OpenAI (GPT) providers, with proper error handling, timeout protection, and comprehensive test coverage.

## Files Created

1. `/home/genge/dev-ash/foundry-nodevenv/cholitas/challenge-001-plantops/backend/src/models/care_plan.py`
   - CarePlanWatering model - watering frequency, amount, next date
   - CarePlanMetric model - current value, ideal range, recommendation
   - CarePlan model - complete care plan with summary, metrics, alerts, tips
   - CarePlanResponse model - API response wrapper

2. `/home/genge/dev-ash/foundry-nodevenv/cholitas/challenge-001-plantops/backend/src/services/llm.py`
   - LLMService class - unified interface for LLM providers
   - generate_care_plan() method - generates care plan from plant data
   - Support for Anthropic and OpenAI providers
   - System prompt building with plant context
   - JSON response parsing (handles markdown wrapping)
   - 30-second timeout protection
   - Error handling for API failures

3. `/home/genge/dev-ash/foundry-nodevenv/cholitas/challenge-001-plantops/backend/src/repositories/care_plan.py`
   - get_care_plan() - retrieve stored care plan for a plant
   - save_care_plan() - save/update care plan (upsert)
   - delete_care_plan() - remove care plan

4. `/home/genge/dev-ash/foundry-nodevenv/cholitas/challenge-001-plantops/backend/tests/test_care_plan.py`
   - 10 comprehensive tests covering all scenarios
   - Mock LLM calls (no real API usage)
   - Test generate, save, retrieve operations
   - Test error handling (plant not found, LLM not configured, timeout)
   - Test both Anthropic and OpenAI providers
   - Test JSON parsing with various formats

## Files Modified

1. `/home/genge/dev-ash/foundry-nodevenv/cholitas/challenge-001-plantops/backend/pyproject.toml`
   - Added anthropic>=0.18.0 dependency
   - Added openai>=1.10.0 dependency

2. `/home/genge/dev-ash/foundry-nodevenv/cholitas/challenge-001-plantops/backend/src/models/__init__.py`
   - Added exports for CarePlan, CarePlanWatering, CarePlanMetric, CarePlanResponse

3. `/home/genge/dev-ash/foundry-nodevenv/cholitas/challenge-001-plantops/backend/src/repositories/__init__.py`
   - Added care_plan repository to exports

4. `/home/genge/dev-ash/foundry-nodevenv/cholitas/challenge-001-plantops/backend/src/routers/plants.py`
   - Added POST /api/plants/{id}/analyze endpoint
   - Added GET /api/plants/{id}/care-plan endpoint
   - Integrated LLM service and care plan repository
   - Added encryption service for decrypting LLM API keys
   - Calculate 24-hour history statistics for LLM context

## API Endpoints

### POST /api/plants/{plant_id}/analyze

**Purpose:** Generate a new care plan using LLM

**Process:**
1. Validates plant exists
2. Retrieves and decrypts LLM configuration
3. Gathers current sensor readings
4. Calculates 24-hour history statistics (avg, min, max)
5. Builds context prompt with plant data
6. Calls LLM API (with 30s timeout)
7. Parses JSON response
8. Saves care plan to database
9. Returns care plan

**Request:** None (POST to URL)

**Response:**
```json
{
  "plant_id": "uuid",
  "plant_name": "Snake Plant",
  "species": "Sansevieria trifasciata",
  "care_plan": {
    "summary": "Your Snake Plant is healthy...",
    "watering": {
      "frequency": "Every 2-3 weeks",
      "amount": "Water until it drains from bottom",
      "next_date": "2026-01-25"
    },
    "light": {
      "current": 500,
      "ideal": "Bright indirect light (500-1000 lux)",
      "recommendation": "Current light level is adequate."
    },
    "humidity": {
      "current": 55.0,
      "ideal": "40-60%",
      "recommendation": "Humidity is perfect."
    },
    "temperature": {
      "current": 22.5,
      "ideal": "18-30°C",
      "recommendation": "Temperature is in optimal range."
    },
    "alerts": [],
    "tips": [
      "Snake plants prefer to dry out between waterings",
      "Tolerates low light but grows better in bright indirect light"
    ],
    "generated_at": "2026-01-08T12:00:00"
  },
  "last_generated": "2026-01-08T12:00:00"
}
```

**Error Responses:**
- 404: Plant not found
- 503: LLM not configured, API error, or timeout

### GET /api/plants/{plant_id}/care-plan

**Purpose:** Retrieve stored care plan

**Response:** Same format as analyze endpoint, but care_plan may be null if no plan exists

**Error Responses:**
- 404: Plant not found

## LLM Integration Details

### Prompt Structure

The LLM receives:
- Plant name and species
- Current sensor readings (soil moisture, temperature, humidity, light level)
- 24-hour trends (average, min, max for each metric)
- Configured thresholds
- JSON schema for response format

### Supported Providers

**Anthropic:**
- Default model: claude-sonnet-4-20250514
- Uses AsyncAnthropic client
- Extracts text from message.content[0].text

**OpenAI:**
- Default model: gpt-4o
- Uses AsyncOpenAI client
- Extracts text from response.choices[0].message.content

### JSON Parsing

Handles three response formats:
1. Clean JSON
2. Markdown-wrapped: \`\`\`json...```
3. Generic code block: \`\`\`...```

Strips formatting and parses valid JSON.

## Database Schema

Uses existing care_plans table from migration 006:
```sql
CREATE TABLE care_plans (
    id SERIAL PRIMARY KEY,
    plant_id TEXT REFERENCES plants(id) ON DELETE CASCADE UNIQUE,
    plan_data JSONB NOT NULL,
    generated_at TIMESTAMPTZ DEFAULT NOW()
)
```

Care plan JSON stored in plan_data, generated_at stored separately for query efficiency.

## Error Handling

**Plant Not Found (404):**
- Returns immediately if plant doesn't exist

**LLM Not Configured (503):**
- Checks if llm_config setting exists
- Returns user-friendly message to configure LLM first

**Decryption Failure (503):**
- Catches encryption errors
- Returns error without exposing sensitive data

**LLM Timeout (503):**
- 30-second timeout on LLM API calls
- Returns timeout message to user

**LLM API Error (503):**
- Catches all LLM exceptions
- Returns generic failure message

## Test Coverage

All 10 tests pass:

1. **test_generate_care_plan_success** - Full successful flow
2. **test_generate_care_plan_plant_not_found** - 404 handling
3. **test_generate_care_plan_llm_not_configured** - 503 when no LLM config
4. **test_generate_care_plan_llm_timeout** - Timeout handling
5. **test_get_care_plan_exists** - Retrieve existing plan
6. **test_get_care_plan_not_exists** - Null when no plan
7. **test_get_care_plan_plant_not_found** - 404 handling
8. **test_llm_service_parse_json_response** - JSON parsing variants
9. **test_llm_service_invalid_provider** - Provider validation
10. **test_llm_service_openai_provider** - OpenAI initialization

## How to Verify

Run the care plan tests:
```bash
export DATABASE_URL="postgresql://test:test@localhost/testdb"
export MQTT_BACKEND_PASSWORD="testpass"
export ENCRYPTION_KEY="test-encryption-key-32-chars!"
export MQTT_PASSWD_FILE="/tmp/mosquitto_passwd"

python3 -m pytest /home/genge/dev-ash/foundry-nodevenv/cholitas/challenge-001-plantops/backend/tests/test_care_plan.py -v --tb=short
```

Expected output: 10 passed

## Dependencies Added

- anthropic>=0.18.0 - Anthropic Python SDK for Claude API
- openai>=1.10.0 - OpenAI Python SDK for GPT API

Both dependencies installed and working.

## Definition of Done - Status

- [x] POST /api/plants/{id}/analyze generates care plan - DONE
- [x] Care plan stored in database - DONE
- [x] GET /api/plants/{id}/care-plan returns stored plan - DONE
- [x] Works with both Anthropic and OpenAI - DONE
- [x] Graceful error handling - DONE (404, 503 with specific messages)
- [x] All tests pass - DONE (10/10)

## Integration Points

**Requires:**
- LLM settings configured via PUT /api/settings/llm (task-021)
- Plant exists in database
- Encryption key in environment (ENCRYPTION_KEY)
- Optional: telemetry data for better recommendations

**Provides:**
- Care plan generation API for frontend
- Care plan retrieval API for displaying recommendations
- LLM service that can be reused for other features

## Security Considerations

1. **API Key Protection:**
   - API keys decrypted only in memory, never logged
   - Encryption service handles key decryption securely
   - Keys never exposed in API responses

2. **Error Messages:**
   - Generic error messages to avoid leaking system details
   - Specific errors only for expected scenarios (plant not found, LLM not configured)

3. **Timeout Protection:**
   - 30-second timeout prevents hanging requests
   - Prevents denial of service from slow LLM responses

## Known Limitations

1. **No Caching:** Each analyze request makes a new LLM call (can be expensive)
2. **No Rate Limiting:** No protection against rapid analyze requests
3. **Single Plan Per Plant:** Only stores most recent care plan
4. **No History:** Doesn't track previous care plans
5. **No User Context:** All users see same plan for a plant (multi-tenant limitation)

## Risks & Follow-ups

**Risks:**
- LLM API costs can accumulate with frequent analyze requests
- LLM responses may not always be valid JSON
- Network issues with LLM providers affect availability

**Recommended Follow-ups:**
1. Add caching - don't regenerate plan if recent one exists (e.g., < 24 hours old)
2. Add rate limiting on analyze endpoint (e.g., 1 request per plant per hour)
3. Add care plan history tracking for trends
4. Add user preferences to customize recommendations
5. Add validation of LLM response against schema before saving
6. Add retry logic for transient LLM API failures
7. Monitor LLM API costs and usage

## Files for Next Task

The next task (LLM conversation interface) will need:
- LLMService class for chat-style interactions
- Care plan data as context for conversations
- Similar error handling patterns

All necessary LLM integration patterns are established in this task.
