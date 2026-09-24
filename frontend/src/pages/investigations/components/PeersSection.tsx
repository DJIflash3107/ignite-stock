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
import { formatPercent } from '@/lib/formatters';
import { alignmentLabel, alignmentVariant } from '@/lib/investigationLabels';
import { findPeerEvidence } from '@/lib/investigationEvidence';
import type { EvidenceItem, PeerEntry } from '@/models/investigation';

/**
 * Peer comparison — peer rows from the company report (market context / impact)
 * plus the peer co-movement evidence alignment. Rows are factual, backend
 * supplied values. Missing peers render an empty state; failures render an
 * error. No fabricated rows.
 */

export interface PeersSectionProps {
  peers: PeerEntry[];
  loading: boolean;
  error: string | null;
  onRetry: () => void;
  evidenceItems: EvidenceItem[];
}

function peerReturn(peer: PeerEntry): number | null {
  const value = peer.return;
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
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

  return (
    <Card>
      <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-2 pb-4">
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5 text-muted-foreground" aria-hidden="true" />
          Peer Comparison
        </CardTitle>
        <div className="flex flex-wrap items-center gap-2">
          {peers.length > 0 && (
            <Badge variant="secondary" className="font-mono">
              {peers.length} peers
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
                <SkeletonTableRow key={i} columns={3} />
              ))}
            </TableBody>
          </Table>
        ) : error ? (
          <ErrorDisplay title="Failed to load peer comparison" message={error} onRetry={onRetry} />
        ) : peers.length === 0 ? (
          <EmptyState
            title="No peers returned"
            description="The company report did not include peer comparison data for this ticker."
          />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Peer</TableHead>
                <TableHead className="text-right">Return</TableHead>
                <TableHead className="text-right">Direction</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {peers.map((peer) => {
                const ret = peerReturn(peer);
                const isPositive = ret !== null && ret > 0;
                const isNegative = ret !== null && ret < 0;
                return (
                  <TableRow key={peer.symbol}>
                    <TableCell className="font-mono font-bold text-white">
                      {peer.symbol}
                    </TableCell>
                    <TableCell
                      className={`text-right font-mono font-bold ${
                        isPositive ? 'text-success' : isNegative ? 'text-danger' : 'text-white'
                      }`}
                    >
                      {formatPercent(ret)}
                    </TableCell>
                    <TableCell className="text-right text-sm text-secondary-foreground">
                      {ret === null ? '—' : isPositive ? 'Up' : isNegative ? 'Down' : 'Flat'}
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
