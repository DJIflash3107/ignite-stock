import * as React from 'react';
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
import type { MarketCapPoint } from '@/models/market';
import { formatDate } from '@/lib/dayjs';
import { formatMarketCap } from '@/lib/formatters';
import { Skeleton } from '@/components/feedback/Skeleton';
import { EmptyState } from '@/components/feedback/EmptyState';

/**
 * Daily total IDX market-cap line chart.
 *
 * Renders the per-day `market_cap_series` returned by `/market/overview`.
 * Design system: a single accent line, neutral grid/axis, 0.25rem radius, no
 * gradients or glows. Numeric values use the mono font and the shared
 * `formatMarketCap` helper so figures read as "IDR 12.34 T".
 */

export interface MarketCapChartProps {
  /** Per-day series, ascending by date. */
  series: MarketCapPoint[];
  loading?: boolean;
  className?: string;
}

const AXIS_TICK = { fill: 'var(--color-muted-foreground)', fontSize: 12 } as const;

const MarketCapTooltip = ({ active, payload }: TooltipContentProps): React.ReactElement | null => {
  if (!active || !payload || payload.length === 0) return null;
  const point = payload[0].payload as MarketCapPoint;

  return (
    <div className="rounded-[0.25rem] border border-border bg-primary px-3 py-2 font-mono text-xs">
      <div className="text-muted-foreground">{formatDate(point.date, 'DD MMM YYYY')}</div>
      <div className="mt-1 font-bold text-foreground">{formatMarketCap(point.idx_total_market_cap)}</div>
    </div>
  );
};

export const MarketCapChart: React.FC<MarketCapChartProps> = ({
  series,
  loading = false,
  className,
}) => {
  if (loading) {
    return <Skeleton className={className} style={{ height: 380 }} />;
  }

  if (!series || series.length === 0) {
    return (
      <EmptyState
        title="No market cap history"
        description="No daily total IDX market cap is available for the selected window."
      />
    );
  }

  return (
    <div
      className={className}
      style={{ height: 380 }}
      role="img"
      aria-label="Line chart of daily total IDX market capitalisation over the selected window."
    >
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={series} margin={{ top: 8, right: 16, bottom: 0, left: 8 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border-subtle)" vertical={false} />
          <XAxis
            dataKey="date"
            tickFormatter={(value: string) => formatDate(value, 'DD MMM')}
            tick={AXIS_TICK}
            tickLine={false}
            axisLine={{ stroke: 'var(--color-border)' }}
            minTickGap={24}
          />
          <YAxis
            tickFormatter={(value: number) => formatMarketCap(value)}
            tick={AXIS_TICK}
            tickLine={false}
            axisLine={false}
            width={72}
            domain={['dataMin', 'dataMax']}
          />
          <Tooltip content={MarketCapTooltip} cursor={{ stroke: 'var(--color-border)' }} />
          <Line
            type="monotone"
            dataKey="idx_total_market_cap"
            stroke="var(--color-accent)"
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4 }}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};
