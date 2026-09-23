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

  // Derive latest market cap point and price change
  const latestMarketCapPoint = useMemo(() => {
    if (!overview?.market_cap_series || overview.market_cap_series.length === 0) {
      return null;
    }
    return overview.market_cap_series[overview.market_cap_series.length - 1];
  }, [overview]);

  // Filter gainers by search query
  const filteredGainers = useMemo(() => {
    if (!tickerQuery.trim()) return gainers;
    const q = tickerQuery.trim().toLowerCase();
    return gainers.filter(
      (item) =>
        item.ticker.toLowerCase().includes(q) ||
        item.company_name.toLowerCase().includes(q)
    );
  }, [gainers, tickerQuery]);

  // Filter losers by search query
  const filteredLosers = useMemo(() => {
    if (!tickerQuery.trim()) return losers;
    const q = tickerQuery.trim().toLowerCase();
    return losers.filter(
      (item) =>
        item.ticker.toLowerCase().includes(q) ||
        item.company_name.toLowerCase().includes(q)
    );
  }, [losers, tickerQuery]);

  // Filter contributors by search query
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

  // Filter and classify index / sector series
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

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Page Header */}
      <div className="flex flex-col gap-4 border-b border-border pb-6 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="font-heading text-2xl font-bold tracking-tight text-white sm:text-3xl">
              Market Intelligence
            </h1>
            <Badge variant="supporting" className="text-xs">
              Live IDX
            </Badge>
            {overview?.end && (
              <Badge variant="secondary" className="hidden sm:inline-flex text-xs font-mono">
                <Calendar className="mr-1 h-3 w-3" />
                Updated {formatDate(overview.end)}
              </Badge>
            )}
          </div>
          <p className="mt-1.5 text-sm text-secondary-foreground leading-relaxed max-w-2xl">
            Deterministic Indonesian market analytics, benchmark impact, and real-time movers powered by Sectors Financial API.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefreshAll}
            disabled={isRefreshingAll || overviewLoading || moversLoading || impactLoading}
            className="border-border hover:bg-surface-hover text-secondary-foreground"
          >
            <RefreshCw
              className={`mr-1.5 h-3.5 w-3.5 ${
                isRefreshingAll || overviewLoading || moversLoading || impactLoading
                  ? 'animate-spin text-accent'
                  : ''
              }`}
            />
            <span>Refresh</span>
          </Button>

          <Button
            variant="default"
            size="sm"
            onClick={() => navigate('/investigations')}
            className="shadow-sm shadow-accent/25"
          >
            <SearchCode className="mr-1.5 h-4 w-4" />
            <span>Launch Investigation</span>
          </Button>
        </div>
      </div>

      {/* Global Ticker Filter Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 bg-surface/60 p-3 rounded-xl border border-border/70">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-secondary-foreground/60" />
          <Input
            value={tickerQuery}
            onChange={(e) => setTickerQuery(e.target.value)}
            placeholder="Filter gainers, losers, sectors, and contributors by ticker or company name..."
            className="pl-9 bg-secondary/80 border-border text-sm placeholder:text-secondary-foreground/50 focus:border-accent"
          />
        </div>
        {tickerQuery && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setTickerQuery('')}
            className="text-xs text-secondary-foreground hover:text-white"
          >
            Clear Filter
          </Button>
        )}
      </div>

      {/* SECTION 1: Indonesian Market Summary */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BarChart2 className="h-5 w-5 text-accent" />
            <h2 className="font-heading text-lg font-semibold text-white">
              Indonesian Market Summary
            </h2>
          </div>
          {overview?.start && overview?.end && (
            <span className="text-xs text-secondary-foreground/70 font-mono">
              Window: {formatDate(overview.start)} — {formatDate(overview.end)}
            </span>
          )}
        </div>

        {overviewLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Total IDX Market Cap */}
            <Card className="bg-surface-card border-border/80 relative overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-accent via-accent/80 to-transparent" />
              <CardHeader className="p-5 pb-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase tracking-wider text-secondary-foreground/80">
                    Total IDX Market Cap
                  </span>
                  {overview?.market_cap_change?.percentage !== undefined &&
                  overview.market_cap_change.percentage !== null &&
                  overview.market_cap_change.percentage >= 0 ? (
                    <TrendingUp className="h-4 w-4 text-emerald-400" />
                  ) : (
                    <TrendingDown className="h-4 w-4 text-rose-400" />
                  )}
                </div>
                <CardTitle className="text-2xl font-bold font-mono tracking-tight text-white mt-1">
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
                      className="text-xs font-mono font-bold"
                    >
                      {formatPercent(overview.market_cap_change.percentage)}
                    </Badge>
                  ) : (
                    <span className="text-xs text-secondary-foreground/60">—</span>
                  )}
                  {overview?.market_cap_change?.absolute !== undefined &&
                    overview.market_cap_change.absolute !== null && (
                      <span className="text-xs text-secondary-foreground font-mono">
                        ({formatMarketCap(overview.market_cap_change.absolute)})
                      </span>
                    )}
                </div>
                <p className="text-xs text-secondary-foreground/70">
                  {latestMarketCapPoint
                    ? `Latest trading close as of ${formatDate(latestMarketCapPoint.date)}`
                    : 'Comprehensive IDX universe valuation'}
                </p>
              </CardContent>
            </Card>

            {/* Benchmark Index Impact */}
            <Card className="bg-surface-card border-border/80 relative overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-cyan-500 via-cyan-600/70 to-transparent" />
              <CardHeader className="p-5 pb-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase tracking-wider text-secondary-foreground/80">
                    Benchmark Index ({impact?.index_code || 'IHSG'})
                  </span>
                  <Badge variant="info" className="text-[10px] uppercase font-mono">
                    {impact?.weight_source || 'Cap Weighted'}
                  </Badge>
                </div>
                <CardTitle className="text-2xl font-bold font-mono tracking-tight text-white mt-1">
                  {impact?.index_return !== null && impact?.index_return !== undefined ? (
                    <span
                      className={
                        impact.index_return >= 0 ? 'text-emerald-400' : 'text-rose-400'
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
                <div className="flex items-center justify-between text-xs text-secondary-foreground">
                  <span>Market Return:</span>
                  <span className="font-mono font-medium text-white">
                    {formatPercent(impact?.market_return)}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs text-secondary-foreground">
                  <span>Relative Performance:</span>
                  <span
                    className={`font-mono font-medium ${
                      (impact?.relative_performance ?? 0) >= 0
                        ? 'text-emerald-400'
                        : 'text-rose-400'
                    }`}
                  >
                    {formatPercent(impact?.relative_performance)}
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Market Breadth & Movers Status */}
            <Card className="bg-surface-card border-border/80 relative overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 via-emerald-600/70 to-transparent" />
              <CardHeader className="p-5 pb-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase tracking-wider text-secondary-foreground/80">
                    Active Market Breadth
                  </span>
                  <Badge variant="outline" className="text-xs font-mono">
                    {period.toUpperCase()} Window
                  </Badge>
                </div>
                <CardTitle className="text-2xl font-bold font-mono tracking-tight text-white mt-1">
                  {gainers.length + losers.length}{' '}
                  <span className="text-sm font-normal text-secondary-foreground">
                    Ranked Movers
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-5 pt-0 space-y-2">
                <div className="flex items-center gap-3 text-xs">
                  <div className="flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-emerald-400" />
                    <span className="text-secondary-foreground">Top Gainers:</span>
                    <span className="font-mono font-bold text-emerald-400">
                      {gainers.length}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-rose-400" />
                    <span className="text-secondary-foreground">Top Losers:</span>
                    <span className="font-mono font-bold text-rose-400">
                      {losers.length}
                    </span>
                  </div>
                </div>
                <p className="text-xs text-secondary-foreground/70">
                  Calculated deterministically via Sectors API top changes universe.
                </p>
              </CardContent>
            </Card>
          </div>
        )}
      </section>

      {/* SECTION 2: Sector & Index Performance */}
      <section className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-2">
            <Layers className="h-5 w-5 text-accent" />
            <h2 className="font-heading text-lg font-semibold text-white">
              Sector & Index Performance
            </h2>
            {overview?.index_series && (
              <Badge variant="outline" className="text-xs font-mono">
                {filteredIndexSeries.length} Indices
              </Badge>
            )}
          </div>

          {/* Filter Tabs */}
          <div className="inline-flex rounded-lg bg-secondary p-1 border border-border">
            <button
              type="button"
              onClick={() => setIndexTab('all')}
              className={`rounded-md px-3 py-1 text-xs font-medium transition-colors ${
                indexTab === 'all'
                  ? 'bg-accent text-white shadow-sm'
                  : 'text-secondary-foreground hover:text-white'
              }`}
            >
              All Indices
            </button>
            <button
              type="button"
              onClick={() => setIndexTab('sectors')}
              className={`rounded-md px-3 py-1 text-xs font-medium transition-colors ${
                indexTab === 'sectors'
                  ? 'bg-accent text-white shadow-sm'
                  : 'text-secondary-foreground hover:text-white'
              }`}
            >
              Sectors
            </button>
            <button
              type="button"
              onClick={() => setIndexTab('benchmarks')}
              className={`rounded-md px-3 py-1 text-xs font-medium transition-colors ${
                indexTab === 'benchmarks'
                  ? 'bg-accent text-white shadow-sm'
                  : 'text-secondary-foreground hover:text-white'
              }`}
            >
              Benchmarks
            </button>
          </div>
        </div>

        {overviewLoading ? (
          <Card className="bg-surface-card border-border/80 p-4">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="p-3 rounded-lg bg-surface space-y-2 border border-border/50">
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
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {filteredIndexSeries.map((item) => (
              <div
                key={item.index_code}
                className="group relative flex flex-col justify-between rounded-xl border border-border/70 bg-surface-card p-3.5 hover:border-accent/50 hover:bg-surface-hover/80 transition-all"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="font-heading font-bold text-sm tracking-wide text-white group-hover:text-accent transition-colors">
                      {item.index_code}
                    </span>
                    <Badge
                      variant={
                        item.index_code.startsWith('IDX') && item.index_code !== 'IDX30'
                          ? 'outline'
                          : 'info'
                      }
                      className="text-[9px] px-1.5 py-0 font-mono"
                    >
                      {item.index_code.startsWith('IDX') && item.index_code !== 'IDX30'
                        ? 'Sector'
                        : 'Index'}
                    </Badge>
                  </div>
                  <div className="mt-2.5 font-mono text-base font-semibold text-white">
                    {item.price.toLocaleString('id-ID', {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </div>
                </div>
                <div className="mt-2 text-[10px] text-secondary-foreground/60 font-mono">
                  {formatDate(item.date)}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* SECTIONS 3 & 4: Top Gainers & Top Losers */}
      <section className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="h-5 w-5 text-accent" />
            <h2 className="font-heading text-lg font-semibold text-white">
              Market Movers
            </h2>
            <span className="text-xs text-secondary-foreground/70 hidden sm:inline">
              Top abnormal price movements across IDX universe
            </span>
          </div>

          {/* Period Selector Tabs */}
          <div className="inline-flex rounded-lg bg-secondary p-1 border border-border">
            {PERIOD_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setPeriod(opt.value)}
                disabled={moversLoading}
                className={`rounded-md px-3 py-1 text-xs font-medium transition-colors ${
                  period === opt.value
                    ? 'bg-accent text-white shadow-sm font-semibold'
                    : 'text-secondary-foreground hover:text-white'
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
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Top Gainers Table */}
            <Card className="bg-surface-card border-border/80 flex flex-col">
              <CardHeader className="p-4 border-b border-border/60">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-400 ring-4 ring-emerald-950/40" />
                    <CardTitle className="text-base font-semibold text-emerald-300">
                      Top Gainers
                    </CardTitle>
                  </div>
                  <Badge variant="supporting" className="text-xs font-mono">
                    {filteredGainers.length} Stocks
                  </Badge>
                </div>
                <CardDescription className="text-xs text-secondary-foreground/70">
                  Highest relative price increases in the {period.toUpperCase()} window
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0 flex-1 overflow-x-auto">
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
                      <tr className="border-b border-border/60 bg-secondary/40 text-[11px] font-semibold uppercase tracking-wider text-secondary-foreground/80">
                        <th className="py-2.5 pl-4 pr-2">Ticker</th>
                        <th className="py-2.5 px-2">Company</th>
                        <th className="py-2.5 px-2 text-right">Price</th>
                        <th className="py-2.5 px-2 text-right">Change</th>
                        <th className="py-2.5 pl-2 pr-4 text-center">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/40 font-mono text-xs">
                      {filteredGainers.map((stock) => (
                        <tr
                          key={stock.ticker}
                          className="hover:bg-surface-hover/60 transition-colors group"
                        >
                          <td className="py-3 pl-4 pr-2 font-bold text-white group-hover:text-accent transition-colors">
                            {stock.ticker}
                          </td>
                          <td className="py-3 px-2 font-sans text-secondary-foreground truncate max-w-[130px] sm:max-w-[180px]">
                            {stock.company_name}
                          </td>
                          <td className="py-3 px-2 text-right text-white">
                            {formatCurrency(stock.last_close_price)}
                          </td>
                          <td className="py-3 px-2 text-right font-bold text-emerald-400">
                            {formatPercent(stock.price_change)}
                          </td>
                          <td className="py-3 pl-2 pr-4 text-center font-sans">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleNavigateInvestigation(stock.ticker)}
                              className="h-7 text-xs border-border/80 hover:border-accent hover:text-accent hover:bg-accent/10 px-2"
                            >
                              <span>Investigate</span>
                              <ArrowUpRight className="ml-1 h-3 w-3" />
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </CardContent>
            </Card>

            {/* Top Losers Table */}
            <Card className="bg-surface-card border-border/80 flex flex-col">
              <CardHeader className="p-4 border-b border-border/60">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="flex h-2.5 w-2.5 rounded-full bg-rose-400 ring-4 ring-rose-950/40" />
                    <CardTitle className="text-base font-semibold text-rose-300">
                      Top Losers
                    </CardTitle>
                  </div>
                  <Badge variant="contradictory" className="text-xs font-mono">
                    {filteredLosers.length} Stocks
                  </Badge>
                </div>
                <CardDescription className="text-xs text-secondary-foreground/70">
                  Steepest price declines in the {period.toUpperCase()} window
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0 flex-1 overflow-x-auto">
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
                      <tr className="border-b border-border/60 bg-secondary/40 text-[11px] font-semibold uppercase tracking-wider text-secondary-foreground/80">
                        <th className="py-2.5 pl-4 pr-2">Ticker</th>
                        <th className="py-2.5 px-2">Company</th>
                        <th className="py-2.5 px-2 text-right">Price</th>
                        <th className="py-2.5 px-2 text-right">Change</th>
                        <th className="py-2.5 pl-2 pr-4 text-center">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/40 font-mono text-xs">
                      {filteredLosers.map((stock) => (
                        <tr
                          key={stock.ticker}
                          className="hover:bg-surface-hover/60 transition-colors group"
                        >
                          <td className="py-3 pl-4 pr-2 font-bold text-white group-hover:text-accent transition-colors">
                            {stock.ticker}
                          </td>
                          <td className="py-3 px-2 font-sans text-secondary-foreground truncate max-w-[130px] sm:max-w-[180px]">
                            {stock.company_name}
                          </td>
                          <td className="py-3 px-2 text-right text-white">
                            {formatCurrency(stock.last_close_price)}
                          </td>
                          <td className="py-3 px-2 text-right font-bold text-rose-400">
                            {formatPercent(stock.price_change)}
                          </td>
                          <td className="py-3 pl-2 pr-4 text-center font-sans">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleNavigateInvestigation(stock.ticker)}
                              className="h-7 text-xs border-border/80 hover:border-accent hover:text-accent hover:bg-accent/10 px-2"
                            >
                              <span>Investigate</span>
                              <ArrowUpRight className="ml-1 h-3 w-3" />
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

      {/* SECTION 5: Estimated Market Contributors */}
      <section className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-accent" />
              <h2 className="font-heading text-lg font-semibold text-white">
                Estimated Market Contributors
              </h2>
              {impact?.index_code && (
                <Badge variant="info" className="text-xs font-mono">
                  Index: {impact.index_code}
                </Badge>
              )}
            </div>
            <p className="mt-1 text-xs text-secondary-foreground">
              Deterministic index movement drivers calculated from market cap weights and price changes.
            </p>
          </div>

          {impact?.weight_source && (
            <Badge variant="outline" className="text-xs font-mono self-start sm:self-auto">
              Source: {impact.weight_source}
            </Badge>
          )}
        </div>

        {impactLoading ? (
          <Card className="bg-surface-card border-border/80 p-4">
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
          <Card className="bg-surface-card border-border/80 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-border/60 bg-secondary/50 text-[11px] font-semibold uppercase tracking-wider text-secondary-foreground/80">
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
                <tbody className="divide-y divide-border/40 font-mono text-xs">
                  {filteredContributors.map((c, idx) => (
                    <tr
                      key={c.ticker}
                      className="hover:bg-surface-hover/60 transition-colors group"
                    >
                      <td className="py-3 pl-4 pr-2 font-sans text-secondary-foreground/60">
                        #{idx + 1}
                      </td>
                      <td className="py-3 px-2 font-bold text-white group-hover:text-accent transition-colors">
                        {c.ticker}
                      </td>
                      <td className="py-3 px-2 font-sans text-secondary-foreground truncate max-w-[150px] sm:max-w-[220px]">
                        {c.company_name}
                      </td>
                      <td
                        className={`py-3 px-2 text-right font-bold ${
                          c.price_change >= 0 ? 'text-emerald-400' : 'text-rose-400'
                        }`}
                      >
                        {formatPercent(c.price_change)}
                      </td>
                      <td className="py-3 px-2 text-right text-white">
                        {formatMarketCap(c.market_cap)}
                      </td>
                      <td className="py-3 px-2 text-right text-secondary-foreground">
                        {formatWeight(c.estimated_weight)}
                      </td>
                      <td
                        className={`py-3 px-2 text-right font-bold ${
                          c.estimated_contribution >= 0
                            ? 'text-emerald-400'
                            : 'text-rose-400'
                        }`}
                      >
                        {formatContribution(c.estimated_contribution)}
                      </td>
                      <td className="py-3 pl-2 pr-4 text-center font-sans">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleNavigateInvestigation(c.ticker)}
                          className="h-7 text-xs border-border/80 hover:border-accent hover:text-accent hover:bg-accent/10 px-2.5"
                        >
                          <span>Investigate</span>
                          <ArrowUpRight className="ml-1 h-3 w-3" />
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

      {/* SECTION 6: Quick Stock Investigation */}
      <section>
        <Card className="border-accent/40 bg-gradient-to-br from-surface-card via-surface-card to-accent/5 overflow-hidden shadow-lg shadow-black/20">
          <CardHeader className="p-6 pb-3">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/20 border border-accent/40 text-accent">
                <Sparkles className="h-5 w-5" />
              </div>
              <div>
                <CardTitle className="text-lg font-bold text-white">
                  Quick Stock Investigation
                </CardTitle>
                <CardDescription className="text-xs text-secondary-foreground">
                  Launch deterministic AI driver analysis and multi-source evidence verification for any IDX stock.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6 pt-3 space-y-4">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleNavigateInvestigation(quickTickerInput);
              }}
              className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3"
            >
              <div className="relative flex-1">
                <SearchCode className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-secondary-foreground/60" />
                <Input
                  value={quickTickerInput}
                  onChange={(e) => setQuickTickerInput(e.target.value.toUpperCase())}
                  placeholder="Enter 4-letter IDX ticker (e.g. BBCA, BBRI, TLKM)..."
                  maxLength={6}
                  className="pl-10 uppercase font-mono font-bold tracking-wider bg-secondary/80 border-border focus:border-accent text-white"
                />
              </div>
              <Button
                type="submit"
                variant="default"
                disabled={!quickTickerInput.trim()}
                className="shadow-md shadow-accent/20 px-6 shrink-0"
              >
                <span>Investigate Ticker</span>
                <ChevronRight className="ml-1 h-4 w-4" />
              </Button>
            </form>

            {/* Quick-select chips for popular tickers */}
            <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-border/50">
              <span className="text-xs text-secondary-foreground/70 mr-1">
                Popular Tickers:
              </span>
              {POPULAR_TICKERS.map((ticker) => (
                <button
                  key={ticker}
                  type="button"
                  onClick={() => handleNavigateInvestigation(ticker)}
                  className="inline-flex items-center rounded-md border border-border-subtle bg-secondary/90 px-2.5 py-1 text-xs font-mono font-semibold text-secondary-foreground hover:border-accent hover:text-accent hover:bg-accent/10 transition-all"
                >
                  {ticker}
                  <ArrowUpRight className="ml-1 h-3 w-3 opacity-60" />
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  );
};

export default MarketPage;
