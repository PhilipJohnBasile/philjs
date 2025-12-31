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
import { type Signal } from './signals.js';
import { html, css, type TemplateResult } from './html.js';
export { html, css };
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
/**
 * Base class for PhilJS web components.
 * Provides reactive state, lifecycle hooks, and modern web component features.
 */
export declare abstract class PhilElement extends HTMLElement {
    /**
     * Styles to adopt on the shadow root.
     * Can be a single CSSStyleSheet or array of sheets.
     */
    static styles?: CSSStyleSheet | CSSStyleSheet[];
    /**
     * Whether this element participates in form submission.
     */
    static formAssociated: boolean;
    /**
     * The shadow root for this element.
     */
    shadowRoot: ShadowRoot;
    /**
     * Element internals for form participation and ARIA.
     */
    protected internals: ElementInternals;
    /**
     * Reactive signals for state management.
     */
    private _signals;
    /**
     * Pending property updates for batching.
     */
    private _pendingUpdate;
    /**
     * Effect disposers for cleanup.
     */
    private _disposers;
    /**
     * Whether the element has been connected to the DOM.
     */
    private _connected;
    /**
     * Custom element state (for ::state() CSS pseudo-class).
     */
    private get _states();
    constructor();
    /**
     * Called when element is added to the DOM.
     */
    connectedCallback(): void;
    /**
     * Called when element is removed from the DOM.
     */
    disconnectedCallback(): void;
    /**
     * Called when an observed attribute changes.
     */
    attributeChangedCallback(name: string, oldValue: string | null, newValue: string | null): void;
    /**
     * Called when element is moved to a new document.
     */
    adoptedCallback(): void;
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
    /**
     * Override to define the element's template.
     */
    protected abstract render(): TemplateResult;
    /**
     * Schedule an update to re-render the element.
     */
    protected requestUpdate(): void;
    /**
     * Schedule a render update (batched via microtask).
     */
    private _scheduleUpdate;
    /**
     * Handle attribute changes and update corresponding properties.
     */
    private _handleAttributeChange;
    /**
     * Create or get a reactive signal for a property.
     */
    protected _getSignal<T>(name: string, initialValue: T): Signal<T>;
    /**
     * Create a reactive effect that auto-disposes on disconnect.
     */
    protected createEffect(fn: () => void | (() => void)): void;
    /**
     * Add a custom state (for ::state() CSS selector).
     *
     * @example
     * ```ts
     * this.addState('loading');
     * // CSS: my-element::state(loading) { opacity: 0.5; }
     * ```
     */
    protected addState(state: string): void;
    /**
     * Remove a custom state.
     */
    protected deleteState(state: string): void;
    /**
     * Toggle a custom state.
     */
    protected toggleState(state: string, force?: boolean): boolean;
    /**
     * Check if element has a custom state.
     */
    protected hasState(state: string): boolean;
    /**
     * Get the form this element is associated with.
     */
    get form(): HTMLFormElement | null;
    /**
     * Set the form value for submission.
     */
    protected setFormValue(value: FormData | string | null, state?: FormData | string | null): void;
    /**
     * Set custom validity message.
     */
    protected setValidity(flags?: ValidityStateFlags, message?: string, anchor?: HTMLElement): void;
    /**
     * Report validity to the form.
     */
    reportValidity(): boolean;
    /**
     * Check element validity.
     */
    checkValidity(): boolean;
    /**
     * Get validity state.
     */
    get validity(): ValidityState;
    /**
     * Get validation message.
     */
    get validationMessage(): string;
    /**
     * Whether form will validate element.
     */
    get willValidate(): boolean;
    /**
     * Set ARIA role via internals (doesn't pollute attributes).
     */
    protected setAriaRole(role: string): void;
    /**
     * Set ARIA label via internals.
     */
    protected setAriaLabel(label: string): void;
}
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
export declare function state(): <T>(target: ClassAccessorDecoratorTarget<PhilElement, T>, context: ClassAccessorDecoratorContext<PhilElement, T>) => ClassAccessorDecoratorResult<PhilElement, T>;
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
export declare function property(options?: PropertyOptions): <T>(target: ClassAccessorDecoratorTarget<PhilElement, T>, context: ClassAccessorDecoratorContext<PhilElement, T>) => ClassAccessorDecoratorResult<PhilElement, T>;
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
export declare function query(selector: string, all?: boolean): <T extends Element | NodeList>(_target: ClassAccessorDecoratorTarget<PhilElement, T | null>, context: ClassAccessorDecoratorContext<PhilElement, T | null>) => ClassAccessorDecoratorResult<PhilElement, T | null>;
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
export declare function listen(event: string, selector?: string): <T extends (e: Event) => void>(method: T, context: ClassMethodDecoratorContext<PhilElement, T>) => void;
//# sourceMappingURL=element.d.ts.map