import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

/**
 * Badge / selector
 * ---------------------------------------------------------------------------
 * Radius: 0.25rem. Caption scale (12px) at weight 700.
 * `supporting`, `contradictory` and `neutral` map to the permitted semantic
 * state colors (success / error / warning). `info` is intentionally neutral so
 * no extra hue is introduced. Every state also carries an icon or label in the
 * UI so color is never the sole signal.
 */
// eslint-disable-next-line react-refresh/only-export-components
export const badgeVariants = cva(
  'inline-flex items-center gap-1 rounded-[0.25rem] border px-2 py-0.5 text-xs font-bold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-accent',
  {
    variants: {
      variant: {
        default: 'border-transparent bg-accent text-white',
        secondary: 'border-border bg-secondary-light text-foreground',
        outline: 'border-border text-secondary-foreground',
        supporting: 'border-success/40 bg-success/10 text-success',
        contradictory: 'border-danger/40 bg-danger/10 text-danger',
        neutral: 'border-warning/40 bg-warning/10 text-warning',
        info: 'border-border bg-surface-hover text-secondary-foreground',
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
