/**
 * HTML Directives - Alpine.js-style reactive attributes
 *
 * SECURITY NOTE: This module evaluates expressions from HTML attributes using
 * new Function() for Alpine.js-style reactivity. This is intentional and follows
 * the Alpine.js security model.
 *
 * IMPORTANT SECURITY CONSIDERATIONS:
 * 1. NEVER render user-controlled content in x-data, x-on, or other expression attributes
 * 2. The x-html directive is intentionally unsafe (like v-html in Vue) - sanitize content first
 * 3. Only use these directives with trusted HTML templates, not user-generated content
 * 4. For user content, use x-text which safely escapes HTML
 *
 * If you're building an application that renders untrusted HTML, use a CSP policy
 * that blocks 'unsafe-eval' and avoid using this module entirely.
 */
import { signal, effect, batch } from 'philjs-core';
// Registry of custom directives
const directives = new Map();
/**
 * Register a custom directive
 */
export function directive(name, handler) {
    directives.set(name, handler);
}
/**
 * Get a registered directive
 */
export function getDirective(name) {
    return directives.get(name);
}
// ============================================================================
// Built-in Directives
// ============================================================================
/**
 * x-data - Initialize reactive data scope
 */
directive('data', (el, expression, context) => {
    try {
        // Parse the expression as an object
        const fn = new Function(`return (${expression})`);
        const data = fn();
        // Make data reactive
        for (const [key, value] of Object.entries(data)) {
            context.data[key] = signal(value);
        }
    }
    catch (e) {
        console.error('x-data error:', e);
    }
});
/**
 * x-text - Set text content reactively
 */
directive('text', (el, expression, context) => {
    return effect(() => {
        const value = evaluateExpression(expression, context);
        el.textContent = String(value ?? '');
    });
});
/**
 * x-html - Set innerHTML reactively
 *
 * WARNING: This directive is intentionally unsafe and will render raw HTML.
 * Only use with trusted content. For user-generated content, sanitize first:
 *
 * @example
 * import { sanitizeHtml } from 'philjs-core/security';
 * // In your data: sanitizedContent: sanitizeHtml(userContent)
 * // In HTML: <div x-html="sanitizedContent"></div>
 */
directive('html', (el, expression, context) => {
    return effect(() => {
        const value = evaluateExpression(expression, context);
        // Note: This intentionally sets innerHTML for trusted content
        // Sanitize user content before passing to x-html
        el.innerHTML = String(value ?? '');
    });
});
/**
 * x-show - Toggle visibility
 */
directive('show', (el, expression, context) => {
    const originalDisplay = el.style.display;
    return effect(() => {
        const value = evaluateExpression(expression, context);
        el.style.display = value ? originalDisplay : 'none';
    });
});
/**
 * x-if - Conditional rendering
 */
directive('if', (el, expression, context) => {
    const placeholder = document.createComment('x-if');
    const template = el.cloneNode(true);
    let currentEl = null;
    el.parentNode?.insertBefore(placeholder, el);
    el.remove();
    return effect(() => {
        const value = evaluateExpression(expression, context);
        if (value && !currentEl) {
            currentEl = template.cloneNode(true);
            placeholder.parentNode?.insertBefore(currentEl, placeholder.nextSibling);
            processElement(currentEl, context);
        }
        else if (!value && currentEl) {
            currentEl.remove();
            currentEl = null;
        }
    });
});
/**
 * x-for - List rendering
 */
directive('for', (el, expression, context) => {
    // Parse "item in items" or "(item, index) in items"
    const match = expression.match(/^(?:\(([^,]+),\s*([^)]+)\)|(\w+))\s+in\s+(.+)$/);
    if (!match) {
        console.error('Invalid x-for expression:', expression);
        return;
    }
    const [, itemName1, indexName, itemName2, listExpr] = match;
    const itemName = itemName1 ?? itemName2;
    if (!itemName || !listExpr) {
        console.error('Invalid x-for expression:', expression);
        return;
    }
    const placeholder = document.createComment('x-for');
    const template = el.cloneNode(true);
    template.removeAttribute('x-for');
    el.parentNode?.insertBefore(placeholder, el);
    el.remove();
    let currentElements = [];
    return effect(() => {
        const list = evaluateExpression(listExpr, context);
        // Remove old elements
        currentElements.forEach(el => el.remove());
        currentElements = [];
        if (!Array.isArray(list))
            return;
        // Create new elements
        list.forEach((item, index) => {
            const clone = template.cloneNode(true);
            const itemContext = {
                ...context,
                data: {
                    ...context.data,
                    [itemName]: signal(item),
                    ...(indexName ? { [indexName]: signal(index) } : {}),
                },
            };
            placeholder.parentNode?.insertBefore(clone, placeholder);
            currentElements.push(clone);
            processElement(clone, itemContext);
        });
    });
});
/**
 * x-bind - Bind attributes reactively
 */
directive('bind', (el, expression, context) => {
    // x-bind:class="..." or :class="..."
    const parts = expression.includes('=')
        ? expression.split('=').map(s => s.trim())
        : [expression, expression];
    const attr = parts[0];
    const expr = parts[1];
    return effect(() => {
        const value = evaluateExpression(expr, context);
        if (attr === 'class') {
            if (typeof value === 'object') {
                for (const [className, enabled] of Object.entries(value)) {
                    el.classList.toggle(className, Boolean(enabled));
                }
            }
            else {
                el.className = String(value);
            }
        }
        else if (attr === 'style') {
            if (typeof value === 'object') {
                Object.assign(el.style, value);
            }
            else {
                el.setAttribute('style', String(value));
            }
        }
        else if (value === false || value === null || value === undefined) {
            el.removeAttribute(attr);
        }
        else if (value === true) {
            el.setAttribute(attr, '');
        }
        else {
            el.setAttribute(attr, String(value));
        }
    });
});
/**
 * x-on - Event handling
 */
directive('on', (el, expression, context) => {
    // x-on:click="handler" or @click="handler"
    const splitParts = expression.split('=').map(s => s.trim());
    const event = splitParts[0];
    const handler = splitParts[1];
    const modifiers = event.split('.').slice(1);
    const eventName = event.split('.')[0];
    const listener = (e) => {
        // Handle modifiers
        if (modifiers.includes('prevent'))
            e.preventDefault();
        if (modifiers.includes('stop'))
            e.stopPropagation();
        if (modifiers.includes('self') && e.target !== el)
            return;
        // Execute handler
        const fn = new Function('$event', ...Object.keys(context.data), `${handler}`);
        const dataValues = Object.values(context.data).map((s) => typeof s === 'function' ? s() : s);
        fn(e, ...dataValues);
    };
    const options = {
        once: modifiers.includes('once'),
        capture: modifiers.includes('capture'),
        passive: modifiers.includes('passive'),
    };
    el.addEventListener(eventName, listener, options);
    return () => el.removeEventListener(eventName, listener, options);
});
/**
 * x-model - Two-way data binding
 */
directive('model', (el, expression, context) => {
    const input = el;
    const sig = context.data[expression];
    if (!sig) {
        console.error(`x-model: "${expression}" not found in data`);
        return;
    }
    // Set initial value
    const cleanup = effect(() => {
        const value = typeof sig === 'function' ? sig() : sig;
        if (input.type === 'checkbox') {
            input.checked = Boolean(value);
        }
        else if (input.type === 'radio') {
            input.checked = input.value === value;
        }
        else {
            input.value = String(value ?? '');
        }
    });
    // Listen for changes
    const handler = () => {
        if (input.type === 'checkbox') {
            sig.set?.(input.checked);
        }
        else if (input.type === 'radio') {
            if (input.checked)
                sig.set?.(input.value);
        }
        else {
            sig.set?.(input.value);
        }
    };
    input.addEventListener('input', handler);
    return () => {
        cleanup?.();
        input.removeEventListener('input', handler);
    };
});
/**
 * x-ref - Element reference
 */
directive('ref', (el, expression, context) => {
    context.$refs[expression] = el;
});
/**
 * x-init - Run initialization code
 */
directive('init', (el, expression, context) => {
    try {
        evaluateExpression(expression, context);
    }
    catch (e) {
        console.error('x-init error:', e);
    }
});
/**
 * x-cloak - Hide until processed
 */
directive('cloak', (el) => {
    el.removeAttribute('x-cloak');
});
// ============================================================================
// Utilities
// ============================================================================
/**
 * Evaluate an expression in the given context
 */
function evaluateExpression(expression, context) {
    try {
        const fn = new Function(...Object.keys(context.data), '$el', '$refs', '$dispatch', `return (${expression})`);
        const dataValues = Object.values(context.data).map((s) => typeof s === 'function' ? s() : s);
        return fn(...dataValues, context.$el, context.$refs, context.$dispatch);
    }
    catch (e) {
        console.error('Expression error:', expression, e);
        return undefined;
    }
}
/**
 * Process an element and its children for directives
 */
export function processElement(el, context) {
    const cleanups = [];
    // Process attributes
    for (const attr of Array.from(el.attributes)) {
        let directiveName = null;
        let expression = attr.value;
        if (attr.name.startsWith('x-')) {
            directiveName = attr.name.slice(2);
        }
        else if (attr.name.startsWith('@')) {
            directiveName = 'on';
            expression = `${attr.name.slice(1)}=${attr.value}`;
        }
        else if (attr.name.startsWith(':')) {
            directiveName = 'bind';
            expression = `${attr.name.slice(1)}=${attr.value}`;
        }
        if (directiveName) {
            const handler = getDirective(directiveName.split(':')[0]);
            if (handler) {
                const cleanup = handler(el, expression, context);
                if (cleanup)
                    cleanups.push(cleanup);
            }
        }
    }
    // Process children
    for (const child of Array.from(el.children)) {
        if (child instanceof HTMLElement) {
            processElement(child, context);
        }
    }
}
/**
 * Initialize HTML directives on the document
 */
export function initDirectives(root = document.body) {
    // Find all x-data elements
    const dataElements = root.querySelectorAll('[x-data]');
    for (const el of Array.from(dataElements)) {
        if (el instanceof HTMLElement) {
            const context = {
                data: {},
                $el: el,
                $refs: {},
                $dispatch: (event, detail) => {
                    el.dispatchEvent(new CustomEvent(event, { detail, bubbles: true }));
                },
            };
            // Process x-data first
            const dataExpr = el.getAttribute('x-data') || '{}';
            const dataHandler = getDirective('data');
            if (dataHandler) {
                dataHandler(el, dataExpr, context);
            }
            // Then process the rest
            processElement(el, context);
        }
    }
}
//# sourceMappingURL=directives.js.map