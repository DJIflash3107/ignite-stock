import { useState, useEffect, useCallback, useRef } from 'react';
import { apiGet } from '@/lib/api-client';
import { extractErrorMessage } from '@/lib/api-error';
import dayjs from '@/lib/dayjs';
import type {
  MarketOverview,
  MarketOverviewResponse,
  MarketMover,
  MarketMoversResponse,
  MarketImpact,
  MarketImpactResponse,
  MoverPeriod,
} from '@/models/market';

interface SectionState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

export interface MarketDateRange {
  /** Inclusive start date in YYYY-MM-DD. */
  start: string;
  /** Inclusive end date in YYYY-MM-DD. */
  end: string;
}

/** Default analysis window length in days. */
export const DEFAULT_RANGE_DAYS = 30;
/** Maximum analysis window length accepted by the backend. */
export const MAX_RANGE_DAYS = 90;

/** Default window: the last 30 days ending today (never in the future). */
export function defaultMarketDateRange(): MarketDateRange {
  const end = dayjs();
  return {
    start: end.subtract(DEFAULT_RANGE_DAYS, 'day').format('YYYY-MM-DD'),
    end: end.format('YYYY-MM-DD'),
  };
}

export function useMarketData() {
  const [period, setPeriod] = useState<MoverPeriod>('1d');
  const [dateRange, setDateRange] = useState<MarketDateRange>(defaultMarketDateRange);

  const [overviewState, setOverviewState] = useState<SectionState<MarketOverview>>({
    data: null,
    loading: true,
    error: null,
  });

  const [moversState, setMoversState] = useState<SectionState<MarketMover[]>>({
    data: null,
    loading: true,
    error: null,
  });

  const [impactState, setImpactState] = useState<SectionState<MarketImpact>>({
    data: null,
    loading: true,
    error: null,
  });

  // Track initial mount so period changes don't cause duplicate initial fetch
  const isInitialMount = useRef(true);

  const fetchOverview = useCallback(async () => {
    setOverviewState((prev) => ({ ...prev, loading: true, error: null }));
    try {
      const response = await apiGet<MarketOverviewResponse>('/market/overview', {
        params: {
          start: dateRange.start,
          end: dateRange.end,
        },
      });
      setOverviewState({
        data: response.data.market,
        loading: false,
        error: null,
      });
    } catch (err) {
      setOverviewState((prev) => ({
        ...prev,
        loading: false,
        error: extractErrorMessage(err),
      }));
    }
  }, [dateRange.start, dateRange.end]);

  const fetchMovers = useCallback(async (activePeriod: MoverPeriod) => {
    setMoversState((prev) => ({ ...prev, loading: true, error: null }));
    try {
      const response = await apiGet<MarketMoversResponse>('/market/movers', {
        params: {
          period: activePeriod,
          limit: 10,
        },
      });
      setMoversState({
        data: response.data.movers || [],
        loading: false,
        error: null,
      });
    } catch (err) {
      setMoversState((prev) => ({
        ...prev,
        loading: false,
        error: extractErrorMessage(err),
      }));
    }
  }, []);

  const fetchImpact = useCallback(async () => {
    setImpactState((prev) => ({ ...prev, loading: true, error: null }));
    try {
      const response = await apiGet<MarketImpactResponse>('/market/impact', {
        params: {
          start: dateRange.start,
          end: dateRange.end,
          limit: 10,
        },
      });
      setImpactState({
        data: response.data.impact,
        loading: false,
        error: null,
      });
    } catch (err) {
      setImpactState((prev) => ({
        ...prev,
        loading: false,
        error: extractErrorMessage(err),
      }));
    }
  }, [dateRange.start, dateRange.end]);

  // Initial load: fetch all in parallel with independent completion
  const fetchAll = useCallback(async () => {
    await Promise.allSettled([
      fetchOverview(),
      fetchMovers(period),
      fetchImpact(),
    ]);
  }, [fetchOverview, fetchMovers, fetchImpact, period]);

  // Initial load only: fetch every section once with the current window/period.
  useEffect(() => {
    fetchOverview();
    fetchMovers(period);
    fetchImpact();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // When period changes after initial mount, refetch movers only
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    fetchMovers(period);
  }, [period, fetchMovers]);

  // When the date range changes after initial mount, refetch the windowed sections.
  const isRangeInitialMount = useRef(true);
  useEffect(() => {
    if (isRangeInitialMount.current) {
      isRangeInitialMount.current = false;
      return;
    }
    fetchOverview();
    fetchImpact();
  }, [fetchOverview, fetchImpact]);

  // Derived gainers and losers from movers dataset
  const gainers = (moversState.data || []).filter(
    (item) => item.classification === 'top_gainers'
  );

  const losers = (moversState.data || []).filter(
    (item) => item.classification === 'top_losers'
  );

  return {
    overview: overviewState.data,
    overviewLoading: overviewState.loading,
    overviewError: overviewState.error,
    refetchOverview: fetchOverview,

    movers: moversState.data,
    gainers,
    losers,
    moversLoading: moversState.loading,
    moversError: moversState.error,
    refetchMovers: () => fetchMovers(period),
    period,
    setPeriod,

    dateRange,
    setDateRange,
    resetDateRange: () => setDateRange(defaultMarketDateRange()),

    impact: impactState.data,
    impactLoading: impactState.loading,
    impactError: impactState.error,
    refetchImpact: fetchImpact,

    refetchAll: fetchAll,
  };
}
