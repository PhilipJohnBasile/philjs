import type { Loader, Action } from "./types.js";
/**
 * Define a typed loader function.
 * @template T
 * @param {Loader<T>} fn - Loader function
 * @returns {Loader<T>}
 */
export declare function defineLoader<T>(fn: Loader<T>): Loader<T>;
/**
 * Define a typed action function.
 * @template T
 * @param {Action<T>} fn - Action function
 * @returns {Action<T>}
 */
export declare function defineAction<T>(fn: Action<T>): Action<T>;
//# sourceMappingURL=loader.d.ts.map