import { render, screen, fireEvent } from '@testing-library/react';
import { ScandinavianCanvas } from '../ScandinavianCanvas';
import { Plant } from '../../../types/plant';

// Mock the room background image
jest.mock('../../../assets/room.png', () => 'room-background.png');

describe('ScandinavianCanvas', () => {
  const mockPlants: Plant[] = [
    {
      id: 'p1',
      name: 'Test Monstera',
      species: 'Monstera',
      position: null,
      thresholds: null,
      created_at: '2024-01-01',
      device_count: 0,
    },
    {
      id: 'p2',
      name: 'Test Snake Plant',
      species: 'Snake Plant',
      position: null,
      thresholds: null,
      created_at: '2024-01-01',
      device_count: 0,
    },
  ];

  const defaultProps = {
    plants: mockPlants,
    spotAssignments: {},
    editMode: false,
    onSpotClick: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders room background', () => {
    render(<ScandinavianCanvas {...defaultProps} />);
    const img = screen.getByAltText('Scandinavian living room');
    expect(img).toBeInTheDocument();
  });

  it('renders with lazy loading', () => {
    render(<ScandinavianCanvas {...defaultProps} />);
    const img = screen.getByAltText('Scandinavian living room');
    expect(img).toHaveAttribute('loading', 'lazy');
  });

  it('shows edit hint in edit mode', () => {
    render(<ScandinavianCanvas {...defaultProps} editMode={true} />);
    expect(screen.getByText(/Click an empty spot/)).toBeInTheDocument();
  });

  it('hides edit hint when not in edit mode', () => {
    render(<ScandinavianCanvas {...defaultProps} editMode={false} />);
    expect(screen.queryByText(/Click an empty spot/)).not.toBeInTheDocument();
  });

  it('renders 20 plant spots', () => {
    render(<ScandinavianCanvas {...defaultProps} />);
    // Each empty spot in non-edit mode has an aria-label
    const spots = screen.getAllByRole('button');
    expect(spots).toHaveLength(20);
  });

  it('displays plant in assigned spot', () => {
    const propsWithAssignment = {
      ...defaultProps,
      spotAssignments: { 1: 'p1' },
    };
    render(<ScandinavianCanvas {...propsWithAssignment} />);
    // Check that the spot with plant has the correct aria-label
    const plantSpot = screen.getByRole('button', { name: /Test Monstera at Left shelf, position 1/ });
    expect(plantSpot).toBeInTheDocument();
  });

  it('calls onSpotClick when spot is clicked', () => {
    const onSpotClick = jest.fn();
    render(
      <ScandinavianCanvas
        {...defaultProps}
        editMode={true}
        onSpotClick={onSpotClick}
      />
    );
    
    const spots = screen.getAllByRole('button');
    fireEvent.click(spots[0]);
    
    expect(onSpotClick).toHaveBeenCalledWith(1, null);
  });

  it('passes current plant ID when clicking occupied spot', () => {
    const onSpotClick = jest.fn();
    render(
      <ScandinavianCanvas
        {...defaultProps}
        spotAssignments={{ 1: 'p1' }}
        editMode={true}
        onSpotClick={onSpotClick}
      />
    );
    
    const occupiedSpot = screen.getByRole('button', { name: /Test Monstera/ });
    fireEvent.click(occupiedSpot);
    
    expect(onSpotClick).toHaveBeenCalledWith(1, 'p1');
  });

  it('applies custom className', () => {
    const { container } = render(
      <ScandinavianCanvas {...defaultProps} className="custom-class" />
    );
    expect(container.firstChild).toHaveClass('custom-class');
  });

  it('calls onPlantHover when hovering over plant spot', () => {
    const onPlantHover = jest.fn();
    render(
      <ScandinavianCanvas
        {...defaultProps}
        spotAssignments={{ 1: 'p1' }}
        onPlantHover={onPlantHover}
      />
    );
    
    const plantSpot = screen.getByRole('button', { name: /Test Monstera/ });
    fireEvent.mouseEnter(plantSpot);
    
    expect(onPlantHover).toHaveBeenCalledWith('p1', { x: 15, y: 18 });
  });

  it('calls onPlantHover with null when mouse leaves', () => {
    const onPlantHover = jest.fn();
    render(
      <ScandinavianCanvas
        {...defaultProps}
        spotAssignments={{ 1: 'p1' }}
        onPlantHover={onPlantHover}
      />
    );
    
    const plantSpot = screen.getByRole('button', { name: /Test Monstera/ });
    fireEvent.mouseEnter(plantSpot);
    fireEvent.mouseLeave(plantSpot);
    
    expect(onPlantHover).toHaveBeenLastCalledWith(null, null);
  });
});
