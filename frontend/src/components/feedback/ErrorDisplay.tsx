import * as React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { extractErrorMessage } from '@/lib/api-error';
import { Button } from '@/components/ui/button';

/**
 * Error display.
 * Uses the semantic danger color (a permitted exception to the 60/30/10 rule).
 * Radius: 0.25rem. An icon accompanies the color so state is never conveyed by
 * color alone.
 */
export interface ErrorDisplayProps {
  title?: string;
  message?: string;
  error?: unknown;
  onRetry?: () => void;
  className?: string;
  compact?: boolean;
}

export const ErrorDisplay: React.FC<ErrorDisplayProps> = ({
  title = 'Something went wrong',
  message,
  error,
  onRetry,
  className,
  compact = false,
}) => {
  const displayMessage = message || (error ? extractErrorMessage(error) : 'An unexpected error occurred. Please try again.');

  if (compact) {
    return (
      <div
        className={cn(
          'flex items-center justify-between gap-3 rounded-[0.25rem] border border-danger/40 bg-danger/10 px-3 py-2 text-sm text-danger',
          className
        )}
        role="alert"
      >
        <div className="flex items-center gap-2">
          <AlertCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
          <span>{displayMessage}</span>
        </div>
        {onRetry && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onRetry}
            className="text-danger hover:bg-danger/15 hover:text-white"
          >
            Retry
          </Button>
        )}
      </div>
    );
  }

  return (
    <div
      className={cn(
        'flex flex-col items-start rounded-[0.25rem] border border-danger/40 bg-danger/5 p-6',
        className
      )}
      role="alert"
    >
      <div className="flex items-center gap-2 text-danger">
        <AlertCircle className="h-5 w-5 shrink-0" aria-hidden="true" />
        <h3 className="font-heading text-xl font-bold text-white">{title}</h3>
      </div>
      <p className="mt-2 max-w-md text-sm text-muted-foreground leading-relaxed">
        {displayMessage}
      </p>
      {onRetry && (
        <Button onClick={onRetry} variant="secondary" className="mt-6">
          <RefreshCw className="mr-2 h-4 w-4" aria-hidden="true" />
          Try Again
        </Button>
      )}
    </div>
  );
};
