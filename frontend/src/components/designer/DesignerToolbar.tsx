/**
 * DesignerToolbar Component
 *
 * Toolbar for the Designer page that provides view/edit mode toggle.
 * Scandinavian-styled with warm colors and rounded toggle buttons.
 *
 * @example
 * ```tsx
 * <DesignerToolbar
 *   editMode={false}
 *   onEditModeChange={(edit) => setEditMode(edit)}
 * />
 * ```
 */

import { cn } from '../../lib/cn';

export interface DesignerToolbarProps {
  /** Whether edit mode is active */
  editMode: boolean;
  /** Callback when edit mode changes */
  onEditModeChange: (edit: boolean) => void;
}

/**
 * DesignerToolbar provides view/edit mode switching.
 */
export function DesignerToolbar({ editMode, onEditModeChange }: DesignerToolbarProps) {
  return (
    <div className="flex items-center justify-between px-4 py-3 border-b border-stone-200 bg-white/80 backdrop-blur-sm">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center">
          <svg className="w-5 h-5 text-amber-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
          </svg>
        </div>
        <h1 className="text-lg font-semibold text-stone-800">Room Designer</h1>
      </div>

      {/* Mode toggle */}
      <div
        className="flex items-center p-1 bg-stone-100 rounded-xl"
        role="group"
        aria-label="Mode selection"
      >
        <button
          className={cn(
            'px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200',
            !editMode
              ? 'bg-white text-stone-800 shadow-sm'
              : 'text-stone-500 hover:text-stone-700'
          )}
          onClick={() => onEditModeChange(false)}
          aria-pressed={!editMode}
        >
          <span className="flex items-center gap-1.5">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
            View
          </span>
        </button>
        <button
          className={cn(
            'px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200',
            editMode
              ? 'bg-amber-500 text-white shadow-sm'
              : 'text-stone-500 hover:text-stone-700'
          )}
          onClick={() => onEditModeChange(true)}
          aria-pressed={editMode}
        >
          <span className="flex items-center gap-1.5">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            Edit
          </span>
        </button>
      </div>
    </div>
  );
}
