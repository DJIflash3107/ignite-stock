import React from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { SearchCode, Plus, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/feedback/EmptyState';

/**
 * Investigations workspace.
 * Single accent CTA (New Investigation / Analyze). The ticker banner uses the
 * accent tint sparingly and content stays left-aligned.
 */
export const InvestigationsPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const tickerQuery = searchParams.get('ticker')?.toUpperCase();

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

        <Button
          variant="default"
          onClick={() => {
            if (tickerQuery) {
              navigate(`/investigations/new?ticker=${tickerQuery}`);
            }
          }}
        >
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
            variant="default"
            onClick={() => navigate(`/investigations/${tickerQuery}`)}
            className="shrink-0"
          >
            Analyze {tickerQuery}
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Button>
        </div>
      )}

      {/* Workspace */}
      <EmptyState
        icon={<SearchCode className="h-8 w-8" />}
        title={tickerQuery ? `No historical reports for ${tickerQuery}` : 'No investigations initiated'}
        description={
          tickerQuery
            ? `Initiate a deterministic investigation for ${tickerQuery} to orchestrate stock movement, peer comparisons, and regulatory filings.`
            : 'Enter an IDX stock ticker in the top search bar or click "New Investigation" to analyze price movements, market drivers, and corporate filings.'
        }
      />
    </div>
  );
};

export default InvestigationsPage;
