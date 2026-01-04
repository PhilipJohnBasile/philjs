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
  State: new <T>(value: T, options?: { equals?: (a: T, b: T) => boolean }) => SignalState<T>;
  Computed: new <T>(
    computation: () => T,
    options?: { equals?: (a: T, b: T) => boolean }
  ) => SignalComputed<T>;
  subtle?: {
    Watcher?: new (callback: () => void) => SignalWatcher;
    untrack?: <T>(fn: () => T) => T;
    currentComputation?: () => unknown | null;
    hasPendingBatch?: () => boolean;
  };
}

declare const __PHILJS_SIGNAL_POLYFILL__: boolean | undefined;

const polyfillEnabled =
  typeof __PHILJS_SIGNAL_POLYFILL__ === 'boolean'
    ? __PHILJS_SIGNAL_POLYFILL__
    : true;

type PolyfillModule = typeof import('./tc39-signals-polyfill.js');

let polyfillPromise: Promise<PolyfillModule> | null = null;

/**
 * Check if native TC39 Signals are available.
 */
export function hasNativeSignals(): boolean {
  const candidate = (globalThis as any).Signal;
  return Boolean(
    candidate &&
      typeof candidate.State === 'function' &&
      typeof candidate.Computed === 'function'
  );
}

/**
 * Get the native Signal implementation if available (no polyfill load).
 */
export function getNativeSignal(): SignalNamespace | null {
  return hasNativeSignals() ? ((globalThis as any).Signal as SignalNamespace) : null;
}

/**
 * Lazily load the polyfill module.
 */
const loadSignalPolyfillImpl = polyfillEnabled
  ? async (): Promise<PolyfillModule> => {
      if (!polyfillPromise) {
        polyfillPromise = import('./tc39-signals-polyfill.js');
      }
      return polyfillPromise;
    }
  : async (): Promise<PolyfillModule> => {
      throw new Error(
        'Signal polyfill loading is disabled. Enable __PHILJS_SIGNAL_POLYFILL__ or import @philjs/core/tc39-signals-polyfill directly.'
      );
    };

export const loadSignalPolyfill = loadSignalPolyfillImpl;

/**
 * Get the Signal implementation (native or polyfill).
 * Uses dynamic import so the polyfill is code-split.
 */
export async function getSignalImpl(): Promise<SignalNamespace> {
  const native = getNativeSignal();
  if (native) {
    return native;
  }
  const module = await loadSignalPolyfill();
  return module.Signal;
}

/**
 * Install the polyfill on globalThis when native Signals are missing.
 */
export async function installSignalPolyfill(): Promise<SignalNamespace> {
  const native = getNativeSignal();
  if (native) {
    return native;
  }
  const module = await loadSignalPolyfill();
  (globalThis as any).Signal = module.Signal;
  return module.Signal;
}

function createMissingSignalProxy(): SignalNamespace {
  return new Proxy(
    {},
    {
      get() {
        throw new Error(
          'Native Signal is not available. Use getSignalImpl() or import @philjs/core/tc39-signals-polyfill.'
        );
      }
    }
  ) as SignalNamespace;
}

/**
 * Synchronous handle to native Signal (throws if missing).
 */
export const Signal: SignalNamespace = getNativeSignal() ?? createMissingSignalProxy();

/**
 * TC39-adjacent helpers (PhilJS extensions).
 */
export { batch, effect } from './signals.js';

export default Signal;
