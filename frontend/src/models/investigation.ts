export type InvestigationStatus = 'pending' | 'in_progress' | 'completed' | 'failed';

export type InvestigationType =
  | 'unusual_volume'
  | 'price_shock'
  | 'earnings_surprise'
  | 'sector_rotation'
  | 'regulatory_filing'
  | 'general_inquiry';

export type ConfidenceLevel = 'low' | 'medium' | 'high' | 'very_high';

export type ImpactLevel = 'negligible' | 'low' | 'moderate' | 'high' | 'critical';

export type DriverType =
  | 'macroeconomic'
  | 'industry_sector'
  | 'earnings_financials'
  | 'corporate_action'
  | 'management_governance'
  | 'analyst_sentiment'
  | 'technical_orderflow';

export type EvidenceType =
  | 'stock_movement'
  | 'market_context'
  | 'sector_context'
  | 'peer_movement'
  | 'news'
  | 'filing'
  | 'financials'
  | 'corporate_action';

export type EvidenceAlignment = 'supporting' | 'contradictory' | 'neutral';

export interface EvidenceItem {
  id: string;
  investigation_id: string;
  driver_id?: string | null;
  evidence_type: EvidenceType;
  title: string;
  description: string;
  data: Record<string, unknown>;
  source_type: string;
  source_reference?: string | null;
  alignment: EvidenceAlignment;
  observed_at?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface InvestigationDriver {
  id: string;
  investigation_id: string;
  driver_type: DriverType;
  title: string;
  description: string;
  confidence: ConfidenceLevel;
  impact_level: ImpactLevel;
  rank: number;
  created_at?: string;
  updated_at?: string;
}

export interface Investigation {
  id: string;
  user_id?: string | null;
  company_ticker?: string | null;
  index_code?: string | null;
  investigation_type: InvestigationType;
  question: string;
  target_date: string;
  status: InvestigationStatus;
  summary?: string | null;
  overall_confidence?: ConfidenceLevel | null;
  completed_at?: string | null;
  created_at: string;
}

export interface InvestigationDetail extends Investigation {
  drivers: InvestigationDriver[];
  evidence_items: EvidenceItem[];
}

export interface InvestigationAnalyzeRequest {
  company_ticker: string;
  target_date: string;
  question?: string;
  index_code?: string;
  peer_limit?: number;
  news_limit?: number;
  filings_limit?: number;
}
