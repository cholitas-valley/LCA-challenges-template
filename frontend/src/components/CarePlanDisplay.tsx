import type { CarePlan } from '../types';

interface CarePlanDisplayProps {
  carePlan: CarePlan;
  onRegenerate: () => void;
  isRegenerating: boolean;
}

export function CarePlanDisplay({ carePlan, onRegenerate, isRegenerating }: CarePlanDisplayProps) {
  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  const getTimeAgo = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      const diffDays = Math.floor(diffHours / 24);

      if (diffHours < 1) return 'just now';
      if (diffHours < 24) return diffHours + ' hour' + (diffHours > 1 ? 's' : '') + ' ago';
      if (diffDays < 7) return diffDays + ' day' + (diffDays > 1 ? 's' : '') + ' ago';
      return formatDate(dateStr);
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="border-b border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Care Plan</h2>
            <p className="text-sm text-gray-500 mt-1">
              Generated: {getTimeAgo(carePlan.generated_at)}
            </p>
          </div>
          <button
            onClick={onRegenerate}
            disabled={isRegenerating}
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-gray-400"
          >
            {isRegenerating ? 'Generating...' : 'Regenerate'}
          </button>
        </div>
      </div>

      <div className="border-b border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Summary</h3>
        <p className="text-gray-700">{carePlan.summary}</p>
      </div>

      <div className="border-b border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <span>💧</span> Watering
        </h3>
        <div className="space-y-2">
          <div>
            <span className="font-medium text-gray-700">Frequency:</span>{' '}
            <span className="text-gray-900">{carePlan.watering.frequency}</span>
          </div>
          <div>
            <span className="font-medium text-gray-700">Amount:</span>{' '}
            <span className="text-gray-900">{carePlan.watering.amount}</span>
          </div>
          {carePlan.watering.next_date && (
            <div>
              <span className="font-medium text-gray-700">Next watering:</span>{' '}
              <span className="text-gray-900">{formatDate(carePlan.watering.next_date)}</span>
            </div>
          )}
        </div>
      </div>

      <div className="border-b border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <span>☀️</span> Light
        </h3>
        <div className="space-y-2">
          <div>
            <span className="font-medium text-gray-700">Current:</span>{' '}
            <span className="text-gray-900">{carePlan.light.current}</span>
          </div>
          <div>
            <span className="font-medium text-gray-700">Ideal:</span>{' '}
            <span className="text-gray-900">{carePlan.light.ideal}</span>
          </div>
          <div>
            <span className="font-medium text-gray-700">Tip:</span>{' '}
            <span className="text-gray-900">{carePlan.light.recommendation}</span>
          </div>
        </div>
      </div>

      <div className="border-b border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <span>💨</span> Humidity
        </h3>
        <div className="space-y-2">
          <div>
            <span className="font-medium text-gray-700">Current:</span>{' '}
            <span className="text-gray-900">{carePlan.humidity.current}</span>
          </div>
          <div>
            <span className="font-medium text-gray-700">Ideal:</span>{' '}
            <span className="text-gray-900">{carePlan.humidity.ideal}</span>
          </div>
          <div>
            <span className="font-medium text-gray-700">Tip:</span>{' '}
            <span className="text-gray-900">{carePlan.humidity.recommendation}</span>
          </div>
        </div>
      </div>

      {carePlan.temperature && (
        <div className="border-b border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <span>🌡️</span> Temperature
          </h3>
          <div className="space-y-2">
            <div>
              <span className="font-medium text-gray-700">Current:</span>{' '}
              <span className="text-gray-900">{carePlan.temperature.current}</span>
            </div>
            <div>
              <span className="font-medium text-gray-700">Ideal:</span>{' '}
              <span className="text-gray-900">{carePlan.temperature.ideal}</span>
            </div>
            <div>
              <span className="font-medium text-gray-700">Tip:</span>{' '}
              <span className="text-gray-900">{carePlan.temperature.recommendation}</span>
            </div>
          </div>
        </div>
      )}

      {carePlan.alerts.length > 0 && (
        <div className="border-b border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <span>⚠️</span> Current Alerts
          </h3>
          <ul className="list-disc list-inside space-y-1">
            {carePlan.alerts.map((alert, index) => (
              <li key={index} className="text-red-700">
                {alert}
              </li>
            ))}
          </ul>
        </div>
      )}

      {carePlan.tips.length > 0 && (
        <div className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <span>💡</span> Care Tips
          </h3>
          <ul className="list-disc list-inside space-y-1">
            {carePlan.tips.map((tip, index) => (
              <li key={index} className="text-gray-700">
                {tip}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
