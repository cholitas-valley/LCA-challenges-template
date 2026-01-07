import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from 'recharts';
import type { TelemetryRecord, ThresholdConfig } from '../types';

interface TelemetryChartProps {
  data: TelemetryRecord[];
  metricKey: 'soil_moisture' | 'temperature' | 'humidity' | 'light_level';
  metricLabel: string;
  threshold?: ThresholdConfig;
  unit?: string;
}

export function TelemetryChart({ data, metricKey, metricLabel, threshold, unit = '' }: TelemetryChartProps) {
  // Transform data for recharts
  const chartData = data
    .filter((record) => record[metricKey] !== null)
    .map((record) => ({
      time: new Date(record.time).toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        minute: '2-digit',
        hour12: true 
      }),
      value: record[metricKey],
      timestamp: new Date(record.time).getTime(),
    }))
    .sort((a, b) => a.timestamp - b.timestamp);

  if (chartData.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">{metricLabel}</h3>
        <div className="h-64 flex items-center justify-center">
          <p className="text-gray-500">No data available</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">{metricLabel}</h3>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis 
            dataKey="time" 
            tick={{ fontSize: 12 }}
            interval="preserveStartEnd"
          />
          <YAxis 
            tick={{ fontSize: 12 }}
            label={{ value: unit, angle: -90, position: 'insideLeft' }}
          />
          <Tooltip
            formatter={(value: number | undefined) => value !== undefined ? [`${value}${unit}`, metricLabel] : ['N/A', metricLabel]}
            labelStyle={{ color: '#374151' }}
          />
          <Legend />
          
          {/* Threshold lines */}
          {threshold?.min !== null && threshold?.min !== undefined && (
            <ReferenceLine 
              y={threshold.min} 
              stroke="#ef4444" 
              strokeDasharray="5 5"
              label={{ value: 'Min', position: 'right', fill: '#ef4444', fontSize: 12 }}
            />
          )}
          {threshold?.max !== null && threshold?.max !== undefined && (
            <ReferenceLine 
              y={threshold.max} 
              stroke="#ef4444" 
              strokeDasharray="5 5"
              label={{ value: 'Max', position: 'right', fill: '#ef4444', fontSize: 12 }}
            />
          )}
          
          <Line 
            type="monotone" 
            dataKey="value" 
            stroke="#10b981" 
            strokeWidth={2}
            dot={{ r: 3 }}
            activeDot={{ r: 5 }}
            name={metricLabel}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
