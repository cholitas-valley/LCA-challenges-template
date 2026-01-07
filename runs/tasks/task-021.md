---
task_id: task-021
title: LLM settings API
role: lca-backend
follow_roles: []
post:
  - lca-recorder
  - lca-gitops
depends_on:
  - task-020
inputs:
  - objective.md
  - runs/plan.md
  - runs/handoffs/task-020.md
allowed_paths:
  - backend/**
check_command: cd backend && python -m pytest tests/test_llm_settings.py -v --tb=short
handoff: runs/handoffs/task-021.md
---

# Task 021: LLM Settings API

## Goal

Implement the API for storing and managing LLM provider configuration. Users can set their own API keys for Anthropic or OpenAI.

## Requirements

### Models (backend/src/models/settings.py)

```python
class LLMProvider(str, Enum):
    ANTHROPIC = "anthropic"
    OPENAI = "openai"

class LLMSettingsUpdate(BaseModel):
    provider: LLMProvider
    api_key: str
    model: str | None = None  # Default based on provider

class LLMSettingsResponse(BaseModel):
    provider: LLMProvider
    model: str
    api_key_set: bool  # True if key is configured
    api_key_masked: str | None  # Last 4 chars only, e.g., "...abc123"
    updated_at: datetime | None

class LLMTestResponse(BaseModel):
    success: bool
    message: str
    latency_ms: int | None = None
```

### Settings Router (backend/src/routers/settings.py)

Endpoints:

**GET /api/settings/llm**
- Return current LLM configuration
- API key is masked (show only last 4 chars)
- Return defaults if not configured

**PUT /api/settings/llm**
- Update LLM provider and API key
- Encrypt API key before storing
- Validate provider is supported

**POST /api/settings/llm/test**
- Test API key by making a simple call
- Return success/failure with timing
- Don't store the result

### Encryption Service (backend/src/services/encryption.py)

```python
class EncryptionService:
    def __init__(self, key: str):
        # Use Fernet symmetric encryption
        self.fernet = Fernet(key)
    
    def encrypt(self, plaintext: str) -> str:
        """Encrypt string and return base64 encoded ciphertext."""
        
    def decrypt(self, ciphertext: str) -> str:
        """Decrypt base64 encoded ciphertext."""
```

Use ENCRYPTION_KEY from environment for symmetric encryption.

### Settings Repository (backend/src/repositories/settings.py)

Database operations:
- `get_setting(key: str) -> str | None`
- `set_setting(key: str, value: str) -> None`
- `delete_setting(key: str) -> None`

Store LLM config as JSON in settings table:
- Key: `llm_config`
- Value: Encrypted JSON with provider, model, api_key

### Default Models

- Anthropic: `claude-sonnet-4-20250514`
- OpenAI: `gpt-4o`

### Tests (backend/tests/test_llm_settings.py)

Test cases:
- Get settings returns empty/defaults when not configured
- Update settings stores encrypted API key
- Get settings returns masked API key
- Test endpoint validates key with mock
- Invalid provider returns 400
- Encryption/decryption roundtrip works

## Definition of Done

- [ ] `GET /api/settings/llm` returns configuration (masked key)
- [ ] `PUT /api/settings/llm` stores encrypted API key
- [ ] `POST /api/settings/llm/test` validates API key
- [ ] API key never stored or logged in plaintext
- [ ] Default models set for each provider
- [ ] All tests pass

## Constraints

- API key must be encrypted at rest
- Never log API keys
- Test endpoint should be quick (timeout after 10s)
- Support only Anthropic and OpenAI for now
