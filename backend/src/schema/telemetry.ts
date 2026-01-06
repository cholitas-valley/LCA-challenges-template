import { z } from 'zod';

/**
 * Zod schema for telemetry payloads from MQTT
 * 
 * Expected format:
 * {
 *   "timestamp": "2026-01-06T15:50:23.456Z",
 *   "soil_moisture": 45.3,
 *   "light": 67.8,
 *   "temperature": 23.2
 * }
 */
export const TelemetryPayloadSchema = z.object({
  timestamp: z.string().datetime({ message: 'timestamp must be ISO 8601 UTC datetime' }),
  soil_moisture: z.number().min(0).max(100),
  light: z.number().min(0).max(100),
  temperature: z.number().min(-50).max(100), // Wide range to be safe
});

export type TelemetryPayload = z.infer<typeof TelemetryPayloadSchema>;

/**
 * Telemetry record with plant_id (extracted from MQTT topic)
 */
export interface TelemetryRecord {
  timestamp: Date;
  plant_id: string;
  soil_moisture: number;
  light: number;
  temperature: number;
}
