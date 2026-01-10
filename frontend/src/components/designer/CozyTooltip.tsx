/**
 * CozyTooltip Component
 *
 * A warm, Scandinavian-styled tooltip for displaying plant information.
 * Features soft colors, rounded corners, and gentle shadows.
 */

import { Plant } from '../../types/plant';
import { getPlantStatus, formatRelativeTime, PlantStatusType } from '../../utils/plantStatus';
import { cn } from '../../lib/cn';

export interface CozyTooltipProps {
  /** Plant to display information for */
  plant: Plant;
  /** Whether tooltip is visible */
  visible: boolean;
  /** Position relative to plant (percentage) */
  position: { x: number; y: number };
  /** Additional CSS classes */
  className?: string;
}

/**
 * Muted Scandinavian status colors.
 */
const STATUS_COLORS: Record<PlantStatusType, string> = {
  online: 'bg-sage-100 text-sage-700 border-sage-200',
  warning: 'bg-amber-50 text-amber-700 border-amber-200',
  critical: 'bg-rose-50 text-rose-700 border-rose-200',
  offline: 'bg-gray-100 text-gray-500 border-gray-200',
};

/**
 * Status label text.
 */
const STATUS_LABELS: Record<PlantStatusType, string> = {
  online: 'Thriving',
  warning: 'Needs attention',
  critical: 'Help needed',
  offline: 'No sensor data',
};

export function CozyTooltip({
  plant,
  visible,
  position,
  className,
}: CozyTooltipProps) {
  const status = getPlantStatus(plant);
  const latestTelemetry = plant.latest_telemetry;
  const lastUpdate = latestTelemetry?.time
    ? formatRelativeTime(latestTelemetry.time)
    : 'Never';

  if (!visible) return null;

  return (
    <div
      className={cn(
        'absolute z-50 pointer-events-none',
        'transform -translate-x-1/2 transition-all duration-200',
        visible ? 'opacity-100 scale-100' : 'opacity-0 scale-95',
        className
      )}
      style={{
        left: `${position.x}%`,
        top: `${position.y - 15}%`,
      }}
      role="tooltip"
      aria-label={`Information for ${plant.name}`}
    >
      <div
        className={cn(
          'bg-cream-50 border border-stone-200',
          'rounded-xl shadow-lg',
          'px-4 py-3 min-w-[180px]',
          'backdrop-blur-sm'
        )}
        style={{
          backgroundColor: '#FFFBF5',
        }}
      >
        {/* Plant name */}
        <div className="flex items-center gap-2 mb-2">
          <span className="text-lg" role="img" aria-label="plant">🌿</span>
          <h3 className="font-medium text-stone-800">{plant.name}</h3>
        </div>

        {/* Divider */}
        <div className="border-t border-stone-200 my-2" />

        {/* Status badge */}
        <div
          className={cn(
            'inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs mb-3 border',
            STATUS_COLORS[status]
          )}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-current" />
          {STATUS_LABELS[status]}
        </div>

        {/* Sensor readings */}
        {latestTelemetry ? (
          <div className="space-y-1.5 text-sm">
            <div className="flex items-center gap-2 text-stone-600">
              <span className="text-base" role="img" aria-label="water">💧</span>
              <span>Soil: {latestTelemetry.soil_moisture?.toFixed(0) ?? '--'}%</span>
            </div>
            <div className="flex items-center gap-2 text-stone-600">
              <span className="text-base" role="img" aria-label="temperature">🌡️</span>
              <span>Temp: {latestTelemetry.temperature?.toFixed(1) ?? '--'}°C</span>
            </div>
            <div className="flex items-center gap-2 text-stone-600">
              <span className="text-base" role="img" aria-label="humidity">💨</span>
              <span>Humidity: {latestTelemetry.humidity?.toFixed(0) ?? '--'}%</span>
            </div>
            <div className="flex items-center gap-2 text-stone-600">
              <span className="text-base" role="img" aria-label="light">☀️</span>
              <span>Light: {formatLightLevel(latestTelemetry.light_level)}</span>
            </div>
          </div>
        ) : (
          <p className="text-sm text-stone-500 italic">No sensor data available</p>
        )}

        {/* Divider */}
        <div className="border-t border-stone-200 my-2" />

        {/* Last updated */}
        <p className="text-xs text-stone-400">
          Updated {lastUpdate}
        </p>
      </div>

      {/* Tooltip arrow */}
      <div
        className="absolute left-1/2 -translate-x-1/2 -bottom-2"
        style={{
          width: 0,
          height: 0,
          borderLeft: '8px solid transparent',
          borderRight: '8px solid transparent',
          borderTop: '8px solid #FFFBF5',
        }}
      />
    </div>
  );
}

/**
 * Format light level to human-readable text.
 */
function formatLightLevel(lux: number | null | undefined): string {
  if (lux == null) return '--';
  if (lux < 200) return 'Low';
  if (lux < 500) return 'Medium';
  if (lux < 1000) return 'Good';
  return 'Bright';
}
