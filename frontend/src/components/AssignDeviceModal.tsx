import { useState, useEffect } from 'react';
import { usePlants, useProvisionDevice } from '../hooks';
import { Button } from './ui/Button';
import type { Device } from '../types';

interface AssignDeviceModalProps {
  isOpen: boolean;
  onClose: () => void;
  device: Device | null;
}

export function AssignDeviceModal({ isOpen, onClose, device }: AssignDeviceModalProps) {
  const [selectedPlantId, setSelectedPlantId] = useState<string>('');
  const { data: plantsData, isLoading: plantsLoading } = usePlants();
  const provisionMutation = useProvisionDevice();

  useEffect(() => {
    if (device?.plant_id) {
      setSelectedPlantId(device.plant_id);
    } else {
      setSelectedPlantId('');
    }
  }, [device]);

  if (!isOpen || !device) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPlantId) return;

    try {
      await provisionMutation.mutateAsync({
        deviceId: device.id,
        data: { plant_id: selectedPlantId },
      });
      onClose();
      setSelectedPlantId('');
    } catch (error) {
      // Error is handled by mutation
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-xl font-bold text-gray-900 mb-4">
          {device.plant_id ? 'Reassign Device' : 'Assign Device to Plant'}
        </h2>
        
        <div className="mb-4 p-3 bg-gray-50 rounded">
          <p className="text-sm text-gray-600">Device ID:</p>
          <p className="font-mono text-sm">{device.id.substring(0, 8)}...</p>
          <p className="text-sm text-gray-600 mt-2">MAC Address:</p>
          <p className="font-mono text-sm">{device.mac_address}</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="plant" className="block text-sm font-medium text-gray-700 mb-2">
              Select Plant *
            </label>
            {plantsLoading ? (
              <p className="text-gray-500">Loading plants...</p>
            ) : (
              <select
                id="plant"
                value={selectedPlantId}
                onChange={(e) => setSelectedPlantId(e.target.value)}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-action-primary"
              >
                <option value="">-- Select a plant --</option>
                {plantsData?.plants.map((plant) => (
                  <option key={plant.id} value={plant.id}>
                    {plant.name} {plant.species ? `(${plant.species})` : ''}
                  </option>
                ))}
              </select>
            )}
          </div>

          {provisionMutation.isError && (
            <div className="mb-4 p-3 bg-status-error-light border border-status-error rounded text-status-error-text text-sm">
              Failed to assign device. Please try again.
            </div>
          )}

          <div className="flex justify-end gap-3">
            <Button
              type="button"
              variant="secondary"
              onClick={onClose}
              disabled={provisionMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={!selectedPlantId}
              loading={provisionMutation.isPending}
            >
              {provisionMutation.isPending ? 'Assigning...' : 'Assign Device'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
