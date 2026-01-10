/**
 * DesignerSidebar Component
 *
 * Sidebar for the Designer page that displays unassigned plants.
 * Scandinavian-styled with warm colors and rounded corners.
 *
 * @example
 * ```tsx
 * <DesignerSidebar
 *   plants={unassignedPlants}
 *   editMode={true}
 * />
 * ```
 */

import { Plant } from '../../types/plant';
import { PlantImage } from './PlantImage';
import { cn } from '../../lib/cn';

export interface DesignerSidebarProps {
  /** Plants not assigned to any spot */
  plants: Plant[];
  /** Whether edit mode is active */
  editMode: boolean;
}

interface SidebarPlantItemProps {
  plant: Plant;
  editMode: boolean;
}

/**
 * SidebarPlantItem renders a single plant in the sidebar.
 */
function SidebarPlantItem({ plant, editMode }: SidebarPlantItemProps) {
  return (
    <div
      className={cn(
        'flex items-center gap-3 p-3 rounded-xl',
        'bg-white/80 border border-stone-200 shadow-sm',
        editMode && 'ring-2 ring-amber-200 ring-offset-1',
        'transition-all duration-200'
      )}
      role="listitem"
      aria-label={plant.name}
    >
      <PlantImage
        species={plant.species ?? 'unknown'}
        size="small"
        className="flex-shrink-0"
      />
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium text-stone-800 truncate">
          {plant.name}
        </div>
        <div className="text-xs text-stone-500 truncate">
          {plant.species || 'Unknown species'}
        </div>
      </div>
    </div>
  );
}

/**
 * DesignerSidebar displays unassigned plants.
 * In edit mode, users click spots on the canvas to assign plants.
 */
export function DesignerSidebar({ plants, editMode }: DesignerSidebarProps) {
  // Hide sidebar when all plants are assigned and not editing
  if (plants.length === 0 && !editMode) {
    return null;
  }

  return (
    <aside
      className={cn(
        'w-72 flex-shrink-0 p-4',
        'bg-gradient-to-b from-stone-50 to-amber-50/30',
        'border-r border-stone-200'
      )}
      aria-label="Unassigned plants"
    >
      <h2 className="text-sm font-semibold text-stone-700 mb-4 flex items-center gap-2">
        <svg className="w-4 h-4 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
        </svg>
        Unassigned Plants
      </h2>

      {plants.length === 0 ? (
        <div className="text-center py-8">
          <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-green-100 flex items-center justify-center">
            <svg className="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <p className="text-sm text-stone-600 font-medium">All plants are placed!</p>
          <p className="text-xs text-stone-500 mt-1">Your room is looking great.</p>
        </div>
      ) : (
        <>
          {editMode && (
            <p className="text-xs text-stone-500 mb-3">
              Click an empty spot on the canvas to place a plant.
            </p>
          )}
          <div className="space-y-2" role="list">
            {plants.map(plant => (
              <SidebarPlantItem
                key={plant.id}
                plant={plant}
                editMode={editMode}
              />
            ))}
          </div>
        </>
      )}
    </aside>
  );
}
