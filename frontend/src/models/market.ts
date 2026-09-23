export interface MarketMover {
  classification: 'top_gainers' | 'top_losers';
  period: '1d' | '7d' | '14d' | '30d' | '365d';
  ticker: string;
  company_name: string;
  price_change: number;
  last_close_price: number;
  latest_close_date: string;
}

export type MoverPeriod = '1d' | '7d' | '14d' | '30d' | '365d';

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

export interface IndexClose {
  index_code: string;
  date: string;
  price: number;
}

export interface MarketCapChange {
  absolute?: number | null;
  percentage?: number | null;
  [key: string]: number | null | undefined;
}

export interface MarketOverview {
  start: string;
  end: string;
  market_cap_series: MarketCapPoint[];
  market_cap_change: MarketCapChange;
  index_series: IndexClose[];
}

export interface MarketOverviewResponse {
  message: {
    success: string;
  };
  data: {
    market: MarketOverview;
  };
}

export interface MarketMoversResponse {
  message: {
    success: string;
  };
  data: {
    movers: MarketMover[];
    pagination: {
      total: number;
      limit: number;
      offset: number;
    };
  };
}

export interface MarketImpactResponse {
  message: {
    success: string;
  };
  data: {
    impact: MarketImpact;
  };
}
