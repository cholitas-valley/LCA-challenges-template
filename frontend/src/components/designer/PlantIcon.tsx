/**
 * PlantIcon Component
 *
 * Renders SVG plant icons based on species name. Uses top-down line art
 * aesthetic with monochrome stroke-only design.
 *
 * @example
 * ```tsx
 * <PlantIcon species="Monstera Deliciosa" size={48} />
 * <PlantIcon species="snake plant" size={64} className="text-gray-700" />
 * <PlantIcon species="unknown-variety" size={48} /> // Uses fallback
 * ```
 */

// Import all plant SVG icons
import monsteraSvg from '../icons/plants/monstera.svg?raw';
import snakePlantSvg from '../icons/plants/snake-plant.svg?raw';
import pothosSvg from '../icons/plants/pothos.svg?raw';
import fiddleLeafFigSvg from '../icons/plants/fiddle-leaf-fig.svg?raw';
import spiderPlantSvg from '../icons/plants/spider-plant.svg?raw';
import peaceLilySvg from '../icons/plants/peace-lily.svg?raw';
import rubberPlantSvg from '../icons/plants/rubber-plant.svg?raw';
import zzPlantSvg from '../icons/plants/zz-plant.svg?raw';
import philodendronSvg from '../icons/plants/philodendron.svg?raw';
import aloeVeraSvg from '../icons/plants/aloe-vera.svg?raw';
import bostonFernSvg from '../icons/plants/boston-fern.svg?raw';
import chineseEvergreenSvg from '../icons/plants/chinese-evergreen.svg?raw';
import dracaenaSvg from '../icons/plants/dracaena.svg?raw';
import jadePlantSvg from '../icons/plants/jade-plant.svg?raw';
import stringOfPearlsSvg from '../icons/plants/string-of-pearls.svg?raw';
import calatheaSvg from '../icons/plants/calathea.svg?raw';
import birdOfParadiseSvg from '../icons/plants/bird-of-paradise.svg?raw';
import englishIvySvg from '../icons/plants/english-ivy.svg?raw';
import succulentSvg from '../icons/plants/succulent.svg?raw';
import cactusSvg from '../icons/plants/cactus.svg?raw';
import unknownSvg from '../icons/plants/unknown.svg?raw';

export interface PlantIconProps {
  /**
   * The species name of the plant. Will be normalized (lowercase, special chars removed)
   * and matched against known species. Falls back to generic icon if not found.
   */
  species: string;
  /**
   * Size of the icon in pixels (both width and height).
   * @default 48
   */
  size?: number;
  /**
   * Additional CSS classes to apply to the icon container.
   * Use text color classes (e.g., "text-gray-700") to change icon color.
   */
  className?: string;
}

/**
 * Normalize a species string for matching against the icon map.
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
 * Map of normalized species names to their SVG content.
 * Keys are lowercase with spaces (e.g., "monstera deliciosa").
 */
const ICON_MAP: Record<string, string> = {
  // Monstera variations
  'monstera': monsteraSvg,
  'monstera deliciosa': monsteraSvg,
  
  // Snake plant variations
  'snake plant': snakePlantSvg,
  'snakeplant': snakePlantSvg,
  'sansevieria': snakePlantSvg,
  'sansevieria trifasciata': snakePlantSvg,
  
  // Pothos variations
  'pothos': pothosSvg,
  'golden pothos': pothosSvg,
  'devils ivy': pothosSvg,
  'epipremnum aureum': pothosSvg,
  
  // Fiddle leaf fig variations
  'fiddle leaf fig': fiddleLeafFigSvg,
  'fiddleleaf fig': fiddleLeafFigSvg,
  'ficus lyrata': fiddleLeafFigSvg,
  
  // Spider plant variations
  'spider plant': spiderPlantSvg,
  'spiderplant': spiderPlantSvg,
  'chlorophytum comosum': spiderPlantSvg,
  
  // Peace lily variations
  'peace lily': peaceLilySvg,
  'peacelily': peaceLilySvg,
  'spathiphyllum': peaceLilySvg,
  
  // Rubber plant variations
  'rubber plant': rubberPlantSvg,
  'rubberplant': rubberPlantSvg,
  'rubber tree': rubberPlantSvg,
  'ficus elastica': rubberPlantSvg,
  
  // ZZ plant variations
  'zz plant': zzPlantSvg,
  'zzplant': zzPlantSvg,
  'zz': zzPlantSvg,
  'zamioculcas zamiifolia': zzPlantSvg,
  
  // Philodendron variations
  'philodendron': philodendronSvg,
  'heartleaf philodendron': philodendronSvg,
  
  // Aloe vera variations
  'aloe vera': aloeVeraSvg,
  'aloevera': aloeVeraSvg,
  'aloe': aloeVeraSvg,
  
  // Boston fern variations
  'boston fern': bostonFernSvg,
  'bostonfern': bostonFernSvg,
  'nephrolepis exaltata': bostonFernSvg,
  'fern': bostonFernSvg,
  
  // Chinese evergreen variations
  'chinese evergreen': chineseEvergreenSvg,
  'aglaonema': chineseEvergreenSvg,
  
  // Dracaena variations
  'dracaena': dracaenaSvg,
  'dracaena marginata': dracaenaSvg,
  'dragon tree': dracaenaSvg,
  
  // Jade plant variations
  'jade plant': jadePlantSvg,
  'jadeplant': jadePlantSvg,
  'jade': jadePlantSvg,
  'crassula ovata': jadePlantSvg,
  
  // String of pearls variations
  'string of pearls': stringOfPearlsSvg,
  'stringofpearls': stringOfPearlsSvg,
  'senecio rowleyanus': stringOfPearlsSvg,
  
  // Calathea variations
  'calathea': calatheaSvg,
  'prayer plant': calatheaSvg,
  
  // Bird of paradise variations
  'bird of paradise': birdOfParadiseSvg,
  'birdofparadise': birdOfParadiseSvg,
  'strelitzia': birdOfParadiseSvg,
  'strelitzia reginae': birdOfParadiseSvg,
  
  // English ivy variations
  'english ivy': englishIvySvg,
  'englishivy': englishIvySvg,
  'ivy': englishIvySvg,
  'hedera helix': englishIvySvg,
  
  // Succulent variations
  'succulent': succulentSvg,
  'echeveria': succulentSvg,
  
  // Cactus variations
  'cactus': cactusSvg,
  'cacti': cactusSvg,
  
  // Fallback
  'unknown': unknownSvg,
};

/**
 * Get the SVG content for a species, falling back to unknown if not found.
 */
function getIconSvg(species: string): string {
  const normalized = normalizeSpecies(species);
  return ICON_MAP[normalized] ?? unknownSvg;
}

/**
 * PlantIcon component that renders plant icons based on species name.
 */
export function PlantIcon({ species, size = 48, className }: PlantIconProps) {
  const svgContent = getIconSvg(species);
  
  return (
    <div
      className={className}
      style={{ width: size, height: size }}
      role="img"
      aria-label={`${species} plant icon`}
      dangerouslySetInnerHTML={{ __html: svgContent }}
    />
  );
}

// Export for testing
export { normalizeSpecies, getIconSvg, ICON_MAP };
