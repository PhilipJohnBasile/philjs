/**
 * Client-Side Resumption
 *
 * This module handles resuming an application from server-rendered HTML.
 * It parses the serialized state, sets up event delegation, and
 * progressively hydrates components as needed.
 *
 * @example
 * ```typescript
 * import { resume, resumeContainer } from '@philjs/resumable/client';
 *
 * // Resume the entire application
 * resume();
 *
 * // Or resume a specific container
 * resumeContainer(document.getElementById('app'));
 * ```
 */

import type {
  ResumableConfig,
  SerializedState,
  ContainerConfig,
} from '../types.js';
import { deserializeState, resolveElements, setupSignalBindings } from './deserialize.js';
import { initLazyLoader, configureLoader } from './lazy-loader.js';
import { initEventDelegation } from './event-delegation.js';

// ============================================================================
// Global State
// ============================================================================

interface ResumableState {
  /** Whether the application has been resumed */
  resumed: boolean;
  /** Parsed state from the server */
  state: SerializedState | null;
  /** Configuration */
  config: ResumableConfig;
  /** Container states */
  containers: Map<string, ContainerResumeState>;
}

interface ContainerResumeState {
  id: string;
  element: Element;
  hydrated: boolean;
  loading: boolean;
  error: Error | null;
}

const globalState: ResumableState = {
  resumed: false,
  state: null,
  config: {},
  containers: new Map(),
};

// ============================================================================
// Main Resume Function
// ============================================================================

/**
 * Resume the application from server-rendered HTML.
 *
 * This function:
 * 1. Parses serialized state from the __PHIL_STATE__ script tag
 * 2. Initializes the lazy loader for component code
 * 3. Sets up global event delegation
 * 4. Connects signals to their DOM elements
 * 5. Discovers and configures hydration boundaries
 */
export function resume(config?: ResumableConfig): void {
  if (typeof window === 'undefined') {
    console.warn('[PhilJS] resume() called on server - skipping');
    return;
  }

  if (globalState.resumed) {
    console.warn('[PhilJS] Application already resumed');
    return;
  }

  globalState.config = config || {};

  // Configure the loader
  configureLoader({
    basePath: config?.basePath || '',
    isDev: config?.isDev || false,
  });

  // Initialize the lazy loader
  initLazyLoader();

  // Initialize event delegation
  initEventDelegation();

  // Parse and restore state
  const stateElement = document.getElementById('__PHIL_STATE__');
  if (stateElement) {
    try {
      const deserializedState = deserializeState(stateElement);
      if (deserializedState) {
        globalState.state = deserializedState.raw as SerializedState;

        // Resolve DOM elements
        resolveElements(deserializedState);

        // Set up signal bindings for reactive updates
        setupSignalBindings(deserializedState);
      }
    } catch (error) {
      console.error('[PhilJS] Failed to resume state:', error);
    }
  }

  // Discover all containers and set up hydration
  discoverContainers();

  // Mark as resumed
  globalState.resumed = true;

  // Dispatch ready event
  window.dispatchEvent(new CustomEvent('phil:resumed', {
    detail: { state: globalState.state },
  }));
}

/**
 * Resume a specific container
 */
export async function resumeContainer(
  element: Element,
  config?: ContainerConfig
): Promise<void> {
  const containerId = element.getAttribute('data-phil-container');
  if (!containerId) {
    throw new Error('Element is not a resumable container');
  }

  // Check if already hydrated
  const existing = globalState.containers.get(containerId);
  if (existing?.hydrated) {
    return;
  }

  // Create container state
  const containerState: ContainerResumeState = {
    id: containerId,
    element,
    hydrated: false,
    loading: true,
    error: null,
  };
  globalState.containers.set(containerId, containerState);

  try {
    // Configure if not already
    if (!globalState.resumed) {
      resume(config);
    }

    // Discover hydration boundaries within this container
    discoverHydrationBoundaries(element, config);

    // Mark as hydrated
    containerState.hydrated = true;
    containerState.loading = false;

    // Dispatch event
    element.dispatchEvent(new CustomEvent('phil:container-resumed', {
      bubbles: true,
      detail: { containerId },
    }));

    config?.onHydrate?.();
  } catch (error) {
    containerState.error = error instanceof Error ? error : new Error(String(error));
    containerState.loading = false;
    config?.onError?.(containerState.error);
    throw containerState.error;
  }
}

/**
 * Resume all containers on the page
 */
export async function resumeAllContainers(config?: ContainerConfig): Promise<void> {
  const containers = document.querySelectorAll('[data-phil-container]');

  await Promise.all(
    Array.from(containers).map((element) =>
      resumeContainer(element, config).catch((error) => {
        console.error('[PhilJS] Failed to resume container:', error);
      })
    )
  );
}

// ============================================================================
// Container Discovery
// ============================================================================

/**
 * Discover all containers on the page
 */
function discoverContainers(): void {
  const containers = document.querySelectorAll('[data-phil-container]');

  containers.forEach((element) => {
    const containerId = element.getAttribute('data-phil-container');
    if (containerId && !globalState.containers.has(containerId)) {
      globalState.containers.set(containerId, {
        id: containerId,
        element,
        hydrated: false,
        loading: false,
        error: null,
      });
    }
  });
}

/**
 * Discover hydration boundaries within an element
 */
function discoverHydrationBoundaries(
  root: Element,
  config?: ContainerConfig
): void {
  // Find all elements with hydration markers
  const boundaries = root.querySelectorAll('[data-hydration]');

  boundaries.forEach((element) => {
    const optionsStr = element.getAttribute('data-hydration');
    if (!optionsStr) return;

    try {
      const options = JSON.parse(optionsStr);
      setupHydrationBoundary(element, options, config);
    } catch (error) {
      console.error('[PhilJS] Failed to parse hydration options:', error);
    }
  });

  // Also find components with triggers
  const components = root.querySelectorAll('[data-qtrigger]');
  components.forEach((element) => {
    const trigger = element.getAttribute('data-qtrigger') || 'idle';
    setupHydrationBoundary(element, { when: trigger }, config);
  });
}

/**
 * Set up a hydration boundary for an element
 */
function setupHydrationBoundary(
  element: Element,
  options: { when: string; [key: string]: unknown },
  config?: ContainerConfig
): void {
  const strategy = options.when || config?.defaultHydration || 'idle';

  switch (strategy) {
    case 'load':
      // Hydrate immediately
      hydrateElement(element);
      break;

    case 'visible':
      setupVisibleHydration(element, options);
      break;

    case 'interaction':
      setupInteractionHydration(element, options);
      break;

    case 'idle':
      setupIdleHydration(element, options);
      break;

    case 'media':
      setupMediaHydration(element, options);
      break;

    case 'never':
      // Never hydrate
      break;

    default:
      // Default to idle
      setupIdleHydration(element, options);
  }
}

// ============================================================================
// Hydration Strategies
// ============================================================================

/**
 * Hydrate an element
 */
async function hydrateElement(element: Element): Promise<void> {
  if (element.hasAttribute('data-qhydrated')) {
    return;
  }

  const qid = element.getAttribute('data-qid');
  const componentQRL = element.getAttribute('data-qcomponent');

  if (!qid || !componentQRL) {
    return;
  }

  try {
    // Import the lazy loader
    const { loadAndHydrate } = await import('./lazy-loader.js');
    await loadAndHydrate(element);
  } catch (error) {
    console.error('[PhilJS] Hydration failed:', error);
    element.dispatchEvent(new CustomEvent('phil:hydration-error', {
      bubbles: true,
      detail: { error },
    }));
  }
}

/**
 * Set up visible hydration (IntersectionObserver)
 */
function setupVisibleHydration(
  element: Element,
  options: Record<string, unknown>
): () => void {
  const observerOptions: IntersectionObserverInit = {
    root: (options.root as Element) ?? null,
    rootMargin: (options.rootMargin as string) ?? '0px',
    threshold: (options.threshold as number) ?? 0,
  };

  const observer = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      if (entry.isIntersecting) {
        observer.disconnect();
        hydrateElement(element);
        break;
      }
    }
  }, observerOptions);

  observer.observe(element);

  return () => observer.disconnect();
}

/**
 * Set up interaction hydration
 */
function setupInteractionHydration(
  element: Element,
  options: Record<string, unknown>
): () => void {
  const events = (options.events as string[]) ??
    (options.event ? [options.event as string] : ['click', 'focus', 'touchstart']);

  const controllers: AbortController[] = [];

  events.forEach((eventType) => {
    const controller = new AbortController();
    controllers.push(controller);

    element.addEventListener(
      eventType,
      async (event) => {
        // Abort all listeners
        controllers.forEach((c) => c.abort());

        // Hydrate
        await hydrateElement(element);

        // Re-dispatch the event
        if (options.redispatch !== false) {
          requestAnimationFrame(() => {
            const newEvent = new (event.constructor as typeof Event)(
              event.type,
              event
            );
            element.dispatchEvent(newEvent);
          });
        }
      },
      {
        once: true,
        capture: true,
        signal: controller.signal,
      }
    );
  });

  return () => controllers.forEach((c) => c.abort());
}

/**
 * Set up idle hydration
 */
function setupIdleHydration(
  element: Element,
  options: Record<string, unknown>
): () => void {
  const timeout = (options.timeout as number) ?? 2000;
  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  let idleCallbackId: number | null = null;

  const doHydrate = () => {
    if (timeoutId) clearTimeout(timeoutId);
    if (idleCallbackId && typeof cancelIdleCallback !== 'undefined') {
      cancelIdleCallback(idleCallbackId);
    }
    hydrateElement(element);
  };

  if (typeof requestIdleCallback !== 'undefined') {
    idleCallbackId = requestIdleCallback(doHydrate, { timeout });
  } else {
    timeoutId = setTimeout(doHydrate, 1);
  }

  // Fallback timeout
  timeoutId = setTimeout(doHydrate, timeout);

  return () => {
    if (timeoutId) clearTimeout(timeoutId);
    if (idleCallbackId && typeof cancelIdleCallback !== 'undefined') {
      cancelIdleCallback(idleCallbackId);
    }
  };
}

/**
 * Set up media query hydration
 */
function setupMediaHydration(
  element: Element,
  options: Record<string, unknown>
): () => void {
  const query = options.query as string;
  if (!query) {
    console.warn('[PhilJS] Media hydration requires a query');
    return () => {};
  }

  const mediaQuery = window.matchMedia(query);

  const handleChange = (e: MediaQueryListEvent | MediaQueryList) => {
    if (e.matches) {
      mediaQuery.removeEventListener('change', handleChange);
      hydrateElement(element);
    }
  };

  // Check immediately
  if (mediaQuery.matches) {
    hydrateElement(element);
    return () => {};
  }

  // Listen for changes
  mediaQuery.addEventListener('change', handleChange);

  return () => mediaQuery.removeEventListener('change', handleChange);
}

// ============================================================================
// State Access
// ============================================================================

/**
 * Get the current resumable state
 */
export function getResumeState(): SerializedState | null {
  return globalState.state;
}

/**
 * Check if the application has been resumed
 */
export function isResumed(): boolean {
  return globalState.resumed;
}

/**
 * Check if a container is hydrated
 */
export function isContainerHydrated(containerId: string): boolean {
  return globalState.containers.get(containerId)?.hydrated ?? false;
}

/**
 * Get all container states
 */
export function getContainerStates(): Map<string, ContainerResumeState> {
  return new Map(globalState.containers);
}

/**
 * Wait for a specific container to be hydrated
 */
export async function waitForContainer(containerId: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const check = () => {
      const container = globalState.containers.get(containerId);
      if (!container) {
        reject(new Error(`Container ${containerId} not found`));
        return;
      }
      if (container.error) {
        reject(container.error);
        return;
      }
      if (container.hydrated) {
        resolve();
        return;
      }
      setTimeout(check, 10);
    };
    check();
  });
}

/**
 * Wait for all containers to be hydrated
 */
export async function waitForAllContainers(): Promise<void> {
  return new Promise((resolve) => {
    const check = () => {
      const pending = Array.from(globalState.containers.values()).filter(
        (c) => !c.hydrated && !c.error
      );
      if (pending.length === 0) {
        resolve();
      } else {
        setTimeout(check, 10);
      }
    };
    check();
  });
}

// ============================================================================
// Cleanup
// ============================================================================

/**
 * Reset the resume state (for testing/HMR)
 */
export function resetResumeState(): void {
  globalState.resumed = false;
  globalState.state = null;
  globalState.config = {};
  globalState.containers.clear();
}
