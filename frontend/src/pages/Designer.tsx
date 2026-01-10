/**
 * Designer Page
 *
 * Interactive floor plan view for arranging plants in a visual space.
 * Supports view and edit modes, drag-and-drop from sidebar, and
 * position persistence.
 *
 * @example
 * ```tsx
 * // In App.tsx routes
 * <Route path="/designer" element={<Designer />} />
 * ```
 */

import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout, LoadingSpinner, EmptyState } from '../components';
import { DesignerCanvas, DesignerSidebar, DesignerToolbar } from '../components/designer';
import { usePlants, useUpdatePlantPosition } from '../hooks';

/**
 * Designer page component for visual plant arrangement.
 */
export function Designer() {
  const navigate = useNavigate();
  const [editMode, setEditMode] = useState(false);
  const { data, isLoading, isError } = usePlants();
  const updatePosition = useUpdatePlantPosition();

  // Separate plants into placed and unplaced
  const plants = data?.plants ?? [];
  const placedPlants = plants.filter(p => p.position !== null);
  const unplacedPlants = plants.filter(p => p.position === null);

  /**
   * Handle position change from canvas drag.
   */
  const handlePositionChange = useCallback(
    async (plantId: string, x: number, y: number) => {
      await updatePosition.mutateAsync({ id: plantId, position: { x, y } });
    },
    [updatePosition]
  );

  /**
   * Handle plant click to navigate to detail.
   */
  const handlePlantClick = useCallback(
    (plantId: string) => {
      navigate(`/plants/${plantId}`);
    },
    [navigate]
  );

  /**
   * Handle drop from sidebar.
   */
  const handleDropFromSidebar = useCallback(
    async (plantId: string, x: number, y: number) => {
      await updatePosition.mutateAsync({ id: plantId, position: { x, y } });
    },
    [updatePosition]
  );

  // Loading state
  if (isLoading) {
    return (
      <Layout>
        <div className="flex h-[calc(100vh-200px)] items-center justify-center">
          <LoadingSpinner />
        </div>
      </Layout>
    );
  }

  // Error state
  if (isError) {
    return (
      <Layout>
        <div className="flex h-[calc(100vh-200px)] items-center justify-center">
          <EmptyState
            title="Error Loading Plants"
            description="Failed to load plants. Please try again."
            action={{
              label: 'Retry',
              onClick: () => window.location.reload(),
            }}
          />
        </div>
      </Layout>
    );
  }

  // Empty state - no plants
  if (plants.length === 0) {
    return (
      <Layout>
        <div className="flex h-[calc(100vh-200px)] items-center justify-center">
          <EmptyState
            title="No Plants Yet"
            description="Create some plants to arrange them in your space."
            action={{
              label: 'Add Plants',
              onClick: () => navigate('/plants'),
            }}
          />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="flex h-[calc(100vh-140px)]">
        {/* Sidebar */}
        <DesignerSidebar plants={unplacedPlants} editMode={editMode} />
        
        {/* Main canvas area */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Toolbar */}
          <DesignerToolbar editMode={editMode} onEditModeChange={setEditMode} />
          
          {/* Canvas */}
          <div className="flex-1 p-4 overflow-auto">
            <DesignerCanvas
              plants={placedPlants}
              editMode={editMode}
              onPositionChange={handlePositionChange}
              onPlantClick={handlePlantClick}
              onDrop={handleDropFromSidebar}
            />
            
            {/* Hint text when no plants are placed */}
            {placedPlants.length === 0 && unplacedPlants.length > 0 && (
              <div className="text-center mt-4 text-sm text-gray-500">
                {editMode
                  ? 'Drag plants from the sidebar to place them on the canvas.'
                  : 'Switch to Edit mode to place plants on the canvas.'}
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
