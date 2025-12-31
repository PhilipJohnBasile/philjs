/**
 * Component metadata extraction for inspector
 */
let componentIdCounter = 0;
const componentRegistry = new Map();
const signalRegistry = new WeakMap();
/**
 * Extract component information from DOM element
 */
export function extractComponentInfo(element) {
    // Check if already registered
    const existing = componentRegistry.get(element);
    if (existing) {
        return existing;
    }
    const id = `component-${componentIdCounter++}`;
    const name = getComponentName(element);
    const props = extractProps(element);
    const signals = extractSignals(element);
    const isIsland = element.hasAttribute('island');
    const isHydrated = element.hasAttribute('data-hydrated');
    const path = getComponentPath(element);
    const source = extractSourceLocation(element);
    const info = {
        id,
        name,
        element,
        props,
        signals,
        isIsland,
        isHydrated,
        renderCount: 0,
        renderTime: 0,
        updateCount: 0,
        path,
        ...(source !== undefined && { source }),
    };
    componentRegistry.set(element, info);
    return info;
}
/**
 * Get component by ID
 */
export function getComponentById(id) {
    for (const info of componentRegistry.values()) {
        if (info.id === id) {
            return info;
        }
    }
    return undefined;
}
/**
 * Get component by element
 */
export function getComponentByElement(element) {
    return componentRegistry.get(element);
}
/**
 * Update component metrics
 */
export function updateComponentMetrics(element, renderTime) {
    const info = componentRegistry.get(element);
    if (info) {
        info.renderCount++;
        info.renderTime = renderTime;
        info.updateCount++;
    }
}
/**
 * Get all registered components
 */
export function getAllComponents() {
    return Array.from(componentRegistry.values());
}
/**
 * Search components by name
 */
export function searchComponents(query) {
    const lowerQuery = query.toLowerCase();
    return Array.from(componentRegistry.values()).filter((info) => info.name.toLowerCase().includes(lowerQuery));
}
/**
 * Clear component registry
 */
export function clearComponentRegistry() {
    componentRegistry.clear();
    componentIdCounter = 0;
}
/**
 * Get component name from element
 */
function getComponentName(element) {
    // Try to get component name from data attribute
    const dataName = element.getAttribute('data-component-name');
    if (dataName)
        return dataName;
    // Try to get from custom element name
    if (element.tagName.includes('-')) {
        return element.tagName.toLowerCase();
    }
    // Try to get from island attribute
    if (element.hasAttribute('island')) {
        const islandName = element.getAttribute('island');
        if (islandName)
            return islandName;
    }
    // Fallback to tag name
    return element.tagName.toLowerCase();
}
/**
 * Extract props from element attributes
 */
function extractProps(element) {
    const props = {};
    // Extract all attributes
    Array.from(element.attributes).forEach((attr) => {
        // Skip internal attributes
        if (attr.name.startsWith('data-philjs-') ||
            attr.name === 'island' ||
            attr.name === 'data-hydrated') {
            return;
        }
        // Try to parse JSON values
        try {
            props[attr.name] = JSON.parse(attr.value);
        }
        catch {
            props[attr.name] = attr.value;
        }
    });
    // Try to extract props from data attributes
    const propsData = element.getAttribute('data-props');
    if (propsData) {
        try {
            Object.assign(props, JSON.parse(propsData));
        }
        catch {
            // Ignore parse errors
        }
    }
    return props;
}
/**
 * Extract signals used by component
 */
function extractSignals(element) {
    const signals = [];
    // Try to get signals from data attribute
    const signalsData = element.getAttribute('data-signals');
    if (signalsData) {
        try {
            const signalNames = JSON.parse(signalsData);
            signalNames.forEach((name) => {
                signals.push({
                    name,
                    value: undefined,
                    type: 'signal',
                });
            });
        }
        catch {
            // Ignore parse errors
        }
    }
    // Try to extract from global signal tracker
    if (typeof window !== 'undefined' && window.__PHILJS_SIGNALS__) {
        const globalSignals = window.__PHILJS_SIGNALS__;
        // This would need integration with the signal system
    }
    return signals;
}
/**
 * Get component path (ancestry)
 */
function getComponentPath(element) {
    const path = [];
    let current = element;
    while (current && current !== document.body) {
        const name = getComponentName(current);
        path.unshift(name);
        current = current.parentElement;
    }
    return path;
}
/**
 * Extract source location from element
 */
function extractSourceLocation(element) {
    // Try to get from data attribute
    const sourceData = element.getAttribute('data-source');
    if (sourceData) {
        try {
            return JSON.parse(sourceData);
        }
        catch {
            // Ignore parse errors
        }
    }
    // Try to parse from comment nodes (added by compiler)
    const comments = getElementComments(element);
    for (const comment of comments) {
        const match = comment.textContent?.match(/source:(.+):(\d+):(\d+)/);
        if (match && match[1] && match[2] && match[3]) {
            return {
                file: match[1],
                line: parseInt(match[2], 10),
                column: parseInt(match[3], 10),
            };
        }
    }
    return undefined;
}
/**
 * Get comment nodes near element
 */
function getElementComments(element) {
    const comments = [];
    const walker = document.createTreeWalker(element, NodeFilter.SHOW_COMMENT, null);
    let node;
    while ((node = walker.nextNode())) {
        if (node.nodeType === Node.COMMENT_NODE) {
            comments.push(node);
        }
    }
    return comments;
}
/**
 * Register signal for tracking
 */
export function registerSignal(signal, name, type) {
    signalRegistry.set(signal, { name, value: undefined, type });
}
/**
 * Get signal info
 */
export function getSignalInfo(signal) {
    return signalRegistry.get(signal);
}
/**
 * Format prop value for display
 */
export function formatPropValue(value) {
    if (value === null)
        return 'null';
    if (value === undefined)
        return 'undefined';
    if (typeof value === 'string')
        return `"${value}"`;
    if (typeof value === 'number' || typeof value === 'boolean') {
        return String(value);
    }
    if (typeof value === 'function')
        return '[Function]';
    if (Array.isArray(value)) {
        if (value.length === 0)
            return '[]';
        if (value.length > 3)
            return `[Array(${value.length})]`;
        return `[${value.map(formatPropValue).join(', ')}]`;
    }
    if (typeof value === 'object') {
        const keys = Object.keys(value);
        if (keys.length === 0)
            return '{}';
        if (keys.length > 3)
            return `{Object(${keys.length})}`;
        return `{${keys.slice(0, 3).join(', ')}...}`;
    }
    return String(value);
}
/**
 * Get component ancestors
 */
export function getComponentAncestors(element) {
    const ancestors = [];
    let current = element.parentElement;
    while (current && current !== document.body) {
        const info = componentRegistry.get(current);
        if (info) {
            ancestors.unshift(info);
        }
        current = current.parentElement;
    }
    return ancestors;
}
/**
 * Get component children
 */
export function getComponentChildren(element) {
    const children = [];
    Array.from(element.children).forEach((child) => {
        const info = componentRegistry.get(child);
        if (info) {
            children.push(info);
        }
    });
    return children;
}
//# sourceMappingURL=component-info.js.map