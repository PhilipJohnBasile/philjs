/**
 * Lazy Component Loader for Resumability
 *
 * This module handles lazy loading of component code on interaction.
 * Components are not loaded until the user interacts with them,
 * achieving zero JavaScript execution until interaction.
 *
 * @example
 * ```typescript
 * import { loadComponent, loadAndHydrate } from '@philjs/resumable/client';
 *
 * // Load and hydrate an element
 * await loadAndHydrate(element);
 *
 * // Load a specific component
 * const Component = await loadComponent('Counter');
 * ```
 */

import type {
  ComponentLoader,
  LazyComponent,
  LoaderConfig,
  SerializedElement,
} from '../types.js';

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
interface LoadRequest {
  id: string;
  element: Element;
  qrl: string;
  resolve: (value: unknown) => void;
  reject: (error: Error) => void;
  retries: number;
}

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
// QRL Loading
// ============================================================================

/**
 * Parse a QRL string into its components
 */
function parseQRLString(qrl: string): { chunk: string; symbol: string; captures: unknown[] } {
  const hashIndex = qrl.indexOf('#');
  if (hashIndex === -1) {
    throw new Error(`Invalid QRL format: ${qrl}`);
  }

  const chunk = qrl.slice(0, hashIndex);
  let symbol = qrl.slice(hashIndex + 1);
  let captures: unknown[] = [];

  // Parse captures if present
  const bracketIndex = symbol.indexOf('[');
  if (bracketIndex !== -1) {
    const captureStr = symbol.slice(bracketIndex + 1, -1);
    symbol = symbol.slice(0, bracketIndex);
    if (captureStr) {
      try {
        captures = JSON.parse(`[${captureStr}]`);
      } catch {
        // Ignore parse errors
      }
    }
  }

  return { chunk, symbol, captures };
}

/**
 * Load a function from a QRL string
 */
export async function loadFromQRL<T = unknown>(qrl: string): Promise<T> {
  const { chunk, symbol, captures } = parseQRLString(qrl);

  // Handle inline QRLs
  if (chunk === '__inline__') {
    // Inline QRLs should already be available in the global registry
    const global = window as unknown as { __PHIL_Q__?: { resolved: Record<string, unknown> } };
    if (global.__PHIL_Q__?.resolved[qrl]) {
      return global.__PHIL_Q__.resolved[qrl] as T;
    }
    throw new Error(`Inline QRL not found: ${qrl}`);
  }

  // Load the chunk
  const module = await loadChunk(chunk + '.js');

  // Get the symbol
  const value = module[symbol] || module.default;
  if (value === undefined) {
    throw new Error(`Symbol "${symbol}" not found in chunk "${chunk}"`);
  }

  return value as T;
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

// ============================================================================
// Hydration
// ============================================================================

/**
 * Load and hydrate an element.
 */
export async function loadAndHydrate(
  element: Element,
  options?: {
    force?: boolean;
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

  // Get element state from global state
  const elementState = clientState?.elements[qid];
  const componentInfo = clientState?.components[qid];

  // Get component QRL from element attribute if not in state
  const componentQRL = element.getAttribute('data-qcomponent');

  if (!componentInfo && !elementState && !componentQRL) {
    const error = new Error(`No state found for element ${qid}`);
    if (config.isDev) {
      console.warn('[PhilJS Loader]', error.message);
    }
    throw error;
  }

  try {
    // Load the component
    const qrl = componentInfo?.qrl || componentQRL;
    if (qrl) {
      const Component = await loadFromQRL<Function>(qrl);

      // Get props
      const props: Record<string, unknown> = componentInfo?.props || {};

      // Merge with runtime state
      if (options?.state) {
        Object.assign(props, options.state);
      }

      // Hydrate the component
      if (typeof Component === 'function') {
        await hydrateComponent(element, Component, props);
      }
    }

    // Mark as hydrated
    element.setAttribute('data-qhydrated', 'true');
  } catch (error) {
    console.error('[PhilJS Loader] Hydration failed:', error);
    element.dispatchEvent(
      new CustomEvent('phil:hydration-error', {
        bubbles: true,
        detail: { element, error },
      })
    );
    throw error;
  }
}

/**
 * Hydrate a component into an element
 */
async function hydrateComponent(
  element: Element,
  Component: Function,
  props: Record<string, unknown>
): Promise<void> {
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
    throw error;
  }
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
    const handler = await loadFromQRL<Function>(qrl);

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
    const componentQRL = element.getAttribute('data-qcomponent');
    if (componentQRL && isElementVisible(element)) {
      // Prefetch the chunk
      const { chunk } = parseQRLString(componentQRL);
      if (chunk !== '__inline__') {
        prefetchChunk(chunk + '.js');
      }
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
// Load Queue Management
// ============================================================================

/**
 * Process the load queue
 */
function processLoadQueue(): void {
  while (loadQueue.length > 0 && loadingCount < config.maxConcurrent) {
    const request = loadQueue.shift()!;
    loadingCount++;

    loadAndHydrate(request.element)
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
export function initLazyLoader(): void {
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
        const componentQRL = element.getAttribute('data-qcomponent');
        if (componentQRL) {
          const { chunk } = parseQRLString(componentQRL);
          if (chunk !== '__inline__') {
            prefetchChunk(chunk + '.js');
          }
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
      const componentQRL = element.getAttribute('data-qcomponent');
      if (componentQRL) {
        const { chunk } = parseQRLString(componentQRL);
        if (chunk !== '__inline__') {
          prefetchChunk(chunk + '.js');
        }
      }
    }
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
 * Clear all caches
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
