import React from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { SearchCode, Sparkles, Plus, ArrowRight } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/feedback/EmptyState';

export const InvestigationsPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const tickerQuery = searchParams.get('ticker')?.toUpperCase();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border/60 pb-5">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="font-heading text-2xl sm:text-3xl font-bold tracking-tight text-white">
              Stock Investigations
            </h1>
            {tickerQuery && (
              <Badge variant="default" className="text-xs uppercase font-mono">
                Ticker: {tickerQuery}
              </Badge>
            )}
          </div>
          <p className="mt-1 text-sm text-secondary-foreground">
            Multi-source anomaly investigation with ranked drivers and tri-state evidence verification.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="default"
            size="sm"
            onClick={() => {
              if (tickerQuery) {
                // e.g. navigate to a new investigation or open dialog
                navigate(`/investigations/new?ticker=${tickerQuery}`);
              }
            }}
            className="shadow-sm shadow-accent/20"
          >
            <Plus className="h-4 w-4" />
            <span>New Investigation</span>
          </Button>
        </div>
      </div>

      {/* Query Banner if ticker is active from global search */}
      {tickerQuery && (
        <Card className="border-accent/40 bg-accent/10">
          <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-accent text-white">
                <Sparkles className="h-4 w-4" />
              </div>
              <div>
                <p className="text-sm font-semibold text-white">
                  Target Stock: <span className="font-mono font-bold text-accent">{tickerQuery}</span>
                </p>
                <p className="text-xs text-secondary-foreground/80">
                  Ready to run 5-node StateGraph investigation pipeline for IDX symbol {tickerQuery}.
                </p>
              </div>
            </div>
            <Button
              size="sm"
              onClick={() => navigate(`/investigations/${tickerQuery}`)}
              className="shrink-0"
            >
              Analyze {tickerQuery}
              <ArrowRight className="h-4 w-4" />
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Workspace Area */}
      <Card className="border-border/60 bg-surface/50">
        <CardContent className="p-8">
          <EmptyState
            icon={<SearchCode className="h-8 w-8 text-accent" />}
            title={tickerQuery ? `No historical reports for ${tickerQuery}` : 'No investigations initiated'}
            description={
              tickerQuery
                ? `Initiate a deterministic investigation for ${tickerQuery} to orchestrate stock movement, peer comparisons, and regulatory filings.`
                : 'Enter an IDX stock ticker in the top search bar or click "New Investigation" to analyze price movements, market drivers, and corporate filings.'
            }
          />
        </CardContent>
      </Card>
    </div>
  );
};

export default InvestigationsPage;
