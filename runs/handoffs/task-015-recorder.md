# Recorder: task-015

## Changes Summary

Completed API client layer with TypeScript types and React Query hooks. All types match backend API, covers all endpoints, 10-second auto-refresh with intelligent cache invalidation.

## Key Files

- `frontend/src/types/device.ts`: Device, DeviceListResponse, DeviceRegisterRequest, DeviceRegisterResponse
- `frontend/src/types/plant.ts`: Plant, PlantThresholds, PlantListResponse, PlantCreate, PlantUpdate
- `frontend/src/types/telemetry.ts`: TelemetryRecord, TelemetryHistoryResponse
- `frontend/src/types/index.ts`: Centralized type exports
- `frontend/src/api/client.ts`: fetchApi wrapper, deviceApi, plantApi
- `frontend/src/hooks/usePlants.ts`: usePlants, usePlant, useCreatePlant, useUpdatePlant, useDeletePlant, usePlantHistory, usePlantDevices
- `frontend/src/hooks/useDevices.ts`: useDevices, useRegisterDevice, useProvisionDevice, useDeleteDevice

## Interfaces for Next Task

### Type Imports
```typescript
import { Plant, Device, TelemetryRecord } from '../types';
```

### Hook Usage
```typescript
import { usePlants, usePlant, usePlantHistory } from '../hooks';

const { data, isLoading, error } = usePlants();
const { data: plant } = usePlant(id);
const createPlant = useCreatePlant();
```

### API Direct Usage
```typescript
import { plantApi, deviceApi } from '../api';
const plants = await plantApi.list();
```

## Notes

- Auto-refresh every 10 seconds for list queries
- Mutations invalidate related queries automatically
- API base path: /api (proxied to backend:8000)
- No `any` types - strict TypeScript
