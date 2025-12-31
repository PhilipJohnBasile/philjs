/**
 * Qwik-style lazy event handlers
 * Enables automatic code splitting per handler with progressive enhancement
 */
/**
 * Event handler registry
 */
class HandlerRegistry {
    handlers = new Map();
    pendingLoads = new Map();
    /**
     * Register a lazy handler
     */
    register(symbolId, handler, modulePath) {
        const entry = {
            symbolId,
            handler,
            loaded: false,
        };
        if (modulePath !== undefined) {
            entry.modulePath = modulePath;
        }
        this.handlers.set(symbolId, entry);
    }
    /**
     * Get a handler by symbol ID
     */
    get(symbolId) {
        return this.handlers.get(symbolId);
    }
    /**
     * Load a handler dynamically
     */
    async load(symbolId) {
        const handler = this.handlers.get(symbolId);
        if (!handler) {
            throw new Error(`Handler ${symbolId} not found`);
        }
        // Return if already loaded
        if (handler.loaded) {
            return handler.handler;
        }
        // Check if load is pending
        const pending = this.pendingLoads.get(symbolId);
        if (pending) {
            return pending;
        }
        // Load the handler module
        if (handler.modulePath) {
            const loadPromise = this.loadModule(handler.modulePath, symbolId);
            this.pendingLoads.set(symbolId, loadPromise);
            try {
                const loadedHandler = await loadPromise;
                handler.handler = loadedHandler;
                handler.loaded = true;
                this.pendingLoads.delete(symbolId);
                return loadedHandler;
            }
            catch (error) {
                this.pendingLoads.delete(symbolId);
                throw error;
            }
        }
        // Mark as loaded if no module path (already available)
        handler.loaded = true;
        return handler.handler;
    }
    /**
     * Load a module dynamically
     */
    async loadModule(modulePath, symbolId) {
        try {
            const module = await import(/* @vite-ignore */ modulePath);
            // Try to find the handler in the module
            if (module[symbolId]) {
                return module[symbolId];
            }
            if (module.default) {
                return module.default;
            }
            throw new Error(`Handler ${symbolId} not found in module ${modulePath}`);
        }
        catch (error) {
            console.error(`Failed to load handler ${symbolId} from ${modulePath}:`, error);
            throw error;
        }
    }
    /**
     * Check if a handler is loaded
     */
    isLoaded(symbolId) {
        const handler = this.handlers.get(symbolId);
        return handler?.loaded ?? false;
    }
    /**
     * Clear all handlers
     */
    clear() {
        this.handlers.clear();
        this.pendingLoads.clear();
    }
    /**
     * Get all registered handlers
     */
    getAll() {
        return Array.from(this.handlers.values());
    }
}
/**
 * Global handler registry
 */
export const handlerRegistry = new HandlerRegistry();
/**
 * Symbol ID counter for generating unique IDs
 */
let symbolCounter = 0;
/**
 * $ - Lazy handler wrapper (Qwik-style)
 * Wraps a function for automatic lazy loading
 *
 * @example
 * ```tsx
 * <button onClick={$(() => console.log('clicked'))}>
 *   Click me
 * </button>
 * ```
 */
export function $(handler) {
    // Generate a unique symbol ID
    const symbolId = `$handler_${symbolCounter++}`;
    // Register the handler
    handlerRegistry.register(symbolId, handler);
    return {
        symbolId,
        handler,
        loaded: false,
    };
}
/**
 * $$() - Inline lazy handler with explicit symbol ID
 * Useful when you need to reference the same handler in multiple places
 *
 * @example
 * ```tsx
 * const onClick = $$('handleClick', () => console.log('clicked'));
 * <button onClick={onClick}>Click me</button>
 * ```
 */
export function $$(symbolId, handler) {
    handlerRegistry.register(symbolId, handler);
    return {
        symbolId,
        handler,
        loaded: false,
    };
}
/**
 * Load and execute a lazy handler
 */
export async function loadHandler(symbolId, ...args) {
    const handler = await handlerRegistry.load(symbolId);
    return handler(...args);
}
/**
 * Create a lazy event handler that loads on interaction
 */
export function createLazyEventHandler(lazyHandler) {
    return async (event) => {
        // Prevent default if needed
        if ('preventDefault' in event && typeof event.preventDefault === 'function') {
            // Let the handler decide whether to prevent default
        }
        try {
            // Load the handler
            const handler = await handlerRegistry.load(lazyHandler.symbolId);
            // Execute the handler
            await handler(event);
        }
        catch (error) {
            console.error(`Error executing lazy handler ${lazyHandler.symbolId}:`, error);
            throw error;
        }
    };
}
/**
 * Prefetch a lazy handler
 */
export async function prefetchHandler(symbolId) {
    await handlerRegistry.load(symbolId);
}
/**
 * Check if a value is a lazy handler
 */
export function isLazyHandler(value) {
    return (value &&
        typeof value === 'object' &&
        'symbolId' in value &&
        'handler' in value &&
        'loaded' in value);
}
/**
 * Convert lazy handlers in props to actual event handlers
 */
export function resolveLazyHandlers(props) {
    const resolved = { ...props };
    for (const [key, value] of Object.entries(props)) {
        // Check if this is an event handler prop (starts with 'on')
        if (key.startsWith('on') && isLazyHandler(value)) {
            // Replace with a lazy event handler
            resolved[key] = createLazyEventHandler(value);
        }
    }
    return resolved;
}
/**
 * Server-side handler extraction
 * Extracts serializable handler references for SSR
 */
export function serializeLazyHandlers(props) {
    const serializedProps = { ...props };
    const handlers = {};
    for (const [key, value] of Object.entries(props)) {
        if (key.startsWith('on') && isLazyHandler(value)) {
            // Store the handler symbol ID
            handlers[key] = value.symbolId;
            // Replace with a data attribute for hydration
            delete serializedProps[key];
            serializedProps[`data-${key.toLowerCase()}`] = value.symbolId;
        }
    }
    return {
        props: serializedProps,
        handlers,
    };
}
/**
 * Client-side handler hydration
 * Reattaches lazy handlers during hydration
 */
export function hydrateLazyHandlers(element) {
    // Find all elements with lazy handler attributes
    const elements = element.querySelectorAll('[data-onclick], [data-onchange], [data-oninput]');
    for (const el of elements) {
        const attrs = el.attributes;
        for (let i = 0; i < attrs.length; i++) {
            const attr = attrs[i];
            // Check if this is a lazy handler attribute
            if (attr.name.startsWith('data-on')) {
                const eventName = attr.name.slice(5); // Remove 'data-'
                const symbolId = attr.value;
                // Attach the lazy event handler
                el.addEventListener(eventName, async (event) => {
                    await loadHandler(symbolId, event);
                });
                // Remove the data attribute
                el.removeAttribute(attr.name);
            }
        }
    }
}
/**
 * Progressive enhancement for forms
 * Enhances forms with lazy handlers while maintaining functionality
 */
export function enhanceForm(form) {
    const submitHandler = form.getAttribute('data-onsubmit');
    if (submitHandler) {
        form.addEventListener('submit', async (event) => {
            event.preventDefault();
            await loadHandler(submitHandler, event);
        });
        form.removeAttribute('data-onsubmit');
    }
    // Enhance form fields
    const fields = form.querySelectorAll('[data-onchange], [data-oninput]');
    for (const field of fields) {
        hydrateLazyHandlers(field);
    }
}
/**
 * Auto-hydrate lazy handlers on page load
 */
if (typeof document !== 'undefined') {
    // Hydrate on DOMContentLoaded
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            hydrateLazyHandlers(document.body);
            // Enhance all forms
            const forms = document.querySelectorAll('form');
            for (const form of forms) {
                enhanceForm(form);
            }
        });
    }
    else {
        // Document already loaded
        hydrateLazyHandlers(document.body);
        const forms = document.querySelectorAll('form');
        for (const form of forms) {
            enhanceForm(form);
        }
    }
}
//# sourceMappingURL=lazy-handlers.js.map