// @ts-nocheck
/**
 * PhilJS LiveView - Core LiveView Implementation
 */
import { createDiffer } from './differ.js';
// ============================================================================
// LiveView Factory
// ============================================================================
/**
 * Create a new LiveView
 *
 * @example
 * ```typescript
 * const CounterView = createLiveView({
 *   mount: () => ({ count: 0 }),
 *
 *   handleEvent: (event, state) => {
 *     if (event.type === 'increment') {
 *       return { count: state.count + 1 };
 *     }
 *     return state;
 *   },
 *
 *   render: (state) => `
 *     <div>
 *       <span>Count: ${state.count}</span>
 *       <button phx-click="increment">+</button>
 *     </div>
 *   `,
 * });
 * ```
 */
export function createLiveView(definition) {
    return {
        ...definition,
        // Provide default implementations
        handleParams: definition.handleParams || ((_, __, socket) => socket.state),
        handleEvent: definition.handleEvent || ((_, state) => state),
        handleInfo: definition.handleInfo || ((_, state) => state),
        terminate: definition.terminate || (() => { }),
    };
}
/**
 * Create a LiveView instance for a connected socket
 */
export async function mountLiveView(definition, socket) {
    const differ = createDiffer();
    // Mount and get initial state
    let state = await definition.mount(socket);
    let previousHtml = '';
    let html = definition.render(state);
    previousHtml = html;
    const instance = {
        state,
        html,
        socket,
        async handleEvent(event) {
            if (definition.handleEvent) {
                state = await definition.handleEvent(event, state, socket);
                socket.assign(state);
            }
            return this.getDiff();
        },
        async handleInfo(info) {
            if (definition.handleInfo) {
                state = await definition.handleInfo(info, state, socket);
                socket.assign(state);
            }
            return this.getDiff();
        },
        async handleParams(params, uri) {
            if (definition.handleParams) {
                state = await definition.handleParams(params, uri, socket);
                socket.assign(state);
            }
            return this.getDiff();
        },
        render() {
            html = definition.render(state);
            return html;
        },
        getDiff() {
            const newHtml = this.render();
            const patches = differ.diff(previousHtml, newHtml);
            previousHtml = newHtml;
            return { patches };
        },
        terminate(reason) {
            if (definition.terminate) {
                definition.terminate(reason, state);
            }
        },
    };
    return instance;
}
// ============================================================================
// LiveView Helpers
// ============================================================================
/**
 * Create a socket implementation
 */
export function createLiveSocket(id, initialState, options) {
    const state = { ...initialState };
    const temporaryAssigns = [];
    const flashes = [];
    return {
        id,
        state,
        session: options.session || {},
        params: options.params || {},
        clientId: options.clientId,
        pushEvent(event, payload) {
            options.onPush?.(event, payload);
        },
        pushRedirect(to, opts) {
            options.onRedirect?.(to, opts?.replace || false);
        },
        pushPatch(to, opts) {
            options.onPatch?.(to, opts?.replace || false);
        },
        assign(newState) {
            Object.assign(state, newState);
        },
        putFlash(type, message) {
            flashes.push({ type, message });
        },
        getTemporaryAssigns() {
            return [...temporaryAssigns];
        },
        setTemporaryAssigns(keys) {
            temporaryAssigns.length = 0;
            temporaryAssigns.push(...keys);
        },
    };
}
// ============================================================================
// PHX Attribute Helpers
// ============================================================================
/**
 * Extract PHX attributes from HTML
 */
export function extractPhxBindings(html) {
    const bindings = new Map();
    // Match phx-* attributes
    const regex = /phx-([\w-]+)(?:\.([.\w]+))?="([^"]+)"/g;
    let match;
    while ((match = regex.exec(html)) !== null) {
        const [, type, modifiers, value] = match;
        const key = type;
        if (!bindings.has(key)) {
            bindings.set(key, []);
        }
        bindings.get(key).push({
            type,
            modifiers: modifiers ? modifiers.split('.') : [],
            value,
            raw: match[0],
        });
    }
    return bindings;
}
// ============================================================================
// Template Helpers
// ============================================================================
/**
 * HTML template tag for syntax highlighting and escaping
 */
export function html(strings, ...values) {
    return strings.reduce((result, str, i) => {
        const value = values[i - 1];
        return result + escapeHtml(String(value ?? '')) + str;
    });
}
/**
 * Raw HTML (no escaping)
 */
export function raw(value) {
    return new RawHtml(value);
}
class RawHtml {
    value;
    constructor(value) {
        this.value = value;
    }
    toString() {
        return this.value;
    }
}
/**
 * Escape HTML special characters
 */
function escapeHtml(str) {
    if (str instanceof RawHtml)
        return str.value;
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}
/**
 * Conditionally render content
 */
export function when(condition, content) {
    return condition ? content : '';
}
/**
 * Render a list with a template
 */
export function each(items, keyFn, template) {
    return items
        .map((item, i) => {
        const key = keyFn(item, i);
        const content = template(item, i);
        // Inject phx-key for efficient updates
        return content.replace(/^(<\w+)/, `$1 phx-key="${key}"`);
    })
        .join('');
}
// ============================================================================
// Form Helpers
// ============================================================================
/**
 * Generate form input with phx bindings
 */
export function input(name, options = {}) {
    const { type = 'text', value = '', phxChange = true, phxBlur = false, phxDebounce, class: className, ...rest } = options;
    const attrs = [
        `type="${type}"`,
        `name="${name}"`,
        `id="${name}"`,
    ];
    if (value !== undefined && value !== '') {
        attrs.push(`value="${escapeHtml(String(value))}"`);
    }
    if (className) {
        attrs.push(`class="${className}"`);
    }
    if (phxChange) {
        attrs.push(`phx-change="validate"`);
    }
    if (phxBlur) {
        attrs.push(`phx-blur="validate"`);
    }
    if (phxDebounce !== undefined) {
        attrs.push(`phx-debounce="${phxDebounce}"`);
    }
    for (const [key, val] of Object.entries(rest)) {
        if (val === true) {
            attrs.push(key);
        }
        else if (val !== false && val !== undefined) {
            attrs.push(`${key}="${escapeHtml(String(val))}"`);
        }
    }
    return `<input ${attrs.join(' ')} />`;
}
/**
 * Render validation errors for a field
 */
export function errorTag(errors, field) {
    const fieldErrors = errors[field];
    if (!fieldErrors || fieldErrors.length === 0)
        return '';
    return `<div class="error">${fieldErrors.map(e => escapeHtml(e)).join(', ')}</div>`;
}
//# sourceMappingURL=live-view.js.map