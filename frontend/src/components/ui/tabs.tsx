import * as React from 'react';
import { cn } from '@/lib/utils';

/**
 * Tabs
 * ---------------------------------------------------------------------------
 * Lightweight context-driven tabs (no Radix dependency). Follows the same
 * pattern as `dropdown-menu.tsx`.
 *
 * Radius: 0.25rem. Active state uses the neutral surface-hover fill plus an
 * accent underline, so state is never conveyed by color alone. Keyboard support
 * (ArrowLeft / ArrowRight / Home / End) and ARIA tablist semantics are included.
 */

interface TabsContextValue {
  value: string;
  setValue: (value: string) => void;
  baseId: string;
}

const TabsContext = React.createContext<TabsContextValue | undefined>(undefined);

function useTabsContext() {
  const context = React.useContext(TabsContext);
  if (!context) {
    throw new Error('Tabs components must be used within a Tabs provider');
  }
  return context;
}

export interface TabsProps {
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  children: React.ReactNode;
  className?: string;
}

export const Tabs: React.FC<TabsProps> = ({
  value,
  defaultValue = '',
  onValueChange,
  children,
  className,
}) => {
  const [internalValue, setInternalValue] = React.useState(defaultValue);
  const baseId = React.useId();
  const isControlled = value !== undefined;
  const activeValue = isControlled ? value : internalValue;

  const setValue = React.useCallback(
    (next: string) => {
      if (!isControlled) {
        setInternalValue(next);
      }
      onValueChange?.(next);
    },
    [isControlled, onValueChange]
  );

  return (
    <TabsContext.Provider value={{ value: activeValue, setValue, baseId }}>
      <div className={cn('flex flex-col gap-4', className)}>{children}</div>
    </TabsContext.Provider>
  );
};

export const TabsList = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, children, onKeyDown, ...props }, ref) => {
  const listRef = React.useRef<HTMLDivElement>(null);

  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    const keys = ['ArrowRight', 'ArrowLeft', 'Home', 'End'];
    if (!keys.includes(event.key)) {
      onKeyDown?.(event);
      return;
    }
    const container = listRef.current;
    if (!container) return;
    const triggers = Array.from(
      container.querySelectorAll<HTMLButtonElement>('[role="tab"]:not([disabled])')
    );
    if (triggers.length === 0) return;
    const currentIndex = triggers.indexOf(document.activeElement as HTMLButtonElement);
    let nextIndex = currentIndex;
    if (event.key === 'ArrowRight') nextIndex = (currentIndex + 1) % triggers.length;
    if (event.key === 'ArrowLeft') nextIndex = (currentIndex - 1 + triggers.length) % triggers.length;
    if (event.key === 'Home') nextIndex = 0;
    if (event.key === 'End') nextIndex = triggers.length - 1;
    event.preventDefault();
    triggers[nextIndex]?.focus();
    onKeyDown?.(event);
  };

  return (
    <div
      ref={(node) => {
        listRef.current = node;
        if (typeof ref === 'function') ref(node);
        else if (ref) (ref as React.MutableRefObject<HTMLDivElement | null>).current = node;
      }}
      role="tablist"
      onKeyDown={handleKeyDown}
      className={cn(
        'flex flex-wrap items-center gap-1 rounded-[0.25rem] border border-border bg-secondary p-1',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
});
TabsList.displayName = 'TabsList';

export interface TabsTriggerProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  value: string;
}

export const TabsTrigger = React.forwardRef<HTMLButtonElement, TabsTriggerProps>(
  ({ className, value, children, disabled, ...props }, ref) => {
    const { value: activeValue, setValue, baseId } = useTabsContext();
    const isActive = activeValue === value;

    return (
      <button
        ref={ref}
        type="button"
        role="tab"
        id={`${baseId}-tab-${value}`}
        aria-controls={`${baseId}-panel-${value}`}
        aria-selected={isActive}
        tabIndex={isActive ? 0 : -1}
        disabled={disabled}
        onClick={() => setValue(value)}
        className={cn(
          'inline-flex items-center gap-2 rounded-[0.25rem] border-b-2 border-transparent px-3 py-2 text-sm font-bold text-muted-foreground transition-colors',
          'hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent',
          isActive && 'border-accent bg-surface-hover text-white',
          disabled && 'pointer-events-none opacity-50',
          className
        )}
        {...props}
      >
        {children}
      </button>
    );
  }
);
TabsTrigger.displayName = 'TabsTrigger';

export interface TabsContentProps extends React.HTMLAttributes<HTMLDivElement> {
  value: string;
}

export const TabsContent = React.forwardRef<HTMLDivElement, TabsContentProps>(
  ({ className, value, children, ...props }, ref) => {
    const { value: activeValue, baseId } = useTabsContext();
    if (activeValue !== value) return null;

    return (
      <div
        ref={ref}
        role="tabpanel"
        id={`${baseId}-panel-${value}`}
        aria-labelledby={`${baseId}-tab-${value}`}
        tabIndex={0}
        className={cn('focus-visible:outline-none', className)}
        {...props}
      >
        {children}
      </div>
    );
  }
);
TabsContent.displayName = 'TabsContent';
