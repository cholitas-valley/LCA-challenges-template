import { useState } from 'react';
import { Layout } from '../components/Layout';
import { ErrorMessage } from '../components/ErrorMessage';
import { EmptyState } from '../components/EmptyState';
import { DeviceTable } from '../components/DeviceTable';
import { RegisterDeviceModal } from '../components/RegisterDeviceModal';
import { Button, FilterPills, SkeletonTable } from '../components/ui';
import type { FilterOption } from '../components/ui';
import { useDevices, useProvisionDevice, useDeleteDevice } from '../hooks';

type StatusFilter = 'all' | 'online' | 'offline' | 'unassigned';

export function Devices() {
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
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
          <Button variant="primary" onClick={() => setIsModalOpen(true)}>
            <span className="mr-2">+</span>
            Register Device
          </Button>
        </div>

        {isLoading && <SkeletonTable rows={5} columns={6} />}

        {isError && (
          <ErrorMessage
            message="Failed to load devices"
            onRetry={refetch}
          />
        )}

        {!isLoading && !isError && data && (
          <>
            <div className="mb-6">
              <FilterPills<StatusFilter>
                options={[
                  { value: 'all', label: 'All', count: data.devices.length },
                  { value: 'online', label: 'Online', count: data.devices.filter(d => d.status === 'online').length },
                  { value: 'offline', label: 'Offline', count: data.devices.filter(d => d.status === 'offline').length },
                  { value: 'unassigned', label: 'Unassigned', count: data.devices.filter(d => d.plant_id === null).length },
                ] as FilterOption<StatusFilter>[]}
                value={statusFilter}
                onChange={setStatusFilter}
              />
            </div>

            {filteredDevices && filteredDevices.length === 0 ? (
              <EmptyState
                title={statusFilter === 'all' ? 'No devices registered' : 'No devices match this filter'}
                description={statusFilter === 'all' ? 'Register your first device to start monitoring.' : undefined}
                action={statusFilter === 'all' ? { label: 'Register Device', onClick: () => setIsModalOpen(true) } : { label: 'Clear Filter', onClick: () => setStatusFilter('all') }}
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

        <RegisterDeviceModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
        />
      </div>
    </Layout>
  );
}
