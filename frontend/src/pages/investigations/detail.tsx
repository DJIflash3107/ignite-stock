import React from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Bot, ExternalLink } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export const InvestigationDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  return (
    <div className="space-y-6">
      {/* Back button & Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-secondary-foreground/70">
        <Link to="/investigations" className="flex items-center gap-1 hover:text-white transition-colors">
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Back to Investigations</span>
        </Link>
        <span>/</span>
        <span className="text-white font-mono">{id}</span>
      </div>

      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border/60 pb-5">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="font-heading text-2xl sm:text-3xl font-bold tracking-tight text-white">
              Investigation Report
            </h1>
            <Badge variant="outline" className="font-mono text-xs">
              ID: {id}
            </Badge>
          </div>
          <p className="mt-1 text-sm text-secondary-foreground">
            Multi-source evidence synthesis with ranked drivers and confidence score.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="default"
            size="sm"
            onClick={() => navigate(`/investigations/${id}/ai`)}
            className="shadow-sm shadow-accent/20"
          >
            <Bot className="h-4 w-4" />
            <span>Chat with AI Agent</span>
          </Button>
        </div>
      </div>

      {/* Investigation Shell Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-surface/80 border-border/70">
          <CardHeader className="p-4 pb-2">
            <span className="text-xs font-semibold text-secondary-foreground uppercase tracking-wider">
              Investigation Target
            </span>
            <CardTitle className="text-lg mt-1 font-mono uppercase">
              {id?.length && id.length <= 6 ? id : 'IDX Anomaly'}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <p className="text-xs text-secondary-foreground/70">
              Evaluated across stock movements, sector context, and company filings.
            </p>
          </CardContent>
        </Card>

        <Card className="bg-surface/80 border-border/70">
          <CardHeader className="p-4 pb-2">
            <span className="text-xs font-semibold text-secondary-foreground uppercase tracking-wider">
              Analysis Status
            </span>
            <div className="mt-1">
              <Badge variant="supporting">Completed</Badge>
            </div>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <p className="text-xs text-secondary-foreground/70">
              Deterministic evidence pipeline executed with complete audit trail.
            </p>
          </CardContent>
        </Card>

        <Card className="bg-surface/80 border-border/70">
          <CardHeader className="p-4 pb-2">
            <span className="text-xs font-semibold text-secondary-foreground uppercase tracking-wider">
              Investigation AI
            </span>
            <CardTitle className="text-lg mt-1">Multi-Turn Agent</CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <p className="text-xs text-secondary-foreground/70">
              Ask follow-up questions or compare against peers with the LangGraph agent.
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Interactive AI Agent Banner */}
      <Card className="border-accent/40 bg-accent/5">
        <CardContent className="p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent text-white shadow-md shadow-accent/20">
              <Bot className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-heading text-base font-semibold text-white">
                Have follow-up questions about this investigation?
              </h3>
              <p className="mt-1 text-sm text-secondary-foreground">
                Ask the AI Investigation Agent: &quot;Was this sector-wide?&quot;, &quot;Did the fundamentals change?&quot;, or &quot;Show me contradictory evidence&quot;.
              </p>
            </div>
          </div>
          <Button
            onClick={() => navigate(`/investigations/${id}/ai`)}
            className="shrink-0 shadow-md shadow-accent/20"
          >
            Launch Assistant
            <ExternalLink className="h-4 w-4" />
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default InvestigationDetailPage;
