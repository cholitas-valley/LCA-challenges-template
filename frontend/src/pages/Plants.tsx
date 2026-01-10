import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Layout, LoadingSpinner, ErrorMessage, EmptyState, CreatePlantModal } from '../components';
import { Button } from '../components/ui';
import { usePlants, useDeletePlant } from '../hooks';

export function Plants() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { data, isLoading, isError, error, refetch } = usePlants();
  const deleteMutation = useDeletePlant();

  useEffect(() => {
    const interval = setInterval(() => {
      refetch();
    }, 10000);
    return () => clearInterval(interval);
  }, [refetch]);

  const handleDelete = async (plantId: string, plantName: string) => {
    if (confirm(`Are you sure you want to delete "${plantName}"?`)) {
      try {
        await deleteMutation.mutateAsync(plantId);
      } catch (error) {
        // Error handled by mutation
      }
    }
  };

  return (
    <Layout>
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Plants</h1>
          <Button variant="primary" onClick={() => setIsModalOpen(true)}>
            <span className="mr-2">+</span>
            Add Plant
          </Button>
        </div>

        {isLoading && (
          <div className="bg-white rounded-lg shadow p-8">
            <LoadingSpinner />
          </div>
        )}

        {isError && (
          <div className="bg-white rounded-lg shadow p-8">
            <ErrorMessage
              message={error?.message || 'Failed to load plants'}
              onRetry={() => refetch()}
            />
          </div>
        )}

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

        {!isLoading && !isError && data && data.plants.length > 0 && (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Species
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Devices
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Created
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {data.plants.map((plant) => (
                  <tr key={plant.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Link
                        to={`/plants/${plant.id}`}
                        className="text-action-primary hover:text-action-primary-hover font-medium"
                      >
                        {plant.name}
                      </Link>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-500">
                      {plant.species || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-500">
                      {plant.device_count}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-500">
                      {new Date(plant.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className="flex justify-end gap-2">
                        <Link
                          to={`/plants/${plant.id}`}
                          className="inline-flex items-center justify-center px-3 py-1.5 text-sm font-medium rounded-md text-action-ghost-text bg-action-ghost hover:bg-action-ghost-hover transition-colors"
                        >
                          View
                        </Link>
                        <Button
                          variant="danger"
                          size="sm"
                          onClick={() => handleDelete(plant.id, plant.name)}
                          disabled={deleteMutation.isPending}
                        >
                          Delete
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <CreatePlantModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
        />
      </div>
    </Layout>
  );
}
