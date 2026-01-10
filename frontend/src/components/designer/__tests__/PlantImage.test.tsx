/**
 * PlantImage Component Tests
 *
 * Tests for the PlantImage component that renders PNG plant illustrations
 * based on species name.
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import {
  PlantImage,
  normalizeSpecies,
  getPlantImage,
  IMAGE_MAP,
  SIZE_MAP,
  FALLBACK_IMAGE,
} from '../PlantImage';

describe('normalizeSpecies', () => {
  it('converts to lowercase', () => {
    expect(normalizeSpecies('Monstera')).toBe('monstera');
    expect(normalizeSpecies('SNAKE PLANT')).toBe('snake plant');
  });

  it('removes special characters', () => {
    expect(normalizeSpecies("Devil's Ivy")).toBe('devils ivy');
    expect(normalizeSpecies('ZZ-Plant!')).toBe('zzplant');
  });

  it('normalizes whitespace', () => {
    expect(normalizeSpecies('  snake   plant  ')).toBe('snake plant');
  });

  it('handles empty string', () => {
    expect(normalizeSpecies('')).toBe('');
  });
});

describe('getPlantImage', () => {
  it('returns monstera image for monstera species', () => {
    const img = getPlantImage('Monstera Deliciosa');
    expect(img).toContain('monstera');
  });

  it('returns snake plant image for snake plant species', () => {
    const img = getPlantImage('Snake Plant');
    expect(img).toContain('snakeplant');
  });

  it('returns fallback image for unknown species', () => {
    const img = getPlantImage('some-random-plant-xyz');
    expect(img).toBe(FALLBACK_IMAGE);
  });

  it('handles variations of species names', () => {
    // All these should map to the same image
    const pothos1 = getPlantImage('Pothos');
    const pothos2 = getPlantImage('Golden Pothos');
    const pothos3 = getPlantImage("Devil's Ivy");
    
    expect(pothos1).toBe(pothos2);
    expect(pothos2).toBe(pothos3);
  });
});

describe('IMAGE_MAP', () => {
  it('contains mappings for all 20 plant species', () => {
    // Count unique image values (should be 20 plants)
    const uniqueImages = new Set(Object.values(IMAGE_MAP));
    expect(uniqueImages.size).toBeGreaterThanOrEqual(20);
  });

  it('has lowercase keys', () => {
    Object.keys(IMAGE_MAP).forEach(key => {
      expect(key).toBe(key.toLowerCase());
    });
  });

  it('includes monstera mapping', () => {
    expect(IMAGE_MAP['monstera']).toBeDefined();
  });

  it('includes snake plant mapping', () => {
    expect(IMAGE_MAP['snake plant']).toBeDefined();
    expect(IMAGE_MAP['snakeplant']).toBeDefined();
  });

  it('includes cactus mapping', () => {
    expect(IMAGE_MAP['cactus']).toBeDefined();
    expect(IMAGE_MAP['cacti']).toBeDefined();
  });
});

describe('SIZE_MAP', () => {
  it('defines small size as 80x100', () => {
    expect(SIZE_MAP.small).toEqual({ width: 80, height: 100 });
  });

  it('defines medium size as 120x150', () => {
    expect(SIZE_MAP.medium).toEqual({ width: 120, height: 150 });
  });

  it('defines large size as 160x200', () => {
    expect(SIZE_MAP.large).toEqual({ width: 160, height: 200 });
  });
});

describe('PlantImage', () => {
  it('renders image for known species', () => {
    render(<PlantImage species="Monstera" />);
    const img = screen.getByRole('img');
    expect(img).toBeInTheDocument();
    expect(img).toHaveAttribute('alt', 'Monstera plant');
  });

  it('renders with custom alt text', () => {
    render(<PlantImage species="Monstera" alt="Custom alt text" />);
    const img = screen.getByRole('img');
    expect(img).toHaveAttribute('alt', 'Custom alt text');
  });

  it('uses fallback for unknown species', () => {
    render(<PlantImage species="unknown-plant-xyz" />);
    const img = screen.getByRole('img');
    expect(img).toBeInTheDocument();
    expect(img).toHaveAttribute('src', expect.stringContaining('monstera'));
  });

  it('applies small size dimensions', () => {
    render(<PlantImage species="Pothos" size="small" />);
    const img = screen.getByRole('img');
    expect(img).toHaveAttribute('width', '80');
    expect(img).toHaveAttribute('height', '100');
  });

  it('applies medium size dimensions by default', () => {
    render(<PlantImage species="Pothos" />);
    const img = screen.getByRole('img');
    expect(img).toHaveAttribute('width', '120');
    expect(img).toHaveAttribute('height', '150');
  });

  it('applies large size dimensions', () => {
    render(<PlantImage species="Pothos" size="large" />);
    const img = screen.getByRole('img');
    expect(img).toHaveAttribute('width', '160');
    expect(img).toHaveAttribute('height', '200');
  });

  it('normalizes species names', () => {
    render(<PlantImage species="SNAKE PLANT" />);
    const img = screen.getByRole('img');
    expect(img).toHaveAttribute('src', expect.stringContaining('snakeplant'));
  });

  it('applies className correctly', () => {
    render(<PlantImage species="Monstera" className="custom-class" />);
    const container = screen.getByRole('img').parentElement;
    expect(container).toHaveClass('custom-class');
  });

  it('has lazy loading enabled', () => {
    render(<PlantImage species="Monstera" />);
    const img = screen.getByRole('img');
    expect(img).toHaveAttribute('loading', 'lazy');
  });

  it('renders snake plant icon for snake plant species', () => {
    render(<PlantImage species="snake plant" />);
    const img = screen.getByRole('img');
    expect(img).toBeInTheDocument();
    expect(img).toHaveAttribute('src', expect.stringContaining('snakeplant'));
  });

  it('renders cactus for cactus species', () => {
    render(<PlantImage species="Cactus" />);
    const img = screen.getByRole('img');
    expect(img).toBeInTheDocument();
    expect(img).toHaveAttribute('src', expect.stringContaining('cactus'));
  });

  it('handles species with special characters', () => {
    render(<PlantImage species="Devil's Ivy" />);
    const img = screen.getByRole('img');
    expect(img).toBeInTheDocument();
    // Should resolve to pothos
    expect(img).toHaveAttribute('src', expect.stringContaining('pothos'));
  });

  it('handles image load event', async () => {
    render(<PlantImage species="Monstera" />);
    const img = screen.getByRole('img');
    
    // Simulate image load
    fireEvent.load(img);
    
    await waitFor(() => {
      expect(img).toHaveStyle({ opacity: '1' });
    });
  });

  it('handles image error by using fallback', async () => {
    render(<PlantImage species="Monstera" />);
    const img = screen.getByRole('img');
    
    // Simulate image error
    fireEvent.error(img);
    
    await waitFor(() => {
      expect(img).toHaveAttribute('src', FALLBACK_IMAGE);
    });
  });
});
