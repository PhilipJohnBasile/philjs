/**
 * Partial Hydration Strategies
 *
 * This module provides various strategies for hydrating components:
 * - idle: Hydrate when the browser is idle
 * - visible: Hydrate when the component becomes visible
 * - interaction: Hydrate on first user interaction
 * - media: Hydrate based on media query
 * - never: Never hydrate (static only)
 *
 * @example
 * ```typescript
 * // Hydrate when visible
 * <Hydrate when="visible">
 *   <HeavyComponent />
 * </Hydrate>
 *
 * // Hydrate on click
 * <Hydrate when="interaction" event="click">
 *   <Modal />
 * </Hydrate>
 *
 * // Hydrate only on desktop
 * <Hydrate when="media" query="(min-width: 768px)">
 *   <DesktopNav />
 * </Hydrate>
 * ```
 */

import { loadAndHydrate, prefetchComponent } from './loader.js';

// ============================================================================
// Types
// ============================================================================

/**
 * Hydration strategy types
 */
export type HydrationStrategy =
  | 'idle'
  | 'visible'
  | 'interaction'
  | 'media'
  | 'never'
  | 'load'
  | 'custom';

/**
 * Common hydration options
 */
export interface HydrationOptions {
  /** The hydration strategy */
  when: HydrationStrategy;
  /** Priority for scheduling (higher = sooner) */
  priority?: number;
  /** Component ID for prefetching */
  componentId?: string;
  /** Whether to prefetch the component */
  prefetch?: boolean;
  /** Callback when hydration completes */
  onHydrate?: () => void;
  /** Callback on hydration error */
  onError?: (error: Error) => void;
}

/**
 * Visible strategy options
 */
export interface VisibleOptions extends HydrationOptions {
  when: 'visible';
  /** Root element for intersection observer */
  root?: Element | null;
  /** Root margin */
  rootMargin?: string;
  /** Visibility threshold (0-1) */
  threshold?: number | number[];
}

/**
 * Interaction strategy options
 */
export interface InteractionOptions extends HydrationOptions {
  when: 'interaction';
  /** Events that trigger hydration */
  events?: string[];
  /** Single event shorthand */
  event?: string;
  /** Only hydrate once per event type */
  once?: boolean;
}

/**
 * Media query strategy options
 */
export interface MediaOptions extends HydrationOptions {
  when: 'media';
  /** Media query string */
  query: string;
}

/**
 * Idle strategy options
 */
export interface IdleOptions extends HydrationOptions {
  when: 'idle';
  /** Timeout before forcing hydration */
  timeout?: number;
}

/**
 * Custom strategy options
 */
export interface CustomOptions extends HydrationOptions {
  when: 'custom';
  /** Custom hydration trigger */
  trigger: (element: Element, hydrate: () => Promise<void>) => void | (() => void);
}

/**
 * All hydration option types
 */
export type AnyHydrationOptions =
  | VisibleOptions
  | InteractionOptions
  | MediaOptions
  | IdleOptions
  | CustomOptions
  | (HydrationOptions & { when: 'load' | 'never' });

// ============================================================================
// Hydration Registry
// ============================================================================

/**
 * Registry entry for a hydrating element
 */
interface HydrationEntry {
  element: Element;
  options: AnyHydrationOptions;
  cleanup?: () => void;
  hydrated: boolean;
}

/** Registry of elements pending hydration */
const hydrationRegistry = new Map<string, HydrationEntry>();

/** Counter for generating unique IDs */
let hydrationIdCounter = 0;

/**
 * Generate a unique hydration ID
 */
function generateHydrationId(): string {
  return `hyd_${hydrationIdCounter++}`;
}

// ============================================================================
// Strategy Implementations
// ============================================================================

/**
 * Idle strategy - hydrate when browser is idle
 */
function setupIdleHydration(
  element: Element,
  options: IdleOptions,
  doHydrate: () => Promise<void>
): () => void {
  const timeout = options.timeout ?? 2000;
  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  let idleCallbackId: number | null = null;

  const performHydration = () => {
    if (timeoutId) clearTimeout(timeoutId);
    if (idleCallbackId && typeof cancelIdleCallback !== 'undefined') {
      cancelIdleCallback(idleCallbackId);
    }
    doHydrate();
  };

  if (typeof requestIdleCallback !== 'undefined') {
    idleCallbackId = requestIdleCallback(performHydration, {
      timeout,
    });
  } else {
    // Fallback for browsers without requestIdleCallback
    timeoutId = setTimeout(performHydration, 1);
  }

  // Timeout fallback
  timeoutId = setTimeout(performHydration, timeout);

  return () => {
    if (timeoutId) clearTimeout(timeoutId);
    if (idleCallbackId && typeof cancelIdleCallback !== 'undefined') {
      cancelIdleCallback(idleCallbackId);
    }
  };
}

/**
 * Visible strategy - hydrate when element is visible
 */
function setupVisibleHydration(
  element: Element,
  options: VisibleOptions,
  doHydrate: () => Promise<void>
): () => void {
  const observerOptions: IntersectionObserverInit = {
    root: options.root ?? null,
    rootMargin: options.rootMargin ?? '0px',
    threshold: options.threshold ?? 0,
  };

  const observer = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      if (entry.isIntersecting) {
        observer.disconnect();
        doHydrate();
        break;
      }
    }
  }, observerOptions);

  observer.observe(element);

  // Prefetch when slightly before visible
  if (options.prefetch && options.componentId) {
    const prefetchObserver = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            prefetchObserver.disconnect();
            prefetchComponent(options.componentId!);
            break;
          }
        }
      },
      {
        ...observerOptions,
        rootMargin: '200px', // Prefetch slightly before visible
      }
    );
    prefetchObserver.observe(element);

    return () => {
      observer.disconnect();
      prefetchObserver.disconnect();
    };
  }

  return () => observer.disconnect();
}

/**
 * Interaction strategy - hydrate on user interaction
 */
function setupInteractionHydration(
  element: Element,
  options: InteractionOptions,
  doHydrate: () => Promise<void>
): () => void {
  const events = options.events ?? (options.event ? [options.event] : ['click', 'focus']);
  const controllers: AbortController[] = [];

  events.forEach((eventType) => {
    const controller = new AbortController();
    controllers.push(controller);

    element.addEventListener(
      eventType,
      async (event) => {
        // Remove all listeners
        controllers.forEach((c) => c.abort());

        // Hydrate
        await doHydrate();

        // Re-dispatch the event after hydration
        // so the component can handle it
        if (eventType === 'click' || eventType === 'focus') {
          // For clicks, we might want to re-trigger
          // after the component is ready
          requestAnimationFrame(() => {
            element.dispatchEvent(new Event(eventType, { bubbles: true }));
          });
        }
      },
      {
        once: true,
        signal: controller.signal,
      }
    );
  });

  // Prefetch on hover/focus if enabled
  if (options.prefetch && options.componentId) {
    const prefetchController = new AbortController();
    controllers.push(prefetchController);

    element.addEventListener(
      'mouseenter',
      () => prefetchComponent(options.componentId!),
      { once: true, signal: prefetchController.signal }
    );

    element.addEventListener(
      'focusin',
      () => prefetchComponent(options.componentId!),
      { once: true, signal: prefetchController.signal }
    );
  }

  return () => controllers.forEach((c) => c.abort());
}

/**
 * Media strategy - hydrate based on media query
 */
function setupMediaHydration(
  element: Element,
  options: MediaOptions,
  doHydrate: () => Promise<void>
): () => void {
  const mediaQuery = window.matchMedia(options.query);

  const handleChange = (e: MediaQueryListEvent | MediaQueryList) => {
    if (e.matches) {
      mediaQuery.removeEventListener('change', handleChange);
      doHydrate();
    }
  };

  // Check immediately
  if (mediaQuery.matches) {
    doHydrate();
    return () => {};
  }

  // Listen for changes
  mediaQuery.addEventListener('change', handleChange);

  return () => mediaQuery.removeEventListener('change', handleChange);
}

/**
 * Custom strategy - user-defined trigger
 */
function setupCustomHydration(
  element: Element,
  options: CustomOptions,
  doHydrate: () => Promise<void>
): () => void {
  const cleanup = options.trigger(element, doHydrate);
  return cleanup ?? (() => {});
}

// ============================================================================
// Core Hydration Functions
// ============================================================================

/**
 * Setup hydration for an element based on strategy.
 *
 * This function configures when and how an element should hydrate based on the
 * specified strategy. It returns a unique ID that can be used to control
 * hydration programmatically.
 *
 * @param element - The DOM element to set up hydration for
 * @param options - Hydration strategy and configuration
 * @returns A unique hydration ID for controlling this hydration
 *
 * @throws {Error} If element is invalid
 *
 * @example
 * ```typescript
 * const element = document.querySelector('[data-hydrate]');
 * const id = setupHydration(element, {
 *   when: 'visible',
 *   threshold: 0.5,
 *   onHydrate: () => console.log('Hydrated!'),
 *   onError: (err) => console.error('Hydration failed:', err)
 * });
 * ```
 */
export function setupHydration(
  element: Element,
  options: AnyHydrationOptions
): string {
  if (!element) {
    throw new Error('[PhilJS Hydration] Invalid element provided');
  }

  const id = generateHydrationId();

  // Create hydration function with error handling
  const doHydrate = async () => {
    const entry = hydrationRegistry.get(id);
    if (!entry || entry.hydrated) return;

    entry.hydrated = true;

    try {
      await loadAndHydrate(element);
      options.onHydrate?.();
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      console.error('[PhilJS Hydration] Hydration error:', err);
      options.onError?.(err);
      // Re-throw to allow parent error handling
      throw err;
    }
  };

  // Set up based on strategy
  let cleanup: (() => void) | undefined;

  switch (options.when) {
    case 'load':
      // Hydrate immediately on load
      doHydrate();
      break;

    case 'idle':
      cleanup = setupIdleHydration(element, options as IdleOptions, doHydrate);
      break;

    case 'visible':
      cleanup = setupVisibleHydration(element, options as VisibleOptions, doHydrate);
      break;

    case 'interaction':
      cleanup = setupInteractionHydration(element, options as InteractionOptions, doHydrate);
      break;

    case 'media':
      cleanup = setupMediaHydration(element, options as MediaOptions, doHydrate);
      break;

    case 'custom':
      cleanup = setupCustomHydration(element, options as CustomOptions, doHydrate);
      break;

    case 'never':
      // Never hydrate - static only
      break;
  }

  // Register
  hydrationRegistry.set(id, {
    element,
    options,
    cleanup,
    hydrated: false,
  });

  return id;
}

/**
 * Cancel pending hydration for an element
 */
export function cancelHydration(id: string): void {
  const entry = hydrationRegistry.get(id);
  if (entry) {
    entry.cleanup?.();
    hydrationRegistry.delete(id);
  }
}

/**
 * Force hydration for an element
 */
export async function forceHydration(id: string): Promise<void> {
  const entry = hydrationRegistry.get(id);
  if (!entry || entry.hydrated) return;

  entry.cleanup?.();
  entry.hydrated = true;

  await loadAndHydrate(entry.element);
  entry.options.onHydrate?.();
}

/**
 * Check if an element is hydrated
 */
export function isHydrated(id: string): boolean {
  return hydrationRegistry.get(id)?.hydrated ?? false;
}

// ============================================================================
// Hydrate Component
// ============================================================================

/**
 * Props for the Hydrate component
 */
export interface HydrateProps {
  /** Hydration strategy */
  when: HydrationStrategy;
  /** Children to hydrate */
  children: unknown;
  /** Visible strategy options */
  root?: Element | null;
  rootMargin?: string;
  threshold?: number | number[];
  /** Interaction strategy options */
  events?: string[];
  event?: string;
  /** Media strategy options */
  query?: string;
  /** Idle strategy options */
  timeout?: number;
  /** Custom strategy */
  trigger?: (element: Element, hydrate: () => Promise<void>) => void | (() => void);
  /** Priority */
  priority?: number;
  /** Component ID for prefetching */
  componentId?: string;
  /** Whether to prefetch */
  prefetch?: boolean;
  /** Fallback while loading */
  fallback?: unknown;
  /** Callbacks */
  onHydrate?: () => void;
  onError?: (error: Error) => void;
}

/**
 * Create a Hydrate component wrapper
 *
 * This is used by the JSX transform to create hydration boundaries.
 */
export function createHydrateComponent(): {
  Hydrate: (props: HydrateProps) => unknown;
  useHydration: (options: AnyHydrationOptions) => {
    id: string;
    isHydrated: boolean;
    forceHydrate: () => Promise<void>;
    cancel: () => void;
  };
} {
  /**
   * Hook for programmatic hydration control
   */
  function useHydration(options: AnyHydrationOptions) {
    // This will be populated on mount
    let id: string = '';
    let hydrated = false;

    return {
      get id() {
        return id;
      },
      get isHydrated() {
        return hydrated || isHydrated(id);
      },
      async forceHydrate() {
        await forceHydration(id);
        hydrated = true;
      },
      cancel() {
        cancelHydration(id);
      },
    };
  }

  /**
   * Hydrate component
   */
  function Hydrate(props: HydrateProps): unknown {
    // Build options from props
    const options: AnyHydrationOptions = {
      when: props.when,
      priority: props.priority,
      componentId: props.componentId,
      prefetch: props.prefetch,
      onHydrate: props.onHydrate,
      onError: props.onError,
    } as AnyHydrationOptions;

    // Add strategy-specific options
    if (props.when === 'visible') {
      (options as VisibleOptions).root = props.root;
      (options as VisibleOptions).rootMargin = props.rootMargin;
      (options as VisibleOptions).threshold = props.threshold;
    } else if (props.when === 'interaction') {
      (options as InteractionOptions).events = props.events;
      (options as InteractionOptions).event = props.event;
    } else if (props.when === 'media') {
      (options as MediaOptions).query = props.query!;
    } else if (props.when === 'idle') {
      (options as IdleOptions).timeout = props.timeout;
    } else if (props.when === 'custom') {
      (options as CustomOptions).trigger = props.trigger!;
    }

    // Return children wrapped with hydration marker
    // The actual hydration setup happens on the client
    return {
      type: 'phil-hydrate',
      props: {
        'data-hydration': JSON.stringify(options),
        children: props.children,
        fallback: props.fallback,
      },
    };
  }

  return { Hydrate, useHydration };
}

// ============================================================================
// Batch Hydration
// ============================================================================

/**
 * Hydration priority queue
 */
interface PriorityEntry {
  id: string;
  priority: number;
  element: Element;
  options: AnyHydrationOptions;
}

const priorityQueue: PriorityEntry[] = [];
let isProcessingQueue = false;

/**
 * Add to priority queue
 */
export function queueHydration(
  element: Element,
  options: AnyHydrationOptions & { priority?: number }
): string {
  const id = generateHydrationId();
  const priority = options.priority ?? 0;

  priorityQueue.push({ id, priority, element, options });
  priorityQueue.sort((a, b) => b.priority - a.priority);

  // Register but don't set up strategy yet
  hydrationRegistry.set(id, {
    element,
    options,
    hydrated: false,
  });

  // Start processing if not already
  if (!isProcessingQueue) {
    processQueue();
  }

  return id;
}

/**
 * Process the priority queue
 */
async function processQueue(): Promise<void> {
  if (isProcessingQueue || priorityQueue.length === 0) return;
  isProcessingQueue = true;

  while (priorityQueue.length > 0) {
    // Process in batches during idle time
    await new Promise<void>((resolve) => {
      if (typeof requestIdleCallback !== 'undefined') {
        requestIdleCallback(
          () => {
            const batch = priorityQueue.splice(0, 5);
            batch.forEach(({ id, element, options }) => {
              const entry = hydrationRegistry.get(id);
              if (entry && !entry.hydrated) {
                setupHydration(element, options);
              }
            });
            resolve();
          },
          { timeout: 100 }
        );
      } else {
        setTimeout(() => {
          const batch = priorityQueue.splice(0, 5);
          batch.forEach(({ id, element, options }) => {
            const entry = hydrationRegistry.get(id);
            if (entry && !entry.hydrated) {
              setupHydration(element, options);
            }
          });
          resolve();
        }, 0);
      }
    });
  }

  isProcessingQueue = false;
}

// ============================================================================
// Auto-Discovery
// ============================================================================

/**
 * Automatically discover and set up hydration for marked elements
 */
export function discoverHydrationBoundaries(
  root: Element = document.body
): void {
  const boundaries = root.querySelectorAll('[data-hydration]');

  boundaries.forEach((element) => {
    const optionsStr = element.getAttribute('data-hydration');
    if (!optionsStr) return;

    try {
      const options = JSON.parse(optionsStr) as AnyHydrationOptions;
      setupHydration(element, options);
    } catch (error) {
      console.error('[PhilJS Hydration] Failed to parse options:', error);
    }
  });
}

/**
 * Initialize hydration on page load
 */
export function initHydration(): void {
  if (typeof document === 'undefined') return;

  // Wait for DOM to be ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      discoverHydrationBoundaries();
    });
  } else {
    discoverHydrationBoundaries();
  }
}

// ============================================================================
// Utilities
// ============================================================================

/**
 * Get hydration statistics
 */
export function getHydrationStats(): {
  total: number;
  hydrated: number;
  pending: number;
  queued: number;
  byStrategy: Record<HydrationStrategy, number>;
} {
  const stats = {
    total: hydrationRegistry.size,
    hydrated: 0,
    pending: 0,
    queued: priorityQueue.length,
    byStrategy: {
      idle: 0,
      visible: 0,
      interaction: 0,
      media: 0,
      never: 0,
      load: 0,
      custom: 0,
    } as Record<HydrationStrategy, number>,
  };

  for (const entry of hydrationRegistry.values()) {
    if (entry.hydrated) {
      stats.hydrated++;
    } else {
      stats.pending++;
    }
    stats.byStrategy[entry.options.when]++;
  }

  return stats;
}

/**
 * Clear all hydration state (for testing/HMR)
 */
export function clearHydrationState(): void {
  for (const entry of hydrationRegistry.values()) {
    entry.cleanup?.();
  }
  hydrationRegistry.clear();
  priorityQueue.length = 0;
  isProcessingQueue = false;
  hydrationIdCounter = 0;
}

/**
 * Wait for all hydration to complete
 */
export async function waitForHydration(): Promise<void> {
  return new Promise((resolve) => {
    const check = () => {
      const stats = getHydrationStats();
      // Only wait for non-never strategies
      const pendingImmediate = Array.from(hydrationRegistry.values()).filter(
        (e) => !e.hydrated && e.options.when !== 'never' && e.options.when !== 'interaction'
      );
      if (pendingImmediate.length === 0 && priorityQueue.length === 0) {
        resolve();
      } else {
        setTimeout(check, 10);
      }
    };
    check();
  });
}

// Export the component factory
const { Hydrate, useHydration } = createHydrateComponent();
export { Hydrate, useHydration };
