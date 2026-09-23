import * as React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { extractErrorMessage } from '@/lib/api-error';
import { Button } from '@/components/ui/button';

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
          'flex items-center justify-between gap-3 rounded-lg border border-rose-900/50 bg-rose-950/30 px-3 py-2 text-sm text-rose-300',
          className
        )}
        role="alert"
      >
        <div className="flex items-center gap-2">
          <AlertCircle className="h-4 w-4 shrink-0 text-rose-400" />
          <span>{displayMessage}</span>
        </div>
        {onRetry && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onRetry}
            className="h-7 text-xs text-rose-300 hover:bg-rose-900/40 hover:text-white"
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
        'flex flex-col items-center justify-center rounded-xl border border-rose-900/40 bg-rose-950/20 p-8 text-center',
        className
      )}
      role="alert"
    >
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-rose-950/60 text-rose-400 border border-rose-800/40 mb-4">
        <AlertCircle className="h-6 w-6" />
      </div>
      <h3 className="font-heading text-lg font-semibold text-rose-200">
        {title}
      </h3>
      <p className="mt-2 max-w-md text-sm text-rose-300/80 leading-relaxed">
        {displayMessage}
      </p>
      {onRetry && (
        <Button
          onClick={onRetry}
          variant="outline"
          className="mt-6 border-rose-800/50 text-rose-200 hover:bg-rose-900/30 hover:text-white"
        >
          <RefreshCw className="mr-2 h-4 w-4" />
          Try Again
        </Button>
      )}
    </div>
  );
};
