/**
 * Resumability system for zero-hydration interactivity.
 * Serializes event handlers and state on the server,
 * then lazily loads them on interaction.
 */
/**
 * Global resumable state for SSR.
 */
let globalState = null;
/**
 * Initialize resumability context for SSR.
 */
export function initResumability() {
    globalState = {
        handlers: new Map(),
        state: new Map(),
        nextId: 0,
    };
    return globalState;
}
/**
 * Get current resumability context.
 */
export function getResumableState() {
    return globalState;
}
/**
 * Generate a unique element ID.
 */
export function generateElementId() {
    if (!globalState)
        throw new Error("Resumability not initialized");
    return `q${globalState.nextId++}`;
}
/**
 * Serialize a function reference for resumability.
 */
export function serializeHandler(fn, module, exportName, closure) {
    return {
        module,
        export: exportName,
        ...(closure !== undefined && { closure }),
    };
}
/**
 * Register a handler for an element during SSR.
 */
export function registerHandler(elementId, eventName, handler) {
    if (!globalState)
        return;
    if (!globalState.handlers.has(elementId)) {
        globalState.handlers.set(elementId, new Map());
    }
    globalState.handlers.get(elementId).set(eventName, handler);
}
/**
 * Register state for an element during SSR.
 */
export function registerState(elementId, state) {
    if (!globalState)
        return;
    globalState.state.set(elementId, state);
}
/**
 * Serialize resumable state to JSON for embedding in HTML.
 */
export function serializeResumableState() {
    if (!globalState)
        return "{}";
    const serialized = {
        handlers: Object.fromEntries(Array.from(globalState.handlers.entries()).map(([id, events]) => [
            id,
            Object.fromEntries(events.entries()),
        ])),
        state: Object.fromEntries(globalState.state.entries()),
    };
    return JSON.stringify(serialized);
}
/**
 * Client-side: Resume interactivity from serialized state.
 */
export function resume() {
    // Get serialized state from script tag
    const stateElement = document.getElementById("__PHIL_RESUMABLE__");
    if (!stateElement) {
        console.warn("No resumable state found");
        return;
    }
    let resumableData;
    try {
        resumableData = JSON.parse(stateElement.textContent || "{}");
    }
    catch (e) {
        console.error("Failed to parse resumable state:", e);
        return;
    }
    // Module loaders cache
    const moduleCache = new Map();
    // Function to load a module
    async function loadModule(modulePath) {
        if (!moduleCache.has(modulePath)) {
            // In production, this would use dynamic import()
            // For now, modules need to be registered
            const promise = import(modulePath);
            moduleCache.set(modulePath, promise);
        }
        return moduleCache.get(modulePath);
    }
    // Attach global click handler for event delegation
    document.addEventListener("click", async (event) => {
        const target = event.target;
        // Find element with handler
        let element = target;
        let elementId = null;
        while (element && element !== document.body) {
            elementId = element.getAttribute("data-qid");
            if (elementId && resumableData.handlers[elementId]?.click) {
                break;
            }
            element = element.parentElement;
        }
        if (!element || !elementId)
            return;
        // Get handler info
        const handlerInfo = resumableData.handlers[elementId].click;
        if (!handlerInfo)
            return;
        try {
            // Load module containing the handler
            const module = await loadModule(handlerInfo.module);
            const handler = module[handlerInfo.export];
            if (typeof handler !== "function") {
                console.error(`Handler ${handlerInfo.export} is not a function`);
                return;
            }
            // Get element state if any
            const state = resumableData.state[elementId];
            // Create context with closure and state
            const context = {
                ...handlerInfo.closure,
                state,
                element,
            };
            // Call handler with event and context
            handler.call(element, event, context);
        }
        catch (error) {
            console.error("Failed to resume handler:", error);
        }
    });
    // Similarly for other events (focus, blur, input, etc.)
    ["focus", "blur", "input", "change", "submit"].forEach((eventType) => {
        document.addEventListener(eventType, async (event) => {
            // Similar logic as click handler
            // ... (omitted for brevity, same pattern)
        });
    });
}
/**
 * Make a component resumable by wrapping its event handlers.
 */
export function resumable(Component, options) {
    return (props) => {
        const vnode = Component(props);
        // During SSR, wrap event handlers
        if (typeof window === "undefined" && globalState) {
            // Transform vnode to add resumability
            return transformVNodeForResumability(vnode, options);
        }
        return vnode;
    };
}
/**
 * Transform a VNode tree to add resumability attributes.
 */
function transformVNodeForResumability(vnode, options) {
    if (!vnode || typeof vnode !== "object" || !("type" in vnode)) {
        return vnode;
    }
    const transformed = { ...vnode };
    const { props } = transformed;
    // Check for event handlers
    const hasHandlers = Object.keys(props).some((key) => key.startsWith("on") && typeof props[key] === "function");
    if (hasHandlers) {
        // Generate ID for this element
        const elementId = generateElementId();
        transformed.props = {
            ...props,
            "data-qid": elementId,
        };
        // Register handlers
        Object.keys(props).forEach((key) => {
            if (key.startsWith("on") && typeof props[key] === "function") {
                const eventName = key.slice(2).toLowerCase();
                const handlerName = options.handlers?.[key] || key;
                registerHandler(elementId, eventName, {
                    module: options.module,
                    export: handlerName,
                });
                // Remove handler from props (won't be rendered)
                delete transformed.props[key];
            }
        });
    }
    // Recursively transform children
    if (props.children) {
        transformed.props.children = Array.isArray(props.children)
            ? props.children.map((child) => transformVNodeForResumability(child, options))
            : transformVNodeForResumability(props.children, options);
    }
    return transformed;
}
//# sourceMappingURL=resumability.js.map