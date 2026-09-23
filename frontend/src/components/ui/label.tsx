import * as React from 'react';
import { cn } from '@/lib/utils';

export interface LabelProps extends React.LabelHTMLAttributes<HTMLLabelElement> {
  error?: boolean;
}

export const Label = React.forwardRef<HTMLLabelElement, LabelProps>(
  ({ className, error, ...props }, ref) => {
    return (
      <label
        ref={ref}
        className={cn(
          'text-xs font-semibold uppercase tracking-wider text-secondary-foreground/90 select-none block mb-1.5',
          error && 'text-rose-400',
          className
        )}
        {...props}
      />
    );
  }
);
Label.displayName = 'Label';
