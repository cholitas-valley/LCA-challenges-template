import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Layout, LoadingSpinner, ErrorMessage, EmptyState, CreatePlantModal } from '../components';
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
          <button
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
          >
            <span className="mr-2">+</span>
            Add Plant
          </button>
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
                        className="text-green-600 hover:text-green-800 font-medium"
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
                      <Link
                        to={`/plants/${plant.id}`}
                        className="text-gray-600 hover:text-gray-900 mr-4"
                      >
                        View
                      </Link>
                      <button
                        onClick={() => handleDelete(plant.id, plant.name)}
                        disabled={deleteMutation.isPending}
                        className="text-red-600 hover:text-red-800 disabled:opacity-50"
                      >
                        Delete
                      </button>
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
