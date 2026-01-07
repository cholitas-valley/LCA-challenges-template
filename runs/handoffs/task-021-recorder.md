# Recorder: task-021

## Changes Summary

Implemented LLM Settings API for Anthropic/OpenAI provider configuration with encrypted API key storage.

## Key Files

- `backend/src/models/settings.py`: LLMProvider enum, request/response models
- `backend/src/services/encryption.py`: Fernet encryption service
- `backend/src/repositories/settings.py`: Settings DB operations
- `backend/src/routers/settings.py`: GET/PUT/POST /api/settings/llm endpoints
- `backend/tests/test_llm_settings.py`: 11 tests

## Interfaces for Next Task

### Endpoints
```
GET  /api/settings/llm       - Get current config (masked key)
PUT  /api/settings/llm       - Update provider/key
POST /api/settings/llm/test  - Test API key validity
```

### Request Models
```python
class LLMSettingsUpdate(BaseModel):
    provider: LLMProvider  # "anthropic" | "openai"
    api_key: str
    model: str | None = None
```

### Response Models
```python
class LLMSettingsResponse(BaseModel):
    provider: LLMProvider
    model: str
    api_key_set: bool
    api_key_masked: str | None  # "...xxxx"
    updated_at: datetime | None
```

### Default Models
- Anthropic: claude-sonnet-4-20250514
- OpenAI: gpt-4o

## Notes

- API keys encrypted at rest with Fernet (AES-128)
- ENCRYPTION_KEY required in environment
- 10s timeout for API key testing
