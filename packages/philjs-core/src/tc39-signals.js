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
const polyfillEnabled = typeof __PHILJS_SIGNAL_POLYFILL__ === 'boolean'
    ? __PHILJS_SIGNAL_POLYFILL__
    : true;
let polyfillPromise = null;
/**
 * Check if native TC39 Signals are available.
 */
export function hasNativeSignals() {
    const candidate = globalThis.Signal;
    return Boolean(candidate &&
        typeof candidate.State === 'function' &&
        typeof candidate.Computed === 'function');
}
/**
 * Get the native Signal implementation if available (no polyfill load).
 */
export function getNativeSignal() {
    return hasNativeSignals() ? globalThis.Signal : null;
}
/**
 * Lazily load the polyfill module.
 */
const loadSignalPolyfillImpl = polyfillEnabled
    ? async () => {
        if (!polyfillPromise) {
            polyfillPromise = import('./tc39-signals-polyfill.js');
        }
        return polyfillPromise;
    }
    : async () => {
        throw new Error('Signal polyfill loading is disabled. Enable __PHILJS_SIGNAL_POLYFILL__ or import @philjs/core/tc39-signals-polyfill directly.');
    };
export const loadSignalPolyfill = loadSignalPolyfillImpl;
/**
 * Get the Signal implementation (native or polyfill).
 * Uses dynamic import so the polyfill is code-split.
 */
export async function getSignalImpl() {
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
export async function installSignalPolyfill() {
    const native = getNativeSignal();
    if (native) {
        return native;
    }
    const module = await loadSignalPolyfill();
    globalThis.Signal = module.Signal;
    return module.Signal;
}
function createMissingSignalProxy() {
    return new Proxy({}, {
        get() {
            throw new Error('Native Signal is not available. Use getSignalImpl() or import @philjs/core/tc39-signals-polyfill.');
        }
    });
}
/**
 * Synchronous handle to native Signal (throws if missing).
 */
export const Signal = getNativeSignal() ?? createMissingSignalProxy();
/**
 * TC39-adjacent helpers (PhilJS extensions).
 */
export { batch, effect } from './signals.js';
export default Signal;
//# sourceMappingURL=tc39-signals.js.map