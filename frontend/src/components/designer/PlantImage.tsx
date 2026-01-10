/**
 * PlantImage Component
 *
 * Renders WebP plant illustrations based on species name.
 * Used in the Scandinavian Room View for botanically accurate plant images.
 *
 * @example
 * ```tsx
 * <PlantImage species="Monstera Deliciosa" size="medium" />
 * <PlantImage species="snake plant" size="small" />
 * <PlantImage species="unknown-variety" /> // Uses fallback
 * ```
 */

import { useState } from 'react';
import { cn } from '../../lib/cn';

// Static imports for plant images (optimized WebP format)
import monsteraImg from '../../assets/plants/monstera.webp';
import snakeplantImg from '../../assets/plants/snakeplant.webp';
import pothosImg from '../../assets/plants/pothos.webp';
import fiddleImg from '../../assets/plants/fiddle.webp';
import spiderImg from '../../assets/plants/spider.webp';
import peacelilyImg from '../../assets/plants/peacelily.webp';
import rubberImg from '../../assets/plants/rubber.webp';
import zzplantImg from '../../assets/plants/zzplant.webp';
import philondendronImg from '../../assets/plants/philondendron.webp';
import aloeveraImg from '../../assets/plants/aloevera.webp';
import bostonImg from '../../assets/plants/boston.webp';
import chineseImg from '../../assets/plants/chinese.webp';
import dracaenaImg from '../../assets/plants/dracaena.webp';
import jadeImg from '../../assets/plants/jade.webp';
import stringofpearlsImg from '../../assets/plants/stringofpearls.webp';
import calatheaImg from '../../assets/plants/calathea.webp';
import birdofparadiseImg from '../../assets/plants/birdofparadise.webp';
import englishivyImg from '../../assets/plants/englishivy.webp';
import succulentaImg from '../../assets/plants/succulenta.webp';
import cactusImg from '../../assets/plants/cactus.webp';

export interface PlantImageProps {
  /** Plant species name (normalized for matching) */
  species: string;
  /** Size variant: small (shelf), medium (sideboard), large (floor) */
  size?: 'small' | 'medium' | 'large';
  /** Additional CSS classes */
  className?: string;
  /** Alt text override */
  alt?: string;
}

/** Size dimensions in pixels */
const SIZE_MAP = {
  small: { width: 80, height: 100 },
  medium: { width: 120, height: 150 },
  large: { width: 160, height: 200 },
} as const;

/**
 * Normalize a species string for matching against the image map.
 * Converts to lowercase, removes special characters, and trims whitespace.
 */
function normalizeSpecies(species: string): string {
  return species
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '') // Remove special characters
    .replace(/\s+/g, ' ')        // Normalize whitespace
    .trim();
}

/**
 * Map of normalized species names to their imported image paths.
 * Keys are lowercase with spaces (e.g., "monstera deliciosa").
 */
const IMAGE_MAP: Record<string, string> = {
  // Monstera variations
  'monstera': monsteraImg,
  'monstera deliciosa': monsteraImg,
  
  // Snake plant variations
  'snake plant': snakeplantImg,
  'snakeplant': snakeplantImg,
  'sansevieria': snakeplantImg,
  'sansevieria trifasciata': snakeplantImg,
  
  // Pothos variations
  'pothos': pothosImg,
  'golden pothos': pothosImg,
  'devils ivy': pothosImg,
  'epipremnum aureum': pothosImg,
  
  // Fiddle leaf fig variations
  'fiddle leaf fig': fiddleImg,
  'fiddleleaf fig': fiddleImg,
  'ficus lyrata': fiddleImg,
  'fiddle': fiddleImg,
  
  // Spider plant variations
  'spider plant': spiderImg,
  'spiderplant': spiderImg,
  'chlorophytum comosum': spiderImg,
  'chlorophytum': spiderImg,
  
  // Peace lily variations
  'peace lily': peacelilyImg,
  'peacelily': peacelilyImg,
  'spathiphyllum': peacelilyImg,
  
  // Rubber plant variations
  'rubber plant': rubberImg,
  'rubberplant': rubberImg,
  'rubber tree': rubberImg,
  'ficus elastica': rubberImg,
  
  // ZZ plant variations
  'zz plant': zzplantImg,
  'zzplant': zzplantImg,
  'zz': zzplantImg,
  'zamioculcas zamiifolia': zzplantImg,
  'zamioculcas': zzplantImg,
  
  // Philodendron variations
  'philodendron': philondendronImg,
  'heartleaf philodendron': philondendronImg,
  'philondendron': philondendronImg,
  
  // Aloe vera variations
  'aloe vera': aloeveraImg,
  'aloevera': aloeveraImg,
  'aloe': aloeveraImg,
  
  // Boston fern variations
  'boston fern': bostonImg,
  'bostonfern': bostonImg,
  'nephrolepis exaltata': bostonImg,
  'fern': bostonImg,
  'boston': bostonImg,
  
  // Chinese evergreen variations
  'chinese evergreen': chineseImg,
  'aglaonema': chineseImg,
  'chinese': chineseImg,
  
  // Dracaena variations
  'dracaena': dracaenaImg,
  'dracaena marginata': dracaenaImg,
  'dragon tree': dracaenaImg,
  
  // Jade plant variations
  'jade plant': jadeImg,
  'jadeplant': jadeImg,
  'jade': jadeImg,
  'crassula ovata': jadeImg,
  'crassula': jadeImg,
  
  // String of pearls variations
  'string of pearls': stringofpearlsImg,
  'stringofpearls': stringofpearlsImg,
  'senecio rowleyanus': stringofpearlsImg,
  'senecio': stringofpearlsImg,
  
  // Calathea variations
  'calathea': calatheaImg,
  'prayer plant': calatheaImg,
  
  // Bird of paradise variations
  'bird of paradise': birdofparadiseImg,
  'birdofparadise': birdofparadiseImg,
  'strelitzia': birdofparadiseImg,
  'strelitzia reginae': birdofparadiseImg,
  
  // English ivy variations
  'english ivy': englishivyImg,
  'englishivy': englishivyImg,
  'ivy': englishivyImg,
  'hedera helix': englishivyImg,
  'hedera': englishivyImg,
  
  // Succulent variations
  'succulent': succulentaImg,
  'succulenta': succulentaImg,
  'echeveria': succulentaImg,
  
  // Cactus variations
  'cactus': cactusImg,
  'cacti': cactusImg,
};

/** Default fallback image (use monstera as generic plant) */
const FALLBACK_IMAGE = monsteraImg;

/**
 * Get the image URL for a species, falling back to monstera if not found.
 */
function getPlantImage(species: string): string {
  const normalized = normalizeSpecies(species);
  return IMAGE_MAP[normalized] ?? FALLBACK_IMAGE;
}

/**
 * PlantImage component that renders plant PNG images based on species name.
 */
export function PlantImage({
  species,
  size = 'medium',
  className = '',
  alt,
}: PlantImageProps) {
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  const imageSrc = hasError ? FALLBACK_IMAGE : getPlantImage(species);
  const dimensions = SIZE_MAP[size];
  const altText = alt ?? `${species} plant`;
  
  return (
    <div
      className={cn('plant-image-container relative', className)}
      style={{
        width: dimensions.width,
        height: dimensions.height,
      }}
    >
      {isLoading && (
        <div
          className="absolute inset-0 flex items-center justify-center bg-gray-200"
          aria-hidden="true"
        >
          <span className="text-gray-400 text-xs">...</span>
        </div>
      )}
      <img
        src={imageSrc}
        alt={altText}
        width={dimensions.width}
        height={dimensions.height}
        style={{
          width: dimensions.width,
          height: dimensions.height,
          objectFit: 'contain',
          opacity: isLoading ? 0 : 1,
          transition: 'opacity 0.2s ease-in-out',
        }}
        onLoad={() => setIsLoading(false)}
        onError={() => {
          setHasError(true);
          setIsLoading(false);
        }}
        loading="lazy"
      />
    </div>
  );
}

// Export for testing
export { normalizeSpecies, getPlantImage, IMAGE_MAP, SIZE_MAP, FALLBACK_IMAGE };
