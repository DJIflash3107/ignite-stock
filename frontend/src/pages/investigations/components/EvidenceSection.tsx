import * as React from 'react';
import { FileSearch } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { EmptyState } from '@/components/feedback/EmptyState';
import { ErrorDisplay } from '@/components/feedback/ErrorDisplay';
import { SkeletonEvidenceRow } from '@/components/feedback/Skeleton';
import { EvidenceCard } from './EvidenceCard';
import {
  EVIDENCE_TABS,
  countEvidenceByTab,
  filterEvidenceByTab,
  type EvidenceTab,
} from '@/lib/investigationEvidence';
import type { EvidenceItem } from '@/models/investigation';

/**
 * Evidence explorer — tabbed factual evidence (All / Market / Sector / Peers /
 * News / Filings / Financials). Tab membership is derived client-side from the
 * backend evidence type + payload (see `investigationEvidence.ts`). Counts are
 * shown per tab and an empty tab renders an empty state, never fallback data.
 */

export interface EvidenceSectionProps {
  items: EvidenceItem[];
  loading: boolean;
  error: string | null;
  onRetry: () => void;
}

export const EvidenceSection: React.FC<EvidenceSectionProps> = ({
  items,
  loading,
  error,
  onRetry,
}) => {
  const [activeTab, setActiveTab] = React.useState<EvidenceTab>('all');
  const counts = React.useMemo(() => countEvidenceByTab(items), [items]);

  return (
    <Card>
      <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-2 pb-4">
        <CardTitle className="flex items-center gap-2">
          <FileSearch className="h-5 w-5 text-muted-foreground" aria-hidden="true" />
          Evidence
        </CardTitle>
        {!loading && !error && (
          <span className="text-sm text-muted-foreground">
            {items.length} factual item{items.length === 1 ? '' : 's'}
          </span>
        )}
      </CardHeader>
      <CardContent className="pt-0">
        {loading ? (
          <div className="space-y-4">
            <SkeletonEvidenceRow />
            <SkeletonEvidenceRow />
            <SkeletonEvidenceRow />
          </div>
        ) : error ? (
          <ErrorDisplay title="Failed to load evidence" message={error} onRetry={onRetry} />
        ) : items.length === 0 ? (
          <EmptyState
            title="No evidence recorded"
            description="No factual evidence items were persisted for this investigation."
          />
        ) : (
          <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as EvidenceTab)}>
            <TabsList className="mb-4">
              {EVIDENCE_TABS.map((tab) => (
                <TabsTrigger key={tab.value} value={tab.value}>
                  {tab.label}
                  <span className="font-mono text-xs text-muted-foreground">
                    {counts[tab.value]}
                  </span>
                </TabsTrigger>
              ))}
            </TabsList>

            {EVIDENCE_TABS.map((tab) => {
              const tabItems = filterEvidenceByTab(items, tab.value);
              return (
                <TabsContent key={tab.value} value={tab.value}>
                  {tab.value === 'all' && (
                    <p className="mb-4 text-xs text-muted-foreground">
                      Includes the stock-movement price item, which appears only under All and
                      feeds the header above.
                    </p>
                  )}
                  {tabItems.length === 0 ? (
                    <EmptyState
                      title={`No ${tab.label.toLowerCase()} evidence`}
                      description={`No evidence items were classified under the ${tab.label} category for this investigation.`}
                    />
                  ) : (
                    <div className="space-y-4">
                      {tabItems.map((item) => (
                        <EvidenceCard key={item.id} item={item} />
                      ))}
                    </div>
                  )}
                </TabsContent>
              );
            })}
          </Tabs>
        )}
      </CardContent>
    </Card>
  );
};
