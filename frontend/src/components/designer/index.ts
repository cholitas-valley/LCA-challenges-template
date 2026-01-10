/**
 * Designer Components Barrel Export
 *
 * Re-exports all designer components for convenient importing:
 * ```tsx
 * import { PlantIcon, PlantImage, ScandinavianCanvas, PlantTooltip, DesignerSidebar, DesignerToolbar } from '@/components/designer';
 * // or
 * import { PlantIcon, PlantImage, ScandinavianCanvas, PlantTooltip, DesignerSidebar, DesignerToolbar } from '../components/designer';
 * ```
 */

export { PlantIcon } from './PlantIcon';
export type { PlantIconProps } from './PlantIcon';

export { PlantImage } from './PlantImage';
export type { PlantImageProps } from './PlantImage';

export { DesignerCanvas } from './DesignerCanvas';
export type { DesignerCanvasProps } from './DesignerCanvas';

export { PlantTooltip } from './PlantTooltip';
export type { PlantTooltipProps } from './PlantTooltip';

export { DesignerSidebar } from './DesignerSidebar';
export type { DesignerSidebarProps } from './DesignerSidebar';

export { DesignerToolbar } from './DesignerToolbar';
export type { DesignerToolbarProps } from './DesignerToolbar';

export { PLANT_SPOTS, getSpotById, findNearestSpot } from './plantSpots';
export type { PlantSpot as PlantSpotType, SpotLocation, SpotSize } from './plantSpots';

export { PlantSpot } from './PlantSpot';
export type { PlantSpotProps } from './PlantSpot';

export { ScandinavianCanvas } from './ScandinavianCanvas';
export type { ScandinavianCanvasProps } from './ScandinavianCanvas';

export { positionsToSpotAssignments, spotToPosition } from './spotAssignment';

export { PlantAssignmentModal } from './PlantAssignmentModal';
export type { PlantAssignmentModalProps } from './PlantAssignmentModal';
