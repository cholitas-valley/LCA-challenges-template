# Task 019 Handoff: Plant Detail with Charts

## Summary

Successfully implemented the plant detail page with comprehensive telemetry visualization, threshold configuration, and device management. The page includes current readings display, 24-hour history charts using recharts, editable thresholds, and a list of attached devices with unassign functionality.

## Files Created

### Components
- `/home/genge/dev-ash/foundry-nodevenv/cholitas/challenge-001-plantops/frontend/src/components/TelemetryChart.tsx` - Line chart component for displaying 24-hour telemetry history with threshold lines
- `/home/genge/dev-ash/foundry-nodevenv/cholitas/challenge-001-plantops/frontend/src/components/ThresholdForm.tsx` - Form component for editing min/max thresholds for all metrics
- `/home/genge/dev-ash/foundry-nodevenv/cholitas/challenge-001-plantops/frontend/src/components/PlantDeviceList.tsx` - Table component showing devices attached to the plant with unassign action

## Files Modified

- `/home/genge/dev-ash/foundry-nodevenv/cholitas/challenge-001-plantops/frontend/src/pages/PlantDetail.tsx` - Replaced placeholder with full plant detail implementation
- `/home/genge/dev-ash/foundry-nodevenv/cholitas/challenge-001-plantops/frontend/src/components/index.ts` - Added exports for new components
- `/home/genge/dev-ash/foundry-nodevenv/cholitas/challenge-001-plantops/frontend/package.json` - Added recharts dependency

## Components Added/Modified

### TelemetryChart Component
Responsive line chart for visualizing telemetry metrics:
- **Props**: `data` (TelemetryRecord[]), `metricKey`, `metricLabel`, `threshold`, `unit`
- **Features**:
  - Filters out null values from data
  - Sorts by timestamp for chronological display
  - Shows time axis with readable AM/PM format
  - Y-axis with unit label
  - Reference lines for min/max thresholds (red dashed lines)
  - Green line for metric values
  - Hover tooltip with formatted values
  - Responsive container adapts to screen size
  - Empty state when no data available
- **Chart Library**: Uses recharts (LineChart, ReferenceLine, ResponsiveContainer)
- **Styling**: White card with shadow, 300px height, proper margins

### ThresholdForm Component
Form for configuring threshold ranges for all metrics:
- **Props**: `thresholds` (PlantThresholds | null), `onSave`, `isLoading`
- **Features**:
  - 2x2 grid layout on desktop, single column on mobile
  - Min/Max inputs for each metric:
    - Soil Moisture (%)
    - Temperature (°C)
    - Humidity (%)
    - Light Level (lux)
  - Number inputs with appropriate step values
  - Pre-populates with existing thresholds
  - Allows empty values (converts to null)
  - Save button with loading state
  - Calls onSave callback with PlantThresholds object
- **Validation**: Accepts empty strings and converts to null for optional thresholds
- **UX**: Green focus ring, disabled state during save
- **Styling**: White card with shadow, responsive grid

### PlantDeviceList Component
Table displaying devices attached to the plant:
- **Props**: `devices` (Device[]), `onUnassign`, `isUnassigning`
- **Columns**:
  1. **Status**: Color-coded dot + label (green/gray/yellow/red)
  2. **Device ID**: Truncated to 8 chars with ellipsis
  3. **MAC Address**: Full address in monospace font
  4. **Last Seen**: Relative time (sec/min/hr/day ago)
  5. **Actions**: Unassign button (red text)
- **Helper Functions**:
  - `getStatusColor()`: Maps status to Tailwind bg color class
  - `getStatusLabel()`: Capitalizes status string
  - `formatLastSeen()`: Converts timestamp to relative time string
- **Features**:
  - Empty state when no devices attached
  - Hover effect on table rows
  - Disabled state during unassign operation
  - Responsive table with horizontal scroll on mobile
- **Styling**: White card with shadow, semantic HTML table

### PlantDetail Page
Comprehensive plant detail view with multiple sections:

#### Data Fetching
- Uses `usePlant(id)` for plant info
- Uses `usePlantHistory(id, 24)` for 24-hour telemetry
- Uses `usePlantDevices(id)` for attached devices
- Auto-refresh via React Query (10s interval)

#### Page Sections

1. **Breadcrumb Navigation**
   - Dashboard > Plants > [Plant Name]
   - Each segment is a clickable link

2. **Plant Header**
   - Large plant name with inline edit (pencil icon)
   - Edit mode: input field with Save/Cancel buttons
   - Species display (if set)
   - Device count
   - Delete Plant button (red, top-right)

3. **Current Readings Section**
   - 4-column grid (responsive: 1 col mobile, 4 cols desktop)
   - Large value display (4xl font)
   - Color-coded values:
     - Green: within thresholds
     - Red: outside thresholds
     - Gray: no value
   - Threshold range shown below each metric
   - Format: "(min-max)" or "Not set"

4. **24-Hour History Charts**
   - 2x2 grid layout (1 col mobile, 2 cols desktop)
   - TelemetryChart for each metric:
     - Soil Moisture
     - Temperature
     - Humidity
     - Light Level
   - Loading spinner while fetching history
   - Charts show threshold lines for reference

5. **Threshold Configuration**
   - ThresholdForm component
   - Saves via `useUpdatePlant()` mutation
   - Loading state on submit

6. **Attached Devices**
   - PlantDeviceList component
   - Unassign triggers confirmation dialog
   - Uses existing ConfirmDialog component
   - Unassign via `useProvisionDevice()` with empty plant_id

#### User Interactions
- **Edit Name**: Click pencil icon, edit inline, save/cancel
- **Delete Plant**: Click Delete button, navigates to /plants on success
- **Save Thresholds**: Edit values, click Save Thresholds
- **Unassign Device**: Click Unassign, confirm in dialog

#### Helper Functions
- `getStatusColor()`: Returns Tailwind color class based on value vs thresholds
- `formatThresholdRange()`: Formats min/max as readable string

#### State Management
- `isEditingName` / `editedName`: Controls inline name editing
- `deleteDevice`: Tracks device to unassign (triggers confirmation dialog)
- React Query mutations auto-invalidate cache on success

## Data Flow

### Plant Detail Load
```
PlantDetail page
  ↓
usePlant(id) hook
  ↓
GET /api/plants/:id
  ↓
{ id, name, species, thresholds, latest_telemetry, device_count }
  ↓
Display header, current readings
```

### Telemetry History Load
```
PlantDetail page
  ↓
usePlantHistory(id, 24) hook
  ↓
GET /api/plants/:id/history?hours=24
  ↓
{ records: TelemetryRecord[], count: number }
  ↓
TelemetryChart components (x4)
  ↓
Filter by metricKey, sort by time, render line chart
```

### Devices Load
```
PlantDetail page
  ↓
usePlantDevices(id) hook
  ↓
GET /api/plants/:id/devices
  ↓
{ devices: Device[] }
  ↓
PlantDeviceList component
```

### Update Thresholds
```
ThresholdForm
  ↓
User edits values and clicks Save
  ↓
onSave(thresholds)
  ↓
useUpdatePlant() mutation
  ↓
PUT /api/plants/:id { thresholds }
  ↓
React Query invalidates 'plants' and 'plants/:id'
  ↓
Page auto-refreshes with new thresholds
  ↓
Charts update threshold lines
```

### Unassign Device
```
PlantDeviceList
  ↓
Click "Unassign" → setDeleteDevice(deviceId)
  ↓
ConfirmDialog opens
  ↓
User confirms
  ↓
handleUnassignDevice(deviceId)
  ↓
useProvisionDevice() mutation
  ↓
POST /api/devices/:id/provision { plant_id: '' }
  ↓
React Query invalidates 'plants/:id/devices'
  ↓
Device list auto-refreshes
```

### Edit Plant Name
```
Header
  ↓
Click edit icon → setIsEditingName(true)
  ↓
Input field appears with current name
  ↓
User edits and clicks Save
  ↓
handleNameSave()
  ↓
useUpdatePlant() mutation
  ↓
PUT /api/plants/:id { name }
  ↓
React Query invalidates cache
  ↓
Header updates with new name
```

### Delete Plant
```
Header
  ↓
Click "Delete Plant"
  ↓
handleDeletePlant()
  ↓
useDeletePlant() mutation
  ↓
DELETE /api/plants/:id
  ↓
navigate('/plants')
```

## How to Verify

### Build Check
```bash
npm run build --prefix /home/genge/dev-ash/foundry-nodevenv/cholitas/challenge-001-plantops/frontend
# Build passes successfully with no TypeScript errors
```

### Dev Server
```bash
npm run dev --prefix /home/genge/dev-ash/foundry-nodevenv/cholitas/challenge-001-plantops/frontend
# Visit http://localhost:5173
```

### Visual Verification

1. **Navigate to Plant Detail**:
   - From Dashboard, click on a plant card OR
   - From Plants page, click on a plant
   - Should navigate to `/plants/:id`

2. **Breadcrumb**:
   - Should show "Dashboard > Plants > [Plant Name]"
   - Each segment should be clickable

3. **Plant Header**:
   - Shows plant name (large, bold)
   - Click pencil icon to edit name
   - Edit mode shows input, Save, Cancel buttons
   - Shows species if set
   - Shows device count
   - Delete button in top-right (red)

4. **Current Readings**:
   - 4 cards in grid layout
   - Large values (45%, 22.5°C, etc.)
   - Color-coded: green (good), red (out of range), gray (no data)
   - Shows threshold range below each value
   - Responsive: 1 column on mobile, 4 on desktop

5. **History Charts**:
   - 4 charts in 2x2 grid
   - Each shows 24-hour line graph
   - Green line for values
   - Red dashed lines for min/max thresholds
   - Time axis shows AM/PM format
   - Hover tooltip shows exact value
   - Responsive: 1 column on mobile, 2 on desktop
   - Empty state if no data

6. **Threshold Form**:
   - Shows current thresholds pre-filled
   - 8 inputs total (min/max for 4 metrics)
   - Can edit values
   - Click "Save Thresholds" to submit
   - Loading state during save
   - Charts update after save

7. **Attached Devices**:
   - Table shows devices assigned to plant
   - Status indicator (colored dot)
   - Device ID (truncated)
   - MAC address
   - Last seen time (relative)
   - Unassign button (red text)
   - Empty state if no devices

8. **Unassign Device**:
   - Click "Unassign" on a device
   - Confirmation dialog appears
   - Click "Unassign" to confirm
   - Device disappears from list

9. **Edit Name**:
   - Click pencil icon
   - Type new name
   - Click Save
   - Name updates throughout page

10. **Delete Plant**:
    - Click "Delete Plant" button
    - Plant is deleted
    - Redirects to /plants page

## Definition of Done - Status

- [x] Plant detail page loads plant data - DONE
- [x] Current readings displayed prominently - DONE (4-column grid, large values)
- [x] 24-hour history chart renders - DONE (4 charts in 2x2 grid)
- [x] Threshold lines shown on charts - DONE (red dashed ReferenceLine)
- [x] Can edit thresholds - DONE (ThresholdForm with save)
- [x] Attached devices listed - DONE (PlantDeviceList table)
- [x] Can navigate back to dashboard - DONE (breadcrumb navigation)
- [x] Build passes - DONE (verified)

## Interfaces for Next Task

### TelemetryChart Component Interface
```typescript
interface TelemetryChartProps {
  data: TelemetryRecord[];
  metricKey: 'soil_moisture' | 'temperature' | 'humidity' | 'light_level';
  metricLabel: string;
  threshold?: ThresholdConfig;
  unit?: string;
}
```

### ThresholdForm Component Interface
```typescript
interface ThresholdFormProps {
  thresholds: PlantThresholds | null;
  onSave: (thresholds: PlantThresholds) => void;
  isLoading?: boolean;
}
```

### PlantDeviceList Component Interface
```typescript
interface PlantDeviceListProps {
  devices: Device[];
  onUnassign: (deviceId: string) => void;
  isUnassigning?: boolean;
}
```

## Design Patterns

### Chart Data Transformation
```typescript
const chartData = data
  .filter((record) => record[metricKey] !== null)
  .map((record) => ({
    time: new Date(record.time).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }),
    value: record[metricKey],
    timestamp: new Date(record.time).getTime(),
  }))
  .sort((a, b) => a.timestamp - b.timestamp);
```

### Threshold Validation Pattern
```typescript
const getStatusColor = (value: number | null, min: number | null, max: number | null) => {
  if (value === null) return 'text-gray-400';
  if (min !== null && value < min) return 'text-red-600';
  if (max !== null && value > max) return 'text-red-600';
  return 'text-green-600';
};
```

### Inline Edit Pattern
```typescript
const [isEditing, setIsEditing] = useState(false);
const [editedValue, setEditedValue] = useState('');

const handleEdit = () => {
  setEditedValue(currentValue);
  setIsEditing(true);
};

const handleSave = async () => {
  if (editedValue !== currentValue) {
    await mutation.mutateAsync({ id, data: { field: editedValue } });
  }
  setIsEditing(false);
};
```

### Form to API Object Conversion
```typescript
// Convert string inputs to numbers/null
const newThresholds: PlantThresholds = {
  soil_moisture: {
    min: inputs.soil_moisture_min ? parseFloat(inputs.soil_moisture_min) : null,
    max: inputs.soil_moisture_max ? parseFloat(inputs.soil_moisture_max) : null,
  },
  // ... repeat for other metrics
};
```

## Next Steps

1. **task-020**: Settings Page (if planned)
   - User preferences
   - System configuration
   - Notification settings

2. **Future Enhancements**:
   - Add date range picker for history (7d, 30d, custom)
   - Add export chart data as CSV
   - Add chart zoom/pan functionality
   - Add real-time chart updates via WebSocket
   - Add threshold violation alerts/notifications
   - Add multiple threshold presets per plant
   - Add comparison view (multiple plants)
   - Add annotation system (mark events on charts)
   - Add device reassign (not just unassign)
   - Add bulk threshold updates
   - Add threshold recommendations based on species
   - Add print/share functionality

## Risks/Notes

### Chart Performance
- Charts render all 24 hours of data (potentially 1440 points at 1-min intervals)
- Recharts handles well for typical use cases (< 1000 points)
- Consider data aggregation for longer time periods
- Consider virtualization or downsampling for very dense data

### Threshold Reference Lines
- Both min and max lines use same color (red) and style (dashed)
- Easy to distinguish by position, but consider adding labels
- Lines may overlap if min = max (edge case)
- Consider different colors for min (blue) and max (red)

### Empty States
- Charts show "No data available" if all values are null
- Current readings show "N/A" if no telemetry
- Devices show "No devices attached to this plant"
- All empty states are clear and actionable

### Responsive Design
- Charts responsive via ResponsiveContainer
- Grid layouts adapt to screen size (1 col → 2 col → 4 col)
- Table horizontally scrollable on mobile
- Breadcrumb wraps on small screens
- Header actions may stack on very small screens

### Data Refresh
- Plant data auto-refreshes every 10s (via usePlant)
- History data fetches once on load (no auto-refresh)
- Device list fetches once on load
- Consider adding manual refresh button
- Consider WebSocket for real-time updates

### Threshold Form UX
- No client-side validation (empty = null is valid)
- No min < max validation (backend should handle)
- No undo functionality
- Save immediately updates backend
- Consider adding "Reset to defaults" button
- Consider showing save confirmation message

### Delete Plant Flow
- No confirmation dialog for delete plant
- Immediately navigates after delete
- Consider adding ConfirmDialog for delete plant
- Consider showing deletion in progress state
- What happens if delete fails? (user stranded on page)

### Name Editing
- Inline edit is clean but no validation
- No duplicate name check
- Empty name not prevented
- Save on Enter key not implemented
- Cancel on Escape key not implemented

### Color Coding
- Green = good, Red = bad, Gray = no data
- Consistent across current readings and status
- Color-blind accessible? (also uses text labels)
- Consider adding icons alongside colors

### Unassign vs Delete Device
- Only "Unassign" available from plant detail
- Cannot delete device from this page
- User must go to Devices page to delete
- Consider adding "Delete Device" option here
- Clarify unassign = device remains in system

### Breadcrumb Navigation
- Shows full path: Dashboard > Plants > [Name]
- Good for orientation
- Matches typical UX patterns
- Consider adding browser back button equivalent

### Chart Time Axis
- Shows AM/PM format (12-hour)
- Interval set to "preserveStartEnd"
- Recharts auto-determines tick count
- May be sparse for 24h view (only shows ~6 labels)
- Consider custom tick formatter for better density

### TypeScript Safety
- All props typed correctly
- Handles undefined values in tooltip formatter
- Null checks throughout
- Optional chaining for nested properties

### Accessibility
- Semantic HTML (table with thead/tbody)
- Buttons have titles for tooltips
- Charts have labels and legends
- Consider adding ARIA labels for screen readers
- Consider keyboard navigation for chart interaction

### Bundle Size
- Recharts adds ~180kB to bundle (gzipped)
- Acceptable for charting functionality
- Consider code-splitting if bundle grows further
- Vite warning about chunk size (598kB) is expected

### Error Handling
- Plant load error shows ErrorMessage
- Mutation errors not displayed (silent fail)
- Consider adding toast notifications for errors
- Consider retry mechanism for failed loads
- Network errors caught by React Query

### Cache Invalidation
- Updates invalidate both 'plants' and 'plants/:id'
- Ensures consistency across list and detail
- Device unassign invalidates plant devices query
- Consider optimistic updates for better UX

### Data Consistency
- Latest telemetry from plant object
- History from separate endpoint
- May show slight inconsistency if data arrives between fetches
- Acceptable for plant monitoring use case
