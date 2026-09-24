import type { EvidenceItem, EvidenceType } from '@/models/investigation';

/**
 * Evidence tab taxonomy.
 * ---------------------------------------------------------------------------
 * The backend emits six evidence types (`price | financial | news | filing |
 * market | other`) but the report exposes seven tabs. Sector and peer evidence
 * are derived from the item payload, never invented:
 *   - Sector  -> evidence_type 'other' carrying `data.sub_sector`
 *   - Peers   -> evidence_type 'price' carrying `data.peers`
 *   - Market  -> evidence_type 'market'
 * The stock-movement price item (price WITHOUT `data.peers`) intentionally
 * appears only under "All"; it feeds the stock header section.
 */

export type EvidenceTab =
  | 'all'
  | 'market'
  | 'sector'
  | 'peers'
  | 'news'
  | 'filings'
  | 'financials';

export interface EvidenceTabMeta {
  value: EvidenceTab;
  label: string;
}

export const EVIDENCE_TABS: EvidenceTabMeta[] = [
  { value: 'all', label: 'All' },
  { value: 'market', label: 'Market' },
  { value: 'sector', label: 'Sector' },
  { value: 'peers', label: 'Peers' },
  { value: 'news', label: 'News' },
  { value: 'filings', label: 'Filings' },
  { value: 'financials', label: 'Financials' },
];

function hasPeerData(item: EvidenceItem): boolean {
  return item.evidence_type === 'price' && Array.isArray(item.data?.peers);
}

function hasSubSectorData(item: EvidenceItem): boolean {
  if (item.evidence_type !== 'other') return false;
  const subSector = item.data?.sub_sector;
  return typeof subSector === 'string' && subSector.trim().length > 0;
}

/**
 * Returns every tab an evidence item belongs to. The "all" tab is implicit and
 * therefore not returned here.
 */
export function evidenceTabsFor(item: EvidenceItem): EvidenceTab[] {
  const tabs: EvidenceTab[] = [];
  const type: EvidenceType = item.evidence_type;

  if (type === 'market') tabs.push('market');
  if (type === 'news') tabs.push('news');
  if (type === 'filing') tabs.push('filings');
  if (type === 'financial') tabs.push('financials');
  if (hasSubSectorData(item)) tabs.push('sector');
  if (hasPeerData(item)) tabs.push('peers');

  return tabs;
}

export function filterEvidenceByTab(
  items: EvidenceItem[],
  tab: EvidenceTab
): EvidenceItem[] {
  if (tab === 'all') return items;
  return items.filter((item) => evidenceTabsFor(item).includes(tab));
}

export function countEvidenceByTab(
  items: EvidenceItem[]
): Record<EvidenceTab, number> {
  const counts: Record<EvidenceTab, number> = {
    all: items.length,
    market: 0,
    sector: 0,
    peers: 0,
    news: 0,
    filings: 0,
    financials: 0,
  };
  for (const item of items) {
    for (const tab of evidenceTabsFor(item)) {
      counts[tab] += 1;
    }
  }
  return counts;
}

/** Finds the stock-movement price evidence item (price without peer payload). */
export function findStockMovementEvidence(
  items: EvidenceItem[]
): EvidenceItem | undefined {
  return items.find(
    (item) => item.evidence_type === 'price' && !Array.isArray(item.data?.peers)
  );
}

/** Finds the peer co-movement evidence item (price with peer payload). */
export function findPeerEvidence(items: EvidenceItem[]): EvidenceItem | undefined {
  return items.find((item) => hasPeerData(item));
}
