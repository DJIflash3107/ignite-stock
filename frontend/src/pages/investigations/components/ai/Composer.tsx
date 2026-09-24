import * as React from 'react';
import { Send, Square } from 'lucide-react';
import { Button } from '@/components/ui/button';

/**
 * Message composer.
 * The accent Send button is the single primary CTA. While a turn streams, Send
 * is replaced by a neutral Stop control that aborts the in-flight request.
 * Enter submits; Shift+Enter inserts a newline.
 */
export interface ComposerProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  onCancel: () => void;
  isStreaming: boolean;
  disabled?: boolean;
}

export const Composer: React.FC<ComposerProps> = ({
  value,
  onChange,
  onSubmit,
  onCancel,
  isStreaming,
  disabled = false,
}) => {
  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      if (!isStreaming && value.trim()) onSubmit();
    }
  };

  const canSend = value.trim().length > 0 && !isStreaming && !disabled;

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        if (canSend) onSubmit();
      }}
      className="flex items-end gap-2 rounded-[0.25rem] border border-border bg-primary p-2 transition-colors focus-within:border-accent focus-within:ring-2 focus-within:ring-accent"
    >
      <textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onKeyDown={handleKeyDown}
        rows={1}
        placeholder="Ask the AI agent about evidence, drivers, or peers…"
        disabled={disabled}
        className="max-h-40 min-h-[2.5rem] w-full resize-none bg-transparent px-3 py-2 text-base text-foreground placeholder:text-muted-foreground focus:outline-none disabled:opacity-50"
      />

      {isStreaming ? (
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={onCancel}
          className="shrink-0"
        >
          <Square className="h-4 w-4" aria-hidden="true" />
          <span className="hidden sm:inline">Stop</span>
        </Button>
      ) : (
        <Button type="submit" size="sm" disabled={!canSend} className="shrink-0">
          <Send className="h-4 w-4" aria-hidden="true" />
          <span className="hidden sm:inline">Send</span>
        </Button>
      )}
    </form>
  );
};
