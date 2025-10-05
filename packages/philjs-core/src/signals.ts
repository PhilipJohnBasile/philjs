/**
 * Minimal signals implementation for PhilJS.
 * JSDoc types generate .d.ts on build.
 */

/** @typedef {(v: any) => void} Listener */

/**
 * Create a reactive signal.
 * @template T
 * @param {T} initial - Initial value
 * @returns {(() => T) & { set: (next: T | ((prev: T) => T)) => void, subscribe: (fn: (v: T) => void) => () => void }}
 */
export function signal(initial) {
  let v = initial;
  /** @type {Set<(v: any) => void>} */
  const subs = new Set();

  const read = () => v;

  read.subscribe = (fn) => {
    subs.add(fn);
    return () => subs.delete(fn);
  };

  const write = (next) => {
    v = typeof next === "function" ? next(v) : next;
    subs.forEach(fn => fn(v));
  };

  return Object.assign(read, { set: write });
}

/**
 * Create a memoized computation.
 * @template T
 * @param {() => T} calc - Computation function
 * @returns {() => T}
 */
export function memo(calc) {
  let cached = calc();
  return () => cached;
}

/**
 * Create a resource that can be refreshed.
 * @template T
 * @param {() => T} calc - Computation function
 * @returns {(() => T) & { refresh: () => void }}
 */
export function resource(calc) {
  const s = signal(calc());
  return Object.assign(() => s(), { refresh: () => s.set(calc()) });
}
