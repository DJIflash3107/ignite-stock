import * as React from 'react';
import { CheckCircle2, Database, ExternalLink, MinusCircle, XCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { formatDateTime } from '@/lib/dayjs';
import { EVIDENCE_TYPE_LABEL, alignmentLabel, alignmentVariant } from '@/lib/investigationLabels';
import type { EvidenceItem } from '@/models/investigation';

/**
 * Evidence card — FACTUAL evidence only.
 * Renders the deterministic, source-attributed record returned by the backend.
 * It is explicitly labelled "Fact" and shows the Sectors source so it is never
 * confused with AI interpretation.
 */

function AlignmentIcon({ alignment }: { alignment?: EvidenceItem['alignment'] }) {
  if (alignment === 'supporting') {
    return <CheckCircle2 className="h-4 w-4" aria-hidden="true" />;
  }
  if (alignment === 'contradictory') {
    return <XCircle className="h-4 w-4" aria-hidden="true" />;
  }
  return <MinusCircle className="h-4 w-4" aria-hidden="true" />;
}

export interface EvidenceCardProps {
  item: EvidenceItem;
}

export const EvidenceCard: React.FC<EvidenceCardProps> = ({ item }) => {
  const hasRawData = item.data && Object.keys(item.data).length > 0;

  return (
    <article className="rounded-[0.25rem] border border-border bg-surface-card p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="info" className="font-mono">
              {EVIDENCE_TYPE_LABEL[item.evidence_type] ?? item.evidence_type}
            </Badge>
            <Badge variant="outline" className="gap-1">
              <Database className="h-3 w-3" aria-hidden="true" />
              Fact
            </Badge>
            <Badge
              variant={alignmentVariant(item.alignment)}
              className={cn(
                'gap-1',
                item.alignment === 'supporting' && 'text-success',
                item.alignment === 'contradictory' && 'text-danger',
                (!item.alignment || item.alignment === 'neutral') && 'text-warning'
              )}
            >
              <AlignmentIcon alignment={item.alignment} />
              {alignmentLabel(item.alignment)}
            </Badge>
          </div>
          <h4 className="mt-3 font-heading text-lg font-bold text-white">
            {item.title}
          </h4>
        </div>

        {hasRawData && (
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" className="shrink-0">
                <ExternalLink className="h-4 w-4" aria-hidden="true" />
                <span>Raw data</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Evidence source data</DialogTitle>
                <DialogDescription>{item.title}</DialogDescription>
              </DialogHeader>
              <pre className="mt-4 max-h-[60vh] overflow-auto rounded-[0.25rem] border border-border bg-secondary p-4 font-mono text-xs text-secondary-foreground">
                {JSON.stringify(item.data, null, 2)}
              </pre>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <p className="mt-3 text-sm text-secondary-foreground leading-relaxed">
        {item.description}
      </p>

      <dl className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-2 border-t border-border pt-3 text-xs text-muted-foreground">
        <div className="flex items-center gap-2">
          <dt className="font-bold">Source</dt>
          <dd className="font-mono">{item.source_type}</dd>
        </div>
        {item.source_reference && (
          <div className="flex items-center gap-2 min-w-0">
            <dt className="font-bold">Ref</dt>
            <dd className="truncate font-mono">{item.source_reference}</dd>
          </div>
        )}
        {item.observed_at && (
          <div className="flex items-center gap-2">
            <dt className="font-bold">Observed</dt>
            <dd className="font-mono">{formatDateTime(item.observed_at)}</dd>
          </div>
        )}
      </dl>
    </article>
  );
};
