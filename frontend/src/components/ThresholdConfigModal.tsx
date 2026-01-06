import { useState, useEffect } from 'react';
import { X, Loader2 } from 'lucide-react';
import { PlantWithTelemetry, PlantConfigUpdate } from '../api/types';
import { useUpdatePlantConfig } from '../api/queries';

interface ThresholdConfigModalProps {
  plant: PlantWithTelemetry;
  isOpen: boolean;
  onClose: () => void;
}

export function ThresholdConfigModal({ plant, isOpen, onClose }: ThresholdConfigModalProps) {
  const updateConfig = useUpdatePlantConfig();
  
  const [formData, setFormData] = useState<PlantConfigUpdate>({
    soil_moisture_min: plant.soil_moisture_min,
    soil_moisture_max: plant.soil_moisture_max,
    light_min: plant.light_min,
    temperature_min: plant.temperature_min,
    temperature_max: plant.temperature_max,
    alert_cooldown_minutes: plant.alert_cooldown_minutes,
  });

  // Reset form when plant changes
  useEffect(() => {
    setFormData({
      soil_moisture_min: plant.soil_moisture_min,
      soil_moisture_max: plant.soil_moisture_max,
      light_min: plant.light_min,
      temperature_min: plant.temperature_min,
      temperature_max: plant.temperature_max,
      alert_cooldown_minutes: plant.alert_cooldown_minutes,
    });
  }, [plant]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      await updateConfig.mutateAsync({ plantId: plant.id, config: formData });
      onClose();
    } catch (error) {
      console.error('Failed to update config:', error);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto" data-testid="threshold-config-modal">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-bold text-gray-800">
            Configure Thresholds: {plant.name}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            disabled={updateConfig.isPending}
            data-testid="close-button"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Soil Moisture */}
          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-3">Soil Moisture (%)</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Minimum
                </label>
                <input
                  type="number"
                  name="soil_moisture_min"
                  min="0"
                  max="100"
                  value={formData.soil_moisture_min}
                  onChange={(e) => setFormData({ ...formData, soil_moisture_min: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Maximum
                </label>
                <input
                  type="number"
                  name="soil_moisture_max"
                  min="0"
                  max="100"
                  value={formData.soil_moisture_max}
                  onChange={(e) => setFormData({ ...formData, soil_moisture_max: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  required
                />
              </div>
            </div>
          </div>

          {/* Light Level */}
          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-3">Light Level (lux)</h3>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Minimum
              </label>
              <input
                type="number"
                name="light_min"
                min="0"
                max="1000"
                value={formData.light_min}
                onChange={(e) => setFormData({ ...formData, light_min: parseInt(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                required
              />
            </div>
          </div>

          {/* Temperature */}
          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-3">Temperature (°C)</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Minimum
                </label>
                <input
                  type="number"
                  name="temperature_min"
                  min="-50"
                  max="100"
                  step="0.1"
                  value={formData.temperature_min}
                  onChange={(e) => setFormData({ ...formData, temperature_min: parseFloat(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Maximum
                </label>
                <input
                  type="number"
                  name="temperature_max"
                  min="-50"
                  max="100"
                  step="0.1"
                  value={formData.temperature_max}
                  onChange={(e) => setFormData({ ...formData, temperature_max: parseFloat(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  required
                />
              </div>
            </div>
          </div>

          {/* Alert Cooldown */}
          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-3">Alert Cooldown</h3>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Cooldown Period (minutes)
              </label>
              <input
                type="number"
                name="alert_cooldown_minutes"
                min="1"
                max="1440"
                value={formData.alert_cooldown_minutes}
                onChange={(e) => setFormData({ ...formData, alert_cooldown_minutes: parseInt(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                required
              />
              <p className="mt-1 text-sm text-gray-500">
                Minimum time between alerts for this plant
              </p>
            </div>
          </div>

          {/* Error Message */}
          {updateConfig.isError && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-800">
                Failed to update configuration. Please try again.
              </p>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-end space-x-3 pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
              disabled={updateConfig.isPending}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={updateConfig.isPending}
              data-testid="save-button"
            >
              {updateConfig.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
              <span>{updateConfig.isPending ? 'Saving...' : 'Save Changes'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
