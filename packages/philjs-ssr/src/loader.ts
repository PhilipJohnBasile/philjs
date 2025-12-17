import type { Loader, Action } from "./types.js";

/**
 * Define a typed loader function.
 * @template T
 * @param {Loader<T>} fn - Loader function
 * @returns {Loader<T>}
 */
export function defineLoader<T>(fn: Loader<T>): Loader<T> {
  return fn;
}

/**
 * Define a typed action function.
 * @template T
 * @param {Action<T>} fn - Action function
 * @returns {Action<T>}
 */
export function defineAction<T>(fn: Action<T>): Action<T> {
  return fn;
}
