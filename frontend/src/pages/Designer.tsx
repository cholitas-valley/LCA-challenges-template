/**
 * Designer Page - Scandinavian Room View
 *
 * Interactive room view for arranging plants in fixed spots.
 * Displays a cozy Scandinavian illustration with 20 plant placement spots.
 *
 * @example
 * ```tsx
 * // In App.tsx routes
 * <Route path="/designer" element={<Designer />} />
 * ```
 */

import { useState, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout, LoadingSpinner, EmptyState } from '../components';
import {
  ScandinavianCanvas,
  DesignerSidebar,
  DesignerToolbar,
  PlantAssignmentModal,
  positionsToSpotAssignments,
  spotToPosition,
} from '../components/designer';
import { usePlants, useUpdatePlantPosition } from '../hooks';

/**
 * Designer page component for visual plant arrangement.
 */
export function Designer() {
  const navigate = useNavigate();
  const [editMode, setEditMode] = useState(false);
  const [selectedSpot, setSelectedSpot] = useState<number | null>(null);
  const { data, isLoading, isError } = usePlants();
  const updatePosition = useUpdatePlantPosition();

  const plants = data?.plants ?? [];

  // Compute spot assignments from plant positions
  const spotAssignments = useMemo(() => {
    return positionsToSpotAssignments(plants);
  }, [plants]);

  // Get unassigned plants (not in any spot)
  const assignedPlantIds = useMemo(() => {
    return new Set(Object.values(spotAssignments));
  }, [spotAssignments]);

  const unassignedPlants = useMemo(() => {
    return plants.filter(p => !assignedPlantIds.has(p.id));
  }, [plants, assignedPlantIds]);

  /**
   * Handle spot click.
   * In view mode: navigate to plant detail if occupied.
   * In edit mode: open assignment modal.
   */
  const handleSpotClick = useCallback(
    (spotId: number, currentPlantId: string | null) => {
      if (!editMode) {
        // In view mode, navigate to plant detail if occupied
        if (currentPlantId) {
          navigate(`/plants/${currentPlantId}`);
        }
        return;
      }

      // In edit mode, open assignment modal
      setSelectedSpot(spotId);
    },
    [editMode, navigate]
  );

  /**
   * Handle plant assignment to spot.
   */
  const handleAssignPlant = useCallback(
    async (plantId: string) => {
      if (selectedSpot === null) return;

      const position = spotToPosition(selectedSpot);
      await updatePosition.mutateAsync({ id: plantId, position });
      setSelectedSpot(null);
    },
    [selectedSpot, updatePosition]
  );

  /**
   * Handle removing plant from spot.
   * Uses off-canvas position to unassign.
   */
  const handleRemovePlant = useCallback(
    async (plantId: string) => {
      // Set position to off-canvas to unassign
      await updatePosition.mutateAsync({ id: plantId, position: null });
      setSelectedSpot(null);
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
              spotAssignments={spotAssignments}
              editMode={editMode}
              onSpotClick={handleSpotClick}
            />
          </div>
        </div>

        {/* Plant Assignment Modal */}
        {selectedSpot !== null && (
          <PlantAssignmentModal
            isOpen={true}
            spotId={selectedSpot}
            currentPlantId={spotAssignments[selectedSpot] ?? null}
            availablePlants={unassignedPlants}
            onAssign={handleAssignPlant}
            onRemove={handleRemovePlant}
            onClose={() => setSelectedSpot(null)}
          />
        )}
      </div>
    </Layout>
  );
}
