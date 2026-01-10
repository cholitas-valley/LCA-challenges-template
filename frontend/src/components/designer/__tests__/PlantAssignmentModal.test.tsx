/**
 * PlantAssignmentModal Tests
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { PlantAssignmentModal } from '../PlantAssignmentModal';
import { Plant } from '../../../types/plant';

const mockAvailablePlants: Plant[] = [
  {
    id: 'plant-1',
    name: 'Monstera',
    species: 'Monstera Deliciosa',
    thresholds: null,
    position: null,
    created_at: '2024-01-01T00:00:00Z',
    device_count: 0,
    latest_telemetry: null,
  },
  {
    id: 'plant-2',
    name: 'Snake Plant',
    species: 'Sansevieria',
    thresholds: null,
    position: null,
    created_at: '2024-01-01T00:00:00Z',
    device_count: 0,
    latest_telemetry: null,
  },
];

describe('PlantAssignmentModal', () => {
  const defaultProps = {
    isOpen: true,
    spotId: 1,
    currentPlantId: null,
    availablePlants: mockAvailablePlants,
    onAssign: vi.fn(),
    onRemove: vi.fn(),
    onClose: vi.fn(),
  };

  it('renders modal when open', () => {
    render(<PlantAssignmentModal {...defaultProps} />);

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('Left shelf, position 1')).toBeInTheDocument();
  });

  it('does not render when closed', () => {
    render(<PlantAssignmentModal {...defaultProps} isOpen={false} />);

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('shows available plants when spot is empty', () => {
    render(<PlantAssignmentModal {...defaultProps} />);

    expect(screen.getByText('Select a plant to place in this spot:')).toBeInTheDocument();
    expect(screen.getByText('Monstera')).toBeInTheDocument();
    expect(screen.getByText('Snake Plant')).toBeInTheDocument();
  });

  it('shows remove option when spot is occupied', () => {
    render(<PlantAssignmentModal {...defaultProps} currentPlantId="plant-1" />);

    expect(screen.getByText('This spot is currently occupied.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /remove plant/i })).toBeInTheDocument();
  });

  it('calls onAssign when plant is selected', () => {
    const onAssign = vi.fn();
    render(<PlantAssignmentModal {...defaultProps} onAssign={onAssign} />);

    fireEvent.click(screen.getByText('Monstera'));

    expect(onAssign).toHaveBeenCalledWith('plant-1');
  });

  it('calls onRemove when remove button is clicked', () => {
    const onRemove = vi.fn();
    render(
      <PlantAssignmentModal
        {...defaultProps}
        currentPlantId="plant-1"
        onRemove={onRemove}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: /remove plant/i }));

    expect(onRemove).toHaveBeenCalledWith('plant-1');
  });

  it('calls onClose when cancel button is clicked', () => {
    const onClose = vi.fn();
    render(<PlantAssignmentModal {...defaultProps} onClose={onClose} />);

    fireEvent.click(screen.getByRole('button', { name: /cancel/i }));

    expect(onClose).toHaveBeenCalled();
  });

  it('calls onClose when escape key is pressed', () => {
    const onClose = vi.fn();
    render(<PlantAssignmentModal {...defaultProps} onClose={onClose} />);

    fireEvent.keyDown(document, { key: 'Escape' });

    expect(onClose).toHaveBeenCalled();
  });

  it('shows message when no plants are available', () => {
    render(<PlantAssignmentModal {...defaultProps} availablePlants={[]} />);

    expect(screen.getByText(/no unassigned plants available/i)).toBeInTheDocument();
  });
});
