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
