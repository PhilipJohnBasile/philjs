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

import { signal, effect, batch, type Signal } from './signals.js';
import { html, css, render, type TemplateResult } from './html.js';

// Re-export html and css for convenience
export { html, css };

// ============================================================================
// Types
// ============================================================================

export interface PropertyOptions {
  type?: typeof String | typeof Number | typeof Boolean | typeof Array | typeof Object;
  attribute?: string | false;
  reflect?: boolean;
  converter?: {
    fromAttribute?: (value: string | null, type?: unknown) => unknown;
    toAttribute?: (value: unknown, type?: unknown) => string | null;
  };
}

export interface PhilElementConstructor {
  new (): PhilElement;
  styles?: CSSStyleSheet | CSSStyleSheet[];
  formAssociated?: boolean;
  observedAttributes?: string[];
}

// ============================================================================
// PhilElement Base Class
// ============================================================================

/**
 * Base class for PhilJS web components.
 * Provides reactive state, lifecycle hooks, and modern web component features.
 */
export abstract class PhilElement extends HTMLElement {
  // ============================================================================
  // Static Properties
  // ============================================================================

  /**
   * Styles to adopt on the shadow root.
   * Can be a single CSSStyleSheet or array of sheets.
   */
  static styles?: CSSStyleSheet | CSSStyleSheet[];

  /**
   * Whether this element participates in form submission.
   */
  static formAssociated = false;

  // ============================================================================
  // Instance Properties
  // ============================================================================

  /**
   * The shadow root for this element.
   */
  declare shadowRoot: ShadowRoot;

  /**
   * Element internals for form participation and ARIA.
   */
  protected internals: ElementInternals;

  /**
   * Reactive signals for state management.
   */
  private _signals = new Map<string, Signal<unknown>>();

  /**
   * Pending property updates for batching.
   */
  private _pendingUpdate = false;

  /**
   * Effect disposers for cleanup.
   */
  private _disposers: Array<() => void> = [];

  /**
   * Whether the element has been connected to the DOM.
   */
  private _connected = false;

  /**
   * Custom element state (for ::state() CSS pseudo-class).
   */
  private get _states(): CustomStateSet {
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
    const ctor = this.constructor as PhilElementConstructor;
    if (ctor.styles) {
      const styles = Array.isArray(ctor.styles) ? ctor.styles : [ctor.styles];
      this.shadowRoot.adoptedStyleSheets = styles;
    }
  }

  /**
   * Called when element is added to the DOM.
   */
  connectedCallback(): void {
    this._connected = true;
    this._scheduleUpdate();
    this.onConnect?.();
  }

  /**
   * Called when element is removed from the DOM.
   */
  disconnectedCallback(): void {
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
  attributeChangedCallback(name: string, oldValue: string | null, newValue: string | null): void {
    if (oldValue !== newValue) {
      this._handleAttributeChange(name, newValue);
    }
  }

  /**
   * Called when element is moved to a new document.
   */
  adoptedCallback(): void {
    this.onAdopt?.();
  }

  // ============================================================================
  // Lifecycle Hooks (Override in subclass)
  // ============================================================================

  /**
   * Override to run code when element connects to DOM.
   */
  protected onConnect?(): void;

  /**
   * Override to run code when element disconnects from DOM.
   */
  protected onDisconnect?(): void;

  /**
   * Override to run code when element is adopted by new document.
   */
  protected onAdopt?(): void;

  /**
   * Override to run code before each render.
   */
  protected onBeforeRender?(): void;

  /**
   * Override to run code after each render.
   */
  protected onAfterRender?(): void;

  // ============================================================================
  // Rendering
  // ============================================================================

  /**
   * Override to define the element's template.
   */
  protected abstract render(): TemplateResult;

  /**
   * Schedule an update to re-render the element.
   */
  protected requestUpdate(): void {
    this._scheduleUpdate();
  }

  /**
   * Schedule a render update (batched via microtask).
   */
  private _scheduleUpdate(): void {
    if (this._pendingUpdate || !this._connected) return;
    this._pendingUpdate = true;

    queueMicrotask(() => {
      this._pendingUpdate = false;
      if (!this._connected) return;

      this.onBeforeRender?.();
      const result = this.render();
      render(result, this.shadowRoot);
      this.onAfterRender?.();
    });
  }

  /**
   * Handle attribute changes and update corresponding properties.
   */
  private _handleAttributeChange(name: string, value: string | null): void {
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
  protected _getSignal<T>(name: string, initialValue: T): Signal<T> {
    if (!this._signals.has(name)) {
      const sig = signal(initialValue);

      // Subscribe to signal changes to trigger re-render
      const dispose = sig.subscribe(() => {
        this._scheduleUpdate();
      });
      this._disposers.push(dispose);
      this._signals.set(name, sig as Signal<unknown>);
    }
    return this._signals.get(name) as Signal<T>;
  }

  /**
   * Create a reactive effect that auto-disposes on disconnect.
   */
  protected createEffect(fn: () => void | (() => void)): void {
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
  protected addState(state: string): void {
    this._states.add(state);
  }

  /**
   * Remove a custom state.
   */
  protected deleteState(state: string): void {
    this._states.delete(state);
  }

  /**
   * Toggle a custom state.
   */
  protected toggleState(state: string, force?: boolean): boolean {
    if (force === undefined) {
      if (this._states.has(state)) {
        this._states.delete(state);
        return false;
      } else {
        this._states.add(state);
        return true;
      }
    } else if (force) {
      this._states.add(state);
      return true;
    } else {
      this._states.delete(state);
      return false;
    }
  }

  /**
   * Check if element has a custom state.
   */
  protected hasState(state: string): boolean {
    return this._states.has(state);
  }

  // ============================================================================
  // Form Association
  // ============================================================================

  /**
   * Get the form this element is associated with.
   */
  get form(): HTMLFormElement | null {
    return this.internals.form;
  }

  /**
   * Set the form value for submission.
   */
  protected setFormValue(value: FormData | string | null, state?: FormData | string | null): void {
    this.internals.setFormValue(value, state);
  }

  /**
   * Set custom validity message.
   */
  protected setValidity(
    flags?: ValidityStateFlags,
    message?: string,
    anchor?: HTMLElement
  ): void {
    this.internals.setValidity(flags ?? {}, message, anchor);
  }

  /**
   * Report validity to the form.
   */
  reportValidity(): boolean {
    return this.internals.reportValidity();
  }

  /**
   * Check element validity.
   */
  checkValidity(): boolean {
    return this.internals.checkValidity();
  }

  /**
   * Get validity state.
   */
  get validity(): ValidityState {
    return this.internals.validity;
  }

  /**
   * Get validation message.
   */
  get validationMessage(): string {
    return this.internals.validationMessage;
  }

  /**
   * Whether form will validate element.
   */
  get willValidate(): boolean {
    return this.internals.willValidate;
  }

  // ============================================================================
  // ARIA (via Element Internals)
  // ============================================================================

  /**
   * Set ARIA role via internals (doesn't pollute attributes).
   */
  protected setAriaRole(role: string): void {
    this.internals.role = role;
  }

  /**
   * Set ARIA label via internals.
   */
  protected setAriaLabel(label: string): void {
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
  return function <T>(
    target: ClassAccessorDecoratorTarget<PhilElement, T>,
    context: ClassAccessorDecoratorContext<PhilElement, T>
  ): ClassAccessorDecoratorResult<PhilElement, T> {
    const name = String(context.name);

    return {
      get(this: PhilElement): T {
        const sig = (this as any)._getSignal(name, target.get.call(this));
        return sig() as T;
      },
      set(this: PhilElement, value: T): void {
        const sig = (this as any)._getSignal(name, target.get.call(this));
        sig.set(value);
      },
      init(value: T): T {
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
export function property(options: PropertyOptions = {}) {
  return function <T>(
    target: ClassAccessorDecoratorTarget<PhilElement, T>,
    context: ClassAccessorDecoratorContext<PhilElement, T>
  ): ClassAccessorDecoratorResult<PhilElement, T> {
    const name = String(context.name);
    const attrName = options.attribute !== false
      ? (typeof options.attribute === 'string' ? options.attribute : toKebabCase(name))
      : null;

    return {
      get(this: PhilElement): T {
        const sig = (this as any)._getSignal(name, target.get.call(this));
        return sig() as T;
      },
      set(this: PhilElement, value: T): void {
        const sig = (this as any)._getSignal(name, target.get.call(this));
        sig.set(value);

        // Reflect to attribute
        if (options.reflect && attrName) {
          const attrValue = convertToAttribute(value, options);
          if (attrValue === null) {
            this.removeAttribute(attrName);
          } else {
            this.setAttribute(attrName, attrValue);
          }
        }
      },
      init(value: T): T {
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
export function query(selector: string, all = false) {
  return function <T extends Element | NodeList>(
    _target: ClassAccessorDecoratorTarget<PhilElement, T | null>,
    context: ClassAccessorDecoratorContext<PhilElement, T | null>
  ): ClassAccessorDecoratorResult<PhilElement, T | null> {
    return {
      get(this: PhilElement): T | null {
        if (all) {
          return this.shadowRoot.querySelectorAll(selector) as unknown as T;
        }
        return this.shadowRoot.querySelector(selector) as T | null;
      },
      set(): void {
        // Query results are read-only
      },
      init(): T | null {
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
export function listen(event: string, selector?: string) {
  return function <T extends (e: Event) => void>(
    method: T,
    context: ClassMethodDecoratorContext<PhilElement, T>
  ): void {
    context.addInitializer(function (this: PhilElement) {
      const handler = (e: Event) => {
        if (selector) {
          const target = e.target as Element;
          if (!target.matches(selector)) return;
        }
        method.call(this, e);
      };

      // Add listener after first render
      queueMicrotask(() => {
        if (selector) {
          this.shadowRoot.addEventListener(event, handler);
        } else {
          this.addEventListener(event, handler);
        }
      });
    });
  };
}

// ============================================================================
// Utility Functions
// ============================================================================

function toKebabCase(str: string): string {
  return str.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`);
}

function convertToAttribute(value: unknown, options: PropertyOptions): string | null {
  if (value == null) return null;
  if (options.converter?.toAttribute) {
    return options.converter.toAttribute(value, options.type);
  }
  if (options.type === Boolean) {
    return value ? '' : null;
  }
  return String(value);
}

// ============================================================================
// Type Declarations for Custom State
// ============================================================================

// Polyfill type for CustomStateSet (not yet in all TS libs)
interface CustomStateSet {
  add(state: string): void;
  delete(state: string): boolean;
  has(state: string): boolean;
  clear(): void;
  readonly size: number;
  forEach(callback: (state: string) => void): void;
  [Symbol.iterator](): IterableIterator<string>;
}
