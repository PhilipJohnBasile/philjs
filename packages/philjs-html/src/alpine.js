/**
 * PhilJS Alpine Compatibility
 *
 * Full Alpine.js-compatible directive system using PhilJS signals.
 */
import { signal, effect, batch, memo } from '@philjs/core';
import { directive, initDirectives, processElement } from './directives.js';
// ============================================================================
// Alpine-specific Directives
// ============================================================================
/**
 * x-transition - CSS transitions for show/hide
 */
directive('transition', (el, expression, context) => {
    // Parse transition classes
    const classes = {
        enter: el.getAttribute('x-transition:enter') || 'transition ease-out duration-300',
        enterStart: el.getAttribute('x-transition:enter-start') || 'opacity-0',
        enterEnd: el.getAttribute('x-transition:enter-end') || 'opacity-100',
        leave: el.getAttribute('x-transition:leave') || 'transition ease-in duration-200',
        leaveStart: el.getAttribute('x-transition:leave-start') || 'opacity-100',
        leaveEnd: el.getAttribute('x-transition:leave-end') || 'opacity-0',
    };
    const applyTransition = (entering) => {
        if (entering) {
            el.classList.add(...classes.enter.split(' '), ...classes.enterStart.split(' '));
            requestAnimationFrame(() => {
                el.classList.remove(...classes.enterStart.split(' '));
                el.classList.add(...classes.enterEnd.split(' '));
            });
        }
        else {
            el.classList.add(...classes.leave.split(' '), ...classes.leaveStart.split(' '));
            requestAnimationFrame(() => {
                el.classList.remove(...classes.leaveStart.split(' '));
                el.classList.add(...classes.leaveEnd.split(' '));
            });
        }
    };
    // Listen for visibility changes
    const observer = new MutationObserver((mutations) => {
        for (const mutation of mutations) {
            if (mutation.attributeName === 'style') {
                const visible = el.style.display !== 'none';
                applyTransition(visible);
            }
        }
    });
    observer.observe(el, { attributes: true, attributeFilter: ['style'] });
    return () => observer.disconnect();
});
/**
 * x-effect - Run side effects
 */
directive('effect', (el, expression, context) => {
    return effect(() => {
        try {
            const fn = new Function(...Object.keys(context.data), expression);
            const values = Object.values(context.data).map((s) => typeof s === 'function' ? s() : s);
            fn(...values);
        }
        catch (e) {
            console.error('x-effect error:', e);
        }
    });
});
/**
 * x-ignore - Skip processing
 */
directive('ignore', () => {
    // Handled specially - prevents processing of children
});
/**
 * x-teleport - Move element to another location
 */
directive('teleport', (el, expression) => {
    const target = document.querySelector(expression);
    if (target) {
        const clone = el.cloneNode(true);
        clone.removeAttribute('x-teleport');
        target.appendChild(clone);
        el.remove();
    }
});
/**
 * Create an Alpine-compatible context
 */
export function createAlpineContext(el, data) {
    const reactiveData = {};
    // Make data reactive
    for (const [key, value] of Object.entries(data)) {
        reactiveData[key] = signal(value);
    }
    const refs = {};
    return {
        data: reactiveData,
        $el: el,
        $refs: refs,
        $dispatch: (event, detail) => {
            el.dispatchEvent(new CustomEvent(event, {
                detail,
                bubbles: true,
                composed: true,
            }));
        },
        $nextTick: async (callback) => {
            await new Promise(resolve => requestAnimationFrame(resolve));
            callback();
        },
        $watch: (getter, callback) => {
            let oldValue = getter();
            return effect(() => {
                const newValue = getter();
                if (newValue !== oldValue) {
                    callback(newValue, oldValue);
                    oldValue = newValue;
                }
            });
        },
        $store: (name) => {
            return stores.get(name);
        },
    };
}
// ============================================================================
// Global Store
// ============================================================================
const stores = new Map();
/**
 * Define a global store
 */
export function store(name, initialValue) {
    const reactiveStore = {};
    for (const [key, value] of Object.entries(initialValue)) {
        if (typeof value === 'function') {
            // Methods
            reactiveStore[key] = value.bind(reactiveStore);
        }
        else {
            // Data
            const sig = signal(value);
            Object.defineProperty(reactiveStore, key, {
                get: () => sig(),
                set: (v) => sig.set(v),
            });
        }
    }
    stores.set(name, reactiveStore);
    return reactiveStore;
}
/**
 * Get a global store
 */
export function getStore(name) {
    return stores.get(name);
}
// ============================================================================
// Alpine.data() - Reusable Components
// ============================================================================
const componentDefs = new Map();
/**
 * Define a reusable component
 */
export function data(name, factory) {
    componentDefs.set(name, factory);
}
/**
 * Get a component definition
 */
export function getData(name) {
    return componentDefs.get(name);
}
// ============================================================================
// Alpine.bind() - Reusable Attribute Sets
// ============================================================================
const bindDefs = new Map();
/**
 * Define reusable attribute bindings
 */
export function bind(name, bindings) {
    bindDefs.set(name, bindings);
}
/**
 * x-bind with named definition
 */
directive('bind', (el, expression, context) => {
    // Check if it's a named binding
    if (bindDefs.has(expression)) {
        const bindings = bindDefs.get(expression);
        for (const [attr, value] of Object.entries(bindings)) {
            if (typeof value === 'function') {
                effect(() => {
                    const result = value(context);
                    el.setAttribute(attr, String(result));
                });
            }
            else {
                el.setAttribute(attr, String(value));
            }
        }
        return;
    }
    // Regular x-bind behavior handled in directives.ts
});
// ============================================================================
// Initialize
// ============================================================================
/**
 * Initialize Alpine.js compatibility
 */
export function initAlpine(root = document.body) {
    // Process x-data elements with component lookup
    const dataElements = root.querySelectorAll('[x-data]');
    for (const el of Array.from(dataElements)) {
        if (el instanceof HTMLElement) {
            const dataExpr = el.getAttribute('x-data') || '{}';
            // Check if it's a named component
            const componentMatch = dataExpr.match(/^(\w+)(?:\(([^)]*)\))?$/);
            let data;
            if (componentMatch && componentMatch[1] && componentDefs.has(componentMatch[1])) {
                const factory = componentDefs.get(componentMatch[1]);
                data = factory();
            }
            else {
                try {
                    const fn = new Function(`return (${dataExpr})`);
                    data = fn();
                }
                catch (e) {
                    console.error('x-data parse error:', e);
                    data = {};
                }
            }
            const context = createAlpineContext(el, data);
            processElement(el, context);
        }
    }
}
// ============================================================================
// Export Alpine-compatible API
// ============================================================================
export const Alpine = {
    data,
    store,
    bind,
    start: initAlpine,
    directive,
};
export default Alpine;
//# sourceMappingURL=alpine.js.map