import * as React from 'react';
import { LineChart as LineChartIcon } from 'lucide-react';
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  type TooltipContentProps,
} from 'recharts';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ErrorDisplay } from '@/components/feedback/ErrorDisplay';
import { EmptyState } from '@/components/feedback/EmptyState';
import { Skeleton } from '@/components/feedback/Skeleton';
import { formatCurrency } from '@/lib/formatters';
import { formatDate } from '@/lib/dayjs';
import type { ClosePricePoint } from '@/models/market';

/**
 * Daily close-price line chart for the investigated company.
 *
 * Renders the per-day `series` returned by
 * `GET /companies/{ticker}/price-history` (window derived from the
 * investigation target date). Design system: a single accent line, neutral
 * grid/axis, 0.25rem radius, no gradients or glows. Numeric values use the
 * mono font and the shared `formatCurrency` helper.
 */

export interface PriceHistorySectionProps {
  ticker: string | null;
  /** Per-day series, ascending by date. */
  series: ClosePricePoint[];
  /** Resolved window start (ISO date), from the backend response. */
  start?: string;
  /** Resolved window end (ISO date), from the backend response. */
  end?: string;
  loading: boolean;
  error: string | null;
  onRetry: () => void;
}

const AXIS_TICK = { fill: 'var(--color-muted-foreground)', fontSize: 12 } as const;

const ClosePriceTooltip = ({ active, payload }: TooltipContentProps): React.ReactElement | null => {
  if (!active || !payload || payload.length === 0) return null;
  const point = payload[0].payload as ClosePricePoint;

  return (
    <div className="rounded-[0.25rem] border border-border bg-primary px-3 py-2 font-mono text-xs">
      <div className="text-muted-foreground">{formatDate(point.date, 'DD MMM YYYY')}</div>
      <div className="mt-1 font-bold text-foreground">{formatCurrency(point.close)}</div>
    </div>
  );
};

export const PriceHistorySection: React.FC<PriceHistorySectionProps> = ({
  ticker,
  series,
  start,
  end,
  loading,
  error,
  onRetry,
}) => {
  const hasRange = Boolean(start && end);

  return (
    <Card>
      <CardHeader className="flex flex-col gap-2 pb-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <CardTitle className="flex items-center gap-2">
            <LineChartIcon className="h-5 w-5 text-muted-foreground" aria-hidden="true" />
            Close Price — Daily
          </CardTitle>
          <CardDescription className="mt-1">
            Daily close price{ticker ? ` for ${ticker}` : ''} across the selected window.
          </CardDescription>
        </div>
        {hasRange && (
          <Badge variant="secondary" className="font-mono">
            {formatDate(start)} — {formatDate(end)}
          </Badge>
        )}
      </CardHeader>

      <CardContent className="pt-0">
        {loading ? (
          <Skeleton style={{ height: 380 }} />
        ) : error ? (
          <ErrorDisplay
            title="Failed to load close price history"
            message={error}
            onRetry={onRetry}
          />
        ) : !series || series.length === 0 ? (
          <EmptyState
            title="No close price history"
            description="No daily close price is available for the selected window."
          />
        ) : (
          <div
            style={{ height: 380 }}
            role="img"
            aria-label={
              ticker
                ? `Line chart of daily close price for ${ticker} across the selected window.`
                : 'Line chart of daily close price across the selected window.'
            }
          >
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={series} margin={{ top: 8, right: 16, bottom: 0, left: 8 }}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="var(--color-border-subtle)"
                  vertical={false}
                />
                <XAxis
                  dataKey="date"
                  tickFormatter={(value: string) => formatDate(value, 'DD MMM')}
                  tick={AXIS_TICK}
                  tickLine={false}
                  axisLine={{ stroke: 'var(--color-border)' }}
                  minTickGap={24}
                />
                <YAxis
                  tickFormatter={(value: number) => formatCurrency(value)}
                  tick={AXIS_TICK}
                  tickLine={false}
                  axisLine={false}
                  width={88}
                  domain={['dataMin', 'dataMax']}
                />
                <Tooltip content={ClosePriceTooltip} cursor={{ stroke: 'var(--color-border)' }} />
                <Line
                  type="monotone"
                  dataKey="close"
                  stroke="var(--color-accent)"
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4 }}
                  isAnimationActive={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default PriceHistorySection;
