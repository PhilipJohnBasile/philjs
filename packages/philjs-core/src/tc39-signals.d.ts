/**
 * TC39 Signals Proposal Compatible API for PhilJS (native-first, lazy polyfill).
 *
 * This entrypoint keeps bundles slim by only loading the polyfill when
 * native Signals are not available.
 *
 * @see https://github.com/tc39/proposal-signals
 *
 * @example
 * ```ts
 * import { getSignalImpl } from '@philjs/core/tc39-signals';
 *
 * const Signal = await getSignalImpl();
 * const count = new Signal.State(0);
 * const doubled = new Signal.Computed(() => count.get() * 2);
 * ```
 */
export interface SignalState<T> {
    get(): T;
    set(value: T): void;
}
export interface SignalComputed<T> {
    get(): T;
}
export interface SignalWatcher {
    watch(...signals: SignalState<unknown>[]): void;
    unwatch(...signals: SignalState<unknown>[]): void;
    getPending(): SignalState<unknown>[];
}
export interface SignalNamespace {
    State: new <T>(value: T, options?: {
        equals?: (a: T, b: T) => boolean;
    }) => SignalState<T>;
    Computed: new <T>(computation: () => T, options?: {
        equals?: (a: T, b: T) => boolean;
    }) => SignalComputed<T>;
    subtle?: {
        Watcher?: new (callback: () => void) => SignalWatcher;
        untrack?: <T>(fn: () => T) => T;
        currentComputation?: () => unknown | null;
        hasPendingBatch?: () => boolean;
    };
}
type PolyfillModule = typeof import('./tc39-signals-polyfill.js');
/**
 * Check if native TC39 Signals are available.
 */
export declare function hasNativeSignals(): boolean;
/**
 * Get the native Signal implementation if available (no polyfill load).
 */
export declare function getNativeSignal(): SignalNamespace | null;
export declare const loadSignalPolyfill: () => Promise<PolyfillModule>;
/**
 * Get the Signal implementation (native or polyfill).
 * Uses dynamic import so the polyfill is code-split.
 */
export declare function getSignalImpl(): Promise<SignalNamespace>;
/**
 * Install the polyfill on globalThis when native Signals are missing.
 */
export declare function installSignalPolyfill(): Promise<SignalNamespace>;
/**
 * Synchronous handle to native Signal (throws if missing).
 */
export declare const Signal: SignalNamespace;
/**
 * TC39-adjacent helpers (PhilJS extensions).
 */
export { batch, effect } from './signals.js';
export default Signal;
//# sourceMappingURL=tc39-signals.d.ts.map