import * as React from 'react';
import { BarChart2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ErrorDisplay } from '@/components/feedback/ErrorDisplay';
import { Skeleton } from '@/components/feedback/Skeleton';
import { formatPercent } from '@/lib/formatters';
import { formatDate } from '@/lib/dayjs';
import type { CompanyImpact } from '@/models/market';

/**
 * Market vs Sector comparison — deterministic relative-performance metrics from
 * GET /companies/{ticker}/impact. Values are backend-calculated and only
 * formatted here. A failed request renders an error, never placeholder data.
 */

export interface ComparisonSectionProps {
  impact: CompanyImpact | null;
  loading: boolean;
  error: string | null;
  onRetry: () => void;
}

interface MetricRowProps {
  label: string;
  value: number | null;
  emphasis?: boolean;
}

function MetricRow({ label, value, emphasis = false }: MetricRowProps) {
  const isPositive = value !== null && value > 0;
  const isNegative = value !== null && value < 0;
  return (
    <div className="flex items-center justify-between gap-4 py-3">
      <span className="text-sm text-secondary-foreground">{label}</span>
      <span
        className={
          emphasis
            ? `font-mono text-base font-bold ${
                isPositive ? 'text-success' : isNegative ? 'text-danger' : 'text-white'
              }`
            : `font-mono text-sm ${isPositive ? 'text-success' : isNegative ? 'text-danger' : 'text-white'}`
        }
      >
        {formatPercent(value)}
      </span>
    </div>
  );
}

export const ComparisonSection: React.FC<ComparisonSectionProps> = ({
  impact,
  loading,
  error,
  onRetry,
}) => {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-2 pb-4">
        <CardTitle className="flex items-center gap-2">
          <BarChart2 className="h-5 w-5 text-muted-foreground" aria-hidden="true" />
          Market vs Sector
        </CardTitle>
        {impact && (
          <Badge variant="secondary" className="font-mono">
            {formatDate(impact.start)} — {formatDate(impact.end)}
          </Badge>
        )}
      </CardHeader>
      <CardContent className="pt-0">
        {loading ? (
          <div className="space-y-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex items-center justify-between py-3">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-4 w-20" />
              </div>
            ))}
          </div>
        ) : error ? (
          <ErrorDisplay
            title="Failed to load market & sector comparison"
            message={error}
            onRetry={onRetry}
          />
        ) : !impact ? (
          <p className="py-6 text-sm text-muted-foreground">
            No market or sector comparison data was returned for this investigation.
          </p>
        ) : (
          <div className="divide-y divide-border">
            <MetricRow label="Company return" value={impact.stock_return} emphasis />
            <MetricRow label={`Index return (${impact.index_code})`} value={impact.index_return} />
            <MetricRow label="Market return" value={impact.market_return} />
            <MetricRow
              label={impact.sub_sector ? `Sector return (${impact.sub_sector})` : 'Sector return'}
              value={impact.sector_return}
            />
            <MetricRow label="Relative to index" value={impact.relative_to_index} emphasis />
            <MetricRow label="Relative to sector" value={impact.relative_to_sector} emphasis />
          </div>
        )}
      </CardContent>
    </Card>
  );
};
