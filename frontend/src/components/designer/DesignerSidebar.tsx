/**
 * DesignerSidebar Component
 *
 * Sidebar for the Designer page that displays unplaced plants.
 * Supports drag-and-drop in edit mode.
 *
 * @example
 * ```tsx
 * <DesignerSidebar
 *   plants={unplacedPlants}
 *   editMode={true}
 * />
 * ```
 */

import { Plant } from '../../types/plant';
import { PlantIcon } from './PlantIcon';
import { cn } from '../../lib/cn';

export interface DesignerSidebarProps {
  /** Plants without positions to display in sidebar */
  plants: Plant[];
  /** Whether edit mode is active (enables drag) */
  editMode: boolean;
}

interface SidebarPlantItemProps {
  plant: Plant;
  draggable: boolean;
}

/**
 * SidebarPlantItem renders a single plant in the sidebar.
 */
function SidebarPlantItem({ plant, draggable }: SidebarPlantItemProps) {
  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.setData('plantId', plant.id);
    e.dataTransfer.effectAllowed = 'move';
  };

  return (
    <div
      className={cn(
        'flex items-center gap-3 p-2 rounded-lg bg-white border border-gray-200',
        draggable && 'cursor-grab hover:border-gray-300 hover:shadow-sm'
      )}
      draggable={draggable}
      onDragStart={handleDragStart}
      role={draggable ? 'listitem' : undefined}
      aria-label={draggable ? `Drag ${plant.name} to place on canvas` : plant.name}
    >
      <PlantIcon species={plant.species ?? 'unknown'} size={32} className="text-gray-600" />
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium text-gray-900 truncate">
          {plant.name}
        </div>
        <div className="text-xs text-gray-500 truncate">
          {plant.species || 'Unknown species'}
        </div>
      </div>
    </div>
  );
}

/**
 * DesignerSidebar displays unplaced plants that can be dragged to canvas.
 */
export function DesignerSidebar({ plants, editMode }: DesignerSidebarProps) {
  // Hide sidebar when all plants are placed and not editing
  if (plants.length === 0 && !editMode) {
    return null;
  }

  return (
    <aside 
      className="w-64 bg-gray-50 border-r border-gray-200 p-4 flex-shrink-0"
      aria-label="Unplaced plants"
    >
      <h2 className="text-sm font-medium text-gray-700 mb-4">
        Unplaced Plants
      </h2>
      
      {plants.length === 0 ? (
        <p className="text-sm text-gray-500">All plants are placed!</p>
      ) : (
        <div className="space-y-2" role={editMode ? 'list' : undefined}>
          {plants.map(plant => (
            <SidebarPlantItem
              key={plant.id}
              plant={plant}
              draggable={editMode}
            />
          ))}
        </div>
      )}
    </aside>
  );
}
