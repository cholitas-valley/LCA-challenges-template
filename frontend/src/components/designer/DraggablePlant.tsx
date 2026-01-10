/**
 * DraggablePlant Component
 *
 * A plant that can be dragged around the canvas in edit mode.
 * Uses native HTML5 drag-and-drop API.
 */

import { useState, useRef } from 'react';
import { Plant } from '../../types/plant';
import { PlantImage } from './PlantImage';
import { getPlantStatus } from '../../utils/plantStatus';
import { cn } from '../../lib/cn';

export interface DraggablePlantProps {
  plant: Plant;
  editMode: boolean;
  onDragStart?: (plantId: string) => void;
  onDragEnd?: () => void;
  onClick?: () => void;
  onHover?: (hovered: boolean) => void;
}

// Size based on a default medium plant
const PLANT_SIZE = { width: 80, height: 100 };

export function DraggablePlant({
  plant,
  editMode,
  onDragStart,
  onDragEnd,
  onClick,
  onHover,
}: DraggablePlantProps) {
  const [isDragging, setIsDragging] = useState(false);
  const dragRef = useRef<HTMLDivElement>(null);
  const status = getPlantStatus(plant);

  // Positions are stored as 800x600 coordinates, convert to percentages
  const rawPosition = plant.position ?? { x: 400, y: 300 };
  const position = {
    x: (rawPosition.x / 800) * 100,
    y: (rawPosition.y / 600) * 100,
  };

  const handleDragStart = (e: React.DragEvent) => {
    if (!editMode) {
      e.preventDefault();
      return;
    }

    setIsDragging(true);
    onDragStart?.(plant.id);

    // Set drag data
    e.dataTransfer.setData('application/json', JSON.stringify({
      type: 'plant',
      plantId: plant.id,
      isFromCanvas: true,
    }));
    e.dataTransfer.effectAllowed = 'move';

    // Create a ghost image
    if (dragRef.current) {
      const rect = dragRef.current.getBoundingClientRect();
      e.dataTransfer.setDragImage(dragRef.current, rect.width / 2, rect.height);
    }
  };

  const handleDragEnd = () => {
    setIsDragging(false);
    onDragEnd?.();
  };

  return (
    <div
      ref={dragRef}
      className={cn(
        'absolute cursor-grab',
        'transition-all duration-150',
        editMode && 'hover:scale-110 hover:z-10',
        isDragging && 'opacity-50 cursor-grabbing',
        !editMode && 'cursor-pointer'
      )}
      style={{
        left: `${position.x}%`,
        top: `${position.y}%`,
        width: PLANT_SIZE.width,
        height: PLANT_SIZE.height,
        transform: 'translateX(-50%) translateY(-100%)', // Bottom-anchored
      }}
      draggable={editMode}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onClick={onClick}
      onMouseEnter={() => onHover?.(true)}
      onMouseLeave={() => onHover?.(false)}
    >
      <PlantImage
        species={plant.species ?? 'unknown'}
        size="medium"
        alt={plant.name}
        className={cn(
          'w-full h-full object-contain',
          'transition-opacity duration-200',
          status === 'offline' && 'opacity-60'
        )}
      />

      {/* Edit mode indicator */}
      {editMode && (
        <div className="absolute -bottom-1 left-1/2 -translate-x-1/2">
          <div className="w-2 h-2 bg-amber-400 rounded-full shadow-sm" />
        </div>
      )}
    </div>
  );
}
