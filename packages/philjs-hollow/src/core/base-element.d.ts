/**
 * Hollow Base Element
 * Foundation for all Hollow Web Components
 */
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
export declare function property(options?: PropertyOptions): (target: any, propertyKeyOrContext: string | ClassFieldDecoratorContext) => void;
/**
 * Base class for all Hollow components
 * Provides reactive properties, Shadow DOM, and styling
 */
export declare abstract class HollowElement extends HTMLElement {
    /** Observed attributes for this element */
    static observedAttributes: string[];
    /** Property metadata storage */
    static _propertyMetadata?: Map<string, PropertyOptions>;
    /** Shadow root reference */
    protected _shadowRoot: ShadowRoot;
    /** Element internals for form association */
    protected _internals?: ElementInternals;
    /** Property values storage */
    private _props;
    /** Whether the element is connected */
    private _connected;
    /** Pending render flag */
    private _renderPending;
    /** Event listeners for cleanup */
    private _eventListeners;
    constructor();
    /**
     * Called when element is added to DOM
     */
    connectedCallback(): void;
    /**
     * Called when element is removed from DOM
     */
    disconnectedCallback(): void;
    /**
     * Called when an observed attribute changes
     */
    attributeChangedCallback(name: string, oldValue: string | null, newValue: string | null): void;
    /**
     * Called when element is moved to a new document
     */
    adoptedCallback(): void;
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
    private initializeProperties;
    /**
     * Inject base design token styles
     */
    private injectBaseStyles;
    /**
     * Schedule a render on next microtask
     */
    private scheduleRender;
    /**
     * Render the component
     */
    protected render(): void;
    /**
     * Bind event handlers from template
     */
    private bindEvents;
    /**
     * Cleanup event listeners
     */
    private cleanup;
    /**
     * Parse attribute value based on property type
     */
    private parseAttributeValue;
    /**
     * Get a property value
     */
    protected getProp<T>(name: string, defaultValue?: T): T;
    /**
     * Set a property value
     */
    protected setProp<T>(name: string, value: T): void;
    /**
     * Emit a custom event that bubbles through Shadow DOM
     */
    protected emit<T>(name: string, detail?: T, options?: CustomEventInit): boolean;
    /**
     * Query an element in the shadow root
     */
    protected query<E extends Element = Element>(selector: string): E | null;
    /**
     * Query all elements in the shadow root
     */
    protected queryAll<E extends Element = Element>(selector: string): NodeListOf<E>;
}
/**
 * Define a custom element
 */
export declare function defineElement(tagName: string, elementClass: typeof HollowElement): void;
//# sourceMappingURL=base-element.d.ts.map