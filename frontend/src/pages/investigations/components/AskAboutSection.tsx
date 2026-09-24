import * as React from 'react';
import { useNavigate } from 'react-router-dom';
import { Bot } from 'lucide-react';
import { Button } from '@/components/ui/button';

/**
 * "Ask about this investigation" — the single accent CTA on the report page.
 * Navigates to the AI assistant. Suggested prompts are informational only and
 * route to the assistant; nothing is submitted from here.
 */

export interface AskAboutSectionProps {
  investigationId: string;
  ticker?: string | null;
}

const SUGGESTIONS = [
  'Was this movement sector-wide?',
  'Did any corporate disclosures trigger this?',
  'Show me contradictory evidence',
];

export const AskAboutSection: React.FC<AskAboutSectionProps> = ({
  investigationId,
  ticker,
}) => {
  const navigate = useNavigate();
  const goToAssistant = () => navigate(`/investigations/${investigationId}/ai`);

  return (
    <div className="flex flex-col gap-4 rounded-[0.25rem] border border-accent/40 bg-accent/5 p-6 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h3 className="font-heading text-xl font-bold text-white">
          Ask about this investigation
        </h3>
        <p className="mt-1 text-sm text-secondary-foreground leading-relaxed">
          Continue with the AI Investigation Agent
          {ticker ? ` for ${ticker}` : ''}: explore drivers, peers, and contradictory evidence.
        </p>
        <ul className="mt-3 flex flex-wrap gap-2">
          {SUGGESTIONS.map((suggestion) => (
            <li
              key={suggestion}
              className="rounded-[0.25rem] border border-border bg-secondary px-3 py-1.5 text-xs text-secondary-foreground"
            >
              {suggestion}
            </li>
          ))}
        </ul>
      </div>
      <Button variant="default" onClick={goToAssistant} className="shrink-0">
        <Bot className="h-4 w-4" aria-hidden="true" />
        <span>Ask the AI Agent</span>
      </Button>
    </div>
  );
};
