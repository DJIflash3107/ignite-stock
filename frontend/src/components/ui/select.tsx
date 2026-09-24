import * as React from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Select field.
 * ---------------------------------------------------------------------------
 * Native `<select>` styled with the shared field tokens (48px height, single
 * 0.25rem radius, neutral border, accent focus ring). A native element is used
 * so keyboard and screen-reader behaviour is correct with zero extra
 * dependencies. The chevron is decorative; the accessible name comes from the
 * associated `<label>` or `aria-label`.
 */
export interface SelectProps
  extends React.SelectHTMLAttributes<HTMLSelectElement> {
  error?: boolean;
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, error, children, ...props }, ref) => {
    return (
      <div className="relative">
        <select
          ref={ref}
          aria-invalid={error || undefined}
          className={cn(
            'flex h-12 w-full appearance-none rounded-[0.25rem] border border-border bg-primary pl-3 pr-10 text-base text-foreground focus-visible:outline-none focus-visible:border-accent focus-visible:ring-2 focus-visible:ring-accent disabled:cursor-not-allowed disabled:opacity-50 transition-colors',
            error && 'border-danger focus-visible:border-danger focus-visible:ring-danger',
            className
          )}
          {...props}
        >
          {children}
        </select>
        <ChevronDown
          className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
          aria-hidden="true"
        />
      </div>
    );
  }
);
Select.displayName = 'Select';
