import * as React from 'react';
import { Bot, User as UserIcon, AlertTriangle, Ban } from 'lucide-react';
import { cn } from '@/lib/utils';
import { timeAgo } from '@/lib/dayjs';
import { MarkdownMessage } from './MarkdownMessage';
import type { ChatMessage } from '@/hooks/useInvestigationChat';

/**
 * A single conversation turn.
 * User turns align right; assistant turns align left with an agent mark. A
 * failed or cancelled turn is signalled by an icon + label, never colour alone.
 */
export interface MessageBubbleProps {
  message: ChatMessage;
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({ message }) => {
  const isUser = message.role === 'user';
  const isFailed = message.clientStatus === 'failed';
  const isCancelled = message.clientStatus === 'cancelled';

  return (
    <div className={cn('flex gap-3', isUser ? 'flex-row-reverse' : 'flex-row')}>
      <div
        className={cn(
          'flex h-9 w-9 shrink-0 items-center justify-center rounded-[0.25rem]',
          isUser ? 'bg-secondary-light text-secondary-foreground' : 'bg-accent text-white'
        )}
        aria-hidden="true"
      >
        {isUser ? <UserIcon className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
      </div>

      <div
        className={cn(
          'flex flex-col gap-1',
          isUser ? 'max-w-[80%] items-end' : 'w-full max-w-[92%] items-start'
        )}
      >
        <div
          className={cn(
            'rounded-[0.25rem] border px-4 py-3 text-base leading-relaxed',
            isUser
              ? 'whitespace-pre-wrap border-border bg-secondary-light text-foreground'
              : 'w-full border-border bg-primary text-foreground'
          )}
        >
          {isUser ? message.content : <MarkdownMessage content={message.content} />}
        </div>

        <div className="flex items-center gap-2 px-1">
          <span className="text-xs text-muted-foreground">{timeAgo(message.created_at)}</span>
          {isFailed && (
            <span className="flex items-center gap-1 text-xs font-bold text-danger">
              <AlertTriangle className="h-3 w-3" aria-hidden="true" />
              Not delivered
            </span>
          )}
          {isCancelled && (
            <span className="flex items-center gap-1 text-xs font-bold text-muted-foreground">
              <Ban className="h-3 w-3" aria-hidden="true" />
              Cancelled
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
