/**
 * Web Component Export for PhilJS
 * 
 * Enables exporting PhilJS components as standard Web Components
 * for use in vanilla HTML, other frameworks, or as micro-frontends.
 */

import { effect, type Signal } from './signals.js';

export interface WebComponentOptions {
    /** Tag name for the custom element (must contain a hyphen) */
    tag: string;
    /** Shadow DOM mode */
    shadow?: 'open' | 'closed' | false;
    /** CSS styles to inject into shadow DOM */
    styles?: string | string[];
    /** Observed attributes (maps to props) */
    observedAttributes?: string[];
    /** Props with their default values and types */
    props?: Record<string, { type: 'string' | 'number' | 'boolean' | 'object'; default?: any }>;
    /** Form-associated element */
    formAssociated?: boolean;
}

/**
 * Convert a PhilJS component to a Web Component
 * 
 * @example
 * ```tsx
 * import { signal } from '@philjs/core';
 * import { toWebComponent } from '@philjs/core/web-component';
 * 
 * function Counter(props: { initial?: number }) {
 *   const count = signal(props.initial ?? 0);
 *   return (
 *     <button onClick={() => count.set(count() + 1)}>
 *       Count: {count()}
 *     </button>
 *   );
 * }
 * 
 * // Register as <my-counter>
 * toWebComponent(Counter, {
 *   tag: 'my-counter',
 *   shadow: 'open',
 *   observedAttributes: ['initial'],
 *   props: {
 *     initial: { type: 'number', default: 0 }
 *   }
 * });
 * 
 * // Use in HTML:
 * // <my-counter initial="10"></my-counter>
 * ```
 */
export function toWebComponent<P extends Record<string, any>>(
    Component: (props: P) => any,
    options: WebComponentOptions
): typeof HTMLElement {
    const {
        tag,
        shadow = 'open',
        styles,
        observedAttributes = [],
        props: propDefs = {},
        formAssociated = false,
    } = options;

    // Validate tag name
    if (!tag.includes('-')) {
        throw new Error(`Web Component tag must contain a hyphen: "${tag}"`);
    }

    class PhilJSElement extends HTMLElement {
        static observedAttributes = observedAttributes;
        static formAssociated = formAssociated;

        private _props: P = {} as P;
        private _root: ShadowRoot | HTMLElement;
        private _mounted = false;
        private _cleanup?: () => void;

        constructor() {
            super();

            // Setup shadow DOM or use light DOM
            if (shadow) {
                this._root = this.attachShadow({ mode: shadow });
            } else {
                this._root = this;
            }

            // Initialize props with defaults
            for (const [propName, def] of Object.entries(propDefs)) {
                if (def.default !== undefined) {
                    (this._props as any)[propName] = def.default;
                }
            }
        }

        connectedCallback() {
            this._mounted = true;
            this._render();
        }

        disconnectedCallback() {
            this._mounted = false;
            this._cleanup?.();
        }

        attributeChangedCallback(name: string, oldValue: string | null, newValue: string | null) {
            if (oldValue === newValue) return;

            // Convert attribute value based on prop type
            const propDef = propDefs[name];
            let value: any = newValue;

            if (propDef) {
                switch (propDef.type) {
                    case 'number':
                        value = newValue === null ? propDef.default : Number(newValue);
                        break;
                    case 'boolean':
                        value = newValue !== null && newValue !== 'false';
                        break;
                    case 'object':
                        try {
                            value = newValue ? JSON.parse(newValue) : propDef.default;
                        } catch {
                            value = propDef.default;
                        }
                        break;
                }
            }

            (this._props as any)[name] = value;

            if (this._mounted) {
                this._render();
            }
        }

        private _render() {
            // Inject styles
            if (styles && shadow) {
                const styleEl = document.createElement('style');
                styleEl.textContent = Array.isArray(styles) ? styles.join('\n') : styles;

                // Only add styles once
                if (!this._root.querySelector('style[data-philjs]')) {
                    styleEl.setAttribute('data-philjs', '');
                    this._root.prepend(styleEl);
                }
            }

            // Cleanup previous render
            this._cleanup?.();

            // Render the component
            const container = shadow
                ? this._root
                : this;

            // Get existing content container or create one
            let contentContainer = container.querySelector('[data-philjs-content]');
            if (!contentContainer) {
                contentContainer = document.createElement('div');
                contentContainer.setAttribute('data-philjs-content', '');
                container.appendChild(contentContainer);
            }

            // Create a reactive effect for the component
            this._cleanup = effect(() => {
                const result = Component(this._props);

                // Handle different return types
                if (result === null || result === undefined) {
                    contentContainer!.innerHTML = '';
                } else if (typeof result === 'string') {
                    contentContainer!.innerHTML = result;
                } else if (result instanceof HTMLElement) {
                    contentContainer!.innerHTML = '';
                    contentContainer!.appendChild(result);
                } else if (result.outerHTML) {
                    // JSX element
                    contentContainer!.innerHTML = '';
                    contentContainer!.appendChild(result);
                }
            });
        }

        // Property accessors for each prop
        // These allow setting props via JavaScript
        get props(): P {
            return { ...this._props };
        }

        set props(newProps: Partial<P>) {
            Object.assign(this._props, newProps);
            if (this._mounted) {
                this._render();
            }
        }
    }

    // Create property accessors for each prop
    for (const propName of Object.keys(propDefs)) {
        Object.defineProperty(PhilJSElement.prototype, propName, {
            get() {
                return this._props[propName];
            },
            set(value: any) {
                this._props[propName] = value;
                if (this._mounted) {
                    this._render();
                }
            },
            enumerable: true,
            configurable: true,
        });
    }

    // Register the custom element
    if (!customElements.get(tag)) {
        customElements.define(tag, PhilJSElement);
    }

    return PhilJSElement;
}

/**
 * Create a shadow DOM wrapper with scoped styles
 */
export function createShadowWrapper(
    element: HTMLElement,
    mode: 'open' | 'closed' = 'open'
): ShadowRoot {
    return element.attachShadow({ mode });
}

/**
 * Helper to define multiple web components at once
 */
export function defineComponents(
    components: Array<{ component: (props: any) => any; options: WebComponentOptions }>
): void {
    for (const { component, options } of components) {
        toWebComponent(component, options);
    }
}

/**
 * Check if a custom element is already defined
 */
export function isElementDefined(tag: string): boolean {
    return customElements.get(tag) !== undefined;
}

/**
 * Wait for a custom element to be defined
 */
export async function whenDefined(tag: string): Promise<typeof HTMLElement> {
    return customElements.whenDefined(tag);
}
