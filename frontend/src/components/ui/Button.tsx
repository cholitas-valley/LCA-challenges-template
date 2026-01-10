import { forwardRef } from 'react';
import { cn } from '../../lib/cn';

/**
 * Button Component
 *
 * A reusable button component with semantic color variants, sizes, and states.
 * Uses semantic tokens from the design system for consistent styling.
 *
 * @example
 * ```tsx
 * // Primary button (main CTA, one per section max)
 * <Button variant="primary">Add Plant</Button>
 *
 * // Secondary button (alternative actions)
 * <Button variant="secondary">Cancel</Button>
 *
 * // Ghost button (tertiary actions, navigation)
 * <Button variant="ghost">View Details</Button>
 *
 * // Danger button (destructive actions only)
 * <Button variant="danger">Delete</Button>
 *
 * // With loading state
 * <Button loading>Saving...</Button>
 *
 * // Different sizes
 * <Button size="sm">Small</Button>
 * <Button size="md">Medium</Button>
 * <Button size="lg">Large</Button>
 * ```
 *
 * ## Usage Guidelines
 *
 * | Variant     | Usage                          | Example               |
 * |-------------|--------------------------------|-----------------------|
 * | `primary`   | Main CTA, one per section max  | "Add Plant", "Save"   |
 * | `secondary` | Alternative actions            | "Cancel", "Back"      |
 * | `ghost`     | Tertiary actions, navigation   | "View Details"        |
 * | `danger`    | Destructive actions only       | "Delete", "Remove"    |
 */

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /**
   * Visual variant of the button.
   * - `primary`: Green background, white text. Use for main actions.
   * - `secondary`: Gray background with border. Use for alternative actions.
   * - `ghost`: Transparent background. Use for tertiary/navigation actions.
   * - `danger`: Red background, white text. Use for destructive actions.
   * @default 'primary'
   */
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';

  /**
   * Size of the button.
   * - `sm`: Compact size for tight spaces (px-3 py-1.5)
   * - `md`: Default size for most use cases (px-4 py-2)
   * - `lg`: Larger size for prominent actions (px-6 py-3)
   * @default 'md'
   */
  size?: 'sm' | 'md' | 'lg';

  /**
   * Shows a loading spinner and disables the button.
   * Use when an async action is in progress.
   * @default false
   */
  loading?: boolean;
}

/**
 * Button component with forwardRef support for ref forwarding.
 * Supports primary, secondary, ghost, and danger variants with semantic color tokens.
 */
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = 'primary',
      size = 'md',
      loading = false,
      disabled,
      children,
      type = 'button',
      ...props
    },
    ref
  ) => {
    const isDisabled = disabled || loading;

    return (
      <button
        ref={ref}
        type={type}
        disabled={isDisabled}
        className={cn(
          // Base styles
          'inline-flex items-center justify-center font-medium rounded-md transition-colors',
          'focus:outline-none focus:ring-2 focus:ring-offset-2',

          // Disabled state
          isDisabled && 'opacity-50 cursor-not-allowed',

          // Size variants
          size === 'sm' && 'px-3 py-1.5 text-sm',
          size === 'md' && 'px-4 py-2 text-sm',
          size === 'lg' && 'px-6 py-3 text-base',

          // Color variants using semantic tokens
          variant === 'primary' && [
            'bg-action-primary text-action-primary-text',
            !isDisabled && 'hover:bg-action-primary-hover',
            'focus:ring-action-primary',
          ],
          variant === 'secondary' && [
            'bg-action-secondary text-action-secondary-text border border-action-secondary-border',
            !isDisabled && 'hover:bg-action-secondary-hover',
            'focus:ring-gray-400',
          ],
          variant === 'ghost' && [
            'bg-action-ghost text-action-ghost-text',
            !isDisabled && 'hover:bg-action-ghost-hover',
            'focus:ring-gray-400',
          ],
          variant === 'danger' && [
            'bg-action-danger text-action-danger-text',
            !isDisabled && 'hover:bg-action-danger-hover',
            'focus:ring-action-danger',
          ],

          className
        )}
        {...props}
      >
        {loading && (
          <svg
            className="animate-spin -ml-1 mr-2 h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        )}
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';
