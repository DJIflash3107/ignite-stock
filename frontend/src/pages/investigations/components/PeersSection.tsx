import * as React from 'react';
import { Users } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { EmptyState } from '@/components/feedback/EmptyState';
import { ErrorDisplay } from '@/components/feedback/ErrorDisplay';
import { SkeletonTableRow } from '@/components/feedback/Skeleton';
import { formatMarketCap, formatPercent } from '@/lib/formatters';
import { alignmentLabel, alignmentVariant } from '@/lib/investigationLabels';
import { findPeerEvidence } from '@/lib/investigationEvidence';
import type { EvidenceItem, PeerEntry } from '@/models/investigation';

/**
 * Peer comparison — peer rows from the company report (market context / impact)
 * plus the peer co-movement evidence alignment. The backend flattens the Sectors
 * `peers_data.companies` block into clean rows; every value rendered here is
 * backend supplied. Missing peers render an empty state; failures render an
 * error. No fabricated rows.
 */

export interface PeersSectionProps {
  peers: PeerEntry[];
  loading: boolean;
  error: string | null;
  onRetry: () => void;
  evidenceItems: EvidenceItem[];
}

function finiteNumber(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

function formatRatio(value: unknown): string {
  const num = finiteNumber(value);
  return num === null ? '—' : num.toFixed(2);
}

export const PeersSection: React.FC<PeersSectionProps> = ({
  peers,
  loading,
  error,
  onRetry,
  evidenceItems,
}) => {
  const peerEvidence = React.useMemo(
    () => findPeerEvidence(evidenceItems),
    [evidenceItems]
  );

  // Exclude the company itself — the table lists peers only.
  const peerRows = React.useMemo(
    () => peers.filter((peer) => !peer.is_self),
    [peers]
  );

  return (
    <Card>
      <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-2 pb-4">
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5 text-muted-foreground" aria-hidden="true" />
          Peer Comparison
        </CardTitle>
        <div className="flex flex-wrap items-center gap-2">
          {peerRows.length > 0 && (
            <Badge variant="secondary" className="font-mono">
              {peerRows.length} peers
            </Badge>
          )}
          {peerEvidence?.alignment && (
            <Badge variant={alignmentVariant(peerEvidence.alignment)}>
              Peers {alignmentLabel(peerEvidence.alignment)}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        {loading ? (
          <Table>
            <TableBody>
              {Array.from({ length: 5 }).map((_, i) => (
                <SkeletonTableRow key={i} columns={6} />
              ))}
            </TableBody>
          </Table>
        ) : error ? (
          <ErrorDisplay title="Failed to load peer comparison" message={error} onRetry={onRetry} />
        ) : peerRows.length === 0 ? (
          <EmptyState
            title="No peers returned"
            description="The company report did not include peer comparison data for this ticker."
          />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Peer</TableHead>
                <TableHead className="text-right">Market Cap</TableHead>
                <TableHead className="text-right">P/E</TableHead>
                <TableHead className="text-right">P/B</TableHead>
                <TableHead className="text-right">Yearly Mcap Chg</TableHead>
                <TableHead className="text-right">Direction</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {peerRows.map((peer) => {
                const mcapChg = finiteNumber(peer.yearly_mcap_chg);
                const isPositive = mcapChg !== null && mcapChg > 0;
                const isNegative = mcapChg !== null && mcapChg < 0;
                return (
                  <TableRow key={peer.symbol}>
                    <TableCell className="font-mono font-bold text-foreground">
                      <span>{peer.symbol}</span>
                      {peer.company_name && (
                        <span className="block text-xs font-normal text-muted-foreground">
                          {peer.company_name}
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      {formatMarketCap(finiteNumber(peer.market_cap))}
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      {formatRatio(peer.pe_ttm)}
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      {formatRatio(peer.pb_mrq)}
                    </TableCell>
                    <TableCell
                      className={`text-right font-mono font-bold ${
                        isPositive ? 'text-success' : isNegative ? 'text-danger' : 'text-foreground'
                      }`}
                    >
                      {formatPercent(mcapChg)}
                    </TableCell>
                    <TableCell className="text-right text-sm text-secondary-foreground">
                      {mcapChg === null ? '—' : isPositive ? 'Up' : isNegative ? 'Down' : 'Flat'}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
};
