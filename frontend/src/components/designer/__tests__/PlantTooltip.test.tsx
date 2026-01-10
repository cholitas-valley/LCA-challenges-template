/**
 * PlantTooltip Component Tests
 *
 * Tests for the PlantTooltip component that displays sensor readings on hover.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { PlantTooltip } from '../PlantTooltip';
import { Plant } from '../../../types/plant';

// Mock plant with telemetry data
const mockPlantWithTelemetry: Plant = {
  id: 'plant-1',
  name: 'Test Plant',
  species: 'Monstera',
  thresholds: null,
  position: { x: 100, y: 100 },
  created_at: '2024-01-01T00:00:00Z',
  device_count: 1,
  latest_telemetry: {
    time: new Date(Date.now() - 2 * 60 * 1000).toISOString(), // 2 minutes ago
    device_id: 'device-1',
    plant_id: 'plant-1',
    soil_moisture: 45.5,
    temperature: 22.3,
    humidity: 60,
    light_level: 1500,
  },
};

// Mock plant without telemetry (offline)
const mockPlantWithoutTelemetry: Plant = {
  id: 'plant-2',
  name: 'Offline Plant',
  species: 'Snake Plant',
  thresholds: null,
  position: { x: 200, y: 200 },
  created_at: '2024-01-01T00:00:00Z',
  device_count: 0,
  latest_telemetry: null,
};

// Mock plant with partial telemetry (some values null)
const mockPlantPartialTelemetry: Plant = {
  id: 'plant-3',
  name: 'Partial Data Plant',
  species: 'Fern',
  thresholds: null,
  position: { x: 300, y: 300 },
  created_at: '2024-01-01T00:00:00Z',
  device_count: 1,
  latest_telemetry: {
    time: new Date(Date.now() - 5 * 60 * 1000).toISOString(), // 5 minutes ago
    device_id: 'device-2',
    plant_id: 'plant-3',
    soil_moisture: 30,
    temperature: null,
    humidity: null,
    light_level: 800,
  },
};

// Wrapper to provide SVG context for foreignObject
function SVGWrapper({ children }: { children: React.ReactNode }) {
  return (
    <svg viewBox="0 0 800 600" data-testid="svg-wrapper">
      {children}
    </svg>
  );
}

describe('PlantTooltip', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date());
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders plant name and sensor readings', () => {
    render(
      <SVGWrapper>
        <PlantTooltip
          plant={mockPlantWithTelemetry}
          visible={true}
          position={{ x: 60, y: -20 }}
        />
      </SVGWrapper>
    );

    // Check plant name
    expect(screen.getByText('Test Plant')).toBeInTheDocument();

    // Check sensor readings
    expect(screen.getByText('Soil:')).toBeInTheDocument();
    expect(screen.getByText('46%')).toBeInTheDocument(); // soil_moisture rounded

    expect(screen.getByText('Temp:')).toBeInTheDocument();
    expect(screen.getByText('22.3C')).toBeInTheDocument();

    expect(screen.getByText('Humidity:')).toBeInTheDocument();
    expect(screen.getByText('60%')).toBeInTheDocument();

    expect(screen.getByText('Light:')).toBeInTheDocument();
    expect(screen.getByText('1500 lx')).toBeInTheDocument();
  });

  it('shows "No sensor data" when telemetry is null', () => {
    render(
      <SVGWrapper>
        <PlantTooltip
          plant={mockPlantWithoutTelemetry}
          visible={true}
          position={{ x: 60, y: -20 }}
        />
      </SVGWrapper>
    );

    expect(screen.getByText('Offline Plant')).toBeInTheDocument();
    expect(screen.getByText('No sensor data')).toBeInTheDocument();
    expect(screen.getByText('Last: No data')).toBeInTheDocument();
  });

  it('formats relative time correctly', () => {
    render(
      <SVGWrapper>
        <PlantTooltip
          plant={mockPlantWithTelemetry}
          visible={true}
          position={{ x: 60, y: -20 }}
        />
      </SVGWrapper>
    );

    // Should show "2 min ago"
    expect(screen.getByText('Last: 2 min ago')).toBeInTheDocument();
  });

  it('returns null when not visible', () => {
    const { container } = render(
      <SVGWrapper>
        <PlantTooltip
          plant={mockPlantWithTelemetry}
          visible={false}
          position={{ x: 60, y: -20 }}
        />
      </SVGWrapper>
    );

    // Should not render the tooltip content
    expect(screen.queryByText('Test Plant')).not.toBeInTheDocument();
  });

  it('shows dashes for null sensor values', () => {
    render(
      <SVGWrapper>
        <PlantTooltip
          plant={mockPlantPartialTelemetry}
          visible={true}
          position={{ x: 60, y: -20 }}
        />
      </SVGWrapper>
    );

    // Should show actual values
    expect(screen.getByText('30%')).toBeInTheDocument();
    expect(screen.getByText('800 lx')).toBeInTheDocument();

    // Should show dashes for null values
    const dashes = screen.getAllByText('--');
    expect(dashes.length).toBe(2); // temperature and humidity are null
  });

  it('renders at specified position', () => {
    render(
      <SVGWrapper>
        <PlantTooltip
          plant={mockPlantWithTelemetry}
          visible={true}
          position={{ x: 100, y: 50 }}
        />
      </SVGWrapper>
    );

    const foreignObject = document.querySelector('foreignObject');
    expect(foreignObject).toHaveAttribute('x', '100');
    expect(foreignObject).toHaveAttribute('y', '50');
  });
});
