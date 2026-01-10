/**
 * Utility for merging Tailwind CSS class names.
 *
 * Combines clsx for conditional class construction with tailwind-merge
 * for intelligent class conflict resolution.
 *
 * @example
 * // Basic usage
 * cn('px-4 py-2', 'bg-action-primary')
 *
 * // Conditional classes
 * cn('base-class', isActive && 'active-class')
 *
 * // Object syntax
 * cn({ 'bg-status-success': isSuccess, 'bg-status-error': isError })
 *
 * // Override conflicts (last wins)
 * cn('px-2 py-2', 'px-4') // => 'py-2 px-4'
 */
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
