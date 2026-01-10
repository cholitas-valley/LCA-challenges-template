/**
 * PlantSpot Component
 *
 * Interactive fixed position spot for placing plants.
 * Shows empty state (dashed outline) or occupied state (plant image).
 */

import { useState } from 'react';
import { PlantSpot as SpotType, SpotSize } from './plantSpots';
import { PlantImage } from './PlantImage';
import { Plant } from '../../types/plant';
import { getPlantStatus } from '../../utils/plantStatus';
import { cn } from '../../lib/cn';

export interface PlantSpotProps {
  /** Spot configuration */
  spot: SpotType;
  /** Plant assigned to this spot (null if empty) */
  plant: Plant | null;
  /** Whether editing is enabled */
  editMode: boolean;
  /** Click handler for spot interaction */
  onClick: () => void;
  /** Hover state handler */
  onHover?: (hovered: boolean) => void;
  /** Additional CSS classes */
  className?: string;
}

// Pixel sizes for each spot size category
const SPOT_SIZES: Record<SpotSize, { width: number; height: number }> = {
  small: { width: 60, height: 80 },
  medium: { width: 90, height: 120 },
  large: { width: 120, height: 160 },
};

export function PlantSpot({
  spot,
  plant,
  editMode,
  onClick,
  onHover,
  className,
}: PlantSpotProps) {
  const [hovered, setHovered] = useState(false);
  const size = SPOT_SIZES[spot.size];
  const isEmpty = plant === null;
  const status = plant ? getPlantStatus(plant) : 'offline';

  const handleMouseEnter = () => {
    setHovered(true);
    onHover?.(true);
  };

  const handleMouseLeave = () => {
    setHovered(false);
    onHover?.(false);
  };

  return (
    <div
      className={cn(
        'absolute transform -translate-x-1/2',
        'transition-all duration-200 ease-in-out',
        editMode && 'cursor-pointer',
        editMode && isEmpty && 'hover:scale-105',
        className
      )}
      style={{
        left: `${spot.x}%`,
        top: `${spot.y}%`,
        width: size.width,
        height: size.height,
        transform: 'translateX(-50%) translateY(-100%)', // Anchor at bottom so plants sit ON surfaces
      }}
      onClick={onClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      role="button"
      aria-label={isEmpty ? `Empty spot: ${spot.label}` : `${plant.name} at ${spot.label}`}
      tabIndex={editMode ? 0 : -1}
    >
      {isEmpty ? (
        // Empty spot indicator (dashed outline in edit mode)
        editMode && (
          <div
            className={cn(
              'w-full h-full',
              'border-2 border-dashed border-gray-300 rounded-lg',
              'bg-white/30 backdrop-blur-sm',
              'flex items-center justify-center',
              'hover:border-gray-400 hover:bg-white/50'
            )}
          >
            <span className="text-gray-400 text-xs">+</span>
          </div>
        )
      ) : (
        // Plant image (status shown via tooltip, not ring to avoid visual clutter)
        <div
          className={cn(
            'relative w-full h-full',
            'transition-transform duration-200 ease-out',
            hovered && !editMode && 'scale-105',
            hovered && editMode && 'scale-110'
          )}
        >
          <PlantImage
            species={plant.species ?? 'unknown'}
            size={spot.size}
            alt={plant.name}
            className={cn(
              'w-full h-full object-contain',
              'transition-opacity duration-200',
              status === 'offline' && 'opacity-60'
            )}
          />
        </div>
      )}
    </div>
  );
}
