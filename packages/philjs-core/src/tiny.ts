/**
 * PhilJS Tiny Core - Under 5KB gzipped
 *
 * Minimal reactive runtime with:
 * - Fine-grained signals
 * - Computed values
 * - Effects
 * - Basic JSX support
 *
 * This is the smallest possible PhilJS bundle for
 * size-constrained environments.
 *
 * @packageDocumentation
 */

// =============================================================================
// Types (stripped at compile time)
// =============================================================================

export type Getter<T> = () => T;
export type Setter<T> = (v: T | ((prev: T) => T)) => void;
export interface TinySignal<T> extends Getter<T> { set: Setter<T>; }
export type Cleanup = void | (() => void);
export type EffectFn = () => Cleanup;

// =============================================================================
// Reactive Core
// =============================================================================

let tracking: Set<Set<() => void>> | null = null;
let batching = 0;
let pending = new Set<() => void>();

/**
 * Create a reactive signal
 */
export function signal<T>(value: T): TinySignal<T> {
  const subs = new Set<() => void>();

  const read = (() => {
    tracking?.add(subs);
    return value;
  }) as TinySignal<T>;

  read.set = (v) => {
    const next = typeof v === 'function' ? (v as (p: T) => T)(value) : v;
    if (next !== value) {
      value = next;
      if (batching) {
        subs.forEach(s => pending.add(s));
      } else {
        subs.forEach(s => s());
      }
    }
  };

  return read;
}

/**
 * Create a computed value
 */
export function computed<T>(fn: () => T): Getter<T> {
  let value: T;
  let dirty = true;
  const subs = new Set<() => void>();
  let deps: Set<Set<() => void>>[] = [];

  const invalidate = () => {
    if (!dirty) {
      dirty = true;
      subs.forEach(s => s());
    }
  };

  return () => {
    tracking?.add(subs);
    if (dirty) {
      deps.forEach(d => d.delete(invalidate));
      deps = [];
      const prev = tracking;
      tracking = new Set();
      value = fn();
      deps = Array.from(tracking);
      deps.forEach(d => d.add(invalidate));
      tracking = prev;
      dirty = false;
    }
    return value;
  };
}

/**
 * Create an effect
 */
export function effect(fn: EffectFn): () => void {
  let cleanup: Cleanup;
  let deps: Set<Set<() => void>>[] = [];

  const run = () => {
    if (typeof cleanup === 'function') cleanup();
    deps.forEach(d => d.delete(run));
    deps = [];
    const prev = tracking;
    tracking = new Set();
    cleanup = fn();
    deps = Array.from(tracking);
    deps.forEach(d => d.add(run));
    tracking = prev;
  };

  run();

  return () => {
    if (typeof cleanup === 'function') cleanup();
    deps.forEach(d => d.delete(run));
  };
}

/**
 * Batch multiple updates
 */
export function batch<T>(fn: () => T): T {
  batching++;
  try {
    return fn();
  } finally {
    if (--batching === 0) {
      const p = pending;
      pending = new Set();
      p.forEach(s => s());
    }
  }
}

/**
 * Run without tracking
 */
export function untrack<T>(fn: () => T): T {
  const prev = tracking;
  tracking = null;
  try {
    return fn();
  } finally {
    tracking = prev;
  }
}

// =============================================================================
// Minimal JSX Runtime
// =============================================================================

export interface TinyElement {
  type: string | ((props: any) => TinyElement | TinyElement[]);
  props: Record<string, unknown>;
  children: (TinyElement | string | number | null | undefined)[];
}

/**
 * Create a JSX element
 */
export function h(
  type: string | ((props: any) => TinyElement | TinyElement[]),
  props: Record<string, unknown> | null,
  ...children: (TinyElement | string | number | null | undefined)[]
): TinyElement {
  return { type, props: props || {}, children: children.flat(Infinity) };
}

/**
 * Fragment
 */
export const Fragment = ({ children }: { children: TinyElement[] }) => children;

// JSX runtime exports
export const jsx = h;
export const jsxs = h;
export const jsxDEV = h;

// =============================================================================
// Minimal Renderer
// =============================================================================

type DOMNode = Element | Text | DocumentFragment;

/**
 * Render a TinyElement to a DOM node
 */
export function render(element: TinyElement | string | number | null | undefined, container: Element): () => void {
  const cleanups: (() => void)[] = [];

  const mount = (el: TinyElement | string | number | null | undefined, parent: DOMNode): DOMNode | null => {
    if (el == null || el === false) return null;

    if (typeof el === 'string' || typeof el === 'number') {
      const text = document.createTextNode(String(el));
      parent.appendChild(text);
      return text;
    }

    if (typeof el.type === 'function') {
      const result = el.type({ ...el.props, children: el.children });
      if (Array.isArray(result)) {
        const frag = document.createDocumentFragment();
        result.forEach(r => mount(r, frag));
        parent.appendChild(frag);
        return frag;
      }
      return mount(result, parent);
    }

    const node = document.createElement(el.type);

    // Apply props
    for (const [key, value] of Object.entries(el.props)) {
      if (key === 'ref' && typeof value === 'function') {
        (value as (el: Element) => void)(node);
      } else if (key.startsWith('on') && typeof value === 'function') {
        const event = key.slice(2).toLowerCase();
        node.addEventListener(event, value as EventListener);
        cleanups.push(() => node.removeEventListener(event, value as EventListener));
      } else if (key === 'style' && typeof value === 'object') {
        Object.assign(node.style, value);
      } else if (key === 'className') {
        node.className = String(value);
      } else if (typeof value === 'function') {
        // Reactive prop
        cleanups.push(effect(() => {
          const v = (value as () => unknown)();
          if (key === 'className') {
            node.className = String(v);
          } else if (key === 'style' && typeof v === 'object') {
            Object.assign(node.style, v);
          } else if (v != null) {
            node.setAttribute(key, String(v));
          } else {
            node.removeAttribute(key);
          }
        }));
      } else if (value != null && value !== false) {
        node.setAttribute(key, value === true ? '' : String(value));
      }
    }

    // Mount children
    for (const child of el.children) {
      if (typeof child === 'function') {
        // Reactive child
        let current: DOMNode | null = null;
        const marker = document.createComment('');
        node.appendChild(marker);

        cleanups.push(effect(() => {
          const value = (child as () => unknown)();
          if (current) {
            current.parentNode?.removeChild(current);
          }
          if (value != null) {
            const frag = document.createDocumentFragment();
            mount(value as TinyElement, frag);
            current = frag.firstChild as DOMNode;
            marker.parentNode?.insertBefore(frag, marker);
          }
        }));
      } else {
        mount(child, node);
      }
    }

    parent.appendChild(node);
    return node;
  };

  mount(element, container);

  return () => {
    cleanups.forEach(c => c());
    container.innerHTML = '';
  };
}

// =============================================================================
// Utilities
// =============================================================================

/**
 * Reactive show/hide
 */
export function Show<T>(props: {
  when: Getter<T | null | undefined | false>;
  fallback?: TinyElement;
  children: TinyElement | ((value: T) => TinyElement);
}): TinyElement {
  return h('', {}, () => {
    const value = props.when();
    if (value) {
      return typeof props.children === 'function'
        ? props.children(value)
        : props.children;
    }
    return props.fallback || null;
  });
}

/**
 * Reactive list rendering
 */
export function For<T>(props: {
  each: Getter<T[]>;
  fallback?: TinyElement;
  children: (item: T, index: Getter<number>) => TinyElement;
}): TinyElement {
  return h('', {}, () => {
    const items = props.each();
    if (items.length === 0) return props.fallback || null;
    return items.map((item, i) => props.children(item, () => i));
  });
}

/**
 * Create a store (object with reactive properties)
 */
export function store<T extends object>(initial: T): T {
  const signals = new Map<keyof T, TinySignal<T[keyof T]>>();

  return new Proxy(initial, {
    get(target, prop: keyof T) {
      let s = signals.get(prop);
      if (!s) {
        s = signal(target[prop]);
        signals.set(prop, s);
      }
      return s();
    },
    set(target, prop: keyof T, value) {
      let s = signals.get(prop);
      if (!s) {
        s = signal(value);
        signals.set(prop, s);
      } else {
        s.set(value);
      }
      target[prop] = value;
      return true;
    },
  }) as T;
}

// =============================================================================
// Export all as default for easy destructuring
// =============================================================================

export default {
  signal,
  computed,
  effect,
  batch,
  untrack,
  h,
  jsx,
  jsxs,
  jsxDEV,
  Fragment,
  render,
  Show,
  For,
  store,
};
