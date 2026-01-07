import { useState, useEffect } from 'react';
import { useLLMSettings, useUpdateLLMSettings, useTestLLMSettings } from '../hooks';
import { LoadingSpinner } from './LoadingSpinner';
import { ErrorMessage } from './ErrorMessage';
import type { LLMProvider } from '../types';

const ANTHROPIC_MODELS = [
  { value: 'claude-sonnet-4-20250514', label: 'Claude Sonnet 4 (Latest)' },
  { value: 'claude-3-5-haiku-20241022', label: 'Claude 3.5 Haiku' },
  { value: 'claude-3-5-sonnet-20241022', label: 'Claude 3.5 Sonnet' },
];

const OPENAI_MODELS = [
  { value: 'gpt-4o', label: 'GPT-4o' },
  { value: 'gpt-4o-mini', label: 'GPT-4o Mini' },
  { value: 'gpt-4-turbo', label: 'GPT-4 Turbo' },
];

export function LLMSettings() {
  const { data: settings, isLoading, error, refetch } = useLLMSettings();
  const updateMutation = useUpdateLLMSettings();
  const testMutation = useTestLLMSettings();

  const [provider, setProvider] = useState<LLMProvider>('anthropic');
  const [apiKey, setApiKey] = useState('');
  const [model, setModel] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Update form state when settings load
  useEffect(() => {
    if (settings) {
      setProvider(settings.provider);
      setModel(settings.model);
    }
  }, [settings]);

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return <ErrorMessage message={error.message} onRetry={() => refetch()} />;
  }

  const currentModels = provider === 'anthropic' ? ANTHROPIC_MODELS : OPENAI_MODELS;
  const selectedModel = model || currentModels[0].value;

  const handleProviderChange = (newProvider: LLMProvider) => {
    setProvider(newProvider);
    // Reset model to default for new provider
    const defaultModel = newProvider === 'anthropic' 
      ? ANTHROPIC_MODELS[0].value 
      : OPENAI_MODELS[0].value;
    setModel(defaultModel);
  };

  const handleSave = async () => {
    if (!apiKey.trim()) {
      setErrorMsg('API key is required');
      setSuccessMessage('');
      return;
    }

    try {
      await updateMutation.mutateAsync({
        provider,
        api_key: apiKey,
        model: selectedModel,
      });
      setSuccessMessage('Settings saved successfully!');
      setErrorMsg('');
      setApiKey(''); // Clear API key input after save
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to save settings');
      setSuccessMessage('');
    }
  };

  const handleTest = async () => {
    if (!apiKey.trim()) {
      setErrorMsg('API key is required for testing');
      setSuccessMessage('');
      return;
    }

    try {
      const result = await testMutation.mutateAsync({
        provider,
        api_key: apiKey,
        model: selectedModel,
      });
      
      if (result.success) {
        const latencyText = result.latency_ms ? ` (${result.latency_ms}ms)` : '';
        setSuccessMessage(`${result.message}${latencyText}`);
        setErrorMsg('');
      } else {
        setErrorMsg(result.message);
        setSuccessMessage('');
      }
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to test API key');
      setSuccessMessage('');
    }
  };

  return (
    <div className="space-y-6">
      {/* Provider Selection */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          LLM Provider
        </label>
        <div className="space-y-2">
          <label className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
            <input
              type="radio"
              name="provider"
              value="anthropic"
              checked={provider === 'anthropic'}
              onChange={() => handleProviderChange('anthropic')}
              className="h-4 w-4 text-green-600 focus:ring-green-500"
            />
            <div className="ml-3">
              <span className="block text-sm font-medium text-gray-900">Anthropic</span>
              <span className="block text-sm text-gray-500">Claude AI models</span>
            </div>
          </label>
          <label className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
            <input
              type="radio"
              name="provider"
              value="openai"
              checked={provider === 'openai'}
              onChange={() => handleProviderChange('openai')}
              className="h-4 w-4 text-green-600 focus:ring-green-500"
            />
            <div className="ml-3">
              <span className="block text-sm font-medium text-gray-900">OpenAI</span>
              <span className="block text-sm text-gray-500">GPT models</span>
            </div>
          </label>
        </div>
      </div>

      {/* Current Status */}
      {settings && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <h3 className="text-sm font-medium text-gray-900 mb-2">Current Configuration</h3>
          <dl className="space-y-1 text-sm">
            <div className="flex justify-between">
              <dt className="text-gray-500">Provider:</dt>
              <dd className="text-gray-900 font-medium capitalize">{settings.provider}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-500">Model:</dt>
              <dd className="text-gray-900 font-medium">{settings.model}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-500">API Key:</dt>
              <dd className="text-gray-900">
                {settings.api_key_set ? (
                  <span className="font-mono">{settings.api_key_masked}</span>
                ) : (
                  <span className="text-red-600">Not configured</span>
                )}
              </dd>
            </div>
            {settings.updated_at && (
              <div className="flex justify-between">
                <dt className="text-gray-500">Last Updated:</dt>
                <dd className="text-gray-900">
                  {new Date(settings.updated_at).toLocaleString()}
                </dd>
              </div>
            )}
          </dl>
        </div>
      )}

      {/* Model Selection */}
      <div>
        <label htmlFor="model" className="block text-sm font-medium text-gray-700 mb-2">
          Model
        </label>
        <select
          id="model"
          value={selectedModel}
          onChange={(e) => setModel(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
        >
          {currentModels.map((m) => (
            <option key={m.value} value={m.value}>
              {m.label}
            </option>
          ))}
        </select>
      </div>

      {/* API Key Input */}
      <div>
        <label htmlFor="apiKey" className="block text-sm font-medium text-gray-700 mb-2">
          API Key
        </label>
        <input
          id="apiKey"
          type="password"
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
          placeholder={settings?.api_key_set ? 'Enter new API key to update' : 'Enter your API key'}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
        />
        <p className="mt-1 text-sm text-gray-500">
          Your API key is encrypted and stored securely. It will never be shown in full.
        </p>
      </div>

      {/* Success/Error Messages */}
      {successMessage && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-start">
            <svg
              className="w-5 h-5 text-green-600 mt-0.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
            <p className="ml-3 text-sm text-green-700">{successMessage}</p>
          </div>
        </div>
      )}

      {errorMsg && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-start">
            <svg
              className="w-5 h-5 text-red-600 mt-0.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <p className="ml-3 text-sm text-red-700">{errorMsg}</p>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex space-x-3 pt-4">
        <button
          onClick={handleTest}
          disabled={testMutation.isPending || !apiKey.trim()}
          className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {testMutation.isPending ? 'Testing...' : 'Test Connection'}
        </button>
        <button
          onClick={handleSave}
          disabled={updateMutation.isPending || !apiKey.trim()}
          className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {updateMutation.isPending ? 'Saving...' : 'Save Settings'}
        </button>
      </div>
    </div>
  );
}
