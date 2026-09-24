import * as React from 'react';
import { Bot } from 'lucide-react';
import { MessageBubble } from './MessageBubble';
import { AgentStatusTrail } from './AgentStatusTrail';
import type { AgentStatusStep } from '@/models/conversation';
import type { ChatMessage } from '@/hooks/useInvestigationChat';

/**
 * Scrollable conversation transcript.
 * Auto-scrolls to the newest content only while the user is already pinned to
 * the bottom, so it never fights a user who has scrolled up to read history.
 */
export interface MessageListProps {
  messages: ChatMessage[];
  statusSteps: AgentStatusStep[];
  isResolving: boolean;
  intro: React.ReactNode;
}

export const MessageList: React.FC<MessageListProps> = ({
  messages,
  statusSteps,
  isResolving,
  intro,
}) => {
  const scrollRef = React.useRef<HTMLDivElement>(null);
  const pinnedRef = React.useRef(true);

  const handleScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    pinnedRef.current = distanceFromBottom < 80;
  };

  React.useEffect(() => {
    const el = scrollRef.current;
    if (!el || !pinnedRef.current) return;
    el.scrollTop = el.scrollHeight;
  }, [messages, statusSteps]);

  const showIntro = messages.length === 0 && !isResolving;

  return (
    <div
      ref={scrollRef}
      onScroll={handleScroll}
      className="flex-1 space-y-6 overflow-y-auto pr-1 custom-scrollbar"
    >
      {isResolving && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Bot className="h-4 w-4 animate-pulse" aria-hidden="true" />
          <span>Loading conversation…</span>
        </div>
      )}

      {showIntro && intro}

      {messages.map((message) => (
        <MessageBubble key={message.id} message={message} />
      ))}

      {statusSteps.length > 0 && <AgentStatusTrail steps={statusSteps} />}
    </div>
  );
};
