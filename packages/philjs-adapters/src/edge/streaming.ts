/**
 * PhilJS Edge Streaming - Edge-Optimized Streaming Responses
 *
 * Provides optimized streaming capabilities for edge runtimes:
 * - Server-Sent Events (SSE)
 * - Chunked transfer encoding
 * - Progressive HTML streaming
 * - Edge-Side Includes (ESI)
 */

import { detectEdgePlatform, type EdgePlatform } from './edge-runtime';

// ============================================================================
// Types
// ============================================================================

export interface StreamingConfig {
  /** Enable compression for streaming responses */
  compress?: boolean;
  /** Buffer size for chunks (bytes) */
  bufferSize?: number;
  /** Flush interval in milliseconds */
  flushInterval?: number;
  /** Headers to include in streaming response */
  headers?: Record<string, string>;
}

export interface SSEMessage {
  /** Event type */
  event?: string;
  /** Message data */
  data: string | object;
  /** Optional event ID */
  id?: string;
  /** Retry interval in milliseconds */
  retry?: number;
}

export interface ESIFragment {
  /** Fragment URL to fetch */
  src: string;
  /** Fallback content if fetch fails */
  alt?: string;
  /** TTL for caching the fragment */
  ttl?: number;
  /** Whether to fetch in parallel */
  parallel?: boolean;
}

export interface StreamingWriter {
  /** Write a chunk to the stream */
  write(chunk: string | Uint8Array): Promise<void>;
  /** Write multiple chunks */
  writeAll(chunks: Array<string | Uint8Array>): Promise<void>;
  /** Flush buffered content */
  flush(): Promise<void>;
  /** Close the stream */
  close(): Promise<void>;
  /** Check if stream is closed */
  readonly closed: boolean;
}

// ============================================================================
// Stream Creation Utilities
// ============================================================================

/**
 * Create a ReadableStream with a controller for writing
 */
export function createWritableStream(): {
  readable: ReadableStream<Uint8Array>;
  writer: StreamingWriter;
} {
  let controller: ReadableStreamDefaultController<Uint8Array>;
  let isClosed = false;
  const encoder = new TextEncoder();

  const readable = new ReadableStream<Uint8Array>({
    start(c) {
      controller = c;
    },
    cancel() {
      isClosed = true;
    },
  });

  const writer: StreamingWriter = {
    async write(chunk: string | Uint8Array): Promise<void> {
      if (isClosed) {
        throw new Error('Stream is closed');
      }
      const data = typeof chunk === 'string' ? encoder.encode(chunk) : chunk;
      controller.enqueue(data);
    },

    async writeAll(chunks: Array<string | Uint8Array>): Promise<void> {
      for (const chunk of chunks) {
        await this.write(chunk);
      }
    },

    async flush(): Promise<void> {
      // In edge environments, flushing is typically automatic
      // This is a no-op placeholder for API compatibility
    },

    async close(): Promise<void> {
      if (!isClosed) {
        isClosed = true;
        controller.close();
      }
    },

    get closed(): boolean {
      return isClosed;
    },
  };

  return { readable, writer };
}

/**
 * Create a streaming response with proper headers
 */
export function createStreamingResponse(
  readable: ReadableStream,
  config: StreamingConfig = {}
): Response {
  const headers = new Headers({
    'Content-Type': 'text/html; charset=utf-8',
    'Transfer-Encoding': 'chunked',
    'X-Content-Type-Options': 'nosniff',
    ...config.headers,
  });

  // Disable buffering on various edge platforms
  headers.set('X-Accel-Buffering', 'no');

  return new Response(readable, {
    status: 200,
    headers,
  });
}

// ============================================================================
// Server-Sent Events (SSE)
// ============================================================================

/**
 * Create an SSE stream for real-time updates
 */
export function createSSEStream(): {
  response: Response;
  send: (message: SSEMessage) => Promise<void>;
  close: () => Promise<void>;
} {
  const { readable, writer } = createWritableStream();

  const response = new Response(readable, {
    status: 200,
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  });

  const send = async (message: SSEMessage): Promise<void> => {
    let data = '';

    if (message.id) {
      data += `id: ${message.id}\n`;
    }

    if (message.event) {
      data += `event: ${message.event}\n`;
    }

    if (message.retry) {
      data += `retry: ${message.retry}\n`;
    }

    const payload = typeof message.data === 'string'
      ? message.data
      : JSON.stringify(message.data);

    // Handle multi-line data
    for (const line of payload.split('\n')) {
      data += `data: ${line}\n`;
    }

    data += '\n';

    await writer.write(data);
  };

  const close = async (): Promise<void> => {
    await writer.close();
  };

  return { response, send, close };
}

/**
 * Create an SSE event handler for edge runtimes
 */
export function createSSEHandler(
  handler: (send: (message: SSEMessage) => Promise<void>, request: Request) => Promise<void>
): (request: Request) => Promise<Response> {
  return async (request: Request): Promise<Response> => {
    const { response, send, close } = createSSEStream();

    // Run handler in background
    const handlerPromise = handler(send, request)
      .catch((error) => {
        console.error('SSE handler error:', error);
        send({ event: 'error', data: { message: 'Internal server error' } });
      })
      .finally(() => close());

    // For edge runtimes that support waitUntil
    const platform = detectEdgePlatform();
    if (platform === 'cloudflare' || platform === 'vercel' || platform === 'netlify') {
      try {
        const ctx = (globalThis as any).ctx || (globalThis as any).executionContext;
        ctx?.waitUntil?.(handlerPromise);
      } catch {
        // Ignore errors in accessing context
      }
    }

    return response;
  };
}

// ============================================================================
// Progressive HTML Streaming
// ============================================================================

export interface HTMLStreamOptions {
  /** Document shell (before content) */
  shell: string;
  /** Document footer (after content) */
  footer: string;
  /** Placeholder for streaming content */
  contentPlaceholder?: string;
}

/**
 * Create a progressive HTML streaming response
 */
export function createHTMLStream(options: HTMLStreamOptions): {
  response: Response;
  writeChunk: (html: string) => Promise<void>;
  writeSuspenseFallback: (id: string, fallback: string) => Promise<void>;
  resolveSuspense: (id: string, content: string) => Promise<void>;
  close: () => Promise<void>;
} {
  const { readable, writer } = createWritableStream();

  const response = new Response(readable, {
    status: 200,
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Transfer-Encoding': 'chunked',
      'X-Content-Type-Options': 'nosniff',
      'X-Accel-Buffering': 'no',
    },
  });

  // Send the shell immediately
  const shellParts = options.contentPlaceholder
    ? options.shell.split(options.contentPlaceholder)
    : [options.shell, ''];

  let initialized = false;
  const suspenseMap = new Map<string, boolean>();

  const initStream = async () => {
    if (!initialized) {
      initialized = true;
      await writer.write(shellParts[0]);
    }
  };

  return {
    response,

    async writeChunk(html: string): Promise<void> {
      await initStream();
      await writer.write(html);
    },

    async writeSuspenseFallback(id: string, fallback: string): Promise<void> {
      await initStream();
      suspenseMap.set(id, false);
      await writer.write(`<template id="S:${id}"></template>${fallback}<!--/$-->`);
    },

    async resolveSuspense(id: string, content: string): Promise<void> {
      if (!suspenseMap.has(id)) {
        throw new Error(`Unknown suspense boundary: ${id}`);
      }

      suspenseMap.set(id, true);

      // Write the replacement script
      const script = `
<template id="R:${id}">${content}</template>
<script>
(function(){
  var template = document.getElementById('R:${id}');
  var marker = document.getElementById('S:${id}');
  if (template && marker) {
    var parent = marker.parentNode;
    var next = marker.nextSibling;
    parent.removeChild(marker);
    while (next && !(next.nodeType === 8 && next.data === '/$')) {
      var toRemove = next;
      next = next.nextSibling;
      parent.removeChild(toRemove);
    }
    if (next) parent.removeChild(next);
    var content = template.content;
    parent.insertBefore(content, next ? next.nextSibling : null);
    parent.removeChild(template);
  }
})();
</script>`;

      await writer.write(script);
    },

    async close(): Promise<void> {
      await initStream();

      // Write any remaining shell content and footer
      if (shellParts[1]) {
        await writer.write(shellParts[1]);
      }
      await writer.write(options.footer);
      await writer.close();
    },
  };
}

// ============================================================================
// Edge-Side Includes (ESI)
// ============================================================================

/**
 * Parse ESI tags from HTML content
 */
export function parseESITags(html: string): ESIFragment[] {
  const fragments: ESIFragment[] = [];
  const esiRegex = /<esi:include\s+([^>]+)\s*\/?\s*>/gi;

  let match;
  while ((match = esiRegex.exec(html)) !== null) {
    const attrs = match[1];
    const srcMatch = attrs.match(/src=["']([^"']+)["']/);
    const altMatch = attrs.match(/alt=["']([^"']+)["']/);
    const ttlMatch = attrs.match(/ttl=["'](\d+)["']/);

    if (srcMatch) {
      fragments.push({
        src: srcMatch[1],
        alt: altMatch?.[1],
        ttl: ttlMatch ? parseInt(ttlMatch[1], 10) : undefined,
        parallel: true,
      });
    }
  }

  return fragments;
}

/**
 * Process ESI includes in HTML content
 */
export async function processESI(
  html: string,
  options: {
    /** Base URL for relative includes */
    baseUrl?: string;
    /** Timeout for fetching includes (ms) */
    timeout?: number;
    /** Custom fetch function */
    fetch?: typeof globalThis.fetch;
    /** Cache for ESI fragments */
    cache?: Map<string, { content: string; expires: number }>;
  } = {}
): Promise<string> {
  const {
    baseUrl = '',
    timeout = 5000,
    fetch: customFetch = globalThis.fetch,
    cache = new Map(),
  } = options;

  const fragments = parseESITags(html);

  if (fragments.length === 0) {
    return html;
  }

  // Fetch all fragments in parallel
  const results = await Promise.all(
    fragments.map(async (fragment) => {
      const url = fragment.src.startsWith('http')
        ? fragment.src
        : `${baseUrl}${fragment.src}`;

      // Check cache
      const cached = cache.get(url);
      if (cached && cached.expires > Date.now()) {
        return { fragment, content: cached.content };
      }

      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);

        const response = await customFetch(url, {
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          throw new Error(`ESI fetch failed: ${response.status}`);
        }

        const content = await response.text();

        // Cache the result
        if (fragment.ttl) {
          cache.set(url, {
            content,
            expires: Date.now() + fragment.ttl * 1000,
          });
        }

        return { fragment, content };
      } catch (error) {
        console.error(`ESI fetch error for ${url}:`, error);
        return { fragment, content: fragment.alt || '' };
      }
    })
  );

  // Replace ESI tags with fetched content
  let result = html;
  for (const { fragment, content } of results) {
    const esiTag = new RegExp(
      `<esi:include\\s+[^>]*src=["']${escapeRegExp(fragment.src)}["'][^>]*\\/?\\s*>`,
      'gi'
    );
    result = result.replace(esiTag, content);
  }

  return result;
}

function escapeRegExp(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Create an ESI processor middleware
 */
export function createESIMiddleware(options: {
  baseUrl?: string;
  timeout?: number;
  cacheSize?: number;
}): (response: Response) => Promise<Response> {
  const cache = new Map<string, { content: string; expires: number }>();
  const maxCacheSize = options.cacheSize || 100;

  return async (response: Response): Promise<Response> => {
    // Only process HTML responses
    const contentType = response.headers.get('content-type');
    if (!contentType?.includes('text/html')) {
      return response;
    }

    const html = await response.text();

    // Check if ESI tags exist
    if (!html.includes('<esi:include')) {
      return new Response(html, {
        status: response.status,
        headers: response.headers,
      });
    }

    // Limit cache size
    if (cache.size > maxCacheSize) {
      const keysToDelete = Array.from(cache.keys()).slice(0, cache.size - maxCacheSize);
      for (const key of keysToDelete) {
        cache.delete(key);
      }
    }

    const processed = await processESI(html, {
      baseUrl: options.baseUrl,
      timeout: options.timeout,
      cache,
    });

    return new Response(processed, {
      status: response.status,
      headers: response.headers,
    });
  };
}

// ============================================================================
// Streaming Utilities
// ============================================================================

/**
 * Stream a fetch response through to the client
 */
export async function streamThrough(
  response: Response,
  transform?: (chunk: Uint8Array) => Uint8Array | Promise<Uint8Array>
): Promise<Response> {
  if (!response.body) {
    return response;
  }

  const reader = response.body.getReader();
  const { readable, writer } = createWritableStream();

  // Stream in background
  (async () => {
    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = transform ? await transform(value) : value;
        await writer.write(chunk);
      }
    } catch (error) {
      console.error('Stream error:', error);
    } finally {
      await writer.close();
    }
  })();

  return new Response(readable, {
    status: response.status,
    headers: response.headers,
  });
}

/**
 * Merge multiple streams into one
 */
export function mergeStreams(
  streams: ReadableStream<Uint8Array>[],
  options: { sequential?: boolean } = {}
): ReadableStream<Uint8Array> {
  const { sequential = true } = options;

  if (sequential) {
    // Sequential: one stream after another
    return new ReadableStream<Uint8Array>({
      async start(controller) {
        for (const stream of streams) {
          const reader = stream.getReader();
          try {
            while (true) {
              const { done, value } = await reader.read();
              if (done) break;
              controller.enqueue(value);
            }
          } finally {
            reader.releaseLock();
          }
        }
        controller.close();
      },
    });
  } else {
    // Parallel: interleave chunks as they arrive
    return new ReadableStream<Uint8Array>({
      async start(controller) {
        const readers = streams.map((s) => s.getReader());
        const activeReaders = new Set(readers);

        const readFromAll = async () => {
          while (activeReaders.size > 0) {
            const readPromises = Array.from(activeReaders).map(async (reader) => {
              const result = await reader.read();
              if (result.done) {
                activeReaders.delete(reader);
                reader.releaseLock();
                return null;
              }
              return result.value;
            });

            const results = await Promise.all(readPromises);
            for (const chunk of results) {
              if (chunk) {
                controller.enqueue(chunk);
              }
            }
          }
          controller.close();
        };

        readFromAll().catch((error) => controller.error(error));
      },
    });
  }
}

/**
 * Create a tee that allows streaming to multiple destinations
 */
export function createStreamTee(
  source: ReadableStream<Uint8Array>,
  count: number = 2
): ReadableStream<Uint8Array>[] {
  const streams: ReadableStream<Uint8Array>[] = [];
  const controllers: ReadableStreamDefaultController<Uint8Array>[] = [];

  for (let i = 0; i < count; i++) {
    streams.push(
      new ReadableStream({
        start(controller) {
          controllers.push(controller);
        },
      })
    );
  }

  // Pump source to all destinations
  (async () => {
    const reader = source.getReader();
    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) {
          for (const controller of controllers) {
            controller.close();
          }
          break;
        }
        for (const controller of controllers) {
          controller.enqueue(value);
        }
      }
    } catch (error) {
      for (const controller of controllers) {
        controller.error(error);
      }
    }
  })();

  return streams;
}

// ============================================================================
// Exports
// ============================================================================

export default {
  createWritableStream,
  createStreamingResponse,
  createSSEStream,
  createSSEHandler,
  createHTMLStream,
  parseESITags,
  processESI,
  createESIMiddleware,
  streamThrough,
  mergeStreams,
  createStreamTee,
};
