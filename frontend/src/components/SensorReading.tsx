interface SensorReadingProps {
  label: string;
  value: number | null;
  unit: string;
  min?: number;
  max?: number;
}

export function SensorReading({ label, value, unit, min, max }: SensorReadingProps) {
  if (value === null) {
    return (
      <div className="flex items-center justify-between py-2">
        <span className="text-sm text-gray-600">{label}:</span>
        <span className="text-sm text-gray-400">No data</span>
      </div>
    );
  }

  // Calculate percentage for visual bar
  let percentage = 50; // default to middle if no range
  if (min !== undefined && max !== undefined && min !== max) {
    percentage = ((value - min) / (max - min)) * 100;
    percentage = Math.max(0, Math.min(100, percentage)); // clamp 0-100
  }

  return (
    <div className="py-2">
      <div className="flex items-center justify-between mb-1">
        <span className="text-sm text-gray-600">{label}:</span>
        <span className="text-sm font-medium text-gray-900">
          {value.toFixed(1)}{unit}
        </span>
      </div>
      {min !== undefined && max !== undefined && (
        <div className="w-full bg-gray-200 rounded-full h-1.5">
          <div
            className="bg-green-600 h-1.5 rounded-full transition-all"
            style={{ width: `${percentage}%` }}
            role="progressbar"
            aria-valuenow={value}
            aria-valuemin={min}
            aria-valuemax={max}
          />
        </div>
      )}
    </div>
  );
}
