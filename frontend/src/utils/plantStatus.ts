/**
 * Plant Status Utilities
 *
 * Functions for determining plant health status and formatting telemetry data.
 *
 * @example
 * ```tsx
 * import { getPlantStatus, formatRelativeTime } from '@/utils/plantStatus';
 *
 * const status = getPlantStatus(plant);
 * const lastUpdated = formatRelativeTime(telemetry.time);
 * ```
 */

import { Plant, PlantThresholds, ThresholdConfig } from '../types/plant';
import { TelemetryRecord } from '../types/telemetry';

export type PlantStatusType = 'online' | 'warning' | 'critical' | 'offline';

/**
 * Determine plant health status based on telemetry and thresholds.
 *
 * Status priority:
 * - offline: No telemetry data available
 * - critical: Any sensor value is significantly outside thresholds (beyond warning margin)
 * - warning: Any sensor value is outside thresholds
 * - online: All values within acceptable range
 */
export function getPlantStatus(plant: Plant): PlantStatusType {
  const telemetry = plant.latest_telemetry;

  // No telemetry = offline
  if (!telemetry) {
    return 'offline';
  }

  const thresholds = plant.thresholds;

  // No thresholds configured = assume online if we have telemetry
  if (!thresholds) {
    return 'online';
  }

  // Check for critical conditions first (10% beyond threshold)
  if (checkCriticalThresholds(telemetry, thresholds)) {
    return 'critical';
  }

  // Check for warning conditions (outside threshold)
  if (checkWarningThresholds(telemetry, thresholds)) {
    return 'warning';
  }

  return 'online';
}

/**
 * Check if a value is outside threshold bounds.
 */
function isOutsideThreshold(
  value: number | null,
  threshold: ThresholdConfig | undefined
): boolean {
  if (value === null || !threshold) {
    return false;
  }

  if (threshold.min !== null && value < threshold.min) {
    return true;
  }

  if (threshold.max !== null && value > threshold.max) {
    return true;
  }

  return false;
}

/**
 * Check if a value is critically outside threshold bounds.
 * Critical = more than 10% beyond the threshold boundary.
 */
function isCriticallyOutsideThreshold(
  value: number | null,
  threshold: ThresholdConfig | undefined
): boolean {
  if (value === null || !threshold) {
    return false;
  }

  // Calculate critical margin (10% of the threshold range or 10 units minimum)
  const range =
    threshold.min !== null && threshold.max !== null
      ? threshold.max - threshold.min
      : 100;
  const criticalMargin = Math.max(range * 0.1, 10);

  if (threshold.min !== null && value < threshold.min - criticalMargin) {
    return true;
  }

  if (threshold.max !== null && value > threshold.max + criticalMargin) {
    return true;
  }

  return false;
}

/**
 * Check if any telemetry value is critically outside thresholds.
 */
function checkCriticalThresholds(
  telemetry: TelemetryRecord,
  thresholds: PlantThresholds
): boolean {
  return (
    isCriticallyOutsideThreshold(
      telemetry.soil_moisture,
      thresholds.soil_moisture
    ) ||
    isCriticallyOutsideThreshold(
      telemetry.temperature,
      thresholds.temperature
    ) ||
    isCriticallyOutsideThreshold(telemetry.humidity, thresholds.humidity) ||
    isCriticallyOutsideThreshold(telemetry.light_level, thresholds.light_level)
  );
}

/**
 * Check if any telemetry value is outside thresholds (warning level).
 */
function checkWarningThresholds(
  telemetry: TelemetryRecord,
  thresholds: PlantThresholds
): boolean {
  return (
    isOutsideThreshold(telemetry.soil_moisture, thresholds.soil_moisture) ||
    isOutsideThreshold(telemetry.temperature, thresholds.temperature) ||
    isOutsideThreshold(telemetry.humidity, thresholds.humidity) ||
    isOutsideThreshold(telemetry.light_level, thresholds.light_level)
  );
}

/**
 * Format a timestamp as relative time (e.g., "2 min ago").
 *
 * @param timestamp - ISO 8601 timestamp string
 * @returns Human-readable relative time string
 */
export function formatRelativeTime(timestamp: string): string {
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);

  if (diffMin < 1) {
    return 'Just now';
  }

  if (diffMin < 60) {
    return `${diffMin} min ago`;
  }

  const diffHours = Math.floor(diffMin / 60);
  if (diffHours < 24) {
    return `${diffHours}h ago`;
  }

  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}d ago`;
}
