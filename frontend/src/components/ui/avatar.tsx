import * as React from 'react';
import { cn } from '@/lib/utils';

/**
 * Avatar selector.
 * Radius: 0.25rem (square, consistent with the rest of the system — no pill
 * shapes). Uses the accent tint at low opacity as a neutral identity marker.
 */
export interface AvatarProps extends React.HTMLAttributes<HTMLDivElement> {
  name?: string;
  src?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

const sizeClasses = {
  sm: 'h-8 w-8 text-xs',
  md: 'h-10 w-10 text-sm',
  lg: 'h-12 w-12 text-base',
  xl: 'h-16 w-16 text-xl',
};

export const Avatar = React.forwardRef<HTMLDivElement, AvatarProps>(
  ({ className, name, src, size = 'md', ...props }, ref) => {
    const initials = React.useMemo(() => {
      if (!name) return 'U';
      const parts = name.trim().split(/\s+/);
      if (parts.length === 1) {
        return parts[0].substring(0, 2).toUpperCase();
      }
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }, [name]);

    return (
      <div
        ref={ref}
        className={cn(
          'relative inline-flex shrink-0 items-center justify-center rounded-[0.25rem] bg-accent/15 border border-accent/40 font-heading font-bold text-accent select-none overflow-hidden',
          sizeClasses[size],
          className
        )}
        aria-label={name || 'User avatar'}
        role="img"
        {...props}
      >
        {src ? (
          <img
            src={src}
            alt={name || 'Avatar'}
            className="h-full w-full object-cover"
          />
        ) : (
          <span aria-hidden="true">{initials}</span>
        )}
      </div>
    );
  }
);
Avatar.displayName = 'Avatar';
