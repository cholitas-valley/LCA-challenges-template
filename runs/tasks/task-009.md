---
task_id: task-009
title: 24-hour history charts with Recharts and time-series visualization
role: lca-frontend
follow_roles: []
post: [lca-docs]
depends_on: [task-008]
inputs:
  - runs/handoffs/task-008.md
  - runs/plan.md
allowed_paths:
  - frontend/src/**
  - frontend/package.json
check_command: make typecheck && npm run build --prefix frontend
handoff: runs/handoffs/task-009.md
---

## Goal

Add interactive 24-hour history charts to the dashboard using Recharts library. Display time-series telemetry data with threshold indicators, and provide time range selection (1h, 6h, 24h, 7d).

## Context

Task-008 completed the plant card UI with real-time telemetry display. Now we add historical context by visualizing sensor trends over time. This helps users identify patterns, diagnose issues, and verify that recent threshold adjustments are working.

The backend provides `GET /api/plants/:id/history?hours=24` endpoint that returns time-series data.

## Requirements

### 1. Install Recharts
Add dependency to `frontend/package.json`:
- `recharts@^2.10.0` - React charting library

### 2. Plant History Modal
Create `frontend/src/components/PlantHistoryModal.tsx`:
- Props: `plant`, `isOpen`, `onClose`
- Large modal (80% viewport)
- Header: Plant name, close button
- Time range selector: 1h / 6h / 24h / 7d buttons
- Three stacked charts (one per metric):
  - Soil Moisture (%)
  - Light (%)
  - Temperature (°C)
- Each chart shows:
  - Line graph of metric over time
  - Threshold lines (min/max as dashed horizontal lines)
  - X-axis: Time labels
  - Y-axis: Metric value with unit
- Loading state while fetching history data
- Error state if API call fails
- Empty state if no historical data available

### 3. History Chart Component
Create `frontend/src/components/HistoryChart.tsx`:
- Props: `data`, `metricKey`, `unit`, `thresholdMin`, `thresholdMax`, `label`
- Uses Recharts components:
  - `LineChart` with responsive container
  - `Line` for telemetry data
  - `ReferenceLine` for threshold min/max (dashed)
  - `XAxis` with time formatter
  - `YAxis` with unit label
  - `Tooltip` showing timestamp + value
  - `CartesianGrid` for readability

### 4. Time Range Selector
Create `frontend/src/components/TimeRangeSelector.tsx`:
- Props: `selected`, `onChange`
- Button group with options: "1h", "6h", "24h", "7d"
- Active button highlighted
- Triggers refetch of history data with new hours parameter

### 5. Data Transformation Utility
Create `frontend/src/utils/chartData.ts`:
- Function: `transformTelemetryForChart(telemetry: Telemetry[]): ChartDataPoint[]`
- Converts API response to Recharts format
- Sorts data by timestamp ascending
- Handles missing data points

### 6. Add Chart Button to Plant Card
Update `frontend/src/components/PlantCard.tsx`:
- Add "View History" button
- Button opens PlantHistoryModal for that plant
- Icon: TrendingUp from lucide-react

### 7. Chart Responsive Design
- Ensure charts adapt to modal width
- Use Recharts `ResponsiveContainer` with 100% width/height
- Touch-friendly tooltip interactions

### 8. Empty State Handling
Create `frontend/src/components/EmptyChartState.tsx`:
- Display when no historical data available
- Message: "No telemetry history available"
- Icon: AlertCircle from lucide-react

## Constraints

- **Use Recharts library only** - No D3, Chart.js, or other charting libraries
- **Match plant card styling** - Consistent colors, fonts, spacing
- **TypeScript strict mode** - All chart props typed
- **No backend changes** - Use existing history endpoint
- **Responsive charts** - Work on mobile, tablet, desktop

## Definition of Done

- [ ] Recharts installed and configured
- [ ] PlantHistoryModal displays on "View History" button click
- [ ] HistoryChart renders three separate charts (moisture, light, temperature)
- [ ] Time range selector switches between 1h, 6h, 24h, 7d
- [ ] Threshold lines displayed as dashed horizontal lines on charts
- [ ] Custom tooltip shows timestamp, value
- [ ] Charts responsive across screen sizes
- [ ] Empty state displayed when no historical data
- [ ] Data transformation utility handles missing/null values
- [ ] All components pass TypeScript type checking
- [ ] `make typecheck` passes
- [ ] `npm run build --prefix frontend` succeeds
- [ ] Dashboard shows "View History" button on each plant card
- [ ] Clicking button opens modal with 24h charts by default
- [ ] Switching time ranges updates charts correctly
- [ ] Handoff document created at `runs/handoffs/task-009.md`
