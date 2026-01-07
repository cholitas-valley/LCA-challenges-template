---
task_id: task-015
title: API client and types
role: lca-frontend
follow_roles: []
post:
  - lca-recorder
  - lca-gitops
depends_on:
  - task-014
inputs:
  - objective.md
  - runs/plan.md
  - runs/handoffs/task-014.md
allowed_paths:
  - frontend/**
check_command: cd frontend && npm run build
handoff: runs/handoffs/task-015.md
---

# Task 015: API Client and Types

## Goal

Create the API client layer with typed fetch functions and React Query hooks for data fetching. Define TypeScript types that match the backend API responses.

## Requirements

### TypeScript Types (frontend/src/types/)

**types/device.ts:**
```typescript
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

export interface DeviceRegisterResponse {
  device_id: string;
  mqtt_username: string;
  mqtt_password: string;
  mqtt_host: string;
  mqtt_port: number;
}
```

**types/plant.ts:**
```typescript
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

export interface Plant {
  id: string;
  name: string;
  species: string | null;
  thresholds: PlantThresholds | null;
  created_at: string;
  latest_telemetry?: TelemetryRecord | null;
  device_count: number;
}

export interface PlantListResponse {
  plants: Plant[];
  total: number;
}
```

**types/telemetry.ts:**
```typescript
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
```

### API Client (frontend/src/api/client.ts)

```typescript
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
  provision: (deviceId: string, plantId: string) =>
    fetchApi<Device>(`/devices/${deviceId}/provision`, {
      method: 'POST',
      body: JSON.stringify({ plant_id: plantId }),
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
  history: (id: string, hours?: number) =>
    fetchApi<TelemetryHistoryResponse>(`/plants/${id}/history?hours=${hours || 24}`),
  devices: (id: string) =>
    fetchApi<DeviceListResponse>(`/plants/${id}/devices`),
};
```

### React Query Hooks (frontend/src/hooks/)

**hooks/usePlants.ts:**
```typescript
export function usePlants() {
  return useQuery({
    queryKey: ['plants'],
    queryFn: plantApi.list,
    refetchInterval: 10000, // Refresh every 10 seconds
  });
}

export function usePlant(id: string) {
  return useQuery({
    queryKey: ['plants', id],
    queryFn: () => plantApi.get(id),
    enabled: !!id,
  });
}

export function useCreatePlant() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: plantApi.create,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['plants'] }),
  });
}
```

**hooks/useDevices.ts:**
Similar pattern for device queries and mutations.

### Query Provider Setup

Update App.tsx to include QueryClientProvider.

## Definition of Done

- [ ] All TypeScript types match backend API
- [ ] API client covers all endpoints
- [ ] React Query hooks for plants and devices
- [ ] QueryClientProvider configured in App
- [ ] Build passes with no type errors

## Constraints

- Use React Query v5 (TanStack Query)
- All API calls go through fetchApi wrapper
- Handle errors consistently
- Types must be strict (no `any`)
