/**
 * Selective hydration runtime for interactive islands.
 * Only hydrates components that need interactivity.
 */
import { isJSXElement, Fragment } from "@philjs/core";
// Global island registry
const registry = {
    components: new Map(),
    hydrated: new Set(),
};
/**
 * Register a component for island hydration.
 */
export function registerIsland(name, component) {
    registry.components.set(name, component);
}
/**
 * Hydrate a specific island by ID.
 */
export function hydrateIsland(islandId) {
    if (registry.hydrated.has(islandId)) {
        console.warn(`Island ${islandId} already hydrated`);
        return;
    }
    const element = document.querySelector(`[data-island="${islandId}"]`);
    if (!element) {
        console.warn(`Island element ${islandId} not found`);
        return;
    }
    const componentName = element.getAttribute("data-component");
    if (!componentName) {
        console.warn(`Island ${islandId} missing component name`);
        return;
    }
    const component = registry.components.get(componentName);
    if (!component) {
        console.warn(`Component ${componentName} not registered`);
        return;
    }
    // Deserialize props
    const propsAttr = element.getAttribute("data-props");
    const props = propsAttr ? JSON.parse(propsAttr) : {};
    try {
        // Hydrate the island
        hydrateElement(element, component, props);
        registry.hydrated.add(islandId);
    }
    catch (error) {
        console.error(`Failed to hydrate island ${islandId}:`, error);
    }
}
/**
 * Hydrate all islands on the page.
 */
export function hydrateAllIslands() {
    const islands = document.querySelectorAll("[data-island]");
    islands.forEach((element) => {
        const islandId = element.getAttribute("data-island");
        if (!islandId) {
            return;
        }
        if (registry.hydrated.has(islandId)) {
            console.warn(`Island ${islandId} already hydrated`);
            return;
        }
        hydrateIsland(islandId);
    });
}
/**
 * Hydrate an island with Intersection Observer (lazy hydration).
 */
export function hydrateIslandOnVisible(islandId, options) {
    if (registry.hydrated.has(islandId)) {
        return;
    }
    const element = document.querySelector(`[data-island="${islandId}"]`);
    if (!element) {
        console.warn(`Island element ${islandId} not found`);
        return;
    }
    const Observer = globalThis.IntersectionObserver;
    if (typeof Observer !== "function") {
        console.warn("IntersectionObserver is not available");
        return;
    }
    const observerOptions = options || { rootMargin: "50px" };
    let observer;
    const callback = (entries) => {
        entries.forEach((entry) => {
            if (entry.isIntersecting) {
                hydrateIsland(islandId);
                observer.disconnect();
            }
        });
    };
    if (Observer.prototype && "observe" in Observer.prototype) {
        observer = new Observer(callback, observerOptions);
    }
    else {
        observer = Observer(callback, observerOptions);
    }
    observer.observe(element);
}
/**
 * Hydrate an island on interaction (idle hydration).
 */
export function hydrateIslandOnInteraction(islandId, events = ["mouseenter", "touchstart", "focus"]) {
    if (registry.hydrated.has(islandId)) {
        return;
    }
    const element = document.querySelector(`[data-island="${islandId}"]`);
    if (!element) {
        console.warn(`Island element ${islandId} not found`);
        return;
    }
    const hydrate = () => {
        hydrateIsland(islandId);
        // Remove listeners after hydration
        events.forEach((event) => {
            element.removeEventListener(event, hydrate);
        });
    };
    events.forEach((event) => {
        element.addEventListener(event, hydrate, { once: true, passive: true });
    });
}
/**
 * Hydrate an island when browser is idle.
 */
export function hydrateIslandOnIdle(islandId, timeout = 2000) {
    if (registry.hydrated.has(islandId)) {
        return;
    }
    if ("requestIdleCallback" in window) {
        requestIdleCallback(() => {
            hydrateIsland(islandId);
        }, { timeout });
    }
    else {
        setTimeout(() => {
            hydrateIsland(islandId);
        }, timeout);
    }
}
/**
 * Hydration strategies enum.
 */
export var HydrationStrategy;
(function (HydrationStrategy) {
    /** Hydrate immediately */
    HydrationStrategy["EAGER"] = "eager";
    /** Hydrate when visible */
    HydrationStrategy["VISIBLE"] = "visible";
    /** Hydrate on interaction */
    HydrationStrategy["INTERACTION"] = "interaction";
    /** Hydrate when idle */
    HydrationStrategy["IDLE"] = "idle";
})(HydrationStrategy || (HydrationStrategy = {}));
/**
 * Auto-hydrate islands based on strategy.
 */
export function autoHydrateIslands(strategy = HydrationStrategy.VISIBLE) {
    const islands = document.querySelectorAll("[data-island]");
    islands.forEach((element) => {
        const islandId = element.getAttribute("data-island");
        if (!islandId || registry.hydrated.has(islandId)) {
            return;
        }
        switch (strategy) {
            case HydrationStrategy.EAGER:
                hydrateIsland(islandId);
                break;
            case HydrationStrategy.VISIBLE:
                hydrateIslandOnVisible(islandId);
                break;
            case HydrationStrategy.INTERACTION:
                hydrateIslandOnInteraction(islandId);
                break;
            case HydrationStrategy.IDLE:
                hydrateIslandOnIdle(islandId);
                break;
        }
    });
}
/**
 * Hydrate a single element (internal).
 */
function hydrateElement(element, component, props) {
    const ctx = {
        currentNode: element.firstChild,
        parentElement: element,
    };
    // Render component
    const vnode = component(props);
    // Hydrate the rendered output
    hydrateNode(vnode, ctx);
}
/**
 * Hydrate a VNode tree.
 */
function hydrateNode(vnode, ctx) {
    if (vnode == null || vnode === false || vnode === true) {
        return;
    }
    // Text nodes and numbers
    if (typeof vnode === "string" || typeof vnode === "number") {
        if (ctx.currentNode) {
            ctx.currentNode = ctx.currentNode.nextSibling;
        }
        return;
    }
    // Arrays
    if (Array.isArray(vnode)) {
        vnode.forEach((child) => hydrateNode(child, ctx));
        return;
    }
    if (!isJSXElement(vnode)) {
        return;
    }
    const { type, props } = vnode;
    // Handle Fragment
    if (type === Fragment) {
        hydrateNode(props['children'], ctx);
        return;
    }
    // Handle function components
    if (typeof type === "function") {
        const result = type(props);
        hydrateNode(result, ctx);
        return;
    }
    // Handle HTML elements
    if (typeof type === "string") {
        const elementNode = skipWhitespaceNodes(ctx.currentNode);
        ctx.currentNode = elementNode;
        const element = elementNode;
        if (!element || element.nodeName.toLowerCase() !== type.toLowerCase()) {
            console.warn(`Hydration mismatch: expected ${type}, got ${element?.nodeName}`);
            return;
        }
        // Attach event handlers and reactive properties
        attachEventHandlers(element, props);
        // Hydrate children
        if (props['children']) {
            const childCtx = {
                currentNode: element.firstChild,
                parentElement: element,
            };
            hydrateNode(props['children'], childCtx);
        }
        // Move to next sibling
        ctx.currentNode = element.nextSibling;
    }
}
/**
 * Attach event handlers and reactive properties.
 */
function attachEventHandlers(element, props) {
    for (const [key, value] of Object.entries(props)) {
        if (key === "children")
            continue;
        // Event handlers
        if (key.startsWith("on") && typeof value === "function") {
            const eventName = key.slice(2).toLowerCase();
            element.addEventListener(eventName, value);
        }
        // Reactive style
        else if (key === "style" && typeof value === "function") {
            const update = () => {
                const styleValue = value();
                if (typeof styleValue === "object") {
                    Object.assign(element.style, styleValue);
                }
                else if (typeof styleValue === "string") {
                    element.setAttribute("style", styleValue);
                }
            };
            update();
            if (typeof value.subscribe === "function") {
                value.subscribe(update);
            }
        }
        // Reactive class
        else if ((key === "class" || key === "className") && typeof value === "function") {
            const update = () => {
                const className = value();
                element.className = className || "";
            };
            update();
            if (typeof value.subscribe === "function") {
                value.subscribe(update);
            }
        }
        // Other reactive attributes
        else if (typeof value === "function") {
            const update = () => {
                const attrValue = value();
                if (attrValue == null || attrValue === false) {
                    element.removeAttribute(key);
                }
                else if (attrValue === true) {
                    element.setAttribute(key, "");
                }
                else {
                    element.setAttribute(key, String(attrValue));
                }
            };
            update();
            if (typeof value.subscribe === "function") {
                value.subscribe(update);
            }
        }
    }
}
/**
 * Preload island component (for critical islands).
 */
export function preloadIsland(componentName) {
    // This would integrate with your bundler's code-splitting
    // to preload the component module
    console.log(`Preloading island: ${componentName}`);
}
/**
 * Get island hydration status.
 */
export function getIslandStatus(islandId) {
    const element = document.querySelector(`[data-island="${islandId}"]`);
    return {
        exists: !!element,
        hydrated: registry.hydrated.has(islandId),
    };
}
/**
 * Clear all hydrated islands (for testing).
 */
export function clearIslands() {
    registry.components.clear();
    registry.hydrated.clear();
}
function skipWhitespaceNodes(node) {
    let current = node;
    while (current &&
        current.nodeType === Node.TEXT_NODE &&
        current.textContent?.trim() === "") {
        current = current.nextSibling;
    }
    return current;
}
//# sourceMappingURL=hydrate-island.js.map