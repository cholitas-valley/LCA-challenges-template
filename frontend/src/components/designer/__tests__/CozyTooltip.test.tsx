/**
 * CozyTooltip Component Tests
 *
 * Tests for the CozyTooltip component that displays plant information
 * in a warm, Scandinavian-styled tooltip.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { CozyTooltip } from '../CozyTooltip';
import { Plant } from '../../../types/plant';

// Mock plant with telemetry data
const mockPlantWithTelemetry: Plant = {
  id: 'plant-1',
  name: 'Test Monstera',
  species: 'Monstera',
  thresholds: null,
  position: { x: 100, y: 100 },
  created_at: '2024-01-01T00:00:00Z',
  device_count: 1,
  latest_telemetry: {
    time: new Date(Date.now() - 2 * 60 * 1000).toISOString(), // 2 minutes ago
    device_id: 'device-1',
    plant_id: 'plant-1',
    soil_moisture: 45,
    temperature: 22,
    humidity: 65,
    light_level: 800,
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
    light_level: 150,
  },
};

describe('CozyTooltip', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date());
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders plant name', () => {
    render(
      <CozyTooltip
        plant={mockPlantWithTelemetry}
        visible={true}
        position={{ x: 50, y: 50 }}
      />
    );
    expect(screen.getByText('Test Monstera')).toBeInTheDocument();
  });

  it('shows sensor readings with emojis', () => {
    render(
      <CozyTooltip
        plant={mockPlantWithTelemetry}
        visible={true}
        position={{ x: 50, y: 50 }}
      />
    );
    expect(screen.getByText(/Soil: 45%/)).toBeInTheDocument();
    expect(screen.getByText(/Temp: 22.0/)).toBeInTheDocument();
    expect(screen.getByText(/Humidity: 65%/)).toBeInTheDocument();
    expect(screen.getByText(/Light: Good/)).toBeInTheDocument();
  });

  it('shows status badge with Thriving label', () => {
    render(
      <CozyTooltip
        plant={mockPlantWithTelemetry}
        visible={true}
        position={{ x: 50, y: 50 }}
      />
    );
    expect(screen.getByText('Thriving')).toBeInTheDocument();
  });

  it('shows No sensor data status for offline plant', () => {
    render(
      <CozyTooltip
        plant={mockPlantWithoutTelemetry}
        visible={true}
        position={{ x: 50, y: 50 }}
      />
    );
    expect(screen.getByText('No sensor data')).toBeInTheDocument();
    expect(screen.getByText('No sensor data available')).toBeInTheDocument();
    expect(screen.getByText(/Updated Never/)).toBeInTheDocument();
  });

  it('is hidden when not visible', () => {
    render(
      <CozyTooltip
        plant={mockPlantWithTelemetry}
        visible={false}
        position={{ x: 50, y: 50 }}
      />
    );
    expect(screen.queryByText('Test Monstera')).not.toBeInTheDocument();
  });

  it('shows dashes for null sensor values', () => {
    render(
      <CozyTooltip
        plant={mockPlantPartialTelemetry}
        visible={true}
        position={{ x: 50, y: 50 }}
      />
    );
    // Should show actual values
    expect(screen.getByText(/Soil: 30%/)).toBeInTheDocument();
    expect(screen.getByText(/Light: Low/)).toBeInTheDocument();

    // Should show dashes for null temperature and humidity
    expect(screen.getByText(/Temp: --/)).toBeInTheDocument();
    expect(screen.getByText(/Humidity: --%/)).toBeInTheDocument();
  });

  it('formats light level correctly', () => {
    const lowLightPlant = {
      ...mockPlantWithTelemetry,
      latest_telemetry: {
        ...mockPlantWithTelemetry.latest_telemetry!,
        light_level: 100,
      },
    };
    const { rerender } = render(
      <CozyTooltip
        plant={lowLightPlant}
        visible={true}
        position={{ x: 50, y: 50 }}
      />
    );
    expect(screen.getByText(/Light: Low/)).toBeInTheDocument();

    const mediumLightPlant = {
      ...mockPlantWithTelemetry,
      latest_telemetry: {
        ...mockPlantWithTelemetry.latest_telemetry!,
        light_level: 400,
      },
    };
    rerender(
      <CozyTooltip
        plant={mediumLightPlant}
        visible={true}
        position={{ x: 50, y: 50 }}
      />
    );
    expect(screen.getByText(/Light: Medium/)).toBeInTheDocument();

    const brightLightPlant = {
      ...mockPlantWithTelemetry,
      latest_telemetry: {
        ...mockPlantWithTelemetry.latest_telemetry!,
        light_level: 1500,
      },
    };
    rerender(
      <CozyTooltip
        plant={brightLightPlant}
        visible={true}
        position={{ x: 50, y: 50 }}
      />
    );
    expect(screen.getByText(/Light: Bright/)).toBeInTheDocument();
  });

  it('has accessible tooltip role', () => {
    render(
      <CozyTooltip
        plant={mockPlantWithTelemetry}
        visible={true}
        position={{ x: 50, y: 50 }}
      />
    );
    const tooltip = screen.getByRole('tooltip');
    expect(tooltip).toHaveAttribute('aria-label', 'Information for Test Monstera');
  });

  it('renders relative time correctly', () => {
    render(
      <CozyTooltip
        plant={mockPlantWithTelemetry}
        visible={true}
        position={{ x: 50, y: 50 }}
      />
    );
    expect(screen.getByText(/Updated 2 min ago/)).toBeInTheDocument();
  });
});
