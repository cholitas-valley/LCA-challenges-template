import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import { ChartDataPoint } from '../utils/chartData';

interface HistoryChartProps {
  data: ChartDataPoint[];
  metricKey: 'soil_moisture' | 'light' | 'temperature';
  unit: string;
  thresholdMin?: number;
  thresholdMax?: number;
  label: string;
}

export function HistoryChart({
  data,
  metricKey,
  unit,
  thresholdMin,
  thresholdMax,
  label,
}: HistoryChartProps) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <h4 className="text-sm font-semibold text-gray-700 mb-3">{label}</h4>
      <ResponsiveContainer width="100%" height={200}>
        <LineChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis
            dataKey="time"
            tick={{ fontSize: 12, fill: '#6b7280' }}
            tickLine={{ stroke: '#9ca3af' }}
            axisLine={{ stroke: '#9ca3af' }}
          />
          <YAxis
            label={{ value: unit, angle: -90, position: 'insideLeft', style: { fontSize: 12, fill: '#6b7280' } }}
            tick={{ fontSize: 12, fill: '#6b7280' }}
            tickLine={{ stroke: '#9ca3af' }}
            axisLine={{ stroke: '#9ca3af' }}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#ffffff',
              border: '1px solid #e5e7eb',
              borderRadius: '0.375rem',
              fontSize: '12px',
            }}
            labelStyle={{ color: '#374151', fontWeight: 600 }}
            formatter={(value: number) => [value + ' ' + unit, label]}
          />
          {thresholdMin !== undefined && (
            <ReferenceLine
              y={thresholdMin}
              stroke="#ef4444"
              strokeDasharray="5 5"
              strokeWidth={2}
              label={{ value: 'Min', position: 'right', fill: '#ef4444', fontSize: 11 }}
            />
          )}
          {thresholdMax !== undefined && (
            <ReferenceLine
              y={thresholdMax}
              stroke="#ef4444"
              strokeDasharray="5 5"
              strokeWidth={2}
              label={{ value: 'Max', position: 'right', fill: '#ef4444', fontSize: 11 }}
            />
          )}
          <Line
            type="monotone"
            dataKey={metricKey}
            stroke="#16a34a"
            strokeWidth={2}
            dot={{ r: 3, fill: '#16a34a' }}
            activeDot={{ r: 5, fill: '#16a34a' }}
            connectNulls={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
