/**
 * Global Event Delegation for Resumability
 *
 * This module provides global event delegation that enables lazy loading
 * of event handlers. Instead of attaching handlers directly to elements,
 * we use a single global listener that looks up handlers via QRLs.
 *
 * @example
 * ```typescript
 * import { initEventDelegation, addGlobalHandler } from '@philjs/resumable/client';
 *
 * // Initialize delegation (usually done automatically)
 * initEventDelegation();
 *
 * // Events now bubble to a global handler that loads QRLs on demand
 * ```
 */

import type { EventDelegationConfig, SerializedElement } from '../types.js';
import { loadFromQRL, loadAndInvokeHandler } from './lazy-loader.js';

// ============================================================================
// Types
// ============================================================================

interface PendingInvocation {
  qrl: string;
  event: Event;
  element: Element;
  qid: string;
  timestamp: number;
}

interface HandlerInfo {
  qrl: string;
  event: string;
  preventDefault?: boolean;
  stopPropagation?: boolean;
  capture?: boolean;
}

// ============================================================================
// State
// ============================================================================

const defaultConfig: EventDelegationConfig = {
  events: [
    'click',
    'dblclick',
    'input',
    'change',
    'submit',
    'focus',
    'blur',
    'focusin',
    'focusout',
    'keydown',
    'keyup',
    'keypress',
    'mousedown',
    'mouseup',
    'mouseover',
    'mouseout',
    'mouseenter',
    'mouseleave',
    'touchstart',
    'touchend',
    'touchmove',
    'scroll',
    'wheel',
    'contextmenu',
    'dragstart',
    'dragend',
    'dragover',
    'drop',
  ],
  root: typeof document !== 'undefined' ? document : undefined,
  capture: true,
};

let config: EventDelegationConfig = { ...defaultConfig };

/** Whether event delegation has been initialized */
let initialized = false;

/** Pending invocations waiting for handlers to load */
const pendingInvocations: PendingInvocation[] = [];

/** Cache of resolved handlers */
const resolvedHandlers = new Map<string, Function>();

/** Client state (loaded from __PHIL_STATE__) */
let clientState: {
  elements: Record<string, SerializedElement>;
} | null = null;

/** AbortController for cleaning up listeners */
let abortController: AbortController | null = null;

// ============================================================================
// Configuration
// ============================================================================

/**
 * Configure event delegation
 */
export function configureEventDelegation(
  options: Partial<EventDelegationConfig>
): void {
  config = { ...config, ...options };
}

/**
 * Get current configuration
 */
export function getEventDelegationConfig(): Readonly<EventDelegationConfig> {
  return config;
}

// ============================================================================
// Initialization
// ============================================================================

/**
 * Initialize global event delegation.
 *
 * This sets up listeners for all delegated event types on the document.
 * Events are captured and handlers are looked up via QRLs stored in
 * data attributes.
 */
export function initEventDelegation(): void {
  if (typeof document === 'undefined') return;
  if (initialized) return;

  // Load client state
  const stateElement = document.getElementById('__PHIL_STATE__');
  if (stateElement) {
    try {
      clientState = JSON.parse(stateElement.textContent || '{}');
    } catch (error) {
      console.error('[PhilJS Events] Failed to parse state:', error);
    }
  }

  // Create abort controller
  abortController = new AbortController();

  // Set up event listeners
  const root = config.root || document;

  config.events.forEach((eventType) => {
    root.addEventListener(
      eventType,
      (event) => handleGlobalEvent(event),
      {
        capture: config.capture,
        signal: abortController!.signal,
      }
    );
  });

  initialized = true;

  // Dispatch ready event
  document.dispatchEvent(new CustomEvent('phil:events-ready'));
}

/**
 * Cleanup event delegation
 */
export function cleanupEventDelegation(): void {
  if (abortController) {
    abortController.abort();
    abortController = null;
  }
  initialized = false;
  resolvedHandlers.clear();
  pendingInvocations.length = 0;
}

// ============================================================================
// Event Handling
// ============================================================================

/**
 * Handle a global event
 */
async function handleGlobalEvent(event: Event): Promise<void> {
  let element: Element | null = event.target as Element;

  // Walk up the DOM tree looking for handlers
  while (element && element !== document.body) {
    const qid = element.getAttribute('data-qid');

    if (qid) {
      // Check for handler in client state
      const elementState = clientState?.elements[qid];

      if (elementState) {
        const handler = elementState.handlers.find(
          (h) => h.event === event.type
        );

        if (handler) {
          await invokeHandler(handler, event, element, qid);
          return;
        }
      }

      // Check for inline handler attribute (fallback)
      const handlerAttr = element.getAttribute(`data-on${event.type}`);
      if (handlerAttr) {
        await invokeHandlerFromAttribute(handlerAttr, event, element, qid);
        return;
      }
    }

    // Check for data-qevents attribute
    const qevents = element.getAttribute('data-qevents');
    if (qevents && qevents.split(' ').includes(event.type)) {
      const qid = element.getAttribute('data-qid');
      if (qid) {
        const elementState = clientState?.elements[qid];
        const handler = elementState?.handlers.find(
          (h) => h.event === event.type
        );
        if (handler) {
          await invokeHandler(handler, event, element, qid);
          return;
        }
      }
    }

    element = element.parentElement;
  }
}

/**
 * Invoke a handler
 */
async function invokeHandler(
  handler: HandlerInfo,
  event: Event,
  element: Element,
  qid: string
): Promise<void> {
  // Handle preventDefault and stopPropagation
  if (handler.preventDefault) {
    event.preventDefault();
  }
  if (handler.stopPropagation) {
    event.stopPropagation();
  }

  // Check if handler is already resolved
  if (resolvedHandlers.has(handler.qrl)) {
    try {
      const fn = resolvedHandlers.get(handler.qrl)!;
      const elementState = clientState?.elements[qid];
      await fn(event, element, elementState);
    } catch (error) {
      console.error('[PhilJS Events] Handler error:', error);
      dispatchHandlerError(element, error);
    }
    return;
  }

  // Queue the invocation and start loading
  const invocation: PendingInvocation = {
    qrl: handler.qrl,
    event,
    element,
    qid,
    timestamp: Date.now(),
  };
  pendingInvocations.push(invocation);

  try {
    const fn = await loadFromQRL<Function>(handler.qrl);

    if (typeof fn !== 'function') {
      throw new Error(`Handler is not a function: ${handler.qrl}`);
    }

    // Cache the handler
    resolvedHandlers.set(handler.qrl, fn);

    // Process pending invocations for this QRL
    const pending = pendingInvocations.filter((p) => p.qrl === handler.qrl);
    pendingInvocations.splice(
      0,
      pendingInvocations.length,
      ...pendingInvocations.filter((p) => p.qrl !== handler.qrl)
    );

    for (const p of pending) {
      try {
        const elementState = clientState?.elements[p.qid];
        await fn(p.event, p.element, elementState);
      } catch (error) {
        console.error('[PhilJS Events] Handler error:', error);
        dispatchHandlerError(p.element, error);
      }
    }
  } catch (error) {
    console.error('[PhilJS Events] Failed to load handler:', error);
    dispatchHandlerError(element, error);

    // Remove pending invocations for this QRL
    const remaining = pendingInvocations.filter((p) => p.qrl !== handler.qrl);
    pendingInvocations.splice(0, pendingInvocations.length, ...remaining);
  }
}

/**
 * Invoke a handler from an attribute value
 */
async function invokeHandlerFromAttribute(
  qrl: string,
  event: Event,
  element: Element,
  qid: string
): Promise<void> {
  try {
    await loadAndInvokeHandler(qrl, event, element);
  } catch (error) {
    console.error('[PhilJS Events] Handler error:', error);
    dispatchHandlerError(element, error);
  }
}

/**
 * Dispatch a handler error event
 */
function dispatchHandlerError(element: Element, error: unknown): void {
  element.dispatchEvent(
    new CustomEvent('phil:handler-error', {
      bubbles: true,
      detail: { error },
    })
  );
}

// ============================================================================
// Custom Event Registration
// ============================================================================

/**
 * Add a custom global event handler
 */
export function addGlobalHandler(
  eventType: string,
  handler: (event: Event) => void | Promise<void>,
  options?: { capture?: boolean }
): () => void {
  const root = config.root || document;

  const wrappedHandler = async (event: Event) => {
    try {
      await handler(event);
    } catch (error) {
      console.error('[PhilJS Events] Custom handler error:', error);
    }
  };

  root.addEventListener(eventType, wrappedHandler, {
    capture: options?.capture ?? config.capture,
  });

  return () => root.removeEventListener(eventType, wrappedHandler);
}

/**
 * Register a handler for a specific element
 */
export function registerElementHandler(
  element: Element,
  eventType: string,
  qrl: string
): void {
  const qid = element.getAttribute('data-qid');
  if (!qid) {
    console.warn('[PhilJS Events] Element has no data-qid');
    return;
  }

  // Add to client state
  if (clientState) {
    if (!clientState.elements[qid]) {
      clientState.elements[qid] = {
        id: qid,
        handlers: [],
        bindings: {},
      };
    }
    clientState.elements[qid].handlers.push({
      event: eventType,
      qrl,
    });
  }

  // Update data-qevents attribute
  const currentEvents = element.getAttribute('data-qevents') || '';
  const events = new Set(currentEvents.split(' ').filter(Boolean));
  events.add(eventType);
  element.setAttribute('data-qevents', Array.from(events).join(' '));
}

// ============================================================================
// Prefetch Handlers on Hover
// ============================================================================

let prefetchTimeout: ReturnType<typeof setTimeout> | null = null;

/**
 * Set up prefetching of handlers on hover
 */
export function setupHandlerPrefetch(): void {
  if (typeof document === 'undefined') return;

  document.addEventListener('mouseover', (event) => {
    const target = event.target as Element;
    const element = target.closest('[data-qevents]');

    if (element) {
      prefetchTimeout = setTimeout(() => {
        prefetchElementHandlers(element);
      }, 100);
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
    const element = target.closest('[data-qevents]');

    if (element) {
      prefetchElementHandlers(element);
    }
  });
}

/**
 * Prefetch handlers for an element
 */
async function prefetchElementHandlers(element: Element): Promise<void> {
  const qid = element.getAttribute('data-qid');
  if (!qid) return;

  const elementState = clientState?.elements[qid];
  if (!elementState) return;

  // Prefetch all handlers
  for (const handler of elementState.handlers) {
    if (!resolvedHandlers.has(handler.qrl)) {
      // Start loading but don't wait
      loadFromQRL(handler.qrl)
        .then((fn) => {
          if (typeof fn === 'function') {
            resolvedHandlers.set(handler.qrl, fn);
          }
        })
        .catch(() => {
          // Ignore prefetch errors
        });
    }
  }
}

// ============================================================================
// Utilities
// ============================================================================

/**
 * Check if a handler is loaded
 */
export function isHandlerLoaded(qrl: string): boolean {
  return resolvedHandlers.has(qrl);
}

/**
 * Get pending invocations count
 */
export function getPendingInvocationsCount(): number {
  return pendingInvocations.length;
}

/**
 * Get statistics
 */
export function getEventDelegationStats(): {
  initialized: boolean;
  resolvedHandlers: number;
  pendingInvocations: number;
  events: string[];
} {
  return {
    initialized,
    resolvedHandlers: resolvedHandlers.size,
    pendingInvocations: pendingInvocations.length,
    events: config.events,
  };
}

/**
 * Clear all cached handlers (for testing/HMR)
 */
export function clearHandlerCache(): void {
  resolvedHandlers.clear();
  pendingInvocations.length = 0;
}
