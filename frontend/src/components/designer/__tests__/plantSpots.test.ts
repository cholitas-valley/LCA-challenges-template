import { PLANT_SPOTS, getSpotById, findNearestSpot } from '../plantSpots';

describe('plantSpots', () => {
  it('defines 20 spots', () => {
    expect(PLANT_SPOTS).toHaveLength(20);
  });

  it('has unique IDs', () => {
    const ids = PLANT_SPOTS.map(s => s.id);
    expect(new Set(ids).size).toBe(20);
  });

  it('has IDs from 1 to 20', () => {
    const ids = PLANT_SPOTS.map(s => s.id).sort((a, b) => a - b);
    expect(ids).toEqual(Array.from({ length: 20 }, (_, i) => i + 1));
  });

  it('has 6 shelf spots', () => {
    const shelfSpots = PLANT_SPOTS.filter(s => s.location === 'shelf');
    expect(shelfSpots).toHaveLength(6);
  });

  it('has 8 sideboard spots', () => {
    const sideboardSpots = PLANT_SPOTS.filter(s => s.location === 'sideboard');
    expect(sideboardSpots).toHaveLength(8);
  });

  it('has 6 floor spots', () => {
    const floorSpots = PLANT_SPOTS.filter(s => s.location === 'floor');
    expect(floorSpots).toHaveLength(6);
  });

  it('all spots have x and y between 0 and 100', () => {
    for (const spot of PLANT_SPOTS) {
      expect(spot.x).toBeGreaterThanOrEqual(0);
      expect(spot.x).toBeLessThanOrEqual(100);
      expect(spot.y).toBeGreaterThanOrEqual(0);
      expect(spot.y).toBeLessThanOrEqual(100);
    }
  });

  describe('getSpotById', () => {
    it('returns correct spot for valid ID', () => {
      const spot = getSpotById(1);
      expect(spot?.id).toBe(1);
      expect(spot?.location).toBe('shelf');
    });

    it('returns undefined for invalid ID', () => {
      const spot = getSpotById(999);
      expect(spot).toBeUndefined();
    });

    it('returns undefined for ID 0', () => {
      const spot = getSpotById(0);
      expect(spot).toBeUndefined();
    });
  });

  describe('findNearestSpot', () => {
    it('returns closest spot for exact coordinates', () => {
      const spot = findNearestSpot(15, 18); // Near spot 1
      expect(spot.id).toBe(1);
    });

    it('returns closest spot for nearby coordinates', () => {
      const spot = findNearestSpot(16, 19); // Slightly off from spot 1
      expect(spot.id).toBe(1);
    });

    it('returns floor spot for bottom coordinates', () => {
      const spot = findNearestSpot(40, 88); // Near spot 17 (floor center-left)
      expect(spot.id).toBe(17);
      expect(spot.location).toBe('floor');
    });

    it('returns sideboard spot for middle coordinates', () => {
      const spot = findNearestSpot(42, 52); // Near spot 10 (sideboard center)
      expect(spot.id).toBe(10);
      expect(spot.location).toBe('sideboard');
    });

    it('handles edge coordinates (0, 0)', () => {
      const spot = findNearestSpot(0, 0);
      // Should find the closest spot (likely spot 1 at x:15, y:18)
      expect(spot).toBeDefined();
      expect(spot.id).toBe(1);
    });

    it('handles edge coordinates (100, 100)', () => {
      const spot = findNearestSpot(100, 100);
      // Should find the closest spot (likely spot 20 at x:90, y:82)
      expect(spot).toBeDefined();
      expect(spot.id).toBe(20);
    });
  });
});
