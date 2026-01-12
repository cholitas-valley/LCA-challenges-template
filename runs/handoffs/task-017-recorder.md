# Recorder: task-017

## Changes Summary

Implemented dashboard with plant cards showing live status, sensor readings, and plant creation modal.

## Key Files

- `frontend/src/components/PlantCard.tsx`: Plant card with status indicator, sensor readings, device count
- `frontend/src/components/SensorReading.tsx`: Reusable sensor display with progress bar
- `frontend/src/components/CreatePlantModal.tsx`: Plant creation form modal
- `frontend/src/pages/Dashboard.tsx`: Grid of plant cards with add button
- `frontend/src/components/index.ts`: Updated exports

## Interfaces for Next Task

### PlantCard
```typescript
interface PlantCardProps {
  plant: Plant;
}
<PlantCard plant={plant} />
```

### SensorReading
```typescript
interface SensorReadingProps {
  label: string;
  value: number | null;
  unit: string;
  min?: number;
  max?: number;
}
<SensorReading label="Moisture" value={45} unit="%" min={30} max={70} />
```

### CreatePlantModal
```typescript
interface CreatePlantModalProps {
  isOpen: boolean;
  onClose: () => void;
}
```

### Status Calculation
- `getPlantStatus(plant)` returns 'healthy' | 'warning' | 'critical'

## Notes

- Auto-refresh every 10 seconds via usePlants() hook
- Status: green=healthy, yellow=warning, red=critical
- Cards link to /plants/:id
