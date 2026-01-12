# Task 021 Handoff: LLM Settings API

## Summary

Successfully implemented the LLM settings API for managing LLM provider configuration (Anthropic and OpenAI). Users can now store their own API keys securely with encryption at rest, test the API keys, and retrieve masked configuration.

## Files Created

1. `/home/genge/dev-ash/foundry-nodevenv/cholitas/challenge-001-plantops/backend/src/models/settings.py`
   - LLMProvider enum (ANTHROPIC, OPENAI)
   - LLMSettingsUpdate request model
   - LLMSettingsResponse response model
   - LLMTestResponse test result model

2. `/home/genge/dev-ash/foundry-nodevenv/cholitas/challenge-001-plantops/backend/src/services/encryption.py`
   - EncryptionService class using Fernet symmetric encryption
   - encrypt() method - encrypts plaintext strings to base64
   - decrypt() method - decrypts ciphertext (handles both str and bytes input)
   - Automatic key format handling (plain 32-char string or base64 URL-safe)

3. `/home/genge/dev-ash/foundry-nodevenv/cholitas/challenge-001-plantops/backend/src/repositories/settings.py`
   - get_setting() - retrieve setting value by key
   - set_setting() - insert or update setting (upsert)
   - delete_setting() - remove setting by key
   - get_setting_with_timestamp() - retrieve value with updated_at timestamp

4. `/home/genge/dev-ash/foundry-nodevenv/cholitas/challenge-001-plantops/backend/src/routers/settings.py`
   - GET /api/settings/llm - returns current LLM config with masked API key
   - PUT /api/settings/llm - stores encrypted API key and provider config
   - POST /api/settings/llm/test - validates API key with actual provider
   - Default models: claude-sonnet-4-20250514 (Anthropic), gpt-4o (OpenAI)
   - API key masking (shows only last 4 chars: "...abc123")

5. `/home/genge/dev-ash/foundry-nodevenv/cholitas/challenge-001-plantops/backend/tests/test_llm_settings.py`
   - 11 tests covering all endpoints and edge cases
   - Encryption roundtrip validation
   - API key masking verification
   - Provider validation (rejects invalid providers)
   - Test endpoint mocking for Anthropic and OpenAI APIs
   - Timeout handling tests

## Files Modified

1. `/home/genge/dev-ash/foundry-nodevenv/cholitas/challenge-001-plantops/backend/src/models/__init__.py`
   - Added exports for LLMProvider, LLMSettingsUpdate, LLMSettingsResponse, LLMTestResponse

2. `/home/genge/dev-ash/foundry-nodevenv/cholitas/challenge-001-plantops/backend/src/repositories/__init__.py`
   - Added settings repository to exports

3. `/home/genge/dev-ash/foundry-nodevenv/cholitas/challenge-001-plantops/backend/src/main.py`
   - Imported settings router
   - Added settings router to app (app.include_router(settings_router.router))

## API Endpoints

### GET /api/settings/llm
**Returns:** Current LLM configuration
- If not configured: returns defaults (Anthropic, no API key)
- If configured: returns provider, model, api_key_set=true, masked key ("...abc123")
- Response includes updated_at timestamp when available

**Example Response:**
```json
{
  "provider": "anthropic",
  "model": "claude-sonnet-4-20250514",
  "api_key_set": true,
  "api_key_masked": "...2345",
  "updated_at": "2026-01-07T23:45:00Z"
}
```

### PUT /api/settings/llm
**Request:** LLM provider and API key
- Required: provider, api_key
- Optional: model (defaults to provider's default model)
- API key is encrypted using Fernet before storage
- Stored in settings table with key "llm_config" as encrypted JSON

**Example Request:**
```json
{
  "provider": "anthropic",
  "api_key": "sk-ant-api....",
  "model": "claude-sonnet-4-20250514"
}
```

**Example Response:**
```json
{
  "provider": "anthropic",
  "model": "claude-sonnet-4-20250514",
  "api_key_set": true,
  "api_key_masked": "...2345",
  "updated_at": "2026-01-07T23:45:00Z"
}
```

### POST /api/settings/llm/test
**Request:** LLM provider and API key (does NOT store)
- Tests API key by making minimal API call to provider
- Returns success/failure with latency timing
- Timeout after 10 seconds

**Example Request:**
```json
{
  "provider": "anthropic",
  "api_key": "sk-ant-test..."
}
```

**Example Response (success):**
```json
{
  "success": true,
  "message": "Anthropic API key is valid",
  "latency_ms": 342
}
```

**Example Response (failure):**
```json
{
  "success": false,
  "message": "Invalid API key",
  "latency_ms": 156
}
```

## Security Features

1. **Encryption at Rest**
   - API keys stored as encrypted JSON in database
   - Uses Fernet symmetric encryption (AES-128 in CBC mode with HMAC)
   - Encryption key from ENCRYPTION_KEY environment variable

2. **API Key Masking**
   - API keys never returned in full from GET endpoint
   - Only last 4 characters shown (e.g., "...2345")
   - Full key only visible during initial PUT request response

3. **No Logging**
   - API keys never logged to application logs
   - Encryption errors logged without exposing keys

## Database Schema

Uses existing `settings` table created in migration 005:
```sql
CREATE TABLE settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW()
)
```

LLM config stored as:
- key: "llm_config"
- value: Encrypted JSON containing {provider, model, api_key}

## Default Models

- **Anthropic:** claude-sonnet-4-20250514
- **OpenAI:** gpt-4o

## Test Coverage

All 11 tests pass:
1. test_encryption_roundtrip - Verifies encrypt/decrypt works correctly
2. test_get_llm_settings_returns_data - GET endpoint returns valid response
3. test_update_llm_settings - PUT endpoint stores settings correctly
4. test_get_llm_settings_masking - Verifies API key masking
5. test_update_llm_settings_default_model - Defaults work when model not provided
6. test_test_llm_settings_anthropic_success - Test endpoint with valid Anthropic key
7. test_test_llm_settings_anthropic_invalid - Test endpoint with invalid Anthropic key
8. test_test_llm_settings_openai_success - Test endpoint with valid OpenAI key
9. test_test_llm_settings_timeout - Test endpoint handles timeout correctly
10. test_invalid_provider - Rejects invalid provider (422 validation error)
11. test_api_key_masking - Standalone function test for key masking

## How to Verify

Run the LLM settings tests:
```bash
cd /home/genge/dev-ash/foundry-nodevenv/cholitas/challenge-001-plantops/backend
python3 -m pytest tests/test_llm_settings.py -v
```

Expected output: 11 passed

## Definition of Done - Status

- [x] GET /api/settings/llm returns configuration (masked key) - DONE
- [x] PUT /api/settings/llm stores encrypted API key - DONE
- [x] POST /api/settings/llm/test validates API key - DONE
- [x] API key never stored or logged in plaintext - DONE
- [x] Default models set for each provider - DONE
- [x] All tests pass - DONE (11/11)

## Integration Points

**Frontend Integration:**
The frontend can now:
1. Display current LLM provider and model in settings UI
2. Allow users to input their own Anthropic or OpenAI API keys
3. Test API keys before saving (optional)
4. Show visual indicator when API key is configured (api_key_set)
5. Display masked API key for security awareness

**Next Features:**
This API is a prerequisite for the LLM Care Advisor features (tasks 022-024):
- Care plan generation will use stored API key
- Conversation interface will use stored provider/model
- Care insights will use configured LLM

## Environment Variables Required

- `ENCRYPTION_KEY` - 32-character string for Fernet encryption (already in .env.test)

## Dependencies Added

None - uses existing dependencies:
- `cryptography` (already installed for Fernet)
- `httpx` (already installed for async HTTP)
- `fastapi`, `pydantic` (already installed)

## Known Limitations

1. **No Key Rotation:** Once encrypted, changing ENCRYPTION_KEY will make existing settings unreadable
2. **Single Key Storage:** Only one API key per provider can be stored (not multi-user)
3. **Test Endpoint Rate Limits:** Real API calls to providers may hit rate limits if called frequently
4. **No Key Validation Format:** Doesn't validate API key format before storing (relies on test endpoint)

## Risks & Follow-ups

**Risks:**
- If ENCRYPTION_KEY is lost/changed, all stored API keys become unrecoverable
- Test endpoint makes real API calls (could incur costs or rate limits)

**Recommended Follow-ups:**
1. Add key rotation mechanism for ENCRYPTION_KEY changes
2. Add audit logging for API key changes (who/when, not the key itself)
3. Consider storing separate keys per user in multi-tenant scenarios
4. Add validation for API key format patterns before storage
5. Add rate limiting on test endpoint to prevent abuse

## Files for Next Task

The next task (Care Plans API) will need:
- Access to stored LLM configuration via GET /api/settings/llm
- EncryptionService for decrypting API keys when making LLM calls
- LLMProvider enum for determining which API to call

All necessary interfaces are exported from models and services packages.
