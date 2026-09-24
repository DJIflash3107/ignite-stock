import * as React from 'react';
import { Gauge, Sparkles } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/feedback/Skeleton';
import {
  CONFIDENCE_LABEL,
  CONFIDENCE_VARIANT,
  IMPACT_LABEL,
  IMPACT_VARIANT,
  countAlignments,
  maxImpactLevel,
} from '@/lib/investigationLabels';
import type { EvidenceItem, InvestigationDriver } from '@/models/investigation';

/**
 * Confidence & impact — the aggregated AI verdict plus evidence alignment
 * counts. Explicitly labelled "Interpretation". Derived only from backend
 * fields; nothing is recalculated or fabricated.
 */

export interface ConfidenceImpactSectionProps {
  confidence: InvestigationDriver['confidence'] | null;
  drivers: InvestigationDriver[];
  evidenceItems: EvidenceItem[];
  loading: boolean;
}

export const ConfidenceImpactSection: React.FC<ConfidenceImpactSectionProps> = ({
  confidence,
  drivers,
  evidenceItems,
  loading,
}) => {
  const aggregatedImpact = React.useMemo(
    () => maxImpactLevel(drivers.map((driver) => driver.impact_level)),
    [drivers]
  );
  const alignments = React.useMemo(() => countAlignments(evidenceItems), [evidenceItems]);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-2 pb-4">
        <CardTitle className="flex items-center gap-2">
          <Gauge className="h-5 w-5 text-muted-foreground" aria-hidden="true" />
          Confidence &amp; Impact
        </CardTitle>
        <Badge variant="outline" className="gap-1">
          <Sparkles className="h-3 w-3" aria-hidden="true" />
          Interpretation
        </Badge>
      </CardHeader>
      <CardContent className="space-y-5 pt-0">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <span className="text-sm text-muted-foreground">Overall confidence</span>
            <div className="mt-2">
              {loading ? (
                <Skeleton className="h-6 w-32" />
              ) : confidence ? (
                <Badge variant={CONFIDENCE_VARIANT[confidence]}>
                  {CONFIDENCE_LABEL[confidence]}
                </Badge>
              ) : (
                <span className="text-sm text-muted-foreground">Not rated</span>
              )}
            </div>
          </div>
          <div>
            <span className="text-sm text-muted-foreground">Highest driver impact</span>
            <div className="mt-2">
              {loading ? (
                <Skeleton className="h-6 w-32" />
              ) : aggregatedImpact ? (
                <Badge variant={IMPACT_VARIANT[aggregatedImpact]}>
                  {IMPACT_LABEL[aggregatedImpact]}
                </Badge>
              ) : (
                <span className="text-sm text-muted-foreground">Not rated</span>
              )}
            </div>
          </div>
        </div>

        <div className="border-t border-border pt-4">
          <span className="text-sm text-muted-foreground">Evidence alignment</span>
          <div className="mt-2 flex flex-wrap items-center gap-3">
            {loading ? (
              <>
                <Skeleton className="h-6 w-24" />
                <Skeleton className="h-6 w-24" />
                <Skeleton className="h-6 w-24" />
              </>
            ) : (
              <>
                <Badge variant="supporting">
                  {alignments.supporting} supporting
                </Badge>
                <Badge variant="contradictory">
                  {alignments.contradictory} contradictory
                </Badge>
                <Badge variant="neutral">{alignments.neutral} neutral</Badge>
              </>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
