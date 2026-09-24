import * as React from 'react';
import { cn } from '@/lib/utils';

/**
 * Empty state.
 * Radius: 0.25rem. Grouping is communicated with spacing and a single icon
 * rather than nested circular containers.
 */
export interface EmptyStateProps {
  title: string;
  description?: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  description,
  icon,
  action,
  className,
}) => {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center rounded-[0.25rem] border border-border bg-primary px-6 py-12 text-center',
        className
      )}
    >
      {icon && (
        <div className="mb-4 text-muted-foreground" aria-hidden="true">
          {icon}
        </div>
      )}
      <h3 className="font-heading text-xl font-bold text-white">{title}</h3>
      {description && (
        <p className="mt-2 max-w-md text-sm text-muted-foreground leading-relaxed">
          {description}
        </p>
      )}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
};
