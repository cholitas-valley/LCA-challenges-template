/**
 * Fixed plant placement spots for Scandinavian Room View.
 * Each spot has a fixed position relative to the room background image.
 * Coordinates are percentages (0-100) of the canvas dimensions.
 */

export type SpotLocation = 'shelf' | 'sideboard' | 'floor';
export type SpotSize = 'small' | 'medium' | 'large';

export interface PlantSpot {
  /** Unique spot ID (1-20) */
  id: number;
  /** Location category */
  location: SpotLocation;
  /** X position as percentage (0-100) */
  x: number;
  /** Y position as percentage (0-100) */
  y: number;
  /** Recommended plant size for this spot */
  size: SpotSize;
  /** Optional label for accessibility */
  label: string;
}

/**
 * 20 fixed plant spots distributed across the room.
 * Positions are calibrated to match the room.png illustration.
 */
export const PLANT_SPOTS: PlantSpot[] = [
  // Floating shelves (spots 1-6) - top area of room
  { id: 1, location: 'shelf', x: 15, y: 18, size: 'small', label: 'Left shelf, position 1' },
  { id: 2, location: 'shelf', x: 25, y: 18, size: 'small', label: 'Left shelf, position 2' },
  { id: 3, location: 'shelf', x: 35, y: 18, size: 'medium', label: 'Left shelf, position 3' },
  { id: 4, location: 'shelf', x: 60, y: 18, size: 'small', label: 'Right shelf, position 1' },
  { id: 5, location: 'shelf', x: 70, y: 18, size: 'small', label: 'Right shelf, position 2' },
  { id: 6, location: 'shelf', x: 80, y: 18, size: 'medium', label: 'Right shelf, position 3' },

  // Sideboard surface (spots 7-14) - middle area
  { id: 7, location: 'sideboard', x: 12, y: 52, size: 'small', label: 'Sideboard left end' },
  { id: 8, location: 'sideboard', x: 22, y: 52, size: 'medium', label: 'Sideboard left-center' },
  { id: 9, location: 'sideboard', x: 32, y: 52, size: 'small', label: 'Sideboard center-left' },
  { id: 10, location: 'sideboard', x: 42, y: 52, size: 'medium', label: 'Sideboard center' },
  { id: 11, location: 'sideboard', x: 52, y: 52, size: 'small', label: 'Sideboard center-right' },
  { id: 12, location: 'sideboard', x: 62, y: 52, size: 'medium', label: 'Sideboard right-center' },
  { id: 13, location: 'sideboard', x: 72, y: 52, size: 'small', label: 'Sideboard right' },
  { id: 14, location: 'sideboard', x: 82, y: 52, size: 'medium', label: 'Sideboard right end' },

  // Floor (spots 15-20) - bottom area
  { id: 15, location: 'floor', x: 8, y: 82, size: 'large', label: 'Floor far left' },
  { id: 16, location: 'floor', x: 22, y: 85, size: 'large', label: 'Floor left' },
  { id: 17, location: 'floor', x: 40, y: 88, size: 'large', label: 'Floor center-left' },
  { id: 18, location: 'floor', x: 58, y: 88, size: 'large', label: 'Floor center-right' },
  { id: 19, location: 'floor', x: 75, y: 85, size: 'large', label: 'Floor right' },
  { id: 20, location: 'floor', x: 90, y: 82, size: 'large', label: 'Floor far right' },
];

/**
 * Get a spot by its ID.
 */
export function getSpotById(id: number): PlantSpot | undefined {
  return PLANT_SPOTS.find(spot => spot.id === id);
}

/**
 * Find the nearest spot to given coordinates.
 * Used for mapping existing plant positions to fixed spots.
 */
export function findNearestSpot(x: number, y: number): PlantSpot {
  let nearest = PLANT_SPOTS[0];
  let minDistance = Infinity;

  for (const spot of PLANT_SPOTS) {
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
