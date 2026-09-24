import * as React from 'react';
import { cn } from '@/lib/utils';

/**
 * Skeleton placeholder.
 * Uses a neutral pulse only — the previous shimmer gradient is removed to
 * comply with the no-gradients rule.
 */
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
        'bg-surface-hover animate-pulse',
        variant === 'circle' && 'rounded-full',
        variant === 'rounded' && 'rounded-[0.25rem]',
        variant === 'default' && 'rounded-[0.25rem]',
        className
      )}
      aria-hidden="true"
      {...props}
    />
  );
};

export const SkeletonCard: React.FC<{ className?: string }> = ({ className }) => {
  return (
    <div
      className={cn(
        'rounded-[0.25rem] border border-border bg-surface-card p-5 space-y-4',
        className
      )}
    >
      <div className="flex items-center justify-between">
        <Skeleton className="h-4 w-28" />
        <Skeleton className="h-4 w-6" />
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
    <tr className={cn('border-b border-border', className)}>
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

/**
 * Evidence card placeholder used while the evidence section is loading.
 * Neutral pulse only, matching the shared Skeleton behaviour.
 */
export const SkeletonEvidenceRow: React.FC<{ className?: string }> = ({ className }) => {
  return (
    <div
      className={cn(
        'space-y-3 rounded-[0.25rem] border border-border bg-surface-card p-5',
        className
      )}
    >
      <div className="flex items-center justify-between gap-3">
        <Skeleton className="h-5 w-48" />
        <Skeleton className="h-5 w-24" />
      </div>
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-3/4" />
      <div className="flex items-center gap-3 pt-1">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-4 w-40" />
      </div>
    </div>
  );
};
