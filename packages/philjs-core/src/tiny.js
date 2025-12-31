/**
 * PhilJS Tiny Core - Under 5KB gzipped
 *
 * Minimal reactive runtime with:
 * - Fine-grained signals
 * - Computed values
 * - Effects
 * - Basic JSX support
 *
 * This is the smallest possible PhilJS bundle for
 * size-constrained environments.
 *
 * @packageDocumentation
 */
// =============================================================================
// Reactive Core
// =============================================================================
let tracking = null;
let batching = 0;
let pending = new Set();
/**
 * Create a reactive signal
 */
export function signal(value) {
    const subs = new Set();
    const read = (() => {
        tracking?.add(subs);
        return value;
    });
    read.set = (v) => {
        const next = typeof v === 'function' ? v(value) : v;
        if (next !== value) {
            value = next;
            if (batching) {
                subs.forEach(s => pending.add(s));
            }
            else {
                subs.forEach(s => s());
            }
        }
    };
    return read;
}
/**
 * Create a computed value
 */
export function computed(fn) {
    let value;
    let dirty = true;
    const subs = new Set();
    let deps = [];
    const invalidate = () => {
        if (!dirty) {
            dirty = true;
            subs.forEach(s => s());
        }
    };
    return () => {
        tracking?.add(subs);
        if (dirty) {
            deps.forEach(d => d.delete(invalidate));
            deps = [];
            const prev = tracking;
            tracking = new Set();
            value = fn();
            deps = Array.from(tracking);
            deps.forEach(d => d.add(invalidate));
            tracking = prev;
            dirty = false;
        }
        return value;
    };
}
/**
 * Create an effect
 */
export function effect(fn) {
    let cleanup;
    let deps = [];
    const run = () => {
        if (typeof cleanup === 'function')
            cleanup();
        deps.forEach(d => d.delete(run));
        deps = [];
        const prev = tracking;
        tracking = new Set();
        cleanup = fn();
        deps = Array.from(tracking);
        deps.forEach(d => d.add(run));
        tracking = prev;
    };
    run();
    return () => {
        if (typeof cleanup === 'function')
            cleanup();
        deps.forEach(d => d.delete(run));
    };
}
/**
 * Batch multiple updates
 */
export function batch(fn) {
    batching++;
    try {
        return fn();
    }
    finally {
        if (--batching === 0) {
            const p = pending;
            pending = new Set();
            p.forEach(s => s());
        }
    }
}
/**
 * Run without tracking
 */
export function untrack(fn) {
    const prev = tracking;
    tracking = null;
    try {
        return fn();
    }
    finally {
        tracking = prev;
    }
}
/**
 * Create a JSX element
 */
export function h(type, props, ...children) {
    return { type, props: props ?? {}, children: children.flat(Infinity) };
}
/**
 * Fragment
 */
export const Fragment = ({ children }) => children;
// JSX runtime exports
export const jsx = h;
export const jsxs = h;
export const jsxDEV = h;
/**
 * Render a TinyElement to a DOM node
 */
export function render(element, container) {
    const cleanups = [];
    const mount = (el, parent) => {
        if (el == null || el === false)
            return null;
        if (typeof el === 'string' || typeof el === 'number') {
            const text = document.createTextNode(String(el));
            parent.appendChild(text);
            return text;
        }
        if (typeof el.type === 'function') {
            const result = el.type({ ...el.props, children: el.children });
            if (Array.isArray(result)) {
                const frag = document.createDocumentFragment();
                result.forEach(r => mount(r, frag));
                parent.appendChild(frag);
                return frag;
            }
            return mount(result, parent);
        }
        const node = document.createElement(el.type);
        // Apply props
        for (const [key, value] of Object.entries(el.props)) {
            if (key === 'ref' && typeof value === 'function') {
                value(node);
            }
            else if (key.startsWith('on') && typeof value === 'function') {
                const event = key.slice(2).toLowerCase();
                node.addEventListener(event, value);
                cleanups.push(() => node.removeEventListener(event, value));
            }
            else if (key === 'style' && typeof value === 'object') {
                Object.assign(node.style, value);
            }
            else if (key === 'className') {
                node.className = String(value);
            }
            else if (typeof value === 'function') {
                // Reactive prop
                cleanups.push(effect(() => {
                    const v = value();
                    if (key === 'className') {
                        node.className = String(v);
                    }
                    else if (key === 'style' && typeof v === 'object') {
                        Object.assign(node.style, v);
                    }
                    else if (v != null) {
                        node.setAttribute(key, String(v));
                    }
                    else {
                        node.removeAttribute(key);
                    }
                }));
            }
            else if (value != null && value !== false) {
                node.setAttribute(key, value === true ? '' : String(value));
            }
        }
        // Mount children
        for (const child of el.children) {
            if (typeof child === 'function') {
                // Reactive child
                let current = null;
                const marker = document.createComment('');
                node.appendChild(marker);
                cleanups.push(effect(() => {
                    const value = child();
                    if (current) {
                        current.parentNode?.removeChild(current);
                    }
                    if (value != null) {
                        const frag = document.createDocumentFragment();
                        mount(value, frag);
                        current = frag.firstChild;
                        marker.parentNode?.insertBefore(frag, marker);
                    }
                }));
            }
            else {
                mount(child, node);
            }
        }
        parent.appendChild(node);
        return node;
    };
    mount(element, container);
    return () => {
        cleanups.forEach(c => c());
        container.innerHTML = '';
    };
}
// =============================================================================
// Utilities
// =============================================================================
/**
 * Reactive show/hide
 */
export function Show(props) {
    return h('', {}, () => {
        const value = props.when();
        if (value) {
            return typeof props.children === 'function'
                ? props.children(value)
                : props.children;
        }
        return props.fallback || null;
    });
}
/**
 * Reactive list rendering
 */
export function For(props) {
    return h('', {}, () => {
        const items = props.each();
        if (items.length === 0)
            return props.fallback || null;
        return items.map((item, i) => props.children(item, () => i));
    });
}
/**
 * Create a store (object with reactive properties)
 */
export function store(initial) {
    const signals = new Map();
    return new Proxy(initial, {
        get(target, prop) {
            let s = signals.get(prop);
            if (!s) {
                s = signal(target[prop]);
                signals.set(prop, s);
            }
            return s();
        },
        set(target, prop, value) {
            let s = signals.get(prop);
            if (!s) {
                s = signal(value);
                signals.set(prop, s);
            }
            else {
                s.set(value);
            }
            target[prop] = value;
            return true;
        },
    });
}
// =============================================================================
// Export all as default for easy destructuring
// =============================================================================
export default {
    signal,
    computed,
    effect,
    batch,
    untrack,
    h,
    jsx,
    jsxs,
    jsxDEV,
    Fragment,
    render,
    Show,
    For,
    store,
};
//# sourceMappingURL=tiny.js.map