import * as React from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Dialog
 * ---------------------------------------------------------------------------
 * Context-driven modal (no Radix dependency). Radius: 0.25rem, single neutral
 * border, no blur or glow. Closes on overlay click and Escape, traps initial
 * focus, locks body scroll while open, and exposes `role="dialog"` +
 * `aria-modal`. Used for the New Investigation form and raw evidence detail.
 */

interface DialogContextValue {
  open: boolean;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
}

const DialogContext = React.createContext<DialogContextValue | undefined>(undefined);

function useDialogContext() {
  const context = React.useContext(DialogContext);
  if (!context) {
    throw new Error('Dialog components must be used within a Dialog provider');
  }
  return context;
}

export interface DialogProps {
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  children: React.ReactNode;
}

export const Dialog: React.FC<DialogProps> = ({
  open: controlledOpen,
  defaultOpen = false,
  onOpenChange,
  children,
}) => {
  const [uncontrolledOpen, setUncontrolledOpen] = React.useState(defaultOpen);
  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : uncontrolledOpen;

  const setOpen = React.useCallback<React.Dispatch<React.SetStateAction<boolean>>>(
    (value) => {
      const next = typeof value === 'function' ? value(open) : value;
      if (!isControlled) {
        setUncontrolledOpen(next);
      }
      onOpenChange?.(next);
    },
    [isControlled, onOpenChange, open]
  );

  return (
    <DialogContext.Provider value={{ open, setOpen }}>
      {children}
    </DialogContext.Provider>
  );
};

export interface DialogTriggerProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  asChild?: boolean;
}

export const DialogTrigger = React.forwardRef<HTMLButtonElement, DialogTriggerProps>(
  ({ className, children, onClick, asChild, ...props }, ref) => {
    const { setOpen } = useDialogContext();

    const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
      setOpen(true);
      onClick?.(e);
    };

    if (asChild && React.isValidElement(children)) {
      const child = children as React.ReactElement<{
        onClick?: React.MouseEventHandler;
        'aria-haspopup'?: string;
      }>;
      return React.cloneElement(child, {
        'aria-haspopup': 'dialog',
        onClick: (e: React.MouseEvent) => {
          setOpen(true);
          child.props.onClick?.(e);
        },
      });
    }

    return (
      <button
        ref={ref}
        type="button"
        aria-haspopup="dialog"
        className={cn(
          'inline-flex items-center justify-center cursor-pointer rounded-[0.25rem] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent',
          className
        )}
        onClick={handleClick}
        {...props}
      >
        {children}
      </button>
    );
  }
);
DialogTrigger.displayName = 'DialogTrigger';

export const DialogClose = React.forwardRef<HTMLButtonElement, DialogTriggerProps>(
  ({ className, children, onClick, ...props }, ref) => {
    const { setOpen } = useDialogContext();
    return (
      <button
        ref={ref}
        type="button"
        className={cn(
          'inline-flex items-center justify-center cursor-pointer rounded-[0.25rem] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent',
          className
        )}
        onClick={(e) => {
          setOpen(false);
          onClick?.(e);
        }}
        {...props}
      >
        {children}
      </button>
    );
  }
);
DialogClose.displayName = 'DialogClose';

export interface DialogContentProps extends React.HTMLAttributes<HTMLDivElement> {
  showClose?: boolean;
}

export const DialogContent = React.forwardRef<HTMLDivElement, DialogContentProps>(
  ({ className, children, showClose = true, ...props }, ref) => {
    const { open, setOpen } = useDialogContext();
    const contentRef = React.useRef<HTMLDivElement>(null);

    React.useEffect(() => {
      if (!open) return;
      const handleKeyDown = (event: KeyboardEvent) => {
        if (event.key === 'Escape') setOpen(false);
      };
      document.addEventListener('keydown', handleKeyDown);
      const previousOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.removeEventListener('keydown', handleKeyDown);
        document.body.style.overflow = previousOverflow;
      };
    }, [open, setOpen]);

    React.useEffect(() => {
      if (open) {
        const timer = window.setTimeout(() => contentRef.current?.focus(), 0);
        return () => window.clearTimeout(timer);
      }
    }, [open]);

    if (!open) return null;

    return (
      <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto p-4 sm:items-center">
        <div
          className="fixed inset-0 bg-black/60"
          aria-hidden="true"
          onClick={() => setOpen(false)}
        />
        <div
          ref={(node) => {
            contentRef.current = node;
            if (typeof ref === 'function') ref(node);
            else if (ref) (ref as React.MutableRefObject<HTMLDivElement | null>).current = node;
          }}
          role="dialog"
          aria-modal="true"
          tabIndex={-1}
          className={cn(
            'relative z-10 w-full max-w-lg rounded-[0.25rem] border border-border bg-primary p-6 text-foreground animate-fadeIn focus:outline-none',
            className
          )}
          {...props}
        >
          {showClose && (
            <DialogClose
              aria-label="Close dialog"
              className="absolute right-4 top-4 h-10 w-10 text-muted-foreground hover:bg-surface-hover hover:text-white"
            >
              <X className="h-5 w-5" aria-hidden="true" />
            </DialogClose>
          )}
          {children}
        </div>
      </div>
    );
  }
);
DialogContent.displayName = 'DialogContent';

export const DialogHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn('flex flex-col gap-1 pr-10', className)} {...props} />
));
DialogHeader.displayName = 'DialogHeader';

export const DialogFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn('mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end', className)}
    {...props}
  />
));
DialogFooter.displayName = 'DialogFooter';

export const DialogTitle = React.forwardRef<
  HTMLHeadingElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h2
    ref={ref}
    className={cn('font-heading text-2xl font-bold text-white', className)}
    {...props}
  />
));
DialogTitle.displayName = 'DialogTitle';

export const DialogDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn('text-sm text-muted-foreground leading-relaxed', className)}
    {...props}
  />
));
DialogDescription.displayName = 'DialogDescription';
