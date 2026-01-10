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
 * Fixed plant spots calibrated to match the room.png illustration.
 *
 * Room layout:
 * - Two floating shelves on RIGHT wall (to the right of the painting, x: 68-93)
 * - Sideboard/credenza in CENTER (has lamp ~43%, books ~68%, vase ~80%)
 * - Small plant stand on FAR RIGHT (x: 89)
 * - Floor space on the rug
 * - Cat sleeping on rug at x~72 - avoid!
 * - Armchair on LEFT - NO spots there!
 *
 * Y positions are set so plants sit ON the surface (bottom of plant touches the line)
 */
export const PLANT_SPOTS: PlantSpot[] = [
  // Upper floating shelf - 4 spots (shelf surface at y~24%)
  { id: 1, location: 'shelf', x: 71, y: 24, size: 'small', label: 'Upper shelf, spot 1' },
  { id: 2, location: 'shelf', x: 78, y: 24, size: 'small', label: 'Upper shelf, spot 2' },
  { id: 3, location: 'shelf', x: 85, y: 24, size: 'small', label: 'Upper shelf, spot 3' },
  { id: 4, location: 'shelf', x: 92, y: 24, size: 'small', label: 'Upper shelf, spot 4' },

  // Lower floating shelf - 4 spots (shelf surface at y~36%)
  { id: 5, location: 'shelf', x: 71, y: 36, size: 'small', label: 'Lower shelf, spot 1' },
  { id: 6, location: 'shelf', x: 78, y: 36, size: 'small', label: 'Lower shelf, spot 2' },
  { id: 7, location: 'shelf', x: 85, y: 36, size: 'small', label: 'Lower shelf, spot 3' },
  { id: 8, location: 'shelf', x: 92, y: 36, size: 'small', label: 'Lower shelf, spot 4' },

  // Sideboard surface - 2 spots (surface at y~55%)
  { id: 9, location: 'sideboard', x: 72, y: 55, size: 'small', label: 'Sideboard, right of books' },
  { id: 10, location: 'sideboard', x: 76, y: 55, size: 'small', label: 'Sideboard, by vase' },

  // Plant stand (far right, stand surface at y~65%)
  { id: 11, location: 'floor', x: 89, y: 65, size: 'medium', label: 'Plant stand' },

  // Floor spots on the rug (floor line at y~93%)
  { id: 12, location: 'floor', x: 40, y: 93, size: 'medium', label: 'Rug, center left' },
  { id: 13, location: 'floor', x: 55, y: 93, size: 'medium', label: 'Rug, center right' },
  { id: 14, location: 'floor', x: 85, y: 93, size: 'medium', label: 'Floor, bottom right' },
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
