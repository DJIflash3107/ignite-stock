import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { ErrorDisplay } from '@/components/feedback/ErrorDisplay';
import { Skeleton, SkeletonCard } from '@/components/feedback/Skeleton';
import { useInvestigationDetail } from '@/hooks/useInvestigationDetail';
import { StockHeaderSection } from './components/StockHeaderSection';
import { ComparisonSection } from './components/ComparisonSection';
import { PeersSection } from './components/PeersSection';
import { DriversSection } from './components/DriversSection';
import { ConfidenceImpactSection } from './components/ConfidenceImpactSection';
import { EvidenceSection } from './components/EvidenceSection';
import { SummarySection } from './components/SummarySection';
import { AskAboutSection } from './components/AskAboutSection';

/**
 * Investigation report detail (`/investigations/:id`).
 * Composes the stock header, market/sector comparison, peer comparison,
 * potential drivers, confidence & impact, tabbed evidence, summary and the
 * "ask about this investigation" CTA. Every section owns its own loading and
 * error state; failed requests never fall back to fabricated data.
 */
export const InvestigationDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const {
    investigation,
    investigationLoading,
    investigationError,
    refetchInvestigation,
    drivers,
    driversLoading,
    driversError,
    refetchDrivers,
    evidence,
    evidenceLoading,
    evidenceError,
    refetchEvidence,
    marketContext,
    marketContextLoading,
    marketContextError,
    refetchMarketContext,
    impact,
    impactLoading,
    impactError,
    refetchImpact,
  } = useInvestigationDetail(id);

  const ticker = investigation?.company_ticker ?? null;

  // Peer rows come from market context first, falling back to the impact
  // payload (both are backend-supplied). Never synthesised.
  const peers =
    marketContext?.peers && marketContext.peers.length > 0
      ? marketContext.peers
      : impact?.peers ?? [];

  const peerLoading = marketContextLoading || impactLoading;
  const peerError = marketContextError ?? impactError;
  const retryPeers = () => {
    void refetchMarketContext();
    void refetchImpact();
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Link
          to="/investigations"
          className="flex items-center gap-1 rounded-[0.25rem] hover:text-white transition-colors"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          <span>Back to Investigations</span>
        </Link>
        <span aria-hidden="true">/</span>
        <span className="font-mono text-white">{id}</span>
      </div>

      {/* Header */}
      <header className="flex flex-col gap-4 border-b border-border pb-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="font-heading text-3xl font-bold text-white">
              Investigation Report
            </h1>
            <Badge variant="outline" className="font-mono">
              ID: {id}
            </Badge>
          </div>
          <p className="mt-2 max-w-2xl text-base text-secondary-foreground leading-relaxed">
            Multi-source evidence synthesis with ranked drivers and confidence scoring.
          </p>
        </div>
      </header>

      {/* Investigation-level loading / error gates the report body */}
      {investigationLoading ? (
        <div className="space-y-6">
          <SkeletonCard />
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <SkeletonCard />
            <SkeletonCard />
          </div>
          <Skeleton className="h-64 w-full" />
        </div>
      ) : investigationError ? (
        <ErrorDisplay
          title="Failed to load investigation"
          message={investigationError}
          onRetry={refetchInvestigation}
        />
      ) : !investigation ? (
        <ErrorDisplay
          title="Investigation not found"
          message="This investigation could not be found or is not accessible."
          onRetry={refetchInvestigation}
        />
      ) : (
        <>
          {/* Stock header & latest movement */}
          <StockHeaderSection investigation={investigation} loading={false} />

          {/* Market vs sector + peer comparison */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <ComparisonSection
              impact={impact}
              loading={impactLoading}
              error={impactError}
              onRetry={refetchImpact}
            />
            <PeersSection
              peers={peers}
              loading={peerLoading}
              error={peerError}
              onRetry={retryPeers}
              evidenceItems={evidence}
            />
          </div>

          {/* Potential drivers + confidence & impact */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <DriversSection
              drivers={drivers}
              loading={driversLoading}
              error={driversError}
              onRetry={refetchDrivers}
            />
            <ConfidenceImpactSection
              confidence={investigation.overall_confidence ?? null}
              drivers={drivers}
              evidenceItems={evidence}
              loading={driversLoading || investigationLoading}
            />
          </div>

          {/* Evidence explorer */}
          <EvidenceSection
            items={evidence}
            loading={evidenceLoading}
            error={evidenceError}
            onRetry={refetchEvidence}
          />

          {/* Investigation summary */}
          <SummarySection summary={investigation.summary} loading={false} />

          {/* Ask about this investigation */}
          <AskAboutSection investigationId={investigation.id} ticker={ticker} />
        </>
      )}
    </div>
  );
};

export default InvestigationDetailPage;
