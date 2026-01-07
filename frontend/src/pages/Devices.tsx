import { useState } from 'react';
import { Layout } from '../components/Layout';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { ErrorMessage } from '../components/ErrorMessage';
import { EmptyState } from '../components/EmptyState';
import { DeviceTable } from '../components/DeviceTable';
import { useDevices, useProvisionDevice, useDeleteDevice } from '../hooks';

type StatusFilter = 'all' | 'online' | 'offline' | 'unassigned';

export function Devices() {
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const { data, isLoading, isError, refetch } = useDevices();
  const provisionMutation = useProvisionDevice();
  const deleteMutation = useDeleteDevice();

  const handleUnassign = async (deviceId: string) => {
    try {
      await provisionMutation.mutateAsync({
        deviceId,
        data: { plant_id: '' },
      });
    } catch (error) {
      // Error handled by mutation
    }
  };

  const handleDelete = async (deviceId: string) => {
    try {
      await deleteMutation.mutateAsync(deviceId);
    } catch (error) {
      // Error handled by mutation
    }
  };

  const filteredDevices = data?.devices.filter((device) => {
    switch (statusFilter) {
      case 'online':
        return device.status === 'online';
      case 'offline':
        return device.status === 'offline';
      case 'unassigned':
        return device.plant_id === null;
      default:
        return true;
    }
  });

  return (
    <Layout>
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Devices</h1>
        </div>

        {isLoading && <LoadingSpinner />}

        {isError && (
          <ErrorMessage
            message="Failed to load devices"
            onRetry={refetch}
          />
        )}

        {!isLoading && !isError && data && (
          <>
            <div className="mb-6 flex gap-2">
              <button
                onClick={() => setStatusFilter('all')}
                className={'px-4 py-2 rounded-md font-medium transition-colors ' + (statusFilter === 'all' ? 'bg-green-600 text-white' : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50')}
              >
                All ({data.devices.length})
              </button>
              <button
                onClick={() => setStatusFilter('online')}
                className={'px-4 py-2 rounded-md font-medium transition-colors ' + (statusFilter === 'online' ? 'bg-green-600 text-white' : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50')}
              >
                Online ({data.devices.filter(d => d.status === 'online').length})
              </button>
              <button
                onClick={() => setStatusFilter('offline')}
                className={'px-4 py-2 rounded-md font-medium transition-colors ' + (statusFilter === 'offline' ? 'bg-green-600 text-white' : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50')}
              >
                Offline ({data.devices.filter(d => d.status === 'offline').length})
              </button>
              <button
                onClick={() => setStatusFilter('unassigned')}
                className={'px-4 py-2 rounded-md font-medium transition-colors ' + (statusFilter === 'unassigned' ? 'bg-green-600 text-white' : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50')}
              >
                Unassigned ({data.devices.filter(d => d.plant_id === null).length})
              </button>
            </div>

            {filteredDevices && filteredDevices.length === 0 ? (
              <EmptyState
                title={statusFilter === 'all' ? 'No devices registered' : 'No devices match this filter'}
                action={statusFilter === 'all' ? undefined : { label: 'Clear Filter', onClick: () => setStatusFilter('all') }}
              />
            ) : (
              <div className="bg-white rounded-lg shadow">
                <DeviceTable
                  devices={filteredDevices || []}
                  onUnassign={handleUnassign}
                  onDelete={handleDelete}
                  isUnassigning={provisionMutation.isPending}
                  isDeleting={deleteMutation.isPending}
                />
              </div>
            )}
          </>
        )}
      </div>
    </Layout>
  );
}
