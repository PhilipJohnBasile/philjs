/**
 * Hollow Base Element
 * Foundation for all Hollow Web Components
 */

import { designTokensCSS } from '../styles/tokens.js';

/**
 * Property metadata for reflection
 */
export interface PropertyOptions {
  /** Attribute name (defaults to kebab-case of property name) */
  attribute?: string | false;
  /** Property type for serialization */
  type?: 'string' | 'number' | 'boolean' | 'object' | 'array';
  /** Reflect property to attribute */
  reflect?: boolean;
  /** Default value */
  default?: unknown;
}

/**
 * Property decorator for Hollow elements
 * Supports both legacy and stage 3 decorators
 */
export function property(options: PropertyOptions = {}) {
  return function (target: any, propertyKeyOrContext: string | ClassFieldDecoratorContext) {
    // Stage 3 decorator (TC39)
    if (typeof propertyKeyOrContext === 'object' && propertyKeyOrContext.kind === 'field') {
      const context = propertyKeyOrContext;
      const propertyKey = String(context.name);

      context.addInitializer(function (this: HollowElement) {
        const constructor = this.constructor as typeof HollowElement;

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
      });

      return;
    }

    // Legacy decorator
    const propertyKey = propertyKeyOrContext as string;

    // Handle case where target might be undefined in some test contexts
    if (!target || !target.constructor) {
      return;
    }

    const constructor = target.constructor as typeof HollowElement;

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
function toKebabCase(str: string): string {
  return str.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase();
}

/**
 * Convert kebab-case to camelCase
 */
function toCamelCase(str: string): string {
  return str.replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());
}

/**
 * Base class for all Hollow components
 * Provides reactive properties, Shadow DOM, and styling
 */
export abstract class HollowElement extends HTMLElement {
  /** Observed attributes for this element */
  static observedAttributes: string[] = [];

  /** Property metadata storage */
  static _propertyMetadata?: Map<string, PropertyOptions>;

  /** Shadow root reference */
  protected _shadowRoot: ShadowRoot;

  /** Element internals for form association */
  protected _internals?: ElementInternals;

  /** Property values storage */
  private _props: Map<string, unknown> = new Map();

  /** Whether the element is connected */
  private _connected = false;

  /** Pending render flag */
  private _renderPending = false;

  /** Event listeners for cleanup */
  private _eventListeners: Array<{ el: Element; event: string; handler: EventListener }> = [];

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
  connectedCallback(): void {
    this._connected = true;
    this.render();
    this.onConnect?.();
  }

  /**
   * Called when element is removed from DOM
   */
  disconnectedCallback(): void {
    this._connected = false;
    this.cleanup();
    this.onDisconnect?.();
  }

  /**
   * Called when an observed attribute changes
   */
  attributeChangedCallback(name: string, oldValue: string | null, newValue: string | null): void {
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
  adoptedCallback(): void {
    this.onAdopt?.();
  }

  /**
   * Override to provide component template
   */
  protected abstract template(): string;

  /**
   * Override to provide component styles
   */
  protected abstract styles(): string;

  /**
   * Lifecycle hook: element connected
   */
  protected onConnect?(): void;

  /**
   * Lifecycle hook: element disconnected
   */
  protected onDisconnect?(): void;

  /**
   * Lifecycle hook: property changed
   */
  protected onPropChange?(name: string, newValue: unknown, oldValue: unknown): void;

  /**
   * Lifecycle hook: element adopted to new document
   */
  protected onAdopt?(): void;

  /**
   * Lifecycle hook: after render
   */
  protected onRender?(): void;

  /**
   * Initialize property default values
   */
  private initializeProperties(): void {
    const metadata = (this.constructor as typeof HollowElement)._propertyMetadata;
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
  private injectBaseStyles(): void {
    const style = document.createElement('style');
    style.textContent = designTokensCSS;
    this._shadowRoot.appendChild(style);
  }

  /**
   * Schedule a render on next microtask
   */
  private scheduleRender(): void {
    if (this._renderPending) return;

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
  protected render(): void {
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
  private bindEvents(): void {
    // Find elements with data-on-* attributes
    this._shadowRoot.querySelectorAll('[data-on-click]').forEach((el) => {
      const handlerName = el.getAttribute('data-on-click');
      if (handlerName && typeof (this as unknown as Record<string, unknown>)[handlerName] === 'function') {
        const handler = ((this as unknown as Record<string, unknown>)[handlerName] as () => void).bind(this);
        el.addEventListener('click', handler);
        this._eventListeners.push({ el, event: 'click', handler });
      }
    });

    this._shadowRoot.querySelectorAll('[data-on-change]').forEach((el) => {
      const handlerName = el.getAttribute('data-on-change');
      if (handlerName && typeof (this as unknown as Record<string, unknown>)[handlerName] === 'function') {
        const handler = ((this as unknown as Record<string, unknown>)[handlerName] as () => void).bind(this);
        el.addEventListener('change', handler);
        this._eventListeners.push({ el, event: 'change', handler });
      }
    });

    this._shadowRoot.querySelectorAll('[data-on-input]').forEach((el) => {
      const handlerName = el.getAttribute('data-on-input');
      if (handlerName && typeof (this as unknown as Record<string, unknown>)[handlerName] === 'function') {
        const handler = ((this as unknown as Record<string, unknown>)[handlerName] as () => void).bind(this);
        el.addEventListener('input', handler);
        this._eventListeners.push({ el, event: 'input', handler });
      }
    });
  }

  /**
   * Cleanup event listeners
   */
  private cleanup(): void {
    for (const { el, event, handler } of this._eventListeners) {
      el.removeEventListener(event, handler);
    }
    this._eventListeners = [];
  }

  /**
   * Parse attribute value based on property type
   */
  private parseAttributeValue(propName: string, value: string | null): unknown {
    if (value === null) return undefined;

    const metadata = (this.constructor as typeof HollowElement)._propertyMetadata?.get(propName);
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
        } catch {
          return undefined;
        }
      default:
        return value;
    }
  }

  /**
   * Get a property value
   */
  protected getProp<T>(name: string, defaultValue?: T): T {
    const value = this._props.get(name);
    return (value !== undefined ? value : defaultValue) as T;
  }

  /**
   * Set a property value
   */
  protected setProp<T>(name: string, value: T): void {
    const oldValue = this._props.get(name);
    if (oldValue !== value) {
      this._props.set(name, value);

      // Reflect to attribute if configured
      const metadata = (this.constructor as typeof HollowElement)._propertyMetadata?.get(name);
      if (metadata?.reflect && metadata.attribute !== false) {
        const attrName = metadata.attribute ?? toKebabCase(name);
        if (value === null || value === undefined) {
          this.removeAttribute(attrName);
        } else if (typeof value === 'boolean') {
          if (value) this.setAttribute(attrName, '');
          else this.removeAttribute(attrName);
        } else {
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
  protected emit<T>(name: string, detail?: T, options?: CustomEventInit): boolean {
    return this.dispatchEvent(
      new CustomEvent(name, {
        detail,
        bubbles: true,
        composed: true, // Crosses shadow DOM boundary
        cancelable: true,
        ...options,
      })
    );
  }

  /**
   * Query an element in the shadow root
   */
  protected query<E extends Element = Element>(selector: string): E | null {
    return this._shadowRoot.querySelector<E>(selector);
  }

  /**
   * Query all elements in the shadow root
   */
  protected queryAll<E extends Element = Element>(selector: string): NodeListOf<E> {
    return this._shadowRoot.querySelectorAll<E>(selector);
  }
}

/**
 * Define a custom element
 */
export function defineElement(tagName: string, elementClass: typeof HollowElement): void {
  if (!customElements.get(tagName)) {
    customElements.define(tagName, elementClass);
  }
}
