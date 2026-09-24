import { TOKEN_STORAGE_KEY } from './api-client';
import { ApiError } from './api-error';
import type {
  AgentChatRequest,
  AgentStreamEvent,
  AgentStreamEventName,
} from '@/models/conversation';

/**
 * Server-Sent Events client for `POST /api/agent/chat` with `stream: true`.
 *
 * Axios cannot consume a browser streaming response body, so this module uses
 * `fetch` + `ReadableStream` directly. It never fabricates data: a non-2xx
 * response or an `error` frame surfaces the real backend error as an
 * `ApiError`, and an aborted request throws a `DOMException` the caller can
 * treat as a cancellation.
 */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';

const KNOWN_EVENTS: readonly AgentStreamEventName[] = [
  'conversation_resolved',
  'start',
  'intent_detected',
  'plan_created',
  'tool_started',
  'tool_completed',
  'evidence_processed',
  'response_generated',
  'completed',
  'error',
];

function isKnownEvent(name: string): name is AgentStreamEventName {
  return (KNOWN_EVENTS as readonly string[]).includes(name);
}

/** Thrown when the backend emits an `error` SSE frame. */
export class AgentStreamError extends ApiError {
  constructor(message: string) {
    super(message, 'AGENT_STREAM_ERROR', 200);
    this.name = 'AgentStreamError';
  }
}

/**
 * Parses a single SSE frame (`event:` + `data:` lines) into an event.
 * Returns null for comment/keep-alive frames or unknown event names.
 */
function parseFrame(frame: string): AgentStreamEvent | null {
  let eventName = 'message';
  const dataLines: string[] = [];

  for (const rawLine of frame.split('\n')) {
    const line = rawLine.replace(/\r$/, '');
    if (line === '' || line.startsWith(':')) continue;
    if (line.startsWith('event:')) {
      eventName = line.slice('event:'.length).trim();
    } else if (line.startsWith('data:')) {
      dataLines.push(line.slice('data:'.length).replace(/^ /, ''));
    }
  }

  if (dataLines.length === 0 || !isKnownEvent(eventName)) return null;

  let data: Record<string, unknown>;
  try {
    const parsed = JSON.parse(dataLines.join('\n'));
    data = parsed && typeof parsed === 'object' ? (parsed as Record<string, unknown>) : {};
  } catch {
    return null;
  }

  return { event: eventName, data };
}

/**
 * Opens a streaming chat request and yields parsed SSE events until the stream
 * ends. Throws `ApiError` for HTTP/agent failures and `DOMException` on abort.
 */
export async function* streamAgentChat(
  request: AgentChatRequest,
  signal: AbortSignal
): AsyncGenerator<AgentStreamEvent, void, unknown> {
  const token = localStorage.getItem(TOKEN_STORAGE_KEY);

  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}/agent/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'text/event-stream',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ ...request, stream: true }),
      signal,
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') throw error;
    throw new ApiError(
      'Unable to connect to IgniteStock services. Please check your connection.',
      'NETWORK_ERROR',
      0
    );
  }

  if (response.status === 401) {
    localStorage.removeItem(TOKEN_STORAGE_KEY);
    window.dispatchEvent(new CustomEvent('auth:unauthorized'));
  }

  if (!response.ok) {
    // Read the real backend error envelope; never substitute a fallback answer.
    let message = `Request failed with status ${response.status}`;
    let code = 'HTTP_ERROR';
    let details: Record<string, unknown> | undefined;
    try {
      const body = await response.json();
      const err = (body as { error?: { code?: string; message?: string; details?: Record<string, unknown> } })
        ?.error;
      if (err?.message) {
        message = err.message;
        code = err.code ?? code;
        details = err.details;
      } else if (typeof (body as { message?: unknown })?.message === 'string') {
        message = (body as { message: string }).message;
      }
    } catch {
      /* keep the status-based message */
    }
    throw new ApiError(message, code, response.status, details);
  }

  if (!response.body) {
    throw new ApiError('The agent returned an empty response stream.', 'EMPTY_STREAM', 200);
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });

      let boundary = buffer.indexOf('\n\n');
      while (boundary !== -1) {
        const frame = buffer.slice(0, boundary);
        buffer = buffer.slice(boundary + 2);

        const parsed = parseFrame(frame);
        if (parsed) {
          if (parsed.event === 'error') {
            const message =
              typeof parsed.data.error === 'string'
                ? parsed.data.error
                : 'The agent failed to complete this request.';
            throw new AgentStreamError(message);
          }
          yield parsed;
        }

        boundary = buffer.indexOf('\n\n');
      }
    }

    // Flush a trailing frame without a closing blank line.
    const trailing = parseFrame(buffer);
    if (trailing && trailing.event !== 'error') yield trailing;
  } finally {
    reader.releaseLock();
  }
}
