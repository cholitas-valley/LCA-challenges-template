import { useState, useEffect } from 'react';
import { Layout, LoadingSpinner, ErrorMessage, EmptyState, PlantCard, CreatePlantModal } from '../components';
import { usePlants } from '../hooks';

export function Dashboard() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { data, isLoading, isError, error, refetch } = usePlants();

  // Auto-refresh every 10 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      refetch();
    }, 10000);

    return () => clearInterval(interval);
  }, [refetch]);

  return (
    <Layout>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <button
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
          >
            <span className="mr-2">+</span>
            Add Plant
          </button>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="bg-white rounded-lg shadow p-8">
            <LoadingSpinner />
          </div>
        )}

        {/* Error State */}
        {isError && (
          <div className="bg-white rounded-lg shadow p-8">
            <ErrorMessage
              message={error?.message || 'Failed to load plants'}
              onRetry={() => refetch()}
            />
          </div>
        )}

        {/* Empty State */}
        {!isLoading && !isError && data?.plants.length === 0 && (
          <div className="bg-white rounded-lg shadow p-8">
            <EmptyState
              title="No plants yet"
              description="Get started by adding your first plant to monitor."
              action={{
                label: 'Add Plant',
                onClick: () => setIsModalOpen(true),
              }}
            />
          </div>
        )}

        {/* Plant Grid */}
        {!isLoading && !isError && data && data.plants.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {data.plants.map((plant) => (
              <PlantCard key={plant.id} plant={plant} />
            ))}
          </div>
        )}

        {/* Create Plant Modal */}
        <CreatePlantModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
        />
      </div>
    </Layout>
  );
}
