# Feature 2: LLM Care Advisor

## Overview

Feature 2 adds AI-powered care plan generation using user-provided LLM API keys. Users can configure Anthropic Claude or OpenAI GPT, then generate personalized care recommendations based on plant species and real-time sensor data.

**Status:** Complete and validated (21 automated tests passing)

### Capabilities

1. **LLM Settings Management** - Secure API key storage with encryption at rest
2. **Care Plan Generation** - AI analyzes plant data and generates actionable recommendations
3. **Settings UI** - Configure provider, model, and API key with test functionality
4. **Care Pages** - View care plans with watering schedules, light/humidity/temperature guidance
5. **Multi-Provider Support** - Works with Anthropic Claude and OpenAI GPT

## How It Works

1. User configures LLM provider in Settings page (`/settings`)
2. API key is encrypted and stored in database
3. User navigates to plant care page (`/plants/{id}/care`)
4. User clicks "Generate Care Plan" button
5. Backend retrieves plant data and 24-hour telemetry trends
6. LLM analyzes data and returns structured care plan
7. Care plan saved to database and displayed to user
8. User can regenerate plan anytime for updated recommendations

## Configuring LLM Providers

### Anthropic (Claude)

1. Get API key from https://console.anthropic.com
2. Navigate to Settings in PlantOps
3. Select "Anthropic" provider
4. Enter API key (starts with `sk-ant-`)
5. Choose model (default: `claude-sonnet-4-20250514`)
6. Click "Test Connection" to validate
7. Click "Save Settings"

**Supported Models:**
- `claude-sonnet-4-20250514` (default, recommended)
- `claude-3-5-sonnet`
- `claude-3-5-haiku`

### OpenAI (GPT)

1. Get API key from https://platform.openai.com/api-keys
2. Navigate to Settings in PlantOps
3. Select "OpenAI" provider
4. Enter API key (starts with `sk-`)
5. Choose model (default: `gpt-4o`)
6. Click "Test Connection" to validate
7. Click "Save Settings"

**Supported Models:**
- `gpt-4o` (default, recommended)
- `gpt-4o-mini`
- `gpt-4-turbo`

## API Endpoints

### LLM Settings
| Method | Path | Purpose |
|--------|------|---------|
| GET | `/api/settings/llm` | Get current LLM config (masked key) |
| PUT | `/api/settings/llm` | Update LLM config |
| POST | `/api/settings/llm/test` | Test API key validity |

### Care Plans
| Method | Path | Purpose |
|--------|------|---------|
| POST | `/api/plants/{id}/analyze` | Generate new care plan |
| GET | `/api/plants/{id}/care-plan` | Retrieve stored care plan |

## API Examples

### Update LLM Settings

```bash
curl -X PUT http://localhost:8000/api/settings/llm \
  -H "Content-Type: application/json" \
  -d '{
    "provider": "anthropic",
    "api_key": "sk-ant-api03-...",
    "model": "claude-sonnet-4-20250514"
  }'
```

**Response:**
```json
{
  "provider": "anthropic",
  "model": "claude-sonnet-4-20250514",
  "api_key_set": true,
  "api_key_masked": "...xyz123",
  "updated_at": "2026-01-08T12:00:00Z"
}
```

### Generate Care Plan

```bash
curl -X POST http://localhost:8000/api/plants/plant-001/analyze
```

**Response:**
```json
{
  "plant_id": "plant-001",
  "plant_name": "Snake Plant",
  "species": "Sansevieria trifasciata",
  "care_plan": {
    "summary": "Your Snake Plant is healthy with optimal conditions.",
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
    "generated_at": "2026-01-08T12:00:00Z"
  },
  "last_generated": "2026-01-08T12:00:00Z"
}
```

## Security Features

### Encryption at Rest
- API keys encrypted using Fernet (AES-128 CBC with HMAC)
- Encryption key from `ENCRYPTION_KEY` environment variable
- Keys never stored or logged in plaintext

### API Key Masking
- GET endpoint returns only last 4 characters (e.g., `...xyz123`)
- Full key visible only during initial save response
- UI uses password-type input fields

### Error Handling
- Generic error messages to avoid leaking system details
- API keys never included in error logs or responses
- 30-second timeout prevents hanging requests

## Environment Variables

```bash
# Required for Feature 2
ENCRYPTION_KEY=your-32-character-encryption-key-here

# Optional (LLM configuration stored in database)
```

**Generate encryption key:**
```bash
python3 -c 'from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())'
```

## Database Schema

```sql
-- LLM configuration stored as encrypted JSON
CREATE TABLE settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Care plans for each plant
CREATE TABLE care_plans (
    id SERIAL PRIMARY KEY,
    plant_id TEXT REFERENCES plants(id) ON DELETE CASCADE UNIQUE,
    plan_data JSONB NOT NULL,
    generated_at TIMESTAMPTZ DEFAULT NOW()
);
```

## Test Coverage

- 11 tests for LLM Settings API (encryption, masking, provider validation)
- 10 tests for Care Plan API (generation, storage, error handling)
- All tests mock LLM calls (no real API usage during testing)
- Frontend builds successfully with TypeScript strict mode

**Run tests:**
```bash
# Backend only
cd backend && python3 -m pytest tests/test_llm_settings.py tests/test_care_plan.py -v

# Full validation
make check
```

## Using the Care Plan Feature

1. **Configure LLM** (first time only)
   - Navigate to Settings (`/settings`)
   - Choose provider (Anthropic or OpenAI)
   - Enter your API key
   - Test connection
   - Save settings

2. **Generate Care Plan**
   - Navigate to a plant detail page
   - Click "View Care Plan" button
   - Click "Generate Care Plan" button
   - Wait 5-30 seconds for AI analysis
   - View personalized recommendations

3. **Regenerate Plan**
   - Click "Regenerate" button on care page
   - Updated plan replaces previous one
   - Useful after changing thresholds or species

## Known Limitations

1. **Single User** - One set of LLM credentials for entire system
2. **No Caching** - Each analyze request makes new LLM API call (can be expensive)
3. **No History** - Only most recent care plan stored per plant
4. **No Rate Limiting** - Users can regenerate plans repeatedly
5. **Key Rotation** - Changing `ENCRYPTION_KEY` makes existing settings unreadable

## Cost Considerations

LLM API calls incur costs based on provider pricing:

**Anthropic Claude:**
- Sonnet 4: ~$3 per 1M input tokens, ~$15 per 1M output tokens
- Typical care plan: ~500 input tokens, ~300 output tokens
- Estimated cost: ~$0.006 per care plan

**OpenAI GPT:**
- GPT-4o: ~$2.50 per 1M input tokens, ~$10 per 1M output tokens
- Typical care plan: ~500 input tokens, ~300 output tokens
- Estimated cost: ~$0.004 per care plan

**Recommendation:** Cache care plans and refresh only when needed (not on every page load).

## Troubleshooting

### "LLM not configured" error
- Navigate to Settings and configure API key
- Ensure provider and API key are saved
- Test connection to validate key

### "LLM timeout" error
- LLM API took longer than 30 seconds
- Retry generation
- Check network connectivity

### "Invalid API key" error
- API key is incorrect or expired
- Update key in Settings
- Use Test Connection button to verify

### Encryption errors
- `ENCRYPTION_KEY` environment variable not set
- `ENCRYPTION_KEY` changed after saving settings (data unrecoverable)
- Set correct key and restart backend

## What's Next

Potential future enhancements:
- Care plan caching (refresh only when data changes significantly)
- Care plan history tracking
- Conversational interface for plant care questions
- Automated care plan scheduling
- Multi-user support with per-user API keys
