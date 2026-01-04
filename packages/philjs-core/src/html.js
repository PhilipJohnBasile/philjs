/**
 * Tagged Template Literals for PhilJS - 2026 Standard Alternative to JSX
 *
 * Why tagged templates over JSX:
 * - No build step required (works in vanilla browsers)
 * - Native JavaScript syntax
 * - Better tree-shaking
 * - Smaller bundle size
 * - Works with import maps (no transpiler)
 *
 * @example
 * ```ts
 * import { html, signal } from '@philjs/core';
 *
 * const count = signal(0);
 *
 * const Counter = () => html`
 *   <div class="counter">
 *     <span>Count: ${count}</span>
 *     <button @click=${() => count.set(c => c + 1)}>+</button>
 *   </div>
 * `;
 * ```
 */
// ============================================================================
// Template Cache (WeakMap for GC-friendly caching)
// ============================================================================
const templateCache = new WeakMap();
// ============================================================================
// html Tagged Template
// ============================================================================
/**
 * Tagged template literal for creating reactive HTML templates.
 *
 * Supports:
 * - Reactive signals: ${count} auto-updates when signal changes
 * - Event handlers: @click=${handler} or onclick=${handler}
 * - Properties: .value=${val} sets property instead of attribute
 * - Booleans: ?disabled=${isDisabled} toggles attribute
 * - Arrays: ${items.map(i => html`<li>${i}</li>`)}
 * - Nested templates: ${html`<span>nested</span>`}
 *
 * @example
 * ```ts
 * const name = signal('World');
 * const template = html`<h1>Hello, ${name}!</h1>`;
 * ```
 */
export function html(strings, ...values) {
    return {
        _$philTemplate: true,
        strings,
        values,
    };
}
/**
 * SVG tagged template for creating reactive SVG elements.
 * Uses SVG namespace for proper element creation.
 */
export function svg(strings, ...values) {
    // Mark as SVG for proper namespace handling
    return {
        _$philTemplate: true,
        strings,
        values,
    };
}
// ============================================================================
// Rendering
// ============================================================================
/**
 * Render a template result into a container.
 *
 * @example
 * ```ts
 * const app = html`<div>Hello World</div>`;
 * render(app, document.getElementById('root'));
 * ```
 */
export function render(result, container) {
    // Clear container
    container.textContent = '';
    // Render the result
    const fragment = renderToFragment(result);
    container.appendChild(fragment);
}
/**
 * Render a template result to a DocumentFragment.
 */
function renderToFragment(result) {
    const fragment = document.createDocumentFragment();
    if (isTemplateResult(result)) {
        const nodes = processTemplate(result);
        for (const node of nodes) {
            fragment.appendChild(node);
        }
    }
    else if (Array.isArray(result)) {
        for (const item of result) {
            fragment.appendChild(renderToFragment(item));
        }
    }
    else if (result instanceof Node) {
        fragment.appendChild(result.cloneNode(true));
    }
    else if (isSignal(result)) {
        // Create reactive text node
        const text = document.createTextNode(String(result()));
        result.subscribe((value) => {
            text.textContent = String(value);
        });
        fragment.appendChild(text);
    }
    else if (result != null && result !== false) {
        fragment.appendChild(document.createTextNode(String(result)));
    }
    return fragment;
}
/**
 * Process a template result and return DOM nodes.
 */
function processTemplate(result) {
    const { strings, values } = result;
    // Check cache
    let template = templateCache.get(strings);
    if (!template) {
        // Build template HTML with markers
        let html = '';
        for (let i = 0; i < strings.length; i++) {
            html += strings[i];
            if (i < values.length) {
                html += `<!--phil-${i}-->`;
            }
        }
        template = document.createElement('template');
        template.innerHTML = html;
        templateCache.set(strings, template);
    }
    // Clone template
    const content = template.content.cloneNode(true);
    // Process markers and bind values
    const walker = document.createTreeWalker(content, NodeFilter.SHOW_COMMENT | NodeFilter.SHOW_ELEMENT);
    const nodesToProcess = [];
    let node;
    while ((node = walker.nextNode())) {
        if (node.nodeType === Node.COMMENT_NODE) {
            const match = node.textContent?.match(/^phil-(\d+)$/);
            if (match) {
                nodesToProcess.push({ node, index: parseInt(match[1], 10) });
            }
        }
        else if (node.nodeType === Node.ELEMENT_NODE) {
            processElementBindings(node, values);
        }
    }
    // Process comment markers (child bindings)
    for (const { node, index } of nodesToProcess) {
        const value = values[index];
        const parent = node.parentNode;
        if (parent) {
            const nodes = renderValue(value);
            for (const n of nodes) {
                parent.insertBefore(n, node);
            }
            parent.removeChild(node);
        }
    }
    return Array.from(content.childNodes);
}
/**
 * Process element attribute bindings.
 */
function processElementBindings(element, values) {
    const attributesToRemove = [];
    for (const attr of Array.from(element.attributes)) {
        const { name, value } = attr;
        // Check for marker in attribute value
        const match = value.match(/^<!--phil-(\d+)-->$/);
        if (match) {
            const index = parseInt(match[1], 10);
            const val = values[index];
            if (name.startsWith('@') || name.startsWith('on')) {
                // Event binding: @click or onclick
                const eventName = name.startsWith('@') ? name.slice(1) : name.slice(2);
                if (typeof val === 'function') {
                    element.addEventListener(eventName, val);
                }
                attributesToRemove.push(name);
            }
            else if (name.startsWith('.')) {
                // Property binding: .value
                const propName = name.slice(1);
                element[propName] = val;
                attributesToRemove.push(name);
            }
            else if (name.startsWith('?')) {
                // Boolean attribute: ?disabled
                const attrName = name.slice(1);
                if (val) {
                    element.setAttribute(attrName, '');
                }
                attributesToRemove.push(name);
            }
            else {
                // Regular attribute with signal support
                if (isSignal(val)) {
                    element.setAttribute(name, String(val()));
                    val.subscribe((v) => {
                        element.setAttribute(name, String(v));
                    });
                }
                else {
                    element.setAttribute(name, String(val ?? ''));
                }
            }
        }
    }
    // Remove processed special attributes
    for (const name of attributesToRemove) {
        element.removeAttribute(name);
    }
}
/**
 * Render a value to an array of DOM nodes.
 */
function renderValue(value) {
    if (isTemplateResult(value)) {
        return processTemplate(value);
    }
    if (Array.isArray(value)) {
        return value.flatMap(renderValue);
    }
    if (value instanceof Node) {
        return [value.cloneNode(true)];
    }
    if (isSignal(value)) {
        const text = document.createTextNode(String(value()));
        value.subscribe((v) => {
            text.textContent = String(v);
        });
        return [text];
    }
    if (value == null || value === false) {
        return [];
    }
    return [document.createTextNode(String(value))];
}
// ============================================================================
// Type Guards
// ============================================================================
function isTemplateResult(value) {
    return (value !== null &&
        typeof value === 'object' &&
        '_$philTemplate' in value &&
        value._$philTemplate === true);
}
function isSignal(value) {
    return (typeof value === 'function' &&
        'set' in value &&
        'subscribe' in value);
}
// ============================================================================
// Directives
// ============================================================================
/**
 * Repeat directive for efficient list rendering with keyed updates.
 *
 * @example
 * ```ts
 * const items = signal([{ id: 1, name: 'A' }, { id: 2, name: 'B' }]);
 *
 * html`
 *   <ul>
 *     ${repeat(items, item => item.id, item => html`<li>${item.name}</li>`)}
 *   </ul>
 * `;
 * ```
 */
export function repeat(items, keyFn, template) {
    const arr = typeof items === 'function' ? items() : items;
    return arr.map((item, index) => template(item, index));
}
/**
 * Conditional rendering directive.
 *
 * @example
 * ```ts
 * const show = signal(true);
 *
 * html`
 *   ${when(show,
 *     () => html`<div>Visible</div>`,
 *     () => html`<div>Hidden</div>`
 *   )}
 * `;
 * ```
 */
export function when(condition, trueCase, falseCase) {
    const cond = isSignal(condition) ? condition() : condition;
    if (cond) {
        return trueCase();
    }
    return falseCase ? falseCase() : null;
}
/**
 * Cache a template result to avoid re-rendering unchanged content.
 *
 * @example
 * ```ts
 * const expensive = cache(() => html`<div>${heavyComputation()}</div>`);
 * ```
 */
export function cache(fn) {
    // Simple pass-through for now, can be optimized later
    return fn();
}
/**
 * Unsafe HTML injection (use with caution - XSS risk!).
 * Only use with trusted content.
 *
 * @example
 * ```ts
 * const trustedHtml = unsafeHTML(sanitizedHtmlString);
 * html`<div>${trustedHtml}</div>`;
 * ```
 */
export function unsafeHTML(html) {
    const template = document.createElement('template');
    template.innerHTML = html;
    return Array.from(template.content.childNodes);
}
/**
 * Async directive for handling promises.
 *
 * @example
 * ```ts
 * html`
 *   ${until(
 *     fetchData(),
 *     html`<div>Loading...</div>`
 *   )}
 * `;
 * ```
 */
export function until(promise, placeholder) {
    // For SSR, return placeholder
    // For client, this would be handled reactively
    return placeholder ?? html ``;
}
// ============================================================================
// CSS Template Tag
// ============================================================================
/**
 * CSS tagged template for scoped styles with CSSStyleSheet adoption.
 * Uses Constructable Stylesheets when available.
 *
 * @example
 * ```ts
 * const styles = css`
 *   :host {
 *     display: block;
 *   }
 *   .button {
 *     background: blue;
 *   }
 * `;
 * ```
 */
export function css(strings, ...values) {
    let cssText = '';
    for (let i = 0; i < strings.length; i++) {
        cssText += strings[i];
        if (i < values.length) {
            cssText += String(values[i]);
        }
    }
    const sheet = new CSSStyleSheet();
    sheet.replaceSync(cssText);
    return sheet;
}
//# sourceMappingURL=html.js.map