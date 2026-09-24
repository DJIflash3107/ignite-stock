import * as React from 'react';
import { AlertTriangle, ListChecks, Sparkles } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { EmptyState } from '@/components/feedback/EmptyState';
import { ErrorDisplay } from '@/components/feedback/ErrorDisplay';
import { SkeletonCard } from '@/components/feedback/Skeleton';
import {
  CONFIDENCE_LABEL,
  CONFIDENCE_VARIANT,
  DRIVER_TYPE_LABEL,
  IMPACT_LABEL,
  IMPACT_VARIANT,
  isNoClearCatalyst,
} from '@/lib/investigationLabels';
import type { InvestigationDriver } from '@/models/investigation';

/**
 * Potential drivers — ranked, AI-synthesised interpretations of the evidence.
 * Clearly labelled "Interpretation" so it is not confused with factual
 * evidence. The backend "No Clear Catalyst Detected" driver is rendered as a
 * distinct warning notice (a legitimate result), never as a system error.
 */

export interface DriversSectionProps {
  drivers: InvestigationDriver[];
  loading: boolean;
  error: string | null;
  onRetry: () => void;
}

export const DriversSection: React.FC<DriversSectionProps> = ({
  drivers,
  loading,
  error,
  onRetry,
}) => {
  const onlyNoCatalyst =
    drivers.length > 0 && drivers.every((driver) => isNoClearCatalyst(driver.title));

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-2 pb-4">
        <CardTitle className="flex items-center gap-2">
          <ListChecks className="h-5 w-5 text-muted-foreground" aria-hidden="true" />
          Potential Drivers
        </CardTitle>
        <Badge variant="outline" className="gap-1">
          <Sparkles className="h-3 w-3" aria-hidden="true" />
          Interpretation
        </Badge>
      </CardHeader>
      <CardContent className="pt-0">
        {loading ? (
          <div className="space-y-4">
            <SkeletonCard />
            <SkeletonCard />
          </div>
        ) : error ? (
          <ErrorDisplay title="Failed to load potential drivers" message={error} onRetry={onRetry} />
        ) : drivers.length === 0 ? (
          <EmptyState
            title="No drivers identified"
            description="The analysis did not produce any ranked drivers for this investigation."
          />
        ) : onlyNoCatalyst ? (
          <div className="flex items-start gap-3 rounded-[0.25rem] border border-warning/40 bg-warning/10 p-5">
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-warning" aria-hidden="true" />
            <div>
              <p className="font-heading text-lg font-bold text-white">
                No clear catalyst detected
              </p>
              <p className="mt-1 text-sm text-secondary-foreground leading-relaxed">
                {drivers[0].description}
              </p>
              <p className="mt-2 text-xs text-muted-foreground">
                This is a legitimate analysis outcome — not a system error. No dominant
                catalyst was identified for this move.
              </p>
            </div>
          </div>
        ) : (
          <ol className="space-y-4">
            {drivers.map((driver) => (
              <li
                key={driver.id}
                className="rounded-[0.25rem] border border-border bg-primary p-5"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <span className="flex h-7 w-7 items-center justify-center rounded-[0.25rem] bg-surface-hover font-mono text-sm font-bold text-white">
                    {driver.rank}
                  </span>
                  <Badge variant="secondary" className="font-mono">
                    {DRIVER_TYPE_LABEL[driver.driver_type] ?? driver.driver_type}
                  </Badge>
                  <Badge variant={CONFIDENCE_VARIANT[driver.confidence]}>
                    {CONFIDENCE_LABEL[driver.confidence]}
                  </Badge>
                  <Badge variant={IMPACT_VARIANT[driver.impact_level]}>
                    {IMPACT_LABEL[driver.impact_level]}
                  </Badge>
                </div>
                <h4 className="mt-3 font-heading text-lg font-bold text-white">
                  {driver.title}
                </h4>
                <p className="mt-2 text-sm text-secondary-foreground leading-relaxed">
                  {driver.description}
                </p>
              </li>
            ))}
          </ol>
        )}
      </CardContent>
    </Card>
  );
};
