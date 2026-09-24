import * as React from 'react';
import { Bot } from 'lucide-react';
import { ErrorDisplay } from '@/components/feedback/ErrorDisplay';
import { MessageList } from './MessageList';
import { Composer } from './Composer';
import { SuggestedQuestions } from './SuggestedQuestions';
import type { UseInvestigationChatResult } from '@/hooks/useInvestigationChat';

/**
 * Left pane: the AI conversation.
 * Composes the transcript, real agent status trail, inline error + retry, and
 * the composer. Suggested questions are offered whenever the transcript is
 * empty so the workspace is immediately actionable.
 */
export interface ConversationPanelProps {
  chat: UseInvestigationChatResult;
  investigationId: string;
}

export const ConversationPanel: React.FC<ConversationPanelProps> = ({
  chat,
  investigationId,
}) => {
  const [input, setInput] = React.useState('');

  const {
    messages,
    statusSteps,
    isResolving,
    isStreaming,
    error,
    lastFailedMessage,
    send,
    retry,
    cancel,
    clearError,
  } = chat;

  const handleSubmit = () => {
    const text = input.trim();
    if (!text) return;
    send(text);
    setInput('');
  };

  const handleSuggestion = (question: string) => {
    send(question);
  };

  const intro = (
    <div className="flex gap-3">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[0.25rem] bg-accent text-white">
        <Bot className="h-5 w-5" aria-hidden="true" />
      </div>
      <div className="rounded-[0.25rem] border border-border bg-primary p-4">
        <p className="flex flex-wrap items-center gap-2 font-heading font-bold text-white">
          <span>IgniteStock Investigation Agent</span>
          <span className="rounded-[0.25rem] bg-accent/15 px-2 py-0.5 font-mono text-xs font-normal text-accent">
            Grounded on Sectors API
          </span>
        </p>
        <p className="mt-2 text-secondary-foreground leading-relaxed">
          Ask follow-up questions about this investigation&apos;s movement, sector
          context, peers, fundamentals, and evidence. The agent runs the 5-node
          LangGraph workflow for every turn and reports its real execution steps.
        </p>
        <div className="mt-4">
          <SuggestedQuestions onSelect={handleSuggestion} disabled={isStreaming || isResolving} />
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4">
      <MessageList
        messages={messages}
        statusSteps={statusSteps}
        isResolving={isResolving}
        intro={intro}
      />

      <div className="shrink-0 space-y-3 pt-2">
        {error && (
          <ErrorDisplay
            compact
            title="Agent request failed"
            message={error}
            onRetry={lastFailedMessage ? retry : undefined}
          />
        )}

        {messages.length > 0 && (
          <SuggestedQuestions onSelect={handleSuggestion} disabled={isStreaming || isResolving} />
        )}

        <Composer
          value={input}
          onChange={(value) => {
            setInput(value);
            if (error) clearError();
          }}
          onSubmit={handleSubmit}
          onCancel={cancel}
          isStreaming={isStreaming}
          disabled={isResolving || !investigationId}
        />

        <p className="text-center text-xs text-muted-foreground">
          Agent responses are verified against the Sectors Financial API. IgniteStock
          never fabricates market data.
        </p>
      </div>
    </div>
  );
};
