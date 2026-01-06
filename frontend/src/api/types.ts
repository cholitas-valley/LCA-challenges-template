export interface Telemetry {
  timestamp: string;
  soil_moisture: number;
  light: number;
  temperature: number;
}

export interface PlantWithTelemetry {
  id: string;
  name: string;
  soil_moisture_min: number;
  soil_moisture_max: number;
  light_min: number;
  temperature_min: number;
  temperature_max: number;
  alert_cooldown_minutes: number;
  last_alert_sent_at: string | null;
  latest_telemetry: Telemetry | null;
}

export interface PlantConfigUpdate {
  soil_moisture_min?: number;
  soil_moisture_max?: number;
  light_min?: number;
  temperature_min?: number;
  temperature_max?: number;
  alert_cooldown_minutes?: number;
}

export interface HistoryResponse {
  plant_id: string;
  plant_name: string;
  hours: number;
  data: Telemetry[];
}
