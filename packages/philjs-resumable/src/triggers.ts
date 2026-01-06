/**
 * Hydration Triggers for Resumability
 *
 * This module provides specialized trigger functions for progressive hydration.
 * Components can be configured to hydrate based on various conditions:
 * - onVisible: When the component enters the viewport
 * - onInteraction: When the user interacts with the component
 * - onIdle: When the browser is idle
 * - onMedia: When a media query matches
 * - onCustom: Custom trigger logic
 *
 * @example
 * ```typescript
 * import { resumable, onVisible, onInteraction, onIdle } from '@philjs/resumable';
 *
 * // Hydrate when visible in viewport
 * const LazyComponent = resumable(Component, { trigger: onVisible() });
 *
 * // Hydrate on first interaction
 * const InteractiveComponent = resumable(Component, { trigger: onInteraction() });
 *
 * // Hydrate when browser is idle
 * const IdleComponent = resumable(Component, { trigger: onIdle() });
 * ```
 */

// ============================================================================
// Types
// ============================================================================

/**
 * Trigger callback that receives the hydration function
 */
export type HydrationCallback = () => Promise<void>;

/**
 * Cleanup function to remove trigger listeners
 */
export type TriggerCleanup = () => void;

/**
 * A trigger function that sets up hydration conditions
 */
export type TriggerFunction = (
  element: Element,
  hydrate: HydrationCallback
) => TriggerCleanup | void;

/**
 * Trigger configuration object
 */
export interface Trigger {
  /** Trigger type identifier */
  type: TriggerType;
  /** The setup function */
  setup: TriggerFunction;
  /** Priority for scheduling (higher = sooner) */
  priority?: number;
  /** Whether to prefetch before triggering */
  prefetch?: boolean;
}

/**
 * Available trigger types
 */
export type TriggerType =
  | 'visible'
  | 'interaction'
  | 'idle'
  | 'media'
  | 'load'
  | 'never'
  | 'custom';

// ============================================================================
// Visible Trigger
// ============================================================================

/**
 * Options for the visible trigger
 */
export interface VisibleTriggerOptions {
  /** Root element for intersection observer */
  root?: Element | Document | null;
  /** Root margin for earlier detection */
  rootMargin?: string;
  /** Visibility threshold (0-1) */
  threshold?: number | number[];
  /** Prefetch when approaching viewport */
  prefetch?: boolean;
  /** Distance before visible to start prefetch */
  prefetchMargin?: string;
}

/**
 * Create a trigger that fires when the element becomes visible.
 *
 * Uses IntersectionObserver to detect when the element enters the viewport.
 *
 * @example
 * ```typescript
 * // Basic usage
 * const LazyComponent = resumable(Component, { trigger: onVisible() });
 *
 * // With custom threshold
 * const LazyComponent = resumable(Component, {
 *   trigger: onVisible({ threshold: 0.5 })
 * });
 *
 * // With prefetch before visible
 * const LazyComponent = resumable(Component, {
 *   trigger: onVisible({ prefetch: true, prefetchMargin: '200px' })
 * });
 * ```
 */
export function onVisible(options: VisibleTriggerOptions = {}): Trigger {
  const {
    root = null,
    rootMargin = '0px',
    threshold = 0,
    prefetch = false,
    prefetchMargin = '200px',
  } = options;

  return {
    type: 'visible',
    prefetch,
    setup: (element: Element, hydrate: HydrationCallback): TriggerCleanup => {
      // Main observer for hydration
      const observer = new IntersectionObserver(
        (entries) => {
          for (const entry of entries) {
            if (entry.isIntersecting) {
              observer.disconnect();
              hydrate();
              break;
            }
          }
        },
        { root, rootMargin, threshold }
      );

      observer.observe(element);

      // Optional prefetch observer
      let prefetchObserver: IntersectionObserver | null = null;
      if (prefetch) {
        prefetchObserver = new IntersectionObserver(
          (entries) => {
            for (const entry of entries) {
              if (entry.isIntersecting) {
                prefetchObserver?.disconnect();
                // Trigger prefetch event
                element.dispatchEvent(
                  new CustomEvent('phil:prefetch', { bubbles: true })
                );
                break;
              }
            }
          },
          { root, rootMargin: prefetchMargin, threshold: 0 }
        );
        prefetchObserver.observe(element);
      }

      return () => {
        observer.disconnect();
        prefetchObserver?.disconnect();
      };
    },
  };
}

// ============================================================================
// Interaction Trigger
// ============================================================================

/**
 * Options for the interaction trigger
 */
export interface InteractionTriggerOptions {
  /** Events that trigger hydration */
  events?: string[];
  /** Re-dispatch the triggering event after hydration */
  redispatch?: boolean;
  /** Prefetch on hover/focus before interaction */
  prefetch?: boolean;
  /** Use capture phase for events */
  capture?: boolean;
}

/**
 * Create a trigger that fires on user interaction.
 *
 * The component will hydrate when the user clicks, focuses, or touches the element.
 *
 * @example
 * ```typescript
 * // Basic usage - hydrates on click, focus, or touch
 * const InteractiveComponent = resumable(Component, {
 *   trigger: onInteraction()
 * });
 *
 * // Custom events
 * const HoverComponent = resumable(Component, {
 *   trigger: onInteraction({ events: ['mouseenter'] })
 * });
 *
 * // With event redispatch
 * const ButtonComponent = resumable(Component, {
 *   trigger: onInteraction({ redispatch: true })
 * });
 * ```
 */
export function onInteraction(options: InteractionTriggerOptions = {}): Trigger {
  const {
    events = ['click', 'focus', 'touchstart'],
    redispatch = true,
    prefetch = true,
    capture = true,
  } = options;

  return {
    type: 'interaction',
    prefetch,
    setup: (element: Element, hydrate: HydrationCallback): TriggerCleanup => {
      const controllers: AbortController[] = [];
      let triggeredEvent: Event | null = null;

      // Setup event listeners
      events.forEach((eventType) => {
        const controller = new AbortController();
        controllers.push(controller);

        element.addEventListener(
          eventType,
          async (event) => {
            triggeredEvent = event;

            // Abort all listeners
            controllers.forEach((c) => c.abort());

            // Hydrate
            await hydrate();

            // Redispatch the event if needed
            if (redispatch && triggeredEvent) {
              requestAnimationFrame(() => {
                const newEvent = new (triggeredEvent!.constructor as typeof Event)(
                  triggeredEvent!.type,
                  triggeredEvent!
                );
                element.dispatchEvent(newEvent);
              });
            }
          },
          {
            once: true,
            capture,
            signal: controller.signal,
          }
        );
      });

      // Prefetch on hover/focus
      if (prefetch) {
        const prefetchController = new AbortController();
        controllers.push(prefetchController);

        const doPrefetch = () => {
          element.dispatchEvent(
            new CustomEvent('phil:prefetch', { bubbles: true })
          );
        };

        element.addEventListener('mouseenter', doPrefetch, {
          once: true,
          signal: prefetchController.signal,
        });

        element.addEventListener('focusin', doPrefetch, {
          once: true,
          signal: prefetchController.signal,
        });
      }

      return () => controllers.forEach((c) => c.abort());
    },
  };
}

// ============================================================================
// Idle Trigger
// ============================================================================

/**
 * Options for the idle trigger
 */
export interface IdleTriggerOptions {
  /** Timeout before forcing hydration (ms) */
  timeout?: number;
  /** Priority for requestIdleCallback */
  priority?: 'user-blocking' | 'user-visible' | 'background';
}

/**
 * Create a trigger that fires when the browser is idle.
 *
 * Uses requestIdleCallback to hydrate during browser idle time,
 * with a fallback timeout for browsers that don't support it.
 *
 * @example
 * ```typescript
 * // Basic usage
 * const IdleComponent = resumable(Component, {
 *   trigger: onIdle()
 * });
 *
 * // With custom timeout
 * const IdleComponent = resumable(Component, {
 *   trigger: onIdle({ timeout: 5000 })
 * });
 * ```
 */
export function onIdle(options: IdleTriggerOptions = {}): Trigger {
  const { timeout = 2000 } = options;

  return {
    type: 'idle',
    priority: -1, // Low priority
    setup: (element: Element, hydrate: HydrationCallback): TriggerCleanup => {
      let timeoutId: ReturnType<typeof setTimeout> | null = null;
      let idleCallbackId: number | null = null;

      const doHydrate = () => {
        if (timeoutId) clearTimeout(timeoutId);
        if (idleCallbackId && typeof cancelIdleCallback !== 'undefined') {
          cancelIdleCallback(idleCallbackId);
        }
        hydrate();
      };

      if (typeof requestIdleCallback !== 'undefined') {
        idleCallbackId = requestIdleCallback(doHydrate, { timeout });
      } else {
        // Fallback for Safari and older browsers
        timeoutId = setTimeout(doHydrate, 1);
      }

      // Fallback timeout to ensure hydration happens
      timeoutId = setTimeout(doHydrate, timeout);

      return () => {
        if (timeoutId) clearTimeout(timeoutId);
        if (idleCallbackId && typeof cancelIdleCallback !== 'undefined') {
          cancelIdleCallback(idleCallbackId);
        }
      };
    },
  };
}

// ============================================================================
// Media Query Trigger
// ============================================================================

/**
 * Options for the media trigger
 */
export interface MediaTriggerOptions {
  /** Media query string */
  query: string;
  /** Hydrate immediately if query matches on load */
  hydrateOnMatch?: boolean;
}

/**
 * Create a trigger that fires based on a media query.
 *
 * The component will hydrate when the media query matches.
 *
 * @example
 * ```typescript
 * // Hydrate only on desktop
 * const DesktopComponent = resumable(Component, {
 *   trigger: onMedia({ query: '(min-width: 768px)' })
 * });
 *
 * // Hydrate only when prefers-reduced-motion is not set
 * const AnimatedComponent = resumable(Component, {
 *   trigger: onMedia({ query: '(prefers-reduced-motion: no-preference)' })
 * });
 * ```
 */
export function onMedia(options: MediaTriggerOptions): Trigger {
  const { query, hydrateOnMatch = true } = options;

  return {
    type: 'media',
    setup: (element: Element, hydrate: HydrationCallback): TriggerCleanup => {
      const mediaQuery = window.matchMedia(query);

      const handleChange = (e: MediaQueryListEvent | MediaQueryList) => {
        if (e.matches) {
          mediaQuery.removeEventListener('change', handleChange);
          hydrate();
        }
      };

      // Check immediately if hydrateOnMatch is true
      if (hydrateOnMatch && mediaQuery.matches) {
        hydrate();
        return () => {};
      }

      // Listen for changes
      mediaQuery.addEventListener('change', handleChange);

      return () => mediaQuery.removeEventListener('change', handleChange);
    },
  };
}

// ============================================================================
// Load Trigger
// ============================================================================

/**
 * Create a trigger that fires immediately on load.
 *
 * Use this for critical components that need to be interactive immediately.
 *
 * @example
 * ```typescript
 * // Hydrate immediately
 * const CriticalComponent = resumable(Component, {
 *   trigger: onLoad()
 * });
 * ```
 */
export function onLoad(): Trigger {
  return {
    type: 'load',
    priority: 100, // High priority
    setup: (_element: Element, hydrate: HydrationCallback): TriggerCleanup => {
      // Hydrate immediately but asynchronously
      queueMicrotask(() => hydrate());
      return () => {};
    },
  };
}

// ============================================================================
// Never Trigger
// ============================================================================

/**
 * Create a trigger that never fires.
 *
 * Use this for static components that should never hydrate.
 *
 * @example
 * ```typescript
 * // Never hydrate - static only
 * const StaticComponent = resumable(Component, {
 *   trigger: never()
 * });
 * ```
 */
export function never(): Trigger {
  return {
    type: 'never',
    setup: (): TriggerCleanup => {
      // Never hydrate
      return () => {};
    },
  };
}

// ============================================================================
// Custom Trigger
// ============================================================================

/**
 * Create a custom trigger with user-defined logic.
 *
 * @example
 * ```typescript
 * // Custom trigger based on a signal
 * const customTrigger = onCustom((element, hydrate) => {
 *   const unsubscribe = someSignal.subscribe((value) => {
 *     if (value > 10) {
 *       hydrate();
 *       unsubscribe();
 *     }
 *   });
 *   return unsubscribe;
 * });
 *
 * const CustomComponent = resumable(Component, {
 *   trigger: customTrigger
 * });
 * ```
 */
export function onCustom(
  setup: TriggerFunction,
  options?: { priority?: number; prefetch?: boolean }
): Trigger {
  return {
    type: 'custom',
    priority: options?.priority,
    prefetch: options?.prefetch,
    setup,
  };
}

// ============================================================================
// Combined Triggers
// ============================================================================

/**
 * Create a trigger that fires when ANY of the provided triggers fire.
 *
 * @example
 * ```typescript
 * // Hydrate on interaction OR when visible
 * const Component = resumable(Component, {
 *   trigger: anyOf([onInteraction(), onVisible()])
 * });
 * ```
 */
export function anyOf(triggers: Trigger[]): Trigger {
  return {
    type: 'custom',
    setup: (element: Element, hydrate: HydrationCallback): TriggerCleanup => {
      let hydrated = false;
      const cleanups: TriggerCleanup[] = [];

      const wrappedHydrate = async () => {
        if (hydrated) return;
        hydrated = true;
        // Cleanup all other triggers
        cleanups.forEach((cleanup) => cleanup?.());
        await hydrate();
      };

      triggers.forEach((trigger) => {
        const cleanup = trigger.setup(element, wrappedHydrate);
        if (cleanup) cleanups.push(cleanup);
      });

      return () => cleanups.forEach((cleanup) => cleanup?.());
    },
  };
}

/**
 * Create a trigger that fires when ALL of the provided triggers have fired.
 *
 * @example
 * ```typescript
 * // Hydrate only when visible AND idle
 * const Component = resumable(Component, {
 *   trigger: allOf([onVisible(), onIdle()])
 * });
 * ```
 */
export function allOf(triggers: Trigger[]): Trigger {
  return {
    type: 'custom',
    setup: (element: Element, hydrate: HydrationCallback): TriggerCleanup => {
      const triggered = new Set<Trigger>();
      const cleanups: TriggerCleanup[] = [];

      triggers.forEach((trigger) => {
        const wrappedHydrate = async () => {
          triggered.add(trigger);
          if (triggered.size === triggers.length) {
            cleanups.forEach((cleanup) => cleanup?.());
            await hydrate();
          }
        };

        const cleanup = trigger.setup(element, wrappedHydrate);
        if (cleanup) cleanups.push(cleanup);
      });

      return () => cleanups.forEach((cleanup) => cleanup?.());
    },
  };
}

// ============================================================================
// Timer-Based Triggers
// ============================================================================

/**
 * Create a trigger that fires after a delay.
 *
 * @example
 * ```typescript
 * // Hydrate after 3 seconds
 * const DelayedComponent = resumable(Component, {
 *   trigger: afterDelay(3000)
 * });
 * ```
 */
export function afterDelay(ms: number): Trigger {
  return {
    type: 'custom',
    setup: (_element: Element, hydrate: HydrationCallback): TriggerCleanup => {
      const timeoutId = setTimeout(hydrate, ms);
      return () => clearTimeout(timeoutId);
    },
  };
}

/**
 * Create a trigger that fires on a specific event.
 *
 * @example
 * ```typescript
 * // Hydrate when user scrolls
 * const ScrollComponent = resumable(Component, {
 *   trigger: onEvent('scroll', { target: window })
 * });
 * ```
 */
export function onEvent(
  eventType: string,
  options?: { target?: EventTarget; once?: boolean }
): Trigger {
  const { target = null, once = true } = options || {};

  return {
    type: 'custom',
    setup: (element: Element, hydrate: HydrationCallback): TriggerCleanup => {
      const eventTarget = target || element;
      const controller = new AbortController();

      eventTarget.addEventListener(
        eventType,
        () => hydrate(),
        {
          once,
          signal: controller.signal,
        }
      );

      return () => controller.abort();
    },
  };
}

// ============================================================================
// Network-Based Triggers
// ============================================================================

/**
 * Create a trigger based on network conditions.
 *
 * @example
 * ```typescript
 * // Only hydrate on fast connections
 * const HeavyComponent = resumable(Component, {
 *   trigger: onFastNetwork()
 * });
 * ```
 */
export function onFastNetwork(): Trigger {
  return {
    type: 'custom',
    setup: (_element: Element, hydrate: HydrationCallback): TriggerCleanup => {
      // Check if Network Information API is available
      const connection = (navigator as any).connection;

      if (!connection) {
        // If not available, assume fast network
        queueMicrotask(hydrate);
        return () => {};
      }

      const checkConnection = () => {
        const effectiveType = connection.effectiveType;
        // Hydrate on 4g or better
        if (effectiveType === '4g' || effectiveType === '3g') {
          hydrate();
          return true;
        }
        return false;
      };

      // Check immediately
      if (checkConnection()) {
        return () => {};
      }

      // Listen for changes
      const handleChange = () => {
        if (checkConnection()) {
          connection.removeEventListener('change', handleChange);
        }
      };

      connection.addEventListener('change', handleChange);

      return () => connection.removeEventListener('change', handleChange);
    },
  };
}

// ============================================================================
// Trigger Utilities
// ============================================================================

/**
 * Check if a value is a Trigger object
 */
export function isTrigger(value: unknown): value is Trigger {
  return (
    value !== null &&
    typeof value === 'object' &&
    'type' in value &&
    'setup' in value &&
    typeof (value as Trigger).setup === 'function'
  );
}

/**
 * Create a trigger from a string shorthand
 *
 * @example
 * ```typescript
 * const trigger = fromString('visible'); // Same as onVisible()
 * const trigger = fromString('interaction'); // Same as onInteraction()
 * ```
 */
export function fromString(type: TriggerType): Trigger {
  switch (type) {
    case 'visible':
      return onVisible();
    case 'interaction':
      return onInteraction();
    case 'idle':
      return onIdle();
    case 'load':
      return onLoad();
    case 'never':
      return never();
    default:
      throw new Error(`Unknown trigger type: ${type}`);
  }
}

/**
 * Default trigger based on component type
 */
export function defaultTrigger(componentType: 'interactive' | 'static' | 'critical'): Trigger {
  switch (componentType) {
    case 'interactive':
      return onInteraction();
    case 'static':
      return never();
    case 'critical':
      return onLoad();
    default:
      return onIdle();
  }
}
