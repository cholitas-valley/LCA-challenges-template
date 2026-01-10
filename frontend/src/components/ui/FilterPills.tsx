import { cn } from '../../lib/cn';

/**
 * FilterPills Component
 *
 * A toggle/selection component for filter patterns, visually distinct from action buttons.
 * Uses neutral gray colors and pill shapes to communicate selection behavior rather than action.
 *
 * @example
 * ```tsx
 * type StatusFilter = 'all' | 'online' | 'offline';
 *
 * const options: FilterOption<StatusFilter>[] = [
 *   { value: 'all', label: 'All', count: 10 },
 *   { value: 'online', label: 'Online', count: 6 },
 *   { value: 'offline', label: 'Offline', count: 4 },
 * ];
 *
 * <FilterPills
 *   options={options}
 *   value={statusFilter}
 *   onChange={setStatusFilter}
 * />
 * ```
 *
 * ## FilterPills vs Button
 *
 * | Aspect          | FilterPills         | Button (primary)    |
 * |-----------------|---------------------|---------------------|
 * | Shape           | Pill (rounded-full) | Rounded-md          |
 * | Active state    | Dark gray fill      | Brand green fill    |
 * | Inactive state  | Light gray          | N/A                 |
 * | Purpose         | Toggle/select       | Trigger action      |
 * | Group behavior  | Radio group         | Standalone          |
 */

export interface FilterOption<T extends string = string> {
  /** The value associated with this option */
  value: T;
  /** Display label for the option */
  label: string;
  /** Optional count to display in parentheses */
  count?: number;
}

export interface FilterPillsProps<T extends string = string> {
  /** Array of filter options to display */
  options: FilterOption<T>[];
  /** Currently selected value */
  value: T;
  /** Callback when selection changes */
  onChange: (value: T) => void;
  /** Optional className for the container */
  className?: string;
}

/**
 * FilterPills displays a group of selectable pills for filtering content.
 * Uses radio group semantics for accessibility.
 */
export function FilterPills<T extends string = string>({
  options,
  value,
  onChange,
  className,
}: FilterPillsProps<T>) {
  return (
    <div
      role="group"
      aria-label="Filter options"
      className={cn('inline-flex gap-2 flex-wrap', className)}
    >
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          role="radio"
          aria-checked={value === option.value}
          onClick={() => onChange(option.value)}
          className={cn(
            'px-3 py-1.5 rounded-full text-sm font-medium transition-colors',
            'focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-gray-400',
            value === option.value
              ? 'bg-gray-900 text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          )}
        >
          {option.label}
          {option.count !== undefined && (
            <span
              className={cn(
                'ml-1.5',
                value === option.value ? 'text-gray-300' : 'text-gray-400'
              )}
            >
              ({option.count})
            </span>
          )}
        </button>
      ))}
    </div>
  );
}
