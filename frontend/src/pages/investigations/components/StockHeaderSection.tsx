import * as React from 'react';
import { TrendingDown, TrendingUp, Minus } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/feedback/Skeleton';
import { formatCurrency, formatPercent } from '@/lib/formatters';
import { formatDate } from '@/lib/dayjs';
import { STATUS_LABEL, STATUS_VARIANT } from '@/lib/investigationLabels';
import type { InvestigationDetail } from '@/models/investigation';
import { findStockMovementEvidence } from '@/lib/investigationEvidence';

/**
 * Stock header — the factual latest movement for the investigated ticker.
 * Numeric values come from the backend (price evidence `data` and the
 * investigation record); direction is always paired with an icon + label.
 */

export interface StockHeaderSectionProps {
  investigation: InvestigationDetail | null;
  loading: boolean;
}

function MovementIcon({ value }: { value: number | null }) {
  if (value === null || value === 0) {
    return <Minus className="h-5 w-5 text-muted-foreground" aria-hidden="true" />;
  }
  return value > 0 ? (
    <TrendingUp className="h-5 w-5 text-success" aria-hidden="true" />
  ) : (
    <TrendingDown className="h-5 w-5 text-danger" aria-hidden="true" />
  );
}

function toNumber(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && value.trim() !== '' && !Number.isNaN(Number(value))) {
    return Number(value);
  }
  return null;
}

export const StockHeaderSection: React.FC<StockHeaderSectionProps> = ({
  investigation,
  loading,
}) => {
  const movementEvidence = React.useMemo(
    () => (investigation ? findStockMovementEvidence(investigation.evidence_items) : undefined),
    [investigation]
  );

  const data = movementEvidence?.data ?? {};
  const closePrice = toNumber(data.close_price);
  const stockReturn = toNumber(data.return);
  const volumeRatio = toNumber(data.volume_ratio);
  const tradeDate =
    (typeof data.actual_trade_date === 'string' && data.actual_trade_date) ||
    investigation?.target_date;

  const directionLabel =
    stockReturn === null || stockReturn === 0
      ? 'Flat'
      : stockReturn > 0
        ? 'Up'
        : 'Down';

  return (
    <Card>
      <CardHeader className="flex flex-col gap-4 pb-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h2 className="font-heading text-2xl font-bold text-white">
              {investigation?.company_ticker ?? '—'}
            </h2>
            {investigation?.status && (
              <Badge variant={STATUS_VARIANT[investigation.status]}>
                {STATUS_LABEL[investigation.status]}
              </Badge>
            )}
            {investigation?.index_code && (
              <Badge variant="secondary" className="font-mono">
                {investigation.index_code}
              </Badge>
            )}
          </div>
          <p className="mt-2 text-sm text-secondary-foreground">
            {investigation?.question || 'Investigation movement summary'}
          </p>
        </div>

        <div className="sm:text-right">
          <span className="text-sm text-muted-foreground">Latest movement</span>
          {loading ? (
            <Skeleton className="mt-1 h-8 w-28" />
          ) : (
            <div className="mt-1 flex items-center gap-2 sm:justify-end">
              <MovementIcon value={stockReturn} />
              <span
                className={
                  stockReturn === null || stockReturn === 0
                    ? 'font-mono text-2xl font-bold text-white'
                    : stockReturn > 0
                      ? 'font-mono text-2xl font-bold text-success'
                      : 'font-mono text-2xl font-bold text-danger'
                }
              >
                {formatPercent(stockReturn)}
              </span>
              <span className="text-sm font-bold text-muted-foreground">
                {directionLabel}
              </span>
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent className="border-t border-border pt-4">
        <dl className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div>
            <dt className="text-sm text-muted-foreground">Close price</dt>
            <dd className="mt-1 font-mono text-lg font-bold text-white">
              {loading ? <Skeleton className="h-6 w-24" /> : formatCurrency(closePrice)}
            </dd>
          </div>
          <div>
            <dt className="text-sm text-muted-foreground">Volume vs 20d avg</dt>
            <dd className="mt-1 font-mono text-lg font-bold text-white">
              {loading ? (
                <Skeleton className="h-6 w-20" />
              ) : volumeRatio !== null ? (
                `${volumeRatio.toFixed(2)}x`
              ) : (
                '—'
              )}
            </dd>
          </div>
          <div>
            <dt className="text-sm text-muted-foreground">Trade date</dt>
            <dd className="mt-1 font-mono text-lg font-bold text-white">
              {loading ? <Skeleton className="h-6 w-28" /> : formatDate(tradeDate)}
            </dd>
          </div>
          <div>
            <dt className="text-sm text-muted-foreground">Overall confidence</dt>
            <dd className="mt-1 text-lg font-bold text-white">
              {loading ? (
                <Skeleton className="h-6 w-24" />
              ) : investigation?.overall_confidence ? (
                <Badge variant="outline" className="font-mono uppercase">
                  {investigation.overall_confidence}
                </Badge>
              ) : (
                '—'
              )}
            </dd>
          </div>
        </dl>
      </CardContent>
    </Card>
  );
};
