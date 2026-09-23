import React from 'react';
import { useNavigate } from 'react-router-dom';
import { BarChart3, TrendingUp, SearchCode, ArrowUpRight, Clock, ShieldCheck } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/feedback/EmptyState';

export const MarketPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="space-y-6">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border/60 pb-5">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="font-heading text-2xl sm:text-3xl font-bold tracking-tight text-white">
              Market Intelligence
            </h1>
            <Badge variant="supporting" className="text-xs">
              Live IDX
            </Badge>
          </div>
          <p className="mt-1 text-sm text-secondary-foreground">
            Deterministic market analytics and index contribution powered by Sectors Financial API.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="default"
            size="sm"
            onClick={() => navigate('/investigations')}
            className="shadow-sm shadow-accent/20"
          >
            <SearchCode className="h-4 w-4" />
            <span>Launch Investigation</span>
          </Button>
        </div>
      </div>

      {/* Quick Stat / Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-surface/80 border-border/70">
          <CardHeader className="p-4 pb-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-secondary-foreground uppercase tracking-wider">
                Benchmark Index
              </span>
              <TrendingUp className="h-4 w-4 text-emerald-400" />
            </div>
            <CardTitle className="text-xl mt-1">IHSG (Composite)</CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <p className="text-xs text-secondary-foreground/70">
              Indonesia Stock Exchange primary benchmark index tracking all listed shares.
            </p>
          </CardContent>
        </Card>

        <Card className="bg-surface/80 border-border/70">
          <CardHeader className="p-4 pb-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-secondary-foreground uppercase tracking-wider">
                Weight Source
              </span>
              <ShieldCheck className="h-4 w-4 text-cyan-400" />
            </div>
            <CardTitle className="text-xl mt-1">Market Cap Share</CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <p className="text-xs text-secondary-foreground/70">
              Estimated market capitalization share computed deterministically with Decimal precision.
            </p>
          </CardContent>
        </Card>

        <Card className="bg-surface/80 border-border/70">
          <CardHeader className="p-4 pb-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-secondary-foreground uppercase tracking-wider">
                Engine Status
              </span>
              <Clock className="h-4 w-4 text-amber-400" />
            </div>
            <CardTitle className="text-xl mt-1">7 Tools Active</CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <p className="text-xs text-secondary-foreground/70">
              Stock movement, market & sector context, peers, news, filings, and financial metrics.
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Workspace */}
      <Card className="border-border/60 bg-surface/50">
        <CardContent className="p-8">
          <EmptyState
            icon={<BarChart3 className="h-8 w-8 text-accent" />}
            title="Explore IDX Market Movements"
            description="Use the global ticker search bar above or launch a targeted stock investigation to analyze abnormal price movements and drivers."
            action={
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate('/investigations')}
                className="mt-2"
              >
                Go to Investigations
                <ArrowUpRight className="h-4 w-4" />
              </Button>
            }
          />
        </CardContent>
      </Card>
    </div>
  );
};

export default MarketPage;
