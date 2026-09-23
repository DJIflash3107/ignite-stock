/**
 * Utility functions for formatting currencies, market caps, and percentages
 * strictly preserving backend numbers without recalculating underlying metrics.
 */

export function formatCurrency(val: number | null | undefined): string {
  if (val === null || val === undefined || isNaN(val)) return '—';
  return `Rp ${Math.round(val).toLocaleString('id-ID')}`;
}

export function formatMarketCap(val: number | null | undefined): string {
  if (val === null || val === undefined || isNaN(val)) return '—';
  const absVal = Math.abs(val);

  if (absVal >= 1_000_000_000_000) {
    const trillions = val / 1_000_000_000_000;
    return `Rp ${trillions.toLocaleString('id-ID', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} T`;
  }
  if (absVal >= 1_000_000_000) {
    const billions = val / 1_000_000_000;
    return `Rp ${billions.toLocaleString('id-ID', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} B`;
  }
  if (absVal >= 1_000_000) {
    const millions = val / 1_000_000;
    return `Rp ${millions.toLocaleString('id-ID', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} M`;
  }
  return `Rp ${val.toLocaleString('id-ID')}`;
}

export function formatPercent(
  val: number | null | undefined,
  options: { showSign?: boolean; decimals?: number } = {}
): string {
  if (val === null || val === undefined || isNaN(val)) return '—';
  const { showSign = true, decimals = 2 } = options;
  const percentage = val * 100;
  const formatted = percentage.toFixed(decimals);

  if (showSign && percentage > 0) {
    return `+${formatted}%`;
  }
  return `${formatted}%`;
}

export function formatWeight(val: number | null | undefined): string {
  if (val === null || val === undefined || isNaN(val)) return '—';
  return `${(val * 100).toFixed(2)}%`;
}

export function formatContribution(val: number | null | undefined): string {
  if (val === null || val === undefined || isNaN(val)) return '—';
  const pct = val * 100;
  const sign = pct > 0 ? '+' : '';
  return `${sign}${pct.toFixed(3)}%`;
}
