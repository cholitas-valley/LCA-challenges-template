import type {
  Device,
  DeviceListResponse,
  DeviceRegisterRequest,
  DeviceRegisterResponse,
  DeviceProvisionRequest,
  Plant,
  PlantCreate,
  PlantUpdate,
  PlantListResponse,
  TelemetryHistoryResponse,
  CarePlanResponse,
} from '../types';

const API_BASE = '/api';

async function fetchApi<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
    ...options,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.detail || `HTTP ${response.status}`);
  }

  return response.json();
}

// Device API
export const deviceApi = {
  list: () => fetchApi<DeviceListResponse>('/devices'),
  register: (data: DeviceRegisterRequest) =>
    fetchApi<DeviceRegisterResponse>('/devices/register', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  provision: (deviceId: string, data: DeviceProvisionRequest) =>
    fetchApi<Device>(`/devices/${deviceId}/provision`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  delete: (deviceId: string) =>
    fetchApi<void>(`/devices/${deviceId}`, { method: 'DELETE' }),
};

// Plant API
export const plantApi = {
  list: () => fetchApi<PlantListResponse>('/plants'),
  get: (id: string) => fetchApi<Plant>(`/plants/${id}`),
  create: (data: PlantCreate) =>
    fetchApi<Plant>('/plants', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  update: (id: string, data: PlantUpdate) =>
    fetchApi<Plant>(`/plants/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  delete: (id: string) =>
    fetchApi<void>(`/plants/${id}`, { method: 'DELETE' }),
  history: (id: string, hours = 24) =>
    fetchApi<TelemetryHistoryResponse>(`/plants/${id}/history?hours=${hours}`),
  devices: (id: string) =>
    fetchApi<DeviceListResponse>(`/plants/${id}/devices`),
  getCarePlan: (id: string) =>
    fetchApi<CarePlanResponse>(`/plants/${id}/care-plan`),
  analyze: (id: string) =>
    fetchApi<CarePlanResponse>(`/plants/${id}/analyze`, {
      method: 'POST',
    }),
};
