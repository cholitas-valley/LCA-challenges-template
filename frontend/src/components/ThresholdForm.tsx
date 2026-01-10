import { useState, useEffect } from 'react';
import type { PlantThresholds } from '../types';
import { Button } from './ui';

interface ThresholdFormProps {
  thresholds: PlantThresholds | null;
  onSave: (thresholds: PlantThresholds) => void;
  isLoading?: boolean;
}

interface ThresholdInputs {
  soil_moisture_min: string;
  soil_moisture_max: string;
  temperature_min: string;
  temperature_max: string;
  humidity_min: string;
  humidity_max: string;
  light_level_min: string;
  light_level_max: string;
}

export function ThresholdForm({ thresholds, onSave, isLoading = false }: ThresholdFormProps) {
  const [inputs, setInputs] = useState<ThresholdInputs>({
    soil_moisture_min: '',
    soil_moisture_max: '',
    temperature_min: '',
    temperature_max: '',
    humidity_min: '',
    humidity_max: '',
    light_level_min: '',
    light_level_max: '',
  });

  // Initialize form with existing thresholds
  useEffect(() => {
    if (thresholds) {
      setInputs({
        soil_moisture_min: thresholds.soil_moisture?.min?.toString() ?? '',
        soil_moisture_max: thresholds.soil_moisture?.max?.toString() ?? '',
        temperature_min: thresholds.temperature?.min?.toString() ?? '',
        temperature_max: thresholds.temperature?.max?.toString() ?? '',
        humidity_min: thresholds.humidity?.min?.toString() ?? '',
        humidity_max: thresholds.humidity?.max?.toString() ?? '',
        light_level_min: thresholds.light_level?.min?.toString() ?? '',
        light_level_max: thresholds.light_level?.max?.toString() ?? '',
      });
    }
  }, [thresholds]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const newThresholds: PlantThresholds = {
      soil_moisture: {
        min: inputs.soil_moisture_min ? parseFloat(inputs.soil_moisture_min) : null,
        max: inputs.soil_moisture_max ? parseFloat(inputs.soil_moisture_max) : null,
      },
      temperature: {
        min: inputs.temperature_min ? parseFloat(inputs.temperature_min) : null,
        max: inputs.temperature_max ? parseFloat(inputs.temperature_max) : null,
      },
      humidity: {
        min: inputs.humidity_min ? parseFloat(inputs.humidity_min) : null,
        max: inputs.humidity_max ? parseFloat(inputs.humidity_max) : null,
      },
      light_level: {
        min: inputs.light_level_min ? parseFloat(inputs.light_level_min) : null,
        max: inputs.light_level_max ? parseFloat(inputs.light_level_max) : null,
      },
    };

    onSave(newThresholds);
  };

  const handleChange = (field: keyof ThresholdInputs, value: string) => {
    setInputs((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Threshold Configuration</h3>
      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Soil Moisture */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Soil Moisture (%)
            </label>
            <div className="grid grid-cols-2 gap-2">
              <input
                type="number"
                step="0.1"
                placeholder="Min"
                value={inputs.soil_moisture_min}
                onChange={(e) => handleChange('soil_moisture_min', e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              />
              <input
                type="number"
                step="0.1"
                placeholder="Max"
                value={inputs.soil_moisture_max}
                onChange={(e) => handleChange('soil_moisture_max', e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
          </div>

          {/* Temperature */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Temperature (°C)
            </label>
            <div className="grid grid-cols-2 gap-2">
              <input
                type="number"
                step="0.1"
                placeholder="Min"
                value={inputs.temperature_min}
                onChange={(e) => handleChange('temperature_min', e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              />
              <input
                type="number"
                step="0.1"
                placeholder="Max"
                value={inputs.temperature_max}
                onChange={(e) => handleChange('temperature_max', e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
          </div>

          {/* Humidity */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Humidity (%)
            </label>
            <div className="grid grid-cols-2 gap-2">
              <input
                type="number"
                step="0.1"
                placeholder="Min"
                value={inputs.humidity_min}
                onChange={(e) => handleChange('humidity_min', e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              />
              <input
                type="number"
                step="0.1"
                placeholder="Max"
                value={inputs.humidity_max}
                onChange={(e) => handleChange('humidity_max', e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
          </div>

          {/* Light Level */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Light Level (lux)
            </label>
            <div className="grid grid-cols-2 gap-2">
              <input
                type="number"
                step="1"
                placeholder="Min"
                value={inputs.light_level_min}
                onChange={(e) => handleChange('light_level_min', e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              />
              <input
                type="number"
                step="1"
                placeholder="Max"
                value={inputs.light_level_max}
                onChange={(e) => handleChange('light_level_max', e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
          </div>
        </div>

        <div className="mt-6">
          <Button type="submit" variant="primary" loading={isLoading}>
            {isLoading ? 'Saving...' : 'Save Thresholds'}
          </Button>
        </div>
      </form>
    </div>
  );
}
