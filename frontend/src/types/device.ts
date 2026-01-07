export interface Device {
  id: string;
  mac_address: string;
  mqtt_username: string;
  plant_id: string | null;
  status: 'provisioning' | 'online' | 'offline' | 'error';
  firmware_version: string | null;
  sensor_types: string[] | null;
  last_seen_at: string | null;
  created_at: string;
}

export interface DeviceListResponse {
  devices: Device[];
  total: number;
}

export interface DeviceRegisterRequest {
  mac_address: string;
  firmware_version?: string;
  sensor_types?: string[];
}

export interface DeviceRegisterResponse {
  device_id: string;
  mqtt_username: string;
  mqtt_password: string;
  mqtt_host: string;
  mqtt_port: number;
}

export interface DeviceProvisionRequest {
  plant_id: string;
}
