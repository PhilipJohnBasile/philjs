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

export type { SignalState, SignalComputed, SignalWatcher } from './tc39-signals-polyfill.js';

type SignalNamespace = typeof import('./tc39-signals-polyfill.js').Signal;

let polyfillPromise: Promise<typeof import('./tc39-signals-polyfill.js')> | null = null;

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
export async function loadSignalPolyfill(): Promise<typeof import('./tc39-signals-polyfill.js')> {
  if (!polyfillPromise) {
    polyfillPromise = import('./tc39-signals-polyfill.js');
  }
  return polyfillPromise;
}

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
