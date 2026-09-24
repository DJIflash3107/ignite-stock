import * as React from 'react';
import { cn } from '@/lib/utils';

/**
 * Text input field.
 * Radius: 0.25rem. Body text at 16px. 48px height keeps the target comfortable.
 * Error state uses the semantic danger color plus a visible ring (never color alone).
 */
export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: boolean;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, error, ...props }, ref) => {
    return (
      <input
        type={type}
        aria-invalid={error || undefined}
        className={cn(
          'flex h-12 w-full rounded-[0.25rem] border border-border bg-primary px-3 py-2 text-base text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:border-accent focus-visible:ring-2 focus-visible:ring-accent disabled:cursor-not-allowed disabled:opacity-50 transition-colors',
          error && 'border-danger focus-visible:border-danger focus-visible:ring-danger',
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Input.displayName = 'Input';
