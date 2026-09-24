import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { apiGet } from '@/lib/api-client';
import { extractErrorMessage } from '@/lib/api-error';
import type {
  Investigation,
  InvestigationListResponse,
  InvestigationType,
} from '@/models/investigation';

const PAGE_SIZE = 10;
const SEARCH_DEBOUNCE_MS = 300;

export interface UseInvestigationsResult {
  investigations: Investigation[];
  total: number;
  limit: number;
  offset: number;
  loading: boolean;
  error: string | null;
  /** Immediate value bound to the search input. */
  search: string;
  /** Applied investigation type filter, or `null` for "all". */
  typeFilter: InvestigationType | null;
  setSearch: (value: string) => void;
  setTypeFilter: (value: InvestigationType | null) => void;
  setOffset: (value: number) => void;
  /** Refetch the current page, keeping the active filters. */
  refetch: () => void;
  /** True when a search term or type filter is active. */
  isFiltered: boolean;
}

/**
 * Loads a paginated, user-scoped investigation list from
 * `GET /investigations`.
 *
 * Design rules:
 * - Search is debounced before it reaches the API so typing does not fire a
 *   request per keystroke.
 * - Every request is abortable; a superseded response can never overwrite a
 *   newer one, and unmount cancels any in-flight request.
 * - `loading` is derived by comparing the current request key with the last
 *   settled key, so no state is written synchronously inside the effect.
 * - The backend scopes results to the authenticated user and applies
 *   search / type filtering server-side. No client-side fabrication, no
 *   fallback rows, and failures surface the real backend message.
 */
export function useInvestigations(): UseInvestigationsResult {
  const [investigations, setInvestigations] = useState<Investigation[]>([]);
  const [total, setTotal] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [settledKey, setSettledKey] = useState<string | null>(null);

  const [search, setSearchState] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [typeFilter, setTypeFilterState] = useState<InvestigationType | null>(null);
  const [offset, setOffsetState] = useState(0);
  const [reloadNonce, setReloadNonce] = useState(0);

  const abortRef = useRef<AbortController | null>(null);

  // Debounce the search term before it is used in a request.
  useEffect(() => {
    const handle = window.setTimeout(() => {
      setDebouncedSearch(search.trim());
    }, SEARCH_DEBOUNCE_MS);
    return () => window.clearTimeout(handle);
  }, [search]);

  const params = useMemo(
    () => ({
      limit: PAGE_SIZE,
      offset,
      ...(debouncedSearch ? { search: debouncedSearch } : {}),
      ...(typeFilter ? { investigation_type: typeFilter } : {}),
    }),
    [debouncedSearch, typeFilter, offset]
  );

  // Identifies a unique request; also drives the derived loading flag.
  const requestKey = `${reloadNonce}\u0000${debouncedSearch}\u0000${typeFilter ?? ''}\u0000${offset}`;

  const loading = settledKey !== requestKey;

  // Fetch whenever the debounced search, type filter, offset or nonce changes.
  // State is written only from the promise callbacks, never synchronously in
  // the effect body, so no cascading render is triggered on mount.
  useEffect(() => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    apiGet<InvestigationListResponse>('/investigations', {
      params,
      signal: controller.signal,
    })
      .then((response) => {
        if (controller.signal.aborted) return;
        setInvestigations(response.data.investigations ?? []);
        setTotal(response.data.pagination?.total ?? 0);
        setError(null);
        setSettledKey(requestKey);
      })
      .catch((err) => {
        if (controller.signal.aborted) return;
        setError(extractErrorMessage(err));
        setInvestigations([]);
        setTotal(0);
        setSettledKey(requestKey);
      });

    return () => controller.abort();
  }, [requestKey, params]);

  // Changing the search term or filter resets to the first page.
  const setSearch = useCallback((value: string) => {
    setSearchState(value);
    setOffsetState(0);
  }, []);

  const setTypeFilter = useCallback((value: InvestigationType | null) => {
    setTypeFilterState(value);
    setOffsetState(0);
  }, []);

  const setOffset = useCallback((value: number) => {
    setOffsetState(Math.max(0, value));
  }, []);

  const refetch = useCallback(() => {
    setReloadNonce((nonce) => nonce + 1);
  }, []);

  return {
    investigations,
    total,
    limit: PAGE_SIZE,
    offset,
    loading,
    error,
    search,
    typeFilter,
    setSearch,
    setTypeFilter,
    setOffset,
    refetch,
    isFiltered: debouncedSearch.length > 0 || typeFilter !== null,
  };
}

export default useInvestigations;
