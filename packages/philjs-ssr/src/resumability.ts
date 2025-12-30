/**
 * Resumability - Qwik-style State Serialization
 *
 * Eliminates hydration overhead by serializing application state and event handlers
 * to the DOM, allowing the client to "resume" instead of "hydrate".
 *
 * Key Benefits:
 * - Zero hydration cost
 * - Instant interactivity
 * - Progressive loading of event handlers
 * - Smaller initial JavaScript bundles
 *
 * Key Concepts:
 * - Components don't re-run on client
 * - Event handlers are serialized as QRLs (references)
 * - State is embedded in HTML as JSON
 * - Only the code needed for an interaction is loaded
 *
 * @see https://qwik.builder.io/docs/concepts/resumable/
 */

import { signal, memo as computed, effect, type Signal, type Memo } from 'philjs-core';

// ============================================================================
// Types
// ============================================================================

export interface ResumableState {
  /**
   * Unique ID for this state
   */
  id: string;

  /**
   * State data
   */
  data: any;

  /**
   * State type (signal, computed, etc.)
   */
  type: 'signal' | 'computed' | 'effect' | 'store';

  /**
   * Dependencies (for computed values)
   */
  deps?: string[];

  /**
   * Timestamp when serialized
   */
  timestamp: number;
}

export interface ResumableListener {
  /**
   * Event type (click, submit, etc.)
   */
  event: string;

  /**
   * Handler module path
   */
  module: string;

  /**
   * Handler function name
   */
  handler: string;

  /**
   * Element selector
   */
  selector: string;

  /**
   * Capture phase
   */
  capture?: boolean;
}

export interface ResumableContext {
  /**
   * All serialized state
   */
  state: Map<string, ResumableState>;

  /**
   * All event listeners
   */
  listeners: ResumableListener[];

  /**
   * Component boundaries
   */
  components: Map<string, ComponentBoundary>;

  /**
   * Lazy imports map
   */
  imports: Map<string, () => Promise<any>>;

  /**
   * QRL registry
   */
  qrls: Map<string, QRL<any>>;
}

export interface ComponentBoundary {
  id: string;
  type: string;
  props: Record<string, any>;
  children?: string[];
}

export interface ResumabilityOptions {
  /**
   * Enable state serialization
   */
  serializeState?: boolean;

  /**
   * Enable listener serialization
   */
  serializeListeners?: boolean;

  /**
   * Enable component boundaries
   */
  componentBoundaries?: boolean;

  /**
   * Custom state serializer
   */
  serializer?: (value: any) => string;

  /**
   * Custom state deserializer
   */
  deserializer?: (value: string) => any;

  /**
   * Maximum state size (bytes)
   */
  maxStateSize?: number;

  /**
   * Enable closure serialization
   */
  serializeClosures?: boolean;

  /**
   * Module base path for QRLs
   */
  moduleBasePath?: string;
}

// ============================================================================
// QRL (Qwik Resource Locator) - Lazy-loadable References
// ============================================================================

/**
 * QRL - A lazy-loadable reference to a function or value
 * Similar to Qwik's QRL, enables code splitting per handler
 */
export interface QRL<T extends (...args: any[]) => any = (...args: any[]) => any> {
  /** Symbol ID for lazy loading */
  __qrl__: true;
  /** Unique symbol for this QRL */
  symbol: string;
  /** Module path for dynamic import */
  chunk: string;
  /** Export name in the module */
  exportName: string;
  /** Captured closure state */
  capturedState?: Record<string, any>;
  /** The resolved function (after loading) */
  resolved?: T;
  /** Hash of the QRL for caching */
  hash: string;
}

/**
 * QRL Registry for tracking all lazy-loadable references
 */
class QRLRegistry {
  private qrls = new Map<string, QRL<any>>();
  private loadedModules = new Map<string, Promise<any>>();
  private symbolCounter = 0;

  /**
   * Register a QRL
   */
  register<T extends (...args: any[]) => any>(
    fn: T,
    options: {
      symbol?: string;
      chunk?: string;
      exportName?: string;
      capturedState?: Record<string, any>;
    } = {}
  ): QRL<T> {
    const symbol = options.symbol || `qrl_${this.symbolCounter++}`;
    const chunk = options.chunk || 'inline';
    const exportName = options.exportName || 'default';
    const hash = this.generateHash(symbol, chunk);

    const qrl: QRL<T> = {
      __qrl__: true,
      symbol,
      chunk,
      exportName,
      ...(options.capturedState !== undefined && { capturedState: options.capturedState }),
      ...(chunk === 'inline' && { resolved: fn }),
      hash,
    };

    this.qrls.set(symbol, qrl);
    return qrl;
  }

  /**
   * Resolve a QRL to its function
   */
  async resolve<T extends (...args: any[]) => any>(qrl: QRL<T>): Promise<T> {
    if (qrl.resolved) {
      return qrl.resolved;
    }

    // Load the module
    if (!this.loadedModules.has(qrl.chunk)) {
      this.loadedModules.set(qrl.chunk, import(/* @vite-ignore */ qrl.chunk));
    }

    const module = await this.loadedModules.get(qrl.chunk)!;
    const fn = module[qrl.exportName] as T;

    // Cache the resolved function
    qrl.resolved = fn;

    return fn;
  }

  /**
   * Get a QRL by symbol
   */
  get(symbol: string): QRL<any> | undefined {
    return this.qrls.get(symbol);
  }

  /**
   * Serialize all QRLs
   */
  serialize(): Array<{ symbol: string; chunk: string; exportName: string; capturedState?: Record<string, any> }> {
    return Array.from(this.qrls.values()).map(qrl => ({
      symbol: qrl.symbol,
      chunk: qrl.chunk,
      exportName: qrl.exportName,
      ...(qrl.capturedState !== undefined && { capturedState: qrl.capturedState }),
    }));
  }

  /**
   * Restore QRLs from serialized data
   */
  restore(data: Array<{ symbol: string; chunk: string; exportName: string; capturedState?: Record<string, any> }>): void {
    for (const item of data) {
      const qrl: QRL<any> = {
        __qrl__: true,
        symbol: item.symbol,
        chunk: item.chunk,
        exportName: item.exportName,
        ...(item.capturedState !== undefined && { capturedState: item.capturedState }),
        hash: this.generateHash(item.symbol, item.chunk),
      };
      this.qrls.set(item.symbol, qrl);
    }
  }

  /**
   * Generate a hash for a QRL
   */
  private generateHash(symbol: string, chunk: string): string {
    let hash = 0;
    const str = `${symbol}:${chunk}`;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash).toString(36);
  }

  /**
   * Clear all QRLs
   */
  clear(): void {
    this.qrls.clear();
    this.loadedModules.clear();
    this.symbolCounter = 0;
  }
}

/**
 * Global QRL registry
 */
export const qrlRegistry = new QRLRegistry();

/**
 * Create a QRL (Qwik Resource Locator) - a lazy-loadable function reference
 *
 * @example
 * ```tsx
 * // Create a QRL for a click handler
 * const handleClick = qrl(() => console.log('clicked'), 'handleClick');
 *
 * // With captured closure state
 * const handleSubmit = qrl(
 *   (data) => submitForm(data),
 *   'handleSubmit',
 *   { formId: 'myForm' }
 * );
 * ```
 */
export function qrl<T extends (...args: any[]) => any>(
  fn: T,
  symbol: string,
  capturedState?: Record<string, any>
): QRL<T> {
  return qrlRegistry.register(fn, {
    symbol,
    ...(capturedState !== undefined && { capturedState }),
    chunk: 'inline',
  });
}

/**
 * Create a QRL with a specific module path for code splitting
 */
export function qrlChunk<T extends (...args: any[]) => any>(
  chunk: string,
  exportName: string,
  symbol?: string,
  capturedState?: Record<string, any>
): QRL<T> {
  return qrlRegistry.register((() => {}) as T, {
    symbol: symbol || `${chunk}#${exportName}`,
    chunk,
    exportName,
    ...(capturedState !== undefined && { capturedState }),
  });
}

/**
 * Check if a value is a QRL
 */
export function isQRL(value: any): value is QRL<any> {
  return value != null && typeof value === 'object' && value.__qrl__ === true;
}

/**
 * Resolve a QRL to its function
 */
export async function resolveQRL<T extends (...args: any[]) => any>(qrl: QRL<T>): Promise<T> {
  return qrlRegistry.resolve(qrl);
}

// ============================================================================
// $ Prefix Function - Mark Functions as Lazy-loadable
// ============================================================================

/**
 * $ - Mark a function as lazy-loadable (Qwik-style)
 *
 * The $ suffix is a convention from Qwik that marks functions
 * that can be serialized and lazy-loaded.
 *
 * @example
 * ```tsx
 * // Mark a click handler as lazy-loadable
 * <button onClick={$(() => console.log('clicked'))}>
 *   Click me
 * </button>
 *
 * // With closure variables
 * const count = useResumable(0);
 * <button onClick={$(() => count.set(count() + 1))}>
 *   Increment: {count()}
 * </button>
 * ```
 */
export function $<T extends (...args: any[]) => any>(fn: T): QRL<T> {
  return qrl(fn, `$_${Date.now()}_${Math.random().toString(36).slice(2)}`);
}

/**
 * $$ - Mark a function with an explicit symbol name
 *
 * @example
 * ```tsx
 * const onClick = $$('handleClick', () => console.log('clicked'));
 * ```
 */
export function $$<T extends (...args: any[]) => any>(symbol: string, fn: T): QRL<T> {
  return qrl(fn, symbol);
}

/**
 * $closure - Mark a function with captured closure state
 *
 * @example
 * ```tsx
 * const userId = 123;
 * const onClick = $closure(() => fetchUser(userId), { userId });
 * ```
 */
export function $closure<T extends (...args: any[]) => any>(
  fn: T,
  capturedState: Record<string, any>
): QRL<T> {
  return qrl(fn, `$closure_${Date.now()}_${Math.random().toString(36).slice(2)}`, capturedState);
}

// ============================================================================
// State Serialization
// ============================================================================

const stateRegistry = new Map<string, any>();
const listenerRegistry = new Map<string, ResumableListener>();
let stateIdCounter = 0;

/**
 * Register a signal for resumability
 */
export function resumable<T>(
  initialValue: T | (() => T),
  options: { id?: string } = {}
): Signal<T> {
  const id = options.id || `s${stateIdCounter++}`;

  // Check if we're resuming from serialized state
  const serializedState = getSerializedState(id);
  const value = serializedState !== undefined ? serializedState : (
    typeof initialValue === 'function' ? (initialValue as () => T)() : initialValue
  );

  const sig = signal<T>(value);

  // Register for serialization
  stateRegistry.set(id, {
    signal: sig,
    type: 'signal',
    id,
  });

  return sig;
}

/**
 * useResumable - Hook-style API for resumable signals
 *
 * @example
 * ```tsx
 * function Counter() {
 *   const count = useResumable(0, { id: 'counter' });
 *
 *   return (
 *     <button onClick={$(() => count.set(count() + 1))}>
 *       Count: {count()}
 *     </button>
 *   );
 * }
 * ```
 */
export function useResumable<T>(
  initialValue: T,
  options: { id?: string } = {}
): Signal<T> {
  return resumable(initialValue, options);
}

/**
 * Create a resumable computed value
 * Returns a Signal that wraps the computed value for consistent API
 */
export function resumableComputed<T>(
  fn: () => T,
  deps: Signal<any>[],
  options: { id?: string } = {}
): Signal<T> {
  const id = options.id || `c${stateIdCounter++}`;

  // Check if we're resuming
  const serializedState = getSerializedState(id);

  if (serializedState !== undefined) {
    // Resume: use cached value without re-computing
    const sig = signal<T>(serializedState);

    // Register for future updates
    effect(() => {
      const newValue = fn();
      sig.set(newValue);
    });

    stateRegistry.set(id, {
      signal: sig,
      type: 'computed',
      id,
      deps: deps.map((_, i) => `dep${i}`),
    });

    return sig;
  } else {
    // Fresh computation - wrap in a signal for consistent API
    const sig = signal<T>(fn());

    // Set up effect to update when dependencies change
    effect(() => {
      const newValue = fn();
      sig.set(newValue);
    });

    stateRegistry.set(id, {
      signal: sig,
      type: 'computed',
      id,
      deps: deps.map((_, i) => `dep${i}`),
    });

    return sig;
  }
}

/**
 * Serialize all registered state
 */
export function serializeState(options: ResumabilityOptions = {}): string {
  const {
    serializer = JSON.stringify,
    maxStateSize = 1024 * 1024, // 1MB default
  } = options;

  const stateMap: Record<string, ResumableState> = {};

  for (const [id, entry] of Array.from(stateRegistry.entries())) {
    const value = entry.signal();

    stateMap[id] = {
      id,
      type: entry.type,
      data: value,
      deps: entry.deps,
      timestamp: Date.now(),
    };
  }

  const serialized = serializer(stateMap);

  // Check size
  if (serialized.length > maxStateSize) {
    console.warn(
      `[Resumability] Serialized state exceeds maxStateSize (${serialized.length} > ${maxStateSize})`
    );
  }

  return serialized;
}

/**
 * Deserialize and restore state
 */
export function deserializeState(
  serialized: string,
  options: ResumabilityOptions = {}
): void {
  const { deserializer = JSON.parse } = options;

  try {
    const stateMap: Record<string, ResumableState> = deserializer(serialized);

    // Store in global context for resumption
    if (typeof window !== 'undefined') {
      (window as any).__PHILJS_RESUMABLE_STATE__ = stateMap;
    }
  } catch (error) {
    console.error('[Resumability] Failed to deserialize state:', error);
  }
}

/**
 * Resume app from serialized state
 *
 * @example
 * ```tsx
 * // On client-side
 * const serializedState = document.getElementById('__PHILJS_STATE__')?.textContent;
 * if (serializedState) {
 *   await resumeFromState(serializedState);
 * }
 * ```
 */
export async function resumeFromState(
  serializedState: string,
  options: ResumabilityOptions = {}
): Promise<void> {
  const { deserializer = JSON.parse } = options;

  try {
    const data = deserializer(serializedState);

    // Mark as resuming
    if (typeof window !== 'undefined') {
      (window as any).__PHILJS_RESUMING__ = true;
    }

    // Restore state
    if (data.state) {
      const stateMap: Record<string, ResumableState> = {};
      if (Array.isArray(data.state)) {
        for (const [id, state] of data.state) {
          stateMap[id] = state;
        }
      } else {
        Object.assign(stateMap, data.state);
      }
      deserializeState(JSON.stringify(stateMap), options);
    }

    // Restore QRLs
    if (data.qrls && Array.isArray(data.qrls)) {
      qrlRegistry.restore(data.qrls);
    }

    // Resume listeners with event delegation
    if (data.listeners && Array.isArray(data.listeners)) {
      setupEventDelegation(data.listeners);
    }

    // Restore component boundaries
    if (data.components) {
      const components = Array.isArray(data.components)
        ? data.components
        : Object.entries(data.components);
      for (const [id, boundary] of components) {
        componentRegistry.set(id, boundary as ComponentBoundary);
      }
    }

    // Mark as resumed
    if (typeof window !== 'undefined') {
      (window as any).__PHILJS_RESUMING__ = false;
      (window as any).__PHILJS_RESUMED__ = true;
    }

    console.log('[Resumability] Application resumed successfully');
  } catch (error) {
    console.error('[Resumability] Failed to resume from state:', error);
    throw error;
  }
}

/**
 * Set up event delegation for lazy-loaded handlers
 */
function setupEventDelegation(listeners: ResumableListener[]): void {
  if (typeof document === 'undefined') return;

  const delegatedEvents = new Set(listeners.map(l => l.event));

  for (const eventType of Array.from(delegatedEvents)) {
    document.addEventListener(
      eventType,
      async (event) => {
        const target = event.target as HTMLElement;
        if (!target) return;

        // Find element with QRL handler
        let element: HTMLElement | null = target;
        while (element && element !== document.body) {
          const qrlAttr = element.getAttribute(`data-qrl-${eventType}`);
          if (qrlAttr) {
            event.preventDefault();

            // Resolve and execute the QRL
            const qrlRef = qrlRegistry.get(qrlAttr);
            if (qrlRef) {
              try {
                const fn = await resolveQRL(qrlRef);
                await fn(event, qrlRef.capturedState);
              } catch (error) {
                console.error(`[Resumability] Failed to execute handler:`, error);
              }
            }
            return;
          }
          element = element.parentElement;
        }
      },
      { capture: true }
    );
  }
}

/**
 * Get serialized state by ID
 */
function getSerializedState(id: string): any {
  if (typeof window === 'undefined') return undefined;

  const stateMap = (window as any).__PHILJS_RESUMABLE_STATE__;
  if (!stateMap) return undefined;

  const state = stateMap[id];
  return state?.data;
}

/**
 * Clear serialized state from memory
 */
export function clearSerializedState(): void {
  if (typeof window !== 'undefined') {
    delete (window as any).__PHILJS_RESUMABLE_STATE__;
    delete (window as any).__PHILJS_RESUMING__;
    delete (window as any).__PHILJS_RESUMED__;
  }
  stateRegistry.clear();
  listenerRegistry.clear();
  componentRegistry.clear();
  qrlRegistry.clear();
  stateIdCounter = 0;
}

// ============================================================================
// Event Listener Serialization
// ============================================================================

/**
 * Register an event listener for lazy loading
 */
export function on<K extends keyof HTMLElementEventMap>(
  event: K,
  handler: (event: HTMLElementEventMap[K]) => void,
  options: {
    module?: string;
    name?: string;
    capture?: boolean;
  } = {}
): string {
  const listenerId = `l${listenerRegistry.size}`;

  listenerRegistry.set(listenerId, {
    event,
    module: options.module || 'unknown',
    handler: options.name || 'handler',
    selector: `[data-listener="${listenerId}"]`,
    ...(options.capture !== undefined && { capture: options.capture }),
  });

  // In production, we don't attach the handler immediately
  // It will be loaded lazily when the event fires
  if (typeof window !== 'undefined' && !(window as any).__PHILJS_RESUMING__) {
    // Development mode: attach immediately
    setTimeout(() => attachListener(listenerId, handler), 0);
  }

  return listenerId;
}

/**
 * Attach a lazy listener
 */
function attachListener(listenerId: string, handler: Function): void {
  const listener = listenerRegistry.get(listenerId);
  if (!listener) return;

  const elements = document.querySelectorAll(listener.selector);

  elements.forEach(element => {
    element.addEventListener(
      listener.event,
      handler as EventListener,
      { ...(listener.capture !== undefined && { capture: listener.capture }) }
    );
  });
}

/**
 * Serialize all registered listeners
 */
export function serializeListeners(): ResumableListener[] {
  return Array.from(listenerRegistry.values());
}

/**
 * Resume event listeners from serialized data
 */
export async function resumeListeners(
  listeners: ResumableListener[],
  importMap: Map<string, () => Promise<any>>
): Promise<void> {
  if (typeof window === 'undefined') return;

  // Mark as resuming
  (window as any).__PHILJS_RESUMING__ = true;

  // Set up global event delegation
  const delegatedEvents = new Set(listeners.map(l => l.event));

  for (const eventType of Array.from(delegatedEvents)) {
    document.addEventListener(
      eventType,
      async (event) => {
        const target = event.target as HTMLElement;
        const listenerId = target.getAttribute('data-listener');

        if (!listenerId) return;

        const listener = listeners.find(l => l.selector === `[data-listener="${listenerId}"]`);
        if (!listener) return;

        // Lazy load the handler module
        const importFn = importMap.get(listener.module);
        if (!importFn) {
          console.warn(`[Resumability] No import found for module: ${listener.module}`);
          return;
        }

        try {
          const module = await importFn();
          const handler = module[listener.handler];

          if (typeof handler === 'function') {
            handler(event);
          }
        } catch (error) {
          console.error(`[Resumability] Failed to load handler:`, error);
        }
      },
      { capture: true }
    );
  }

  // Mark as resumed
  (window as any).__PHILJS_RESUMING__ = false;
}

// ============================================================================
// Component Boundaries
// ============================================================================

const componentRegistry = new Map<string, ComponentBoundary>();

/**
 * Mark a component boundary for lazy loading
 */
export function boundary(
  id: string,
  type: string,
  props: Record<string, any>,
  children?: string[]
): ComponentBoundary {
  const boundary: ComponentBoundary = { id, type, props, ...(children !== undefined && { children }) };
  componentRegistry.set(id, boundary);
  return boundary;
}

/**
 * Serialize component boundaries
 */
export function serializeBoundaries(): ComponentBoundary[] {
  return Array.from(componentRegistry.values());
}

/**
 * Get a component boundary by ID
 */
export function getBoundary(id: string): ComponentBoundary | undefined {
  return componentRegistry.get(id);
}

// ============================================================================
// Resumable App Wrapper
// ============================================================================

export interface ResumableAppOptions {
  /**
   * Module base path for code splitting
   */
  moduleBasePath?: string;

  /**
   * Enable automatic QRL extraction
   */
  autoQRL?: boolean;

  /**
   * Enable state serialization
   */
  serializeState?: boolean;

  /**
   * Import map for lazy loading
   */
  importMap?: Map<string, () => Promise<any>>;
}

export interface ResumableApp<T> {
  /**
   * The wrapped component
   */
  Component: T;

  /**
   * Render the app to HTML with embedded state
   */
  render: () => string;

  /**
   * Get the serialized state
   */
  getState: () => string;

  /**
   * Resume the app on the client
   */
  resume: () => Promise<void>;

  /**
   * Clean up resources
   */
  dispose: () => void;
}

/**
 * Create a resumable app wrapper
 *
 * This wraps a component to make it fully resumable, meaning:
 * - State is serialized to HTML
 * - Event handlers become QRLs
 * - No re-execution of component code on client
 *
 * @example
 * ```tsx
 * // Server-side
 * const app = createResumableApp(MyApp);
 * const html = app.render();
 *
 * // Client-side
 * const app = createResumableApp(MyApp);
 * await app.resume();
 * ```
 */
export function createResumableApp<T extends (...args: any[]) => any>(
  component: T,
  options: ResumableAppOptions = {}
): ResumableApp<T> {
  const {
    moduleBasePath = '/',
    autoQRL = true,
    serializeState: shouldSerializeState = true,
  } = options;

  // Create a boundary for the app root
  const appBoundaryId = `app_${Date.now()}`;
  boundary(appBoundaryId, component.name || 'App', {});

  return {
    Component: component,

    render(): string {
      // This would integrate with the SSR renderer
      // For now, return a placeholder that would be filled by the actual renderer
      const context = createResumableContext(options.importMap);
      const stateJson = serializeContext(context);

      return `
        <div id="__philjs_app__" data-boundary="${appBoundaryId}">
          <!-- Component HTML would be rendered here -->
        </div>
        ${generateResumeScript(stateJson, { moduleBasePath })}
      `;
    },

    getState(): string {
      const context = createResumableContext(options.importMap);
      return serializeContext(context);
    },

    async resume(): Promise<void> {
      const context = extractResumableState();
      if (!context) {
        console.warn('[Resumability] No state found to resume from');
        return;
      }

      await resumeFromState(JSON.stringify({
        state: Array.from(context.state.entries()),
        listeners: context.listeners,
        components: Array.from(context.components.entries()),
        qrls: qrlRegistry.serialize(),
      }));
    },

    dispose(): void {
      clearSerializedState();
      componentRegistry.delete(appBoundaryId);
    },
  };
}

/**
 * Generate the client-side resume script
 */
function generateResumeScript(
  stateJson: string,
  options: { moduleBasePath?: string } = {}
): string {
  const { moduleBasePath = '/' } = options;

  return `
    <script type="application/json" id="__PHILJS_RESUMABLE__">
      ${stateJson}
    </script>
    <script type="module">
      // PhilJS Resumability Runtime
      (function() {
        const resumableData = document.getElementById('__PHILJS_RESUMABLE__');
        if (!resumableData) return;

        try {
          const context = JSON.parse(resumableData.textContent);

          // Store state for signal resumption
          window.__PHILJS_RESUMABLE_STATE__ = {};
          if (context.state) {
            for (const [id, state] of context.state) {
              window.__PHILJS_RESUMABLE_STATE__[id] = state;
            }
          }

          // Set up event delegation for lazy handlers
          const eventTypes = new Set();
          if (context.listeners) {
            context.listeners.forEach(l => eventTypes.add(l.event));
          }

          // QRL resolution
          const qrlCache = new Map();
          async function resolveQRL(symbol, chunk, exportName) {
            const key = symbol + ':' + chunk;
            if (!qrlCache.has(key)) {
              const modulePath = chunk === 'inline'
                ? null
                : '${moduleBasePath}' + chunk;
              if (modulePath) {
                const mod = await import(modulePath);
                qrlCache.set(key, mod[exportName]);
              }
            }
            return qrlCache.get(key);
          }

          // Event delegation
          for (const eventType of eventTypes) {
            document.addEventListener(eventType, async (event) => {
              const target = event.target;
              let el = target;

              while (el && el !== document.body) {
                const qrlAttr = el.getAttribute('data-qrl-' + eventType);
                if (qrlAttr) {
                  const qrl = context.qrls?.find(q => q.symbol === qrlAttr);
                  if (qrl) {
                    const fn = await resolveQRL(qrl.symbol, qrl.chunk, qrl.exportName);
                    if (fn) {
                      fn(event, qrl.capturedState);
                    }
                  }
                  break;
                }
                el = el.parentElement;
              }
            }, { capture: true });
          }

          window.__PHILJS_RESUMED__ = true;
          console.log('[PhilJS] Resumed successfully');
        } catch (error) {
          console.error('[PhilJS] Resume failed:', error);
        }
      })();
    </script>
  `;
}

// ============================================================================
// Full Resumability Context
// ============================================================================

/**
 * Create a complete resumable context
 */
export function createResumableContext(
  importMap: Map<string, () => Promise<any>> = new Map()
): ResumableContext {
  return {
    state: new Map(
      Array.from(stateRegistry.entries()).map(([id, entry]) => [
        id,
        {
          id,
          type: entry.type,
          data: entry.signal(),
          deps: entry.deps,
          timestamp: Date.now(),
        },
      ])
    ),
    listeners: serializeListeners(),
    components: new Map(componentRegistry),
    imports: importMap,
    qrls: new Map(
      qrlRegistry.serialize().map(q => [q.symbol, {
        __qrl__: true as const,
        ...q,
        hash: '',
      }])
    ),
  };
}

/**
 * Serialize resumable context to JSON
 */
export function serializeContext(
  context: ResumableContext,
  options: ResumabilityOptions = {}
): string {
  const { serializer = JSON.stringify } = options;

  return serializer({
    state: Array.from(context.state.entries()),
    listeners: context.listeners,
    components: Array.from(context.components.entries()),
    qrls: qrlRegistry.serialize(),
    timestamp: Date.now(),
  });
}

/**
 * Deserialize and resume from context
 */
export async function resumeContext(
  serialized: string,
  importMap: Map<string, () => Promise<any>>,
  options: ResumabilityOptions = {}
): Promise<void> {
  const { deserializer = JSON.parse } = options;

  try {
    const data = deserializer(serialized);

    // Restore state
    const stateMap: Record<string, ResumableState> = {};
    for (const [id, state] of data.state) {
      stateMap[id] = state;
    }
    deserializeState(JSON.stringify(stateMap), options);

    // Restore QRLs
    if (data.qrls) {
      qrlRegistry.restore(data.qrls);
    }

    // Resume listeners
    await resumeListeners(data.listeners, importMap);

    // Restore component boundaries
    for (const [id, boundary] of data.components) {
      componentRegistry.set(id, boundary);
    }

    console.log('[Resumability] Application resumed successfully');
  } catch (error) {
    console.error('[Resumability] Failed to resume context:', error);
  }
}

// ============================================================================
// SSR Integration
// ============================================================================

/**
 * Inject resumable state into HTML
 */
export function injectResumableState(
  html: string,
  context: ResumableContext,
  options: ResumabilityOptions = {}
): string {
  const serialized = serializeContext(context, options);
  const script = generateResumeScript(serialized, { ...(options.moduleBasePath !== undefined && { moduleBasePath: options.moduleBasePath }) });

  // Inject before closing </body> tag
  return html.replace('</body>', `${script}</body>`);
}

/**
 * Extract resumable state from HTML
 */
export function extractResumableState(): ResumableContext | null {
  if (typeof document === 'undefined') return null;

  const script = document.getElementById('__PHILJS_RESUMABLE__');
  if (!script || !script.textContent) return null;

  try {
    const data = JSON.parse(script.textContent);
    return {
      state: new Map(data.state),
      listeners: data.listeners,
      components: new Map(data.components),
      imports: new Map(),
      qrls: new Map(data.qrls?.map((q: any) => [q.symbol, { __qrl__: true, ...q, hash: '' }]) || []),
    };
  } catch (error) {
    console.error('[Resumability] Failed to extract state:', error);
    return null;
  }
}

// ============================================================================
// Closure Serialization
// ============================================================================

/**
 * Serialize a closure's captured variables
 *
 * This attempts to extract the variables captured by a closure.
 * In production, this would be handled by the compiler.
 */
export function serializeClosure(
  fn: Function,
  capturedVars: Record<string, any>
): { code: string; captured: Record<string, any> } {
  return {
    code: fn.toString(),
    captured: serializeClosureVars(capturedVars),
  };
}

/**
 * Serialize closure variables, handling special types
 */
function serializeClosureVars(vars: Record<string, any>): Record<string, any> {
  const result: Record<string, any> = {};

  for (const [key, value] of Object.entries(vars)) {
    if (typeof value === 'function') {
      // Functions become QRLs
      const qrlRef = qrl(value, `closure_${key}`);
      result[key] = { __type: 'qrl', symbol: qrlRef.symbol };
    } else if (value && typeof value === 'object' && 'set' in value && typeof value.set === 'function') {
      // Signals become state references
      const stateId = `closure_signal_${key}`;
      stateRegistry.set(stateId, { signal: value, type: 'signal', id: stateId });
      result[key] = { __type: 'signal', id: stateId };
    } else {
      // Regular values are serialized directly
      try {
        // ES2024: structuredClone() is faster and handles more types
        result[key] = structuredClone(value);
      } catch {
        result[key] = String(value);
      }
    }
  }

  return result;
}

/**
 * Deserialize closure variables
 */
export function deserializeClosureVars(vars: Record<string, any>): Record<string, any> {
  const result: Record<string, any> = {};

  for (const [key, value] of Object.entries(vars)) {
    if (value && typeof value === 'object') {
      if (value.__type === 'qrl') {
        // Resolve QRL
        const qrlRef = qrlRegistry.get(value.symbol);
        result[key] = qrlRef ? qrlRef.resolved : undefined;
      } else if (value.__type === 'signal') {
        // Resolve signal
        const entry = stateRegistry.get(value.id);
        result[key] = entry?.signal;
      } else {
        result[key] = value;
      }
    } else {
      result[key] = value;
    }
  }

  return result;
}

// ============================================================================
// Development Tools
// ============================================================================

/**
 * Get resumability stats
 */
export function getResumabilityStats(): {
  stateCount: number;
  listenerCount: number;
  componentCount: number;
  qrlCount: number;
  estimatedSize: number;
} {
  const serialized = serializeState();

  return {
    stateCount: stateRegistry.size,
    listenerCount: listenerRegistry.size,
    componentCount: componentRegistry.size,
    qrlCount: qrlRegistry.serialize().length,
    estimatedSize: new Blob([serialized]).size,
  };
}

/**
 * Log resumability information
 */
export function logResumabilityInfo(): void {
  const stats = getResumabilityStats();

  console.group('[Resumability] Stats');
  console.log(`State entries: ${stats.stateCount}`);
  console.log(`Event listeners: ${stats.listenerCount}`);
  console.log(`Component boundaries: ${stats.componentCount}`);
  console.log(`QRL references: ${stats.qrlCount}`);
  console.log(`Estimated size: ${(stats.estimatedSize / 1024).toFixed(2)} KB`);
  console.groupEnd();
}

// ============================================================================
// Utilities
// ============================================================================

/**
 * Check if app is currently resuming
 */
export function isResuming(): boolean {
  if (typeof window === 'undefined') return false;
  return (window as any).__PHILJS_RESUMING__ === true;
}

/**
 * Check if app has resumed
 */
export function hasResumed(): boolean {
  if (typeof window === 'undefined') return false;
  return (window as any).__PHILJS_RESUMED__ === true;
}

/**
 * Check if resumable state is available
 */
export function hasResumableState(): boolean {
  if (typeof window === 'undefined') return false;
  return (window as any).__PHILJS_RESUMABLE_STATE__ !== undefined;
}

/**
 * Enable resumability for an app
 */
export function enableResumability(options: ResumabilityOptions = {}): void {
  if (typeof window === 'undefined') return;

  // Extract and restore state
  const context = extractResumableState();
  if (!context) {
    console.warn('[Resumability] No resumable state found');
    return;
  }

  // Mark as resuming
  (window as any).__PHILJS_RESUMING__ = true;

  // Restore state
  const stateMap: Record<string, ResumableState> = {};
  for (const [id, state] of Array.from(context.state.entries())) {
    stateMap[id] = state;
  }
  deserializeState(JSON.stringify(stateMap), options);

  // Clean up script tag
  const script = document.getElementById('__PHILJS_RESUMABLE__');
  script?.remove();

  console.log('[Resumability] Enabled successfully');
}

/**
 * Wait for the app to resume
 */
export function onResume(callback: () => void): void {
  if (typeof window === 'undefined') return;

  if ((window as any).__PHILJS_RESUMED__) {
    callback();
  } else {
    const check = setInterval(() => {
      if ((window as any).__PHILJS_RESUMED__) {
        clearInterval(check);
        callback();
      }
    }, 10);

    // Timeout after 5 seconds
    setTimeout(() => clearInterval(check), 5000);
  }
}
