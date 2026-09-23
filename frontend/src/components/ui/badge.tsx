import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

// eslint-disable-next-line react-refresh/only-export-components
export const badgeVariants = cva(
  'inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-accent',
  {
    variants: {
      variant: {
        default:
          'border-transparent bg-accent text-white',
        secondary:
          'border-border-subtle bg-secondary text-secondary-foreground',
        outline:
          'border-border text-secondary-foreground',
        supporting:
          'border-emerald-600/30 bg-emerald-950/60 text-emerald-400',
        contradictory:
          'border-rose-600/30 bg-rose-950/60 text-rose-400',
        neutral:
          'border-amber-600/30 bg-amber-950/60 text-amber-300',
        info:
          'border-cyan-600/30 bg-cyan-950/60 text-cyan-300',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}
