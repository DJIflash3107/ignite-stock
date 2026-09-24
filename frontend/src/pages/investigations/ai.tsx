import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Bot, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

/**
 * AI investigation assistant.
 * Chat workspace on the 60% primary surface. The composer uses a 0.25rem
 * radius and the accent is reserved for the send CTA. Message bubbles keep a
 * small radius rather than large pill shapes.
 */
export const InvestigationAiPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [inputMessage, setInputMessage] = useState('');

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] gap-4">
      {/* Top navigation & status */}
      <div className="flex flex-col gap-3 border-b border-border pb-4 shrink-0 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Link
            to={`/investigations/${id}`}
            className="flex items-center gap-1.5 rounded-[0.25rem] text-sm text-secondary-foreground hover:text-white transition-colors"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            <span>Investigation Report</span>
          </Link>
          <span className="text-border" aria-hidden="true">|</span>
          <div className="flex items-center gap-2">
            <span className="font-heading text-base font-bold text-white">
              AI Investigation Assistant
            </span>
            <Badge variant="outline" className="font-mono">
              {id}
            </Badge>
          </div>
        </div>

        <Badge variant="secondary">LangGraph 5-Node Agent</Badge>
      </div>

      {/* Conversation workspace */}
      <div className="flex-1 overflow-y-auto space-y-6 pr-1 custom-scrollbar">
        <div className="flex gap-3 max-w-3xl">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[0.25rem] bg-accent text-white">
            <Bot className="h-5 w-5" aria-hidden="true" />
          </div>
          <div className="rounded-[0.25rem] border border-border bg-primary p-4 text-base">
            <p className="flex flex-wrap items-center gap-2 font-heading font-bold text-white">
              <span>IgniteStock Investigation Agent</span>
              <span className="rounded-[0.25rem] bg-accent/15 px-2 py-0.5 font-mono text-xs font-normal text-accent">
                Grounded on Sectors API
              </span>
            </p>
            <p className="mt-2 text-secondary-foreground leading-relaxed">
              Hello! I am ready to explore investigation{' '}
              <span className="font-mono text-white">{id}</span>. I can evaluate market
              context, check peer movements, inspect corporate filings, and synthesize
              supporting or contradictory evidence.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setInputMessage('Was this price movement sector-wide or idiosyncratic?')}
                className="rounded-[0.25rem] border border-border bg-secondary-light px-3 py-2 text-sm text-secondary-foreground hover:bg-surface-hover hover:text-white transition-colors text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
              >
                &ldquo;Was this movement sector-wide?&rdquo;
              </button>
              <button
                type="button"
                onClick={() => setInputMessage('Did any recent corporate disclosures or filings trigger this?')}
                className="rounded-[0.25rem] border border-border bg-secondary-light px-3 py-2 text-sm text-secondary-foreground hover:bg-surface-hover hover:text-white transition-colors text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
              >
                &ldquo;Check corporate filings &amp; disclosures&rdquo;
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Composer */}
      <div className="shrink-0 pt-2">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            // Chat submission logic will be hooked to POST /api/agent/chat
          }}
          className="flex items-center gap-2 rounded-[0.25rem] border border-border bg-primary p-2 focus-within:border-accent focus-within:ring-2 focus-within:ring-accent transition-colors"
        >
          <input
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            placeholder="Ask the AI agent about evidence, drivers, or peers..."
            className="w-full bg-transparent px-3 py-2 text-base text-foreground placeholder:text-muted-foreground focus:outline-none"
          />
          <Button
            type="submit"
            size="sm"
            disabled={!inputMessage.trim()}
            className="shrink-0"
          >
            <Send className="h-4 w-4" aria-hidden="true" />
            <span className="hidden sm:inline">Send</span>
          </Button>
        </form>
        <p className="mt-2 text-center text-sm text-muted-foreground">
          Agent responses are deterministically verified against Sectors Financial API. Never uses hallucinated market data.
        </p>
      </div>
    </div>
  );
};

export default InvestigationAiPage;
