/**
 * Streaming SSR with Suspense boundaries.
 *
 * This module provides streaming server-side rendering with support for:
 * - Suspense boundaries with fallback UI
 * - Configurable timeouts per boundary
 * - Error handling with fallback content
 * - Progressive enhancement via inline scripts
 *
 * @example
 * ```typescript
 * const stream = await renderToStreamingResponse(
 *   <App />,
 *   {
 *     timeout: 5000,
 *     onShellReady: () => console.log('Shell sent'),
 *     onError: (error, boundaryId) => `<div>Error: ${error.message}</div>`,
 *   }
 * );
 * ```
 */

import type { VNode } from "@philjs/core";

// ============================================================================
// Types
// ============================================================================

export type StreamContext = {
  /** Unique ID generator for suspense boundaries */
  suspenseId: number;
  /** Pending suspense boundaries */
  pending: Map<string, Promise<VNode>>;
  /** Resolved boundaries ready to inject */
  resolved: Map<string, string>;
  /** Timeout controller for cleanup */
  timeoutControllers: Map<string, AbortController>;
};

/**
 * Options for streaming SSR rendering.
 */
export interface StreamingRenderOptions {
  /** Global timeout for all suspense boundaries (ms) */
  timeout?: number;
  /** Callback when shell HTML is ready */
  onShellReady?: () => void;
  /** Callback when all boundaries are resolved */
  onComplete?: () => void;
  /** Callback when a boundary times out or errors */
  onError?: (error: Error, boundaryId: string) => string;
  /** Callback for each resolved boundary */
  onBoundaryReady?: (boundaryId: string) => void;
  /** Whether to abort remaining boundaries on first error */
  abortOnError?: boolean;
  /** Custom bootstrapper script */
  bootstrapScript?: string;
  /** Disable inline scripts (for CSP) */
  disableInlineScripts?: boolean;
  /** Nonce for inline scripts (CSP) */
  scriptNonce?: string;
}

/**
 * Render to a streaming response with progressive enhancement.
 */
export async function renderToStreamingResponse(
  vnode: VNode,
  options: StreamingRenderOptions = {}
): Promise<ReadableStream<Uint8Array>> {
  const {
    timeout = 10000,
    onShellReady,
    onComplete,
    onError,
    onBoundaryReady,
    abortOnError = false,
    bootstrapScript,
    disableInlineScripts = false,
    scriptNonce,
  } = options;

  const encoder = new TextEncoder();
  const ctx: StreamContext = {
    suspenseId: 0,
    pending: new Map(),
    resolved: new Map(),
    timeoutControllers: new Map(),
  };

  // Helper to create script tag with optional nonce
  const createScript = (content: string): string => {
    if (disableInlineScripts) return '';
    const nonceAttr = scriptNonce ? ` nonce="${scriptNonce}"` : '';
    return `<script${nonceAttr}>${content}</script>\n`;
  };

  // Default bootstrap script
  const defaultBootstrap = `
    window.__PHIL_SUSPENSE__ = {};
    window.__PHIL_PENDING__ = new Set();
    function __phil_inject(id, html, error) {
      window.__PHIL_PENDING__.delete(id);
      const el = document.getElementById('phil-suspense-' + id);
      if (el) {
        const temp = document.createElement('div');
        temp.innerHTML = html;
        el.replaceWith(...temp.childNodes);
        if (error) {
          el.dispatchEvent(new CustomEvent('phil:boundary-error', { bubbles: true, detail: { id, error } }));
        } else {
          el.dispatchEvent(new CustomEvent('phil:boundary-ready', { bubbles: true, detail: { id } }));
        }
      }
      if (window.__PHIL_PENDING__.size === 0) {
        document.dispatchEvent(new CustomEvent('phil:all-ready'));
      }
    }
    function __phil_register(id) {
      window.__PHIL_PENDING__.add(id);
    }
  `.trim().replace(/\s+/g, ' ');

  return new ReadableStream({
    async start(controller) {
      // Start HTML document
      controller.enqueue(encoder.encode(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>PhilJS App</title>
  ${createScript(bootstrapScript || defaultBootstrap)}
</head>
<body>
`));

      // Render initial shell
      const shellHtml = await renderWithSuspense(vnode, ctx);
      controller.enqueue(encoder.encode(shellHtml));

      // Register pending boundaries
      for (const id of ctx.pending.keys()) {
        controller.enqueue(encoder.encode(createScript(`__phil_register('${id}')`)));
      }

      // Shell ready callback
      onShellReady?.();

      // Stream pending suspense boundaries with timeout
      let hasError = false;

      while (ctx.pending.size > 0 && !(abortOnError && hasError)) {
        const promises = Array.from(ctx.pending.entries());

        // Create a promise race with timeout for each pending boundary
        const settled = await Promise.race(
          promises.map(async ([id, promise]) => {
            // Create abort controller for this boundary
            const abortController = new AbortController();
            ctx.timeoutControllers.set(id, abortController);

            try {
              // Race between the promise and timeout
              const content = await Promise.race([
                promise,
                new Promise<never>((_, reject) => {
                  const timeoutId = setTimeout(() => {
                    reject(new Error(`Suspense boundary "${id}" timed out after ${timeout}ms`));
                  }, timeout);

                  // Allow abort to clear the timeout
                  abortController.signal.addEventListener('abort', () => {
                    clearTimeout(timeoutId);
                    reject(new Error('Boundary aborted'));
                  });
                }),
              ]);

              return { id, content, error: null as Error | null };
            } catch (error) {
              return { id, content: null as VNode | null, error: error as Error };
            } finally {
              ctx.timeoutControllers.delete(id);
            }
          })
        );

        if (settled) {
          ctx.pending.delete(settled.id);

          if (settled.error) {
            hasError = true;

            // Get error fallback content
            const fallbackHtml = onError
              ? onError(settled.error, settled.id)
              : `<div class="phil-error" data-boundary="${settled.id}">
                  <p>Loading failed: ${escapeHtml(settled.error.message)}</p>
                </div>`;

            const escaped = escapeForScript(fallbackHtml);
            controller.enqueue(encoder.encode(
              createScript(`__phil_inject('${settled.id}', '${escaped}', true)`)
            ));

            // Abort remaining if configured
            if (abortOnError) {
              for (const [, abortController] of ctx.timeoutControllers) {
                abortController.abort();
              }
            }
          } else {
            // Render resolved content and inject
            const html = await renderWithSuspense(settled.content, ctx);
            const escaped = escapeForScript(html);
            controller.enqueue(encoder.encode(
              createScript(`__phil_inject('${settled.id}', '${escaped}', false)`)
            ));

            // Notify callback
            onBoundaryReady?.(settled.id);
          }
        }
      }

      // End document
      controller.enqueue(encoder.encode(`</body>
</html>`));

      // Complete callback
      onComplete?.();

      controller.close();
    },
  });
}

/**
 * Escape a string for safe inclusion in a JavaScript string literal.
 */
function escapeForScript(str: string): string {
  return str
    .replace(/\\/g, '\\\\')
    .replace(/'/g, "\\'")
    .replace(/"/g, '\\"')
    .replace(/\n/g, '\\n')
    .replace(/\r/g, '\\r')
    .replace(/\t/g, '\\t')
    .replace(/<\/script>/gi, '<\\/script>');
}

/**
 * Render with suspense boundary support.
 */
async function renderWithSuspense(vnode: VNode, ctx: StreamContext): Promise<string> {
  if (vnode == null || typeof vnode === "boolean") {
    return "";
  }

  if (typeof vnode === "string" || typeof vnode === "number") {
    return escapeHtml(String(vnode));
  }

  if (Array.isArray(vnode)) {
    const parts = await Promise.all(vnode.map((v) => renderWithSuspense(v, ctx)));
    return parts.join("");
  }

  // Check for Suspense component
  if (isJSXElement(vnode) && vnode.type === Suspense) {
    const id = `suspense-${ctx.suspenseId++}`;
    const { children, fallback } = vnode.props as { children: VNode; fallback?: VNode };

    // Try to render children
    try {
      const content = await renderWithSuspense(children, ctx);
      return content;
    } catch (error) {
      // If it throws a promise (lazy component), show fallback
      if (error instanceof Promise) {
        ctx.pending.set(id, error.then(() => children) as Promise<VNode>);
        const fallbackHtml = fallback ? await renderWithSuspense(fallback, ctx) : "Loading...";
        return `<div id="phil-suspense-${id}">${fallbackHtml}</div>`;
      }
      throw error;
    }
  }

  // Regular rendering
  if (isJSXElement(vnode)) {
    const { type, props } = vnode;

    if (typeof type === "function") {
      const result = await type(props);
      return renderWithSuspense(result, ctx);
    }

    if (typeof type === "string") {
      return renderElement(type, props, ctx);
    }
  }

  return "";
}

/**
 * Render HTML element with streaming support.
 */
async function renderElement(
  tag: string,
  props: Record<string, any>,
  ctx: StreamContext
): Promise<string> {
  const { children, ...attrs } = props;
  const attrsString = renderAttrs(attrs);
  const openTag = attrsString ? `<${tag} ${attrsString}>` : `<${tag}>`;

  if (isVoidElement(tag)) {
    return openTag;
  }

  const childrenHtml = await renderWithSuspense(children, ctx);
  return `${openTag}${childrenHtml}</${tag}>`;
}

/**
 * Suspense component for lazy loading.
 */
export function Suspense(props: { children: VNode; fallback?: VNode }): VNode {
  return { type: Suspense, props } as any;
}

// Helper functions
function isJSXElement(value: any): value is { type: any; props: any } {
  return value && typeof value === "object" && "type" in value && "props" in value;
}

function isVoidElement(tag: string): boolean {
  return /^(area|base|br|col|embed|hr|img|input|link|meta|param|source|track|wbr)$/.test(tag);
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function renderAttrs(attrs: Record<string, any>): string {
  return Object.entries(attrs)
    .filter(([key, value]) => {
      if (value == null || value === false) return false;
      if (typeof value === "function") return false;
      if (key.startsWith("__")) return false;
      return true;
    })
    .map(([key, value]) => {
      const attrName = key === "className" ? "class" : key === "htmlFor" ? "for" : key;
      if (typeof value === "boolean") return value ? attrName : "";
      return `${attrName}="${escapeHtml(String(value))}"`;
    })
    .filter(Boolean)
    .join(" ");
}

// ============================================================================
// Advanced Streaming Utilities
// ============================================================================

/**
 * Create a streaming renderer factory with preset options.
 *
 * @example
 * ```typescript
 * const renderer = createStreamingRenderer({
 *   timeout: 5000,
 *   onError: (error) => `<div>Error: ${error.message}</div>`,
 * });
 *
 * const stream = await renderer(<App />);
 * ```
 */
export function createStreamingRenderer(defaultOptions: StreamingRenderOptions = {}) {
  return function render(
    vnode: VNode,
    options: StreamingRenderOptions = {}
  ): Promise<ReadableStream<Uint8Array>> {
    return renderToStreamingResponse(vnode, { ...defaultOptions, ...options });
  };
}

/**
 * Render to a Node.js-compatible stream.
 */
export async function renderToNodeStream(
  vnode: VNode,
  options: StreamingRenderOptions = {}
): Promise<AsyncGenerator<string, void, unknown>> {
  const webStream = await renderToStreamingResponse(vnode, options);
  const reader = webStream.getReader();
  const decoder = new TextDecoder();

  async function* generateChunks(): AsyncGenerator<string, void, unknown> {
    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        yield decoder.decode(value, { stream: true });
      }
      // Flush remaining
      const final = decoder.decode();
      if (final) yield final;
    } finally {
      reader.releaseLock();
    }
  }

  return generateChunks();
}

/**
 * Options for the generator-based streaming renderer.
 */
export interface StreamGeneratorOptions extends StreamingRenderOptions {
  /** Whether to yield the shell as a single chunk */
  shellAsChunk?: boolean;
  /** Chunk size hint (boundaries will still be atomic) */
  chunkSizeHint?: number;
}

/**
 * Create a generator-based streaming renderer for more control.
 *
 * @example
 * ```typescript
 * const generator = createStreamGenerator(<App />, { timeout: 5000 });
 *
 * for await (const chunk of generator) {
 *   response.write(chunk);
 * }
 * response.end();
 * ```
 */
export async function* createStreamGenerator(
  vnode: VNode,
  options: StreamGeneratorOptions = {}
): AsyncGenerator<string, void, unknown> {
  const {
    timeout = 10000,
    onError,
    shellAsChunk = true,
  } = options;

  const ctx: StreamContext = {
    suspenseId: 0,
    pending: new Map(),
    resolved: new Map(),
    timeoutControllers: new Map(),
  };

  // Yield document start
  yield `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>PhilJS App</title>
  <script>
    window.__PHIL_SUSPENSE__ = {};
    window.__PHIL_PENDING__ = new Set();
    function __phil_inject(id, html, error) {
      window.__PHIL_PENDING__.delete(id);
      var el = document.getElementById('phil-suspense-' + id);
      if (el) {
        var temp = document.createElement('div');
        temp.innerHTML = html;
        el.replaceWith.apply(el, Array.from(temp.childNodes));
      }
    }
    function __phil_register(id) { window.__PHIL_PENDING__.add(id); }
  </script>
</head>
<body>
`;

  // Render shell
  const shellHtml = await renderWithSuspense(vnode, ctx);
  if (shellAsChunk) {
    yield shellHtml;
  } else {
    // Split shell into smaller chunks
    const chunkSize = options.chunkSizeHint || 16384;
    for (let i = 0; i < shellHtml.length; i += chunkSize) {
      yield shellHtml.slice(i, i + chunkSize);
    }
  }

  // Register pending boundaries
  for (const id of ctx.pending.keys()) {
    yield `<script>__phil_register('${id}')</script>\n`;
  }

  // Resolve pending boundaries with timeout
  while (ctx.pending.size > 0) {
    const entries = Array.from(ctx.pending.entries());

    const settled = await Promise.race(
      entries.map(async ([id, promise]) => {
        try {
          const content = await Promise.race([
            promise,
            new Promise<never>((_, reject) =>
              setTimeout(() => reject(new Error(`Timeout: ${id}`)), timeout)
            ),
          ]);
          return { id, content, error: null as Error | null };
        } catch (error) {
          return { id, content: null as VNode | null, error: error as Error };
        }
      })
    );

    if (settled) {
      ctx.pending.delete(settled.id);

      if (settled.error) {
        const fallbackHtml = onError
          ? onError(settled.error, settled.id)
          : `<div class="phil-error">Error: ${escapeHtml(settled.error.message)}</div>`;
        const escaped = escapeForScript(fallbackHtml);
        yield `<script>__phil_inject('${settled.id}', '${escaped}', true)</script>\n`;
      } else {
        const html = await renderWithSuspense(settled.content, ctx);
        const escaped = escapeForScript(html);
        yield `<script>__phil_inject('${settled.id}', '${escaped}', false)</script>\n`;
      }
    }
  }

  // End document
  yield `</body>
</html>`;
}

/**
 * Create a selective hydration script for islands architecture.
 */
export function createIslandScript(islandId: string, props: Record<string, unknown>): string {
  const serializedProps = JSON.stringify(props).replace(/</g, '\\u003c');
  return `<script>
    (function() {
      var el = document.querySelector('[data-island="${islandId}"]');
      if (el && window.__PHIL_ISLANDS__) {
        window.__PHIL_ISLANDS__.hydrate('${islandId}', ${serializedProps});
      }
    })();
  </script>`;
}

/**
 * Priority queue for suspense boundary resolution.
 */
export class SuspensePriorityQueue {
  private queue: Array<{
    id: string;
    priority: number;
    promise: Promise<VNode>;
  }> = [];

  add(id: string, promise: Promise<VNode>, priority: number = 0): void {
    this.queue.push({ id, priority, promise });
    this.queue.sort((a, b) => b.priority - a.priority);
  }

  async *resolve(timeout: number = 10000): AsyncGenerator<{
    id: string;
    content: VNode | null;
    error: Error | null;
  }> {
    while (this.queue.length > 0) {
      const item = this.queue.shift()!;

      try {
        const content = await Promise.race([
          item.promise,
          new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error(`Timeout: ${item.id}`)), timeout)
          ),
        ]);
        yield { id: item.id, content, error: null };
      } catch (error) {
        yield { id: item.id, content: null, error: error as Error };
      }
    }
  }

  get size(): number {
    return this.queue.length;
  }
}

/**
 * Streaming response helpers for various server frameworks.
 */
export const streamingHelpers = {
  /**
   * Create a Response object for Web APIs (Cloudflare Workers, Deno, etc.)
   */
  toResponse(stream: ReadableStream<Uint8Array>, init?: ResponseInit): Response {
    return new Response(stream, {
      ...init,
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Transfer-Encoding': 'chunked',
        ...init?.headers,
      },
    });
  },

  /**
   * Pipe to a Node.js response object.
   */
  async pipeToNode(
    stream: ReadableStream<Uint8Array>,
    res: { write: (chunk: Buffer) => boolean; end: () => void }
  ): Promise<void> {
    const reader = stream.getReader();

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        res.write(Buffer.from(value));
      }
    } finally {
      reader.releaseLock();
      res.end();
    }
  },

  /**
   * Collect the entire stream as a string (for testing).
   */
  async toString(stream: ReadableStream<Uint8Array>): Promise<string> {
    const reader = stream.getReader();
    const decoder = new TextDecoder();
    let result = '';

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        result += decoder.decode(value, { stream: true });
      }
      result += decoder.decode();
    } finally {
      reader.releaseLock();
    }

    return result;
  },
};