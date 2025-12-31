/**
 * PhilElement - Modern Web Component Base Class for PhilJS
 *
 * 2026 Standards:
 * - Native Decorators (Stage 3)
 * - Declarative Shadow DOM
 * - Form-Associated Custom Elements
 * - Element Internals & ARIA
 * - CSS adoptedStyleSheets
 * - Custom States (::state())
 *
 * @example
 * ```ts
 * import { PhilElement, state, property, query, css } from '@philjs/core/element';
 *
 * class MyCounter extends PhilElement {
 *   static styles = css`
 *     :host { display: block; }
 *     button { padding: 0.5rem 1rem; }
 *   `;
 *
 *   @state() accessor count = 0;
 *   @property({ type: Number }) accessor step = 1;
 *   @query('button') accessor button: HTMLButtonElement;
 *
 *   render() {
 *     return html`
 *       <span>Count: ${this.count}</span>
 *       <button @click=${() => this.count += this.step}>+</button>
 *     `;
 *   }
 * }
 *
 * customElements.define('my-counter', MyCounter);
 * ```
 */
import { signal, effect, batch } from './signals.js';
import { html, css, render } from './html.js';
// Re-export html and css for convenience
export { html, css };
// ============================================================================
// PhilElement Base Class
// ============================================================================
/**
 * Base class for PhilJS web components.
 * Provides reactive state, lifecycle hooks, and modern web component features.
 */
export class PhilElement extends HTMLElement {
    // ============================================================================
    // Static Properties
    // ============================================================================
    /**
     * Styles to adopt on the shadow root.
     * Can be a single CSSStyleSheet or array of sheets.
     */
    static styles;
    /**
     * Whether this element participates in form submission.
     */
    static formAssociated = false;
    /**
     * Element internals for form participation and ARIA.
     */
    internals;
    /**
     * Reactive signals for state management.
     */
    _signals = new Map();
    /**
     * Pending property updates for batching.
     */
    _pendingUpdate = false;
    /**
     * Effect disposers for cleanup.
     */
    _disposers = [];
    /**
     * Whether the element has been connected to the DOM.
     */
    _connected = false;
    /**
     * Custom element state (for ::state() CSS pseudo-class).
     */
    get _states() {
        return this.internals.states;
    }
    // ============================================================================
    // Lifecycle
    // ============================================================================
    constructor() {
        super();
        // Attach shadow DOM
        this.attachShadow({ mode: 'open' });
        // Get element internals
        this.internals = this.attachInternals();
        // Adopt styles
        const ctor = this.constructor;
        if (ctor.styles) {
            const styles = Array.isArray(ctor.styles) ? ctor.styles : [ctor.styles];
            this.shadowRoot.adoptedStyleSheets = styles;
        }
    }
    /**
     * Called when element is added to the DOM.
     */
    connectedCallback() {
        this._connected = true;
        this._scheduleUpdate();
        this.onConnect?.();
    }
    /**
     * Called when element is removed from the DOM.
     */
    disconnectedCallback() {
        this._connected = false;
        // Dispose all effects
        for (const dispose of this._disposers) {
            dispose();
        }
        this._disposers = [];
        this.onDisconnect?.();
    }
    /**
     * Called when an observed attribute changes.
     */
    attributeChangedCallback(name, oldValue, newValue) {
        if (oldValue !== newValue) {
            this._handleAttributeChange(name, newValue);
        }
    }
    /**
     * Called when element is moved to a new document.
     */
    adoptedCallback() {
        this.onAdopt?.();
    }
    /**
     * Schedule an update to re-render the element.
     */
    requestUpdate() {
        this._scheduleUpdate();
    }
    /**
     * Schedule a render update (batched via microtask).
     */
    _scheduleUpdate() {
        if (this._pendingUpdate || !this._connected)
            return;
        this._pendingUpdate = true;
        queueMicrotask(() => {
            this._pendingUpdate = false;
            if (!this._connected)
                return;
            this.onBeforeRender?.();
            const result = this.render();
            render(result, this.shadowRoot);
            this.onAfterRender?.();
        });
    }
    /**
     * Handle attribute changes and update corresponding properties.
     */
    _handleAttributeChange(name, value) {
        // Convert attribute to property name (kebab-case to camelCase)
        const propName = name.replace(/-([a-z])/g, (_, c) => c.toUpperCase());
        // Update signal if exists
        const sig = this._signals.get(propName);
        if (sig) {
            sig.set(value);
        }
    }
    // ============================================================================
    // State Management
    // ============================================================================
    /**
     * Create or get a reactive signal for a property.
     */
    _getSignal(name, initialValue) {
        if (!this._signals.has(name)) {
            const sig = signal(initialValue);
            // Subscribe to signal changes to trigger re-render
            const dispose = sig.subscribe(() => {
                this._scheduleUpdate();
            });
            this._disposers.push(dispose);
            this._signals.set(name, sig);
        }
        return this._signals.get(name);
    }
    /**
     * Create a reactive effect that auto-disposes on disconnect.
     */
    createEffect(fn) {
        const dispose = effect(fn);
        this._disposers.push(dispose);
    }
    // ============================================================================
    // Custom States (::state() CSS pseudo-class)
    // ============================================================================
    /**
     * Add a custom state (for ::state() CSS selector).
     *
     * @example
     * ```ts
     * this.addState('loading');
     * // CSS: my-element::state(loading) { opacity: 0.5; }
     * ```
     */
    addState(state) {
        this._states.add(state);
    }
    /**
     * Remove a custom state.
     */
    deleteState(state) {
        this._states.delete(state);
    }
    /**
     * Toggle a custom state.
     */
    toggleState(state, force) {
        if (force === undefined) {
            if (this._states.has(state)) {
                this._states.delete(state);
                return false;
            }
            else {
                this._states.add(state);
                return true;
            }
        }
        else if (force) {
            this._states.add(state);
            return true;
        }
        else {
            this._states.delete(state);
            return false;
        }
    }
    /**
     * Check if element has a custom state.
     */
    hasState(state) {
        return this._states.has(state);
    }
    // ============================================================================
    // Form Association
    // ============================================================================
    /**
     * Get the form this element is associated with.
     */
    get form() {
        return this.internals.form;
    }
    /**
     * Set the form value for submission.
     */
    setFormValue(value, state) {
        this.internals.setFormValue(value, state);
    }
    /**
     * Set custom validity message.
     */
    setValidity(flags, message, anchor) {
        this.internals.setValidity(flags ?? {}, message, anchor);
    }
    /**
     * Report validity to the form.
     */
    reportValidity() {
        return this.internals.reportValidity();
    }
    /**
     * Check element validity.
     */
    checkValidity() {
        return this.internals.checkValidity();
    }
    /**
     * Get validity state.
     */
    get validity() {
        return this.internals.validity;
    }
    /**
     * Get validation message.
     */
    get validationMessage() {
        return this.internals.validationMessage;
    }
    /**
     * Whether form will validate element.
     */
    get willValidate() {
        return this.internals.willValidate;
    }
    // ============================================================================
    // ARIA (via Element Internals)
    // ============================================================================
    /**
     * Set ARIA role via internals (doesn't pollute attributes).
     */
    setAriaRole(role) {
        this.internals.role = role;
    }
    /**
     * Set ARIA label via internals.
     */
    setAriaLabel(label) {
        this.internals.ariaLabel = label;
    }
}
// ============================================================================
// Decorators (Native Stage 3 Decorators)
// ============================================================================
/**
 * Decorator for reactive state properties.
 * Changes trigger re-renders automatically.
 *
 * @example
 * ```ts
 * class MyElement extends PhilElement {
 *   @state() accessor count = 0;
 * }
 * ```
 */
export function state() {
    return function (target, context) {
        const name = String(context.name);
        return {
            get() {
                const sig = this._getSignal(name, target.get.call(this));
                return sig();
            },
            set(value) {
                const sig = this._getSignal(name, target.get.call(this));
                sig.set(value);
            },
            init(value) {
                return value;
            },
        };
    };
}
/**
 * Decorator for observed properties (reflected to attributes).
 *
 * @example
 * ```ts
 * class MyElement extends PhilElement {
 *   @property({ type: String, reflect: true })
 *   accessor name = 'default';
 * }
 * ```
 */
export function property(options = {}) {
    return function (target, context) {
        const name = String(context.name);
        const attrName = options.attribute !== false
            ? (typeof options.attribute === 'string' ? options.attribute : toKebabCase(name))
            : null;
        return {
            get() {
                const sig = this._getSignal(name, target.get.call(this));
                return sig();
            },
            set(value) {
                const sig = this._getSignal(name, target.get.call(this));
                sig.set(value);
                // Reflect to attribute
                if (options.reflect && attrName) {
                    const attrValue = convertToAttribute(value, options);
                    if (attrValue === null) {
                        this.removeAttribute(attrName);
                    }
                    else {
                        this.setAttribute(attrName, attrValue);
                    }
                }
            },
            init(value) {
                return value;
            },
        };
    };
}
/**
 * Decorator for querying shadow DOM elements.
 *
 * @example
 * ```ts
 * class MyElement extends PhilElement {
 *   @query('button') accessor button: HTMLButtonElement;
 *   @query('.items', true) accessor items: NodeList;
 * }
 * ```
 */
export function query(selector, all = false) {
    return function (_target, context) {
        return {
            get() {
                if (all) {
                    return this.shadowRoot.querySelectorAll(selector);
                }
                return this.shadowRoot.querySelector(selector);
            },
            set() {
                // Query results are read-only
            },
            init() {
                return null;
            },
        };
    };
}
/**
 * Decorator for event listeners on shadow DOM elements.
 *
 * @example
 * ```ts
 * class MyElement extends PhilElement {
 *   @listen('click', 'button')
 *   handleClick(e: MouseEvent) {
 *     console.log('Clicked!');
 *   }
 * }
 * ```
 */
export function listen(event, selector) {
    return function (method, context) {
        context.addInitializer(function () {
            const handler = (e) => {
                if (selector) {
                    const target = e.target;
                    if (!target.matches(selector))
                        return;
                }
                method.call(this, e);
            };
            // Add listener after first render
            queueMicrotask(() => {
                if (selector) {
                    this.shadowRoot.addEventListener(event, handler);
                }
                else {
                    this.addEventListener(event, handler);
                }
            });
        });
    };
}
// ============================================================================
// Utility Functions
// ============================================================================
function toKebabCase(str) {
    return str.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`);
}
function convertToAttribute(value, options) {
    if (value == null)
        return null;
    if (options.converter?.toAttribute) {
        return options.converter.toAttribute(value, options.type);
    }
    if (options.type === Boolean) {
        return value ? '' : null;
    }
    return String(value);
}
//# sourceMappingURL=element.js.map