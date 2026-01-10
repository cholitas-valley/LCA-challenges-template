import { useParams, Link } from 'react-router-dom';
import {
  Layout,
  LoadingSpinner,
  ErrorMessage,
  CarePlanDisplay,
} from '../components';
import { Button } from '../components/ui/Button';
import {
  usePlant,
  useCarePlan,
  useGenerateCarePlan,
} from '../hooks';

export function PlantCare() {
  const { id } = useParams<{ id: string }>();

  const { data: plant, isLoading: plantLoading, error: plantError } = usePlant(id!);
  const { data: carePlanData, isLoading: carePlanLoading, error: carePlanError } = useCarePlan(id!);
  const generateMutation = useGenerateCarePlan();

  if (plantLoading || carePlanLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <LoadingSpinner />
        </div>
      </Layout>
    );
  }

  if (plantError || !plant) {
    return (
      <Layout>
        <ErrorMessage message="Failed to load plant details" />
      </Layout>
    );
  }

  const handleGenerate = async () => {
    try {
      await generateMutation.mutateAsync(id!);
    } catch (error) {
      // Error will be shown via mutation error state
    }
  };

  const isLLMNotConfigured = carePlanError &&
    (carePlanError as Error).message.includes('LLM not configured');

  return (
    <Layout>
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <Link to="/" className="text-action-primary hover:text-action-primary-hover text-sm font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-action-primary rounded">
            Dashboard
          </Link>
          <span className="text-gray-500 mx-2">/</span>
          <Link to="/plants" className="text-action-primary hover:text-action-primary-hover text-sm font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-action-primary rounded">
            Plants
          </Link>
          <span className="text-gray-500 mx-2">/</span>
          <Link to={`/plants/${id}`} className="text-action-primary hover:text-action-primary-hover text-sm font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-action-primary rounded">
            {plant.name}
          </Link>
          <span className="text-gray-500 mx-2">/</span>
          <span className="text-gray-900 text-sm font-medium">Care</span>
        </div>

        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-900">{plant.name}</h1>
              {plant.species && (
                <p className="text-gray-600 mt-1">Species: {plant.species}</p>
              )}
            </div>
            <Link
              to={`/plants/${id}`}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-400"
            >
              Back to Details
            </Link>
          </div>
        </div>

        {isLLMNotConfigured && (
          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-yellow-700">
                  LLM is not configured. Please{' '}
                  <Link to="/settings" className="font-medium underline text-yellow-700 hover:text-yellow-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500 rounded">
                    configure your LLM settings
                  </Link>
                  {' '}to generate care plans.
                </p>
              </div>
            </div>
          </div>
        )}

        {generateMutation.error && !isLLMNotConfigured && (
          <div className="bg-status-error-light border-l-4 border-status-error p-4 mb-6">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-status-error" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-status-error-text">
                  Error generating care plan: {(generateMutation.error as Error).message}
                </p>
                <button
                  onClick={handleGenerate}
                  className="mt-2 text-sm font-medium text-status-error-text underline hover:text-status-error focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-status-error rounded"
                >
                  Try again
                </button>
              </div>
            </div>
          </div>
        )}

        {generateMutation.isPending && (
          <div className="bg-status-info-light border-l-4 border-status-info p-4 mb-6">
            <div className="flex">
              <div className="flex-shrink-0">
                <LoadingSpinner />
              </div>
              <div className="ml-3">
                <p className="text-sm text-status-info-text">
                  Generating care plan... This may take up to 30 seconds.
                </p>
              </div>
            </div>
          </div>
        )}

        {carePlanData?.care_plan ? (
          <CarePlanDisplay
            carePlan={carePlanData.care_plan}
            onRegenerate={handleGenerate}
            isRegenerating={generateMutation.isPending}
          />
        ) : !isLLMNotConfigured && !generateMutation.isPending && (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <svg
              className="mx-auto h-12 w-12 text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
              />
            </svg>
            <h3 className="mt-4 text-lg font-medium text-gray-900">No Care Plan Yet</h3>
            <p className="mt-2 text-sm text-gray-500 max-w-md mx-auto">
              Generate an AI-powered care plan based on your plant's current conditions and sensor data.
              The AI will analyze your plant's health and provide personalized recommendations.
            </p>
            <Button
              variant="primary"
              size="lg"
              onClick={handleGenerate}
              disabled={!!isLLMNotConfigured}
              className="mt-6"
            >
              Generate Care Plan
            </Button>
            {isLLMNotConfigured && (
              <p className="mt-2 text-xs text-gray-500">
                Configure LLM settings first
              </p>
            )}
          </div>
        )}
      </div>
    </Layout>
  );
}
