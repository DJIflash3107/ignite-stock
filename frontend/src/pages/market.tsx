import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  TrendingUp,
  TrendingDown,
  Search,
  SearchCode,
  ArrowUpRight,
  RefreshCw,
  Layers,
  Sparkles,
  BarChart2,
  Calendar,
  ShieldCheck,
  ChevronRight,
  SlidersHorizontal,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { EmptyState } from '@/components/feedback/EmptyState';
import { ErrorDisplay } from '@/components/feedback/ErrorDisplay';
import { Skeleton, SkeletonCard, SkeletonTableRow } from '@/components/feedback/Skeleton';
import { useMarketData } from '@/hooks/useMarketData';
import { formatDate } from '@/lib/dayjs';
import {
  formatCurrency,
  formatMarketCap,
  formatPercent,
  formatWeight,
  formatContribution,
} from '@/lib/formatters';
import type { MoverPeriod } from '@/models/market';

const POPULAR_TICKERS = ['BBCA', 'BBRI', 'BMRI', 'TLKM', 'ASII', 'AMMN', 'BREN', 'GOTO'];

const PERIOD_OPTIONS: { label: string; value: MoverPeriod }[] = [
  { label: '1D', value: '1d' },
  { label: '7D', value: '7d' },
  { label: '14D', value: '14d' },
  { label: '30D', value: '30d' },
  { label: '1Y', value: '365d' },
];

/**
 * Market intelligence page.
 * Layout: one dominant left alignment, 8px spacing rhythm, 0.25rem radii.
 * Accent is reserved for the single primary CTA per view. Gainers/losers use
 * the permitted semantic success/danger colors, always paired with a label or
 * icon so color is never the sole signal.
 */
export const MarketPage: React.FC = () => {
  const navigate = useNavigate();
  const [tickerQuery, setTickerQuery] = useState('');
  const [indexTab, setIndexTab] = useState<'all' | 'sectors' | 'benchmarks'>('all');
  const [quickTickerInput, setQuickTickerInput] = useState('');

  const {
    overview,
    overviewLoading,
    overviewError,
    refetchOverview,

    gainers,
    losers,
    moversLoading,
    moversError,
    refetchMovers,
    period,
    setPeriod,

    impact,
    impactLoading,
    impactError,
    refetchImpact,

    refetchAll,
  } = useMarketData();

  const [isRefreshingAll, setIsRefreshingAll] = useState(false);

  const handleRefreshAll = async () => {
    setIsRefreshingAll(true);
    try {
      await refetchAll();
    } finally {
      setIsRefreshingAll(false);
    }
  };

  const handleNavigateInvestigation = (ticker: string) => {
    if (!ticker) return;
    navigate(`/investigations?ticker=${ticker.trim().toUpperCase()}`);
  };

  const latestMarketCapPoint = useMemo(() => {
    if (!overview?.market_cap_series || overview.market_cap_series.length === 0) {
      return null;
    }
    return overview.market_cap_series[overview.market_cap_series.length - 1];
  }, [overview]);

  const filteredGainers = useMemo(() => {
    if (!tickerQuery.trim()) return gainers;
    const q = tickerQuery.trim().toLowerCase();
    return gainers.filter(
      (item) =>
        item.ticker.toLowerCase().includes(q) ||
        item.company_name.toLowerCase().includes(q)
    );
  }, [gainers, tickerQuery]);

  const filteredLosers = useMemo(() => {
    if (!tickerQuery.trim()) return losers;
    const q = tickerQuery.trim().toLowerCase();
    return losers.filter(
      (item) =>
        item.ticker.toLowerCase().includes(q) ||
        item.company_name.toLowerCase().includes(q)
    );
  }, [losers, tickerQuery]);

  const filteredContributors = useMemo(() => {
    const list = impact?.top_contributors || [];
    if (!tickerQuery.trim()) return list;
    const q = tickerQuery.trim().toLowerCase();
    return list.filter(
      (item) =>
        item.ticker.toLowerCase().includes(q) ||
        item.company_name.toLowerCase().includes(q)
    );
  }, [impact, tickerQuery]);

  const filteredIndexSeries = useMemo(() => {
    const list = overview?.index_series || [];
    const q = tickerQuery.trim().toLowerCase();

    return list.filter((row) => {
      const matchesSearch = !q || row.index_code.toLowerCase().includes(q);
      if (!matchesSearch) return false;

      const isSector = row.index_code.toUpperCase().startsWith('IDX');
      if (indexTab === 'sectors') return isSector && row.index_code.toUpperCase() !== 'IDX30';
      if (indexTab === 'benchmarks') return !isSector || row.index_code.toUpperCase() === 'IDX30';
      return true;
    });
  }, [overview, tickerQuery, indexTab]);

  const isBusy = isRefreshingAll || overviewLoading || moversLoading || impactLoading;

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Page header */}
      <header className="flex flex-col gap-4 border-b border-border pb-6 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="font-heading text-3xl font-bold text-white">
              Market Intelligence
            </h1>
            <Badge variant="supporting">Live IDX</Badge>
            {overview?.end && (
              <Badge variant="secondary" className="hidden font-mono sm:inline-flex">
                <Calendar className="mr-1 h-3 w-3" aria-hidden="true" />
                Updated {formatDate(overview.end)}
              </Badge>
            )}
          </div>
          <p className="mt-2 max-w-2xl text-base text-secondary-foreground leading-relaxed">
            Deterministic Indonesian market analytics, benchmark impact, and real-time movers powered by Sectors Financial API.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Button
            variant="outline"
            onClick={handleRefreshAll}
            disabled={isBusy}
          >
            <RefreshCw
              className={`h-4 w-4 ${isBusy ? 'animate-spin' : ''}`}
              aria-hidden="true"
            />
            <span>Refresh</span>
          </Button>

          <Button
            variant="default"
            onClick={() => navigate('/investigations')}
          >
            <SearchCode className="h-4 w-4" aria-hidden="true" />
            <span>Launch Investigation</span>
          </Button>
        </div>
      </header>

      {/* Global filter */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" aria-hidden="true" />
          <Input
            value={tickerQuery}
            onChange={(e) => setTickerQuery(e.target.value)}
            placeholder="Filter gainers, losers, sectors, and contributors by ticker or company name"
            className="pl-9"
          />
        </div>
        {tickerQuery && (
          <Button
            variant="ghost"
            onClick={() => setTickerQuery('')}
          >
            Clear filter
          </Button>
        )}
      </div>

      {/* SECTION 1: Market summary */}
      <section className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <BarChart2 className="h-5 w-5 text-muted-foreground" aria-hidden="true" />
            <h2 className="font-heading text-2xl font-bold text-white">
              Indonesian Market Summary
            </h2>
          </div>
          {overview?.start && overview?.end && (
            <span className="font-mono text-sm text-muted-foreground">
              Window: {formatDate(overview.start)} — {formatDate(overview.end)}
            </span>
          )}
        </div>

        {overviewLoading ? (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </div>
        ) : overviewError ? (
          <ErrorDisplay
            title="Failed to load Indonesian market summary"
            message={overviewError}
            onRetry={refetchOverview}
          />
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {/* Total IDX market cap */}
            <Card>
              <CardHeader className="p-5 pb-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm text-muted-foreground">
                    Total IDX market cap
                  </span>
                  {overview?.market_cap_change?.percentage !== undefined &&
                  overview.market_cap_change.percentage !== null &&
                  overview.market_cap_change.percentage >= 0 ? (
                    <TrendingUp className="h-4 w-4 text-success" aria-hidden="true" />
                  ) : (
                    <TrendingDown className="h-4 w-4 text-danger" aria-hidden="true" />
                  )}
                </div>
                <CardTitle className="mt-1 font-mono text-2xl">
                  {latestMarketCapPoint
                    ? formatMarketCap(latestMarketCapPoint.idx_total_market_cap)
                    : '—'}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-5 pt-0 space-y-2">
                <div className="flex items-center gap-2">
                  {overview?.market_cap_change?.percentage !== undefined &&
                  overview.market_cap_change.percentage !== null ? (
                    <Badge
                      variant={
                        overview.market_cap_change.percentage >= 0
                          ? 'supporting'
                          : 'contradictory'
                      }
                      className="font-mono"
                    >
                      {formatPercent(overview.market_cap_change.percentage)}
                    </Badge>
                  ) : (
                    <span className="text-sm text-muted-foreground">—</span>
                  )}
                  {overview?.market_cap_change?.absolute !== undefined &&
                    overview.market_cap_change.absolute !== null && (
                      <span className="font-mono text-sm text-secondary-foreground">
                        ({formatMarketCap(overview.market_cap_change.absolute)})
                      </span>
                    )}
                </div>
                <p className="text-sm text-muted-foreground">
                  {latestMarketCapPoint
                    ? `Latest trading close as of ${formatDate(latestMarketCapPoint.date)}`
                    : 'Comprehensive IDX universe valuation'}
                </p>
              </CardContent>
            </Card>

            {/* Benchmark index impact */}
            <Card>
              <CardHeader className="p-5 pb-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm text-muted-foreground">
                    Benchmark index ({impact?.index_code || 'IHSG'})
                  </span>
                  <Badge variant="secondary" className="font-mono">
                    {impact?.weight_source || 'Cap Weighted'}
                  </Badge>
                </div>
                <CardTitle className="mt-1 font-mono text-2xl">
                  {impact?.index_return !== null && impact?.index_return !== undefined ? (
                    <span
                      className={
                        impact.index_return >= 0 ? 'text-success' : 'text-danger'
                      }
                    >
                      {formatPercent(impact.index_return)}
                    </span>
                  ) : (
                    '—'
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-5 pt-0 space-y-2">
                <div className="flex items-center justify-between text-sm text-secondary-foreground">
                  <span>Market return</span>
                  <span className="font-mono text-white">
                    {formatPercent(impact?.market_return)}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm text-secondary-foreground">
                  <span>Relative performance</span>
                  <span
                    className={`font-mono ${
                      (impact?.relative_performance ?? 0) >= 0
                        ? 'text-success'
                        : 'text-danger'
                    }`}
                  >
                    {formatPercent(impact?.relative_performance)}
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Market breadth */}
            <Card>
              <CardHeader className="p-5 pb-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm text-muted-foreground">
                    Active market breadth
                  </span>
                  <Badge variant="secondary" className="font-mono">
                    {period.toUpperCase()} window
                  </Badge>
                </div>
                <CardTitle className="mt-1 font-mono text-2xl">
                  {gainers.length + losers.length}{' '}
                  <span className="text-base font-normal text-secondary-foreground">
                    ranked movers
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-5 pt-0 space-y-2">
                <div className="flex items-center gap-4 text-sm">
                  <span className="flex items-center gap-2 text-secondary-foreground">
                    <TrendingUp className="h-4 w-4 text-success" aria-hidden="true" />
                    Gainers
                    <span className="font-mono text-success">{gainers.length}</span>
                  </span>
                  <span className="flex items-center gap-2 text-secondary-foreground">
                    <TrendingDown className="h-4 w-4 text-danger" aria-hidden="true" />
                    Losers
                    <span className="font-mono text-danger">{losers.length}</span>
                  </span>
                </div>
                <p className="text-sm text-muted-foreground">
                  Calculated deterministically via Sectors API top changes universe.
                </p>
              </CardContent>
            </Card>
          </div>
        )}
      </section>

      {/* SECTION 2: Sector & index performance */}
      <section className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <Layers className="h-5 w-5 text-muted-foreground" aria-hidden="true" />
            <h2 className="font-heading text-2xl font-bold text-white">
              Sector &amp; Index Performance
            </h2>
            {overview?.index_series && (
              <Badge variant="secondary" className="font-mono">
                {filteredIndexSeries.length} indices
              </Badge>
            )}
          </div>

          {/* Filter tabs */}
          <div className="inline-flex rounded-[0.25rem] border border-border bg-secondary p-1">
            {(
              [
                { label: 'All Indices', value: 'all' },
                { label: 'Sectors', value: 'sectors' },
                { label: 'Benchmarks', value: 'benchmarks' },
              ] as const
            ).map((tab) => (
              <button
                key={tab.value}
                type="button"
                onClick={() => setIndexTab(tab.value)}
                aria-pressed={indexTab === tab.value}
                className={`rounded-[0.25rem] px-3 py-2 text-sm font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent ${
                  indexTab === tab.value
                    ? 'bg-surface-hover text-white'
                    : 'text-muted-foreground hover:text-white'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {overviewLoading ? (
          <Card className="p-4">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="space-y-2 rounded-[0.25rem] border border-border bg-primary p-3">
                  <Skeleton className="h-4 w-16" />
                  <Skeleton className="h-6 w-24" />
                  <Skeleton className="h-3 w-12" />
                </div>
              ))}
            </div>
          </Card>
        ) : overviewError ? (
          <ErrorDisplay
            title="Failed to load sector performance"
            message={overviewError}
            onRetry={refetchOverview}
          />
        ) : filteredIndexSeries.length === 0 ? (
          <EmptyState
            title="No indices found"
            description={
              tickerQuery
                ? `No indices matching "${tickerQuery}". Try clearing the search query.`
                : 'No index performance data available for the current timeframe.'
            }
          />
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
            {filteredIndexSeries.map((item) => (
              <div
                key={item.index_code}
                className="flex flex-col justify-between rounded-[0.25rem] border border-border bg-surface-card p-4 transition-colors hover:border-accent"
              >
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-heading text-sm font-bold text-white">
                      {item.index_code}
                    </span>
                    <Badge variant="secondary" className="font-mono">
                      {item.index_code.startsWith('IDX') && item.index_code !== 'IDX30'
                        ? 'Sector'
                        : 'Index'}
                    </Badge>
                  </div>
                  <div className="mt-2 font-mono text-base font-bold text-white">
                    {item.price.toLocaleString('id-ID', {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </div>
                </div>
                <div className="mt-2 font-mono text-xs text-muted-foreground">
                  {formatDate(item.date)}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* SECTION 3 & 4: Top gainers & top losers */}
      <section className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="h-5 w-5 text-muted-foreground" aria-hidden="true" />
            <h2 className="font-heading text-2xl font-bold text-white">
              Market Movers
            </h2>
            <span className="hidden text-sm text-muted-foreground sm:inline">
              Top abnormal price movements across the IDX universe
            </span>
          </div>

          {/* Period selector */}
          <div className="inline-flex rounded-[0.25rem] border border-border bg-secondary p-1">
            {PERIOD_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setPeriod(opt.value)}
                disabled={moversLoading}
                aria-pressed={period === opt.value}
                className={`rounded-[0.25rem] px-3 py-2 text-sm font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:opacity-50 ${
                  period === opt.value
                    ? 'bg-surface-hover text-white'
                    : 'text-muted-foreground hover:text-white'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {moversError ? (
          <ErrorDisplay
            title="Failed to load market movers"
            message={moversError}
            onRetry={refetchMovers}
          />
        ) : (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* Top gainers */}
            <Card className="flex flex-col">
              <CardHeader className="border-b border-border p-4">
                <div className="flex items-center justify-between gap-2">
                  <CardTitle className="flex items-center gap-2 text-xl">
                    <TrendingUp className="h-5 w-5 text-success" aria-hidden="true" />
                    Top Gainers
                  </CardTitle>
                  <Badge variant="supporting" className="font-mono">
                    {filteredGainers.length} stocks
                  </Badge>
                </div>
                <CardDescription>
                  Highest relative price increases in the {period.toUpperCase()} window
                </CardDescription>
              </CardHeader>
              <CardContent className="flex-1 overflow-x-auto p-0">
                {moversLoading ? (
                  <table className="w-full text-left text-sm">
                    <tbody>
                      {Array.from({ length: 5 }).map((_, i) => (
                        <SkeletonTableRow key={i} columns={5} />
                      ))}
                    </tbody>
                  </table>
                ) : filteredGainers.length === 0 ? (
                  <div className="p-6">
                    <EmptyState
                      title="No gainers found"
                      description={
                        tickerQuery
                          ? `No gainers matching "${tickerQuery}".`
                          : 'No gainer data returned for this period.'
                      }
                    />
                  </div>
                ) : (
                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr className="border-b border-border bg-secondary text-xs font-bold text-muted-foreground">
                        <th className="py-3 pl-4 pr-2">Ticker</th>
                        <th className="py-3 px-2">Company</th>
                        <th className="py-3 px-2 text-right">Price</th>
                        <th className="py-3 px-2 text-right">Change</th>
                        <th className="py-3 pl-2 pr-4 text-center">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border font-mono text-sm">
                      {filteredGainers.map((stock) => (
                        <tr
                          key={stock.ticker}
                          className="transition-colors hover:bg-surface-hover"
                        >
                          <td className="py-3 pl-4 pr-2 font-bold text-white">
                            {stock.ticker}
                          </td>
                          <td className="max-w-[130px] truncate px-2 font-sans text-secondary-foreground sm:max-w-[180px]">
                            {stock.company_name}
                          </td>
                          <td className="px-2 py-3 text-right text-white">
                            {formatCurrency(stock.last_close_price)}
                          </td>
                          <td className="px-2 py-3 text-right font-bold text-success">
                            {formatPercent(stock.price_change)}
                          </td>
                          <td className="py-3 pl-2 pr-4 text-center font-sans">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleNavigateInvestigation(stock.ticker)}
                              className="px-2"
                            >
                              <span>Investigate</span>
                              <ArrowUpRight className="h-3 w-3" aria-hidden="true" />
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </CardContent>
            </Card>

            {/* Top losers */}
            <Card className="flex flex-col">
              <CardHeader className="border-b border-border p-4">
                <div className="flex items-center justify-between gap-2">
                  <CardTitle className="flex items-center gap-2 text-xl">
                    <TrendingDown className="h-5 w-5 text-danger" aria-hidden="true" />
                    Top Losers
                  </CardTitle>
                  <Badge variant="contradictory" className="font-mono">
                    {filteredLosers.length} stocks
                  </Badge>
                </div>
                <CardDescription>
                  Steepest price declines in the {period.toUpperCase()} window
                </CardDescription>
              </CardHeader>
              <CardContent className="flex-1 overflow-x-auto p-0">
                {moversLoading ? (
                  <table className="w-full text-left text-sm">
                    <tbody>
                      {Array.from({ length: 5 }).map((_, i) => (
                        <SkeletonTableRow key={i} columns={5} />
                      ))}
                    </tbody>
                  </table>
                ) : filteredLosers.length === 0 ? (
                  <div className="p-6">
                    <EmptyState
                      title="No losers found"
                      description={
                        tickerQuery
                          ? `No losers matching "${tickerQuery}".`
                          : 'No loser data returned for this period.'
                      }
                    />
                  </div>
                ) : (
                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr className="border-b border-border bg-secondary text-xs font-bold text-muted-foreground">
                        <th className="py-3 pl-4 pr-2">Ticker</th>
                        <th className="py-3 px-2">Company</th>
                        <th className="py-3 px-2 text-right">Price</th>
                        <th className="py-3 px-2 text-right">Change</th>
                        <th className="py-3 pl-2 pr-4 text-center">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border font-mono text-sm">
                      {filteredLosers.map((stock) => (
                        <tr
                          key={stock.ticker}
                          className="transition-colors hover:bg-surface-hover"
                        >
                          <td className="py-3 pl-4 pr-2 font-bold text-white">
                            {stock.ticker}
                          </td>
                          <td className="max-w-[130px] truncate px-2 font-sans text-secondary-foreground sm:max-w-[180px]">
                            {stock.company_name}
                          </td>
                          <td className="px-2 py-3 text-right text-white">
                            {formatCurrency(stock.last_close_price)}
                          </td>
                          <td className="px-2 py-3 text-right font-bold text-danger">
                            {formatPercent(stock.price_change)}
                          </td>
                          <td className="py-3 pl-2 pr-4 text-center font-sans">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleNavigateInvestigation(stock.ticker)}
                              className="px-2"
                            >
                              <span>Investigate</span>
                              <ArrowUpRight className="h-3 w-3" aria-hidden="true" />
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </section>

      {/* SECTION 5: Estimated market contributors */}
      <section className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-muted-foreground" aria-hidden="true" />
              <h2 className="font-heading text-2xl font-bold text-white">
                Estimated Market Contributors
              </h2>
              {impact?.index_code && (
                <Badge variant="secondary" className="font-mono">
                  Index: {impact.index_code}
                </Badge>
              )}
            </div>
            <p className="mt-2 text-sm text-secondary-foreground">
              Deterministic index movement drivers calculated from market cap weights and price changes.
            </p>
          </div>

          {impact?.weight_source && (
            <Badge variant="outline" className="self-start font-mono sm:self-auto">
              Source: {impact.weight_source}
            </Badge>
          )}
        </div>

        {impactLoading ? (
          <Card className="p-4">
            <table className="w-full text-left text-sm">
              <tbody>
                {Array.from({ length: 5 }).map((_, i) => (
                  <SkeletonTableRow key={i} columns={7} />
                ))}
              </tbody>
            </table>
          </Card>
        ) : impactError ? (
          <ErrorDisplay
            title="Failed to load market contributors"
            message={impactError}
            onRetry={refetchImpact}
          />
        ) : filteredContributors.length === 0 ? (
          <EmptyState
            title="No contributors found"
            description={
              tickerQuery
                ? `No stock contributors matching "${tickerQuery}".`
                : 'No estimated market contributor data available.'
            }
          />
        ) : (
          <Card className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-border bg-secondary text-xs font-bold text-muted-foreground">
                    <th className="py-3 pl-4 pr-2">Rank</th>
                    <th className="py-3 px-2">Ticker</th>
                    <th className="py-3 px-2">Company Name</th>
                    <th className="py-3 px-2 text-right">Price Change</th>
                    <th className="py-3 px-2 text-right">Market Cap</th>
                    <th className="py-3 px-2 text-right">Weight</th>
                    <th className="py-3 px-2 text-right">Contribution</th>
                    <th className="py-3 pl-2 pr-4 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border font-mono text-sm">
                  {filteredContributors.map((c, idx) => (
                    <tr
                      key={c.ticker}
                      className="transition-colors hover:bg-surface-hover"
                    >
                      <td className="py-3 pl-4 pr-2 font-sans text-muted-foreground">
                        #{idx + 1}
                      </td>
                      <td className="px-2 py-3 font-bold text-white">
                        {c.ticker}
                      </td>
                      <td className="max-w-[150px] truncate px-2 font-sans text-secondary-foreground sm:max-w-[220px]">
                        {c.company_name}
                      </td>
                      <td
                        className={`px-2 py-3 text-right font-bold ${
                          c.price_change >= 0 ? 'text-success' : 'text-danger'
                        }`}
                      >
                        {formatPercent(c.price_change)}
                      </td>
                      <td className="px-2 py-3 text-right text-white">
                        {formatMarketCap(c.market_cap)}
                      </td>
                      <td className="px-2 py-3 text-right text-secondary-foreground">
                        {formatWeight(c.estimated_weight)}
                      </td>
                      <td
                        className={`px-2 py-3 text-right font-bold ${
                          c.estimated_contribution >= 0
                            ? 'text-success'
                            : 'text-danger'
                        }`}
                      >
                        {formatContribution(c.estimated_contribution)}
                      </td>
                      <td className="py-3 pl-2 pr-4 text-center font-sans">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleNavigateInvestigation(c.ticker)}
                          className="px-2.5"
                        >
                          <span>Investigate</span>
                          <ArrowUpRight className="h-3 w-3" aria-hidden="true" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}
      </section>

      {/* SECTION 6: Quick stock investigation */}
      <section>
        <div className="rounded-[0.25rem] border border-border bg-surface-card p-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[0.25rem] bg-accent text-white">
              <Sparkles className="h-5 w-5" aria-hidden="true" />
            </div>
            <div>
              <h2 className="font-heading text-xl font-bold text-white">
                Quick Stock Investigation
              </h2>
              <p className="text-sm text-muted-foreground">
                Launch deterministic AI driver analysis and multi-source evidence verification for any IDX stock.
              </p>
            </div>
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleNavigateInvestigation(quickTickerInput);
            }}
            className="mt-6 flex flex-col items-stretch gap-3 sm:flex-row sm:items-center"
          >
            <div className="relative flex-1">
              <SearchCode className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" aria-hidden="true" />
              <Input
                value={quickTickerInput}
                onChange={(e) => setQuickTickerInput(e.target.value.toUpperCase())}
                placeholder="Enter IDX ticker (e.g. BBCA, BBRI, TLKM)"
                maxLength={6}
                className="pl-9 uppercase font-mono font-bold"
              />
            </div>
            <Button
              type="submit"
              variant="default"
              disabled={!quickTickerInput.trim()}
              className="shrink-0"
            >
              <span>Investigate Ticker</span>
              <ChevronRight className="h-4 w-4" aria-hidden="true" />
            </Button>
          </form>

          <div className="mt-6 flex flex-wrap items-center gap-2 border-t border-border pt-4">
            <span className="mr-1 text-sm text-muted-foreground">
              Popular tickers:
            </span>
            {POPULAR_TICKERS.map((ticker) => (
              <button
                key={ticker}
                type="button"
                onClick={() => handleNavigateInvestigation(ticker)}
                className="inline-flex items-center gap-1 rounded-[0.25rem] border border-border bg-secondary px-3 py-1.5 font-mono text-sm font-bold text-secondary-foreground transition-colors hover:border-accent hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
              >
                {ticker}
                <ArrowUpRight className="h-3 w-3" aria-hidden="true" />
              </button>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default MarketPage;
