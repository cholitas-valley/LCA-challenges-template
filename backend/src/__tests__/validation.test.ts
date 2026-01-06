import { TelemetryPayloadSchema } from '../schema/telemetry';

describe('TelemetryPayloadSchema', () => {
  it('should validate a correct telemetry payload', () => {
    const validPayload = {
      timestamp: '2026-01-06T15:50:23.456Z',
      soil_moisture: 45.3,
      light: 67.8,
      temperature: 23.2,
    };

    const result = TelemetryPayloadSchema.safeParse(validPayload);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toEqual(validPayload);
    }
  });

  it('should reject payload with invalid timestamp format', () => {
    const invalidPayload = {
      timestamp: 'not-a-timestamp',
      soil_moisture: 45.3,
      light: 67.8,
      temperature: 23.2,
    };

    const result = TelemetryPayloadSchema.safeParse(invalidPayload);
    expect(result.success).toBe(false);
  });

  it('should reject payload with soil_moisture out of range', () => {
    const invalidPayload = {
      timestamp: '2026-01-06T15:50:23.456Z',
      soil_moisture: 150, // exceeds max 100
      light: 67.8,
      temperature: 23.2,
    };

    const result = TelemetryPayloadSchema.safeParse(invalidPayload);
    expect(result.success).toBe(false);
  });

  it('should reject payload with negative soil_moisture', () => {
    const invalidPayload = {
      timestamp: '2026-01-06T15:50:23.456Z',
      soil_moisture: -10,
      light: 67.8,
      temperature: 23.2,
    };

    const result = TelemetryPayloadSchema.safeParse(invalidPayload);
    expect(result.success).toBe(false);
  });

  it('should reject payload with light out of range', () => {
    const invalidPayload = {
      timestamp: '2026-01-06T15:50:23.456Z',
      soil_moisture: 45.3,
      light: 150, // exceeds max 100
      temperature: 23.2,
    };

    const result = TelemetryPayloadSchema.safeParse(invalidPayload);
    expect(result.success).toBe(false);
  });

  it('should reject payload with temperature out of range', () => {
    const invalidPayload = {
      timestamp: '2026-01-06T15:50:23.456Z',
      soil_moisture: 45.3,
      light: 67.8,
      temperature: 150, // exceeds max 100
    };

    const result = TelemetryPayloadSchema.safeParse(invalidPayload);
    expect(result.success).toBe(false);
  });

  it('should reject payload with missing required fields', () => {
    const invalidPayload = {
      timestamp: '2026-01-06T15:50:23.456Z',
      soil_moisture: 45.3,
      // missing light and temperature
    };

    const result = TelemetryPayloadSchema.safeParse(invalidPayload);
    expect(result.success).toBe(false);
  });

  it('should validate payload at boundary values', () => {
    const boundaryPayload = {
      timestamp: '2026-01-06T15:50:23.456Z',
      soil_moisture: 0,
      light: 100,
      temperature: -50,
    };

    const result = TelemetryPayloadSchema.safeParse(boundaryPayload);
    expect(result.success).toBe(true);
  });
});
