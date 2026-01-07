import type { LLMSettingsResponse, LLMSettingsUpdate, LLMTestResponse } from '../types';

const API_BASE = '/api';

async function fetchApi<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
    ...options,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.detail || `HTTP ${response.status}`);
  }

  return response.json();
}

export const settingsApi = {
  getLLM: () => fetchApi<LLMSettingsResponse>('/settings/llm'),
  updateLLM: (data: LLMSettingsUpdate) =>
    fetchApi<LLMSettingsResponse>('/settings/llm', {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  testLLM: (data: LLMSettingsUpdate) =>
    fetchApi<LLMTestResponse>('/settings/llm/test', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
};
