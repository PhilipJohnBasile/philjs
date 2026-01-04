/**
 * QRL (Quick Resource Locator) - Lazy references for resumability.
 *
 * QRLs are the fundamental building block of resumability. They allow
 * serializing references to functions, components, and resources as URLs
 * that can be lazily loaded when needed.
 *
 * @example
 * ```typescript
 * // Create a lazy handler reference
 * const handler = $(() => console.log('clicked'));
 *
 * // Use in JSX
 * <button onClick$={handler}>Click me</button>
 *
 * // The handler is not loaded until the button is clicked
 * ```
 */
const registry = {
    chunks: new Map(),
    resolved: new Map(),
    basePath: '',
};
/**
 * Configure the QRL registry
 */
export function configureQRL(options) {
    if (options.basePath !== undefined) {
        registry.basePath = options.basePath;
    }
    if (options.resolver !== undefined) {
        registry.resolver = options.resolver;
    }
}
/**
 * Clear the QRL registry (for testing)
 */
export function clearQRLRegistry() {
    registry.chunks.clear();
    registry.resolved.clear();
    registry.basePath = '';
    delete registry.resolver;
}
/**
 * Register a chunk loader
 */
export function registerChunk(chunkPath, loader) {
    registry.chunks.set(chunkPath, loader);
}
/**
 * Register multiple chunk loaders
 */
export function registerChunks(chunks) {
    for (const [path, loader] of Object.entries(chunks)) {
        registerChunk(path, loader);
    }
}
// ============================================================================
// QRL ID Generation
// ============================================================================
let qrlIdCounter = 0;
/**
 * Generate a unique QRL ID
 */
function generateQRLId(chunk, symbol) {
    return `qrl_${chunk.replace(/[^a-zA-Z0-9]/g, '_')}_${symbol}_${qrlIdCounter++}`;
}
// ============================================================================
// Core QRL Implementation
// ============================================================================
/**
 * Create a QRL from options
 */
export function createQRL(options) {
    const id = generateQRLId(options.chunk, options.symbol);
    const qrl = {
        $id$: id,
        $chunk$: options.chunk,
        $symbol$: options.symbol,
        $capture$: options.capture || [],
        $captureNames$: options.captureNames,
        $resolved$: options.resolved,
        $isResolved$: options.resolved !== undefined,
        async resolve() {
            if (qrl.$isResolved$) {
                return qrl.$resolved$;
            }
            // Check registry cache
            if (registry.resolved.has(id)) {
                qrl.$resolved$ = registry.resolved.get(id);
                qrl.$isResolved$ = true;
                return qrl.$resolved$;
            }
            // Load the chunk
            let module;
            if (registry.resolver) {
                module = await registry.resolver(options.chunk);
            }
            else if (registry.chunks.has(options.chunk)) {
                module = await registry.chunks.get(options.chunk)();
            }
            else {
                // Dynamic import with base path
                const fullPath = registry.basePath
                    ? `${registry.basePath}/${options.chunk}`
                    : options.chunk;
                module = await import(/* @vite-ignore */ fullPath);
            }
            // Get the symbol
            const value = module[options.symbol];
            if (value === undefined) {
                throw new Error(`QRL symbol "${options.symbol}" not found in chunk "${options.chunk}"`);
            }
            // If the value is a function and we have captures, bind them
            if (typeof value === 'function' && qrl.$capture$.length > 0) {
                qrl.$resolved$ = bindCaptures(value, qrl.$capture$, qrl.$captureNames$);
            }
            else {
                qrl.$resolved$ = value;
            }
            qrl.$isResolved$ = true;
            registry.resolved.set(id, qrl.$resolved$);
            return qrl.$resolved$;
        },
        serialize() {
            const captures = qrl.$capture$.length > 0
                ? `[${qrl.$capture$.map(serializeCapture).join(',')}]`
                : '';
            return `${options.chunk}#${options.symbol}${captures}`;
        },
        invoke(...args) {
            return (async () => {
                const fn = await qrl.resolve();
                if (typeof fn !== 'function') {
                    throw new Error(`QRL ${id} is not a function`);
                }
                return fn(...args);
            })();
        },
    };
    return qrl;
}
/**
 * Serialize a captured value for QRL serialization
 */
function serializeCapture(value) {
    if (value === null)
        return 'null';
    if (value === undefined)
        return 'undefined';
    if (typeof value === 'string')
        return JSON.stringify(value);
    if (typeof value === 'number')
        return String(value);
    if (typeof value === 'boolean')
        return String(value);
    if (typeof value === 'object') {
        // Check for signal-like objects
        if ('$id$' in value) {
            return `qrl:${value.$id$}`;
        }
        return JSON.stringify(value);
    }
    return String(value);
}
/**
 * Bind captured variables to a function
 */
function bindCaptures(fn, captures, captureNames) {
    // If we have capture names, create an object for named access
    if (captureNames && captureNames.length === captures.length) {
        const captureObj = {};
        captureNames.forEach((name, i) => {
            captureObj[name] = captures[i];
        });
        return (...args) => fn(captureObj, ...args);
    }
    // Otherwise, pass captures as first argument
    return (...args) => fn(captures, ...args);
}
// ============================================================================
// QRL Factory Functions
// ============================================================================
/**
 * The $ function - creates a lazy QRL reference.
 * This is the primary API for creating resumable code.
 *
 * @example
 * ```typescript
 * // Lazy event handler
 * const onClick = $(() => console.log('clicked'));
 *
 * // Lazy handler with captured state
 * const count = signal(0);
 * const increment = $((captures) => captures.count.set(c => c + 1), [count]);
 * ```
 */
export function $(fn, captures, captureNames) {
    // In development, we keep the function inline
    // In production, the compiler will extract to chunks
    const options = {
        chunk: '__inline__',
        symbol: fn.name || 'anonymous',
        resolved: fn,
    };
    if (captures !== undefined) {
        options.capture = captures;
    }
    if (captureNames !== undefined) {
        options.captureNames = captureNames;
    }
    return createQRL(options);
}
/**
 * Create a lazy component QRL
 */
export function component$(component) {
    return createQRL({
        chunk: '__inline__',
        symbol: component.name || 'Component',
        resolved: component,
    });
}
/**
 * Parse a serialized QRL string back into a QRL object
 */
export function parseQRL(serialized) {
    // Format: chunk#symbol[captures]
    const hashIndex = serialized.indexOf('#');
    if (hashIndex === -1) {
        throw new Error(`Invalid QRL format: ${serialized}`);
    }
    const chunk = serialized.slice(0, hashIndex);
    let symbol = serialized.slice(hashIndex + 1);
    let captures = [];
    // Parse captures if present
    const bracketIndex = symbol.indexOf('[');
    if (bracketIndex !== -1) {
        const captureStr = symbol.slice(bracketIndex + 1, -1);
        symbol = symbol.slice(0, bracketIndex);
        captures = parseCaptures(captureStr);
    }
    return createQRL({
        chunk,
        symbol,
        capture: captures,
    });
}
/**
 * Parse captures from a serialized string
 */
function parseCaptures(captureStr) {
    if (!captureStr)
        return [];
    // Simple JSON-based parsing
    try {
        return JSON.parse(`[${captureStr}]`);
    }
    catch {
        // Handle special values
        return captureStr.split(',').map((s) => {
            s = s.trim();
            if (s === 'null')
                return null;
            if (s === 'undefined')
                return undefined;
            if (s === 'true')
                return true;
            if (s === 'false')
                return false;
            if (s.startsWith('qrl:'))
                return { $qrlRef$: s.slice(4) };
            const num = Number(s);
            if (!isNaN(num))
                return num;
            // Try JSON parse for strings/objects
            try {
                return JSON.parse(s);
            }
            catch {
                return s;
            }
        });
    }
}
// ============================================================================
// Event Handler Helpers
// ============================================================================
/**
 * Create a QRL event handler with type safety
 */
export function event$(handler, captures, captureNames) {
    return $(handler, captures, captureNames);
}
/**
 * Common event handler types
 */
export const onClick$ = (handler, captures) => event$(handler, captures);
export const onInput$ = (handler, captures) => event$(handler, captures);
export const onChange$ = (handler, captures) => event$(handler, captures);
export const onSubmit$ = (handler, captures) => event$(handler, captures);
export const onKeyDown$ = (handler, captures) => event$(handler, captures);
export const onKeyUp$ = (handler, captures) => event$(handler, captures);
export const onFocus$ = (handler, captures) => event$(handler, captures);
export const onBlur$ = (handler, captures) => event$(handler, captures);
// ============================================================================
// QRL Utilities
// ============================================================================
/**
 * Check if a value is a QRL
 */
export function isQRL(value) {
    return (value !== null &&
        typeof value === 'object' &&
        '$id$' in value &&
        '$chunk$' in value &&
        '$symbol$' in value &&
        typeof value.resolve === 'function');
}
/**
 * Get the serialized form of a QRL for embedding in HTML
 */
export function getQRLAttribute(qrl) {
    return qrl.serialize();
}
/**
 * Prefetch a QRL's chunk without resolving
 */
export async function prefetchQRL(qrl) {
    if (qrl.$isResolved$)
        return;
    const chunk = qrl.$chunk$;
    if (chunk === '__inline__')
        return;
    // Just load the chunk to warm the cache
    if (registry.resolver) {
        await registry.resolver(chunk);
    }
    else if (registry.chunks.has(chunk)) {
        await registry.chunks.get(chunk)();
    }
}
/**
 * Prefetch multiple QRLs in parallel
 */
export async function prefetchQRLs(qrls) {
    await Promise.all(qrls.map(prefetchQRL));
}
/**
 * Create a QRL that references an external module
 */
export function qrl(chunk, symbol, captures) {
    const options = {
        chunk,
        symbol,
    };
    if (captures !== undefined) {
        options.capture = captures;
    }
    return createQRL(options);
}
/**
 * Inline a QRL - useful for SSR where we want immediate execution
 */
export function inlineQRL(value) {
    return createQRL({
        chunk: '__inline__',
        symbol: 'value',
        resolved: value,
    });
}
// ============================================================================
// Signal Integration
// ============================================================================
/**
 * Create a lazy signal reference
 */
export function signal$(initialValue) {
    // This will be transformed by the compiler to use @philjs/core signals
    return createQRL({
        chunk: '@philjs/core',
        symbol: 'signal',
        capture: [initialValue],
        captureNames: ['initialValue'],
    });
}
/**
 * Create a lazy computed/memo reference
 */
export function computed$(computation, captures) {
    return createQRL({
        chunk: '@philjs/core',
        symbol: 'memo',
        capture: [computation, ...(captures || [])],
        captureNames: ['computation'],
    });
}
// ============================================================================
// Task/Effect QRLs
// ============================================================================
/**
 * Create a lazy task that runs on the server
 */
export function server$(fn) {
    return createQRL({
        chunk: '__server__',
        symbol: fn.name || 'serverFn',
        resolved: fn,
    });
}
/**
 * Create a lazy task that runs on the client
 */
export function browser$(fn) {
    // On server, return a no-op
    if (typeof window === 'undefined') {
        return createQRL({
            chunk: '__browser__',
            symbol: fn.name || 'browserFn',
            resolved: (() => { }),
        });
    }
    return createQRL({
        chunk: '__browser__',
        symbol: fn.name || 'browserFn',
        resolved: fn,
    });
}
/**
 * Create a lazy effect that runs after hydration
 */
export function useVisibleTask$(fn) {
    return createQRL({
        chunk: '__task__',
        symbol: 'visibleTask',
        resolved: fn,
    });
}
/**
 * Create a lazy task that runs on the server during SSR
 */
export function useTask$(fn) {
    return createQRL({
        chunk: '__task__',
        symbol: 'task',
        resolved: fn,
    });
}
//# sourceMappingURL=qrl.js.map