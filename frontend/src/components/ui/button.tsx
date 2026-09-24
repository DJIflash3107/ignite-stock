import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

/**
 * Button system
 * ---------------------------------------------------------------------------
 * Only the `default` variant uses the accent color, so a single screen never
 * shows more than one primary CTA. Every other variant is neutral (grayscale)
 * or uses a semantic color reserved for destructive actions.
 *
 * Radius: 0.25rem. Text: 14px / 16px. Weight: 700 only (400/700 system).
 * Default height is 48px to keep interactive targets comfortable.
 */
// eslint-disable-next-line react-refresh/only-export-components
export const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-[0.25rem] font-bold transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-secondary disabled:pointer-events-none disabled:opacity-50 select-none cursor-pointer',
  {
    variants: {
      variant: {
        default: 'bg-accent text-white hover:bg-accent-hover',
        secondary:
          'bg-secondary-light text-foreground border border-border hover:bg-surface-hover',
        outline:
          'border border-border bg-transparent text-foreground hover:bg-surface-hover',
        ghost:
          'text-secondary-foreground hover:bg-surface-hover hover:text-white',
        destructive:
          'border border-danger/50 text-danger hover:bg-danger/10 hover:text-white',
        link: 'text-accent underline-offset-4 hover:underline p-0 h-auto font-normal',
      },
      size: {
        default: 'h-12 px-6 text-sm',
        sm: 'h-10 px-4 text-sm',
        lg: 'h-12 px-8 text-base',
        icon: 'h-12 w-12 p-0',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  isLoading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, isLoading, children, disabled, ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        disabled={disabled || isLoading}
        aria-busy={isLoading || undefined}
        {...props}
      >
        {isLoading && (
          <svg
            className="animate-spin h-4 w-4 text-current"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.447z"
            />
          </svg>
        )}
        {children}
      </button>
    );
  }
);
Button.displayName = 'Button';
