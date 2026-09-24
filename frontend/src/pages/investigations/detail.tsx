import React from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Bot, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

/**
 * Investigation report detail.
 * The three overview facts are presented as a flat divided row instead of
 * nested cards, and only one accent CTA is shown at a time.
 */
export const InvestigationDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const target = id && id.length <= 6 ? id : 'IDX Anomaly';

  const facts = [
    {
      label: 'Investigation target',
      value: <span className="font-mono uppercase">{target}</span>,
      note: 'Evaluated across stock movements, sector context, and company filings.',
    },
    {
      label: 'Analysis status',
      value: <Badge variant="supporting">Completed</Badge>,
      note: 'Deterministic evidence pipeline executed with complete audit trail.',
    },
    {
      label: 'Investigation AI',
      value: 'Multi-Turn Agent',
      note: 'Ask follow-up questions or compare against peers with the LangGraph agent.',
    },
  ];

  return (
    <div className="space-y-8">
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
          <p className="mt-2 text-base text-secondary-foreground">
            Multi-source evidence synthesis with ranked drivers and confidence score.
          </p>
        </div>

        <Button
          variant="default"
          onClick={() => navigate(`/investigations/${id}/ai`)}
        >
          <Bot className="h-4 w-4" aria-hidden="true" />
          <span>Chat with AI Agent</span>
        </Button>
      </header>

      {/* Overview facts */}
      <dl className="grid grid-cols-1 divide-y divide-border border-y border-border md:grid-cols-3 md:divide-x md:divide-y-0">
        {facts.map((fact) => (
          <div key={fact.label} className="py-4 md:px-6 md:first:pl-0 md:last:pr-0">
            <dt className="text-sm text-muted-foreground">{fact.label}</dt>
            <dd className="mt-2 text-lg font-bold text-white">{fact.value}</dd>
            <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{fact.note}</p>
          </div>
        ))}
      </dl>

      {/* Follow-up prompt */}
      <div className="flex flex-col gap-4 rounded-[0.25rem] border border-accent/40 bg-accent/5 p-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="font-heading text-xl font-bold text-white">
            Have follow-up questions about this investigation?
          </h3>
          <p className="mt-1 text-sm text-secondary-foreground leading-relaxed">
            Ask the AI Investigation Agent: &ldquo;Was this sector-wide?&rdquo;, &ldquo;Did the
            fundamentals change?&rdquo;, or &ldquo;Show me contradictory evidence&rdquo;.
          </p>
        </div>
        <Button
          variant="secondary"
          onClick={() => navigate(`/investigations/${id}/ai`)}
          className="shrink-0"
        >
          Launch Assistant
          <ExternalLink className="h-4 w-4" aria-hidden="true" />
        </Button>
      </div>
    </div>
  );
};

export default InvestigationDetailPage;
