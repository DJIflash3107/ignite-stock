import * as React from 'react';
import { Sparkles } from 'lucide-react';

/**
 * Contextual suggested questions. Clicking a suggestion sends it immediately.
 * These are fixed conversational prompts — they never inject market facts.
 */
const SUGGESTED_QUESTIONS: string[] = [
  'Was this sector-wide?',
  'Compare it with BMRI.',
  'Did the fundamentals change?',
  'Show me the evidence.',
];

export interface SuggestedQuestionsProps {
  onSelect: (question: string) => void;
  disabled?: boolean;
}

export const SuggestedQuestions: React.FC<SuggestedQuestionsProps> = ({
  onSelect,
  disabled = false,
}) => (
  <div className="flex flex-wrap gap-2">
    {SUGGESTED_QUESTIONS.map((question) => (
      <button
        key={question}
        type="button"
        disabled={disabled}
        onClick={() => onSelect(question)}
        className="flex items-center gap-2 rounded-[0.25rem] border border-border bg-secondary-light px-3 py-2 text-left text-sm text-secondary-foreground transition-colors hover:bg-surface-hover hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:pointer-events-none disabled:opacity-50"
      >
        <Sparkles className="h-3.5 w-3.5 shrink-0 text-muted-foreground" aria-hidden="true" />
        <span>{question}</span>
      </button>
    ))}
  </div>
);
