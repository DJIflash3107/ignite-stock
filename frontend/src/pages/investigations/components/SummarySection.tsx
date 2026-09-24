import * as React from 'react';
import { Sparkles } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/feedback/Skeleton';

/**
 * Investigation summary — the backend-generated narrative. This is an AI
 * interpretation, not raw data, so it is labelled and visually separated from
 * the factual evidence cards.
 */

export interface SummarySectionProps {
  summary: string | null | undefined;
  loading: boolean;
}

export const SummarySection: React.FC<SummarySectionProps> = ({ summary, loading }) => {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-2 pb-4">
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-muted-foreground" aria-hidden="true" />
          Investigation Summary
        </CardTitle>
        <Badge variant="outline" className="gap-1">
          <Sparkles className="h-3 w-3" aria-hidden="true" />
          AI interpretation
        </Badge>
      </CardHeader>
      <CardContent className="pt-0">
        {loading ? (
          <div className="space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-2/3" />
          </div>
        ) : summary ? (
          <p className="text-base text-secondary-foreground leading-relaxed">{summary}</p>
        ) : (
          <p className="text-sm text-muted-foreground">
            No summary was generated for this investigation.
          </p>
        )}
      </CardContent>
    </Card>
  );
};
