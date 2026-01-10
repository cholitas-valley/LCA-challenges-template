/**
 * DesignerToolbar Component Tests
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { DesignerToolbar } from '../DesignerToolbar';

describe('DesignerToolbar', () => {
  it('renders title', () => {
    render(<DesignerToolbar editMode={false} onEditModeChange={vi.fn()} />);

    expect(screen.getByText('Designer Space')).toBeInTheDocument();
  });

  it('renders View and Edit buttons', () => {
    render(<DesignerToolbar editMode={false} onEditModeChange={vi.fn()} />);

    expect(screen.getByRole('button', { name: /view/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /edit/i })).toBeInTheDocument();
  });

  it('View button is primary when not in edit mode', () => {
    render(<DesignerToolbar editMode={false} onEditModeChange={vi.fn()} />);

    const viewButton = screen.getByRole('button', { name: /view/i });
    const editButton = screen.getByRole('button', { name: /edit/i });

    expect(viewButton).toHaveClass('bg-action-primary');
    expect(editButton).toHaveClass('bg-action-secondary');
  });

  it('Edit button is primary when in edit mode', () => {
    render(<DesignerToolbar editMode={true} onEditModeChange={vi.fn()} />);

    const viewButton = screen.getByRole('button', { name: /view/i });
    const editButton = screen.getByRole('button', { name: /edit/i });

    expect(editButton).toHaveClass('bg-action-primary');
    expect(viewButton).toHaveClass('bg-action-secondary');
  });

  it('calls onEditModeChange(false) when View clicked', () => {
    const onEditModeChange = vi.fn();
    render(<DesignerToolbar editMode={true} onEditModeChange={onEditModeChange} />);

    fireEvent.click(screen.getByRole('button', { name: /view/i }));

    expect(onEditModeChange).toHaveBeenCalledWith(false);
  });

  it('calls onEditModeChange(true) when Edit clicked', () => {
    const onEditModeChange = vi.fn();
    render(<DesignerToolbar editMode={false} onEditModeChange={onEditModeChange} />);

    fireEvent.click(screen.getByRole('button', { name: /edit/i }));

    expect(onEditModeChange).toHaveBeenCalledWith(true);
  });

  it('has proper accessibility attributes', () => {
    render(<DesignerToolbar editMode={false} onEditModeChange={vi.fn()} />);

    const group = screen.getByRole('group', { name: /mode selection/i });
    expect(group).toBeInTheDocument();
  });

  it('shows pressed state on active button', () => {
    render(<DesignerToolbar editMode={false} onEditModeChange={vi.fn()} />);

    const viewButton = screen.getByRole('button', { name: /view/i });
    const editButton = screen.getByRole('button', { name: /edit/i });

    expect(viewButton).toHaveAttribute('aria-pressed', 'true');
    expect(editButton).toHaveAttribute('aria-pressed', 'false');
  });
});
