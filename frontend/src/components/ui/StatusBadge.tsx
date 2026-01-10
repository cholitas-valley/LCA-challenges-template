import { cn } from '../../lib/cn';

export type StatusType = 'online' | 'offline' | 'error' | 'warning' | 'provisioning' | 'info';

export interface StatusBadgeProps {
  status: StatusType;
  label?: string;
  showDot?: boolean;
  size?: 'sm' | 'md';
  className?: string;
}

const statusConfig: Record<StatusType, { dot: string; bg: string; text: string; label: string }> = {
  online: {
    dot: 'bg-status-success',
    bg: 'bg-status-success-light',
    text: 'text-status-success-text',
    label: 'Online',
  },
  offline: {
    dot: 'bg-status-neutral',
    bg: 'bg-status-neutral-light',
    text: 'text-status-neutral-text',
    label: 'Offline',
  },
  error: {
    dot: 'bg-status-error',
    bg: 'bg-status-error-light',
    text: 'text-status-error-text',
    label: 'Error',
  },
  warning: {
    dot: 'bg-status-warning',
    bg: 'bg-status-warning-light',
    text: 'text-status-warning-text',
    label: 'Warning',
  },
  provisioning: {
    dot: 'bg-status-warning',
    bg: 'bg-status-warning-light',
    text: 'text-status-warning-text',
    label: 'Provisioning',
  },
  info: {
    dot: 'bg-status-info',
    bg: 'bg-status-info-light',
    text: 'text-status-info-text',
    label: 'Info',
  },
};

export function StatusBadge({
  status,
  label,
  showDot = true,
  size = 'md',
  className,
}: StatusBadgeProps) {
  const config = statusConfig[status];
  const displayLabel = label ?? config.label;

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full font-medium',
        size === 'sm' && 'px-2 py-0.5 text-xs',
        size === 'md' && 'px-2.5 py-1 text-sm',
        config.bg,
        config.text,
        className
      )}
    >
      {showDot && (
        <span
          className={cn(
            'rounded-full',
            size === 'sm' && 'h-1.5 w-1.5',
            size === 'md' && 'h-2 w-2',
            config.dot
          )}
        />
      )}
      {displayLabel}
    </span>
  );
}
