/**
 * StatusRing Component
 *
 * A subtle colored ring that appears around plant pots
 * to indicate health status without harsh colors.
 */

import { PlantStatusType } from '../../utils/plantStatus';
import { cn } from '../../lib/cn';

export interface StatusRingProps {
  /** Plant status determines ring color */
  status: PlantStatusType;
  /** Size of the ring */
  size: 'small' | 'medium' | 'large';
  /** Additional CSS classes */
  className?: string;
}

/**
 * Muted Scandinavian ring colors.
 */
const RING_COLORS: Record<PlantStatusType, string> = {
  online: 'ring-sage-300 ring-opacity-60',
  warning: 'ring-amber-300 ring-opacity-60',
  critical: 'ring-rose-300 ring-opacity-60',
  offline: 'ring-gray-300 ring-opacity-40',
};

/**
 * Ring thickness based on size.
 */
const RING_SIZES: Record<string, string> = {
  small: 'ring-2',
  medium: 'ring-[3px]',
  large: 'ring-4',
};

/**
 * Subtle glow effect colors.
 */
const GLOW_COLORS: Record<PlantStatusType, string> = {
  online: 'shadow-sage-200/50',
  warning: 'shadow-amber-200/50',
  critical: 'shadow-rose-200/50',
  offline: 'shadow-gray-200/30',
};

export function StatusRing({ status, size, className }: StatusRingProps) {
  return (
    <div
      className={cn(
        'absolute inset-0 rounded-full',
        RING_SIZES[size],
        RING_COLORS[status],
        'shadow-lg',
        GLOW_COLORS[status],
        'transition-all duration-300',
        status === 'offline' && 'opacity-50',
        className
      )}
      aria-hidden="true"
    />
  );
}
