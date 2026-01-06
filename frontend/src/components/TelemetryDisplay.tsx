import { LucideIcon } from 'lucide-react';
import { memo } from 'react';

interface TelemetryDisplayProps {
  value: number;
  unit: string;
  icon: LucideIcon;
  threshold_min?: number;
  threshold_max?: number;
  label: string;
}

export const TelemetryDisplay = memo(function TelemetryDisplay({
  value,
  unit,
  icon: Icon,
  threshold_min,
  threshold_max,
  label,
}: TelemetryDisplayProps) {
  // Determine color based on threshold status
  let statusColor = 'text-gray-700';
  let bgColor = 'bg-gray-50';
  
  if (threshold_min !== undefined && value < threshold_min) {
    statusColor = 'text-red-700';
    bgColor = 'bg-red-50';
  } else if (threshold_max !== undefined && value > threshold_max) {
    statusColor = 'text-red-700';
    bgColor = 'bg-red-50';
  } else if (threshold_min !== undefined && threshold_max !== undefined) {
    // Check for warning range (80-100% towards threshold)
    const range = threshold_max - threshold_min;
    const minWarning = threshold_min + range * 0.2;
    const maxWarning = threshold_max - range * 0.2;
    
    if (value <= minWarning || value >= maxWarning) {
      statusColor = 'text-yellow-700';
      bgColor = 'bg-yellow-50';
    } else {
      statusColor = 'text-green-700';
      bgColor = 'bg-green-50';
    }
  } else if (threshold_min !== undefined) {
    // Only min threshold (like light)
    const warningThreshold = threshold_min * 1.2;
    if (value < warningThreshold) {
      statusColor = 'text-yellow-700';
      bgColor = 'bg-yellow-50';
    } else {
      statusColor = 'text-green-700';
      bgColor = 'bg-green-50';
    }
  }

  return (
    <div className={`flex items-center space-x-2 p-2 rounded ${bgColor}`} data-testid="telemetry-item">
      <Icon className={`w-5 h-5 ${statusColor}`} />
      <div className="flex-1">
        <p className="text-xs text-gray-600">{label}</p>
        <p className={`text-sm font-semibold ${statusColor}`} data-testid="telemetry-value">
          {value}
          {unit}
        </p>
      </div>
    </div>
  );
});
