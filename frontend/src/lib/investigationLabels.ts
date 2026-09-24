import type {
  ConfidenceLevel,
  DriverType,
  EvidenceAlignment,
  EvidenceType,
  ImpactLevel,
  InvestigationStatus,
} from '@/models/investigation';

/**
 * Presentation helpers mapping backend enums to human labels and semantic
 * badge variants. No business logic — purely display mapping. Every mapping is
 * accompanied by a text label so state is never conveyed by color alone.
 */

type BadgeVariant = 'default' | 'secondary' | 'outline' | 'supporting' | 'contradictory' | 'neutral' | 'info';

export const ALIGNMENT_LABEL: Record<EvidenceAlignment, string> = {
  supporting: 'Supporting',
  contradictory: 'Contradictory',
  neutral: 'Neutral',
};

export const ALIGNMENT_VARIANT: Record<EvidenceAlignment, BadgeVariant> = {
  supporting: 'supporting',
  contradictory: 'contradictory',
  neutral: 'neutral',
};

export function alignmentLabel(alignment?: EvidenceAlignment | null): string {
  if (!alignment) return 'Unclassified';
  return ALIGNMENT_LABEL[alignment] ?? 'Unclassified';
}

export function alignmentVariant(alignment?: EvidenceAlignment | null): BadgeVariant {
  if (!alignment) return 'info';
  return ALIGNMENT_VARIANT[alignment] ?? 'info';
}

export const CONFIDENCE_LABEL: Record<ConfidenceLevel, string> = {
  low: 'Low confidence',
  medium: 'Medium confidence',
  high: 'High confidence',
};

export const CONFIDENCE_VARIANT: Record<ConfidenceLevel, BadgeVariant> = {
  low: 'neutral',
  medium: 'info',
  high: 'supporting',
};

export const IMPACT_LABEL: Record<ImpactLevel, string> = {
  low: 'Low impact',
  medium: 'Medium impact',
  high: 'High impact',
};

export const IMPACT_VARIANT: Record<ImpactLevel, BadgeVariant> = {
  low: 'info',
  medium: 'neutral',
  high: 'contradictory',
};

export const DRIVER_TYPE_LABEL: Record<DriverType, string> = {
  price: 'Price',
  volume: 'Volume',
  fundamental: 'Fundamental',
  news: 'News',
  sector: 'Sector',
  corporate_action: 'Corporate action',
  market: 'Market',
  other: 'Other',
};

export const EVIDENCE_TYPE_LABEL: Record<EvidenceType, string> = {
  price: 'Price',
  financial: 'Financial',
  news: 'News',
  filing: 'Filing',
  market: 'Market',
  other: 'Context',
};

export const STATUS_LABEL: Record<InvestigationStatus, string> = {
  pending: 'Pending',
  running: 'Running',
  completed: 'Completed',
  failed: 'Failed',
  cancelled: 'Cancelled',
};

export const STATUS_VARIANT: Record<InvestigationStatus, BadgeVariant> = {
  pending: 'info',
  running: 'info',
  completed: 'supporting',
  failed: 'contradictory',
  cancelled: 'outline',
};

export const NO_CLEAR_CATALYST_TITLE = 'No Clear Catalyst Detected';

export function isNoClearCatalyst(title: string | undefined | null): boolean {
  return title === NO_CLEAR_CATALYST_TITLE;
}

/** Highest impact across a set of impact levels, for the aggregated verdict. */
export function maxImpactLevel(levels: ImpactLevel[]): ImpactLevel | null {
  const order: ImpactLevel[] = ['low', 'medium', 'high'];
  let maxIndex = -1;
  for (const level of levels) {
    const index = order.indexOf(level);
    if (index > maxIndex) maxIndex = index;
  }
  return maxIndex >= 0 ? order[maxIndex] : null;
}

/** Aggregated evidence alignment counts. */
export function countAlignments(items: { alignment?: EvidenceAlignment | null }[]) {
  let supporting = 0;
  let contradictory = 0;
  let neutral = 0;
  for (const item of items) {
    if (item.alignment === 'supporting') supporting += 1;
    else if (item.alignment === 'contradictory') contradictory += 1;
    else neutral += 1;
  }
  return { supporting, contradictory, neutral };
}
