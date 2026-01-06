import { memo, useState } from 'react';
import { Droplet, Sun, Thermometer, Settings, AlertTriangle, TrendingUp } from 'lucide-react';
import { PlantWithTelemetry } from '../api/types';
import { calculatePlantStatus } from '../utils/plantStatus';
import { formatTimestamp } from '../utils/dateTime';
import { TelemetryDisplay } from './TelemetryDisplay';
import { ThresholdConfigModal } from './ThresholdConfigModal';
import { PlantHistoryModal } from './PlantHistoryModal';

interface PlantCardProps {
  plant: PlantWithTelemetry;
}

export const PlantCard = memo(function PlantCard({ plant }: PlantCardProps) {
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const status = calculatePlantStatus(plant);
  const telemetry = plant.latest_telemetry;

  // Status badge colors
  const statusConfig = {
    healthy: {
      bg: 'bg-green-100',
      text: 'text-green-800',
      label: 'Healthy',
    },
    warning: {
      bg: 'bg-yellow-100',
      text: 'text-yellow-800',
      label: 'Warning',
    },
    critical: {
      bg: 'bg-red-100',
      text: 'text-red-800',
      label: 'Critical',
    },
    unknown: {
      bg: 'bg-gray-100',
      text: 'text-gray-800',
      label: 'No Data',
    },
  };

  const { bg, text, label } = statusConfig[status];

  return (
    <>
      <div className="bg-white shadow rounded-lg p-6 hover:shadow-lg transition-shadow" data-testid="plant-card">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <h3 className="text-xl font-bold text-gray-800">{plant.name}</h3>
            {status === 'unknown' && (
              <p className="text-sm text-gray-500 mt-1 flex items-center">
                <AlertTriangle className="w-4 h-4 mr-1" />
                No recent telemetry data
              </p>
            )}
          </div>
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${bg} ${text}`} data-testid="status-badge">
            {label}
          </span>
        </div>

        {/* Telemetry Display */}
        {telemetry ? (
          <div className="grid grid-cols-3 gap-3 mb-4">
            <TelemetryDisplay
              value={telemetry.soil_moisture}
              unit="%"
              icon={Droplet}
              threshold_min={plant.soil_moisture_min}
              threshold_max={plant.soil_moisture_max}
              label="Soil Moisture"
            />
            <TelemetryDisplay
              value={telemetry.light}
              unit=" lux"
              icon={Sun}
              threshold_min={plant.light_min}
              label="Light"
            />
            <TelemetryDisplay
              value={telemetry.temperature}
              unit="°C"
              icon={Thermometer}
              threshold_min={plant.temperature_min}
              threshold_max={plant.temperature_max}
              label="Temperature"
            />
          </div>
        ) : (
          <div className="bg-gray-50 rounded-lg p-6 mb-4 text-center">
            <p className="text-gray-500">Waiting for sensor data...</p>
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between pt-4 border-t">
          <div className="text-xs text-gray-500" data-testid="last-updated">
            {telemetry ? (
              <>Last updated {formatTimestamp(telemetry.timestamp)}</>
            ) : (
              <>No data available</>
            )}
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setIsHistoryModalOpen(true)}
              className="flex items-center space-x-2 px-3 py-2 text-sm bg-green-600 hover:bg-green-700 text-white rounded-md transition-colors"
              data-testid="view-history-button"
            >
              <TrendingUp className="w-4 h-4" />
              <span>View History</span>
            </button>
            <button
              onClick={() => setIsConfigModalOpen(true)}
              className="flex items-center space-x-2 px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md transition-colors"
              data-testid="configure-button"
            >
              <Settings className="w-4 h-4" />
              <span>Configure</span>
            </button>
          </div>
        </div>
      </div>

      {/* Config Modal */}
      <ThresholdConfigModal
        plant={plant}
        isOpen={isConfigModalOpen}
        onClose={() => setIsConfigModalOpen(false)}
      />

      {/* History Modal */}
      <PlantHistoryModal
        plant={plant}
        isOpen={isHistoryModalOpen}
        onClose={() => setIsHistoryModalOpen(false)}
      />
    </>
  );
});
