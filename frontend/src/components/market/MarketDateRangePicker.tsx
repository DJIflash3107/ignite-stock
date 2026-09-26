import * as React from 'react';
import { CalendarRange, RotateCcw } from 'lucide-react';
import type { DateRange } from 'react-day-picker';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import dayjs from '@/lib/dayjs';
import {
  DEFAULT_RANGE_DAYS,
  MAX_RANGE_DAYS,
  type MarketDateRange,
} from '@/hooks/useMarketData';

interface MarketDateRangePickerProps {
  value: MarketDateRange;
  onChange: (next: MarketDateRange) => void;
  onReset?: () => void;
  disabled?: boolean;
}

/** Presets map a label to the number of days counted back from today. */
const PRESETS: { label: string; days: number }[] = [
  { label: '7D', days: 7 },
  { label: '30D', days: DEFAULT_RANGE_DAYS },
  { label: '90D', days: MAX_RANGE_DAYS },
];

const DATE_FORMAT = 'YYYY-MM-DD';
/** Human-readable label shown on the trigger button. */
const DISPLAY_FORMAT = 'DD MMM YYYY';

function todayStr(): string {
  return dayjs().format(DATE_FORMAT);
}

function toDate(value: string): Date {
  return dayjs(value).toDate();
}

/**
 * Validates a candidate range against the same rules the backend enforces:
 * no future dates, start not after end, and a window of at most 90 days.
 */
function validateMarketDateRange(range: MarketDateRange): string | null {
  const now = dayjs();
  const start = dayjs(range.start);
  const end = dayjs(range.end);

  if (!start.isValid() || !end.isValid()) return 'Select a valid start and end date.';
  if (end.isAfter(now, 'day')) return 'The end date cannot be in the future.';
  if (start.isAfter(now, 'day')) return 'The start date cannot be in the future.';
  if (start.isAfter(end, 'day')) return 'The start date must not be after the end date.';
  if (end.diff(start, 'day') > MAX_RANGE_DAYS) {
    return `The date range must not exceed ${MAX_RANGE_DAYS} days.`;
  }
  return null;
}

export const MarketDateRangePicker: React.FC<MarketDateRangePickerProps> = ({
  value,
  onChange,
  onReset,
  disabled = false,
}) => {
  const [open, setOpen] = React.useState(false);
  const today = todayStr();

  // Local draft so the calendar can show a half-completed range (from picked,
  // to not yet picked) without committing it. Nothing is applied to the page
  // until the user presses "Apply".
  const [draft, setDraft] = React.useState<DateRange | undefined>({
    from: toDate(value.start),
    to: toDate(value.end),
  });

  // Reset the draft to the committed range whenever the popover opens, so a
  // previous cancelled selection never lingers and the draft always reflects
  // external changes (presets, reset, parent refetch).
  const handleOpenChange = (next: boolean) => {
    if (next) {
      setDraft({ from: toDate(value.start), to: toDate(value.end) });
    }
    setOpen(next);
  };

  // Picking a date only updates the draft — the popover stays open so the user
  // can finish the range and review it before applying.
  const handleSelect = (range: DateRange | undefined) => {
    setDraft(range);
  };

  // Derive the draft range + validation so we can gate the Apply button.
  const draftRange: MarketDateRange | null =
    draft?.from && draft?.to
      ? {
          start: dayjs(draft.from).format(DATE_FORMAT),
          end: dayjs(draft.to).format(DATE_FORMAT),
        }
      : null;
  const draftError = draftRange ? validateMarketDateRange(draftRange) : null;
  const canApply = Boolean(draftRange) && !draftError;

  const handleApply = () => {
    if (!draftRange || draftError) return;
    onChange(draftRange);
    setOpen(false);
  };

  const handleCancel = () => {
    // Discard the draft; the committed range is untouched.
    setDraft({ from: toDate(value.start), to: toDate(value.end) });
    setOpen(false);
  };

  // Presets load a candidate range into the draft and open the popover so the
  // user can review it and confirm with Apply — nothing is committed yet.
  const handlePreset = (days: number) => {
    const end = dayjs();
    setDraft({
      from: end.subtract(days, 'day').toDate(),
      to: end.toDate(),
    });
    setOpen(true);
  };

  const activePresetDays = React.useMemo(() => {
    const diff = dayjs(value.end).diff(dayjs(value.start), 'day');
    const matchesEnd = value.end === today;
    if (!matchesEnd) return null;
    const preset = PRESETS.find((p) => p.days === diff);
    return preset ? preset.days : null;
  }, [value.start, value.end, today]);

  // The trigger always reflects the committed value, never the draft.
  const rangeLabel = `${dayjs(value.start).format(DISPLAY_FORMAT)} \u2013 ${dayjs(
    value.end
  ).format(DISPLAY_FORMAT)}`;

  const draftLabel = draftRange
    ? `${dayjs(draftRange.start).format(DISPLAY_FORMAT)} \u2013 ${dayjs(
        draftRange.end
      ).format(DISPLAY_FORMAT)}`
    : draft?.from
      ? `${dayjs(draft.from).format(DISPLAY_FORMAT)} \u2013 select end date`
      : 'Select a start and end date';

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2 text-muted-foreground">
          <CalendarRange className="h-4 w-4" aria-hidden="true" />
          <span className="text-sm font-bold text-foreground">Date range</span>
        </div>

        <Popover open={open} onOpenChange={handleOpenChange}>
          <PopoverTrigger
            disabled={disabled}
            className="inline-flex h-10 items-center gap-2 rounded-[0.25rem] border border-border bg-primary px-3 text-sm font-bold text-foreground transition-colors hover:border-accent/60 hover:bg-surface-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:cursor-not-allowed disabled:opacity-50"
            aria-label="Select date range"
          >
            <CalendarRange className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
            <span className="font-mono">{rangeLabel}</span>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0">
            <Calendar
              mode="range"
              defaultMonth={draft?.from}
              selected={draft}
              onSelect={handleSelect}
              numberOfMonths={2}
              disabled={{ after: new Date() }}
              autoFocus
            />
            <div className="flex flex-col gap-2 border-t border-border p-3">
              <div className="flex items-center justify-between gap-4">
                <span
                  className={`text-xs ${draftError ? 'text-danger' : 'text-muted-foreground'}`}
                  role={draftError ? 'alert' : undefined}
                >
                  {draftError ?? draftLabel}
                </span>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="sm" onClick={handleCancel}>
                    Cancel
                  </Button>
                  <Button size="sm" onClick={handleApply} disabled={!canApply}>
                    Apply
                  </Button>
                </div>
              </div>
            </div>
          </PopoverContent>
        </Popover>

        {/* Quick presets */}
        <div className="inline-flex rounded-[0.25rem] border border-border bg-secondary p-1">
          {PRESETS.map((preset) => (
            <button
              key={preset.days}
              type="button"
              onClick={() => handlePreset(preset.days)}
              disabled={disabled}
              aria-pressed={activePresetDays === preset.days}
              className={`rounded-[0.25rem] px-3 py-1.5 text-sm font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:opacity-50 ${
                activePresetDays === preset.days
                  ? 'bg-surface-hover text-white'
                  : 'text-muted-foreground hover:text-white'
              }`}
            >
              {preset.label}
            </button>
          ))}
        </div>

        {onReset && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onReset}
            disabled={disabled}
          >
            <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
            <span>Reset</span>
          </Button>
        )}
      </div>
    </div>
  );
};
