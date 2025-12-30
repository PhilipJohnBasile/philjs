/**
 * PhilJS Alpine Compatibility
 *
 * Full Alpine.js-compatible directive system using PhilJS signals.
 */

import { signal, effect, batch, memo } from 'philjs-core';
import { directive, initDirectives, processElement, type DirectiveContext } from './directives.js';

// ============================================================================
// Alpine-specific Directives
// ============================================================================

/**
 * x-transition - CSS transitions for show/hide
 */
directive('transition', (el: HTMLElement, expression: string, context: DirectiveContext) => {
  // Parse transition classes
  const classes = {
    enter: el.getAttribute('x-transition:enter') || 'transition ease-out duration-300',
    enterStart: el.getAttribute('x-transition:enter-start') || 'opacity-0',
    enterEnd: el.getAttribute('x-transition:enter-end') || 'opacity-100',
    leave: el.getAttribute('x-transition:leave') || 'transition ease-in duration-200',
    leaveStart: el.getAttribute('x-transition:leave-start') || 'opacity-100',
    leaveEnd: el.getAttribute('x-transition:leave-end') || 'opacity-0',
  };

  const applyTransition = (entering: boolean) => {
    if (entering) {
      el.classList.add(...classes.enter.split(' '), ...classes.enterStart.split(' '));
      requestAnimationFrame(() => {
        el.classList.remove(...classes.enterStart.split(' '));
        el.classList.add(...classes.enterEnd.split(' '));
      });
    } else {
      el.classList.add(...classes.leave.split(' '), ...classes.leaveStart.split(' '));
      requestAnimationFrame(() => {
        el.classList.remove(...classes.leaveStart.split(' '));
        el.classList.add(...classes.leaveEnd.split(' '));
      });
    }
  };

  // Listen for visibility changes
  const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      if (mutation.attributeName === 'style') {
        const visible = el.style.display !== 'none';
        applyTransition(visible);
      }
    }
  });

  observer.observe(el, { attributes: true, attributeFilter: ['style'] });

  return () => observer.disconnect();
});

/**
 * x-effect - Run side effects
 */
directive('effect', (el: HTMLElement, expression: string, context: DirectiveContext) => {
  return effect(() => {
    try {
      const fn = new Function(
        ...Object.keys(context.data),
        expression
      );
      const values = Object.values(context.data).map((s: any) =>
        typeof s === 'function' ? s() : s
      );
      fn(...values);
    } catch (e) {
      console.error('x-effect error:', e);
    }
  });
});

/**
 * x-ignore - Skip processing
 */
directive('ignore', () => {
  // Handled specially - prevents processing of children
});

/**
 * x-teleport - Move element to another location
 */
directive('teleport', (el: HTMLElement, expression: string) => {
  const target = document.querySelector(expression);
  if (target) {
    const clone = el.cloneNode(true) as HTMLElement;
    clone.removeAttribute('x-teleport');
    target.appendChild(clone);
    el.remove();
  }
});

// ============================================================================
// Magic Properties ($el, $refs, $dispatch, $nextTick, $watch)
// ============================================================================

export interface AlpineContext extends DirectiveContext {
  $nextTick: (callback: () => void) => Promise<void>;
  $watch: <T>(getter: () => T, callback: (value: T, oldValue: T) => void) => () => void;
  $store: <T>(name: string) => T | undefined;
}

/**
 * Create an Alpine-compatible context
 */
export function createAlpineContext(el: HTMLElement, data: Record<string, any>): AlpineContext {
  const reactiveData: Record<string, any> = {};

  // Make data reactive
  for (const [key, value] of Object.entries(data)) {
    reactiveData[key] = signal(value);
  }

  const refs: Record<string, HTMLElement> = {};

  return {
    data: reactiveData,
    $el: el,
    $refs: refs,
    $dispatch: (event: string, detail?: any) => {
      el.dispatchEvent(new CustomEvent(event, {
        detail,
        bubbles: true,
        composed: true,
      }));
    },
    $nextTick: async (callback) => {
      await new Promise(resolve => requestAnimationFrame(resolve));
      callback();
    },
    $watch: (getter, callback) => {
      let oldValue = getter();
      return effect(() => {
        const newValue = getter();
        if (newValue !== oldValue) {
          callback(newValue, oldValue);
          oldValue = newValue;
        }
      });
    },
    $store: (name) => {
      return stores.get(name);
    },
  };
}

// ============================================================================
// Global Store
// ============================================================================

const stores = new Map<string, any>();

/**
 * Define a global store
 */
export function store<T extends Record<string, any>>(name: string, initialValue: T): T {
  const reactiveStore: Record<string, any> = {};

  for (const [key, value] of Object.entries(initialValue)) {
    if (typeof value === 'function') {
      // Methods
      reactiveStore[key] = value.bind(reactiveStore);
    } else {
      // Data
      const sig = signal(value);
      Object.defineProperty(reactiveStore, key, {
        get: () => sig(),
        set: (v) => sig.set(v),
      });
    }
  }

  stores.set(name, reactiveStore as T);
  return reactiveStore as T;
}

/**
 * Get a global store
 */
export function getStore<T>(name: string): T | undefined {
  return stores.get(name);
}

// ============================================================================
// Alpine.data() - Reusable Components
// ============================================================================

const componentDefs = new Map<string, () => Record<string, any>>();

/**
 * Define a reusable component
 */
export function data(name: string, factory: () => Record<string, any>): void {
  componentDefs.set(name, factory);
}

/**
 * Get a component definition
 */
export function getData(name: string): (() => Record<string, any>) | undefined {
  return componentDefs.get(name);
}

// ============================================================================
// Alpine.bind() - Reusable Attribute Sets
// ============================================================================

const bindDefs = new Map<string, Record<string, any>>();

/**
 * Define reusable attribute bindings
 */
export function bind(name: string, bindings: Record<string, any>): void {
  bindDefs.set(name, bindings);
}

/**
 * x-bind with named definition
 */
directive('bind', (el: HTMLElement, expression: string, context: DirectiveContext) => {
  // Check if it's a named binding
  if (bindDefs.has(expression)) {
    const bindings = bindDefs.get(expression)!;
    for (const [attr, value] of Object.entries(bindings)) {
      if (typeof value === 'function') {
        effect(() => {
          const result = value(context);
          el.setAttribute(attr, String(result));
        });
      } else {
        el.setAttribute(attr, String(value));
      }
    }
    return;
  }

  // Regular x-bind behavior handled in directives.ts
});

// ============================================================================
// Initialize
// ============================================================================

/**
 * Initialize Alpine.js compatibility
 */
export function initAlpine(root: HTMLElement = document.body): void {
  // Process x-data elements with component lookup
  const dataElements = root.querySelectorAll('[x-data]');

  for (const el of Array.from(dataElements)) {
    if (el instanceof HTMLElement) {
      const dataExpr = el.getAttribute('x-data') || '{}';

      // Check if it's a named component
      const componentMatch = dataExpr.match(/^(\w+)(?:\(([^)]*)\))?$/);
      let data: Record<string, any>;

      if (componentMatch && componentMatch[1] && componentDefs.has(componentMatch[1])) {
        const factory = componentDefs.get(componentMatch[1])!;
        data = factory();
      } else {
        try {
          const fn = new Function(`return (${dataExpr})`);
          data = fn();
        } catch (e) {
          console.error('x-data parse error:', e);
          data = {};
        }
      }

      const context = createAlpineContext(el, data);
      processElement(el, context);
    }
  }
}

// ============================================================================
// Export Alpine-compatible API
// ============================================================================

export const Alpine = {
  data,
  store,
  bind,
  start: initAlpine,
  directive,
};

export default Alpine;
