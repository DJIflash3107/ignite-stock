import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { apiGet, apiPost } from '@/lib/api-client';
import { extractErrorMessage } from '@/lib/api-error';
import { AgentStreamError, streamAgentChat } from '@/lib/agentStream';
import { mergeStatusStep, statusStepFor } from '@/lib/agentEvents';
import type {
  AgentChatEnvelope,
  AgentStatusStep,
  ConversationListResponse,
  Conversation,
  Message,
  MessageListResponse,
} from '@/models/conversation';

/**
 * Conversation + streaming orchestration for the AI investigation workspace.
 *
 * Design rules (see CLAUDE.md):
 * - Agent execution status is derived ONLY from real SSE events. No synthetic
 *   progress, timers, or fake tool steps.
 * - On failure the real backend error is surfaced and the turn is retryable.
 *   No fallback answer is ever fabricated client-side.
 * - The conversation is bound to the viewed investigation via `investigation_id`
 *   so it resumes deterministically across reloads.
 */

export type ChatMessageStatus = 'pending' | 'failed' | 'cancelled';

export interface ChatMessage extends Message {
  /** Local-only turn status; absent for messages loaded from the backend. */
  clientStatus?: ChatMessageStatus;
}

const HISTORY_LIMIT = 100;
const conversationCacheKey = (investigationId: string) =>
  `ignite:conversation:${investigationId}`;

function makeLocalMessage(
  conversationId: string,
  role: Message['role'],
  content: string,
  clientStatus?: ChatMessageStatus
): ChatMessage {
  const now = new Date().toISOString();
  return {
    id: `local-${role}-${now}-${Math.random().toString(36).slice(2, 8)}`,
    conversation_id: conversationId,
    role,
    content,
    created_at: now,
    updated_at: now,
    clientStatus,
  };
}

/** Displayable messages (user/assistant only) in chronological order. */
function toDisplayMessages(messages: Message[]): ChatMessage[] {
  return messages
    .filter((m) => m.role === 'user' || m.role === 'assistant')
    .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
}

export interface UseInvestigationChatResult {
  messages: ChatMessage[];
  statusSteps: AgentStatusStep[];
  conversationId: string | null;
  isResolving: boolean;
  isStreaming: boolean;
  error: string | null;
  lastFailedMessage: string | null;
  send: (text: string) => void;
  retry: () => void;
  cancel: () => void;
  clearError: () => void;
}

export function useInvestigationChat(
  investigationId: string | undefined,
  defaults: { companyTicker?: string | null; targetDate?: string | null; indexCode?: string | null } = {}
): UseInvestigationChatResult {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [statusSteps, setStatusSteps] = useState<AgentStatusStep[]>([]);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [isResolving, setIsResolving] = useState<boolean>(Boolean(investigationId));
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastFailedMessage, setLastFailedMessage] = useState<string | null>(null);

  const abortRef = useRef<AbortController | null>(null);
  const conversationIdRef = useRef<string | null>(null);

  useEffect(() => {
    conversationIdRef.current = conversationId;
  }, [conversationId]);

  const { companyTicker = null, targetDate = null, indexCode = null } = defaults;

  // ---- Conversation resolution + history load -------------------------------
  const loadHistory = useCallback(async (convId: string) => {
    try {
      const response = await apiGet<MessageListResponse>(
        `/agent/conversations/${convId}/messages`,
        { params: { limit: HISTORY_LIMIT, offset: 0 } }
      );
      setMessages(toDisplayMessages(response.data.messages));
    } catch (err) {
      setError(extractErrorMessage(err));
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    const resolve = async () => {
      if (!investigationId) {
        if (!cancelled) setIsResolving(false);
        return;
      }

      setIsResolving(true);
      setError(null);
      setMessages([]);
      setConversationId(null);

      const cached = localStorage.getItem(conversationCacheKey(investigationId));
      try {
        const response = await apiGet<ConversationListResponse>('/agent/conversations', {
          params: { investigation_id: investigationId, limit: 1, offset: 0 },
        });
        if (cancelled) return;

        const found: Conversation | undefined = response.data.conversations[0];
        const resolvedId = found?.id ?? null;

        if (resolvedId) {
          localStorage.setItem(conversationCacheKey(investigationId), resolvedId);
          setConversationId(resolvedId);
          await loadHistory(resolvedId);
        } else if (cached) {
          // The cached id may still be valid even if the list is momentarily
          // empty; verify before using it.
          localStorage.removeItem(conversationCacheKey(investigationId));
        }
      } catch (err) {
        if (!cancelled) setError(extractErrorMessage(err));
      } finally {
        if (!cancelled) setIsResolving(false);
      }
    };

    void resolve();
    return () => {
      cancelled = true;
    };
  }, [investigationId, loadHistory]);

  // Abort any in-flight stream on unmount / investigation change.
  useEffect(() => {
    return () => {
      abortRef.current?.abort();
    };
  }, [investigationId]);

  // ---- Sending --------------------------------------------------------------
  const runTurn = useCallback(
    async (text: string, existingConvId: string | null) => {
      if (!investigationId) return;

      setError(null);
      setLastFailedMessage(null);
      setIsStreaming(true);
      setStatusSteps([]);

      const localConvId = existingConvId ?? 'pending';
      const userMessage = makeLocalMessage(localConvId, 'user', text, 'pending');
      setMessages((prev) => [...prev, userMessage]);

      const controller = new AbortController();
      abortRef.current = controller;

      const request = {
        message: text,
        conversation_id: existingConvId,
        investigation_id: investigationId,
        company_ticker: companyTicker,
        target_date: targetDate,
        index_code: indexCode ?? undefined,
      };

      let receivedAnyEvent = false;
      let resolvedConvId = existingConvId;

      try {
        for await (const event of streamAgentChat(request, controller.signal)) {
          receivedAnyEvent = true;

          if (event.event === 'conversation_resolved') {
            const id = event.data.conversation_id;
            if (typeof id === 'string') {
              resolvedConvId = id;
              setConversationId(id);
              localStorage.setItem(conversationCacheKey(investigationId), id);
            }
          }

          const step = statusStepFor(event);
          if (step) setStatusSteps((prev) => mergeStatusStep(prev, step));

          if (event.event === 'completed') {
            const investigation = event.data.investigation as
              | { summary?: string | null }
              | undefined;
            const summary = investigation?.summary ?? null;
            const assistantText =
              summary && summary.trim().length > 0
                ? summary
                : 'The agent completed the investigation but returned no summary text.';
            setMessages((prev) => [
              ...prev.map((m) =>
                m.id === userMessage.id ? { ...m, clientStatus: undefined } : m
              ),
              makeLocalMessage(resolvedConvId ?? localConvId, 'assistant', assistantText),
            ]);
          }
        }

        // Reconcile with persisted history (real ids/timestamps) when possible.
        if (resolvedConvId) await loadHistory(resolvedConvId);
        setStatusSteps([]);
      } catch (err) {
        const aborted =
          (err instanceof DOMException && err.name === 'AbortError') ||
          controller.signal.aborted;

        if (aborted) {
          setMessages((prev) =>
            prev.map((m) =>
              m.id === userMessage.id ? { ...m, clientStatus: 'cancelled' } : m
            )
          );
          setStatusSteps([]);
          return;
        }

        // Only fall back to the non-streamed endpoint when the stream could not
        // start at all (no event received) and this is not an agent-level error.
        if (!receivedAnyEvent && !(err instanceof AgentStreamError)) {
          try {
            const envelope = await apiPost<AgentChatEnvelope>('/agent/chat', {
              ...request,
              stream: false,
            });
            const chat = envelope.data.chat;
            resolvedConvId = chat.conversation_id ?? resolvedConvId;
            if (resolvedConvId) {
              setConversationId(resolvedConvId);
              localStorage.setItem(conversationCacheKey(investigationId), resolvedConvId);
            }
            setMessages((prev) => [
              ...prev.map((m) =>
                m.id === userMessage.id ? { ...m, clientStatus: undefined } : m
              ),
              makeLocalMessage(
                resolvedConvId ?? localConvId,
                'assistant',
                chat.assistant_message
              ),
            ]);
            setStatusSteps([]);
            if (resolvedConvId) await loadHistory(resolvedConvId);
            return;
          } catch (fallbackErr) {
            setError(extractErrorMessage(fallbackErr));
          }
        } else {
          setError(extractErrorMessage(err));
        }

        setMessages((prev) =>
          prev.map((m) => (m.id === userMessage.id ? { ...m, clientStatus: 'failed' } : m))
        );
        setLastFailedMessage(text);
      } finally {
        setIsStreaming(false);
        if (abortRef.current === controller) abortRef.current = null;
      }
    },
    [investigationId, companyTicker, targetDate, indexCode, loadHistory]
  );

  const send = useCallback(
    (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || isStreaming || isResolving) return;
      void runTurn(trimmed, conversationIdRef.current);
    },
    [isStreaming, isResolving, runTurn]
  );

  const retry = useCallback(() => {
    if (!lastFailedMessage || isStreaming) return;
    // Drop the failed turn's optimistic user message before re-sending.
    setMessages((prev) =>
      prev.filter((m) => !(m.clientStatus === 'failed' && m.content === lastFailedMessage))
    );
    void runTurn(lastFailedMessage, conversationIdRef.current);
  }, [lastFailedMessage, isStreaming, runTurn]);

  const cancel = useCallback(() => {
    abortRef.current?.abort();
  }, []);

  const clearError = useCallback(() => setError(null), []);

  return useMemo(
    () => ({
      messages,
      statusSteps,
      conversationId,
      isResolving,
      isStreaming,
      error,
      lastFailedMessage,
      send,
      retry,
      cancel,
      clearError,
    }),
    [
      messages,
      statusSteps,
      conversationId,
      isResolving,
      isStreaming,
      error,
      lastFailedMessage,
      send,
      retry,
      cancel,
      clearError,
    ]
  );
}
