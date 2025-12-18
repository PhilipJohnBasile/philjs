/**
 * PhilJS Testing - Render Utilities
 */
import { queries } from './queries';
import { debug } from './debug';
const mountedContainers = new Set();
/**
 * Render a PhilJS component into a container for testing
 */
export function render(ui, options = {}) {
    const { container: customContainer, baseElement = document.body, wrapper: Wrapper, hydrate = false, } = options;
    // Create container
    const container = customContainer || document.createElement('div');
    if (!customContainer) {
        baseElement.appendChild(container);
    }
    mountedContainers.add(container);
    // Wrap if wrapper provided
    const componentToRender = Wrapper
        ? Wrapper({ children: ui })
        : ui;
    // Render the component using PhilJS
    let unmountFn;
    try {
        // Import PhilJS render dynamically to avoid hard dependency
        const philjs = globalThis.__PHILJS__ || require('philjs-core');
        if (hydrate && philjs.hydrate) {
            philjs.hydrate(componentToRender, container);
        }
        else if (philjs.render) {
            unmountFn = philjs.render(componentToRender, container);
        }
        else {
            // Fallback: try to render JSX directly
            renderToContainer(componentToRender, container);
        }
    }
    catch (error) {
        // If PhilJS is not available, use basic rendering
        renderToContainer(componentToRender, container);
    }
    // Bind queries to container
    const boundQueries = bindQueries(container);
    return {
        ...boundQueries,
        container,
        baseElement,
        debug: (el = baseElement) => debug(el),
        rerender: (newUI) => {
            const toRender = Wrapper ? Wrapper({ children: newUI }) : newUI;
            renderToContainer(toRender, container);
        },
        unmount: () => {
            if (unmountFn) {
                unmountFn();
            }
            container.innerHTML = '';
            mountedContainers.delete(container);
        },
        asFragment: () => {
            const fragment = document.createDocumentFragment();
            Array.from(container.childNodes).forEach(node => {
                fragment.appendChild(node.cloneNode(true));
            });
            return fragment;
        },
    };
}
/**
 * Cleanup all rendered containers
 */
export function cleanup() {
    mountedContainers.forEach(container => {
        container.innerHTML = '';
        if (container.parentNode) {
            container.parentNode.removeChild(container);
        }
    });
    mountedContainers.clear();
}
/**
 * Basic render to container (fallback)
 */
function renderToContainer(element, container) {
    // Handle JSX elements
    if (typeof element === 'object' && element !== null) {
        if (element.type && element.props) {
            // JSX element
            const { type, props } = element;
            if (typeof type === 'function') {
                // Component
                const result = type(props);
                renderToContainer(result, container);
            }
            else if (typeof type === 'string') {
                // HTML element
                const el = document.createElement(type);
                // Apply props
                for (const [key, value] of Object.entries(props || {})) {
                    if (key === 'children') {
                        const children = Array.isArray(value) ? value : [value];
                        children.forEach((child) => {
                            if (child != null) {
                                renderToContainer(child, el);
                            }
                        });
                    }
                    else if (key === 'className') {
                        el.className = String(value);
                    }
                    else if (key.startsWith('on') && typeof value === 'function') {
                        const eventName = key.slice(2).toLowerCase();
                        el.addEventListener(eventName, value);
                    }
                    else if (key === 'style' && typeof value === 'object') {
                        Object.assign(el.style, value);
                    }
                    else if (key === 'ref' && typeof value === 'function') {
                        value(el);
                    }
                    else {
                        el.setAttribute(key, String(value));
                    }
                }
                container.appendChild(el);
            }
        }
        else if (Array.isArray(element)) {
            element.forEach(child => renderToContainer(child, container));
        }
    }
    else if (typeof element === 'string' || typeof element === 'number') {
        container.appendChild(document.createTextNode(String(element)));
    }
}
/**
 * Bind query functions to a container
 */
function bindQueries(container) {
    const bound = {};
    for (const [name, fn] of Object.entries(queries)) {
        bound[name] = (...args) => fn(container, ...args);
    }
    return bound;
}
// Auto-cleanup after each test if vitest/jest is detected
if (typeof afterEach !== 'undefined') {
    afterEach(() => {
        cleanup();
    });
}
//# sourceMappingURL=render.js.map