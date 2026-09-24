import * as React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

/**
 * Pagination control.
 * ---------------------------------------------------------------------------
 * Presentational and accessible: Previous / Next with a "Page X of Y" status.
 * Offsets are 0-based and match the backend `limit` / `offset` contract. The
 * buttons are neutral (secondary) so pagination never competes with the page's
 * single accent CTA. Disabled states are explicit at both bounds.
 */
export interface PaginationProps {
  total: number;
  limit: number;
  offset: number;
  onOffsetChange: (offset: number) => void;
  isLoading?: boolean;
  className?: string;
}

export const Pagination: React.FC<PaginationProps> = ({
  total,
  limit,
  offset,
  onOffsetChange,
  isLoading = false,
  className,
}) => {
  const totalPages = limit > 0 ? Math.max(1, Math.ceil(total / limit)) : 1;
  const currentPage = limit > 0 ? Math.floor(offset / limit) + 1 : 1;

  const canGoPrevious = offset > 0 && !isLoading;
  const canGoNext = offset + limit < total && !isLoading;

  const goPrevious = () => {
    if (canGoPrevious) onOffsetChange(Math.max(0, offset - limit));
  };

  const goNext = () => {
    if (canGoNext) onOffsetChange(offset + limit);
  };

  const firstItem = total === 0 ? 0 : offset + 1;
  const lastItem = Math.min(offset + limit, total);

  return (
    <nav
      className={cn(
        'flex flex-col items-center justify-between gap-4 border-t border-border pt-4 sm:flex-row',
        className
      )}
      aria-label="Pagination"
    >
      <p className="text-sm text-muted-foreground">
        {total === 0 ? (
          'No results'
        ) : (
          <>
            Showing{' '}
            <span className="font-bold text-foreground">
              {firstItem}–{lastItem}
            </span>{' '}
            of <span className="font-bold text-foreground">{total}</span>
          </>
        )}
      </p>

      <div className="flex items-center gap-3">
        <Button
          variant="secondary"
          size="sm"
          onClick={goPrevious}
          disabled={!canGoPrevious}
          aria-label="Previous page"
        >
          <ChevronLeft className="h-4 w-4" aria-hidden="true" />
          <span>Previous</span>
        </Button>

        <span className="text-sm text-secondary-foreground" aria-live="polite">
          Page {currentPage} of {totalPages}
        </span>

        <Button
          variant="secondary"
          size="sm"
          onClick={goNext}
          disabled={!canGoNext}
          aria-label="Next page"
        >
          <span>Next</span>
          <ChevronRight className="h-4 w-4" aria-hidden="true" />
        </Button>
      </div>
    </nav>
  );
};
