/**
 * PlantSpot Component
 *
 * Interactive fixed position spot for placing plants.
 * Shows empty state (dashed outline) or occupied state (plant image).
 */

import { PlantSpot as SpotType, SpotSize } from './plantSpots';
import { PlantImage } from './PlantImage';
import { Plant } from '../../types/plant';
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
  const size = SPOT_SIZES[spot.size];
  const isEmpty = plant === null;

  return (
    <div
      className={cn(
        'absolute transform -translate-x-1/2 -translate-y-1/2',
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
      }}
      onClick={onClick}
      onMouseEnter={() => onHover?.(true)}
      onMouseLeave={() => onHover?.(false)}
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
        // Plant image
        <PlantImage
          species={plant.species ?? 'unknown'}
          size={spot.size}
          alt={plant.name}
          className="w-full h-full object-contain"
        />
      )}
    </div>
  );
}
