import * as React from 'react';
import { Check, Loader2, X, Search, ListChecks, Database, FileText } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { AgentStatusStep } from '@/models/conversation';

/**
 * Live agent execution trail.
 * Rendered ONLY while a stream is active and built strictly from real backend
 * SSE events (`intent_detected`, `plan_created`, `tool_started/completed`,
 * `evidence_processed`, `response_generated`). No synthetic progress is ever
 * shown — if the backend emits nothing, this stays empty.
 */
export interface AgentStatusTrailProps {
  steps: AgentStatusStep[];
}

const KIND_ICON: Record<AgentStatusStep['kind'], React.ReactNode> = {
  intent: <Search className="h-4 w-4" aria-hidden="true" />,
  plan: <ListChecks className="h-4 w-4" aria-hidden="true" />,
  tool: <Database className="h-4 w-4" aria-hidden="true" />,
  evidence: <FileText className="h-4 w-4" aria-hidden="true" />,
  response: <FileText className="h-4 w-4" aria-hidden="true" />,
};

export const AgentStatusTrail: React.FC<AgentStatusTrailProps> = ({ steps }) => {
  if (steps.length === 0) return null;

  return (
    <div
      className="flex gap-3"
      role="status"
      aria-live="polite"
      aria-label="Agent execution status"
    >
      <div
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[0.25rem] bg-secondary-light text-secondary-foreground"
        aria-hidden="true"
      >
        <Loader2 className="h-4 w-4 animate-spin" />
      </div>

      <div className="w-full max-w-[80%] rounded-[0.25rem] border border-border bg-primary p-4">
        <p className="font-heading text-sm font-bold text-white">Agent working…</p>
        <ol className="mt-3 space-y-2">
          {steps.map((step) => (
            <li key={step.id} className="flex items-start gap-2 text-sm">
              <span
                className={cn(
                  'mt-0.5 shrink-0',
                  step.state === 'failed'
                    ? 'text-danger'
                    : step.state === 'active'
                      ? 'text-accent'
                      : 'text-success'
                )}
                aria-hidden="true"
              >
                {step.state === 'failed' ? (
                  <X className="h-4 w-4" />
                ) : step.state === 'active' ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Check className="h-4 w-4" />
                )}
              </span>
              <span className="flex items-center gap-2 text-secondary-foreground">
                <span className="text-muted-foreground">{KIND_ICON[step.kind]}</span>
                <span>
                  {step.label}
                  {step.detail && (
                    <span className="ml-2 font-mono text-xs text-muted-foreground">
                      {step.detail}
                    </span>
                  )}
                </span>
              </span>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
};
