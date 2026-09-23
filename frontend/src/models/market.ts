export interface MarketMover {
  classification: 'top_gainers' | 'top_losers';
  period: '1d' | '7d' | '14d' | '30d' | '365d';
  ticker: string;
  company_name: string;
  price_change: number;
  last_close_price: number;
  latest_close_date: string;
}

export interface MarketCapPoint {
  date: string;
  idx_total_market_cap: number;
}

export interface StockContributor {
  ticker: string;
  company_name: string;
  price_change: number;
  market_cap: number;
  estimated_weight: number;
  estimated_contribution: number;
}

export interface MarketImpact {
  start: string;
  end: string;
  index_code: string;
  index_return: number | null;
  market_return: number | null;
  relative_performance: number | null;
  weight_source: string;
  top_contributors: StockContributor[];
}

export interface CompanyImpact {
  ticker: string;
  company_name: string;
  sub_sector: string | null;
  start: string;
  end: string;
  index_code: string;
  stock_return: number | null;
  index_return: number | null;
  market_return: number | null;
  sector_return: number | null;
  relative_to_index: number | null;
  relative_to_sector: number | null;
  estimated_weight: number | null;
  estimated_contribution: number | null;
  weight_source: string;
  peers: Record<string, unknown>[];
}

export interface MarketOverviewData {
  index_code: string;
  start_date: string;
  end_date: string;
  latest_index_price?: number;
  index_change_pct?: number;
  total_market_cap?: number;
  market_movers?: MarketMover[];
}
