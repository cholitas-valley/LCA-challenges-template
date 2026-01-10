/**
 * ScandinavianCanvas Component
 *
 * Room view canvas with Scandinavian illustration background
 * and 20 fixed plant placement spots.
 */

import { useState } from 'react';
import roomBackground from '../../assets/room.png';
import { PLANT_SPOTS } from './plantSpots';
import { PlantSpot } from './PlantSpot';
import { CozyTooltip } from './CozyTooltip';
import { Plant } from '../../types/plant';
import { cn } from '../../lib/cn';

export interface ScandinavianCanvasProps {
  /** All plants (positioned and unpositioned) */
  plants: Plant[];
  /** Mapping of spot ID to plant ID */
  spotAssignments: Record<number, string>;
  /** Enable edit mode for spot assignment */
  editMode: boolean;
  /** Handler for spot click (empty spot or reassign) */
  onSpotClick: (spotId: number, currentPlantId: string | null) => void;
  /** Handler for plant hover (shows tooltip) */
  onPlantHover?: (plantId: string | null, position: { x: number; y: number } | null) => void;
  /** Additional CSS classes */
  className?: string;
}

export function ScandinavianCanvas({
  plants,
  spotAssignments,
  editMode,
  onSpotClick,
  onPlantHover,
  className,
}: ScandinavianCanvasProps) {
  const [hoveredSpot, setHoveredSpot] = useState<number | null>(null);
  const [tooltipPlant, setTooltipPlant] = useState<{
    plant: Plant;
    position: { x: number; y: number };
  } | null>(null);

  // Create a map of plantId -> Plant for quick lookup
  const plantMap = new Map(plants.map(p => [p.id, p]));

  // Get plant for a spot (if assigned)
  const getPlantForSpot = (spotId: number): Plant | null => {
    const plantId = spotAssignments[spotId];
    if (!plantId) return null;
    return plantMap.get(plantId) ?? null;
  };

  const handleSpotHover = (spotId: number, hovered: boolean) => {
    setHoveredSpot(hovered ? spotId : null);

    const plant = getPlantForSpot(spotId);
    if (hovered && plant) {
      const spot = PLANT_SPOTS.find(s => s.id === spotId);
      if (spot) {
        setTooltipPlant({ plant, position: { x: spot.x, y: spot.y } });
        onPlantHover?.(plant.id, { x: spot.x, y: spot.y });
      }
    } else {
      setTooltipPlant(null);
      onPlantHover?.(null, null);
    }
  };

  // Suppress unused variable warning - hoveredSpot can be used for future styling
  void hoveredSpot;

  return (
    <div
      className={cn(
        'relative w-full aspect-[4/3] max-w-4xl mx-auto',
        'rounded-lg overflow-hidden shadow-lg',
        className
      )}
    >
      {/* Room background image */}
      <img
        src={roomBackground}
        alt="Scandinavian living room"
        className="absolute inset-0 w-full h-full object-cover"
        loading="lazy"
      />

      {/* Plant spots overlay */}
      <div className="absolute inset-0">
        {PLANT_SPOTS.map(spot => (
          <PlantSpot
            key={spot.id}
            spot={spot}
            plant={getPlantForSpot(spot.id)}
            editMode={editMode}
            onClick={() => onSpotClick(spot.id, spotAssignments[spot.id] ?? null)}
            onHover={(hovered) => handleSpotHover(spot.id, hovered)}
          />
        ))}
      </div>

      {/* Cozy tooltip for hovered plant */}
      {tooltipPlant && (
        <CozyTooltip
          plant={tooltipPlant.plant}
          visible={true}
          position={tooltipPlant.position}
        />
      )}

      {/* Edit mode overlay hint */}
      {editMode && (
        <div className="absolute bottom-4 left-4 right-4 text-center">
          <span className="bg-white/80 backdrop-blur-sm px-3 py-1.5 rounded-full text-sm text-gray-600">
            Click an empty spot to place a plant, or click a plant to reassign
          </span>
        </div>
      )}
    </div>
  );
}
