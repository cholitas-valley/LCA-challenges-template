export interface TelemetryRecord {
  time: string;
  device_id: string;
  plant_id: string | null;
  soil_moisture: number | null;
  temperature: number | null;
  humidity: number | null;
  light_level: number | null;
}

export interface TelemetryHistoryResponse {
  records: TelemetryRecord[];
  count: number;
}
