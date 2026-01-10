/**
 * PlantIcon Component Tests
 *
 * Tests for the PlantIcon component that renders SVG plant icons
 * based on species name.
 *
 * Note: These tests require vitest and @testing-library/react to be installed.
 * To run: npm install -D vitest @testing-library/react jsdom && npm run test
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { PlantIcon, normalizeSpecies, getIconSvg, ICON_MAP } from '../PlantIcon';

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

describe('getIconSvg', () => {
  it('returns monstera icon for monstera species', () => {
    const svg = getIconSvg('Monstera Deliciosa');
    expect(svg).toContain('viewBox');
    expect(svg).toContain('currentColor');
  });

  it('returns snake plant icon for snake plant species', () => {
    const svg = getIconSvg('Snake Plant');
    expect(svg).toContain('viewBox');
  });

  it('returns fallback icon for unknown species', () => {
    const svg = getIconSvg('some-random-plant-xyz');
    // Should return the unknown/fallback SVG
    expect(svg).toContain('viewBox');
  });

  it('handles variations of species names', () => {
    // All these should map to the same icon
    const pothos1 = getIconSvg('Pothos');
    const pothos2 = getIconSvg('Golden Pothos');
    const pothos3 = getIconSvg("Devil's Ivy");
    
    expect(pothos1).toBe(pothos2);
    expect(pothos2).toBe(pothos3);
  });
});

describe('ICON_MAP', () => {
  it('contains all 20 plant species plus variations', () => {
    const uniqueValues = new Set(Object.values(ICON_MAP));
    // Should have at least 21 unique icons (20 plants + unknown)
    expect(uniqueValues.size).toBeGreaterThanOrEqual(21);
  });

  it('has lowercase keys', () => {
    Object.keys(ICON_MAP).forEach(key => {
      expect(key).toBe(key.toLowerCase());
    });
  });
});

describe('PlantIcon', () => {
  it('renders monstera icon for monstera species', () => {
    render(<PlantIcon species="Monstera Deliciosa" />);
    const icon = screen.getByRole('img');
    expect(icon).toBeInTheDocument();
    expect(icon).toHaveAttribute('aria-label', 'Monstera Deliciosa plant icon');
  });

  it('renders fallback icon for unknown species', () => {
    render(<PlantIcon species="Unknown Plant XYZ" />);
    const icon = screen.getByRole('img');
    expect(icon).toBeInTheDocument();
    expect(icon).toHaveAttribute('aria-label', 'Unknown Plant XYZ plant icon');
  });

  it('applies size prop correctly', () => {
    render(<PlantIcon species="Monstera" size={64} />);
    const icon = screen.getByRole('img');
    expect(icon).toHaveStyle({ width: '64px', height: '64px' });
  });

  it('uses default size of 48 when not specified', () => {
    render(<PlantIcon species="Monstera" />);
    const icon = screen.getByRole('img');
    expect(icon).toHaveStyle({ width: '48px', height: '48px' });
  });

  it('applies className correctly', () => {
    render(<PlantIcon species="Monstera" className="text-gray-700 custom-class" />);
    const icon = screen.getByRole('img');
    expect(icon).toHaveClass('text-gray-700');
    expect(icon).toHaveClass('custom-class');
  });

  it('renders snake plant icon for snake plant species', () => {
    render(<PlantIcon species="snake plant" />);
    const icon = screen.getByRole('img');
    expect(icon).toBeInTheDocument();
  });

  it('renders cactus icon for cactus species', () => {
    render(<PlantIcon species="Cactus" />);
    const icon = screen.getByRole('img');
    expect(icon).toBeInTheDocument();
  });

  it('handles species with special characters', () => {
    render(<PlantIcon species="Devil's Ivy" />);
    const icon = screen.getByRole('img');
    expect(icon).toBeInTheDocument();
  });
});
