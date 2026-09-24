import { useCallback, useEffect, useRef, useState } from 'react';
import { apiGet } from '@/lib/api-client';
import { extractErrorMessage } from '@/lib/api-error';
import type {
  CompanyMarketContext,
  CompanyMarketContextResponse,
  InvestigationDetail,
  InvestigationDetailResponse,
  InvestigationDriver,
  InvestigationDriversResponse,
  EvidenceItem,
  InvestigationEvidenceResponse,
} from '@/models/investigation';
import type { CompanyImpact, CompanyImpactResponse } from '@/models/market';

interface SectionState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

function initialState<T>(loading: boolean): SectionState<T> {
  return { data: null, loading, error: null };
}

export interface UseInvestigationDetailResult {
  investigation: InvestigationDetail | null;
  investigationLoading: boolean;
  investigationError: string | null;
  refetchInvestigation: () => Promise<void>;

  drivers: InvestigationDriver[];
  driversLoading: boolean;
  driversError: string | null;
  refetchDrivers: () => Promise<void>;

  evidence: EvidenceItem[];
  evidenceLoading: boolean;
  evidenceError: string | null;
  refetchEvidence: () => Promise<void>;

  marketContext: CompanyMarketContext | null;
  marketContextLoading: boolean;
  marketContextError: string | null;
  refetchMarketContext: () => Promise<void>;

  impact: CompanyImpact | null;
  impactLoading: boolean;
  impactError: string | null;
  refetchImpact: () => Promise<void>;
}

/**
 * Loads a single investigation and its ticker-scoped market context / impact.
 *
 * Design rules:
 * - The investigation is fetched first; company endpoints only run once the
 *   real ticker is known, so a ticker is never fabricated.
 * - Every section keeps an independent loading/error state. A failed request
 *   never populates another section's data.
 * - Failed requests surface the real backend message; no mock/fallback data.
 */
export function useInvestigationDetail(
  investigationId: string | undefined
): UseInvestigationDetailResult {
  const [investigationState, setInvestigationState] = useState<
    SectionState<InvestigationDetail>
  >(initialState(true));

  const [driversState, setDriversState] = useState<SectionState<InvestigationDriver[]>>(
    initialState(true)
  );

  const [evidenceState, setEvidenceState] = useState<SectionState<EvidenceItem[]>>(
    initialState(true)
  );

  const [marketContextState, setMarketContextState] = useState<
    SectionState<CompanyMarketContext>
  >(initialState(false));

  const [impactState, setImpactState] = useState<SectionState<CompanyImpact>>(
    initialState(false)
  );

  // Abort in-flight company requests when the ticker/id changes or on unmount.
  const companyAbortRef = useRef<AbortController | null>(null);

  const fetchInvestigation = useCallback(async () => {
    if (!investigationId) return;
    setInvestigationState((prev) => ({ ...prev, loading: true, error: null }));
    try {
      const response = await apiGet<InvestigationDetailResponse>(
        `/investigations/${investigationId}`
      );
      const detail = response.data.investigation;
      setInvestigationState({ data: detail, loading: false, error: null });
      // Seed nested collections from the detail payload. They can still be
      // independently refetched from their dedicated endpoints.
      setDriversState({
        data: [...(detail.drivers ?? [])].sort((a, b) => a.rank - b.rank),
        loading: false,
        error: null,
      });
      setEvidenceState({ data: detail.evidence_items ?? [], loading: false, error: null });
    } catch (err) {
      setInvestigationState((prev) => ({
        ...prev,
        loading: false,
        error: extractErrorMessage(err),
      }));
    }
  }, [investigationId]);

  const refetchDrivers = useCallback(async () => {
    if (!investigationId) return;
    setDriversState((prev) => ({ ...prev, loading: true, error: null }));
    try {
      const response = await apiGet<InvestigationDriversResponse>(
        `/investigations/${investigationId}/drivers`,
        { params: { limit: 100, offset: 0 } }
      );
      setDriversState({
        data: [...response.data.drivers].sort((a, b) => a.rank - b.rank),
        loading: false,
        error: null,
      });
    } catch (err) {
      setDriversState((prev) => ({
        ...prev,
        loading: false,
        error: extractErrorMessage(err),
      }));
    }
  }, [investigationId]);

  const refetchEvidence = useCallback(async () => {
    if (!investigationId) return;
    setEvidenceState((prev) => ({ ...prev, loading: true, error: null }));
    try {
      const response = await apiGet<InvestigationEvidenceResponse>(
        `/investigations/${investigationId}/evidence`,
        { params: { limit: 100, offset: 0 } }
      );
      setEvidenceState({
        data: response.data.evidence,
        loading: false,
        error: null,
      });
    } catch (err) {
      setEvidenceState((prev) => ({
        ...prev,
        loading: false,
        error: extractErrorMessage(err),
      }));
    }
  }, [investigationId]);

  const fetchMarketContext = useCallback(
    async (ticker: string, signal: AbortSignal) => {
      setMarketContextState((prev) => ({ ...prev, loading: true, error: null }));
      try {
        const response = await apiGet<CompanyMarketContextResponse>(
          `/companies/${ticker}/market-context`,
          { params: { peer_limit: 10 }, signal }
        );
        if (signal.aborted) return;
        setMarketContextState({
          data: response.data.market_context,
          loading: false,
          error: null,
        });
      } catch (err) {
        if (signal.aborted) return;
        setMarketContextState((prev) => ({
          ...prev,
          loading: false,
          error: extractErrorMessage(err),
        }));
      }
    },
    []
  );

  const fetchImpact = useCallback(async (ticker: string, signal: AbortSignal) => {
    setImpactState((prev) => ({ ...prev, loading: true, error: null }));
    try {
      const response = await apiGet<CompanyImpactResponse>(`/companies/${ticker}/impact`, {
        signal,
      });
      if (signal.aborted) return;
      setImpactState({ data: response.data.impact, loading: false, error: null });
    } catch (err) {
      if (signal.aborted) return;
      setImpactState((prev) => ({
        ...prev,
        loading: false,
        error: extractErrorMessage(err),
      }));
    }
  }, []);

  // Load the investigation when the id changes.
  useEffect(() => {
    if (!investigationId) {
      setInvestigationState(initialState(false));
      setDriversState(initialState(false));
      setEvidenceState(initialState(false));
      return;
    }
    void fetchInvestigation();
  }, [investigationId, fetchInvestigation]);

  // Load ticker-scoped endpoints once the ticker is known.
  const ticker = investigationState.data?.company_ticker ?? null;
  useEffect(() => {
    companyAbortRef.current?.abort();
    if (!ticker) {
      setMarketContextState(initialState(false));
      setImpactState(initialState(false));
      return;
    }
    const controller = new AbortController();
    companyAbortRef.current = controller;
    void Promise.allSettled([
      fetchMarketContext(ticker, controller.signal),
      fetchImpact(ticker, controller.signal),
    ]);
    return () => controller.abort();
  }, [ticker, fetchMarketContext, fetchImpact]);

  const refetchMarketContext = useCallback(async () => {
    if (!ticker) return;
    const controller = new AbortController();
    await fetchMarketContext(ticker, controller.signal);
  }, [ticker, fetchMarketContext]);

  const refetchImpact = useCallback(async () => {
    if (!ticker) return;
    const controller = new AbortController();
    await fetchImpact(ticker, controller.signal);
  }, [ticker, fetchImpact]);

  return {
    investigation: investigationState.data,
    investigationLoading: investigationState.loading,
    investigationError: investigationState.error,
    refetchInvestigation: fetchInvestigation,

    drivers: driversState.data ?? [],
    driversLoading: driversState.loading,
    driversError: driversState.error,
    refetchDrivers,

    evidence: evidenceState.data ?? [],
    evidenceLoading: evidenceState.loading,
    evidenceError: evidenceState.error,
    refetchEvidence,

    marketContext: marketContextState.data,
    marketContextLoading: marketContextState.loading,
    marketContextError: marketContextState.error,
    refetchMarketContext,

    impact: impactState.data,
    impactLoading: impactState.loading,
    impactError: impactState.error,
    refetchImpact,
  };
}
