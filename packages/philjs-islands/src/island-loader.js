/**
 * Island component loader with automatic code splitting.
 */
const hydrate = (vnode, container) => {
    // Placeholder - actual implementation in philjs-core
    console.log("Hydrating island", container);
};
/**
 * Registry of island loaders.
 */
const islandLoaders = new Map();
/**
 * Register an island component loader.
 */
export function registerIsland(name, loader) {
    islandLoaders.set(name, loader);
}
/**
 * Load and hydrate an island component.
 */
export async function loadIsland(element, manifest) {
    const islandName = element.getAttribute("island");
    if (!islandName)
        return;
    const config = manifest[islandName];
    if (!config) {
        console.warn(`Island "${islandName}" not found in manifest`);
        return;
    }
    // Get loader for this island
    const loader = islandLoaders.get(islandName);
    if (!loader) {
        console.warn(`No loader registered for island "${islandName}"`);
        return;
    }
    try {
        // Load the component module
        const module = await loader();
        const Component = module.default;
        if (!Component) {
            console.error(`Island "${islandName}" has no default export`);
            return;
        }
        // Extract props from data attributes
        const props = extractPropsFromElement(element, config.props);
        // Create component instance
        const vnode = Component(props);
        // Hydrate the existing DOM
        hydrate(vnode, element);
        // Mark as hydrated
        element.setAttribute("data-hydrated", "true");
        // Dispatch event
        element.dispatchEvent(new CustomEvent("phil:island-loaded", {
            bubbles: true,
            detail: { name: islandName, element },
        }));
    }
    catch (error) {
        console.error(`Failed to load island "${islandName}":`, error);
        element.setAttribute("data-hydration-error", "true");
    }
}
/**
 * Extract props from element's data attributes.
 */
function extractPropsFromElement(element, defaultProps) {
    const props = { ...defaultProps };
    // Get props from data-props attribute (JSON)
    const propsAttr = element.getAttribute("data-props");
    if (propsAttr) {
        try {
            Object.assign(props, JSON.parse(propsAttr));
        }
        catch (e) {
            console.warn("Failed to parse data-props:", e);
        }
    }
    // Get individual data-prop-* attributes
    for (const attr of element.attributes) {
        if (attr.name.startsWith("data-prop-")) {
            const propName = attr.name.slice(10).replace(/-([a-z])/g, (_, c) => c.toUpperCase());
            props[propName] = parseValue(attr.value);
        }
    }
    return props;
}
/**
 * Parse a string value to its proper type.
 */
function parseValue(value) {
    if (value === "true")
        return true;
    if (value === "false")
        return false;
    if (value === "null")
        return null;
    if (value === "undefined")
        return undefined;
    if (/^-?\d+$/.test(value))
        return parseInt(value, 10);
    if (/^-?\d+\.\d+$/.test(value))
        return parseFloat(value);
    if (value.startsWith("{") || value.startsWith("[")) {
        try {
            return JSON.parse(value);
        }
        catch {
            return value;
        }
    }
    return value;
}
/**
 * Initialize islands with hydration strategies.
 */
export function initIslands(manifest) {
    const islands = document.querySelectorAll("[island]");
    islands.forEach((element) => {
        const islandName = element.getAttribute("island");
        if (!islandName)
            return;
        const config = manifest[islandName];
        if (!config)
            return;
        const trigger = config.trigger || "visible";
        switch (trigger) {
            case "immediate":
                loadIsland(element, manifest);
                break;
            case "idle":
                if ("requestIdleCallback" in window) {
                    requestIdleCallback(() => loadIsland(element, manifest));
                }
                else {
                    setTimeout(() => loadIsland(element, manifest), 0);
                }
                break;
            case "visible":
            default:
                if ("IntersectionObserver" in window) {
                    const observer = new IntersectionObserver((entries) => {
                        entries.forEach((entry) => {
                            if (entry.isIntersecting) {
                                loadIsland(entry.target, manifest);
                                observer.unobserve(entry.target);
                            }
                        });
                    });
                    observer.observe(element);
                }
                else {
                    // Fallback for browsers without IntersectionObserver
                    loadIsland(element, manifest);
                }
                break;
        }
    });
}
/**
 * Create an island wrapper component for SSR.
 */
export function Island(props) {
    const { name, trigger = "visible", props: componentProps, children } = props;
    // Serialize props as data attributes
    const dataAttrs = {
        island: name,
        "data-trigger": trigger,
    };
    if (componentProps) {
        dataAttrs["data-props"] = JSON.stringify(componentProps);
    }
    // Return wrapped children with island attributes
    return {
        type: "div",
        props: {
            ...dataAttrs,
            children,
        },
    };
}
//# sourceMappingURL=island-loader.js.map