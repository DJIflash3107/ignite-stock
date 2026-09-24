/**
 * Investigation domain models.
 * Enums mirror `backend/app/models/enums.py` exactly — do not add values that
 * the backend cannot emit, and never invent fallback data on the client.
 */

export type InvestigationType = 'company' | 'index' | 'sector' | 'general';

export type InvestigationStatus =
  | 'pending'
  | 'running'
  | 'completed'
  | 'failed'
  | 'cancelled';

export type ConfidenceLevel = 'low' | 'medium' | 'high';

export type ImpactLevel = 'low' | 'medium' | 'high';

export type DriverType =
  | 'price'
  | 'volume'
  | 'fundamental'
  | 'news'
  | 'sector'
  | 'corporate_action'
  | 'market'
  | 'other';

export type EvidenceType =
  | 'price'
  | 'financial'
  | 'news'
  | 'filing'
  | 'market'
  | 'other';

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
  alignment?: EvidenceAlignment | null;
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

/** Standard success envelope: `{ message: { success }, data: { investigation } }`. */
export interface InvestigationDetailResponse {
  message: { success: string };
  data: { investigation: InvestigationDetail };
}

export interface InvestigationDriversResponse {
  message: { success: string };
  data: {
    drivers: InvestigationDriver[];
    pagination: { total: number; limit: number; offset: number };
  };
}

export interface InvestigationEvidenceResponse {
  message: { success: string };
  data: {
    evidence: EvidenceItem[];
    pagination: { total: number; limit: number; offset: number };
  };
}

/** A single peer entry as returned by the company report / impact endpoints. */
export interface PeerEntry {
  symbol: string;
  return?: number | null;
  [key: string]: unknown;
}

export interface CompanyMarketContext {
  ticker: string;
  company_name: string;
  overview: Record<string, unknown>;
  valuation: Record<string, unknown>;
  market_comparison: { company_change: number | null; market_change: number | null };
  sector_comparison: { company_change: number | null; sector_change: number | null };
  peers: PeerEntry[];
}

export interface CompanyMarketContextResponse {
  message: { success: string };
  data: { market_context: CompanyMarketContext };
}


