/**
 * PhilJS CDN Bundle
 *
 * Single-file bundle for Alpine.js-style usage.
 * No build step required - just include via CDN.
 *
 * @example
 * ```html
 * <script src="https://unpkg.com/@philjs/cdn"></script>
 * <script>
 *   const { signal, effect, html, render } = PhilJS;
 *
 *   const count = signal(0);
 *
 *   effect(() => console.log('Count:', count()));
 *
 *   render(
 *     html`<button onclick=${() => count.set(count() + 1)}>
 *       Clicked ${count} times
 *     </button>`,
 *     document.body
 *   );
 * </script>
 * ```
 *
 * @example
 * ```html
 * <!-- Using x-data style inline reactivity -->
 * <div x-data="{ count: 0 }">
 *   <button @click="count++">Clicked <span x-text="count"></span> times</button>
 * </div>
 * <script src="https://unpkg.com/@philjs/cdn"></script>
 * <script>PhilJS.init();</script>
 * ```
 */
let currentSubscriber = null;
let batchDepth = 0;
const pendingEffects = new Set();
/**
 * Create a reactive signal
 */
export function signal(initialValue) {
    let value = initialValue;
    const subscribers = new Set();
    const read = () => {
        if (currentSubscriber) {
            subscribers.add(currentSubscriber);
        }
        return value;
    };
    read.set = (newValue) => {
        const nextValue = typeof newValue === 'function'
            ? newValue(value)
            : newValue;
        if (!Object.is(value, nextValue)) {
            value = nextValue;
            notifySubscribers(subscribers);
        }
    };
    read.update = (fn) => read.set(fn(value));
    read.peek = () => value;
    return read;
}
function notifySubscribers(subscribers) {
    if (batchDepth > 0) {
        subscribers.forEach(sub => pendingEffects.add(sub));
    }
    else {
        subscribers.forEach(sub => sub());
    }
}
/**
 * Create a computed/memo value
 */
export function memo(fn) {
    let value;
    let dirty = true;
    const subscribers = new Set();
    const compute = () => {
        if (dirty) {
            const prevSubscriber = currentSubscriber;
            currentSubscriber = () => {
                dirty = true;
                notifySubscribers(subscribers);
            };
            try {
                value = fn();
            }
            finally {
                currentSubscriber = prevSubscriber;
            }
            dirty = false;
        }
        if (currentSubscriber) {
            subscribers.add(currentSubscriber);
        }
        return value;
    };
    return compute;
}
/**
 * Create a side effect
 */
export function effect(fn) {
    let cleanup;
    const execute = () => {
        if (cleanup)
            cleanup();
        const prevSubscriber = currentSubscriber;
        currentSubscriber = execute;
        try {
            cleanup = fn();
        }
        finally {
            currentSubscriber = prevSubscriber;
        }
    };
    execute();
    return () => {
        if (cleanup)
            cleanup();
    };
}
/**
 * Batch multiple updates
 */
export function batch(fn) {
    batchDepth++;
    try {
        return fn();
    }
    finally {
        batchDepth--;
        if (batchDepth === 0) {
            const effects = Array.from(pendingEffects);
            pendingEffects.clear();
            effects.forEach(effect => effect());
        }
    }
}
/**
 * Run without tracking
 */
export function untrack(fn) {
    const prev = currentSubscriber;
    currentSubscriber = null;
    try {
        return fn();
    }
    finally {
        currentSubscriber = prev;
    }
}
/**
 * Tagged template for HTML
 */
export function html(strings, ...values) {
    return { strings, values, __brand: 'template' };
}
/**
 * Render template to element
 */
export function render(result, container) {
    const target = typeof container === 'string'
        ? document.querySelector(container)
        : container;
    if (!target) {
        console.error('[PhilJS] Container not found:', container);
        return;
    }
    if (typeof result === 'string') {
        target.innerHTML = result;
        return;
    }
    effect(() => {
        const html = buildHTML(result);
        morphDOM(target, html);
    });
}
function buildHTML(result) {
    const { strings, values } = result;
    let html = '';
    for (let i = 0; i < strings.length; i++) {
        html += strings[i];
        if (i < values.length) {
            const value = values[i];
            if (typeof value === 'function') {
                // Could be a signal or event handler
                const resolved = value() ?? value;
                if (typeof resolved === 'function') {
                    // Event handler - register and use placeholder
                    const id = registerHandler(resolved);
                    html += `__handler_${id}__`;
                }
                else {
                    html += escapeHTML(String(resolved ?? ''));
                }
            }
            else if (value && typeof value === 'object' && '__brand' in value) {
                // Nested template
                html += buildHTML(value);
            }
            else if (Array.isArray(value)) {
                html += value.map(v => v && typeof v === 'object' && '__brand' in v
                    ? buildHTML(v)
                    : escapeHTML(String(v ?? ''))).join('');
            }
            else {
                html += escapeHTML(String(value ?? ''));
            }
        }
    }
    return html;
}
const handlers = new Map();
let handlerId = 0;
function registerHandler(fn) {
    const id = handlerId++;
    handlers.set(id, fn);
    return id;
}
function escapeHTML(str) {
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}
function morphDOM(target, html) {
    // Simple innerHTML replacement with event binding
    target.innerHTML = html;
    // Bind event handlers
    target.querySelectorAll('[onclick]').forEach(el => {
        const onclick = el.getAttribute('onclick');
        const match = onclick?.match(/__handler_(\d+)__/);
        if (match && match[1] !== undefined) {
            const id = parseInt(match[1], 10);
            const handler = handlers.get(id);
            if (handler) {
                el.removeAttribute('onclick');
                el.addEventListener('click', handler);
            }
        }
    });
}
const componentRegistry = new Map();
/**
 * Initialize PhilJS on the document
 */
export function init(root = document.body) {
    // Process x-data elements
    root.querySelectorAll('[x-data]').forEach(processComponent);
    // Watch for new elements
    const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            mutation.addedNodes.forEach((node) => {
                if (node instanceof Element) {
                    if (node.hasAttribute('x-data')) {
                        processComponent(node);
                    }
                    node.querySelectorAll('[x-data]').forEach(processComponent);
                }
            });
        });
    });
    observer.observe(root, { childList: true, subtree: true });
}
function processComponent(element) {
    if (componentRegistry.has(element))
        return;
    const dataExpr = element.getAttribute('x-data') || '{}';
    let data;
    try {
        // Evaluate data expression
        data = new Function(`return ${dataExpr}`)();
    }
    catch (e) {
        console.error('[PhilJS] Error evaluating x-data:', e);
        return;
    }
    // Create reactive data
    const reactiveData = makeReactive(data);
    reactiveData.$el = element;
    reactiveData.$refs = {};
    componentRegistry.set(element, reactiveData);
    // Process refs
    element.querySelectorAll('[x-ref]').forEach((el) => {
        const name = el.getAttribute('x-ref');
        if (name)
            reactiveData.$refs[name] = el;
    });
    // Process directives
    processDirectives(element, reactiveData);
}
function makeReactive(obj) {
    const signals = new Map();
    return new Proxy(obj, {
        get(target, prop) {
            if (prop.startsWith('$'))
                return target[prop];
            if (!signals.has(prop)) {
                signals.set(prop, signal(target[prop]));
            }
            return signals.get(prop)();
        },
        set(target, prop, value) {
            if (prop.startsWith('$')) {
                target[prop] = value;
                return true;
            }
            if (!signals.has(prop)) {
                signals.set(prop, signal(value));
            }
            else {
                signals.get(prop).set(value);
            }
            target[prop] = value;
            return true;
        },
    });
}
function processDirectives(root, data) {
    // x-text
    root.querySelectorAll('[x-text]').forEach((el) => {
        const expr = el.getAttribute('x-text');
        effect(() => {
            const value = evaluateExpr(expr, data);
            el.textContent = String(value ?? '');
        });
    });
    // x-html
    root.querySelectorAll('[x-html]').forEach((el) => {
        const expr = el.getAttribute('x-html');
        effect(() => {
            const value = evaluateExpr(expr, data);
            el.innerHTML = String(value ?? '');
        });
    });
    // x-show
    root.querySelectorAll('[x-show]').forEach((el) => {
        const expr = el.getAttribute('x-show');
        const htmlEl = el;
        const originalDisplay = htmlEl.style.display;
        effect(() => {
            const value = evaluateExpr(expr, data);
            htmlEl.style.display = value ? originalDisplay : 'none';
        });
    });
    // x-if (simplified - toggles element)
    root.querySelectorAll('[x-if]').forEach((el) => {
        const expr = el.getAttribute('x-if');
        const htmlEl = el;
        effect(() => {
            const value = evaluateExpr(expr, data);
            htmlEl.hidden = !value;
        });
    });
    // x-bind:* and :*
    root.querySelectorAll('*').forEach((el) => {
        Array.from(el.attributes).forEach((attr) => {
            if (attr.name.startsWith('x-bind:') || attr.name.startsWith(':')) {
                const attrName = attr.name.startsWith(':')
                    ? attr.name.slice(1)
                    : attr.name.slice(7);
                const expr = attr.value;
                effect(() => {
                    const value = evaluateExpr(expr, data);
                    if (attrName === 'class' && typeof value === 'object') {
                        Object.entries(value).forEach(([cls, enabled]) => {
                            el.classList.toggle(cls, !!enabled);
                        });
                    }
                    else if (attrName === 'style' && typeof value === 'object') {
                        Object.assign(el.style, value);
                    }
                    else if (value === false || value == null) {
                        el.removeAttribute(attrName);
                    }
                    else {
                        el.setAttribute(attrName, String(value));
                    }
                });
            }
        });
    });
    // x-on:* and @*
    root.querySelectorAll('*').forEach((el) => {
        Array.from(el.attributes).forEach((attr) => {
            if (attr.name.startsWith('x-on:') || attr.name.startsWith('@')) {
                const eventName = attr.name.startsWith('@')
                    ? attr.name.slice(1)
                    : attr.name.slice(5);
                const expr = attr.value;
                // Handle modifiers
                const parts = eventName.split('.');
                const event = parts[0];
                if (!event)
                    return;
                const modifiers = parts.slice(1);
                const hasPrevent = modifiers.includes('prevent');
                const hasStop = modifiers.includes('stop');
                const hasOnce = modifiers.includes('once');
                const hasSelf = modifiers.includes('self');
                const handler = (e) => {
                    if (hasSelf && e.target !== el)
                        return;
                    if (hasPrevent)
                        e.preventDefault();
                    if (hasStop)
                        e.stopPropagation();
                    evaluateExpr(expr, { ...data, $event: e });
                };
                el.addEventListener(event, handler, { once: hasOnce });
            }
        });
    });
    // x-model
    root.querySelectorAll('[x-model]').forEach((el) => {
        const expr = el.getAttribute('x-model');
        const input = el;
        // Initial value
        effect(() => {
            const value = evaluateExpr(expr, data);
            if (input.type === 'checkbox') {
                input.checked = !!value;
            }
            else if (input.type === 'radio') {
                input.checked = input.value === value;
            }
            else {
                input.value = String(value ?? '');
            }
        });
        // Input handler
        input.addEventListener('input', () => {
            const value = input.type === 'checkbox' ? input.checked : input.value;
            evaluateExpr(`${expr} = ${JSON.stringify(value)}`, data);
        });
    });
    // x-for
    root.querySelectorAll('template[x-for]').forEach((template) => {
        const expr = template.getAttribute('x-for');
        const match = expr.match(/(\w+)\s+in\s+(.+)/);
        if (!match || match[1] === undefined || match[2] === undefined)
            return;
        const itemName = match[1];
        const listExpr = match[2];
        const parent = template.parentElement;
        if (!parent)
            return;
        const marker = document.createComment('x-for');
        template.before(marker);
        effect(() => {
            // Remove old elements
            while (marker.nextSibling && marker.nextSibling !== template) {
                marker.nextSibling.remove();
            }
            const list = evaluateExpr(listExpr, data);
            if (!Array.isArray(list))
                return;
            list.forEach((item, index) => {
                const clone = template.content.cloneNode(true);
                const itemData = { ...data, [itemName]: item, $index: index };
                // Process directives in clone
                clone.querySelectorAll('*').forEach((el) => {
                    // Simple interpolation
                    if (el.textContent?.includes('{{')) {
                        const original = el.textContent;
                        effect(() => {
                            el.textContent = original.replace(/\{\{(.+?)\}\}/g, (_, expr) => {
                                return String(evaluateExpr(expr.trim(), itemData) ?? '');
                            });
                        });
                    }
                });
                marker.parentElement?.insertBefore(clone, template);
            });
        });
    });
    // Text interpolation {{ }}
    const walk = (node) => {
        if (node.nodeType === Node.TEXT_NODE && node.textContent?.includes('{{')) {
            const original = node.textContent;
            effect(() => {
                node.textContent = original.replace(/\{\{(.+?)\}\}/g, (_, expr) => {
                    return String(evaluateExpr(expr.trim(), data) ?? '');
                });
            });
        }
        node.childNodes.forEach(walk);
    };
    walk(root);
}
function evaluateExpr(expr, data) {
    try {
        const keys = Object.keys(data);
        const values = Object.values(data);
        return new Function(...keys, `return ${expr}`)(...values);
    }
    catch (e) {
        console.error('[PhilJS] Expression error:', expr, e);
        return undefined;
    }
}
// ============================================================================
// Utilities
// ============================================================================
/**
 * Create a store with actions
 */
export function createStore(initialState) {
    const signals = new Map();
    const subscribers = new Set();
    Object.entries(initialState).forEach(([key, value]) => {
        if (typeof value !== 'function') {
            signals.set(key, signal(value));
        }
    });
    return new Proxy(initialState, {
        get(target, prop) {
            if (prop === '$subscribe') {
                return (fn) => {
                    subscribers.add(fn);
                    return () => subscribers.delete(fn);
                };
            }
            if (typeof target[prop] === 'function') {
                return target[prop].bind(store);
            }
            return signals.get(prop)?.() ?? target[prop];
        },
        set(target, prop, value) {
            if (signals.has(prop)) {
                signals.get(prop).set(value);
                subscribers.forEach(fn => fn());
            }
            target[prop] = value;
            return true;
        },
    });
}
const store = { signal, memo, effect, batch };
/**
 * Wait for next tick
 */
export function nextTick() {
    return new Promise(resolve => queueMicrotask(resolve));
}
/**
 * Lifecycle hooks
 */
export function onMount(fn) {
    if (typeof document !== 'undefined') {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => fn());
        }
        else {
            fn();
        }
    }
}
// ============================================================================
// Global Namespace
// ============================================================================
const PhilJS = {
    // Reactivity
    signal,
    memo,
    effect,
    batch,
    untrack,
    // Templates
    html,
    render,
    // Alpine-style
    init,
    // Utilities
    createStore,
    nextTick,
    onMount,
    // Version
    version: '0.0.1',
};
// Auto-register on window
if (typeof window !== 'undefined') {
    window.PhilJS = PhilJS;
    // Auto-init if data attribute present
    if (document.querySelector('[x-data]')) {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => init());
        }
        else {
            init();
        }
    }
}
export default PhilJS;
export { PhilJS };
//# sourceMappingURL=index.js.map