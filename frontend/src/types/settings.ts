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
