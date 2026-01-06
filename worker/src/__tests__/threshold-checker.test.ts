import { checkThresholds } from '../evaluator/threshold-checker';
import type { Plant, Telemetry } from '../db/worker-repository';

describe('checkThresholds', () => {
  const basePlant: Plant = {
    id: 'plant-001',
    name: 'Test Plant',
    soil_moisture_min: 30,
    soil_moisture_max: 70,
    light_min: 40,
    temperature_min: 15,
    temperature_max: 30,
    alert_cooldown_minutes: 60,
    last_alert_sent_at: null,
  };

  const baseTelemetry: Telemetry = {
    timestamp: new Date('2026-01-06T10:00:00Z'),
    plant_id: 'plant-001',
    soil_moisture: 50,
    light: 60,
    temperature: 22,
  };

  it('should return empty array when all values are within thresholds', () => {
    const breaches = checkThresholds(basePlant, baseTelemetry);
    expect(breaches).toHaveLength(0);
  });

  it('should detect low soil moisture breach', () => {
    const telemetry = { ...baseTelemetry, soil_moisture: 20 };
    const breaches = checkThresholds(basePlant, telemetry);

    expect(breaches).toHaveLength(1);
    expect(breaches[0].alertType).toBe('soil_moisture_low');
    expect(breaches[0].message).toContain('Soil moisture is low');
    expect(breaches[0].value).toBe(20);
  });

  it('should detect high soil moisture breach', () => {
    const telemetry = { ...baseTelemetry, soil_moisture: 80 };
    const breaches = checkThresholds(basePlant, telemetry);

    expect(breaches).toHaveLength(1);
    expect(breaches[0].alertType).toBe('soil_moisture_high');
    expect(breaches[0].message).toContain('Soil moisture is high');
    expect(breaches[0].value).toBe(80);
  });

  it('should detect low light breach', () => {
    const telemetry = { ...baseTelemetry, light: 30 };
    const breaches = checkThresholds(basePlant, telemetry);

    expect(breaches).toHaveLength(1);
    expect(breaches[0].alertType).toBe('light_low');
    expect(breaches[0].message).toContain('Light level is low');
    expect(breaches[0].value).toBe(30);
  });

  it('should detect low temperature breach', () => {
    const telemetry = { ...baseTelemetry, temperature: 10 };
    const breaches = checkThresholds(basePlant, telemetry);

    expect(breaches).toHaveLength(1);
    expect(breaches[0].alertType).toBe('temp_low');
    expect(breaches[0].message).toContain('Temperature is low');
    expect(breaches[0].value).toBe(10);
  });

  it('should detect high temperature breach', () => {
    const telemetry = { ...baseTelemetry, temperature: 35 };
    const breaches = checkThresholds(basePlant, telemetry);

    expect(breaches).toHaveLength(1);
    expect(breaches[0].alertType).toBe('temp_high');
    expect(breaches[0].message).toContain('Temperature is high');
    expect(breaches[0].value).toBe(35);
  });

  it('should detect multiple simultaneous breaches', () => {
    const telemetry = {
      ...baseTelemetry,
      soil_moisture: 20, // too low
      light: 30,         // too low
      temperature: 35,   // too high
    };
    const breaches = checkThresholds(basePlant, telemetry);

    expect(breaches).toHaveLength(3);
    expect(breaches.map(b => b.alertType)).toContain('soil_moisture_low');
    expect(breaches.map(b => b.alertType)).toContain('light_low');
    expect(breaches.map(b => b.alertType)).toContain('temp_high');
  });

  it('should not breach at exact threshold boundaries', () => {
    const telemetry = {
      ...baseTelemetry,
      soil_moisture: 30, // exactly at minimum
      light: 40,         // exactly at minimum
      temperature: 15,   // exactly at minimum
    };
    const breaches = checkThresholds(basePlant, telemetry);

    expect(breaches).toHaveLength(0);
  });

  it('should not breach at exact max threshold boundaries', () => {
    const telemetry = {
      ...baseTelemetry,
      soil_moisture: 70, // exactly at maximum
      temperature: 30,   // exactly at maximum
    };
    const breaches = checkThresholds(basePlant, telemetry);

    expect(breaches).toHaveLength(0);
  });

  it('should handle edge case with zero values', () => {
    const telemetry = {
      ...baseTelemetry,
      soil_moisture: 0,
      light: 0,
      temperature: 0,
    };
    const breaches = checkThresholds(basePlant, telemetry);

    // All should breach as they're below minimums
    expect(breaches.length).toBeGreaterThanOrEqual(2);
    expect(breaches.some(b => b.alertType === 'soil_moisture_low')).toBe(true);
    expect(breaches.some(b => b.alertType === 'light_low')).toBe(true);
  });
});
