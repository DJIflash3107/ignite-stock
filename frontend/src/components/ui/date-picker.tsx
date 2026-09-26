import * as React from 'react';
import { CalendarDays } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import dayjs from '@/lib/dayjs';
import { cn } from '@/lib/utils';

/** Canonical wire format used across the app and the backend. */
const DATE_FORMAT = 'YYYY-MM-DD';
/** Human-readable format shown on the trigger. */
const DISPLAY_FORMAT = 'DD MMM YYYY';

export interface DatePickerProps {
  /** Selected date as a `YYYY-MM-DD` string, or empty when nothing is picked. */
  value?: string;
  /** Emits the new date as a `YYYY-MM-DD` string (empty string when cleared). */
  onChange: (value: string) => void;
  /** Accessible id, forwarded to the trigger button so a <Label htmlFor> works. */
  id?: string;
  placeholder?: string;
  disabled?: boolean;
  error?: boolean;
  /** Disable dates after this date. Defaults to today (no future dates). */
  maxDate?: Date;
  /** Disable dates before this date. */
  minDate?: Date;
  className?: string;
  /** Called when focus leaves the trigger, so form libs can mark the field touched. */
  onBlur?: () => void;
}

/**
 * Single-date picker built on the shadcn Calendar + Popover primitives.
 * Themed with the IgniteStock design system (0.25rem radius, neutral borders,
 * accent reserved for the selected day). The popover stays open on selection
 * and the trigger reflects the picked value immediately.
 */
export const DatePicker = React.forwardRef<HTMLButtonElement, DatePickerProps>(
  (
    {
      value,
      onChange,
      id,
      placeholder = 'Pick a date',
      disabled = false,
      error = false,
      maxDate,
      minDate,
      className,
      onBlur,
    },
    ref
  ) => {
    const [open, setOpen] = React.useState(false);

    const selected = value ? dayjs(value).toDate() : undefined;
    // Guard against an unparseable value so the calendar never receives NaN.
    const safeSelected =
      selected && !Number.isNaN(selected.getTime()) ? selected : undefined;

    const disabledMatcher = React.useMemo(() => {
      if (minDate && maxDate) return { before: minDate, after: maxDate };
      if (maxDate) return { after: maxDate };
      if (minDate) return { before: minDate };
      return undefined;
    }, [minDate, maxDate]);

    const handleSelect = (date: Date | undefined) => {
      onChange(date ? dayjs(date).format(DATE_FORMAT) : '');
      setOpen(false);
    };

    return (
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger
          ref={ref}
          id={id}
          type="button"
          disabled={disabled}
          onBlur={onBlur}
          aria-invalid={error || undefined}
          aria-haspopup="dialog"
          className={cn(
            'inline-flex h-12 w-full items-center gap-2 rounded-[0.25rem] border border-border bg-primary px-3 text-base text-foreground transition-colors hover:border-accent/60 focus-visible:outline-none focus-visible:border-accent focus-visible:ring-2 focus-visible:ring-accent disabled:cursor-not-allowed disabled:opacity-50',
            error && 'border-danger focus-visible:border-danger focus-visible:ring-danger',
            className
          )}
        >
          <CalendarDays className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
          <span className={cn('truncate text-left', !safeSelected && 'text-muted-foreground')}>
            {safeSelected ? dayjs(safeSelected).format(DISPLAY_FORMAT) : placeholder}
          </span>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={safeSelected}
            onSelect={handleSelect}
            defaultMonth={safeSelected}
            disabled={disabledMatcher}
            autoFocus
          />
        </PopoverContent>
      </Popover>
    );
  }
);
DatePicker.displayName = 'DatePicker';
