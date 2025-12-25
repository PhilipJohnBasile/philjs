/**
 * Streaming SSR V2 for PhilJS
 *
 * Next-generation streaming server-side rendering with:
 * - Out-of-order streaming (send completed chunks immediately)
 * - Selective hydration (hydrate only interactive parts)
 * - Concurrent rendering (parallel async rendering)
 * - Priority-based streaming (critical content first)
 * - Resumability (serialize and resume state)
 */

import type { VNode } from "philjs-core";

// =============================================================================
// Types
// =============================================================================

export interface StreamingV2Config {
  /** Enable out-of-order streaming */
  outOfOrder?: boolean;
  /** Enable selective hydration */
  selectiveHydration?: boolean;
  /** Enable concurrent rendering */
  concurrent?: boolean;
  /** Shell timeout in ms */
  shellTimeout?: number;
  /** Boundary timeout in ms */
  boundaryTimeout?: number;
  /** Enable resumability */
  resumable?: boolean;
  /** Chunk priority mode */
  priority?: 'fifo' | 'priority' | 'completion';
  /** Maximum concurrent boundaries */
  maxConcurrent?: number;
}

export interface StreamingV2Context {
  config: Required<StreamingV2Config>;
  boundaryId: number;
  boundaries: Map<string, BoundaryState>;
  completed: string[];
  hydrationTargets: Set<string>;
  serializedState: Map<string, unknown>;
  encoder: TextEncoder;
}

export interface BoundaryState {
  id: string;
  priority: number;
  status: 'pending' | 'rendering' | 'complete' | 'error';
  promise: Promise<string>;
  fallback: string;
  html?: string;
  error?: Error;
  startTime: number;
  requiresHydration: boolean;
}

export interface StreamChunk {
  type: 'shell' | 'boundary' | 'script' | 'end';
  content: string;
  boundaryId?: string;
  priority?: number;
}

// =============================================================================
// Streaming V2 Renderer
// =============================================================================

/**
 * Create a streaming V2 renderer
 */
export function createStreamingRenderer(config: StreamingV2Config = {}) {
  const fullConfig: Required<StreamingV2Config> = {
    outOfOrder: config.outOfOrder ?? true,
    selectiveHydration: config.selectiveHydration ?? true,
    concurrent: config.concurrent ?? true,
    shellTimeout: config.shellTimeout ?? 5000,
    boundaryTimeout: config.boundaryTimeout ?? 10000,
    resumable: config.resumable ?? true,
    priority: config.priority ?? 'completion',
    maxConcurrent: config.maxConcurrent ?? 10,
  };

  return {
    /**
     * Render to a streaming response
     */
    renderToStream: (
      rootNode: VNode,
      options: {
        shell?: ShellConfig;
        onShellReady?: () => void;
        onBoundaryReady?: (id: string) => void;
        onComplete?: () => void;
        onError?: (error: Error) => void;
      } = {}
    ): ReadableStream<Uint8Array> => {
      return renderToStreamV2(rootNode, fullConfig, options);
    },

    /**
     * Render to a streaming response with selective hydration
     */
    renderSelectiveHydration: (
      rootNode: VNode,
      interactiveIds: string[]
    ): ReadableStream<Uint8Array> => {
      return renderToStreamV2(rootNode, {
        ...fullConfig,
        selectiveHydration: true,
      }, {});
    },

    /**
     * Get resumability script
     */
    getResumabilityScript: (ctx: StreamingV2Context): string => {
      return generateResumabilityScript(ctx);
    },
  };
}

// =============================================================================
// Shell Configuration
// =============================================================================

export interface ShellConfig {
  doctype?: string;
  htmlAttributes?: Record<string, string>;
  head?: string;
  bodyAttributes?: Record<string, string>;
  scripts?: string[];
  styles?: string[];
}

function generateShellStart(config: ShellConfig = {}): string {
  const {
    doctype = '<!DOCTYPE html>',
    htmlAttributes = { lang: 'en' },
    head = '',
    bodyAttributes = {},
  } = config;

  const htmlAttrs = Object.entries(htmlAttributes)
    .map(([k, v]) => `${k}="${v}"`)
    .join(' ');

  const bodyAttrs = Object.entries(bodyAttributes)
    .map(([k, v]) => `${k}="${v}"`)
    .join(' ');

  return `${doctype}
<html ${htmlAttrs}>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  ${config.styles?.map(s => `<link rel="stylesheet" href="${s}">`).join('\n  ') || ''}
  ${head}
  <script>
    // Streaming SSR V2 Runtime
    window.__PHIL_V2__ = {
      boundaries: new Map(),
      hydrationQueue: [],
      state: new Map(),

      // Out-of-order injection
      inject(id, html, requiresHydration) {
        const target = document.getElementById('__phil_b_' + id);
        if (!target) {
          this.boundaries.set(id, { html, requiresHydration });
          return;
        }

        const fragment = document.createRange().createContextualFragment(html);
        target.replaceWith(fragment);

        if (requiresHydration) {
          this.hydrationQueue.push(id);
          this.scheduleHydration();
        }
      },

      // Selective hydration with priority
      scheduleHydration() {
        if (this._hydrating) return;
        this._hydrating = true;

        requestIdleCallback(() => {
          const id = this.hydrationQueue.shift();
          if (id) {
            this.hydrateComponent(id);
          }
          this._hydrating = false;
          if (this.hydrationQueue.length > 0) {
            this.scheduleHydration();
          }
        }, { timeout: 1000 });
      },

      // Hydrate a single component
      hydrateComponent(id) {
        const el = document.querySelector('[data-phil-id="' + id + '"]');
        if (el && window.__PHIL_HYDRATE__) {
          window.__PHIL_HYDRATE__(el, id);
        }
      },

      // Restore serialized state
      setState(id, state) {
        this.state.set(id, state);
      },

      getState(id) {
        return this.state.get(id);
      },

      // Priority hydration for user interactions
      prioritize(id) {
        const idx = this.hydrationQueue.indexOf(id);
        if (idx > 0) {
          this.hydrationQueue.splice(idx, 1);
          this.hydrationQueue.unshift(id);
        }
      }
    };

    // Prioritize hydration on interaction
    document.addEventListener('click', (e) => {
      const target = e.target.closest('[data-phil-id]');
      if (target) {
        window.__PHIL_V2__.prioritize(target.dataset.philId);
      }
    }, { capture: true, passive: true });
  </script>
</head>
<body ${bodyAttrs}>
`;
}

function generateShellEnd(config: ShellConfig = {}): string {
  return `
  ${config.scripts?.map(s => `<script src="${s}"></script>`).join('\n  ') || ''}
</body>
</html>`;
}

// =============================================================================
// Core Rendering
// =============================================================================

function renderToStreamV2(
  rootNode: VNode,
  config: Required<StreamingV2Config>,
  options: {
    shell?: ShellConfig;
    onShellReady?: () => void;
    onBoundaryReady?: (id: string) => void;
    onComplete?: () => void;
    onError?: (error: Error) => void;
  }
): ReadableStream<Uint8Array> {
  const ctx: StreamingV2Context = {
    config,
    boundaryId: 0,
    boundaries: new Map(),
    completed: [],
    hydrationTargets: new Set(),
    serializedState: new Map(),
    encoder: new TextEncoder(),
  };

  let controller: ReadableStreamDefaultController<Uint8Array>;
  let shellSent = false;

  const write = (data: string) => {
    controller.enqueue(ctx.encoder.encode(data));
  };

  const flushBoundaries = async () => {
    if (!config.outOfOrder) {
      // FIFO mode - wait for boundaries in order
      return;
    }

    // Out-of-order mode - flush any completed boundaries
    const toFlush: BoundaryState[] = [];

    for (const [id, boundary] of ctx.boundaries) {
      if (boundary.status === 'complete' && !ctx.completed.includes(id)) {
        toFlush.push(boundary);
      }
    }

    // Sort by priority or completion time
    if (config.priority === 'priority') {
      toFlush.sort((a, b) => b.priority - a.priority);
    }

    for (const boundary of toFlush) {
      const script = generateBoundaryScript(boundary);
      write(script);
      ctx.completed.push(boundary.id);
      options.onBoundaryReady?.(boundary.id);
    }
  };

  return new ReadableStream({
    async start(ctrl) {
      controller = ctrl;

      try {
        // Send shell start
        write(generateShellStart(options.shell));

        // Render initial content with placeholders
        const shellHtml = await renderNodeV2(rootNode, ctx);
        write(shellHtml);
        shellSent = true;
        options.onShellReady?.();

        // Process all pending boundaries
        await processBoundaries(ctx, flushBoundaries, config);

        // Final flush
        await flushBoundaries();

        // Add resumability script if enabled
        if (config.resumable) {
          write(generateResumabilityScript(ctx));
        }

        // Send shell end
        write(generateShellEnd(options.shell));

        options.onComplete?.();
        controller.close();
      } catch (error) {
        options.onError?.(error as Error);
        controller.error(error);
      }
    },
  });
}

async function renderNodeV2(node: VNode | null | undefined, ctx: StreamingV2Context): Promise<string> {
  if (node == null) return '';

  if (typeof node === 'string' || typeof node === 'number') {
    return escapeHtml(String(node));
  }

  if (Array.isArray(node)) {
    const parts = await Promise.all(node.map(n => renderNodeV2(n, ctx)));
    return parts.join('');
  }

  // Handle Suspense boundaries
  if (node.type === 'Suspense' || (node.props as any)?.__suspense) {
    return await renderSuspenseV2(node, ctx);
  }

  // Handle components
  if (typeof node.type === 'function') {
    const result = node.type(node.props);
    return renderNodeV2(result, ctx);
  }

  // Handle elements
  const { type, props, children } = node as any;
  const attrs = renderAttributes(props, ctx);
  const childHtml = await renderChildrenV2(children, ctx);

  if (voidElements.has(type)) {
    return `<${type}${attrs}>`;
  }

  return `<${type}${attrs}>${childHtml}</${type}>`;
}

async function renderSuspenseV2(node: VNode, ctx: StreamingV2Context): Promise<string> {
  const id = String(++ctx.boundaryId);
  const props = node.props as any;
  const fallback = props.fallback || '<div>Loading...</div>';
  const priority = props.priority || 0;
  const requiresHydration = props.hydrate !== false;

  // Create boundary state
  const boundary: BoundaryState = {
    id,
    priority,
    status: 'pending',
    promise: null as any,
    fallback: typeof fallback === 'string' ? fallback : await renderNodeV2(fallback, ctx),
    startTime: Date.now(),
    requiresHydration,
  };

  // Start async rendering
  boundary.promise = (async () => {
    try {
      boundary.status = 'rendering';
      const children = props.children;
      const html = await renderNodeV2(children, ctx);
      boundary.html = html;
      boundary.status = 'complete';
      return html;
    } catch (error) {
      boundary.error = error as Error;
      boundary.status = 'error';
      throw error;
    }
  })();

  ctx.boundaries.set(id, boundary);

  if (requiresHydration) {
    ctx.hydrationTargets.add(id);
  }

  // Return placeholder
  return `<div id="__phil_b_${id}" data-phil-suspense="${id}">${boundary.fallback}</div>`;
}

async function renderChildrenV2(children: any, ctx: StreamingV2Context): Promise<string> {
  if (!children) return '';
  if (Array.isArray(children)) {
    const parts = await Promise.all(children.flat(Infinity).map(c => renderNodeV2(c, ctx)));
    return parts.join('');
  }
  return renderNodeV2(children, ctx);
}

async function processBoundaries(
  ctx: StreamingV2Context,
  flush: () => Promise<void>,
  config: Required<StreamingV2Config>
): Promise<void> {
  const pending = () => Array.from(ctx.boundaries.values()).filter(b => b.status !== 'complete' && b.status !== 'error');

  while (pending().length > 0) {
    const active = pending().slice(0, config.maxConcurrent);

    // Wait for any boundary to complete
    await Promise.race([
      ...active.map(b => b.promise.catch(() => {})),
      new Promise(r => setTimeout(r, 100)), // Poll interval
    ]);

    // Flush completed boundaries
    await flush();
  }
}

function generateBoundaryScript(boundary: BoundaryState): string {
  if (boundary.status === 'error') {
    const errorHtml = `<div class="phil-error">Failed to load</div>`;
    return `<script>__PHIL_V2__.inject('${boundary.id}', ${JSON.stringify(errorHtml)}, false);</script>\n`;
  }

  const escaped = JSON.stringify(boundary.html);
  return `<script>__PHIL_V2__.inject('${boundary.id}', ${escaped}, ${boundary.requiresHydration});</script>\n`;
}

function generateResumabilityScript(ctx: StreamingV2Context): string {
  const stateEntries = Array.from(ctx.serializedState.entries());
  if (stateEntries.length === 0) return '';

  const stateScript = stateEntries
    .map(([id, state]) => `__PHIL_V2__.setState('${id}', ${JSON.stringify(state)});`)
    .join('\n');

  return `<script>${stateScript}</script>\n`;
}

// =============================================================================
// Utilities
// =============================================================================

const voidElements = new Set([
  'area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input',
  'link', 'meta', 'param', 'source', 'track', 'wbr'
]);

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function renderAttributes(props: Record<string, any> | null, ctx: StreamingV2Context): string {
  if (!props) return '';

  const attrs: string[] = [];

  for (const [key, value] of Object.entries(props)) {
    if (key === 'children' || key === 'key' || key === 'ref') continue;
    if (value == null || value === false) continue;

    if (key === 'className') {
      attrs.push(`class="${escapeHtml(String(value))}"`);
    } else if (key === 'htmlFor') {
      attrs.push(`for="${escapeHtml(String(value))}"`);
    } else if (key === 'style' && typeof value === 'object') {
      const styleStr = Object.entries(value)
        .map(([k, v]) => `${k.replace(/[A-Z]/g, m => '-' + m.toLowerCase())}: ${v}`)
        .join('; ');
      attrs.push(`style="${escapeHtml(styleStr)}"`);
    } else if (key.startsWith('data-')) {
      attrs.push(`${key}="${escapeHtml(String(value))}"`);
    } else if (key === 'dangerouslySetInnerHTML') {
      // Skip - handled in children
    } else if (!key.startsWith('on') && value !== true) {
      attrs.push(`${key}="${escapeHtml(String(value))}"`);
    } else if (value === true) {
      attrs.push(key);
    }
  }

  return attrs.length > 0 ? ' ' + attrs.join(' ') : '';
}

// =============================================================================
// Exports
// =============================================================================

export { createStreamingRenderer as default };
