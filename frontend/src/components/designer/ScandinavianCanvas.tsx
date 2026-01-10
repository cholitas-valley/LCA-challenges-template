/**
 * ScandinavianCanvas Component
 *
 * Room view canvas with Scandinavian illustration background.
 * Supports free drag-and-drop positioning of plants in edit mode.
 */

import { useState, useRef, useCallback } from 'react';
import roomBackground from '../../assets/room.png';
import { DraggablePlant } from './DraggablePlant';
import { CozyTooltip } from './CozyTooltip';
import { Plant } from '../../types/plant';
import { cn } from '../../lib/cn';

export interface ScandinavianCanvasProps {
  /** All plants with positions */
  plants: Plant[];
  /** Enable edit mode for drag-and-drop */
  editMode: boolean;
  /** Handler when a plant is dropped at a new position */
  onPlantDrop: (plantId: string, position: { x: number; y: number }) => void;
  /** Handler for plant click (view mode - navigate to detail) */
  onPlantClick?: (plantId: string) => void;
  /** Additional CSS classes */
  className?: string;
}

export function ScandinavianCanvas({
  plants,
  editMode,
  onPlantDrop,
  onPlantClick,
  className,
}: ScandinavianCanvasProps) {
  const canvasRef = useRef<HTMLDivElement>(null);
  const [dragOverPosition, setDragOverPosition] = useState<{ x: number; y: number } | null>(null);
  const [tooltipPlant, setTooltipPlant] = useState<{
    plant: Plant;
    position: { x: number; y: number };
  } | null>(null);
  const [draggingPlantId, setDraggingPlantId] = useState<string | null>(null);

  // Get plants that have positions (are placed on canvas)
  const placedPlants = plants.filter(p => p.position !== null && p.position !== undefined);

  /**
   * Calculate position as percentage from mouse/drop event
   */
  const getPositionFromEvent = useCallback((e: React.DragEvent): { x: number; y: number } | null => {
    if (!canvasRef.current) return null;

    const rect = canvasRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    // Clamp to valid range
    return {
      x: Math.max(5, Math.min(95, x)),
      y: Math.max(10, Math.min(95, y)),
    };
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';

    const pos = getPositionFromEvent(e);
    setDragOverPosition(pos);
  }, [getPositionFromEvent]);

  const handleDragLeave = useCallback(() => {
    setDragOverPosition(null);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOverPosition(null);

    const pos = getPositionFromEvent(e);
    if (!pos) return;

    // Convert percentage to 800x600 coordinate system for storage
    const storagePosition = {
      x: Math.round((pos.x / 100) * 800),
      y: Math.round((pos.y / 100) * 600),
    };

    try {
      const data = JSON.parse(e.dataTransfer.getData('application/json'));
      if (data.type === 'plant' && data.plantId) {
        onPlantDrop(data.plantId, storagePosition);
      }
    } catch {
      // Invalid drop data
    }
  }, [getPositionFromEvent, onPlantDrop]);

  const handlePlantHover = useCallback((plant: Plant, hovered: boolean) => {
    // Don't show tooltip in edit mode
    if (editMode) {
      setTooltipPlant(null);
      return;
    }

    if (hovered && plant.position) {
      // Convert 800x600 coordinates to percentages for tooltip positioning
      const tooltipPos = {
        x: (plant.position.x / 800) * 100,
        y: (plant.position.y / 600) * 100,
      };
      setTooltipPlant({ plant, position: tooltipPos });
    } else {
      setTooltipPlant(null);
    }
  }, [editMode]);

  const handlePlantClick = useCallback((plantId: string) => {
    if (!editMode) {
      onPlantClick?.(plantId);
    }
  }, [editMode, onPlantClick]);

  return (
    <div
      ref={canvasRef}
      className={cn(
        'relative w-full aspect-[4/3] max-w-4xl mx-auto',
        'rounded-lg overflow-hidden shadow-lg',
        editMode && 'ring-2 ring-amber-300',
        className
      )}
      onDragOver={editMode ? handleDragOver : undefined}
      onDragLeave={editMode ? handleDragLeave : undefined}
      onDrop={editMode ? handleDrop : undefined}
    >
      {/* Room background image */}
      <img
        src={roomBackground}
        alt="Scandinavian living room"
        className="absolute inset-0 w-full h-full object-cover pointer-events-none"
        loading="lazy"
        draggable={false}
      />

      {/* Placed plants */}
      <div className="absolute inset-0 z-10">
        {placedPlants.map(plant => (
          <DraggablePlant
            key={plant.id}
            plant={plant}
            editMode={editMode}
            onDragStart={setDraggingPlantId}
            onDragEnd={() => setDraggingPlantId(null)}
            onClick={() => handlePlantClick(plant.id)}
            onHover={(hovered) => handlePlantHover(plant, hovered)}
          />
        ))}
      </div>

      {/* Drop indicator */}
      {editMode && dragOverPosition && (
        <div
          className="absolute pointer-events-none z-20"
          style={{
            left: `${dragOverPosition.x}%`,
            top: `${dragOverPosition.y}%`,
            transform: 'translateX(-50%) translateY(-100%)',
          }}
        >
          <div className="w-16 h-20 border-2 border-dashed border-amber-400 rounded-lg bg-amber-100/30" />
        </div>
      )}

      {/* Cozy tooltip for hovered plant (view mode only) */}
      {tooltipPlant && !editMode && (
        <CozyTooltip
          plant={tooltipPlant.plant}
          visible={true}
          position={tooltipPlant.position}
        />
      )}

      {/* Edit mode instructions */}
      {editMode && (
        <div className="absolute bottom-4 left-4 right-4 text-center">
          <span className="bg-white/90 backdrop-blur-sm px-4 py-2 rounded-full text-sm text-gray-700 shadow-sm">
            {draggingPlantId
              ? 'Drop to place the plant'
              : 'Drag plants to reposition, or drag from sidebar to add'}
          </span>
        </div>
      )}
    </div>
  );
}
