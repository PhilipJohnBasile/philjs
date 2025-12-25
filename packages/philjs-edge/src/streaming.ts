/**
 * Edge Streaming for PhilJS
 *
 * Optimized streaming capabilities for edge computing:
 * - Chunked transfer encoding
 * - Server-Sent Events (SSE)
 * - WebSocket over edge
 * - Streaming HTML rendering
 */

export interface StreamConfig {
  highWaterMark?: number;
  chunkSize?: number;
  flushInterval?: number;
  compression?: 'gzip' | 'deflate' | 'br' | 'none';
}

export interface SSEEvent {
  id?: string;
  event?: string;
  data: string | object;
  retry?: number;
}

/**
 * Create a streaming response builder
 */
export class StreamingResponse {
  private encoder: TextEncoder;
  private controller: ReadableStreamDefaultController<Uint8Array> | null = null;
  private stream: ReadableStream<Uint8Array>;
  private headers: Headers;
  private config: StreamConfig;
  private flushed = false;

  constructor(config: StreamConfig = {}) {
    this.encoder = new TextEncoder();
    this.config = {
      highWaterMark: config.highWaterMark || 16384,
      chunkSize: config.chunkSize || 8192,
      flushInterval: config.flushInterval || 0,
      compression: config.compression || 'none',
    };

    this.headers = new Headers({
      'Content-Type': 'text/html; charset=utf-8',
      'Transfer-Encoding': 'chunked',
      'X-Content-Type-Options': 'nosniff',
    });

    this.stream = new ReadableStream<Uint8Array>({
      start: (controller) => {
        this.controller = controller;
      },
      cancel: () => {
        this.controller = null;
      },
    });
  }

  /**
   * Write data to the stream
   */
  write(data: string | Uint8Array): void {
    if (!this.controller) return;

    const chunk = typeof data === 'string' ? this.encoder.encode(data) : data;
    this.controller.enqueue(chunk);
    this.flushed = false;
  }

  /**
   * Write and immediately flush
   */
  writeAndFlush(data: string | Uint8Array): void {
    this.write(data);
    this.flush();
  }

  /**
   * Flush the stream (trigger browser render)
   */
  flush(): void {
    if (!this.controller || this.flushed) return;

    // Write a small chunk to trigger flush
    this.controller.enqueue(this.encoder.encode(''));
    this.flushed = true;
  }

  /**
   * Close the stream
   */
  close(): void {
    if (this.controller) {
      this.controller.close();
      this.controller = null;
    }
  }

  /**
   * Set response header
   */
  setHeader(name: string, value: string): void {
    this.headers.set(name, value);
  }

  /**
   * Get the Response object
   */
  getResponse(status = 200): Response {
    return new Response(this.stream, {
      status,
      headers: this.headers,
    });
  }
}

/**
 * Server-Sent Events stream
 */
export class SSEStream {
  private encoder: TextEncoder;
  private controller: ReadableStreamDefaultController<Uint8Array> | null = null;
  private stream: ReadableStream<Uint8Array>;
  private headers: Headers;
  private eventId = 0;
  private heartbeatInterval: ReturnType<typeof setInterval> | null = null;

  constructor(options: { heartbeatInterval?: number } = {}) {
    this.encoder = new TextEncoder();

    this.headers = new Headers({
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no', // Disable nginx buffering
    });

    this.stream = new ReadableStream<Uint8Array>({
      start: (controller) => {
        this.controller = controller;

        // Send initial comment to establish connection
        this.sendComment('connected');

        // Setup heartbeat
        if (options.heartbeatInterval) {
          this.heartbeatInterval = setInterval(() => {
            this.sendComment('heartbeat');
          }, options.heartbeatInterval);
        }
      },
      cancel: () => {
        this.cleanup();
      },
    });
  }

  /**
   * Send an SSE event
   */
  send(event: SSEEvent): void {
    if (!this.controller) return;

    let message = '';

    if (event.id) {
      message += `id: ${event.id}\n`;
    } else {
      message += `id: ${++this.eventId}\n`;
    }

    if (event.event) {
      message += `event: ${event.event}\n`;
    }

    if (event.retry !== undefined) {
      message += `retry: ${event.retry}\n`;
    }

    const data = typeof event.data === 'object' ? JSON.stringify(event.data) : event.data;
    const lines = data.split('\n');
    for (const line of lines) {
      message += `data: ${line}\n`;
    }

    message += '\n';

    this.controller.enqueue(this.encoder.encode(message));
  }

  /**
   * Send a comment (for keepalive)
   */
  sendComment(comment: string): void {
    if (!this.controller) return;
    this.controller.enqueue(this.encoder.encode(`: ${comment}\n\n`));
  }

  /**
   * Close the stream
   */
  close(): void {
    this.cleanup();
    if (this.controller) {
      this.controller.close();
      this.controller = null;
    }
  }

  private cleanup(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  /**
   * Get the Response object
   */
  getResponse(): Response {
    return new Response(this.stream, {
      status: 200,
      headers: this.headers,
    });
  }
}

/**
 * Create a streaming HTML response with shell and content
 */
export function createStreamingHTML(options: {
  shell: { head: string; bodyStart: string; bodyEnd: string };
  renderContent: () => AsyncIterable<string>;
  scripts?: string[];
}): Response {
  const { shell, renderContent, scripts = [] } = options;
  const stream = new StreamingResponse();

  // Start streaming immediately
  (async () => {
    try {
      // Send head and body start
      stream.write(`<!DOCTYPE html><html><head>${shell.head}</head><body>${shell.bodyStart}`);
      stream.flush();

      // Stream content chunks
      for await (const chunk of renderContent()) {
        stream.write(chunk);
        stream.flush();
      }

      // Send body end and scripts
      stream.write(shell.bodyEnd);

      for (const script of scripts) {
        stream.write(`<script>${script}</script>`);
      }

      stream.write('</body></html>');
      stream.close();
    } catch (error) {
      console.error('Streaming error:', error);
      stream.write(`<script>console.error('Streaming error:', ${JSON.stringify(String(error))})</script>`);
      stream.close();
    }
  })();

  return stream.getResponse();
}

/**
 * Transform stream that chunks data
 */
export function createChunkedStream(chunkSize: number = 8192): TransformStream<Uint8Array, Uint8Array> {
  let buffer = new Uint8Array(0);

  return new TransformStream<Uint8Array, Uint8Array>({
    transform(chunk, controller) {
      // Combine with buffer
      const combined = new Uint8Array(buffer.length + chunk.length);
      combined.set(buffer);
      combined.set(chunk, buffer.length);

      // Emit complete chunks
      let offset = 0;
      while (offset + chunkSize <= combined.length) {
        controller.enqueue(combined.slice(offset, offset + chunkSize));
        offset += chunkSize;
      }

      // Keep remainder in buffer
      buffer = combined.slice(offset);
    },
    flush(controller) {
      if (buffer.length > 0) {
        controller.enqueue(buffer);
      }
    },
  });
}

/**
 * Stream JSON array items one by one
 */
export async function* streamJSONArray<T>(
  items: AsyncIterable<T> | Iterable<T>
): AsyncGenerator<string> {
  let first = true;
  yield '[';

  for await (const item of items) {
    if (!first) yield ',';
    yield JSON.stringify(item);
    first = false;
  }

  yield ']';
}

/**
 * Stream NDJSON (newline-delimited JSON)
 */
export async function* streamNDJSON<T>(
  items: AsyncIterable<T> | Iterable<T>
): AsyncGenerator<string> {
  for await (const item of items) {
    yield JSON.stringify(item) + '\n';
  }
}

/**
 * Create a streaming fetch that processes response in chunks
 */
export async function* streamingFetch(
  url: string,
  options?: RequestInit
): AsyncGenerator<Uint8Array> {
  const response = await fetch(url, options);

  if (!response.body) {
    throw new Error('Response has no body');
  }

  const reader = response.body.getReader();

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      yield value;
    }
  } finally {
    reader.releaseLock();
  }
}

/**
 * Pipe multiple streams together
 */
export function pipeStreams(
  ...streams: Array<TransformStream<Uint8Array, Uint8Array>>
): TransformStream<Uint8Array, Uint8Array> {
  if (streams.length === 0) {
    return new TransformStream();
  }

  if (streams.length === 1) {
    return streams[0];
  }

  // Connect streams
  let readable = streams[0].readable;
  for (let i = 1; i < streams.length; i++) {
    readable = readable.pipeThrough(streams[i]);
  }

  return {
    readable,
    writable: streams[0].writable,
  } as TransformStream<Uint8Array, Uint8Array>;
}

/**
 * Create an edge-optimized SSE broadcaster
 */
export class SSEBroadcaster {
  private clients: Map<string, SSEStream> = new Map();
  private lastEventId = 0;
  private eventHistory: Array<{ id: number; event: SSEEvent; timestamp: number }> = [];
  private maxHistory: number;

  constructor(options: { maxHistory?: number } = {}) {
    this.maxHistory = options.maxHistory || 100;
  }

  /**
   * Add a new client
   */
  addClient(clientId: string, stream: SSEStream, lastEventId?: number): void {
    this.clients.set(clientId, stream);

    // Send missed events
    if (lastEventId !== undefined) {
      const missedEvents = this.eventHistory.filter(e => e.id > lastEventId);
      for (const { event } of missedEvents) {
        stream.send(event);
      }
    }
  }

  /**
   * Remove a client
   */
  removeClient(clientId: string): void {
    const stream = this.clients.get(clientId);
    if (stream) {
      stream.close();
      this.clients.delete(clientId);
    }
  }

  /**
   * Broadcast an event to all clients
   */
  broadcast(event: Omit<SSEEvent, 'id'>): void {
    const id = String(++this.lastEventId);
    const fullEvent: SSEEvent = { ...event, id };

    // Store in history
    this.eventHistory.push({
      id: this.lastEventId,
      event: fullEvent,
      timestamp: Date.now(),
    });

    // Trim history
    while (this.eventHistory.length > this.maxHistory) {
      this.eventHistory.shift();
    }

    // Send to all clients
    for (const stream of this.clients.values()) {
      stream.send(fullEvent);
    }
  }

  /**
   * Send event to specific client
   */
  sendTo(clientId: string, event: SSEEvent): void {
    const stream = this.clients.get(clientId);
    if (stream) {
      stream.send(event);
    }
  }

  /**
   * Get client count
   */
  get clientCount(): number {
    return this.clients.size;
  }

  /**
   * Close all connections
   */
  closeAll(): void {
    for (const stream of this.clients.values()) {
      stream.close();
    }
    this.clients.clear();
  }
}

/**
 * Create progressive HTML streaming with suspense boundaries
 */
export function createProgressiveHTML(options: {
  shell: string;
  fallback: string;
  renderAsync: () => Promise<string>;
  boundaryId: string;
}): Response {
  const { shell, fallback, renderAsync, boundaryId } = options;
  const stream = new StreamingResponse();

  const shellWithFallback = shell.replace(
    `<!--${boundaryId}-->`,
    `<template id="${boundaryId}-pending">${fallback}</template>
     <div id="${boundaryId}">${fallback}</div>`
  );

  (async () => {
    try {
      // Send shell with fallback
      stream.write(shellWithFallback);
      stream.flush();

      // Render async content
      const content = await renderAsync();

      // Send replacement script
      stream.write(`
        <script>
          (function() {
            var target = document.getElementById('${boundaryId}');
            if (target) {
              target.innerHTML = ${JSON.stringify(content)};
            }
            var pending = document.getElementById('${boundaryId}-pending');
            if (pending) pending.remove();
          })();
        </script>
      `);

      stream.close();
    } catch (error) {
      stream.write(`
        <script>
          console.error('Progressive render error:', ${JSON.stringify(String(error))});
        </script>
      `);
      stream.close();
    }
  })();

  return stream.getResponse();
}
