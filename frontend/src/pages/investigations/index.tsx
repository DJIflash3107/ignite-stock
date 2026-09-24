import React, { useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { SearchCode, Plus, ArrowRight, Search, SlidersHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Pagination } from '@/components/ui/pagination';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { EmptyState } from '@/components/feedback/EmptyState';
import { ErrorDisplay } from '@/components/feedback/ErrorDisplay';
import { SkeletonTableRow } from '@/components/feedback/Skeleton';
import { NewInvestigationDialog } from './NewInvestigationDialog';
import { useInvestigations } from '@/hooks/useInvestigations';
import { formatDate, timeAgo } from '@/lib/dayjs';
import {
  investigationTypeLabel,
  STATUS_LABEL,
  STATUS_VARIANT,
  CONFIDENCE_LABEL,
  CONFIDENCE_VARIANT,
} from '@/lib/investigationLabels';
import type { Investigation, InvestigationType } from '@/models/investigation';

const TYPE_FILTER_OPTIONS: { value: '' | InvestigationType; label: string }[] = [
  { value: '', label: 'All types' },
  { value: 'company', label: 'Company' },
  { value: 'index', label: 'Index' },
  { value: 'sector', label: 'Sector' },
  { value: 'general', label: 'General' },
];

/** Human label for an investigation's subject (ticker, index code or type). */
function subjectLabel(investigation: Investigation): string {
  return (
    investigation.company_ticker ??
    investigation.index_code ??
    investigationTypeLabel(investigation.investigation_type)
  );
}

/**
 * Investigations workspace.
 * ---------------------------------------------------------------------------
 * Paginated, searchable, type-filterable list scoped to the signed-in user.
 * Single accent CTA (New Investigation); everything else is neutral. Loading,
 * error and empty states are distinct and never fabricate rows. Dates are
 * rendered with Day.js. The table collapses to a stacked card list on small
 * screens.
 */
export const InvestigationsPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const tickerQuery = searchParams.get('ticker')?.toUpperCase();
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const {
    investigations,
    total,
    limit,
    offset,
    loading,
    error,
    search,
    typeFilter,
    setSearch,
    setTypeFilter,
    setOffset,
    refetch,
    isFiltered,
  } = useInvestigations();

  const hasResults = investigations.length > 0;
  const showPagination = !loading && !error && total > limit;

  const emptyState = useMemo(() => {
    if (tickerQuery) {
      return {
        title: `No historical reports for ${tickerQuery}`,
        description: `Initiate a deterministic investigation for ${tickerQuery} to orchestrate stock movement, peer comparisons, and regulatory filings.`,
      };
    }
    if (isFiltered) {
      return {
        title: 'No investigations match your filters',
        description:
          'Adjust or clear the search term and investigation type to see more results.',
      };
    }
    return {
      title: 'No investigations initiated',
      description:
        'Enter an IDX stock ticker in the top search bar or click "New Investigation" to analyze price movements, market drivers, and corporate filings.',
    };
  }, [tickerQuery, isFiltered]);

  return (
    <div className="space-y-8">
      {/* Header */}
      <header className="flex flex-col gap-4 border-b border-border pb-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="font-heading text-3xl font-bold text-white">
              Stock Investigations
            </h1>
            {tickerQuery && (
              <Badge variant="default" className="font-mono">
                {tickerQuery}
              </Badge>
            )}
          </div>
          <p className="mt-2 text-base text-secondary-foreground">
            Multi-source anomaly investigation with ranked drivers and tri-state evidence verification.
          </p>
        </div>

        <Button variant="default" onClick={() => setIsDialogOpen(true)}>
          <Plus className="h-4 w-4" aria-hidden="true" />
          <span>New Investigation</span>
        </Button>
      </header>

      {/* Active ticker context */}
      {tickerQuery && (
        <div className="flex flex-col gap-4 rounded-[0.25rem] border border-accent/40 bg-accent/5 p-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-base font-bold text-white">
              Target stock: <span className="font-mono text-accent">{tickerQuery}</span>
            </p>
            <p className="mt-1 text-sm text-secondary-foreground">
              Ready to run the 5-node StateGraph investigation pipeline for IDX symbol {tickerQuery}.
            </p>
          </div>
          <Button
            variant="secondary"
            onClick={() => setIsDialogOpen(true)}
            className="shrink-0"
          >
            Analyze {tickerQuery}
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Button>
        </div>
      )}

      {/* Toolbar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex w-full flex-col gap-4 sm:max-w-2xl sm:flex-row">
          <div className="w-full sm:max-w-xs">
            <Label htmlFor="investigation-search">Search</Label>
            <div className="relative">
              <Search
                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
                aria-hidden="true"
              />
              <Input
                id="investigation-search"
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Ticker, index or question"
                className="pl-9"
                autoComplete="off"
              />
            </div>
          </div>

          <div className="w-full sm:max-w-[12rem]">
            <Label htmlFor="investigation-type">Type</Label>
            <Select
              id="investigation-type"
              value={typeFilter ?? ''}
              onChange={(e) =>
                setTypeFilter((e.target.value || null) as InvestigationType | null)
              }
            >
              {TYPE_FILTER_OPTIONS.map((option) => (
                <option key={option.value || 'all'} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Select>
          </div>
        </div>

        {!loading && !error && (
          <p className="shrink-0 text-sm text-muted-foreground" aria-live="polite">
            {total} {total === 1 ? 'result' : 'results'}
            {isFiltered ? ' (filtered)' : ''}
          </p>
        )}
      </div>

      {/* Content */}
      {loading ? (
        <div className="rounded-[0.25rem] border border-border bg-surface-card p-1">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead>Subject</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Question</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {Array.from({ length: 5 }).map((_, i) => (
                <SkeletonTableRow key={i} columns={5} />
              ))}
            </TableBody>
          </Table>
        </div>
      ) : error ? (
        <ErrorDisplay
          title="Could not load investigations"
          message={error}
          onRetry={refetch}
        />
      ) : !hasResults ? (
        <EmptyState
          icon={<SearchCode className="h-8 w-8" />}
          title={emptyState.title}
          description={emptyState.description}
          action={
            isFiltered && !tickerQuery ? (
              <Button
                variant="secondary"
                onClick={() => {
                  setSearch('');
                  setTypeFilter(null);
                }}
              >
                <SlidersHorizontal className="h-4 w-4" aria-hidden="true" />
                Clear filters
              </Button>
            ) : undefined
          }
        />
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden overflow-hidden rounded-[0.25rem] border border-border bg-surface-card md:block">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead>Subject</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Question</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Confidence</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {investigations.map((investigation) => (
                  <TableRow
                    key={investigation.id}
                    className="cursor-pointer"
                    onClick={() => navigate(`/investigations/${investigation.id}`)}
                  >
                    <TableCell className="font-mono font-bold text-white">
                      {subjectLabel(investigation)}
                    </TableCell>
                    <TableCell className="text-secondary-foreground">
                      {investigationTypeLabel(investigation.investigation_type)}
                    </TableCell>
                    <TableCell className="max-w-xs truncate text-secondary-foreground">
                      {investigation.question}
                    </TableCell>
                    <TableCell>
                      <Badge variant={STATUS_VARIANT[investigation.status]}>
                        {STATUS_LABEL[investigation.status]}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {investigation.overall_confidence ? (
                        <Badge
                          variant={CONFIDENCE_VARIANT[investigation.overall_confidence]}
                        >
                          {CONFIDENCE_LABEL[investigation.overall_confidence]}
                        </Badge>
                      ) : (
                        <span className="text-sm text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-secondary-foreground">
                      <span title={formatDate(investigation.created_at)}>
                        {timeAgo(investigation.created_at)}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/investigations/${investigation.id}`);
                        }}
                      >
                        Open
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Mobile card list */}
          <div className="space-y-3 md:hidden">
            {investigations.map((investigation) => (
              <button
                key={investigation.id}
                type="button"
                onClick={() => navigate(`/investigations/${investigation.id}`)}
                className="w-full rounded-[0.25rem] border border-border bg-surface-card p-4 text-left transition-colors hover:bg-surface-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
              >
                <div className="flex items-start justify-between gap-3">
                  <span className="font-mono text-base font-bold text-white">
                    {subjectLabel(investigation)}
                  </span>
                  <Badge variant={STATUS_VARIANT[investigation.status]}>
                    {STATUS_LABEL[investigation.status]}
                  </Badge>
                </div>
                <p className="mt-2 line-clamp-2 text-sm text-secondary-foreground">
                  {investigation.question}
                </p>
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <Badge variant="info">
                    {investigationTypeLabel(investigation.investigation_type)}
                  </Badge>
                  {investigation.overall_confidence && (
                    <Badge
                      variant={CONFIDENCE_VARIANT[investigation.overall_confidence]}
                    >
                      {CONFIDENCE_LABEL[investigation.overall_confidence]}
                    </Badge>
                  )}
                  <span className="text-xs text-muted-foreground">
                    {timeAgo(investigation.created_at)}
                  </span>
                </div>
              </button>
            ))}
          </div>

          {showPagination && (
            <Pagination
              total={total}
              limit={limit}
              offset={offset}
              onOffsetChange={setOffset}
              isLoading={loading}
            />
          )}
        </>
      )}

      <NewInvestigationDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        defaultTicker={tickerQuery}
      />
    </div>
  );
};

export default InvestigationsPage;
