import { usePlants } from '../api/queries';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { PlantCard } from '../components/PlantCard';
import { PlantCardSkeleton } from '../components/PlantCardSkeleton';

export function Dashboard() {
  const { data: plants, isLoading, isError, error, refetch } = usePlants();

  if (isLoading) {
    return (
      <div>
        <h2 className="text-2xl font-bold text-gray-800 mb-6">Your Plants</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <PlantCardSkeleton />
          <PlantCardSkeleton />
          <PlantCardSkeleton />
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <AlertCircle className="w-12 h-12 text-red-500" />
        <p className="mt-4 text-gray-800 font-semibold">Error loading plants</p>
        <p className="text-gray-600 text-sm mt-2">
          {error instanceof Error ? error.message : 'Unknown error'}
        </p>
        <button
          onClick={() => refetch()}
          className="mt-4 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors flex items-center space-x-2"
        >
          <RefreshCw className="w-4 h-4" />
          <span>Retry</span>
        </button>
      </div>
    );
  }

  const plantCount = plants ? plants.length : 0;

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-800 mb-6">
        Your Plants ({plantCount})
      </h2>

      {plants && plants.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {plants.map((plant) => (
            <PlantCard key={plant.id} plant={plant} />
          ))}
        </div>
      ) : (
        <div className="text-center py-12 bg-white rounded-lg shadow">
          <p className="text-gray-600">No plants found</p>
        </div>
      )}
    </div>
  );
}
