/**
 * Designer Page - Scandinavian Room View
 *
 * Interactive room view for arranging plants via drag-and-drop.
 * Displays a cozy Scandinavian illustration where plants can be freely positioned.
 */

import { useState, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout, LoadingSpinner, EmptyState } from '../components';
import {
  ScandinavianCanvas,
  DesignerSidebar,
  DesignerToolbar,
} from '../components/designer';
import { usePlants, useUpdatePlantPosition } from '../hooks';

/**
 * Designer page component for visual plant arrangement.
 */
export function Designer() {
  const navigate = useNavigate();
  const [editMode, setEditMode] = useState(false);
  const { data, isLoading, isError } = usePlants();
  const updatePosition = useUpdatePlantPosition();

  const plants = data?.plants ?? [];

  // Get unassigned plants (no position set)
  const unassignedPlants = useMemo(() => {
    return plants.filter(p => p.position === null || p.position === undefined);
  }, [plants]);

  /**
   * Handle dropping a plant at a new position on the canvas.
   */
  const handlePlantDrop = useCallback(
    async (plantId: string, position: { x: number; y: number }) => {
      await updatePosition.mutateAsync({ id: plantId, position });
    },
    [updatePosition]
  );

  /**
   * Handle clicking a plant in view mode - navigate to plant detail.
   */
  const handlePlantClick = useCallback(
    (plantId: string) => {
      navigate(`/plants/${plantId}`);
    },
    [navigate]
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
            description="Create some plants to arrange them in your room."
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
        {/* Sidebar with unassigned plants */}
        <DesignerSidebar plants={unassignedPlants} editMode={editMode} />

        {/* Main canvas area */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Toolbar */}
          <DesignerToolbar editMode={editMode} onEditModeChange={setEditMode} />

          {/* Scandinavian Room Canvas */}
          <div className="flex-1 p-4 overflow-auto bg-stone-100">
            <ScandinavianCanvas
              plants={plants}
              editMode={editMode}
              onPlantDrop={handlePlantDrop}
              onPlantClick={handlePlantClick}
            />
          </div>
        </div>
      </div>
    </Layout>
  );
}
