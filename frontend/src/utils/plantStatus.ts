import { PlantWithTelemetry } from '../api/types';

export type PlantStatus = 'healthy' | 'warning' | 'critical' | 'unknown';

/**
 * Calculate plant health status based on telemetry and thresholds
 */
export function calculatePlantStatus(plant: PlantWithTelemetry): PlantStatus {
  const telemetry = plant.latest_telemetry;

  // No telemetry available
  if (!telemetry) {
    return 'unknown';
  }

  const criticalIssues: boolean[] = [];
  const warningIssues: boolean[] = [];

  // Check soil moisture
  if (telemetry.soil_moisture < plant.soil_moisture_min || telemetry.soil_moisture > plant.soil_moisture_max) {
    criticalIssues.push(true);
  } else {
    // Warning if within 80-100% of threshold
    const moistureRange = plant.soil_moisture_max - plant.soil_moisture_min;
    const minWarningThreshold = plant.soil_moisture_min + moistureRange * 0.2;
    const maxWarningThreshold = plant.soil_moisture_max - moistureRange * 0.2;
    
    if (telemetry.soil_moisture <= minWarningThreshold || telemetry.soil_moisture >= maxWarningThreshold) {
      warningIssues.push(true);
    }
  }

  // Check light level
  if (telemetry.light < plant.light_min) {
    criticalIssues.push(true);
  } else {
    // Warning if within 80-100% of min threshold
    const warningThreshold = plant.light_min * 1.2;
    if (telemetry.light < warningThreshold) {
      warningIssues.push(true);
    }
  }

  // Check temperature
  if (telemetry.temperature < plant.temperature_min || telemetry.temperature > plant.temperature_max) {
    criticalIssues.push(true);
  } else {
    // Warning if within 80-100% of threshold
    const tempRange = plant.temperature_max - plant.temperature_min;
    const minWarningThreshold = plant.temperature_min + tempRange * 0.2;
    const maxWarningThreshold = plant.temperature_max - tempRange * 0.2;
    
    if (telemetry.temperature <= minWarningThreshold || telemetry.temperature >= maxWarningThreshold) {
      warningIssues.push(true);
    }
  }

  // Determine status
  if (criticalIssues.length > 0) {
    return 'critical';
  } else if (warningIssues.length > 0) {
    return 'warning';
  } else {
    return 'healthy';
  }
}
