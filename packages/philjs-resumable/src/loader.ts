/**
 * Lazy Component Loader for Resumability
 *
 * This module handles lazy loading of component code on interaction.
 * Components are not loaded until the user interacts with them,
 * achieving zero JavaScript execution until interaction.
 *
 * @example
 * ```typescript
 * // Register components for lazy loading
 * registerLazyComponent('Counter', () => import('./Counter'));
 *
 * // On interaction, the loader fetches and hydrates
 * await loadComponent('Counter', element);
 * ```
 */

import type { QRL } from './qrl.js';
import { parseQRL, configureQRL } from './qrl.js';
import {
  type SerializationContext,
  type SerializedElement,
  deserializeValue,
} from './serializer.js';

// ============================================================================
// Types
// ============================================================================

/**
 * A lazy component loader function
 */
export type ComponentLoader = () => Promise<{
  default?: unknown;
  [key: string]: unknown;
}>;

/**
 * Component definition with metadata
 */
export interface LazyComponent {
  /** Component identifier */
  id: string;
  /** Loader function */
  loader: ComponentLoader;
  /** Preloaded module (after prefetch) */
  preloaded?: Promise<unknown>;
  /** Resolved component */
  resolved?: unknown;
  /** Loading state */
  status: 'idle' | 'loading' | 'loaded' | 'error';
  /** Error if loading failed */
  error?: Error;
}

/**
 * Loader configuration
 */
export interface LoaderConfig {
  /** Base path for chunk loading */
  basePath: string;
  /** Custom chunk resolver */
  resolver?: (chunkPath: string) => Promise<Record<string, unknown>>;
  /** Enable prefetching on hover/focus */
  prefetchOnHover: boolean;
  /** Prefetch timeout in ms */
  prefetchTimeout: number;
  /** Maximum concurrent loads */
  maxConcurrent: number;
  /** Retry failed loads */
  retryOnError: boolean;
  /** Maximum retries */
  maxRetries: number;
  /** Retry delay in ms */
  retryDelay: number;
  /** Development mode */
  isDev: boolean;
}

/**
 * Load request for queuing
 */
interface LoadRequest {
  id: string;
  element: Element;
  qrl: string;
  resolve: (value: unknown) => void;
  reject: (error: Error) => void;
  retries: number;
}

// ============================================================================
// Loader State
// ============================================================================

const defaultConfig: LoaderConfig = {
  basePath: '',
  prefetchOnHover: true,
  prefetchTimeout: 100,
  maxConcurrent: 4,
  retryOnError: true,
  maxRetries: 3,
  retryDelay: 1000,
  isDev: false,
};

let config: LoaderConfig = { ...defaultConfig };

/** Registry of lazy components */
const componentRegistry = new Map<string, LazyComponent>();

/** Chunk cache */
const chunkCache = new Map<string, Promise<Record<string, unknown>>>();

/** Active load requests */
const activeLoads = new Map<string, Promise<unknown>>();

/** Pending load queue */
const loadQueue: LoadRequest[] = [];

/** Number of currently loading components */
let loadingCount = 0;

/** Client-side state from server */
let clientState: {
  signals: Record<string, unknown>;
  elements: Record<string, SerializedElement>;
  components: Record<string, { qrl: string; props: Record<string, unknown> }>;
} | null = null;

// ============================================================================
// Configuration
// ============================================================================

/**
 * Configure the lazy loader
 */
export function configureLoader(options: Partial<LoaderConfig>): void {
  config = { ...config, ...options };

  // Also configure QRL base path
  if (options.basePath !== undefined || options.resolver !== undefined) {
    configureQRL({
      basePath: options.basePath,
      resolver: options.resolver,
    });
  }
}

/**
 * Get current loader configuration
 */
export function getLoaderConfig(): Readonly<LoaderConfig> {
  return config;
}

// ============================================================================
// Component Registration
// ============================================================================

/**
 * Register a component for lazy loading
 */
export function registerLazyComponent(
  id: string,
  loader: ComponentLoader
): LazyComponent {
  const component: LazyComponent = {
    id,
    loader,
    status: 'idle',
  };

  componentRegistry.set(id, component);
  return component;
}

/**
 * Register multiple components
 */
export function registerLazyComponents(
  components: Record<string, ComponentLoader>
): void {
  for (const [id, loader] of Object.entries(components)) {
    registerLazyComponent(id, loader);
  }
}

/**
 * Get a registered component
 */
export function getLazyComponent(id: string): LazyComponent | undefined {
  return componentRegistry.get(id);
}

/**
 * Check if a component is registered
 */
export function hasLazyComponent(id: string): boolean {
  return componentRegistry.has(id);
}

// ============================================================================
// Chunk Loading
// ============================================================================

/**
 * Load a chunk by path
 */
async function loadChunk(chunkPath: string): Promise<Record<string, unknown>> {
  // Check cache
  if (chunkCache.has(chunkPath)) {
    return chunkCache.get(chunkPath)!;
  }

  // Start loading
  const loadPromise = (async () => {
    const fullPath = config.basePath
      ? `${config.basePath}/${chunkPath}`
      : chunkPath;

    if (config.resolver) {
      return config.resolver(fullPath);
    }

    // Dynamic import
    return import(/* @vite-ignore */ fullPath);
  })();

  chunkCache.set(chunkPath, loadPromise);
  return loadPromise;
}

/**
 * Prefetch a chunk without blocking
 */
export function prefetchChunk(chunkPath: string): void {
  if (chunkCache.has(chunkPath)) return;

  // Use link preload for better browser optimization
  if (typeof document !== 'undefined') {
    const link = document.createElement('link');
    link.rel = 'modulepreload';
    link.href = config.basePath
      ? `${config.basePath}/${chunkPath}`
      : chunkPath;
    document.head.appendChild(link);
  }
}

// ============================================================================
// Component Loading
// ============================================================================

/**
 * Load a component by ID
 */
export async function loadComponent(id: string): Promise<unknown> {
  const component = componentRegistry.get(id);
  if (!component) {
    throw new Error(`Component "${id}" not registered`);
  }

  // Return cached if already loaded
  if (component.status === 'loaded' && component.resolved) {
    return component.resolved;
  }

  // Return existing promise if loading
  if (component.status === 'loading' && activeLoads.has(id)) {
    return activeLoads.get(id)!;
  }

  // Start loading
  component.status = 'loading';

  const loadPromise = (async () => {
    try {
      const module = await component.loader();
      component.resolved = module.default || module;
      component.status = 'loaded';
      return component.resolved;
    } catch (error) {
      component.status = 'error';
      component.error = error instanceof Error ? error : new Error(String(error));
      throw component.error;
    } finally {
      activeLoads.delete(id);
    }
  })();

  activeLoads.set(id, loadPromise);
  return loadPromise;
}

/**
 * Load a component from a QRL string
 */
export async function loadFromQRL(qrl: string | QRL): Promise<unknown> {
  const qrlObj = typeof qrl === 'string' ? parseQRL(qrl) : qrl;
  return qrlObj.resolve();
}

/**
 * Load and hydrate an element.
 *
 * This function:
 * 1. Checks if the element is already hydrated
 * 2. Retrieves serialized state from the DOM
 * 3. Loads the component code lazily
 * 4. Deserializes props and state
 * 5. Hydrates the component into the element
 * 6. Marks the element as hydrated
 *
 * @param element - The DOM element to hydrate
 * @param options - Hydration options
 * @param options.force - Force reload even if already hydrated
 * @param options.state - Additional state to pass to the component
 *
 * @throws {Error} If component loading fails
 *
 * @example
 * ```typescript
 * const element = document.querySelector('[data-qid="q0"]');
 * await loadAndHydrate(element);
 * ```
 */
export async function loadAndHydrate(
  element: Element,
  options?: {
    /** Force reload even if already hydrated */
    force?: boolean;
    /** State to pass to the component */
    state?: Record<string, unknown>;
  }
): Promise<void> {
  // Check if already hydrated
  if (!options?.force && element.hasAttribute('data-qhydrated')) {
    if (config.isDev) {
      console.debug('[PhilJS Loader] Element already hydrated:', element);
    }
    return;
  }

  const qid = element.getAttribute('data-qid');
  if (!qid) {
    const error = new Error('Element missing data-qid attribute');
    if (config.isDev) {
      console.warn('[PhilJS Loader]', error.message, element);
    }
    throw error;
  }

  // Get element state
  const elementState = clientState?.elements[qid];
  const componentInfo = clientState?.components[qid];

  if (!componentInfo && !elementState) {
    const error = new Error(`No state found for element ${qid}`);
    if (config.isDev) {
      console.warn('[PhilJS Loader]', error.message);
    }
    throw error;
  }

  // Load the component
  if (componentInfo) {
    const qrlObj = parseQRL(componentInfo.qrl);
    const Component = await qrlObj.resolve();

    // Deserialize props
    const props: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(componentInfo.props)) {
      props[key] = deserializeValue(value as any);
    }

    // Merge with runtime state
    if (options?.state) {
      Object.assign(props, options.state);
    }

    // Hydrate the component
    if (typeof Component === 'function') {
      await hydrateComponent(element, Component as Function, props);
    }
  }

  // Mark as hydrated
  element.setAttribute('data-qhydrated', 'true');
}

/**
 * Hydrate a component into an element
 */
async function hydrateComponent(
  element: Element,
  Component: Function,
  props: Record<string, unknown>
): Promise<void> {
  // This integrates with philjs-core's hydrate function
  // For now, we'll call the component and let it take over
  try {
    const result = Component(props);

    // If the component returns a promise, wait for it
    if (result instanceof Promise) {
      await result;
    }

    // Dispatch hydration event
    element.dispatchEvent(
      new CustomEvent('phil:hydrated', {
        bubbles: true,
        detail: { element, props },
      })
    );
  } catch (error) {
    console.error('[PhilJS Loader] Hydration error:', error);
    element.dispatchEvent(
      new CustomEvent('phil:hydration-error', {
        bubbles: true,
        detail: { element, error },
      })
    );
  }
}

// ============================================================================
// Prefetching
// ============================================================================

/**
 * Prefetch a component for faster loading
 */
export function prefetchComponent(id: string): void {
  const component = componentRegistry.get(id);
  if (!component || component.status !== 'idle') return;

  // Start loading in background
  component.preloaded = component.loader();
}

/**
 * Prefetch all visible components
 */
export function prefetchVisibleComponents(): void {
  if (typeof document === 'undefined') return;

  const elements = document.querySelectorAll('[data-qid][data-qcomponent]');
  elements.forEach((element) => {
    const componentId = element.getAttribute('data-qcomponent');
    if (componentId && isElementVisible(element)) {
      prefetchComponent(componentId);
    }
  });
}

/**
 * Check if an element is visible in the viewport
 */
function isElementVisible(element: Element): boolean {
  const rect = element.getBoundingClientRect();
  return (
    rect.top < window.innerHeight &&
    rect.bottom > 0 &&
    rect.left < window.innerWidth &&
    rect.right > 0
  );
}

// ============================================================================
// Event Handler Loading
// ============================================================================

/**
 * Load and invoke an event handler
 */
export async function loadAndInvokeHandler(
  qrl: string,
  event: Event,
  element: Element
): Promise<void> {
  try {
    const qrlObj = parseQRL(qrl);
    const handler = await qrlObj.resolve();

    if (typeof handler !== 'function') {
      throw new Error(`Handler is not a function: ${qrl}`);
    }

    // Get element state
    const qid = element.getAttribute('data-qid');
    const elementState = qid ? clientState?.elements[qid] : undefined;

    // Invoke with context
    await handler(event, element, elementState);
  } catch (error) {
    console.error('[PhilJS Loader] Handler error:', error);
    throw error;
  }
}

// ============================================================================
// Load Queue Management
// ============================================================================

/**
 * Process the load queue
 */
function processLoadQueue(): void {
  while (loadQueue.length > 0 && loadingCount < config.maxConcurrent) {
    const request = loadQueue.shift()!;
    loadingCount++;

    loadAndHydrate(request.element, { state: undefined })
      .then(() => request.resolve(undefined))
      .catch((error) => {
        if (config.retryOnError && request.retries < config.maxRetries) {
          // Retry with delay
          request.retries++;
          setTimeout(() => {
            loadQueue.push(request);
            processLoadQueue();
          }, config.retryDelay * request.retries);
        } else {
          request.reject(error);
        }
      })
      .finally(() => {
        loadingCount--;
        processLoadQueue();
      });
  }
}

/**
 * Queue a component load
 */
export function queueLoad(
  id: string,
  element: Element,
  qrl: string
): Promise<unknown> {
  return new Promise((resolve, reject) => {
    loadQueue.push({
      id,
      element,
      qrl,
      resolve,
      reject,
      retries: 0,
    });
    processLoadQueue();
  });
}

// ============================================================================
// Initialization
// ============================================================================

/**
 * Initialize the loader on the client
 */
export function initLoader(): void {
  if (typeof document === 'undefined') return;

  // Parse state from server
  const stateElement = document.getElementById('__PHIL_STATE__');
  if (stateElement) {
    try {
      clientState = JSON.parse(stateElement.textContent || '{}');
    } catch (error) {
      console.error('[PhilJS Loader] Failed to parse state:', error);
    }
  }

  // Set up prefetching on hover
  if (config.prefetchOnHover) {
    setupPrefetchListeners();
  }

  // Set up event delegation for handlers
  setupEventDelegation();

  // Prefetch visible components
  if (typeof requestIdleCallback !== 'undefined') {
    requestIdleCallback(() => prefetchVisibleComponents());
  } else {
    setTimeout(prefetchVisibleComponents, 100);
  }
}

/**
 * Set up prefetch listeners
 */
function setupPrefetchListeners(): void {
  let prefetchTimeout: ReturnType<typeof setTimeout> | null = null;

  document.addEventListener('mouseover', (event) => {
    const target = event.target as Element;
    const element = target.closest('[data-qcomponent]');

    if (element) {
      prefetchTimeout = setTimeout(() => {
        const componentId = element.getAttribute('data-qcomponent');
        if (componentId) {
          prefetchComponent(componentId);
        }
      }, config.prefetchTimeout);
    }
  });

  document.addEventListener('mouseout', () => {
    if (prefetchTimeout) {
      clearTimeout(prefetchTimeout);
      prefetchTimeout = null;
    }
  });

  document.addEventListener('focusin', (event) => {
    const target = event.target as Element;
    const element = target.closest('[data-qcomponent]');

    if (element) {
      const componentId = element.getAttribute('data-qcomponent');
      if (componentId) {
        prefetchComponent(componentId);
      }
    }
  });
}

/**
 * Set up event delegation for lazy handlers
 */
function setupEventDelegation(): void {
  const eventTypes = [
    'click',
    'input',
    'change',
    'submit',
    'focus',
    'blur',
    'keydown',
    'keyup',
    'keypress',
    'mousedown',
    'mouseup',
    'touchstart',
    'touchend',
  ];

  eventTypes.forEach((eventType) => {
    document.addEventListener(
      eventType,
      async (event) => {
        let element: Element | null = event.target as Element;

        while (element && element !== document.body) {
          const qid = element.getAttribute('data-qid');

          if (qid && clientState?.elements[qid]) {
            const elementState = clientState.elements[qid];
            const handler = elementState.handlers.find(
              (h) => h.event === eventType
            );

            if (handler) {
              // Prevent default if specified
              if (handler.preventDefault) {
                event.preventDefault();
              }
              if (handler.stopPropagation) {
                event.stopPropagation();
              }

              // Load and invoke
              await loadAndInvokeHandler(handler.qrl, event, element);
              return;
            }
          }

          element = element.parentElement;
        }
      },
      true // Use capture phase for earlier interception
    );
  });
}

// ============================================================================
// Utilities
// ============================================================================

/**
 * Get loading statistics
 */
export function getLoaderStats(): {
  registered: number;
  loaded: number;
  loading: number;
  queued: number;
  cached: number;
} {
  let loaded = 0;
  let loading = 0;

  for (const component of componentRegistry.values()) {
    if (component.status === 'loaded') loaded++;
    if (component.status === 'loading') loading++;
  }

  return {
    registered: componentRegistry.size,
    loaded,
    loading,
    queued: loadQueue.length,
    cached: chunkCache.size,
  };
}

/**
 * Clear all caches (useful for testing/HMR)
 */
export function clearLoaderCache(): void {
  componentRegistry.clear();
  chunkCache.clear();
  activeLoads.clear();
  loadQueue.length = 0;
  loadingCount = 0;
  clientState = null;
}

/**
 * Wait for all pending loads to complete
 */
export async function waitForLoads(): Promise<void> {
  await Promise.all(activeLoads.values());
  await new Promise<void>((resolve) => {
    const check = () => {
      if (loadQueue.length === 0 && loadingCount === 0) {
        resolve();
      } else {
        setTimeout(check, 10);
      }
    };
    check();
  });
}
