import type { AgentStatusStep, AgentStreamEvent } from '@/models/conversation';

/**
 * Human labels for the agent's execution events.
 * ---------------------------------------------------------------------------
 * These map REAL backend SSE events to concise status text. Nothing here
 * invents progress: if the backend never emits a step, the UI never shows it.
 */

export const TOOL_LABELS: Record<string, string> = {
  get_stock_movement: 'Retrieving stock price movement',
  get_market_context: 'Retrieving market context',
  get_sector_context: 'Retrieving sector context',
  get_peer_movements: 'Retrieving peer movements',
  get_company_news: 'Retrieving company news',
  get_company_filings: 'Retrieving company filings',
  get_company_financials: 'Retrieving company financials',
};

export function toolLabel(toolName: string): string {
  return TOOL_LABELS[toolName] ?? `Running ${toolName.replace(/_/g, ' ')}`;
}

let stepCounter = 0;
function nextId(prefix: string): string {
  stepCounter += 1;
  return `${prefix}-${stepCounter}`;
}

/**
 * Maps one real SSE event to a status step. Returns null for events that are
 * not surfaced in the trail (e.g. `conversation_resolved`, `start`, `completed`).
 */
export function statusStepFor(event: AgentStreamEvent): AgentStatusStep | null {
  switch (event.event) {
    case 'intent_detected':
      return {
        id: nextId('intent'),
        kind: 'intent',
        label: 'Understanding your question',
        state: 'done',
      };
    case 'plan_created': {
      const plan = Array.isArray(event.data.plan) ? event.data.plan : [];
      return {
        id: nextId('plan'),
        kind: 'plan',
        label: 'Planning investigation',
        detail: plan.length ? `${plan.length} step${plan.length === 1 ? '' : 's'} selected` : undefined,
        state: 'done',
      };
    }
    case 'tool_started': {
      const toolName = typeof event.data.tool_name === 'string' ? event.data.tool_name : 'tool';
      return {
        id: `tool-${toolName}`,
        kind: 'tool',
        label: toolLabel(toolName),
        state: 'active',
      };
    }
    case 'tool_completed': {
      const toolName = typeof event.data.tool_name === 'string' ? event.data.tool_name : 'tool';
      const status = typeof event.data.status === 'string' ? event.data.status : '';
      const ms =
        typeof event.data.execution_time_ms === 'number' ? event.data.execution_time_ms : null;
      return {
        id: `tool-${toolName}`,
        kind: 'tool',
        label: toolLabel(toolName),
        detail: [status, ms !== null ? `${ms} ms` : null].filter(Boolean).join(' · ') || undefined,
        state: status === 'failed' ? 'failed' : 'done',
      };
    }
    case 'evidence_processed': {
      const evidenceCount =
        typeof event.data.evidence_count === 'number' ? event.data.evidence_count : null;
      const driversCount =
        typeof event.data.drivers_count === 'number' ? event.data.drivers_count : null;
      return {
        id: nextId('evidence'),
        kind: 'evidence',
        label: 'Synthesising evidence',
        detail:
          evidenceCount !== null && driversCount !== null
            ? `${evidenceCount} evidence item${evidenceCount === 1 ? '' : 's'} · ${driversCount} driver${driversCount === 1 ? '' : 's'}`
            : undefined,
        state: 'done',
      };
    }
    case 'response_generated':
      return {
        id: nextId('response'),
        kind: 'response',
        label: 'Composing response',
        state: 'done',
      };
    default:
      return null;
  }
}

/**
 * Merges a new step into the existing trail. Tool steps with the same id are
 * updated in place (started -> completed) so a tool never appears twice.
 */
export function mergeStatusStep(
  steps: AgentStatusStep[],
  incoming: AgentStatusStep
): AgentStatusStep[] {
  const index = steps.findIndex((step) => step.id === incoming.id);
  if (index === -1) return [...steps, incoming];
  const next = [...steps];
  next[index] = incoming;
  return next;
}
