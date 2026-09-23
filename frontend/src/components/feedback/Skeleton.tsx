import * as React from 'react';
import { cn } from '@/lib/utils';

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
  variant?: 'default' | 'rounded' | 'circle';
}

export const Skeleton: React.FC<SkeletonProps> = ({
  className,
  variant = 'default',
  ...props
}) => {
  return (
    <div
      className={cn(
        'relative overflow-hidden bg-surface-hover/60 animate-pulse',
        variant === 'circle' && 'rounded-full',
        variant === 'rounded' && 'rounded-xl',
        variant === 'default' && 'rounded-md',
        className
      )}
      {...props}
    >
      <div className="absolute inset-0 -translate-x-full animate-shimmer pointer-events-none" />
    </div>
  );
};

export const SkeletonCard: React.FC<{ className?: string }> = ({ className }) => {
  return (
    <div
      className={cn(
        'rounded-xl border border-border bg-surface-card p-5 space-y-4',
        className
      )}
    >
      <div className="flex items-center justify-between">
        <Skeleton className="h-4 w-28" />
        <Skeleton className="h-4 w-6 rounded-full" />
      </div>
      <Skeleton className="h-8 w-36" />
      <Skeleton className="h-3 w-48" />
    </div>
  );
};

export const SkeletonTableRow: React.FC<{ columns?: number; className?: string }> = ({
  columns = 5,
  className,
}) => {
  return (
    <tr className={cn('border-b border-border/50 py-3', className)}>
      {Array.from({ length: columns }).map((_, i) => (
        <td key={i} className="p-3">
          <Skeleton
            className={cn(
              'h-4',
              i === 0 ? 'w-20' : i === 1 ? 'w-32' : 'w-16 ml-auto'
            )}
          />
        </td>
      ))}
    </tr>
  );
};
