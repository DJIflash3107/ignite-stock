import type { InvestigationDetail } from './investigation';

export type MessageRole = 'user' | 'assistant' | 'system' | 'tool';

export type ToolCallStatus = 'pending' | 'success' | 'failed';

export interface AgentToolCall {
  id: string;
  conversation_id?: string | null;
  investigation_id?: string | null;
  tool_name: string;
  arguments: Record<string, unknown>;
  result?: Record<string, unknown> | null;
  status: ToolCallStatus;
  execution_time_ms?: number | null;
  created_at: string;
}

export interface Message {
  id: string;
  conversation_id: string;
  role: MessageRole;
  content: string;
  metadata?: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
}

export interface Conversation {
  id: string;
  user_id: string;
  title: string;
  investigation_id?: string | null;
  company_ticker?: string | null;
  target_date?: string | null;
  created_at: string;
  updated_at: string;
}

export interface ConversationDetail extends Conversation {
  messages: Message[];
}

export interface AgentChatRequest {
  message: string;
  conversation_id?: string | null;
  investigation_id?: string | null;
  company_ticker?: string | null;
  target_date?: string | null;
  index_code?: string;
  stream?: boolean;
}

export interface AgentInvestigateResponse extends InvestigationDetail {
  agent_tool_calls: AgentToolCall[];
  conversation_id?: string | null;
}

export interface AgentChatResponse {
  conversation_id: string;
  message_id?: string | null;
  assistant_message: string;
  investigation?: AgentInvestigateResponse | null;
  tool_calls: AgentToolCall[];
}

/** Standard success envelope for a single conversation. */
export interface ConversationDetailResponse {
  message: { success: string };
  data: { conversation: Conversation };
}

/** Paginated conversations envelope. */
export interface ConversationListResponse {
  message: { success: string };
  data: {
    conversations: Conversation[];
    pagination: { total: number; limit: number; offset: number };
  };
}

/** Paginated messages envelope. */
export interface MessageListResponse {
  message: { success: string };
  data: {
    messages: Message[];
    pagination: { total: number; limit: number; offset: number };
  };
}

/** Envelope returned by the non-streamed `POST /api/agent/chat`. */
export interface AgentChatEnvelope {
  message: { success: string };
  data: { chat: AgentChatResponse };
}

/**
 * SSE events emitted by `run_agent_stream` / `run_chat_stream`.
 * These are the ONLY source of agent execution status — never synthesised
 * client-side.
 */
export type AgentStreamEventName =
  | 'conversation_resolved'
  | 'start'
  | 'intent_detected'
  | 'plan_created'
  | 'tool_started'
  | 'tool_completed'
  | 'evidence_processed'
  | 'response_generated'
  | 'completed'
  | 'error';

export interface AgentStreamEvent {
  event: AgentStreamEventName;
  data: Record<string, unknown>;
}

/** A single turn's transient execution status, derived from real SSE events. */
export interface AgentStatusStep {
  id: string;
  label: string;
  detail?: string;
  kind: 'intent' | 'plan' | 'tool' | 'evidence' | 'response';
  state: 'active' | 'done' | 'failed';
}
