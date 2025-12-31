/**
 * PhilJS HTMX Compatibility
 *
 * Provides HTMX-style attributes for server-driven UI updates.
 *
 * SECURITY NOTE: This module trusts server responses and renders them as HTML.
 * Ensure your server endpoints:
 * 1. Return properly escaped/sanitized HTML
 * 2. Are protected against XSS injection
 * 3. Validate and sanitize all user input before including in responses
 *
 * The hx-vals attribute evaluates JavaScript expressions - never use with
 * untrusted input. Only use these attributes in trusted HTML templates.
 *
 * @example
 * ```html
 * <button hx-get="/api/users" hx-target="#users-list">
 *   Load Users
 * </button>
 *
 * <form hx-post="/api/submit" hx-swap="outerHTML">
 *   <input name="email" />
 *   <button>Submit</button>
 * </form>
 * ```
 */
import { signal, effect } from 'philjs-core';
// ============================================================================
// Configuration
// ============================================================================
const config = {
    defaultSwap: 'innerHTML',
    timeout: 10000,
    withCredentials: false,
    headers: {
        'HX-Request': 'true',
    },
    historyEnabled: true,
    indicatorClass: 'htmx-indicator',
    disableOnRequest: true,
};
/**
 * Configure HTMX behavior
 */
export function configure(options) {
    Object.assign(config, options);
}
// ============================================================================
// Core Functions
// ============================================================================
/**
 * Process an element for HTMX attributes
 */
export function process(el) {
    // HTTP methods
    const methods = ['get', 'post', 'put', 'patch', 'delete'];
    for (const method of methods) {
        const url = el.getAttribute(`hx-${method}`);
        if (url) {
            setupRequest(el, method.toUpperCase(), url);
        }
    }
    // Special attributes
    if (el.hasAttribute('hx-boost')) {
        boostElement(el);
    }
    if (el.hasAttribute('hx-push-url')) {
        // URL will be pushed after successful request
    }
    // Process children
    for (const child of Array.from(el.children)) {
        if (child instanceof HTMLElement) {
            process(child);
        }
    }
}
/**
 * Set up a request trigger on an element
 */
function setupRequest(el, method, url) {
    const trigger = parseTrigger(el.getAttribute('hx-trigger') || getDefaultTrigger(el));
    const handler = async (e) => {
        // Check trigger conditions
        if (!shouldTrigger(trigger, e, el))
            return;
        // Prevent default for forms and links
        if (el.tagName === 'FORM' || el.tagName === 'A') {
            e.preventDefault();
        }
        await makeRequest(el, method, url);
    };
    el.addEventListener(trigger.event, handler);
}
/**
 * Make an HTMX request
 */
async function makeRequest(el, method, url) {
    const target = getTarget(el);
    const swap = (el.getAttribute('hx-swap') || config.defaultSwap);
    const values = getValues(el);
    const headers = getHeaders(el);
    // Show loading state
    const indicator = getIndicator(el);
    indicator?.classList.add(config.indicatorClass);
    if (config.disableOnRequest && el instanceof HTMLButtonElement) {
        el.disabled = true;
    }
    // Dispatch before event
    const beforeEvent = new CustomEvent('htmx:beforeRequest', {
        detail: { el, method, url, target, values },
        bubbles: true,
        cancelable: true,
    });
    if (!el.dispatchEvent(beforeEvent))
        return;
    try {
        // Build request
        let requestUrl = url;
        const options = {
            method,
            headers: { ...config.headers, ...headers },
            credentials: config.withCredentials ? 'include' : 'same-origin',
        };
        if (method === 'GET') {
            const params = new URLSearchParams(values);
            requestUrl = `${url}${url.includes('?') ? '&' : '?'}${params}`;
        }
        else {
            options.body = new URLSearchParams(values);
            options.headers = {
                ...options.headers,
                'Content-Type': 'application/x-www-form-urlencoded',
            };
        }
        // Make request
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), config.timeout);
        options.signal = controller.signal;
        const response = await fetch(requestUrl, options);
        clearTimeout(timeoutId);
        const html = await response.text();
        // Handle response headers
        handleResponseHeaders(response.headers, el);
        // Swap content
        if (target && swap !== 'none') {
            swapContent(target, html, swap);
        }
        // Push URL if configured
        if (el.hasAttribute('hx-push-url') && config.historyEnabled) {
            const pushUrl = el.getAttribute('hx-push-url') || requestUrl;
            history.pushState({}, '', pushUrl);
        }
        // Dispatch after event
        el.dispatchEvent(new CustomEvent('htmx:afterRequest', {
            detail: { el, response, html },
            bubbles: true,
        }));
    }
    catch (error) {
        el.dispatchEvent(new CustomEvent('htmx:error', {
            detail: { el, error },
            bubbles: true,
        }));
    }
    finally {
        // Remove loading state
        indicator?.classList.remove(config.indicatorClass);
        if (config.disableOnRequest && el instanceof HTMLButtonElement) {
            el.disabled = false;
        }
    }
}
function parseTrigger(triggerStr) {
    const parts = triggerStr.split(' ');
    const event = parts[0]?.split('[')[0] ?? '';
    const modifiers = parts.slice(1);
    const filterMatch = triggerStr.match(/\[(.+)\]/);
    const filter = filterMatch?.[1];
    return {
        event,
        modifiers,
        ...(filter !== undefined && { filter }),
    };
}
function getDefaultTrigger(el) {
    if (el.tagName === 'FORM')
        return 'submit';
    if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.tagName === 'SELECT') {
        return 'change';
    }
    return 'click';
}
function shouldTrigger(trigger, e, el) {
    // Check filter
    if (trigger.filter) {
        try {
            const fn = new Function('event', `return (${trigger.filter})`);
            if (!fn(e))
                return false;
        }
        catch {
            return false;
        }
    }
    // Check modifiers
    if (trigger.modifiers.includes('once')) {
        el.removeAttribute('hx-trigger');
    }
    return true;
}
function getTarget(el) {
    const targetSelector = el.getAttribute('hx-target');
    if (!targetSelector)
        return el;
    if (targetSelector === 'this')
        return el;
    if (targetSelector === 'closest') {
        return el.parentElement;
    }
    if (targetSelector.startsWith('closest ')) {
        return el.closest(targetSelector.slice(8));
    }
    return document.querySelector(targetSelector);
}
function getValues(el) {
    const values = {};
    // Form values
    if (el.tagName === 'FORM') {
        const formData = new FormData(el);
        for (const [key, value] of formData.entries()) {
            values[key] = String(value);
        }
    }
    // hx-vals attribute
    const valsAttr = el.getAttribute('hx-vals');
    if (valsAttr) {
        try {
            const vals = JSON.parse(valsAttr);
            Object.assign(values, vals);
        }
        catch {
            // Try as JS expression
            try {
                const fn = new Function(`return (${valsAttr})`);
                Object.assign(values, fn());
            }
            catch { }
        }
    }
    // hx-include
    const includeSelector = el.getAttribute('hx-include');
    if (includeSelector) {
        const includeEl = document.querySelector(includeSelector);
        if (includeEl instanceof HTMLInputElement) {
            values[includeEl.name] = includeEl.value;
        }
    }
    return values;
}
function getHeaders(el) {
    const headers = {};
    const headersAttr = el.getAttribute('hx-headers');
    if (headersAttr) {
        try {
            Object.assign(headers, JSON.parse(headersAttr));
        }
        catch { }
    }
    return headers;
}
function getIndicator(el) {
    const indicatorSelector = el.getAttribute('hx-indicator');
    if (indicatorSelector) {
        return document.querySelector(indicatorSelector);
    }
    return el.querySelector(`.${config.indicatorClass}`);
}
function handleResponseHeaders(headers, el) {
    // HX-Redirect
    const redirect = headers.get('HX-Redirect');
    if (redirect) {
        window.location.href = redirect;
        return;
    }
    // HX-Refresh
    if (headers.get('HX-Refresh') === 'true') {
        window.location.reload();
        return;
    }
    // HX-Trigger
    const trigger = headers.get('HX-Trigger');
    if (trigger) {
        try {
            const events = JSON.parse(trigger);
            for (const [event, detail] of Object.entries(events)) {
                el.dispatchEvent(new CustomEvent(event, { detail, bubbles: true }));
            }
        }
        catch {
            el.dispatchEvent(new CustomEvent(trigger, { bubbles: true }));
        }
    }
}
function swapContent(target, html, strategy) {
    // Parse HTML
    const template = document.createElement('template');
    template.innerHTML = html.trim();
    const content = template.content;
    switch (strategy) {
        case 'innerHTML':
            target.innerHTML = '';
            target.appendChild(content);
            break;
        case 'outerHTML':
            target.replaceWith(content);
            break;
        case 'beforebegin':
            target.before(content);
            break;
        case 'afterbegin':
            target.prepend(content);
            break;
        case 'beforeend':
            target.append(content);
            break;
        case 'afterend':
            target.after(content);
            break;
        case 'delete':
            target.remove();
            break;
        case 'none':
            // Do nothing
            break;
    }
    // Process new content for HTMX attributes
    for (const child of Array.from(target.children)) {
        if (child instanceof HTMLElement) {
            process(child);
        }
    }
}
/**
 * Boost links and forms for AJAX
 */
function boostElement(el) {
    // Boost links
    if (el.tagName === 'A') {
        const href = el.getAttribute('href');
        if (href && !href.startsWith('#') && !href.startsWith('http')) {
            el.setAttribute('hx-get', href);
            el.setAttribute('hx-push-url', 'true');
            if (!el.hasAttribute('hx-target')) {
                el.setAttribute('hx-target', 'body');
            }
        }
    }
    // Boost forms
    if (el.tagName === 'FORM') {
        const action = el.getAttribute('action') || '';
        const method = (el.getAttribute('method') || 'GET').toUpperCase();
        el.setAttribute(`hx-${method.toLowerCase()}`, action);
        if (!el.hasAttribute('hx-target')) {
            el.setAttribute('hx-target', 'body');
        }
    }
    // Boost child links and forms
    for (const link of Array.from(el.querySelectorAll('a, form'))) {
        if (link instanceof HTMLElement && !link.hasAttribute('hx-boost')) {
            boostElement(link);
        }
    }
}
/**
 * Initialize HTMX on the document
 */
export function initHtmx(root = document.body) {
    process(root);
    // Handle dynamic content
    const observer = new MutationObserver((mutations) => {
        for (const mutation of mutations) {
            for (const node of Array.from(mutation.addedNodes)) {
                if (node instanceof HTMLElement) {
                    process(node);
                }
            }
        }
    });
    observer.observe(root, { childList: true, subtree: true });
}
// Export for use
export { process as processHtmx };
//# sourceMappingURL=htmx.js.map