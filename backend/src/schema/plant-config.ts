import { z } from 'zod';

/**
 * Zod schema for plant configuration updates
 * Validates threshold updates for plant monitoring
 */
export const PlantConfigUpdateSchema = z.object({
  soil_moisture_min: z.number().int().min(0).max(100).optional(),
  soil_moisture_max: z.number().int().min(0).max(100).optional(),
  light_min: z.number().int().min(0).max(1000).optional(),
  temperature_min: z.number().min(-50).max(100).optional(),
  temperature_max: z.number().min(-50).max(100).optional(),
  alert_cooldown_minutes: z.number().int().min(1).max(1440).optional(),
}).refine(
  (data) => {
    // Validate that min < max for soil moisture if both provided
    if (data.soil_moisture_min !== undefined && data.soil_moisture_max !== undefined) {
      return data.soil_moisture_min < data.soil_moisture_max;
    }
    return true;
  },
  { message: 'soil_moisture_min must be less than soil_moisture_max' }
).refine(
  (data) => {
    // Validate that min < max for temperature if both provided
    if (data.temperature_min !== undefined && data.temperature_max !== undefined) {
      return data.temperature_min < data.temperature_max;
    }
    return true;
  },
  { message: 'temperature_min must be less than temperature_max' }
);

export type PlantConfigUpdate = z.infer<typeof PlantConfigUpdateSchema>;

/**
 * Full plant configuration (from database)
 */
export interface PlantConfig {
  id: string;
  name: string;
  soil_moisture_min: number;
  soil_moisture_max: number;
  light_min: number;
  temperature_min: number;
  temperature_max: number;
  alert_cooldown_minutes: number;
  last_alert_sent_at: Date | null;
}

/**
 * Plant with latest telemetry
 */
export interface PlantWithTelemetry extends PlantConfig {
  latest_telemetry: {
    timestamp: Date;
    soil_moisture: number;
    light: number;
    temperature: number;
  } | null;
}
