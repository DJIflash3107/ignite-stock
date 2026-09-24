import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, PanelRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { ConversationPanel } from './components/ai/ConversationPanel';
import { InvestigationContextPanel } from './components/ai/InvestigationContextPanel';
import { useInvestigationChat } from '@/hooks/useInvestigationChat';
import { useInvestigationDetail } from '@/hooks/useInvestigationDetail';

/**
 * AI investigation workspace — `/investigations/:id/ai`.
 * Two panes: the conversational agent (left) and the investigation context
 * (right). The conversation is bound to this investigation via
 * `investigation_id`, so it resumes across reloads. All agent status shown is
 * derived from real backend SSE events; failures surface the real error.
 */
export const InvestigationAiPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();

  const detail = useInvestigationDetail(id);

  const chat = useInvestigationChat(id, {
    companyTicker: detail.investigation?.company_ticker ?? null,
    targetDate: detail.investigation?.target_date ?? null,
    indexCode: detail.investigation?.index_code ?? null,
  });

  const ticker = detail.investigation?.company_ticker ?? null;

  return (
    <div className="flex h-[calc(100vh-8rem)] flex-col gap-4">
      {/* Header */}
      <div className="flex shrink-0 flex-col gap-3 border-b border-border pb-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Link
            to={`/investigations/${id}`}
            className="flex items-center gap-1.5 rounded-[0.25rem] text-sm text-secondary-foreground transition-colors hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            <span>Investigation Report</span>
          </Link>
          <span className="text-border" aria-hidden="true">
            |
          </span>
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-heading text-base font-bold text-white">
              AI Investigation Workspace
            </span>
            {ticker && (
              <Badge variant="default" className="font-mono">
                {ticker}
              </Badge>
            )}
            {id && (
              <Badge variant="outline" className="font-mono">
                {id.slice(0, 8)}
              </Badge>
            )}
          </div>
        </div>

        <Badge variant="secondary">LangGraph 5-Node Agent</Badge>
      </div>

      {/* Two-pane workspace */}
      <div className="grid min-h-0 flex-1 grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_380px]">
        {/* Left: conversation */}
        <section className="flex min-h-0 flex-col" aria-label="AI conversation">
          <ConversationPanel chat={chat} investigationId={id ?? ''} />
        </section>

        {/* Right: investigation context */}
        <aside
          className="hidden min-h-0 flex-col overflow-y-auto pr-1 custom-scrollbar lg:flex"
          aria-label="Investigation context"
        >
          <div className="mb-3 flex items-center gap-2">
            <PanelRight className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
            <h2 className="font-heading text-sm font-bold text-white">Investigation Context</h2>
          </div>
          <InvestigationContextPanel
            investigation={detail.investigation}
            investigationLoading={detail.investigationLoading}
            investigationError={detail.investigationError}
            onRetryInvestigation={detail.refetchInvestigation}
            impact={detail.impact}
            impactLoading={detail.impactLoading}
            impactError={detail.impactError}
            onRetryImpact={detail.refetchImpact}
            marketContext={detail.marketContext}
            marketContextLoading={detail.marketContextLoading}
            marketContextError={detail.marketContextError}
            onRetryMarketContext={detail.refetchMarketContext}
            evidenceCount={detail.evidence.length}
            evidenceLoading={detail.evidenceLoading}
            evidenceError={detail.evidenceError}
            onRetryEvidence={detail.refetchEvidence}
          />
        </aside>
      </div>

      {/* Context panel on small screens (stacked below the conversation) */}
      <div className="lg:hidden">
        <InvestigationContextPanel
          investigation={detail.investigation}
          investigationLoading={detail.investigationLoading}
          investigationError={detail.investigationError}
          onRetryInvestigation={detail.refetchInvestigation}
          impact={detail.impact}
          impactLoading={detail.impactLoading}
          impactError={detail.impactError}
          onRetryImpact={detail.refetchImpact}
          marketContext={detail.marketContext}
          marketContextLoading={detail.marketContextLoading}
          marketContextError={detail.marketContextError}
          onRetryMarketContext={detail.refetchMarketContext}
          evidenceCount={detail.evidence.length}
          evidenceLoading={detail.evidenceLoading}
          evidenceError={detail.evidenceError}
          onRetryEvidence={detail.refetchEvidence}
        />
      </div>
    </div>
  );
};

export default InvestigationAiPage;
