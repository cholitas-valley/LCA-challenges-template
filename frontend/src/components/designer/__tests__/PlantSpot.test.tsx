import { render, screen, fireEvent } from '@testing-library/react';
import { PlantSpot } from '../PlantSpot';
import { PlantSpot as SpotType } from '../plantSpots';
import { Plant } from '../../../types/plant';

describe('PlantSpot', () => {
  const mockSpot: SpotType = {
    id: 1,
    location: 'shelf',
    x: 15,
    y: 18,
    size: 'small',
    label: 'Left shelf, position 1',
  };

  const mockPlant: Plant = {
    id: 'p1',
    name: 'Test Monstera',
    species: 'Monstera',
    position: null,
    thresholds: null,
    created_at: '2024-01-01',
    device_count: 0,
  };

  const defaultProps = {
    spot: mockSpot,
    plant: null,
    editMode: false,
    onClick: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('empty spot', () => {
    it('renders with correct aria-label when empty', () => {
      render(<PlantSpot {...defaultProps} />);
      const spot = screen.getByRole('button');
      expect(spot).toHaveAttribute('aria-label', 'Empty spot: Left shelf, position 1');
    });

    it('shows dashed outline in edit mode', () => {
      render(<PlantSpot {...defaultProps} editMode={true} />);
      const outline = screen.getByText('+');
      expect(outline).toBeInTheDocument();
    });

    it('hides outline when not in edit mode', () => {
      render(<PlantSpot {...defaultProps} editMode={false} />);
      expect(screen.queryByText('+')).not.toBeInTheDocument();
    });

    it('has tabIndex 0 in edit mode', () => {
      render(<PlantSpot {...defaultProps} editMode={true} />);
      const spot = screen.getByRole('button');
      expect(spot).toHaveAttribute('tabIndex', '0');
    });

    it('has tabIndex -1 when not in edit mode', () => {
      render(<PlantSpot {...defaultProps} editMode={false} />);
      const spot = screen.getByRole('button');
      expect(spot).toHaveAttribute('tabIndex', '-1');
    });
  });

  describe('occupied spot', () => {
    it('renders with plant aria-label when occupied', () => {
      render(<PlantSpot {...defaultProps} plant={mockPlant} />);
      const spot = screen.getByRole('button');
      expect(spot).toHaveAttribute('aria-label', 'Test Monstera at Left shelf, position 1');
    });

    it('renders PlantImage when occupied', () => {
      render(<PlantSpot {...defaultProps} plant={mockPlant} />);
      // PlantImage should render the plant
      const plantImage = screen.getByAltText('Test Monstera');
      expect(plantImage).toBeInTheDocument();
    });
  });

  describe('interactions', () => {
    it('calls onClick when clicked', () => {
      const onClick = jest.fn();
      render(<PlantSpot {...defaultProps} onClick={onClick} />);
      
      fireEvent.click(screen.getByRole('button'));
      expect(onClick).toHaveBeenCalledTimes(1);
    });

    it('calls onHover with true on mouse enter', () => {
      const onHover = jest.fn();
      render(<PlantSpot {...defaultProps} onHover={onHover} />);
      
      fireEvent.mouseEnter(screen.getByRole('button'));
      expect(onHover).toHaveBeenCalledWith(true);
    });

    it('calls onHover with false on mouse leave', () => {
      const onHover = jest.fn();
      render(<PlantSpot {...defaultProps} onHover={onHover} />);
      
      fireEvent.mouseLeave(screen.getByRole('button'));
      expect(onHover).toHaveBeenCalledWith(false);
    });

    it('applies cursor-pointer in edit mode', () => {
      render(<PlantSpot {...defaultProps} editMode={true} />);
      const spot = screen.getByRole('button');
      expect(spot).toHaveClass('cursor-pointer');
    });
  });

  describe('positioning', () => {
    it('positions spot at correct percentage', () => {
      render(<PlantSpot {...defaultProps} />);
      const spot = screen.getByRole('button');
      expect(spot).toHaveStyle({ left: '15%', top: '18%' });
    });

    it('uses correct dimensions for small spot', () => {
      render(<PlantSpot {...defaultProps} />);
      const spot = screen.getByRole('button');
      expect(spot).toHaveStyle({ width: '60px', height: '80px' });
    });

    it('uses correct dimensions for medium spot', () => {
      const mediumSpot = { ...mockSpot, size: 'medium' as const };
      render(<PlantSpot {...defaultProps} spot={mediumSpot} />);
      const spot = screen.getByRole('button');
      expect(spot).toHaveStyle({ width: '90px', height: '120px' });
    });

    it('uses correct dimensions for large spot', () => {
      const largeSpot = { ...mockSpot, size: 'large' as const };
      render(<PlantSpot {...defaultProps} spot={largeSpot} />);
      const spot = screen.getByRole('button');
      expect(spot).toHaveStyle({ width: '120px', height: '160px' });
    });
  });

  describe('custom className', () => {
    it('applies custom className', () => {
      render(<PlantSpot {...defaultProps} className="custom-class" />);
      const spot = screen.getByRole('button');
      expect(spot).toHaveClass('custom-class');
    });
  });
});
