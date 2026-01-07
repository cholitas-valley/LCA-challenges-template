import { Layout } from '../components/Layout';
import { LLMSettings } from '../components/LLMSettings';

export function Settings() {
  return (
    <Layout>
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Settings</h1>
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">LLM Configuration</h2>
            <p className="mt-1 text-sm text-gray-500">Configure your language model settings for the plant care advisor.</p>
          </div>
          <div className="p-6">
            <LLMSettings />
          </div>
        </div>
      </div>
    </Layout>
  );
}
