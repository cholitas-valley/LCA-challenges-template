# Recorder: task-023

## Changes Summary

Implemented Settings UI for LLM provider configuration with API key management, model selection, and test functionality.

## Key Files

- `frontend/src/types/settings.ts`: LLMProvider, LLMSettingsResponse, LLMSettingsUpdate, LLMTestResponse
- `frontend/src/api/settings.ts`: settingsApi with getLLM, updateLLM, testLLM
- `frontend/src/hooks/useSettings.ts`: useLLMSettings, useUpdateLLMSettings, useTestLLMSettings
- `frontend/src/components/LLMSettings.tsx`: Settings form component
- `frontend/src/pages/Settings.tsx`: Updated with LLMSettings integration

## Interfaces for Next Task

### Settings API
```typescript
import { settingsApi } from '../api/settings';
const settings = await settingsApi.getLLM();
await settingsApi.updateLLM({ provider: 'anthropic', api_key: '...', model: 'claude-sonnet-4-20250514' });
const result = await settingsApi.testLLM();
```

### Settings Hooks
```typescript
import { useLLMSettings, useUpdateLLMSettings, useTestLLMSettings } from '../hooks';
const { data: settings, isLoading } = useLLMSettings();
const updateSettings = useUpdateLLMSettings();
const testSettings = useTestLLMSettings();
```

### Available Models
- Anthropic: claude-sonnet-4-20250514, claude-3-5-haiku-20241022
- OpenAI: gpt-4o, gpt-4o-mini

## Notes

- API key masked in display, password input type
- Keys cleared after save for security
- Test button validates with backend
- Success/error feedback messages
