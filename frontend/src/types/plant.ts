import { TelemetryRecord } from './telemetry';

export interface ThresholdConfig {
  min: number | null;
  max: number | null;
}

export interface PlantThresholds {
  soil_moisture?: ThresholdConfig;
  temperature?: ThresholdConfig;
  humidity?: ThresholdConfig;
  light_level?: ThresholdConfig;
}

export interface PlantPosition {
  x: number;
  y: number;
}

export interface Plant {
  id: string;
  name: string;
  species: string | null;
  thresholds: PlantThresholds | null;
  position: PlantPosition | null;
  created_at: string;
  latest_telemetry?: TelemetryRecord | null;
  device_count: number;
}

export interface PlantListResponse {
  plants: Plant[];
  total: number;
}

export interface PlantCreate {
  name: string;
  species?: string;
  thresholds?: PlantThresholds;
}

export interface PlantUpdate {
  name?: string;
  species?: string;
  thresholds?: PlantThresholds;
}
