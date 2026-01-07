# Recorder: task-019

## Changes Summary

Implemented plant detail page with telemetry charts, threshold configuration, and device management. Added recharts for visualization.

## Key Files

- `frontend/src/components/TelemetryChart.tsx`: Line chart with threshold reference lines
- `frontend/src/components/ThresholdForm.tsx`: Min/max threshold editing form
- `frontend/src/components/PlantDeviceList.tsx`: Attached devices table with unassign
- `frontend/src/pages/PlantDetail.tsx`: Full plant detail page
- `frontend/package.json`: Added recharts ^2.10.0

## Interfaces for Next Task

### TelemetryChart
```typescript
interface TelemetryChartProps {
  data: TelemetryRecord[];
  dataKey: keyof TelemetryRecord;
  label: string;
  unit: string;
  color: string;
  min?: number | null;
  max?: number | null;
}
```

### ThresholdForm
```typescript
interface ThresholdFormProps {
  thresholds: PlantThresholds | null;
  onSave: (thresholds: PlantThresholds) => void;
  isSaving: boolean;
}
```

### PlantDeviceList
```typescript
interface PlantDeviceListProps {
  plantId: string;
}
```

## Notes

- Recharts ResponsiveContainer for responsive charts
- ReferenceLine for threshold visualization
- Color-coded current readings (green in range, red out of range)
- Breadcrumb navigation to Dashboard/Plants
