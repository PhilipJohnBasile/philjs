/**
 * State Serialization Utilities
 *
 * Provides comprehensive serialization/deserialization for PhilJS signals and state.
 * Supports multiple serialization strategies for different use cases:
 * - SSR hydration
 * - LocalStorage persistence
 * - URL state synchronization
 * - State debugging and devtools
 */
import { signal, computed } from './signals.js';
// ============================================================================
// Core Serialization
// ============================================================================
const signalRegistry = new Map();
let signalIdCounter = 0;
/**
 * Serialize any value to a transportable format
 */
export function serialize(value, options = {}, depth = 0) {
    const { signals = true, computed: includeComputed = true, preserveTypes = true, metadata = false, maxDepth = 10, serializers, ignore = [], } = options;
    // Check depth limit
    if (depth > maxDepth) {
        return { type: 'primitive', value: '[Max Depth Exceeded]' };
    }
    // Handle null
    if (value === null) {
        return { type: 'null', value: null };
    }
    // Handle undefined
    if (value === undefined) {
        return { type: 'undefined', value: undefined };
    }
    // Handle signals
    if (signals && isSignal(value)) {
        const signalId = getOrCreateSignalId(value);
        const result = {
            type: 'signal',
            value: serialize(value(), options, depth + 1).value,
        };
        if (metadata) {
            result.metadata = { signalId, timestamp: Date.now() };
        }
        return result;
    }
    // Handle computed values
    if (includeComputed && isComputed(value)) {
        const result = {
            type: 'computed',
            value: serialize(value(), options, depth + 1).value,
        };
        if (metadata) {
            result.metadata = { timestamp: Date.now() };
        }
        return result;
    }
    // Handle primitives
    if (typeof value === 'boolean' || typeof value === 'number' || typeof value === 'string') {
        return { type: 'primitive', value };
    }
    // Handle Date
    if (preserveTypes && value instanceof Date) {
        return { type: 'date', value: value.toISOString() };
    }
    // Handle RegExp
    if (preserveTypes && value instanceof RegExp) {
        return {
            type: 'regexp',
            value: { source: value.source, flags: value.flags },
        };
    }
    // Handle Error
    if (preserveTypes && value instanceof Error) {
        return {
            type: 'error',
            value: {
                name: value.name,
                message: value.message,
                stack: value.stack,
            },
        };
    }
    // Custom serializers
    if (serializers) {
        const typeName = value.constructor?.name;
        if (typeName && serializers.has(typeName)) {
            const serializer = serializers.get(typeName);
            return { type: 'primitive', value: serializer(value) };
        }
    }
    // Handle arrays
    if (Array.isArray(value)) {
        return {
            type: 'array',
            value: value.map(item => serialize(item, options, depth + 1)),
        };
    }
    // Handle objects
    if (typeof value === 'object') {
        const obj = {};
        for (const key in value) {
            if (value.hasOwnProperty(key) && !ignore.includes(key)) {
                obj[key] = serialize(value[key], options, depth + 1);
            }
        }
        return { type: 'object', value: obj };
    }
    // Fallback
    return { type: 'primitive', value: String(value) };
}
/**
 * Deserialize a serialized value
 */
export function deserialize(serialized, options = {}) {
    const { deserializers, preserveTypes = true } = options;
    switch (serialized.type) {
        case 'null':
            return null;
        case 'undefined':
            return undefined;
        case 'primitive':
            return serialized.value;
        case 'signal': {
            const signalId = serialized.metadata?.signalId;
            if (signalId && signalRegistry.has(signalId)) {
                return signalRegistry.get(signalId);
            }
            const sig = signal(deserialize(serialized.value, options));
            if (signalId) {
                signalRegistry.set(signalId, sig);
            }
            return sig;
        }
        case 'computed':
            // Cannot recreate computed without dependencies
            return deserialize(serialized.value, options);
        case 'date':
            return preserveTypes ? new Date(serialized.value) : serialized.value;
        case 'regexp':
            return preserveTypes
                ? new RegExp(serialized.value.source, serialized.value.flags)
                : serialized.value;
        case 'error': {
            if (!preserveTypes)
                return serialized.value;
            const error = new Error(serialized.value.message);
            error.name = serialized.value.name;
            error.stack = serialized.value.stack;
            return error;
        }
        case 'array':
            return serialized.value.map((item) => deserialize(item, options));
        case 'object': {
            const obj = {};
            for (const key in serialized.value) {
                obj[key] = deserialize(serialized.value[key], options);
            }
            return obj;
        }
        default:
            return serialized.value;
    }
}
/**
 * Serialize to JSON string
 */
export function toJSON(value, options = {}) {
    const serialized = serialize(value, options);
    return JSON.stringify(serialized, null, options.pretty ? 2 : 0);
}
/**
 * Deserialize from JSON string
 */
export function fromJSON(json, options = {}) {
    const serialized = JSON.parse(json);
    return deserialize(serialized, options);
}
// ============================================================================
// SSR Hydration
// ============================================================================
/**
 * Serialize state for SSR hydration
 */
export function serializeForHydration(state, options = {}) {
    const hydrationData = {};
    for (const key in state) {
        hydrationData[key] = serialize(state[key], {
            ...options,
            signals: true,
            computed: true,
            preserveTypes: true,
            metadata: true,
        });
    }
    return JSON.stringify(hydrationData);
}
/**
 * Hydrate state from serialized SSR data
 */
export function hydrateFromSSR(serialized, options = {}) {
    const hydrationData = JSON.parse(serialized);
    const result = {};
    for (const key in hydrationData) {
        result[key] = deserialize(hydrationData[key], options);
    }
    return result;
}
/**
 * Inject hydration data into HTML
 */
export function injectHydrationData(html, data, options = {}) {
    const serialized = serializeForHydration(data, options);
    const script = `
    <script type="application/json" id="__PHILJS_HYDRATION__">
      ${serialized}
    </script>
  `;
    return html.replace('</head>', `${script}</head>`);
}
/**
 * Extract hydration data from HTML
 */
export function extractHydrationData(options = {}) {
    if (typeof document === 'undefined')
        return null;
    const script = document.getElementById('__PHILJS_HYDRATION__');
    if (!script || !script.textContent)
        return null;
    try {
        return hydrateFromSSR(script.textContent, options);
    }
    catch (error) {
        console.error('[Hydration] Failed to extract data:', error);
        return null;
    }
}
// ============================================================================
// LocalStorage Persistence
// ============================================================================
/**
 * Persist state to localStorage
 */
export function persistToLocalStorage(key, value, options = {}) {
    if (typeof localStorage === 'undefined')
        return;
    try {
        const serialized = toJSON(value, options);
        localStorage.setItem(key, serialized);
    }
    catch (error) {
        console.error('[Persistence] Failed to save to localStorage:', error);
    }
}
/**
 * Restore state from localStorage
 */
export function restoreFromLocalStorage(key, options = {}) {
    if (typeof localStorage === 'undefined')
        return null;
    try {
        const serialized = localStorage.getItem(key);
        if (!serialized)
            return null;
        return fromJSON(serialized, options);
    }
    catch (error) {
        console.error('[Persistence] Failed to restore from localStorage:', error);
        return null;
    }
}
/**
 * Create a persistent signal that syncs with localStorage
 */
export function persistentSignal(key, initialValue, options = {}) {
    // Try to restore from localStorage
    const restored = restoreFromLocalStorage(key, options);
    const sig = signal(restored !== null ? restored : initialValue);
    // Persist on change
    if (typeof localStorage !== 'undefined') {
        sig.subscribe((value) => {
            persistToLocalStorage(key, value, options);
        });
    }
    return sig;
}
// ============================================================================
// URL State Synchronization
// ============================================================================
/**
 * Serialize state to URL search params
 */
export function serializeToURL(state, options = {}) {
    const params = new URLSearchParams();
    for (const key in state) {
        const value = state[key];
        // Handle signals
        const actualValue = isSignal(value) ? value() : value;
        // Serialize to compact format
        if (actualValue !== null && actualValue !== undefined) {
            if (typeof actualValue === 'object') {
                params.set(key, JSON.stringify(actualValue));
            }
            else {
                params.set(key, String(actualValue));
            }
        }
    }
    return params.toString();
}
/**
 * Deserialize state from URL search params
 */
export function deserializeFromURL(searchParams, options = {}) {
    const params = typeof searchParams === 'string'
        ? new URLSearchParams(searchParams)
        : searchParams;
    const result = {};
    for (const [key, value] of params) {
        // Try to parse as JSON
        try {
            result[key] = JSON.parse(value);
        }
        catch {
            // Use as string
            result[key] = value;
        }
    }
    return result;
}
/**
 * Create a signal that syncs with URL search params
 */
export function urlSignal(key, initialValue, options = {}) {
    // Try to restore from URL
    const params = new URLSearchParams(window.location.search);
    const urlValue = params.get(key);
    let restoredValue = initialValue;
    if (urlValue) {
        try {
            restoredValue = JSON.parse(urlValue);
        }
        catch {
            restoredValue = urlValue;
        }
    }
    const sig = signal(restoredValue);
    // Update URL on change
    sig.subscribe((value) => {
        const params = new URLSearchParams(window.location.search);
        if (value !== null && value !== undefined) {
            params.set(key, typeof value === 'object' ? JSON.stringify(value) : String(value));
        }
        else {
            params.delete(key);
        }
        const newUrl = `${window.location.pathname}?${params.toString()}`;
        window.history.replaceState({}, '', newUrl);
    });
    return sig;
}
// ============================================================================
// Utilities
// ============================================================================
/**
 * Check if a value is a signal
 */
function isSignal(value) {
    return (typeof value === 'function' &&
        'subscribe' in value &&
        'set' in value);
}
/**
 * Check if a value is a computed signal
 */
function isComputed(value) {
    return (isSignal(value) &&
        !('set' in value));
}
/**
 * Get or create a signal ID
 */
function getOrCreateSignalId(sig) {
    for (const [id, registeredSig] of signalRegistry) {
        if (registeredSig === sig)
            return id;
    }
    const id = `sig_${signalIdCounter++}`;
    signalRegistry.set(id, sig);
    return id;
}
/**
 * Clear all registered signals
 */
export function clearSignalRegistry() {
    signalRegistry.clear();
    signalIdCounter = 0;
}
/**
 * Get serialization stats
 */
export function getSerializationStats(value) {
    const serialized = toJSON(value, { pretty: false });
    let signalCount = 0;
    let objectCount = 0;
    let arrayCount = 0;
    let maxDepth = 0;
    function analyze(val, depth) {
        maxDepth = Math.max(maxDepth, depth);
        if (isSignal(val)) {
            signalCount++;
            analyze(val(), depth + 1);
        }
        else if (Array.isArray(val)) {
            arrayCount++;
            val.forEach(item => analyze(item, depth + 1));
        }
        else if (typeof val === 'object' && val !== null) {
            objectCount++;
            for (const key in val) {
                analyze(val[key], depth + 1);
            }
        }
    }
    analyze(value, 0);
    return {
        size: new Blob([serialized]).size,
        signalCount,
        objectCount,
        arrayCount,
        depth: maxDepth,
    };
}
/**
 * Deep clone a value using serialization
 */
export function deepClone(value, options = {}) {
    return deserialize(serialize(value, options), options);
}
/**
 * Compare two values for deep equality
 */
export function deepEqual(a, b) {
    const serializedA = toJSON(a, { signals: true });
    const serializedB = toJSON(b, { signals: true });
    return serializedA === serializedB;
}
//# sourceMappingURL=serialization.js.map