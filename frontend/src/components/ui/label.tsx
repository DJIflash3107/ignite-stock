import * as React from 'react';
import { cn } from '@/lib/utils';

/**
 * Field label.
 * 14px, weight 700, sentence case for scannability. Error state uses the
 * semantic danger color.
 */
export interface LabelProps extends React.LabelHTMLAttributes<HTMLLabelElement> {
  error?: boolean;
}

export const Label = React.forwardRef<HTMLLabelElement, LabelProps>(
  ({ className, error, ...props }, ref) => {
    return (
      <label
        ref={ref}
        className={cn(
          'block mb-2 text-sm font-bold text-foreground select-none',
          error && 'text-danger',
          className
        )}
        {...props}
      />
    );
  }
);
Label.displayName = 'Label';
