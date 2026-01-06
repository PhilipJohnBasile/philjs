/**
 * Server-Side Rendering for Resumable Components
 *
 * This module provides server-side rendering capabilities that serialize
 * component state into HTML, enabling zero-hydration resumability.
 *
 * @example
 * ```typescript
 * import { renderToResumableHTML, createSSRContext } from '@philjs/resumable/server';
 *
 * const ctx = createSSRContext({ basePath: '/chunks' });
 * const html = await renderToResumableHTML(<App />, ctx);
 * ```
 */

import type {
  ResumableContext,
  ResumableConfig,
  SerializationContext,
  ResumableSignal,
  QRL,
} from '../types.js';
import { createSerializationContext, serializeState } from './serialize.js';
import { generateQRL, isQRL as checkIsQRL } from './qrl.js';

// ============================================================================
// SSR Context
// ============================================================================

/**
 * Create a server-side rendering context
 */
export function createSSRContext(config?: ResumableConfig): ResumableContext {
  return {
    serialization: createSerializationContext({ isDev: config?.isDev }),
    componentStack: [],
    signals: new Map(),
    isServer: true,
    isHydrating: false,
  };
}

/**
 * Current SSR context
 */
let currentContext: ResumableContext | null = null;

/**
 * Get the current SSR context
 */
export function getSSRContext(): ResumableContext | null {
  return currentContext;
}

/**
 * Run a function within an SSR context
 */
export function withSSRContext<T>(ctx: ResumableContext, fn: () => T): T {
  const prev = currentContext;
  currentContext = ctx;
  try {
    return fn();
  } finally {
    currentContext = prev;
  }
}

// ============================================================================
// Render to HTML
// ============================================================================

/**
 * Render a component tree to resumable HTML.
 *
 * This function:
 * 1. Renders the component tree to HTML
 * 2. Serializes all reactive state
 * 3. Generates QRLs for event handlers
 * 4. Embeds state as JSON in a script tag
 * 5. Includes the bootstrap script for resumption
 */
export async function renderToResumableHTML(
  app: unknown,
  config?: ResumableConfig
): Promise<string> {
  const ctx = createSSRContext(config);

  const html = await withSSRContext(ctx, async () => {
    return renderNodeToHTML(app);
  });

  // Generate state script
  const stateScript = generateStateScript(ctx.serialization);

  // Generate bootstrap script
  const bootstrapScript = generateBootstrapScript(config);

  return `${html}${stateScript}${bootstrapScript}`;
}

/**
 * Render a node to HTML string
 */
export function renderNodeToHTML(node: unknown): string {
  if (node == null || node === false || node === true) {
    return '';
  }

  if (typeof node === 'string') {
    return escapeHTML(node);
  }

  if (typeof node === 'number') {
    return String(node);
  }

  if (Array.isArray(node)) {
    return node.map(renderNodeToHTML).join('');
  }

  // Handle signals
  if (isSignalLike(node)) {
    const signal = node as ResumableSignal<unknown>;
    const value = signal.peek();
    return `<span data-qsignal="${signal.$id$}">${renderNodeToHTML(value)}</span>`;
  }

  // Handle plain functions (computations)
  if (typeof node === 'function' && !('$qrl$' in node)) {
    return renderNodeToHTML((node as () => unknown)());
  }

  // Handle JSX elements
  if (isVNode(node)) {
    return renderVNodeToHTML(node);
  }

  return String(node);
}

/**
 * Render a VNode to HTML
 */
function renderVNodeToHTML(vnode: VNode): string {
  const { type, props } = vnode;

  // Handle fragments
  if (type === 'fragment' || type === null) {
    return renderNodeToHTML(props.children);
  }

  // Handle function components
  if (typeof type === 'function') {
    // Check for resumable component
    if ('$qrl$' in type) {
      return renderResumableComponent(type as ResumableComponentFunction, props);
    }
    return renderNodeToHTML((type as ComponentFunction)(props));
  }

  // Handle special resumable markers
  if (type === 'phil-resumable' || type === 'phil-hydrate') {
    return renderElement('div', props);
  }

  // Handle raw HTML
  if (type === 'raw-html') {
    return props.html as string;
  }

  // Handle HTML elements
  if (typeof type === 'string') {
    return renderElement(type, props);
  }

  return '';
}

/**
 * Render an HTML element
 */
function renderElement(tag: string, props: Record<string, unknown>): string {
  const ctx = getSSRContext();
  const attrs: string[] = [];
  let hasHandlers = false;
  const handlers: Array<{ event: string; qrl: string }> = [];

  // Process props
  for (const [key, value] of Object.entries(props)) {
    if (key === 'children') continue;

    // Handle QRL event handlers (onClick$, onInput$, etc.)
    if (key.startsWith('on') && key.endsWith('$')) {
      hasHandlers = true;
      const eventName = key.slice(2, -1).toLowerCase();
      if (checkIsQRL(value)) {
        handlers.push({ event: eventName, qrl: (value as QRL).serialize() });
      } else if (typeof value === 'function') {
        // Generate QRL for inline function
        const qrl = generateQRL(value as Function, ctx?.serialization);
        handlers.push({ event: eventName, qrl: qrl.serialize() });
      }
      continue;
    }

    // Handle regular event handlers (non-resumable)
    if (key.startsWith('on') && typeof value === 'function') {
      // Skip - won't work in SSR
      continue;
    }

    // Handle className
    if (key === 'className') {
      if (value) attrs.push(`class="${escapeAttr(String(value))}"`);
      continue;
    }

    // Handle htmlFor
    if (key === 'htmlFor') {
      if (value) attrs.push(`for="${escapeAttr(String(value))}"`);
      continue;
    }

    // Handle style
    if (key === 'style') {
      if (typeof value === 'object' && value !== null) {
        const styleStr = Object.entries(value)
          .map(([k, v]) => `${kebabCase(k)}:${v}`)
          .join(';');
        attrs.push(`style="${escapeAttr(styleStr)}"`);
      } else if (typeof value === 'string') {
        attrs.push(`style="${escapeAttr(value)}"`);
      }
      continue;
    }

    // Handle dangerouslySetInnerHTML
    if (key === 'dangerouslySetInnerHTML') {
      // Will be handled when rendering children
      continue;
    }

    // Handle boolean attributes
    if (typeof value === 'boolean') {
      if (value) attrs.push(key);
      continue;
    }

    // Handle null/undefined
    if (value == null) continue;

    // Handle signals in attributes
    if (isSignalLike(value)) {
      const signal = value as ResumableSignal<unknown>;
      attrs.push(`${key}="${escapeAttr(String(signal.peek()))}"`);
      attrs.push(`data-qbind-${key}="${signal.$id$}"`);
      continue;
    }

    // Handle data-* attributes
    if (key.startsWith('data-')) {
      attrs.push(`${key}="${escapeAttr(String(value))}"`);
      continue;
    }

    // Handle aria-* attributes
    if (key.startsWith('aria-')) {
      attrs.push(`${key}="${escapeAttr(String(value))}"`);
      continue;
    }

    // Regular attributes
    attrs.push(`${key}="${escapeAttr(String(value))}"`);
  }

  // Add resumability attributes if needed
  if (hasHandlers && ctx) {
    const elementId = generateElementId(ctx.serialization);
    attrs.push(`data-qid="${elementId}"`);
    attrs.push(`data-qevents="${handlers.map(h => h.event).join(' ')}"`);

    // Register element state
    ctx.serialization.elements.set(elementId, {
      id: elementId,
      handlers: handlers.map(h => ({
        qrl: h.qrl,
        event: h.event,
      })),
      bindings: {},
    });
  }

  // Render children
  let children = '';
  if ('dangerouslySetInnerHTML' in props && props.dangerouslySetInnerHTML) {
    children = (props.dangerouslySetInnerHTML as { __html: string }).__html;
  } else {
    children = renderNodeToHTML(props.children);
  }

  // Self-closing tags
  const voidElements = new Set([
    'area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input',
    'link', 'meta', 'param', 'source', 'track', 'wbr',
  ]);

  if (voidElements.has(tag)) {
    return `<${tag}${attrs.length ? ' ' + attrs.join(' ') : ''} />`;
  }

  return `<${tag}${attrs.length ? ' ' + attrs.join(' ') : ''}>${children}</${tag}>`;
}

/**
 * Render a resumable component
 */
function renderResumableComponent(
  Component: ResumableComponentFunction,
  props: Record<string, unknown>
): string {
  const ctx = getSSRContext();
  if (!ctx) {
    throw new Error('Cannot render resumable component outside SSR context');
  }

  const componentId = generateElementId(ctx.serialization);
  const qrl = Component.$qrl$;

  // Push to component stack
  ctx.componentStack.push(componentId);

  try {
    // Register component
    ctx.serialization.components.set(componentId, {
      id: componentId,
      qrl: qrl.serialize(),
      props: serializeProps(props, ctx.serialization),
      children: [],
    });

    // Render the component
    const result = Component(props);
    const html = renderNodeToHTML(result);

    // Wrap with component boundary
    const trigger = (Component as any).$trigger$;
    const triggerAttr = trigger ? ` data-qtrigger="${trigger.type}"` : '';

    return `<div data-qid="${componentId}" data-qcomponent="${qrl.serialize()}"${triggerAttr}>${html}</div>`;
  } finally {
    ctx.componentStack.pop();
  }
}

// ============================================================================
// State Script Generation
// ============================================================================

/**
 * Generate the state script tag
 */
export function generateStateScript(ctx: SerializationContext): string {
  const state = serializeState(ctx);

  // Safe JSON encoding to prevent XSS
  const json = JSON.stringify(state)
    .replace(/</g, '\\u003c')
    .replace(/>/g, '\\u003e')
    .replace(/&/g, '\\u0026')
    .replace(/'/g, '\\u0027');

  return `<script id="__PHIL_STATE__" type="application/json">${json}</script>`;
}

/**
 * Generate the bootstrap script
 */
export function generateBootstrapScript(config?: ResumableConfig): string {
  const basePath = config?.basePath || '';

  const script = `
(function() {
  'use strict';
  var Q = window.__PHIL_Q__ = window.__PHIL_Q__ || {};
  Q.basePath = ${JSON.stringify(basePath)};
  Q.resolved = Q.resolved || {};
  Q.pending = Q.pending || [];
  Q.loading = Q.loading || {};

  // Parse state
  var stateEl = document.getElementById('__PHIL_STATE__');
  if (stateEl) {
    try {
      Q.state = JSON.parse(stateEl.textContent);
    } catch (e) {
      console.error('[PhilJS] Failed to parse state:', e);
    }
  }

  // Event delegation setup
  var events = ['click', 'input', 'change', 'submit', 'focus', 'blur', 'keydown', 'keyup', 'touchstart', 'touchend'];
  events.forEach(function(eventType) {
    document.addEventListener(eventType, function(e) {
      var el = e.target;
      while (el && el !== document.body) {
        var qid = el.getAttribute('data-qid');
        if (qid && Q.state && Q.state.elements[qid]) {
          var elState = Q.state.elements[qid];
          var handler = elState.handlers.find(function(h) { return h.event === eventType; });
          if (handler) {
            if (handler.preventDefault) e.preventDefault();
            if (handler.stopPropagation) e.stopPropagation();
            Q.invoke(handler.qrl, e, el, qid);
            return;
          }
        }
        el = el.parentElement;
      }
    }, true);
  });

  // QRL invocation
  Q.invoke = function(qrl, event, element, qid) {
    if (Q.resolved[qrl]) {
      try {
        Q.resolved[qrl](event, element, Q.state.elements[qid]);
      } catch (err) {
        console.error('[PhilJS] Handler error:', err);
      }
      return;
    }

    Q.pending.push({ qrl: qrl, event: event, element: element, qid: qid });
    Q.load(qrl);
  };

  // Lazy loader
  Q.load = function(qrl) {
    if (Q.loading[qrl]) return Q.loading[qrl];

    var parts = qrl.split('#');
    var chunk = parts[0];
    var symbolPart = parts[1] || 'default';
    var symbol = symbolPart.split('[')[0];

    if (chunk === '__inline__') {
      // Inline QRLs are already available
      return Promise.resolve();
    }

    var url = Q.basePath + '/' + chunk + '.js';
    Q.loading[qrl] = import(url).then(function(mod) {
      var fn = mod[symbol] || mod.default;
      Q.resolved[qrl] = fn;

      // Process pending invocations
      var pending = Q.pending.filter(function(p) { return p.qrl === qrl; });
      Q.pending = Q.pending.filter(function(p) { return p.qrl !== qrl; });
      pending.forEach(function(p) {
        try {
          fn(p.event, p.element, Q.state.elements[p.qid]);
        } catch (err) {
          console.error('[PhilJS] Handler error:', err);
        }
      });

      return fn;
    }).catch(function(err) {
      console.error('[PhilJS] Failed to load chunk:', chunk, err);
      delete Q.loading[qrl];
    });

    return Q.loading[qrl];
  };

  // Prefetch support
  Q.prefetch = function(qrl) {
    if (Q.resolved[qrl] || Q.loading[qrl]) return;
    var parts = qrl.split('#');
    var chunk = parts[0];
    if (chunk === '__inline__') return;

    var link = document.createElement('link');
    link.rel = 'modulepreload';
    link.href = Q.basePath + '/' + chunk + '.js';
    document.head.appendChild(link);
  };

  // Signal updates
  Q.updateSignal = function(signalId, value) {
    var elements = document.querySelectorAll('[data-qsignal="' + signalId + '"]');
    elements.forEach(function(el) { el.textContent = String(value); });

    // Update bound attributes
    document.querySelectorAll('[data-qbind-*]').forEach(function(el) {
      var attrs = el.getAttributeNames().filter(function(n) { return n.startsWith('data-qbind-'); });
      attrs.forEach(function(attr) {
        if (el.getAttribute(attr) === signalId) {
          var propName = attr.replace('data-qbind-', '');
          el.setAttribute(propName, String(value));
        }
      });
    });
  };

  // Dispatch ready event
  window.dispatchEvent(new CustomEvent('phil:ready'));
})();
`.trim();

  return `<script>${script}</script>`;
}

// ============================================================================
// Streaming SSR
// ============================================================================

/**
 * Create a streaming SSR renderer
 */
export function createStreamingRenderer(config?: ResumableConfig): StreamingRenderer {
  const ctx = createSSRContext(config);

  return {
    /**
     * Render a chunk of content
     */
    renderChunk(node: unknown): string {
      return withSSRContext(ctx, () => renderNodeToHTML(node));
    },

    /**
     * Flush buffered content
     */
    flush(): string {
      return '';
    },

    /**
     * Complete the stream and generate final scripts
     */
    end(): string {
      const stateScript = generateStateScript(ctx.serialization);
      const bootstrapScript = generateBootstrapScript(config);
      return `${stateScript}${bootstrapScript}`;
    },

    /**
     * Get the SSR context
     */
    getContext(): ResumableContext {
      return ctx;
    },
  };
}

// ============================================================================
// Helper Types
// ============================================================================

interface VNode {
  type: unknown;
  props: Record<string, unknown>;
}

interface ComponentFunction {
  (props: Record<string, unknown>): unknown;
}

interface ResumableComponentFunction extends ComponentFunction {
  $qrl$: QRL<ComponentFunction>;
}

interface StreamingRenderer {
  renderChunk(node: unknown): string;
  flush(): string;
  end(): string;
  getContext(): ResumableContext;
}

// ============================================================================
// Utility Functions
// ============================================================================

function isVNode(value: unknown): value is VNode {
  return (
    value !== null &&
    typeof value === 'object' &&
    'type' in value &&
    'props' in value
  );
}

function isSignalLike(value: unknown): boolean {
  return (
    typeof value === 'function' &&
    value !== null &&
    '$id$' in value &&
    'peek' in value
  );
}

function generateElementId(ctx: SerializationContext): string {
  return `q${ctx.nextId++}`;
}

function serializeProps(
  props: Record<string, unknown>,
  ctx: SerializationContext
): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(props)) {
    if (key === 'children') continue;
    if (typeof value === 'function') continue;
    result[key] = value;
  }
  return result;
}

function escapeHTML(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function escapeAttr(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function kebabCase(str: string): string {
  return str.replace(/([A-Z])/g, '-$1').toLowerCase();
}
