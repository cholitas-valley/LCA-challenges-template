---
task_id: task-023
title: Settings UI
role: lca-frontend
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
  - frontend/**
check_command: cd frontend && npm run build
handoff: runs/handoffs/task-023.md
---

# Task 023: Settings UI

## Goal

Implement the settings page where users configure their LLM provider and API key.

## Requirements

### Settings Page (frontend/src/pages/Settings.tsx)

Sections:
1. LLM Configuration
2. (Future: Other settings)

### LLM Settings Component (frontend/src/components/LLMSettings.tsx)

```typescript
export function LLMSettings() {
  // Fetch current settings
  // Display form for updating
  // Test button for validation
}
```

### Form Fields

**Provider Selection:**
- Radio or dropdown
- Options: Anthropic, OpenAI
- Description for each provider

**API Key Input:**
- Password-style input (masked)
- Show current status (configured/not configured)
- If configured, show masked value (last 4 chars)

**Model Selection:**
- Dropdown based on provider
- Anthropic: claude-sonnet-4-20250514, claude-3-5-haiku, etc.
- OpenAI: gpt-4o, gpt-4o-mini, etc.

### Actions

**Save Button:**
- Submit form to `PUT /api/settings/llm`
- Show success/error message
- Clear API key field after save

**Test Button:**
- Call `POST /api/settings/llm/test`
- Show loading spinner
- Display success or error message
- Show latency if successful

### API Hooks (frontend/src/hooks/useSettings.ts)

```typescript
export function useLLMSettings() {
  return useQuery({
    queryKey: ['settings', 'llm'],
    queryFn: settingsApi.getLLM,
  });
}

export function useUpdateLLMSettings() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: settingsApi.updateLLM,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings', 'llm'] });
    },
  });
}

export function useTestLLMSettings() {
  return useMutation({
    mutationFn: settingsApi.testLLM,
  });
}
```

### API Client (frontend/src/api/settings.ts)

```typescript
export const settingsApi = {
  getLLM: () => fetchApi<LLMSettingsResponse>('/settings/llm'),
  updateLLM: (data: LLMSettingsUpdate) =>
    fetchApi<LLMSettingsResponse>('/settings/llm', {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  testLLM: () =>
    fetchApi<LLMTestResponse>('/settings/llm/test', {
      method: 'POST',
    }),
};
```

### Types (frontend/src/types/settings.ts)

```typescript
export type LLMProvider = 'anthropic' | 'openai';

export interface LLMSettingsResponse {
  provider: LLMProvider;
  model: string;
  api_key_set: boolean;
  api_key_masked: string | null;
  updated_at: string | null;
}

export interface LLMSettingsUpdate {
  provider: LLMProvider;
  api_key: string;
  model?: string;
}

export interface LLMTestResponse {
  success: boolean;
  message: string;
  latency_ms: number | null;
}
```

### Visual Design

- Clear section headers
- Helpful descriptions/tooltips
- Visual feedback on save (toast notification)
- Error states clearly visible

## Definition of Done

- [ ] Settings page renders
- [ ] Can select LLM provider
- [ ] Can enter API key
- [ ] Can select model
- [ ] Save updates settings via API
- [ ] Test button validates API key
- [ ] Success/error messages shown
- [ ] Build passes

## Constraints

- API key should never be shown in full
- Clear feedback on all actions
- Handle API errors gracefully
- Keep form simple and intuitive
