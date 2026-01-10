/**
 * DesignerCanvas Component Tests
 *
 * Tests for the DesignerCanvas component that renders plants on an
 * interactive SVG canvas with drag-and-drop support.
 *
 * Note: These tests require vitest and @testing-library/react to be installed.
 * To run: npm install -D vitest @testing-library/react jsdom && npm run test
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { DesignerCanvas } from '../DesignerCanvas';
import { Plant } from '../../../types/plant';

// Mock plants for testing
const mockPlants: Plant[] = [
  {
    id: 'plant-1',
    name: 'Monstera',
    species: 'Monstera Deliciosa',
    thresholds: null,
    position: { x: 100, y: 150 },
    created_at: '2024-01-01T00:00:00Z',
    device_count: 1,
  },
  {
    id: 'plant-2',
    name: 'Snake Plant',
    species: 'Sansevieria',
    thresholds: null,
    position: { x: 300, y: 200 },
    created_at: '2024-01-01T00:00:00Z',
    device_count: 0,
  },
  {
    id: 'plant-3',
    name: 'No Position Plant',
    species: 'Unknown',
    thresholds: null,
    position: null,
    created_at: '2024-01-01T00:00:00Z',
    device_count: 0,
  },
];

describe('DesignerCanvas', () => {
  it('renders plants at their positions', () => {
    render(<DesignerCanvas plants={mockPlants} editMode={false} />);

    // Should render the SVG canvas
    const canvas = screen.getByRole('img', { name: /designer canvas/i });
    expect(canvas).toBeInTheDocument();

    // Should render positioned plants
    expect(screen.getByText('Monstera')).toBeInTheDocument();
    expect(screen.getByText('Snake Plant')).toBeInTheDocument();

    // Should NOT render plant without position
    expect(screen.queryByText('No Position Plant')).not.toBeInTheDocument();
  });

  it('calls onPlantClick when plant is clicked', () => {
    const onPlantClick = vi.fn();
    render(
      <DesignerCanvas
        plants={mockPlants}
        editMode={false}
        onPlantClick={onPlantClick}
      />
    );

    // Click on the Monstera plant
    const monsteraButton = screen.getByRole('button', { name: /monstera/i });
    fireEvent.click(monsteraButton);

    expect(onPlantClick).toHaveBeenCalledWith('plant-1');
  });

  it('ignores drag when not in edit mode', () => {
    const onPositionChange = vi.fn();
    render(
      <DesignerCanvas
        plants={mockPlants}
        editMode={false}
        onPositionChange={onPositionChange}
      />
    );

    const monsteraButton = screen.getByRole('button', { name: /monstera/i });

    // Try to initiate a drag
    fireEvent.mouseDown(monsteraButton);
    fireEvent.mouseMove(monsteraButton, { clientX: 200, clientY: 250 });
    fireEvent.mouseUp(monsteraButton);

    // Should not call onPositionChange since editMode is false
    expect(onPositionChange).not.toHaveBeenCalled();
  });

  it('renders with custom gridSize', () => {
    render(<DesignerCanvas plants={mockPlants} editMode={false} gridSize={32} />);

    const canvas = screen.getByRole('img', { name: /designer canvas/i });
    expect(canvas).toBeInTheDocument();

    // Check that the pattern exists with the custom grid size
    const pattern = document.getElementById('designer-grid');
    expect(pattern).toBeInTheDocument();
    expect(pattern).toHaveAttribute('width', '32');
    expect(pattern).toHaveAttribute('height', '32');
  });

  it('renders with custom className', () => {
    render(
      <DesignerCanvas
        plants={mockPlants}
        editMode={false}
        className="custom-class"
      />
    );

    const canvas = screen.getByRole('img', { name: /designer canvas/i });
    expect(canvas).toHaveClass('custom-class');
  });

  it('shows grab cursor in edit mode', () => {
    render(<DesignerCanvas plants={mockPlants} editMode={true} />);

    const monsteraButton = screen.getByRole('button', { name: /monstera.*drag to reposition/i });
    expect(monsteraButton).toBeInTheDocument();
  });

  it('renders empty canvas when no plants have positions', () => {
    const plantsWithoutPositions: Plant[] = [
      {
        id: 'plant-1',
        name: 'No Position',
        species: 'Unknown',
        thresholds: null,
        position: null,
        created_at: '2024-01-01T00:00:00Z',
        device_count: 0,
      },
    ];

    render(<DesignerCanvas plants={plantsWithoutPositions} editMode={false} />);

    const canvas = screen.getByRole('img', { name: /designer canvas/i });
    expect(canvas).toBeInTheDocument();

    // No plant buttons should be rendered
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('renders canvas with correct viewBox', () => {
    render(<DesignerCanvas plants={mockPlants} editMode={false} />);

    const canvas = screen.getByRole('img', { name: /designer canvas/i });
    expect(canvas).toHaveAttribute('viewBox', '0 0 800 600');
  });

  it('renders grid pattern', () => {
    render(<DesignerCanvas plants={mockPlants} editMode={false} />);

    // Check that the grid pattern is defined
    const pattern = document.getElementById('designer-grid');
    expect(pattern).toBeInTheDocument();

    // Check that the background rect uses the grid pattern
    const rect = document.querySelector('rect[fill="url(#designer-grid)"]');
    expect(rect).toBeInTheDocument();
  });
});
