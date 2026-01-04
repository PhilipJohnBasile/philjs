/**
 * Event Bridge Implementation
 * Routes events across framework boundaries.
 */

import type { EventTunnel, EventTunnelOptions, EventHandler } from '../types.js';

/**
 * Default options for event emission
 */
const DEFAULT_EVENT_OPTIONS: Required<EventTunnelOptions> = {
  bubbles: true,
  cancelable: true,
  composed: false,
};

/**
 * Implementation of the EventTunnel interface
 */
export class EventTunnelImpl implements EventTunnel {
  private listeners = new Map<string, Set<EventHandler<unknown>>>();
  private onceListeners = new Map<string, Set<EventHandler<unknown>>>();
  private parent: EventTunnel | null;
  private componentId: string;
  private children = new Set<EventTunnelImpl>();

  constructor(componentId: string = 'root', parent: EventTunnel | null = null) {
    this.componentId = componentId;
    this.parent = parent;
  }

  /**
   * Emit an event that can be caught by parent components.
   */
  emit<T = unknown>(
    name: string,
    detail: T,
    options: EventTunnelOptions = {}
  ): boolean {
    const opts = { ...DEFAULT_EVENT_OPTIONS, ...options };
    let cancelled = false;

    // Notify local listeners
    const handlers = this.listeners.get(name);
    if (handlers) {
      for (const handler of handlers) {
        try {
          (handler as EventHandler<T>)(detail);
        } catch (error) {
          console.error(`[EventTunnel: ${this.componentId}] Handler error for "${name}":`, error);
        }
      }
    }

    // Notify once listeners and remove them
    const onceHandlers = this.onceListeners.get(name);
    if (onceHandlers) {
      for (const handler of onceHandlers) {
        try {
          (handler as EventHandler<T>)(detail);
        } catch (error) {
          console.error(`[EventTunnel: ${this.componentId}] Once handler error for "${name}":`, error);
        }
      }
      this.onceListeners.delete(name);
    }

    // Bubble to parent if configured
    if (opts.bubbles && this.parent && !cancelled) {
      return this.parent.emit(name, detail, options);
    }

    return !cancelled;
  }

  /**
   * Listen to events from child components.
   */
  on<T = unknown>(name: string, handler: EventHandler<T>): () => void {
    if (!this.listeners.has(name)) {
      this.listeners.set(name, new Set());
    }
    this.listeners.get(name)!.add(handler as EventHandler<unknown>);

    return () => {
      this.listeners.get(name)?.delete(handler as EventHandler<unknown>);
      if (this.listeners.get(name)?.size === 0) {
        this.listeners.delete(name);
      }
    };
  }

  /**
   * Listen to an event once, then automatically unsubscribe.
   */
  once<T = unknown>(name: string, handler: EventHandler<T>): () => void {
    if (!this.onceListeners.has(name)) {
      this.onceListeners.set(name, new Set());
    }
    this.onceListeners.get(name)!.add(handler as EventHandler<unknown>);

    return () => {
      this.onceListeners.get(name)?.delete(handler as EventHandler<unknown>);
      if (this.onceListeners.get(name)?.size === 0) {
        this.onceListeners.delete(name);
      }
    };
  }

  /**
   * Remove all listeners for an event
   */
  off(name: string): void {
    this.listeners.delete(name);
    this.onceListeners.delete(name);
  }

  /**
   * Create a scoped tunnel for a child component subtree.
   */
  scope(componentId: string): EventTunnel {
    const child = new EventTunnelImpl(componentId, this);
    this.children.add(child);
    return child;
  }

  /**
   * Get the parent tunnel
   */
  getParent(): EventTunnel | null {
    return this.parent;
  }

  /**
   * Remove a child tunnel
   */
  removeChild(child: EventTunnelImpl): void {
    this.children.delete(child);
  }

  /**
   * Dispose this tunnel and all children
   */
  dispose(): void {
    // Clear all listeners
    this.listeners.clear();
    this.onceListeners.clear();

    // Dispose children
    for (const child of this.children) {
      child.dispose();
    }
    this.children.clear();

    // Remove from parent
    if (this.parent instanceof EventTunnelImpl) {
      this.parent.removeChild(this);
    }
  }

  /**
   * Get the component ID
   */
  getComponentId(): string {
    return this.componentId;
  }

  /**
   * Check if there are any listeners for an event
   */
  hasListeners(name: string): boolean {
    return (
      (this.listeners.get(name)?.size ?? 0) > 0 ||
      (this.onceListeners.get(name)?.size ?? 0) > 0
    );
  }

  /**
   * Get all event names with listeners
   */
  getEventNames(): string[] {
    const names = new Set<string>();
    for (const name of this.listeners.keys()) {
      names.add(name);
    }
    for (const name of this.onceListeners.keys()) {
      names.add(name);
    }
    return Array.from(names);
  }
}

/**
 * Global root event tunnel.
 * All events eventually bubble here if not stopped.
 */
let globalEventTunnel: EventTunnelImpl | null = null;

/**
 * Get or create the global event tunnel.
 */
export function getGlobalEventTunnel(): EventTunnelImpl {
  if (!globalEventTunnel) {
    globalEventTunnel = new EventTunnelImpl('global');
  }
  return globalEventTunnel;
}

/**
 * Create a scoped event tunnel for a component.
 */
export function createScopedEventTunnel(componentId: string): EventTunnelImpl {
  return new EventTunnelImpl(componentId, getGlobalEventTunnel());
}

/**
 * Bridge DOM CustomEvents to the event tunnel.
 * Useful for capturing events from Web Components or native DOM elements.
 */
export function bridgeDOMEvents(
  element: HTMLElement,
  tunnel: EventTunnel,
  eventNames: string[]
): () => void {
  const handlers: Array<{ name: string; handler: EventListener }> = [];

  for (const name of eventNames) {
    const handler = (event: Event) => {
      const detail = event instanceof CustomEvent ? event.detail : { event };
      tunnel.emit(name, detail, {
        bubbles: event.bubbles,
        cancelable: event.cancelable,
        composed: event.composed,
      });
    };

    element.addEventListener(name, handler);
    handlers.push({ name, handler });
  }

  // Return cleanup function
  return () => {
    for (const { name, handler } of handlers) {
      element.removeEventListener(name, handler);
    }
  };
}

/**
 * Create a DOM CustomEvent from tunnel event details.
 * Useful for emitting events that DOM elements can listen to.
 */
export function createDOMEvent<T>(
  name: string,
  detail: T,
  options: EventTunnelOptions = {}
): CustomEvent<T> {
  return new CustomEvent<T>(name, {
    detail,
    bubbles: options.bubbles ?? true,
    cancelable: options.cancelable ?? true,
    composed: options.composed ?? false,
  });
}

/**
 * Dispatch a tunnel event as a DOM event on an element.
 */
export function dispatchAsDOMEvent<T>(
  element: HTMLElement,
  name: string,
  detail: T,
  options: EventTunnelOptions = {}
): boolean {
  const event = createDOMEvent(name, detail, options);
  return element.dispatchEvent(event);
}
