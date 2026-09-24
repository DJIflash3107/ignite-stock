import * as React from 'react';
import {
  Activity,
  Building2,
  FileSearch,
  Layers,
  ListChecks,
  TrendingDown,
  TrendingUp,
  Users,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ErrorDisplay } from '@/components/feedback/ErrorDisplay';
import { Skeleton } from '@/components/feedback/Skeleton';
import { formatCurrency, formatPercent } from '@/lib/formatters';
import { formatDate } from '@/lib/dayjs';
import { findStockMovementEvidence } from '@/lib/investigationEvidence';
import { CONFIDENCE_LABEL, CONFIDENCE_VARIANT, STATUS_LABEL, STATUS_VARIANT } from '@/lib/investigationLabels';
import { ContextMetricRow } from './ContextMetricRow';
import type { CompanyMarketContext, InvestigationDetail, PeerEntry } from '@/models/investigation';
import type { CompanyImpact } from '@/models/market';

/**
 * Right pane: investigation context.
 * Every block renders backend-provided numbers only (formatted, never
 * recalculated) and degrades independently — a failed block shows the real
 * error with retry while the rest of the panel and the chat keep working.
 */
export interface InvestigationContextPanelProps {
  investigation: InvestigationDetail | null;
  investigationLoading: boolean;
  investigationError: string | null;
  onRetryInvestigation: () => void;

  impact: CompanyImpact | null;
  impactLoading: boolean;
  impactError: string | null;
  onRetryImpact: () => void;

  marketContext: CompanyMarketContext | null;
  marketContextLoading: boolean;
  marketContextError: string | null;
  onRetryMarketContext: () => void;

  evidenceCount: number;
  evidenceLoading: boolean;
  evidenceError: string | null;
  onRetryEvidence: () => void;
}

function toNumber(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && value.trim() !== '' && !Number.isNaN(Number(value))) {
    return Number(value);
  }
  return null;
}

function toneFor(value: number | null): 'neutral' | 'positive' | 'negative' | 'muted' {
  if (value === null || value === 0) return 'neutral';
  return value > 0 ? 'positive' : 'negative';
}

export const InvestigationContextPanel: React.FC<InvestigationContextPanelProps> = ({
  investigation,
  investigationLoading,
  investigationError,
  onRetryInvestigation,
  impact,
  impactLoading,
  impactError,
  onRetryImpact,
  marketContext,
  marketContextLoading,
  marketContextError,
  onRetryMarketContext,
  evidenceCount,
  evidenceLoading,
  evidenceError,
  onRetryEvidence,
}) => {
  const movement = React.useMemo(
    () =>
      investigation ? findStockMovementEvidence(investigation.evidence_items) : undefined,
    [investigation]
  );
  const movementData = movement?.data ?? {};
  const closePrice = toNumber(movementData.close_price);
  const stockReturn = toNumber(movementData.return);
  const tradeDate =
    (typeof movementData.actual_trade_date === 'string' && movementData.actual_trade_date) ||
    investigation?.target_date;

  const peers: PeerEntry[] = React.useMemo(() => {
    if (marketContext?.peers?.length) return marketContext.peers;
    if (impact?.peers?.length) return impact.peers;
    return [];
  }, [marketContext, impact]);

  if (investigationLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-28 w-full" variant="rounded" />
        <Skeleton className="h-40 w-full" variant="rounded" />
        <Skeleton className="h-32 w-full" variant="rounded" />
      </div>
    );
  }

  if (investigationError) {
    return (
      <ErrorDisplay
        title="Failed to load investigation context"
        message={investigationError}
        onRetry={onRetryInvestigation}
      />
    );
  }

  if (!investigation) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-sm text-muted-foreground">
            No investigation context is available for this id.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Stock */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Building2 className="h-5 w-5 text-muted-foreground" aria-hidden="true" />
            Stock
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 pt-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-heading text-xl font-bold text-white">
              {investigation.company_ticker ?? '—'}
            </span>
            <Badge variant={STATUS_VARIANT[investigation.status]}>
              {STATUS_LABEL[investigation.status]}
            </Badge>
            {investigation.index_code && (
              <Badge variant="secondary" className="font-mono">
                {investigation.index_code}
              </Badge>
            )}
          </div>
          <div className="divide-y divide-border">
            <ContextMetricRow
              label="Latest movement"
              value={formatPercent(stockReturn)}
              tone={toneFor(stockReturn)}
              icon={
                stockReturn !== null && stockReturn < 0 ? (
                  <TrendingDown className="h-4 w-4" aria-hidden="true" />
                ) : (
                  <TrendingUp className="h-4 w-4" aria-hidden="true" />
                )
              }
            />
            <ContextMetricRow label="Close price" value={formatCurrency(closePrice)} />
            <ContextMetricRow label="Trade date" value={formatDate(tradeDate)} tone="muted" />
          </div>
        </CardContent>
      </Card>

      {/* Market & sector movement */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Activity className="h-5 w-5 text-muted-foreground" aria-hidden="true" />
            Market &amp; sector movement
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          {impactLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-4 w-full" />
              ))}
            </div>
          ) : impactError ? (
            <ErrorDisplay
              compact
              title="Market & sector unavailable"
              message={impactError}
              onRetry={onRetryImpact}
            />
          ) : !impact ? (
            <p className="text-sm text-muted-foreground">
              No market or sector movement data was returned.
            </p>
          ) : (
            <div className="divide-y divide-border">
              <ContextMetricRow
                label="Company return"
                value={formatPercent(impact.stock_return)}
                tone={toneFor(impact.stock_return)}
              />
              <ContextMetricRow
                label={`Index return (${impact.index_code})`}
                value={formatPercent(impact.index_return)}
                tone={toneFor(impact.index_return)}
              />
              <ContextMetricRow
                label="Market return"
                value={formatPercent(impact.market_return)}
                tone={toneFor(impact.market_return)}
              />
              <ContextMetricRow
                label={impact.sub_sector ? `Sector return (${impact.sub_sector})` : 'Sector return'}
                value={formatPercent(impact.sector_return)}
                tone={toneFor(impact.sector_return)}
              />
              <ContextMetricRow
                label="Relative to sector"
                value={formatPercent(impact.relative_to_sector)}
                tone={toneFor(impact.relative_to_sector)}
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Peer context */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-2 pb-4">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Users className="h-5 w-5 text-muted-foreground" aria-hidden="true" />
            Peer context
          </CardTitle>
          {!marketContextLoading && !marketContextError && (
            <span className="text-sm text-muted-foreground">
              {peers.length} peer{peers.length === 1 ? '' : 's'}
            </span>
          )}
        </CardHeader>
        <CardContent className="pt-0">
          {marketContextLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-4 w-2/3" />
              ))}
            </div>
          ) : marketContextError ? (
            <ErrorDisplay
              compact
              title="Peer context unavailable"
              message={marketContextError}
              onRetry={onRetryMarketContext}
            />
          ) : peers.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No peer comparison data was returned for this ticker.
            </p>
          ) : (
            <div className="divide-y divide-border">
              {peers.slice(0, 8).map((peer) => (
                <ContextMetricRow
                  key={peer.symbol}
                  label={peer.symbol}
                  value={formatPercent(toNumber(peer.return))}
                  tone={toneFor(toNumber(peer.return))}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Drivers */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-2 pb-4">
          <CardTitle className="flex items-center gap-2 text-lg">
            <ListChecks className="h-5 w-5 text-muted-foreground" aria-hidden="true" />
            Drivers
          </CardTitle>
          <Badge variant="outline">{investigation.drivers.length}</Badge>
        </CardHeader>
        <CardContent className="pt-0">
          {investigation.drivers.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No ranked drivers were produced for this investigation.
            </p>
          ) : (
            <ol className="space-y-3">
              {[...investigation.drivers]
                .sort((a, b) => a.rank - b.rank)
                .map((driver) => (
                  <li key={driver.id} className="rounded-[0.25rem] border border-border bg-primary p-3">
                    <div className="flex items-center gap-2">
                      <span className="flex h-6 w-6 items-center justify-center rounded-[0.25rem] bg-surface-hover font-mono text-xs font-bold text-white">
                        {driver.rank}
                      </span>
                      <Badge variant={CONFIDENCE_VARIANT[driver.confidence]}>
                        {CONFIDENCE_LABEL[driver.confidence]}
                      </Badge>
                    </div>
                    <p className="mt-2 text-sm font-bold text-white">{driver.title}</p>
                  </li>
                ))}
            </ol>
          )}
        </CardContent>
      </Card>

      {/* Evidence count */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-2 pb-4">
          <CardTitle className="flex items-center gap-2 text-lg">
            <FileSearch className="h-5 w-5 text-muted-foreground" aria-hidden="true" />
            Evidence
          </CardTitle>
          <Layers className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
        </CardHeader>
        <CardContent className="pt-0">
          {evidenceLoading ? (
            <Skeleton className="h-8 w-24" />
          ) : evidenceError ? (
            <ErrorDisplay
              compact
              title="Evidence count unavailable"
              message={evidenceError}
              onRetry={onRetryEvidence}
            />
          ) : (
            <div>
              <p className="font-mono text-2xl font-bold text-white">{evidenceCount}</p>
              <p className="mt-1 text-sm text-muted-foreground">
                factual item{evidenceCount === 1 ? '' : 's'} recorded
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
