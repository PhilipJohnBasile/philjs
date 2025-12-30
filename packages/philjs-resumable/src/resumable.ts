/**
 * Core Resumability Logic
 *
 * This module provides the core resumability implementation that enables
 * zero JavaScript execution until user interaction. It integrates with
 * QRLs, serialization, and hydration to create a complete resumability system.
 *
 * @example
 * ```typescript
 * // Define a resumable component
 * export const Counter = resumable$(() => {
 *   const count = useSignal(0);
 *   return (
 *     <button onClick$={() => count.value++}>
 *       Count: {count.value}
 *     </button>
 *   );
 * });
 *
 * // The component renders to HTML with serialized state
 * // No JavaScript runs until the button is clicked
 * ```
 */

import type { QRL } from './qrl.js';
import { $, createQRL, isQRL, parseQRL } from './qrl.js';
import {
  type SerializationContext,
  createSerializationContext,
  withSerializationContext,
  generateId,
  serializeValue,
  deserializeValue,
  registerElement,
  registerSignal,
  registerComponent,
  generateStateScript,
  generateBootstrapScript,
} from './serializer.js';
import { initLoader, loadAndHydrate } from './loader.js';
import { initHydration, setupHydration, type AnyHydrationOptions } from './hydration.js';

// ============================================================================
// Types
// ============================================================================

/**
 * Resumable component function
 */
export type ResumableComponent<P = Record<string, unknown>> = {
  (props: P): unknown;
  /** QRL for lazy loading */
  $qrl$: QRL<(props: P) => unknown>;
  /** Display name */
  displayName?: string;
};

/**
 * Resumable signal (serializable reactive state)
 */
export interface ResumableSignal<T> {
  /** Get the current value */
  (): T;
  /** Get value without tracking */
  peek(): T;
  /** Set a new value */
  set(value: T | ((prev: T) => T)): void;
  /** Unique signal ID for serialization */
  $id$: string;
  /** Subscribe to changes */
  subscribe(fn: (value: T) => void): () => void;
}

/**
 * Context for resumable rendering
 */
export interface ResumableContext {
  /** Serialization context */
  serialization: SerializationContext;
  /** Current component stack */
  componentStack: string[];
  /** Signal registry */
  signals: Map<string, ResumableSignal<unknown>>;
  /** Whether we're on the server */
  isServer: boolean;
  /** Whether we're hydrating */
  isHydrating: boolean;
}

/**
 * Resumable app configuration
 */
export interface ResumableConfig {
  /** Base path for chunk loading */
  basePath?: string;
  /** Development mode */
  isDev?: boolean;
  /** Enable streaming SSR */
  streaming?: boolean;
  /** Custom chunk resolver */
  resolver?: (chunk: string) => Promise<Record<string, unknown>>;
}

// ============================================================================
// Global Context
// ============================================================================

let currentContext: ResumableContext | null = null;
let signalIdCounter = 0;

/**
 * Get the current resumable context
 */
export function getResumableContext(): ResumableContext | null {
  return currentContext;
}

/**
 * Run with a resumable context
 */
export function withResumableContext<T>(
  ctx: ResumableContext,
  fn: () => T
): T {
  const prev = currentContext;
  currentContext = ctx;
  try {
    return withSerializationContext(ctx.serialization, fn);
  } finally {
    currentContext = prev;
  }
}

// ============================================================================
// Resumable Component Factory
// ============================================================================

/**
 * Create a resumable component.
 *
 * The component will:
 * 1. Render to HTML on the server with serialized state
 * 2. Not execute JavaScript on the client until interaction
 * 3. Lazy load the component code when needed
 *
 * @example
 * ```typescript
 * const Counter = resumable$(() => {
 *   const count = useSignal(0);
 *   return <button onClick$={() => count.value++}>{count.value}</button>;
 * });
 * ```
 */
export function resumable$<P = Record<string, unknown>>(
  component: (props: P) => unknown,
  options?: {
    /** Module path for the component */
    module?: string;
    /** Export name */
    symbol?: string;
  }
): ResumableComponent<P> {
  const qrl = createQRL<(props: P) => unknown>({
    chunk: options?.module || '__inline__',
    symbol: options?.symbol || component.name || 'Component',
    resolved: component,
  });

  const ResumableWrapper = ((props: P) => {
    const ctx = getResumableContext();

    if (ctx?.isServer) {
      // Server-side: render and serialize
      return renderResumableComponent(component, props, qrl, ctx);
    } else if (ctx?.isHydrating) {
      // Client-side hydrating: skip render, already in DOM
      return null;
    } else {
      // Client-side: normal render
      return component(props);
    }
  }) as ResumableComponent<P>;

  ResumableWrapper.$qrl$ = qrl;
  ResumableWrapper.displayName = component.name || 'ResumableComponent';

  return ResumableWrapper;
}

/**
 * Render a resumable component on the server
 */
function renderResumableComponent<P>(
  component: (props: P) => unknown,
  props: P,
  qrl: QRL<(props: P) => unknown>,
  ctx: ResumableContext
): unknown {
  // Generate component ID
  const componentId = generateId(ctx.serialization);

  // Push to component stack
  ctx.componentStack.push(componentId);

  try {
    // Register component for resumability
    registerComponent(componentId, qrl, props as Record<string, unknown>, ctx.serialization);

    // Render the component
    const result = component(props);

    // Wrap result with component boundary marker
    return {
      type: 'phil-resumable',
      props: {
        'data-qid': componentId,
        'data-qcomponent': qrl.serialize(),
        children: result,
      },
    };
  } finally {
    ctx.componentStack.pop();
  }
}

// ============================================================================
// Resumable Signals
// ============================================================================

/**
 * Create a resumable signal.
 *
 * Unlike regular signals, resumable signals:
 * 1. Serialize their value to HTML
 * 2. Restore from serialized state on hydration
 * 3. Can be referenced across lazy-loaded boundaries
 *
 * @example
 * ```typescript
 * const count = useSignal(0);
 * // Renders: <span data-qsignal="s0">0</span>
 * // Value is restored on hydration without running component code
 * ```
 */
export function useSignal<T>(initialValue: T): ResumableSignal<T> {
  const ctx = getResumableContext();
  const id = `s${signalIdCounter++}`;

  // Check for hydrated value
  let value = initialValue;
  if (typeof window !== 'undefined') {
    const hydratedValue = getHydratedSignalValue<T>(id);
    if (hydratedValue !== undefined) {
      value = hydratedValue;
    }
  }

  const subscribers = new Set<(value: T) => void>();

  const signal: ResumableSignal<T> = (() => {
    // Track dependency if in computation
    return value;
  }) as ResumableSignal<T>;

  signal.$id$ = id;

  signal.peek = () => value;

  signal.set = (newValue: T | ((prev: T) => T)) => {
    const nextValue = typeof newValue === 'function'
      ? (newValue as (prev: T) => T)(value)
      : newValue;

    if (Object.is(value, nextValue)) return;
    value = nextValue;

    // Notify subscribers
    subscribers.forEach((fn) => fn(value));
  };

  signal.subscribe = (fn: (value: T) => void) => {
    subscribers.add(fn);
    return () => subscribers.delete(fn);
  };

  // Register for serialization
  if (ctx?.isServer) {
    registerSignal(id, value, ctx.serialization);
    ctx.signals.set(id, signal as ResumableSignal<unknown>);
  }

  return signal;
}

/**
 * Get a hydrated signal value from the DOM
 */
function getHydratedSignalValue<T>(id: string): T | undefined {
  if (typeof document === 'undefined') return undefined;

  // Check the global state
  const stateEl = document.getElementById('__PHIL_STATE__');
  if (!stateEl) return undefined;

  try {
    const state = JSON.parse(stateEl.textContent || '{}');
    if (state.signals?.[id]) {
      return deserializeValue(state.signals[id].value) as T;
    }
  } catch {
    // Ignore parse errors
  }

  return undefined;
}

/**
 * Create a computed resumable value
 */
export function useComputed<T>(
  computation: () => T,
  deps?: unknown[]
): ResumableSignal<T> {
  // Initial computation
  const signal = useSignal(computation());

  // Re-compute when deps change (for SSR, this is just initial)
  // On client, we'd set up proper reactivity

  return signal;
}

// ============================================================================
// Resumable Event Handlers
// ============================================================================

/**
 * Create a resumable event handler.
 *
 * The handler is serialized as a QRL and only loaded when invoked.
 *
 * @example
 * ```typescript
 * const handleClick = $(() => console.log('clicked'));
 * <button onClick$={handleClick}>Click me</button>
 * ```
 */
export { $ } from './qrl.js';

/**
 * Create an event handler that captures local state
 */
export function handler$<T extends (...args: unknown[]) => unknown>(
  fn: T,
  captures?: unknown[],
  captureNames?: string[]
): QRL<T> {
  return $(fn, captures, captureNames);
}

// ============================================================================
// Server-Side Rendering
// ============================================================================

/**
 * Render a resumable app to HTML
 */
export async function renderToResumableString(
  app: unknown,
  config?: ResumableConfig
): Promise<string> {
  const serializationOptions: { isDev?: boolean } = {};
  if (config?.isDev !== undefined) {
    serializationOptions.isDev = config.isDev;
  }

  const ctx: ResumableContext = {
    serialization: createSerializationContext(serializationOptions),
    componentStack: [],
    signals: new Map(),
    isServer: true,
    isHydrating: false,
  };

  // Render the app
  const html = await withResumableContext(ctx, () => {
    return renderToHTML(app);
  });

  // Generate state script
  const stateScript = generateStateScript(ctx.serialization);

  // Generate bootstrap script
  const bootstrapOptions: { basePath?: string } = {};
  if (config?.basePath !== undefined) {
    bootstrapOptions.basePath = config.basePath;
  }
  const bootstrapScript = generateBootstrapScript(bootstrapOptions);

  return `${html}${stateScript}${bootstrapScript}`;
}

/**
 * Render a VNode to HTML string
 */
function renderToHTML(vnode: unknown): string {
  if (vnode == null || vnode === false || vnode === true) {
    return '';
  }

  if (typeof vnode === 'string') {
    return escapeHTML(vnode);
  }

  if (typeof vnode === 'number') {
    return String(vnode);
  }

  if (Array.isArray(vnode)) {
    return vnode.map(renderToHTML).join('');
  }

  // Handle resumable signals
  if (typeof vnode === 'function' && '$id$' in vnode) {
    const signal = vnode as ResumableSignal<unknown>;
    const value = signal.peek();
    return `<span data-qsignal="${signal.$id$}">${renderToHTML(value)}</span>`;
  }

  // Handle plain functions (computations)
  if (typeof vnode === 'function') {
    return renderToHTML((vnode as () => unknown)());
  }

  // Handle JSX elements
  if (typeof vnode === 'object' && vnode !== null && 'type' in vnode) {
    const { type, props } = vnode as { type: unknown; props: Record<string, unknown> };

    // Handle fragments
    if (type === 'fragment' || type === null) {
      return renderToHTML(props['children']);
    }

    // Handle function components
    if (typeof type === 'function') {
      return renderToHTML((type as Function)(props));
    }

    // Handle special resumable markers
    if (type === 'phil-resumable' || type === 'phil-hydrate') {
      return renderElement('div', props);
    }

    // Handle HTML elements
    if (typeof type === 'string') {
      return renderElement(type, props);
    }
  }

  return String(vnode);
}

/**
 * Render an HTML element
 */
function renderElement(
  tag: string,
  props: Record<string, unknown>
): string {
  const ctx = getResumableContext();
  const attrs: string[] = [];
  let hasHandlers = false;
  const handlers: Array<{ event: string; qrl: string }> = [];

  // Process props
  for (const [key, value] of Object.entries(props)) {
    if (key === 'children') continue;

    // Handle event handlers
    if (key.startsWith('on') && key.endsWith('$')) {
      hasHandlers = true;
      const eventName = key.slice(2, -1).toLowerCase();
      if (isQRL(value)) {
        handlers.push({ event: eventName, qrl: value.serialize() });
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

    // Handle boolean attributes
    if (typeof value === 'boolean') {
      if (value) attrs.push(key);
      continue;
    }

    // Handle null/undefined
    if (value == null) continue;

    // Handle signals
    if (typeof value === 'function' && '$id$' in value) {
      const signal = value as ResumableSignal<unknown>;
      attrs.push(`${key}="${escapeAttr(String(signal.peek()))}"`);
      attrs.push(`data-qbind-${key}="${signal.$id$}"`);
      continue;
    }

    // Regular attributes
    attrs.push(`${key}="${escapeAttr(String(value))}"`);
  }

  // Add resumability attributes if needed
  if (hasHandlers && ctx) {
    const elementId = generateId(ctx.serialization);
    attrs.push(`data-qid="${elementId}"`);
    attrs.push(`data-qevents="${handlers.map(h => h.event).join(' ')}"`);

    // Register handlers
    registerElement(
      elementId,
      {
        handlers: handlers.map((h) => ({
          qrl: h.qrl,
          event: h.event,
        })),
      },
      ctx.serialization
    );
  }

  // Render children
  const children = renderToHTML(props['children']);

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
 * Escape HTML special characters
 */
function escapeHTML(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

/**
 * Escape attribute value
 */
function escapeAttr(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

/**
 * Convert camelCase to kebab-case
 */
function kebabCase(str: string): string {
  return str.replace(/([A-Z])/g, '-$1').toLowerCase();
}

// ============================================================================
// Client-Side Resume
// ============================================================================

/**
 * Resume an application on the client
 */
export function resume(config?: ResumableConfig): void {
  if (typeof window === 'undefined') return;

  // Initialize loader
  initLoader();

  // Initialize hydration
  initHydration();

  // Set up signal binding updates
  setupSignalBindings();

  // Dispatch ready event
  window.dispatchEvent(new CustomEvent('phil:resumed'));
}

/**
 * Set up signal bindings for reactive updates
 */
function setupSignalBindings(): void {
  if (typeof document === 'undefined') return;

  // Get state
  const stateEl = document.getElementById('__PHIL_STATE__');
  if (!stateEl) return;

  try {
    const state = JSON.parse(stateEl.textContent || '{}');

    // Find all elements with signal bindings
    const elements = document.querySelectorAll('[data-qsignal]');
    elements.forEach((element) => {
      const signalId = element.getAttribute('data-qsignal');
      if (signalId && state.signals?.[signalId]) {
        // Set up reactive update when signal changes
        // This would integrate with the signal system
      }
    });

    // Find all elements with attribute bindings
    document.querySelectorAll('[data-qbind]').forEach((element) => {
      const bindingsAttr = element.getAttribute('data-qbind');
      if (bindingsAttr) {
        // Parse bindings: "signalId:attrName signalId2:attrName2"
        const bindings = bindingsAttr.split(' ').map((b) => {
          const [signalId, attr] = b.split(':');
          return { signalId, attr };
        });

        // Set up reactive updates
        bindings.forEach(({ signalId, attr }) => {
          if (signalId && state.signals?.[signalId]) {
            // Would integrate with signal system
          }
        });
      }
    });
  } catch {
    console.error('[PhilJS] Failed to set up signal bindings');
  }
}

// ============================================================================
// Streaming SSR Support
// ============================================================================

/**
 * Create a streaming resumable renderer
 */
export function createStreamingRenderer(config?: ResumableConfig): {
  write: (chunk: unknown) => string;
  flush: () => string;
  end: () => string;
} {
  const serializationOptions: { isDev?: boolean } = {};
  if (config?.isDev !== undefined) {
    serializationOptions.isDev = config.isDev;
  }

  const ctx: ResumableContext = {
    serialization: createSerializationContext(serializationOptions),
    componentStack: [],
    signals: new Map(),
    isServer: true,
    isHydrating: false,
  };

  return {
    write(chunk: unknown): string {
      return withResumableContext(ctx, () => renderToHTML(chunk));
    },

    flush(): string {
      // Return any buffered content
      return '';
    },

    end(): string {
      // Generate final scripts
      const stateScript = generateStateScript(ctx.serialization);
      const bootstrapOptions: { basePath?: string } = {};
      if (config?.basePath !== undefined) {
        bootstrapOptions.basePath = config.basePath;
      }
      const bootstrapScript = generateBootstrapScript(bootstrapOptions);
      return `${stateScript}${bootstrapScript}`;
    },
  };
}

// ============================================================================
// Integration Helpers
// ============================================================================

/**
 * Check if we're on the server
 */
export function isServer(): boolean {
  return typeof window === 'undefined';
}

/**
 * Check if we're in a resumable context
 */
export function isResumable(): boolean {
  return currentContext !== null;
}

/**
 * Get the current component ID
 */
export function getCurrentComponentId(): string | undefined {
  const ctx = getResumableContext();
  if (!ctx) return undefined;
  return ctx.componentStack[ctx.componentStack.length - 1];
}

/**
 * Mark a component as static (never hydrate)
 */
export function static$<P>(
  component: (props: P) => unknown
): (props: P) => unknown {
  return (props: P) => {
    const result = component(props);
    // Wrap with static marker
    return {
      type: 'div',
      props: {
        'data-qstatic': 'true',
        children: result,
      },
    };
  };
}

/**
 * Create a client-only component
 */
export function client$<P>(
  component: (props: P) => unknown,
  fallback?: unknown
): (props: P) => unknown {
  return (props: P) => {
    if (isServer()) {
      // Return fallback or placeholder
      return fallback ?? {
        type: 'div',
        props: {
          'data-qclient': 'true',
          children: null,
        },
      };
    }
    return component(props);
  };
}

/**
 * Create a server-only component
 */
export function server$component<P>(
  component: (props: P) => unknown
): (props: P) => unknown {
  return (props: P) => {
    if (!isServer()) {
      // On client, return null
      return null;
    }
    return component(props);
  };
}
