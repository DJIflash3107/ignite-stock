import * as React from 'react';
import { cn } from '@/lib/utils';

/**
 * Compact labelled metric row for the investigation context panel.
 * Values are pre-formatted by the caller (backend numbers only) so this stays a
 * purely presentational primitive.
 */
export interface ContextMetricRowProps {
  label: string;
  value: string;
  tone?: 'neutral' | 'positive' | 'negative' | 'muted';
  icon?: React.ReactNode;
}

const TONE_CLASS: Record<NonNullable<ContextMetricRowProps['tone']>, string> = {
  neutral: 'text-white',
  positive: 'text-success',
  negative: 'text-danger',
  muted: 'text-muted-foreground',
};

export const ContextMetricRow: React.FC<ContextMetricRowProps> = ({
  label,
  value,
  tone = 'neutral',
  icon,
}) => (
  <div className="flex items-center justify-between gap-4 py-2.5">
    <span className="flex items-center gap-2 text-sm text-secondary-foreground">
      {icon}
      {label}
    </span>
    <span className={cn('font-mono text-sm font-bold', TONE_CLASS[tone])}>{value}</span>
  </div>
);
