import { useState } from 'react';
import { X, Loader2, AlertCircle } from 'lucide-react';
import { PlantWithTelemetry } from '../api/types';
import { usePlantHistory } from '../api/queries';
import { transformTelemetryForChart } from '../utils/chartData';
import { TimeRangeSelector } from './TimeRangeSelector';
import { HistoryChart } from './HistoryChart';
import { EmptyChartState } from './EmptyChartState';

interface PlantHistoryModalProps {
  plant: PlantWithTelemetry;
  isOpen: boolean;
  onClose: () => void;
}

export function PlantHistoryModal({ plant, isOpen, onClose }: PlantHistoryModalProps) {
  const [selectedHours, setSelectedHours] = useState(24);
  const { data: historyData, isLoading, error } = usePlantHistory(plant.id, selectedHours);

  if (!isOpen) return null;

  const chartData = historyData ? transformTelemetryForChart(historyData.data) : [];
  const hasData = chartData.length > 0;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col" data-testid="history-modal">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">{plant.name}</h2>
            <p className="text-sm text-gray-500 mt-1">Telemetry History</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            aria-label="Close modal"
            data-testid="close-button"
          >
            <X className="w-6 h-6 text-gray-600" />
          </button>
        </div>

        {/* Time Range Selector */}
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700">Time Range:</span>
            <TimeRangeSelector selected={selectedHours} onChange={setSelectedHours} />
          </div>
        </div>

        {/* Charts Container */}
        <div className="flex-1 overflow-y-auto px-6 py-6">
          {isLoading && (
            <div className="flex flex-col items-center justify-center py-20">
              <Loader2 className="w-12 h-12 text-green-600 animate-spin mb-4" />
              <p className="text-gray-600">Loading telemetry data...</p>
            </div>
          )}

          {error && (
            <div className="flex flex-col items-center justify-center py-20">
              <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
              <p className="text-lg text-gray-700 font-medium mb-2">Failed to load history</p>
              <p className="text-sm text-gray-500">{error instanceof Error ? error.message : 'An error occurred'}</p>
            </div>
          )}

          {!isLoading && !error && !hasData && <EmptyChartState />}

          {!isLoading && !error && hasData && (
            <div className="space-y-6">
              {/* Soil Moisture Chart */}
              <HistoryChart
                data={chartData}
                metricKey="soil_moisture"
                unit="%"
                thresholdMin={plant.soil_moisture_min}
                thresholdMax={plant.soil_moisture_max}
                label="Soil Moisture"
              />

              {/* Light Chart */}
              <HistoryChart
                data={chartData}
                metricKey="light"
                unit="lux"
                thresholdMin={plant.light_min}
                label="Light Level"
              />

              {/* Temperature Chart */}
              <HistoryChart
                data={chartData}
                metricKey="temperature"
                unit="°C"
                thresholdMin={plant.temperature_min}
                thresholdMax={plant.temperature_max}
                label="Temperature"
              />
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
          <div className="flex justify-between items-center">
            <p className="text-xs text-gray-500">
              {hasData && historyData && (
                <>Showing {chartData.length} data points over {selectedHours} hour{selectedHours !== 1 ? 's' : ''}</>
              )}
            </p>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-md text-sm font-medium transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
