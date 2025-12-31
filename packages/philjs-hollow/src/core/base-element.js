/**
 * Hollow Base Element
 * Foundation for all Hollow Web Components
 */
import { designTokensCSS } from '../styles/tokens.js';
/**
 * Property decorator for Hollow elements
 */
export function property(options = {}) {
    return function (target, propertyKey) {
        const constructor = target.constructor;
        // Initialize metadata storage
        if (!constructor._propertyMetadata) {
            constructor._propertyMetadata = new Map();
        }
        // Store metadata
        constructor._propertyMetadata.set(propertyKey, {
            attribute: options.attribute ?? toKebabCase(propertyKey),
            type: options.type ?? 'string',
            reflect: options.reflect ?? false,
            default: options.default,
        });
        // Add to observed attributes
        if (options.attribute !== false) {
            const attrName = options.attribute ?? toKebabCase(propertyKey);
            if (!constructor.observedAttributes.includes(attrName)) {
                constructor.observedAttributes = [...constructor.observedAttributes, attrName];
            }
        }
    };
}
/**
 * Convert camelCase to kebab-case
 */
function toKebabCase(str) {
    return str.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase();
}
/**
 * Convert kebab-case to camelCase
 */
function toCamelCase(str) {
    return str.replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());
}
/**
 * Base class for all Hollow components
 * Provides reactive properties, Shadow DOM, and styling
 */
export class HollowElement extends HTMLElement {
    /** Observed attributes for this element */
    static observedAttributes = [];
    /** Property metadata storage */
    static _propertyMetadata;
    /** Shadow root reference */
    _shadowRoot;
    /** Element internals for form association */
    _internals;
    /** Property values storage */
    _props = new Map();
    /** Whether the element is connected */
    _connected = false;
    /** Pending render flag */
    _renderPending = false;
    /** Event listeners for cleanup */
    _eventListeners = [];
    constructor() {
        super();
        // Create Shadow DOM with delegates focus for better a11y
        this._shadowRoot = this.attachShadow({
            mode: 'open',
            delegatesFocus: true,
        });
        // Attach element internals for form association
        if ('attachInternals' in this) {
            this._internals = this.attachInternals();
        }
        // Initialize default property values
        this.initializeProperties();
        // Inject base styles
        this.injectBaseStyles();
    }
    /**
     * Called when element is added to DOM
     */
    connectedCallback() {
        this._connected = true;
        this.render();
        this.onConnect?.();
    }
    /**
     * Called when element is removed from DOM
     */
    disconnectedCallback() {
        this._connected = false;
        this.cleanup();
        this.onDisconnect?.();
    }
    /**
     * Called when an observed attribute changes
     */
    attributeChangedCallback(name, oldValue, newValue) {
        if (oldValue !== newValue) {
            const propName = toCamelCase(name);
            const parsedValue = this.parseAttributeValue(propName, newValue);
            this._props.set(propName, parsedValue);
            this.onPropChange?.(propName, parsedValue, this.parseAttributeValue(propName, oldValue));
            if (this._connected) {
                this.scheduleRender();
            }
        }
    }
    /**
     * Called when element is moved to a new document
     */
    adoptedCallback() {
        this.onAdopt?.();
    }
    /**
     * Initialize property default values
     */
    initializeProperties() {
        const metadata = this.constructor._propertyMetadata;
        if (metadata) {
            for (const [name, options] of metadata) {
                if (options.default !== undefined) {
                    this._props.set(name, options.default);
                }
            }
        }
    }
    /**
     * Inject base design token styles
     */
    injectBaseStyles() {
        const style = document.createElement('style');
        style.textContent = designTokensCSS;
        this._shadowRoot.appendChild(style);
    }
    /**
     * Schedule a render on next microtask
     */
    scheduleRender() {
        if (this._renderPending)
            return;
        this._renderPending = true;
        queueMicrotask(() => {
            this._renderPending = false;
            if (this._connected) {
                this.render();
            }
        });
    }
    /**
     * Render the component
     */
    render() {
        // Clear existing content (keep base styles)
        const styleEl = this._shadowRoot.querySelector('style');
        this._shadowRoot.innerHTML = '';
        if (styleEl) {
            this._shadowRoot.appendChild(styleEl);
        }
        // Add component styles
        const componentStyles = document.createElement('style');
        componentStyles.textContent = this.styles();
        this._shadowRoot.appendChild(componentStyles);
        // Add template content
        const template = document.createElement('template');
        template.innerHTML = this.template();
        this._shadowRoot.appendChild(template.content.cloneNode(true));
        // Bind events
        this.bindEvents();
        // Call render hook
        this.onRender?.();
    }
    /**
     * Bind event handlers from template
     */
    bindEvents() {
        // Find elements with data-on-* attributes
        this._shadowRoot.querySelectorAll('[data-on-click]').forEach((el) => {
            const handlerName = el.getAttribute('data-on-click');
            if (handlerName && typeof this[handlerName] === 'function') {
                const handler = this[handlerName].bind(this);
                el.addEventListener('click', handler);
                this._eventListeners.push({ el, event: 'click', handler });
            }
        });
        this._shadowRoot.querySelectorAll('[data-on-change]').forEach((el) => {
            const handlerName = el.getAttribute('data-on-change');
            if (handlerName && typeof this[handlerName] === 'function') {
                const handler = this[handlerName].bind(this);
                el.addEventListener('change', handler);
                this._eventListeners.push({ el, event: 'change', handler });
            }
        });
        this._shadowRoot.querySelectorAll('[data-on-input]').forEach((el) => {
            const handlerName = el.getAttribute('data-on-input');
            if (handlerName && typeof this[handlerName] === 'function') {
                const handler = this[handlerName].bind(this);
                el.addEventListener('input', handler);
                this._eventListeners.push({ el, event: 'input', handler });
            }
        });
    }
    /**
     * Cleanup event listeners
     */
    cleanup() {
        for (const { el, event, handler } of this._eventListeners) {
            el.removeEventListener(event, handler);
        }
        this._eventListeners = [];
    }
    /**
     * Parse attribute value based on property type
     */
    parseAttributeValue(propName, value) {
        if (value === null)
            return undefined;
        const metadata = this.constructor._propertyMetadata?.get(propName);
        const type = metadata?.type ?? 'string';
        switch (type) {
            case 'boolean':
                return value !== null && value !== 'false';
            case 'number':
                return Number(value);
            case 'object':
            case 'array':
                try {
                    return JSON.parse(value);
                }
                catch {
                    return undefined;
                }
            default:
                return value;
        }
    }
    /**
     * Get a property value
     */
    getProp(name, defaultValue) {
        const value = this._props.get(name);
        return (value !== undefined ? value : defaultValue);
    }
    /**
     * Set a property value
     */
    setProp(name, value) {
        const oldValue = this._props.get(name);
        if (oldValue !== value) {
            this._props.set(name, value);
            // Reflect to attribute if configured
            const metadata = this.constructor._propertyMetadata?.get(name);
            if (metadata?.reflect && metadata.attribute !== false) {
                const attrName = metadata.attribute ?? toKebabCase(name);
                if (value === null || value === undefined) {
                    this.removeAttribute(attrName);
                }
                else if (typeof value === 'boolean') {
                    if (value)
                        this.setAttribute(attrName, '');
                    else
                        this.removeAttribute(attrName);
                }
                else {
                    this.setAttribute(attrName, String(value));
                }
            }
            this.onPropChange?.(name, value, oldValue);
            if (this._connected) {
                this.scheduleRender();
            }
        }
    }
    /**
     * Emit a custom event that bubbles through Shadow DOM
     */
    emit(name, detail, options) {
        return this.dispatchEvent(new CustomEvent(name, {
            detail,
            bubbles: true,
            composed: true, // Crosses shadow DOM boundary
            cancelable: true,
            ...options,
        }));
    }
    /**
     * Query an element in the shadow root
     */
    query(selector) {
        return this._shadowRoot.querySelector(selector);
    }
    /**
     * Query all elements in the shadow root
     */
    queryAll(selector) {
        return this._shadowRoot.querySelectorAll(selector);
    }
}
/**
 * Define a custom element
 */
export function defineElement(tagName, elementClass) {
    if (!customElements.get(tagName)) {
        customElements.define(tagName, elementClass);
    }
}
//# sourceMappingURL=base-element.js.map