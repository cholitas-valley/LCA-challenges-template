/**
 * DesignerToolbar Component
 *
 * Toolbar for the Designer page that provides view/edit mode toggle.
 *
 * @example
 * ```tsx
 * <DesignerToolbar
 *   editMode={false}
 *   onEditModeChange={(edit) => setEditMode(edit)}
 * />
 * ```
 */

import { Button } from '../ui';

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
    <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 bg-white">
      <h1 className="text-lg font-semibold text-gray-900">Designer Space</h1>
      
      <div className="flex items-center gap-2" role="group" aria-label="Mode selection">
        <Button
          variant={editMode ? 'secondary' : 'primary'}
          size="sm"
          onClick={() => onEditModeChange(false)}
          aria-pressed={!editMode}
        >
          View
        </Button>
        <Button
          variant={editMode ? 'primary' : 'secondary'}
          size="sm"
          onClick={() => onEditModeChange(true)}
          aria-pressed={editMode}
        >
          Edit
        </Button>
      </div>
    </div>
  );
}
