import { Telemetry } from '../api/types';

export interface ChartDataPoint {
  timestamp: string;
  soil_moisture: number | null;
  light: number | null;
  temperature: number | null;
  time: string; // formatted time for X-axis
}

/**
 * Transform telemetry data for Recharts format
 * Sorts by timestamp ascending and formats time labels
 */
export function transformTelemetryForChart(telemetry: Telemetry[]): ChartDataPoint[] {
  if (!telemetry || telemetry.length === 0) {
    return [];
  }

  // Sort by timestamp ascending (oldest first)
  const sorted = [...telemetry].sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  );

  return sorted.map((t) => ({
    timestamp: t.timestamp,
    soil_moisture: t.soil_moisture ?? null,
    light: t.light ?? null,
    temperature: t.temperature ?? null,
    time: formatTimeForChart(t.timestamp),
  }));
}

/**
 * Format timestamp for chart X-axis
 * Returns HH:MM format for intraday, MMM DD for multi-day
 */
function formatTimeForChart(timestamp: string): string {
  const date = new Date(timestamp);
  const now = new Date();
  const daysDiff = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

  if (daysDiff < 1) {
    // Same day: show time only (HH:MM)
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
  } else {
    // Multi-day: show date (MMM DD HH:MM)
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
  }
}
