import { AlertCircle } from 'lucide-react';

export function EmptyChartState() {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4">
      <AlertCircle className="w-12 h-12 text-gray-400 mb-4" />
      <p className="text-lg text-gray-600 font-medium mb-2">
        No telemetry history available
      </p>
      <p className="text-sm text-gray-500 text-center max-w-md">
        Historical data will appear here once sensors start reporting measurements.
      </p>
    </div>
  );
}
