import * as React from 'react';
import { Search } from 'lucide-react';
import { cn } from '@/lib/utils';

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
        'flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-surface-card/50 p-10 text-center',
        className
      )}
    >
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-secondary-light border border-border-subtle text-secondary-foreground mb-4">
        {icon || <Search className="h-6 w-6 text-muted-foreground" />}
      </div>
      <h3 className="font-heading text-lg font-semibold text-white">
        {title}
      </h3>
      {description && (
        <p className="mt-2 max-w-sm text-sm text-secondary-foreground/80 leading-relaxed">
          {description}
        </p>
      )}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
};
