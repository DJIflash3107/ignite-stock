import * as React from 'react';
import { cn } from '@/lib/utils';

interface DropdownContextType {
  open: boolean;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
}

const DropdownContext = React.createContext<DropdownContextType | undefined>(undefined);

function useDropdownMenu() {
  const context = React.useContext(DropdownContext);
  if (!context) {
    throw new Error('useDropdownMenu must be used within a DropdownMenu');
  }
  return context;
}

export interface DropdownMenuProps {
  children: React.ReactNode;
}

export const DropdownMenu: React.FC<DropdownMenuProps> = ({ children }) => {
  const [open, setOpen] = React.useState(false);
  const menuRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setOpen(false);
      }
    }

    if (open) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [open]);

  return (
    <DropdownContext.Provider value={{ open, setOpen }}>
      <div ref={menuRef} className="relative inline-block text-left">
        {children}
      </div>
    </DropdownContext.Provider>
  );
};

export interface DropdownMenuTriggerProps {
  children: React.ReactNode;
  asChild?: boolean;
  className?: string;
}

export const DropdownMenuTrigger = React.forwardRef<
  HTMLButtonElement,
  DropdownMenuTriggerProps & React.ButtonHTMLAttributes<HTMLButtonElement>
>(({ children, className, onClick, ...props }, ref) => {
  const { open, setOpen } = useDropdownMenu();

  return (
    <button
      ref={ref}
      type="button"
      className={cn(
        'inline-flex items-center justify-center cursor-pointer rounded-[0.25rem] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-secondary',
        className
      )}
      aria-expanded={open}
      aria-haspopup="menu"
      onClick={(e) => {
        setOpen((prev) => !prev);
        onClick?.(e);
      }}
      {...props}
    >
      {children}
    </button>
  );
});
DropdownMenuTrigger.displayName = 'DropdownMenuTrigger';

export interface DropdownMenuContentProps extends React.HTMLAttributes<HTMLDivElement> {
  align?: 'left' | 'right';
  sideOffset?: number;
}

export const DropdownMenuContent = React.forwardRef<
  HTMLDivElement,
  DropdownMenuContentProps
>(({ className, align = 'right', sideOffset = 4, children, style, ...props }, ref) => {
  const { open } = useDropdownMenu();

  if (!open) return null;

  return (
    <div
      ref={ref}
      role="menu"
      style={{ marginTop: sideOffset, ...style }}
      className={cn(
        'absolute z-50 min-w-[13rem] rounded-[0.25rem] border border-border bg-primary p-1 text-foreground shadow-lg shadow-black/40 focus:outline-none animate-fadeIn',
        align === 'right' ? 'right-0' : 'left-0',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
});
DropdownMenuContent.displayName = 'DropdownMenuContent';

export interface DropdownMenuItemProps extends React.HTMLAttributes<HTMLDivElement> {
  disabled?: boolean;
  destructive?: boolean;
}

export const DropdownMenuItem = React.forwardRef<
  HTMLDivElement,
  DropdownMenuItemProps
>(({ className, disabled, destructive, onClick, children, ...props }, ref) => {
  const { setOpen } = useDropdownMenu();

  return (
    <div
      ref={ref}
      role="menuitem"
      tabIndex={disabled ? -1 : 0}
      className={cn(
        'relative flex cursor-pointer select-none items-center gap-2 rounded-[0.25rem] px-3 py-2.5 text-sm font-bold outline-none transition-colors duration-150',
        destructive
          ? 'text-danger hover:bg-danger/10 hover:text-white'
          : 'text-secondary-foreground hover:bg-surface-hover hover:text-white',
        disabled && 'pointer-events-none opacity-50',
        className
      )}
      onClick={(e) => {
        if (disabled) return;
        setOpen(false);
        onClick?.(e);
      }}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          if (!disabled) {
            setOpen(false);
            onClick?.(e as unknown as React.MouseEvent<HTMLDivElement>);
          }
        }
      }}
      {...props}
    >
      {children}
    </div>
  );
});
DropdownMenuItem.displayName = 'DropdownMenuItem';

export const DropdownMenuSeparator = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    role="separator"
    className={cn('-mx-1 my-1 h-px bg-border', className)}
    {...props}
  />
));
DropdownMenuSeparator.displayName = 'DropdownMenuSeparator';

export const DropdownMenuLabel = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn('px-3 py-2 text-sm font-bold text-white', className)}
    {...props}
  />
));
DropdownMenuLabel.displayName = 'DropdownMenuLabel';
