/**
 * PlantTooltip Component
 *
 * Displays plant details and sensor readings on hover.
 * Shows name, current sensor values, and last update time.
 *
 * @example
 * ```tsx
 * <PlantTooltip
 *   plant={plant}
 *   visible={isHovered}
 *   position={{ x: 60, y: -20 }}
 * />
 * ```
 */

import { Plant } from '../../types/plant';
import { formatRelativeTime } from '../../utils/plantStatus';

export interface PlantTooltipProps {
  /** The plant to display details for */
  plant: Plant;
  /** Whether the tooltip is visible */
  visible: boolean;
  /** Position relative to plant marker */
  position: { x: number; y: number };
}

/**
 * PlantTooltip displays sensor readings and status on hover.
 */
export function PlantTooltip({ plant, visible, position }: PlantTooltipProps) {
  if (!visible) {
    return null;
  }

  const telemetry = plant.latest_telemetry;
  const lastUpdated = telemetry?.time
    ? formatRelativeTime(telemetry.time)
    : 'No data';

  return (
    <foreignObject
      x={position.x}
      y={position.y}
      width={180}
      height={160}
      style={{ overflow: 'visible' }}
    >
      <div
        className="bg-white border border-gray-200 rounded-lg shadow-lg p-3"
        style={{ pointerEvents: 'none' }}
      >
        <div className="font-medium text-gray-900 mb-2">{plant.name}</div>
        <div className="text-xs text-gray-500 border-t border-gray-100 pt-2 space-y-1">
          {telemetry ? (
            <>
              <div className="flex items-center justify-between gap-2">
                <span>Soil:</span>
                <span>
                  {telemetry.soil_moisture !== null
                    ? telemetry.soil_moisture.toFixed(0) + '%'
                    : '--'}
                </span>
              </div>
              <div className="flex items-center justify-between gap-2">
                <span>Temp:</span>
                <span>
                  {telemetry.temperature !== null
                    ? telemetry.temperature.toFixed(1) + 'C'
                    : '--'}
                </span>
              </div>
              <div className="flex items-center justify-between gap-2">
                <span>Humidity:</span>
                <span>
                  {telemetry.humidity !== null
                    ? telemetry.humidity.toFixed(0) + '%'
                    : '--'}
                </span>
              </div>
              <div className="flex items-center justify-between gap-2">
                <span>Light:</span>
                <span>
                  {telemetry.light_level !== null
                    ? telemetry.light_level.toFixed(0) + ' lx'
                    : '--'}
                </span>
              </div>
            </>
          ) : (
            <div className="text-gray-400">No sensor data</div>
          )}
        </div>
        <div className="text-xs text-gray-400 mt-2 pt-2 border-t border-gray-100">
          Last: {lastUpdated}
        </div>
      </div>
    </foreignObject>
  );
}
