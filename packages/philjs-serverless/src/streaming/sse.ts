/**
 * PhilJS Serverless SSE (Server-Sent Events)
 *
 * Utilities for creating Server-Sent Events streams.
 */

import type { SSEMessage, SSEOptions } from '../types.js';

/**
 * Default SSE options
 */
const defaultSSEOptions: Required<SSEOptions> = {
  keepAliveInterval: 30000, // 30 seconds
  keepAliveMessage: ':keep-alive\n\n',
  retry: 3000,
};

/**
 * Format an SSE message
 */
function formatSSEMessage(message: SSEMessage): string {
  const lines: string[] = [];

  if (message.id !== undefined) {
    lines.push(`id: ${message.id}`);
  }

  if (message.event !== undefined) {
    lines.push(`event: ${message.event}`);
  }

  if (message.retry !== undefined) {
    lines.push(`retry: ${message.retry}`);
  }

  const data = typeof message.data === 'string' ? message.data : JSON.stringify(message.data);

  // Split data by newlines and prefix each line with "data: "
  data.split('\n').forEach((line) => {
    lines.push(`data: ${line}`);
  });

  return lines.join('\n') + '\n\n';
}

/**
 * SSE controller for managing the event stream
 */
export interface SSEController {
  /** Send an event */
  send(message: SSEMessage): void;
  /** Send a named event with data */
  sendEvent(event: string, data: string | object, id?: string): void;
  /** Send data without event name */
  sendData(data: string | object, id?: string): void;
  /** Send a comment (for keep-alive) */
  sendComment(comment: string): void;
  /** Close the stream */
  close(): void;
  /** Check if the stream is closed */
  isClosed(): boolean;
}

/**
 * Create an SSE stream
 *
 * @example
 * ```typescript
 * import { createSSEStream } from '@philjs/serverless';
 *
 * export default async function handler(request) {
 *   const { response, controller } = createSSEStream();
 *
 *   // Send events
 *   controller.sendEvent('message', { text: 'Hello!' });
 *
 *   // Stream data over time
 *   for (let i = 0; i < 10; i++) {
 *     await new Promise(r => setTimeout(r, 1000));
 *     controller.sendData({ count: i });
 *   }
 *
 *   controller.close();
 *   return response;
 * }
 * ```
 */
export function createSSEStream(
  options: SSEOptions = {}
): { response: Response; controller: SSEController } {
  const opts = { ...defaultSSEOptions, ...options };

  let closed = false;
  let keepAliveInterval: ReturnType<typeof setInterval> | null = null;
  let controller: ReadableStreamDefaultController<Uint8Array>;

  const encoder = new TextEncoder();

  const stream = new ReadableStream<Uint8Array>({
    start(ctrl) {
      controller = ctrl;

      // Send initial retry interval
      if (opts.retry) {
        ctrl.enqueue(encoder.encode(`retry: ${opts.retry}\n\n`));
      }

      // Set up keep-alive
      if (opts.keepAliveInterval > 0) {
        keepAliveInterval = setInterval(() => {
          if (!closed) {
            try {
              ctrl.enqueue(encoder.encode(opts.keepAliveMessage));
            } catch {
              // Stream might be closed
            }
          }
        }, opts.keepAliveInterval);
      }
    },

    cancel() {
      closed = true;
      if (keepAliveInterval) {
        clearInterval(keepAliveInterval);
        keepAliveInterval = null;
      }
    },
  });

  const sseController: SSEController = {
    send(message: SSEMessage): void {
      if (closed) return;
      try {
        controller.enqueue(encoder.encode(formatSSEMessage(message)));
      } catch {
        closed = true;
      }
    },

    sendEvent(event: string, data: string | object, id?: string): void {
      const message: SSEMessage = { event, data };
      if (id !== undefined) {
        message.id = id;
      }
      this.send(message);
    },

    sendData(data: string | object, id?: string): void {
      const message: SSEMessage = { data };
      if (id !== undefined) {
        message.id = id;
      }
      this.send(message);
    },

    sendComment(comment: string): void {
      if (closed) return;
      try {
        const lines = comment.split('\n').map((line) => `: ${line}`).join('\n');
        controller.enqueue(encoder.encode(lines + '\n\n'));
      } catch {
        closed = true;
      }
    },

    close(): void {
      if (closed) return;
      closed = true;

      if (keepAliveInterval) {
        clearInterval(keepAliveInterval);
        keepAliveInterval = null;
      }

      try {
        controller.close();
      } catch {
        // Already closed
      }
    },

    isClosed(): boolean {
      return closed;
    },
  };

  const response = new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no', // Disable nginx buffering
    },
  });

  return { response, controller: sseController };
}

/**
 * Create an SSE stream with a generator function
 *
 * @example
 * ```typescript
 * import { createSSEHandler } from '@philjs/serverless';
 *
 * export default createSSEHandler(async function* (ctx) {
 *   yield { event: 'start', data: { time: Date.now() } };
 *
 *   for (let i = 0; i < 10; i++) {
 *     await new Promise(r => setTimeout(r, 1000));
 *     yield { data: { count: i } };
 *   }
 *
 *   yield { event: 'end', data: { time: Date.now() } };
 * });
 * ```
 */
export function createSSEHandler<State = Record<string, unknown>>(
  generator: (ctx: {
    request: Request;
    signal: AbortSignal;
    state: State;
  }) => AsyncGenerator<SSEMessage, void, unknown>,
  options: SSEOptions = {}
): (request: Request) => Response {
  return (request: Request): Response => {
    const opts = { ...defaultSSEOptions, ...options };

    const abortController = new AbortController();
    const encoder = new TextEncoder();

    let keepAliveInterval: ReturnType<typeof setInterval> | null = null;

    const stream = new ReadableStream<Uint8Array>({
      async start(controller) {
        // Send initial retry interval
        if (opts.retry) {
          controller.enqueue(encoder.encode(`retry: ${opts.retry}\n\n`));
        }

        // Set up keep-alive
        if (opts.keepAliveInterval > 0) {
          keepAliveInterval = setInterval(() => {
            if (!abortController.signal.aborted) {
              try {
                controller.enqueue(encoder.encode(opts.keepAliveMessage));
              } catch {
                // Stream might be closed
              }
            }
          }, opts.keepAliveInterval);
        }

        try {
          const gen = generator({
            request,
            signal: abortController.signal,
            state: {} as State,
          });

          for await (const message of gen) {
            if (abortController.signal.aborted) break;
            controller.enqueue(encoder.encode(formatSSEMessage(message)));
          }
        } catch (error) {
          if (!abortController.signal.aborted) {
            console.error('[SSE Error]', error);
            controller.enqueue(
              encoder.encode(
                formatSSEMessage({
                  event: 'error',
                  data: { message: 'Internal server error' },
                })
              )
            );
          }
        } finally {
          if (keepAliveInterval) {
            clearInterval(keepAliveInterval);
          }
          controller.close();
        }
      },

      cancel() {
        abortController.abort();
        if (keepAliveInterval) {
          clearInterval(keepAliveInterval);
        }
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Connection': 'keep-alive',
        'X-Accel-Buffering': 'no',
      },
    });
  };
}

/**
 * Parse SSE events from a text stream (client-side helper)
 *
 * @example
 * ```typescript
 * const response = await fetch('/events');
 * for await (const event of parseSSEStream(response.body!)) {
 *   console.log(event);
 * }
 * ```
 */
export async function* parseSSEStream(
  stream: ReadableStream<Uint8Array>
): AsyncGenerator<SSEMessage, void, unknown> {
  const decoder = new TextDecoder();
  const reader = stream.getReader();

  let buffer = '';

  try {
    while (true) {
      const { done, value } = await reader.read();

      if (done) break;

      buffer += decoder.decode(value, { stream: true });

      // Split by double newline (end of message)
      const messages = buffer.split('\n\n');
      buffer = messages.pop() ?? '';

      for (const messageText of messages) {
        if (!messageText.trim()) continue;
        if (messageText.startsWith(':')) continue; // Comment

        const message: SSEMessage = { data: '' };
        const dataLines: string[] = [];

        for (const line of messageText.split('\n')) {
          if (line.startsWith('event:')) {
            message.event = line.slice(6).trim();
          } else if (line.startsWith('data:')) {
            dataLines.push(line.slice(5).trimStart());
          } else if (line.startsWith('id:')) {
            message.id = line.slice(3).trim();
          } else if (line.startsWith('retry:')) {
            message.retry = parseInt(line.slice(6).trim(), 10);
          }
        }

        const dataStr = dataLines.join('\n');
        try {
          message.data = JSON.parse(dataStr);
        } catch {
          message.data = dataStr;
        }

        yield message;
      }
    }
  } finally {
    reader.releaseLock();
  }
}

/**
 * Create an event source with reconnection support (client-side helper)
 *
 * @example
 * ```typescript
 * const { subscribe, unsubscribe } = createEventSource('/events');
 *
 * const unsub = subscribe((event) => {
 *   console.log(event);
 * });
 *
 * // Later: cleanup
 * unsub();
 * ```
 */
export function createEventSource(
  url: string,
  options: {
    withCredentials?: boolean;
    retry?: number;
    onError?: (error: Error) => void;
  } = {}
): {
  subscribe: (callback: (event: SSEMessage) => void) => () => void;
  unsubscribe: () => void;
} {
  let eventSource: EventSource | null = null;
  const listeners = new Set<(event: SSEMessage) => void>();

  const connect = () => {
    const eventSourceInit: EventSourceInit = {};
    if (options.withCredentials !== undefined) {
      eventSourceInit.withCredentials = options.withCredentials;
    }
    eventSource = new EventSource(url, eventSourceInit);

    eventSource.onmessage = (event) => {
      let data: string | object;
      try {
        data = JSON.parse(event.data) as object;
      } catch {
        data = event.data as string;
      }

      const message: SSEMessage = { data };
      if (event.lastEventId) {
        message.id = event.lastEventId;
      }

      listeners.forEach((listener) => listener(message));
    };

    eventSource.onerror = (event) => {
      options.onError?.(new Error('EventSource error'));
    };
  };

  return {
    subscribe(callback: (event: SSEMessage) => void): () => void {
      listeners.add(callback);

      if (!eventSource) {
        connect();
      }

      return () => {
        listeners.delete(callback);
        if (listeners.size === 0 && eventSource) {
          eventSource.close();
          eventSource = null;
        }
      };
    },

    unsubscribe(): void {
      listeners.clear();
      if (eventSource) {
        eventSource.close();
        eventSource = null;
      }
    },
  };
}
