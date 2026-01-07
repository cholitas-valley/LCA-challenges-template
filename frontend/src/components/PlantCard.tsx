import { Link } from 'react-router-dom';
import { Plant } from '../types';
import { SensorReading } from './SensorReading';

interface PlantCardProps {
  plant: Plant;
}

type PlantStatus = 'healthy' | 'warning' | 'critical';

function calculatePlantStatus(plant: Plant): PlantStatus {
  const { latest_telemetry, thresholds } = plant;

  if (!latest_telemetry || !thresholds) {
    return 'healthy'; // default if no data
  }

  const sensors = [
    {
      value: latest_telemetry.soil_moisture,
      threshold: thresholds.soil_moisture,
    },
    {
      value: latest_telemetry.temperature,
      threshold: thresholds.temperature,
    },
    {
      value: latest_telemetry.humidity,
      threshold: thresholds.humidity,
    },
    {
      value: latest_telemetry.light_level,
      threshold: thresholds.light_level,
    },
  ];

  let hasCritical = false;
  let hasWarning = false;

  for (const sensor of sensors) {
    if (sensor.value === null || !sensor.threshold) continue;

    const { min, max } = sensor.threshold;
    const value = sensor.value;

    // Check if outside threshold
    if (min !== null && value < min) {
      hasCritical = true;
      continue;
    }
    if (max !== null && value > max) {
      hasCritical = true;
      continue;
    }

    // Check if within 10% of threshold (warning zone)
    if (min !== null && max !== null) {
      const range = max - min;
      const warningMargin = range * 0.1;
      
      if (value < min + warningMargin || value > max - warningMargin) {
        hasWarning = true;
      }
    }
  }

  if (hasCritical) return 'critical';
  if (hasWarning) return 'warning';
  return 'healthy';
}

function getStatusColor(status: PlantStatus): string {
  switch (status) {
    case 'healthy':
      return 'text-green-600';
    case 'warning':
      return 'text-yellow-600';
    case 'critical':
      return 'text-red-600';
  }
}

function getStatusLabel(status: PlantStatus): string {
  switch (status) {
    case 'healthy':
      return 'Healthy';
    case 'warning':
      return 'Warning';
    case 'critical':
      return 'Critical';
  }
}

export function PlantCard({ plant }: PlantCardProps) {
  const status = calculatePlantStatus(plant);
  const statusColor = getStatusColor(status);
  const statusLabel = getStatusLabel(status);

  return (
    <div className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow border border-gray-200">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <span>🌿</span>
              {plant.name}
            </h3>
            {plant.species && (
              <p className="text-sm text-gray-500 mt-1">{plant.species}</p>
            )}
          </div>
        </div>
        <div className="mt-2 flex items-center gap-2">
          <span className="text-sm text-gray-600">Status:</span>
          <span className={`inline-flex items-center gap-1 text-sm font-medium ${statusColor}`}>
            <span className="inline-block w-2 h-2 rounded-full bg-current" />
            {statusLabel}
          </span>
        </div>
      </div>

      {/* Sensor Readings */}
      <div className="p-4 border-b border-gray-200">
        {plant.latest_telemetry ? (
          <div className="space-y-1">
            <SensorReading
              label="Moisture"
              value={plant.latest_telemetry.soil_moisture}
              unit="%"
              min={plant.thresholds?.soil_moisture?.min ?? undefined}
              max={plant.thresholds?.soil_moisture?.max ?? undefined}
            />
            <SensorReading
              label="Temperature"
              value={plant.latest_telemetry.temperature}
              unit="°C"
              min={plant.thresholds?.temperature?.min ?? undefined}
              max={plant.thresholds?.temperature?.max ?? undefined}
            />
            <SensorReading
              label="Humidity"
              value={plant.latest_telemetry.humidity}
              unit="%"
              min={plant.thresholds?.humidity?.min ?? undefined}
              max={plant.thresholds?.humidity?.max ?? undefined}
            />
            <SensorReading
              label="Light"
              value={plant.latest_telemetry.light_level}
              unit=" lux"
              min={plant.thresholds?.light_level?.min ?? undefined}
              max={plant.thresholds?.light_level?.max ?? undefined}
            />
          </div>
        ) : (
          <p className="text-sm text-gray-400 text-center py-4">No sensor data yet</p>
        )}
      </div>

      {/* Footer */}
      <div className="p-4 flex items-center justify-between">
        <span className="text-sm text-gray-500">
          {plant.device_count} {plant.device_count === 1 ? 'device' : 'devices'} attached
        </span>
        <Link
          to={`/plants/${plant.id}`}
          className="text-sm font-medium text-green-600 hover:text-green-700 flex items-center gap-1"
        >
          View →
        </Link>
      </div>
    </div>
  );
}
