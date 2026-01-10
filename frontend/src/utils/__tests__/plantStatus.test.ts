/**
 * Plant Status Utility Tests
 *
 * Tests for getPlantStatus and formatRelativeTime functions.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { getPlantStatus, formatRelativeTime } from '../plantStatus';
import { Plant } from '../../types/plant';
import { TelemetryRecord } from '../../types/telemetry';

// Base plant for tests
const basePlant: Omit<Plant, 'latest_telemetry' | 'thresholds'> = {
  id: 'plant-1',
  name: 'Test Plant',
  species: 'Monstera',
  position: { x: 100, y: 100 },
  created_at: '2024-01-01T00:00:00Z',
  device_count: 1,
};

// Telemetry record factory
function createTelemetry(overrides: Partial<TelemetryRecord> = {}): TelemetryRecord {
  return {
    time: new Date().toISOString(),
    device_id: 'device-1',
    plant_id: 'plant-1',
    soil_moisture: 50,
    temperature: 22,
    humidity: 60,
    light_level: 1000,
    ...overrides,
  };
}

describe('getPlantStatus', () => {
  it('returns offline when no telemetry', () => {
    const plant: Plant = {
      ...basePlant,
      thresholds: null,
      latest_telemetry: null,
    };

    expect(getPlantStatus(plant)).toBe('offline');
  });

  it('returns offline when latest_telemetry is undefined', () => {
    const plant: Plant = {
      ...basePlant,
      thresholds: null,
      latest_telemetry: undefined,
    };

    expect(getPlantStatus(plant)).toBe('offline');
  });

  it('returns online when all values in range (with telemetry, no thresholds)', () => {
    const plant: Plant = {
      ...basePlant,
      thresholds: null,
      latest_telemetry: createTelemetry(),
    };

    expect(getPlantStatus(plant)).toBe('online');
  });

  it('returns online when all values within thresholds', () => {
    const plant: Plant = {
      ...basePlant,
      thresholds: {
        soil_moisture: { min: 30, max: 70 },
        temperature: { min: 18, max: 28 },
        humidity: { min: 40, max: 80 },
        light_level: { min: 500, max: 2000 },
      },
      latest_telemetry: createTelemetry({
        soil_moisture: 50,
        temperature: 22,
        humidity: 60,
        light_level: 1000,
      }),
    };

    expect(getPlantStatus(plant)).toBe('online');
  });

  it('returns warning when soil_moisture is below threshold', () => {
    const plant: Plant = {
      ...basePlant,
      thresholds: {
        soil_moisture: { min: 30, max: 70 },
      },
      latest_telemetry: createTelemetry({
        soil_moisture: 25, // Below min but not critical
      }),
    };

    expect(getPlantStatus(plant)).toBe('warning');
  });

  it('returns warning when temperature is above threshold', () => {
    const plant: Plant = {
      ...basePlant,
      thresholds: {
        temperature: { min: 18, max: 28 },
      },
      latest_telemetry: createTelemetry({
        temperature: 30, // Above max but not critical
      }),
    };

    expect(getPlantStatus(plant)).toBe('warning');
  });

  it('returns critical when values far outside thresholds', () => {
    const plant: Plant = {
      ...basePlant,
      thresholds: {
        soil_moisture: { min: 30, max: 70 },
      },
      latest_telemetry: createTelemetry({
        soil_moisture: 5, // Way below min (critical = beyond 10% margin)
      }),
    };

    expect(getPlantStatus(plant)).toBe('critical');
  });

  it('returns critical when temperature is critically high', () => {
    const plant: Plant = {
      ...basePlant,
      thresholds: {
        temperature: { min: 18, max: 28 },
      },
      latest_telemetry: createTelemetry({
        temperature: 42, // Way above max (10 units = 10% of range)
      }),
    };

    expect(getPlantStatus(plant)).toBe('critical');
  });

  it('handles null sensor values gracefully', () => {
    const plant: Plant = {
      ...basePlant,
      thresholds: {
        soil_moisture: { min: 30, max: 70 },
      },
      latest_telemetry: createTelemetry({
        soil_moisture: null,
        temperature: 22,
        humidity: 60,
        light_level: 1000,
      }),
    };

    // Should be online since no warning/critical conditions detected
    expect(getPlantStatus(plant)).toBe('online');
  });

  it('handles partial thresholds correctly', () => {
    const plant: Plant = {
      ...basePlant,
      thresholds: {
        soil_moisture: { min: 30, max: null }, // Only min defined
      },
      latest_telemetry: createTelemetry({
        soil_moisture: 20, // Below min
      }),
    };

    expect(getPlantStatus(plant)).toBe('warning');
  });

  it('prioritizes critical over warning status', () => {
    const plant: Plant = {
      ...basePlant,
      thresholds: {
        soil_moisture: { min: 30, max: 70 },
        temperature: { min: 18, max: 28 },
      },
      latest_telemetry: createTelemetry({
        soil_moisture: 5, // Critical
        temperature: 30, // Warning
      }),
    };

    expect(getPlantStatus(plant)).toBe('critical');
  });
});

describe('formatRelativeTime', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2024-06-15T12:00:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns "Just now" for timestamps less than 1 minute ago', () => {
    const timestamp = new Date('2024-06-15T11:59:30Z').toISOString(); // 30 seconds ago
    expect(formatRelativeTime(timestamp)).toBe('Just now');
  });

  it('returns "X min ago" for timestamps within an hour', () => {
    const timestamp2min = new Date('2024-06-15T11:58:00Z').toISOString();
    expect(formatRelativeTime(timestamp2min)).toBe('2 min ago');

    const timestamp30min = new Date('2024-06-15T11:30:00Z').toISOString();
    expect(formatRelativeTime(timestamp30min)).toBe('30 min ago');

    const timestamp59min = new Date('2024-06-15T11:01:00Z').toISOString();
    expect(formatRelativeTime(timestamp59min)).toBe('59 min ago');
  });

  it('returns "Xh ago" for timestamps within 24 hours', () => {
    const timestamp1h = new Date('2024-06-15T11:00:00Z').toISOString();
    expect(formatRelativeTime(timestamp1h)).toBe('1h ago');

    const timestamp5h = new Date('2024-06-15T07:00:00Z').toISOString();
    expect(formatRelativeTime(timestamp5h)).toBe('5h ago');

    const timestamp23h = new Date('2024-06-14T13:00:00Z').toISOString();
    expect(formatRelativeTime(timestamp23h)).toBe('23h ago');
  });

  it('returns "Xd ago" for timestamps older than 24 hours', () => {
    const timestamp1d = new Date('2024-06-14T12:00:00Z').toISOString();
    expect(formatRelativeTime(timestamp1d)).toBe('1d ago');

    const timestamp7d = new Date('2024-06-08T12:00:00Z').toISOString();
    expect(formatRelativeTime(timestamp7d)).toBe('7d ago');
  });
});
