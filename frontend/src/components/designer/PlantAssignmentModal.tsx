/**
 * PlantAssignmentModal Component
 *
 * Modal for selecting which plant to assign to a spot,
 * or removing the current plant from a spot.
 */

import { useEffect, useRef } from 'react';
import { Plant } from '../../types/plant';
import { Button } from '../ui';
import { getSpotById } from './plantSpots';
import { PlantImage } from './PlantImage';
import { cn } from '../../lib/cn';

export interface PlantAssignmentModalProps {
  isOpen: boolean;
  spotId: number;
  currentPlantId: string | null;
  currentPlant?: Plant | null;
  availablePlants: Plant[];
  emptySpotIds: number[];
  onAssign: (plantId: string) => void;
  onRemove: (plantId: string) => void;
  onMoveToSpot: (plantId: string, newSpotId: number) => void;
  onClose: () => void;
}

export function PlantAssignmentModal({
  isOpen,
  spotId,
  currentPlantId,
  currentPlant,
  availablePlants,
  emptySpotIds,
  onAssign,
  onRemove,
  onMoveToSpot,
  onClose,
}: PlantAssignmentModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);
  const spot = getSpotById(spotId);
  const isOccupied = currentPlantId !== null;
  // Filter out current spot from empty spots list
  const otherEmptySpots = emptySpotIds.filter(id => id !== spotId);

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      // Focus trap
      modalRef.current?.focus();
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  // Handle click outside
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  if (!isOpen || !spot) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div
        ref={modalRef}
        className={cn(
          'bg-white rounded-xl shadow-xl w-full max-w-md mx-4',
          'transform transition-all duration-200 ease-out',
          'animate-in fade-in zoom-in-95'
        )}
        tabIndex={-1}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-stone-200">
          <h2 id="modal-title" className="text-lg font-semibold text-stone-900">
            {spot.label}
          </h2>
          <button
            onClick={onClose}
            className="p-2 text-stone-400 hover:text-stone-600 rounded-lg hover:bg-stone-100 transition-colors"
            aria-label="Close modal"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="px-6 py-4">
          {isOccupied ? (
            // Occupied spot - show current plant info and move/remove options
            <div className="space-y-4">
              {/* Current plant info */}
              {currentPlant && (
                <div className="flex items-center gap-3 p-3 bg-stone-50 rounded-lg border border-stone-200">
                  <PlantImage
                    species={currentPlant.species ?? 'unknown'}
                    size="small"
                    className="flex-shrink-0"
                  />
                  <div>
                    <div className="font-medium text-stone-900">{currentPlant.name}</div>
                    <div className="text-sm text-stone-500">{currentPlant.species ?? 'Unknown'}</div>
                  </div>
                </div>
              )}

              {/* Move to another spot */}
              {otherEmptySpots.length > 0 && (
                <div>
                  <p className="text-sm text-stone-600 mb-2">Move to another spot:</p>
                  <div className="max-h-40 overflow-y-auto space-y-1">
                    {otherEmptySpots.map(emptySpotId => {
                      const emptySpot = getSpotById(emptySpotId);
                      return emptySpot ? (
                        <button
                          key={emptySpotId}
                          className={cn(
                            'w-full p-2 text-left text-sm rounded-lg',
                            'bg-stone-50 border border-stone-200',
                            'hover:bg-amber-50 hover:border-amber-200',
                            'transition-colors'
                          )}
                          onClick={() => onMoveToSpot(currentPlantId, emptySpotId)}
                        >
                          {emptySpot.label}
                        </button>
                      ) : null;
                    })}
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-2 pt-2 border-t border-stone-200">
                <Button
                  variant="danger"
                  size="sm"
                  onClick={() => onRemove(currentPlantId)}
                >
                  Remove
                </Button>
                <Button variant="secondary" size="sm" onClick={onClose}>
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            // Empty spot - show plant selection
            <div>
              {availablePlants.length === 0 ? (
                <p className="text-sm text-stone-500">
                  No unassigned plants available. Create a new plant or remove one from another spot.
                </p>
              ) : (
                <>
                  <p className="text-sm text-stone-600 mb-3">
                    Select a plant to place in this spot:
                  </p>
                  <div className="max-h-60 overflow-y-auto space-y-2">
                    {availablePlants.map(plant => (
                      <button
                        key={plant.id}
                        className={cn(
                          'w-full p-3 text-left border rounded-lg',
                          'bg-stone-50 border-stone-200',
                          'hover:bg-amber-50 hover:border-amber-200',
                          'transition-colors flex items-center gap-3'
                        )}
                        onClick={() => onAssign(plant.id)}
                      >
                        <PlantImage
                          species={plant.species ?? 'unknown'}
                          size="small"
                          className="flex-shrink-0"
                        />
                        <div className="min-w-0 flex-1">
                          <div className="font-medium text-stone-900 truncate">
                            {plant.name}
                          </div>
                          <div className="text-sm text-stone-500 truncate">
                            {plant.species ?? 'Unknown species'}
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </>
              )}
              <div className="mt-4">
                <Button variant="secondary" onClick={onClose}>
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
