import { useState } from 'react';
import { usePlants } from '../hooks';
import type { Device } from '../types';
import { AssignDeviceModal } from './AssignDeviceModal';
import { ConfirmDialog } from './ConfirmDialog';
import { Button, StatusBadge } from './ui';
import type { StatusType } from './ui';

interface DeviceTableProps {
  devices: Device[];
  onUnassign: (deviceId: string) => void;
  onDelete: (deviceId: string) => void;
  isUnassigning: boolean;
  isDeleting: boolean;
}

export function DeviceTable({ devices, onUnassign, onDelete, isUnassigning, isDeleting }: DeviceTableProps) {
  const [assignDevice, setAssignDevice] = useState<Device | null>(null);
  const [unassignDevice, setUnassignDevice] = useState<Device | null>(null);
  const [deleteDevice, setDeleteDevice] = useState<Device | null>(null);
  const { data: plantsData } = usePlants();

  const getPlantName = (plantId: string | null) => {
    if (!plantId) return 'Unassigned';
    const plant = plantsData?.plants.find((p) => p.id === plantId);
    return plant ? plant.name : 'Unknown';
  };

  const formatLastSeen = (lastSeenAt: string | null) => {
    if (!lastSeenAt) return 'Never';
    
    const date = new Date(lastSeenAt);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHour = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHour / 24);

    if (diffSec < 60) return diffSec + ' sec ago';
    if (diffMin < 60) return diffMin + ' min ago';
    if (diffHour < 24) return diffHour + ' hr ago';
    return diffDay + ' day' + (diffDay !== 1 ? 's' : '') + ' ago';
  };

  const handleUnassignConfirm = () => {
    if (unassignDevice) {
      onUnassign(unassignDevice.id);
      setUnassignDevice(null);
    }
  };

  const handleDeleteConfirm = () => {
    if (deleteDevice) {
      onDelete(deleteDevice.id);
      setDeleteDevice(null);
    }
  };

  return (
    <>
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Device ID
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                MAC Address
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Plant
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Last Seen
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {devices.map((device) => (
              <tr key={device.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <StatusBadge status={device.status as StatusType} />
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="text-sm font-mono text-gray-900">{device.id.substring(0, 8)}...</span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="text-sm font-mono text-gray-900">{device.mac_address}</span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={'text-sm ' + (device.plant_id ? 'text-gray-900' : 'text-gray-400 italic')}>
                    {getPlantName(device.plant_id)}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="text-sm text-gray-500">{formatLastSeen(device.last_seen_at)}</span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex gap-2">
                    <Button variant="ghost" size="sm" onClick={() => setAssignDevice(device)}>
                      {device.plant_id ? 'Reassign' : 'Assign'}
                    </Button>
                    {device.plant_id && (
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => setUnassignDevice(device)}
                        disabled={isUnassigning}
                      >
                        Unassign
                      </Button>
                    )}
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => setDeleteDevice(device)}
                      disabled={isDeleting}
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

      <AssignDeviceModal
        isOpen={assignDevice !== null}
        onClose={() => setAssignDevice(null)}
        device={assignDevice}
      />

      <ConfirmDialog
        isOpen={unassignDevice !== null}
        onClose={() => setUnassignDevice(null)}
        onConfirm={handleUnassignConfirm}
        title="Unassign Device"
        message={'Are you sure you want to unassign this device from ' + getPlantName(unassignDevice?.plant_id ?? null) + '?'}
        confirmText="Unassign"
        variant="primary"
        isLoading={isUnassigning}
      />

      <ConfirmDialog
        isOpen={deleteDevice !== null}
        onClose={() => setDeleteDevice(null)}
        onConfirm={handleDeleteConfirm}
        title="Delete Device"
        message="Are you sure you want to delete this device? This action cannot be undone."
        confirmText="Delete"
        variant="danger"
        isLoading={isDeleting}
      />
    </>
  );
}
