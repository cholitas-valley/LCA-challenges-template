/**
 * DesignerSidebar Component Tests
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { DesignerSidebar } from '../DesignerSidebar';
import { Plant } from '../../../types/plant';

const mockPlants: Plant[] = [
  {
    id: 'plant-1',
    name: 'Pothos',
    species: 'Epipremnum aureum',
    thresholds: null,
    position: null,
    created_at: '2024-01-01T00:00:00Z',
    device_count: 0,
    latest_telemetry: null,
  },
  {
    id: 'plant-2',
    name: 'Fern',
    species: 'Nephrolepis',
    thresholds: null,
    position: null,
    created_at: '2024-01-01T00:00:00Z',
    device_count: 0,
    latest_telemetry: null,
  },
];

describe('DesignerSidebar', () => {
  it('renders unplaced plants', () => {
    render(<DesignerSidebar plants={mockPlants} editMode={false} />);

    expect(screen.getByText('Unplaced Plants')).toBeInTheDocument();
    expect(screen.getByText('Pothos')).toBeInTheDocument();
    expect(screen.getByText('Fern')).toBeInTheDocument();
  });

  it('shows empty message when all plants are placed', () => {
    render(<DesignerSidebar plants={[]} editMode={true} />);

    expect(screen.getByText('All plants are placed!')).toBeInTheDocument();
  });

  it('hides sidebar when no unplaced plants and not editing', () => {
    const { container } = render(<DesignerSidebar plants={[]} editMode={false} />);

    expect(container.querySelector('aside')).not.toBeInTheDocument();
  });

  it('makes items draggable in edit mode', () => {
    render(<DesignerSidebar plants={mockPlants} editMode={true} />);

    const pothosItem = screen.getByText('Pothos').closest('div[draggable]');
    expect(pothosItem).toHaveAttribute('draggable', 'true');
  });

  it('items are not draggable in view mode', () => {
    render(<DesignerSidebar plants={mockPlants} editMode={false} />);

    const pothosItem = screen.getByText('Pothos').closest('div');
    expect(pothosItem).toHaveAttribute('draggable', 'false');
  });

  it('sets plantId on drag start', () => {
    render(<DesignerSidebar plants={mockPlants} editMode={true} />);

    const pothosItem = screen.getByText('Pothos').closest('div[draggable]');
    
    const mockDataTransfer = {
      setData: vi.fn(),
      effectAllowed: '',
    };

    fireEvent.dragStart(pothosItem!, {
      dataTransfer: mockDataTransfer,
    });

    expect(mockDataTransfer.setData).toHaveBeenCalledWith('plantId', 'plant-1');
  });

  it('displays species name', () => {
    render(<DesignerSidebar plants={mockPlants} editMode={false} />);

    expect(screen.getByText('Epipremnum aureum')).toBeInTheDocument();
  });

  it('displays Unknown species when species is null', () => {
    const plantWithoutSpecies: Plant[] = [
      {
        id: 'plant-1',
        name: 'Mystery Plant',
        species: null,
        thresholds: null,
        position: null,
        created_at: '2024-01-01T00:00:00Z',
        device_count: 0,
        latest_telemetry: null,
      },
    ];

    render(<DesignerSidebar plants={plantWithoutSpecies} editMode={false} />);

    expect(screen.getByText('Unknown species')).toBeInTheDocument();
  });
});
