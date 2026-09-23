import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Bot, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export const InvestigationAiPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [inputMessage, setInputMessage] = useState('');

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] space-y-4">
      {/* Top Navigation & Status */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-border/60 pb-3 shrink-0">
        <div className="flex items-center gap-3">
          <Link
            to={`/investigations/${id}`}
            className="flex items-center gap-1.5 text-xs text-secondary-foreground hover:text-white transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Investigation Report</span>
          </Link>
          <span className="text-secondary-foreground/40">•</span>
          <div className="flex items-center gap-2">
            <span className="font-heading font-semibold text-white text-sm">
              AI Investigation Assistant
            </span>
            <Badge variant="outline" className="font-mono text-[10px]">
              {id}
            </Badge>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant="supporting" className="text-[11px]">
            LangGraph 5-Node Agent
          </Badge>
        </div>
      </div>

      {/* Chat Messages Workspace */}
      <div className="flex-1 overflow-y-auto space-y-4 pr-1 custom-scrollbar">
        {/* Assistant Welcome Message */}
        <div className="flex gap-3 max-w-3xl">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-accent text-white shadow-md shadow-accent/20">
            <Bot className="h-5 w-5" />
          </div>
          <div className="rounded-2xl rounded-tl-sm border border-border/70 bg-surface p-4 text-sm text-foreground shadow-sm">
            <p className="font-heading font-semibold text-white mb-1.5 flex items-center gap-2">
              <span>IgniteStock Investigation Agent</span>
              <span className="text-[10px] text-accent font-mono uppercase bg-accent/15 px-1.5 py-0.5 rounded">
                Grounded on Sectors API
              </span>
            </p>
            <p className="text-secondary-foreground/90 leading-relaxed">
              Hello! I am ready to explore investigation <span className="font-mono text-white font-medium">{id}</span>.
              I can evaluate market context, check peer movements, inspect corporate filings, and synthesize supporting or contradictory evidence.
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setInputMessage('Was this price movement sector-wide or idiosyncratic?')}
                className="rounded-lg border border-border bg-secondary-light px-2.5 py-1 text-xs text-secondary-foreground hover:bg-surface-hover hover:text-white transition-colors text-left"
              >
                &ldquo;Was this movement sector-wide?&rdquo;
              </button>
              <button
                type="button"
                onClick={() => setInputMessage('Did any recent corporate disclosures or filings trigger this?')}
                className="rounded-lg border border-border bg-secondary-light px-2.5 py-1 text-xs text-secondary-foreground hover:bg-surface-hover hover:text-white transition-colors text-left"
              >
                &ldquo;Check corporate filings & disclosures&rdquo;
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Input Box */}
      <div className="shrink-0 pt-2">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            // Chat submission logic will be hooked to POST /api/agent/chat
          }}
          className="relative flex items-center rounded-xl border border-border bg-surface shadow-lg focus-within:border-accent focus-within:ring-2 focus-within:ring-accent/20 transition-all"
        >
          <input
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            placeholder="Ask the AI agent about evidence, drivers, or peers..."
            className="w-full bg-transparent px-4 py-3.5 text-sm text-foreground placeholder:text-secondary-foreground/60 focus:outline-none"
          />
          <div className="pr-2">
            <Button
              type="submit"
              size="sm"
              disabled={!inputMessage.trim()}
              className="h-8 shadow-sm shadow-accent/20"
            >
              <Send className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Send</span>
            </Button>
          </div>
        </form>
        <p className="mt-1.5 text-[11px] text-center text-secondary-foreground/60">
          Agent responses are deterministically verified against Sectors Financial API. Never uses hallucinated market data.
        </p>
      </div>
    </div>
  );
};

export default InvestigationAiPage;
