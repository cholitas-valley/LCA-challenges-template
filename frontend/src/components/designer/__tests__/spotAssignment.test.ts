import { positionsToSpotAssignments, spotToPosition } from '../spotAssignment';
import { Plant } from '../../../types/plant';

describe('spotAssignment', () => {
  describe('positionsToSpotAssignments', () => {
    const createPlant = (id: string, x: number, y: number): Plant => ({
      id,
      name: `Plant ${id}`,
      species: null,
      position: { x, y },
      thresholds: null,
      created_at: '2024-01-01',
      device_count: 0,
    });

    it('returns empty object for plants without positions', () => {
      const plants: Plant[] = [
        { ...createPlant('p1', 0, 0), position: null },
      ];
      const assignments = positionsToSpotAssignments(plants);
      expect(assignments).toEqual({});
    });

    it('assigns single plant to nearest spot', () => {
      // Position at 120,108 -> 15%, 18% -> closest to spot 1
      const plants = [createPlant('p1', 120, 108)];
      const assignments = positionsToSpotAssignments(plants);
      expect(assignments[1]).toBe('p1');
    });

    it('assigns multiple plants to different spots', () => {
      const plants = [
        createPlant('p1', 120, 108),  // ~15%, 18% -> spot 1
        createPlant('p2', 200, 108),  // ~25%, 18% -> spot 2
      ];
      const assignments = positionsToSpotAssignments(plants);
      expect(Object.keys(assignments)).toHaveLength(2);
      expect(assignments[1]).toBe('p1');
      expect(assignments[2]).toBe('p2');
    });

    it('does not assign two plants to the same spot', () => {
      const plants = [
        createPlant('p1', 120, 108),  // ~15%, 18% -> spot 1
        createPlant('p2', 121, 109),  // ~15.1%, 18.2% -> also near spot 1, should go to spot 2
      ];
      const assignments = positionsToSpotAssignments(plants);
      const spotIds = Object.keys(assignments).map(Number);
      expect(new Set(spotIds).size).toBe(spotIds.length);
    });

    it('handles plants mixed with and without positions', () => {
      const plants: Plant[] = [
        createPlant('p1', 120, 108),
        { ...createPlant('p2', 0, 0), position: null },
        createPlant('p3', 320, 312),  // ~40%, 52% -> sideboard area
      ];
      const assignments = positionsToSpotAssignments(plants);
      expect(Object.keys(assignments)).toHaveLength(2);
      expect(assignments[1]).toBe('p1');
      // p3 should be assigned to a sideboard spot
    });
  });

  describe('spotToPosition', () => {
    it('converts spot 1 to correct coordinates', () => {
      const pos = spotToPosition(1);
      // spot 1 is at x: 15, y: 18 (percentages)
      expect(pos.x).toBe(120);  // 15% of 800
      expect(pos.y).toBe(108);  // 18% of 600
    });

    it('converts floor spot to correct coordinates', () => {
      const pos = spotToPosition(17);
      // spot 17 is at x: 40, y: 88
      expect(pos.x).toBe(320);  // 40% of 800
      expect(pos.y).toBe(528);  // 88% of 600
    });

    it('returns center coordinates for invalid spot ID', () => {
      const pos = spotToPosition(999);
      expect(pos.x).toBe(400);  // Default center
      expect(pos.y).toBe(300);
    });

    it('returns center coordinates for spot ID 0', () => {
      const pos = spotToPosition(0);
      expect(pos.x).toBe(400);
      expect(pos.y).toBe(300);
    });

    it('returns rounded coordinates', () => {
      const pos = spotToPosition(2);
      // spot 2 is at x: 25, y: 18
      expect(pos.x).toBe(200);  // 25% of 800 = 200 (already whole)
      expect(pos.y).toBe(108);  // 18% of 600 = 108 (already whole)
      expect(Number.isInteger(pos.x)).toBe(true);
      expect(Number.isInteger(pos.y)).toBe(true);
    });
  });
});
