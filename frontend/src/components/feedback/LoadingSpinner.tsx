import * as React from 'react';
import { cn } from '@/lib/utils';

export interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  label?: string;
  className?: string;
  fullScreen?: boolean;
}

const sizeClasses = {
  sm: 'h-4 w-4 border-2',
  md: 'h-8 w-8 border-2',
  lg: 'h-12 w-12 border-3',
  xl: 'h-16 w-16 border-4',
};

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'md',
  label,
  className,
  fullScreen = false,
}) => {
  const content = (
    <div
      className={cn(
        'flex flex-col items-center justify-center gap-3',
        className
      )}
      role="status"
      aria-label={label || 'Loading...'}
    >
      <div
        className={cn(
          'animate-spin rounded-full border-t-accent border-r-accent/30 border-b-accent/10 border-l-accent/50',
          sizeClasses[size]
        )}
      />
      {label && (
        <p className="text-sm font-medium text-secondary-foreground animate-pulse">
          {label}
        </p>
      )}
      <span className="sr-only">{label || 'Loading...'}</span>
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-secondary/80 backdrop-blur-sm">
        {content}
      </div>
    );
  }

  return content;
};
