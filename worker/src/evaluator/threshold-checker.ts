import type { Plant, Telemetry } from '../db/worker-repository.js';

export type AlertType =
  | 'soil_moisture_low'
  | 'soil_moisture_high'
  | 'light_low'
  | 'light_high'
  | 'temp_low'
  | 'temp_high';

export interface ThresholdBreach {
  alertType: AlertType;
  message: string;
  value: number;
}

/**
 * Evaluate telemetry against plant thresholds
 * Returns array of breaches (can be multiple)
 */
export function checkThresholds(plant: Plant, telemetry: Telemetry): ThresholdBreach[] {
  const breaches: ThresholdBreach[] = [];

  // Check soil moisture
  if (telemetry.soil_moisture < plant.soil_moisture_min) {
    breaches.push({
      alertType: 'soil_moisture_low',
      message: `Soil moisture is low (${telemetry.soil_moisture}%)`,
      value: telemetry.soil_moisture,
    });
  } else if (telemetry.soil_moisture > plant.soil_moisture_max) {
    breaches.push({
      alertType: 'soil_moisture_high',
      message: `Soil moisture is high (${telemetry.soil_moisture}%)`,
      value: telemetry.soil_moisture,
    });
  }

  // Check light
  if (telemetry.light < plant.light_min) {
    breaches.push({
      alertType: 'light_low',
      message: `Light level is low (${telemetry.light} lux)`,
      value: telemetry.light,
    });
  }
  // Note: No light_max in schema, but keeping for consistency
  // This will never trigger unless schema is updated

  // Check temperature
  if (telemetry.temperature < plant.temperature_min) {
    breaches.push({
      alertType: 'temp_low',
      message: `Temperature is low (${telemetry.temperature}°C)`,
      value: Number(telemetry.temperature),
    });
  } else if (telemetry.temperature > plant.temperature_max) {
    breaches.push({
      alertType: 'temp_high',
      message: `Temperature is high (${telemetry.temperature}°C)`,
      value: Number(telemetry.temperature),
    });
  }

  return breaches;
}
