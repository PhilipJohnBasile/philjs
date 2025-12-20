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
 * @see https://qwik.builder.io/docs/concepts/resumable/
 */

import { signal, computed, effect, type Signal } from 'philjs-core/signals';

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
 * Create a resumable computed value
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

    return sig;
  } else {
    // Fresh computation
    const comp = computed(fn);

    stateRegistry.set(id, {
      signal: comp,
      type: 'computed',
      id,
      deps: deps.map((_, i) => `dep${i}`),
    });

    return comp;
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

  for (const [id, entry] of stateRegistry) {
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
  }
  stateRegistry.clear();
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
    capture: options.capture,
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
      { capture: listener.capture }
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

  for (const eventType of delegatedEvents) {
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
  const boundary: ComponentBoundary = { id, type, props, children };
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

  const script = `
    <script type="application/json" id="__PHILJS_RESUMABLE__">
      ${serialized}
    </script>
    <script type="module">
      // Auto-resume on load
      const resumableData = document.getElementById('__PHILJS_RESUMABLE__');
      if (resumableData) {
        const context = JSON.parse(resumableData.textContent);
        window.__PHILJS_RESUMABLE_STATE__ = Object.fromEntries(context.state);
      }
    </script>
  `;

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
    };
  } catch (error) {
    console.error('[Resumability] Failed to extract state:', error);
    return null;
  }
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
  estimatedSize: number;
} {
  const serialized = serializeState();

  return {
    stateCount: stateRegistry.size,
    listenerCount: listenerRegistry.size,
    componentCount: componentRegistry.size,
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
  for (const [id, state] of context.state) {
    stateMap[id] = state;
  }
  deserializeState(JSON.stringify(stateMap), options);

  // Clean up script tag
  const script = document.getElementById('__PHILJS_RESUMABLE__');
  script?.remove();

  console.log('[Resumability] Enabled successfully');
}
