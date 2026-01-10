/**
 * Utility functions for managing spot assignments.
 */

import { Plant, PlantPosition } from '../../types/plant';
import { PLANT_SPOTS, PlantSpot } from './plantSpots';

/**
 * Check if a position is "off-canvas" (unassigned).
 * Off-canvas positions have negative coordinates.
 */
function isOffCanvas(position: PlantPosition): boolean {
  return position.x < 0 || position.y < 0;
}

/**
 * Find nearest spot that is not already used.
 */
function findNearestSpotAvailable(
  x: number,
  y: number,
  usedSpots: Set<number>
): PlantSpot | null {
  let nearest: PlantSpot | null = null;
  let minDistance = Infinity;

  for (const spot of PLANT_SPOTS) {
    if (usedSpots.has(spot.id)) continue;

    const dx = spot.x - x;
    const dy = spot.y - y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance < minDistance) {
      minDistance = distance;
      nearest = spot;
    }
  }

  return nearest;
}

/**
 * Convert plant positions to spot assignments.
 * Maps existing position data to nearest fixed spots.
 * Ignores plants with null or off-canvas positions.
 */
export function positionsToSpotAssignments(
  plants: Plant[]
): Record<number, string> {
  const assignments: Record<number, string> = {};
  const usedSpots = new Set<number>();

  // Filter to plants with valid on-canvas positions
  const positionedPlants = plants.filter(
    (p): p is Plant & { position: PlantPosition } =>
      p.position != null && !isOffCanvas(p.position)
  );

  for (const plant of positionedPlants) {

    // Convert position to percentage (assuming 800x600 canvas from Feature 5)
    const xPercent = (plant.position.x / 800) * 100;
    const yPercent = (plant.position.y / 600) * 100;

    // Find nearest available spot
    const nearestSpot = findNearestSpotAvailable(xPercent, yPercent, usedSpots);
    if (nearestSpot) {
      assignments[nearestSpot.id] = plant.id;
      usedSpots.add(nearestSpot.id);
    }
  }

  return assignments;
}

/**
 * Convert spot assignment back to position for backend storage.
 * Uses spot coordinates converted to the 800x600 canvas coordinate system.
 */
export function spotToPosition(spotId: number): PlantPosition {
  const spot = PLANT_SPOTS.find(s => s.id === spotId);
  if (!spot) {
    return { x: 400, y: 300 }; // Default center
  }

  return {
    x: Math.round((spot.x / 100) * 800),
    y: Math.round((spot.y / 100) * 600),
  };
}
