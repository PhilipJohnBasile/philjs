/**
 * PhilJS Alpine Mode
 *
 * A comprehensive Alpine.js compatible layer powered by PhilJS signals.
 * Provides reactive DOM binding with x-* directives, stores, magics,
 * and plugin support.
 */

import { signal, computed, effect, batch, type Signal } from '@philjs/core';

// ============================================================================
// TYPES
// ============================================================================

export interface AlpineComponent {
    init?: () => void;
    destroy?: () => void;
    [key: string]: any;
}

export interface AlpineDirective {
    name: string;
    value: string;
    expression: string;
    modifiers: string[];
    original: string;
}

export interface AlpineContext {
    $el: HTMLElement;
    $refs: Record<string, HTMLElement>;
    $store: <T>(name: string) => T;
    $watch: <T>(getter: () => T, callback: (value: T, oldValue: T) => void) => () => void;
    $nextTick: (callback: () => void) => Promise<void>;
    $dispatch: (event: string, detail?: any) => void;
    $id: (name: string, key?: string | number) => string;
    $root: HTMLElement;
    $data: Record<string, any>;
}

export interface AlpinePlugin {
    (Alpine: typeof PhilAlpine): void;
}

export interface TransitionConfig {
    enter?: string;
    enterStart?: string;
    enterEnd?: string;
    leave?: string;
    leaveStart?: string;
    leaveEnd?: string;
    duration?: number;
}

export interface DirectiveHandler {
    (
        el: HTMLElement,
        directive: AlpineDirective,
        context: AlpineContext,
        cleanup: (callback: () => void) => void
    ): void;
}

// ============================================================================
// GLOBAL STATE
// ============================================================================

const stores = new Map<string, Signal<any>>();
const components = new Map<string, () => AlpineComponent>();
const customDirectives = new Map<string, DirectiveHandler>();
const plugins: AlpinePlugin[] = [];
const componentCleanups = new WeakMap<HTMLElement, (() => void)[]>();
const elementContexts = new WeakMap<HTMLElement, AlpineContext>();
let idCounter = 0;

// ============================================================================
// CORE UTILITIES
// ============================================================================

function parseDirective(attr: Attr): AlpineDirective | null {
    const name = attr.name;

    // x-* directive
    if (name.startsWith('x-')) {
        const parts = name.slice(2).split('.');
        return {
            name: parts[0]!,
            value: attr.value,
            expression: attr.value,
            modifiers: parts.slice(1),
            original: name,
        };
    }

    // @event shorthand
    if (name.startsWith('@')) {
        const parts = name.slice(1).split('.');
        return {
            name: 'on',
            value: parts[0]!,
            expression: attr.value,
            modifiers: parts.slice(1),
            original: name,
        };
    }

    // :attr shorthand
    if (name.startsWith(':')) {
        return {
            name: 'bind',
            value: name.slice(1),
            expression: attr.value,
            modifiers: [],
            original: name,
        };
    }

    return null;
}

function evaluateExpression(expression: string, context: Record<string, any>): any {
    try {
        // Create a function that evaluates the expression in context
        const fn = new Function(
            ...Object.keys(context),
            `return (${expression})`
        );
        return fn(...Object.values(context));
    } catch (e) {
        console.error(`[PhilAlpine] Error evaluating: ${expression}`, e);
        return undefined;
    }
}

function evaluateStatement(statement: string, context: Record<string, any>, event?: Event): void {
    try {
        const fn = new Function(
            '$event',
            ...Object.keys(context),
            statement
        );
        fn(event, ...Object.values(context));
    } catch (e) {
        console.error(`[PhilAlpine] Error executing: ${statement}`, e);
    }
}

function createReactiveProxy<T extends object>(obj: T): T {
    const signals = new Map<string | symbol, Signal<any>>();

    return new Proxy(obj, {
        get(target, prop) {
            if (typeof prop === 'symbol') {
                return Reflect.get(target, prop);
            }

            if (!signals.has(prop)) {
                const value = Reflect.get(target, prop);
                if (typeof value !== 'function') {
                    signals.set(prop, signal(value));
                } else {
                    return value.bind(target);
                }
            }

            return signals.get(prop)!();
        },

        set(target, prop, value) {
            if (typeof prop === 'symbol') {
                return Reflect.set(target, prop, value);
            }

            if (!signals.has(prop)) {
                signals.set(prop, signal(value));
            } else {
                signals.get(prop)!.set(value);
            }

            Reflect.set(target, prop, value);
            return true;
        },
    });
}

function addCleanup(el: HTMLElement, cleanup: () => void): void {
    if (!componentCleanups.has(el)) {
        componentCleanups.set(el, []);
    }
    componentCleanups.get(el)!.push(cleanup);
}

function runCleanups(el: HTMLElement): void {
    const cleanups = componentCleanups.get(el);
    if (cleanups) {
        cleanups.forEach((fn) => fn());
        componentCleanups.delete(el);
    }
}

// ============================================================================
// DIRECTIVE HANDLERS
// ============================================================================

const directiveHandlers: Record<string, DirectiveHandler> = {
    // x-data: Initialize component data
    data(el, directive, context, cleanup) {
        // Already handled in initializeComponent
    },

    // x-init: Run on initialization
    init(el, directive, context, cleanup) {
        evaluateStatement(directive.expression, context.$data);
    },

    // x-show: Toggle visibility
    show(el, directive, context, cleanup) {
        const unsubscribe = effect(() => {
            const value = evaluateExpression(directive.expression, context.$data);
            if (value) {
                el.style.display = '';
            } else {
                el.style.display = 'none';
            }
        });
        cleanup(unsubscribe);
    },

    // x-if: Conditional rendering (template-based)
    if(el, directive, context, cleanup) {
        if (el.tagName !== 'TEMPLATE') {
            console.warn('[PhilAlpine] x-if should be used on <template> elements');
            return;
        }

        const template = el as HTMLTemplateElement;
        const placeholder = document.createComment(' x-if ');
        let currentEl: Element | null = null;

        template.parentNode?.insertBefore(placeholder, template);

        const unsubscribe = effect(() => {
            const value = evaluateExpression(directive.expression, context.$data);

            if (value) {
                if (!currentEl) {
                    const clone = template.content.cloneNode(true) as DocumentFragment;
                    currentEl = clone.firstElementChild;
                    if (currentEl) {
                        placeholder.parentNode?.insertBefore(clone, placeholder.nextSibling);
                        initializeElement(currentEl as HTMLElement, context.$data);
                    }
                }
            } else {
                if (currentEl) {
                    runCleanups(currentEl as HTMLElement);
                    currentEl.remove();
                    currentEl = null;
                }
            }
        });

        cleanup(() => {
            unsubscribe();
            if (currentEl) {
                runCleanups(currentEl as HTMLElement);
                currentEl.remove();
            }
        });
    },

    // x-for: List rendering
    for(el, directive, context, cleanup) {
        if (el.tagName !== 'TEMPLATE') {
            console.warn('[PhilAlpine] x-for should be used on <template> elements');
            return;
        }

        const template = el as HTMLTemplateElement;
        const placeholder = document.createComment(' x-for ');
        const renderedElements: Element[] = [];

        template.parentNode?.insertBefore(placeholder, template);

        // Parse expression: "item in items" or "(item, index) in items"
        const match = directive.expression.match(/^\s*(?:\(([^)]+)\)|(\w+))\s+in\s+(.+)\s*$/);
        if (!match) {
            console.error('[PhilAlpine] Invalid x-for expression:', directive.expression);
            return;
        }

        const itemVars = (match[1] || match[2] || '').split(',').map((s) => s.trim());
        const itemName = itemVars[0]!;
        const indexName = itemVars[1] || '$index';
        const listExpression = match[3]!;

        const unsubscribe = effect(() => {
            const list = evaluateExpression(listExpression, context.$data) || [];

            // Remove old elements
            renderedElements.forEach((elem) => {
                runCleanups(elem as HTMLElement);
                elem.remove();
            });
            renderedElements.length = 0;

            // Render new elements
            let insertPoint: Node = placeholder;
            (list as any[]).forEach((item, index) => {
                const clone = template.content.cloneNode(true) as DocumentFragment;
                const elem = clone.firstElementChild;

                if (elem) {
                    const itemContext = {
                        ...context.$data,
                        [itemName]: item,
                        [indexName]: index,
                    };

                    placeholder.parentNode?.insertBefore(clone, insertPoint.nextSibling);
                    initializeElement(elem as HTMLElement, itemContext);
                    renderedElements.push(elem);
                    insertPoint = elem;
                }
            });
        });

        cleanup(() => {
            unsubscribe();
            renderedElements.forEach((elem) => {
                runCleanups(elem as HTMLElement);
                elem.remove();
            });
        });
    },

    // x-text: Set text content
    text(el, directive, context, cleanup) {
        const unsubscribe = effect(() => {
            const value = evaluateExpression(directive.expression, context.$data);
            el.textContent = value ?? '';
        });
        cleanup(unsubscribe);
    },

    // x-html: Set HTML content
    html(el, directive, context, cleanup) {
        const unsubscribe = effect(() => {
            const value = evaluateExpression(directive.expression, context.$data);
            el.innerHTML = value ?? '';
        });
        cleanup(unsubscribe);
    },

    // x-bind: Bind attribute
    bind(el, directive, context, cleanup) {
        const attr = directive.value;

        const unsubscribe = effect(() => {
            const value = evaluateExpression(directive.expression, context.$data);

            if (attr === 'class') {
                if (typeof value === 'object' && value !== null) {
                    for (const [className, enabled] of Object.entries(value)) {
                        el.classList.toggle(className, Boolean(enabled));
                    }
                } else if (typeof value === 'string') {
                    el.className = value;
                }
            } else if (attr === 'style') {
                if (typeof value === 'object' && value !== null) {
                    for (const [prop, val] of Object.entries(value)) {
                        (el.style as any)[prop] = val;
                    }
                } else if (typeof value === 'string') {
                    el.style.cssText = value;
                }
            } else if (value === false || value === null || value === undefined) {
                el.removeAttribute(attr);
            } else if (value === true) {
                el.setAttribute(attr, '');
            } else {
                el.setAttribute(attr, String(value));
            }
        });

        cleanup(unsubscribe);
    },

    // x-on: Event handler
    on(el, directive, context, cleanup) {
        const eventName = directive.value;
        const modifiers = new Set(directive.modifiers);

        const handler = (event: Event) => {
            if (modifiers.has('prevent')) {
                event.preventDefault();
            }
            if (modifiers.has('stop')) {
                event.stopPropagation();
            }
            if (modifiers.has('self') && event.target !== el) {
                return;
            }
            if (modifiers.has('once')) {
                el.removeEventListener(eventName, handler);
            }

            // Handle keyboard modifiers
            if (event instanceof KeyboardEvent) {
                const keyModifiers = ['enter', 'escape', 'space', 'tab', 'delete', 'backspace', 'up', 'down', 'left', 'right'];
                const keyMap: Record<string, string> = {
                    enter: 'Enter',
                    escape: 'Escape',
                    space: ' ',
                    tab: 'Tab',
                    delete: 'Delete',
                    backspace: 'Backspace',
                    up: 'ArrowUp',
                    down: 'ArrowDown',
                    left: 'ArrowLeft',
                    right: 'ArrowRight',
                };

                for (const mod of modifiers) {
                    if (keyModifiers.includes(mod) && event.key !== keyMap[mod]) {
                        return;
                    }
                }

                if (modifiers.has('ctrl') && !event.ctrlKey) return;
                if (modifiers.has('shift') && !event.shiftKey) return;
                if (modifiers.has('alt') && !event.altKey) return;
                if (modifiers.has('meta') && !event.metaKey) return;
            }

            evaluateStatement(directive.expression, context.$data, event);
        };

        const options: AddEventListenerOptions = {
            capture: modifiers.has('capture'),
            passive: modifiers.has('passive'),
        };

        if (modifiers.has('window')) {
            window.addEventListener(eventName, handler, options);
            cleanup(() => window.removeEventListener(eventName, handler, options));
        } else if (modifiers.has('document')) {
            document.addEventListener(eventName, handler, options);
            cleanup(() => document.removeEventListener(eventName, handler, options));
        } else {
            // Handle debounce and throttle
            let finalHandler = handler;

            if (modifiers.has('debounce')) {
                let timeout: ReturnType<typeof setTimeout>;
                const delay = parseInt(directive.modifiers.find((m) => /^\d+ms$/.test(m))?.replace('ms', '') || '250');
                finalHandler = (e: Event) => {
                    clearTimeout(timeout);
                    timeout = setTimeout(() => handler(e), delay);
                };
            }

            if (modifiers.has('throttle')) {
                let lastCall = 0;
                const delay = parseInt(directive.modifiers.find((m) => /^\d+ms$/.test(m))?.replace('ms', '') || '250');
                finalHandler = (e: Event) => {
                    const now = Date.now();
                    if (now - lastCall >= delay) {
                        lastCall = now;
                        handler(e);
                    }
                };
            }

            el.addEventListener(eventName, finalHandler, options);
            cleanup(() => el.removeEventListener(eventName, finalHandler, options));
        }
    },

    // x-model: Two-way binding
    model(el, directive, context, cleanup) {
        const isInput = el instanceof HTMLInputElement;
        const isTextarea = el instanceof HTMLTextAreaElement;
        const isSelect = el instanceof HTMLSelectElement;

        if (!isInput && !isTextarea && !isSelect) {
            console.warn('[PhilAlpine] x-model can only be used on input, textarea, or select elements');
            return;
        }

        const modifiers = new Set(directive.modifiers);

        // Set initial value
        const setElementValue = () => {
            const value = evaluateExpression(directive.expression, context.$data);

            if (isInput && (el.type === 'checkbox' || el.type === 'radio')) {
                if (el.type === 'checkbox') {
                    if (Array.isArray(value)) {
                        (el as HTMLInputElement).checked = value.includes(el.value);
                    } else {
                        (el as HTMLInputElement).checked = Boolean(value);
                    }
                } else {
                    (el as HTMLInputElement).checked = el.value === value;
                }
            } else if (isSelect && el.multiple) {
                const values = Array.isArray(value) ? value : [];
                Array.from(el.options).forEach((opt) => {
                    opt.selected = values.includes(opt.value);
                });
            } else {
                (el as HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement).value = value ?? '';
            }
        };

        const unsubscribe = effect(setElementValue);
        cleanup(unsubscribe);

        // Handle changes
        const eventName = isSelect || (isInput && (el.type === 'checkbox' || el.type === 'radio'))
            ? 'change'
            : modifiers.has('lazy') ? 'change' : 'input';

        const handler = () => {
            let value: any;

            if (isInput && el.type === 'checkbox') {
                const currentValue = evaluateExpression(directive.expression, context.$data);
                if (Array.isArray(currentValue)) {
                    if ((el as HTMLInputElement).checked) {
                        value = [...currentValue, el.value];
                    } else {
                        value = currentValue.filter((v) => v !== el.value);
                    }
                } else {
                    value = (el as HTMLInputElement).checked;
                }
            } else if (isInput && el.type === 'radio') {
                value = el.value;
            } else if (isSelect && el.multiple) {
                value = Array.from(el.selectedOptions).map((opt) => opt.value);
            } else {
                value = (el as HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement).value;
            }

            // Apply modifiers
            if (modifiers.has('number')) {
                value = parseFloat(value) || value;
            }
            if (modifiers.has('trim') && typeof value === 'string') {
                value = value.trim();
            }

            // Update the data
            evaluateStatement(`${directive.expression} = $value`, { ...context.$data, $value: value });
        };

        let finalHandler = handler;

        if (modifiers.has('debounce')) {
            let timeout: ReturnType<typeof setTimeout>;
            const delay = parseInt(directive.modifiers.find((m) => /^\d+ms$/.test(m))?.replace('ms', '') || '250');
            finalHandler = () => {
                clearTimeout(timeout);
                timeout = setTimeout(handler, delay);
            };
        }

        el.addEventListener(eventName, finalHandler);
        cleanup(() => el.removeEventListener(eventName, finalHandler));
    },

    // x-ref: Element reference
    ref(el, directive, context, cleanup) {
        context.$refs[directive.expression] = el;
        cleanup(() => {
            delete context.$refs[directive.expression];
        });
    },

    // x-cloak: Hide until Alpine initializes
    cloak(el, directive, context, cleanup) {
        el.removeAttribute('x-cloak');
    },

    // x-effect: Run effect
    effect: function effectDirective(el, directive, context, cleanup) {
        const unsubscribe = effect(() => {
            evaluateExpression(directive.expression, context.$data);
        });
        cleanup(unsubscribe);
    },

    // x-transition: Transition support
    transition(el, directive, context, cleanup) {
        const config: TransitionConfig = {};

        if (directive.modifiers.length > 0) {
            // Parse modifiers like x-transition.duration.500ms
            for (const mod of directive.modifiers) {
                if (mod.endsWith('ms')) {
                    config.duration = parseInt(mod);
                }
            }
        }

        // Store transition config on element
        (el as any).__x_transition = config;
    },

    // x-ignore: Skip initialization of children
    ignore(el, directive, context, cleanup) {
        // Handled in initializeElement
    },

    // x-teleport: Move element to target
    teleport(el, directive, context, cleanup) {
        if (el.tagName !== 'TEMPLATE') {
            console.warn('[PhilAlpine] x-teleport should be used on <template> elements');
            return;
        }

        const template = el as HTMLTemplateElement;
        const target = document.querySelector(directive.expression);

        if (!target) {
            console.warn('[PhilAlpine] x-teleport target not found:', directive.expression);
            return;
        }

        const clone = template.content.cloneNode(true) as DocumentFragment;
        const fragment = Array.from(clone.children);

        fragment.forEach((child) => {
            target.appendChild(child);
            initializeElement(child as HTMLElement, context.$data);
        });

        cleanup(() => {
            fragment.forEach((child) => {
                runCleanups(child as HTMLElement);
                child.remove();
            });
        });
    },
};

// ============================================================================
// INITIALIZATION
// ============================================================================

function createContext(el: HTMLElement, data: Record<string, any>): AlpineContext {
    const refs: Record<string, HTMLElement> = {};
    const root = el.closest('[x-data]') as HTMLElement || el;

    const context: AlpineContext = {
        $el: el,
        $refs: refs,
        $root: root,
        $data: data,

        $store<T>(name: string): T {
            const store = stores.get(name);
            if (!store) {
                throw new Error(`[PhilAlpine] Store "${name}" not found`);
            }
            return store();
        },

        $watch<T>(getter: () => T, callback: (value: T, oldValue: T) => void): () => void {
            let oldValue: T;
            return effect(() => {
                const newValue = getter();
                if (oldValue !== undefined) {
                    callback(newValue, oldValue);
                }
                oldValue = newValue;
            });
        },

        async $nextTick(callback: () => void): Promise<void> {
            await new Promise((resolve) => requestAnimationFrame(resolve));
            callback();
        },

        $dispatch(event: string, detail?: any): void {
            el.dispatchEvent(new CustomEvent(event, {
                detail,
                bubbles: true,
                composed: true,
            }));
        },

        $id(name: string, key?: string | number): string {
            const base = `${name}-${++idCounter}`;
            return key !== undefined ? `${base}-${key}` : base;
        },
    };

    elementContexts.set(el, context);
    return context;
}

function initializeElement(el: HTMLElement, parentData: Record<string, any> = {}): void {
    // Check for x-ignore
    if (el.hasAttribute('x-ignore')) {
        return;
    }

    // Get directives
    const directives: AlpineDirective[] = [];
    for (const attr of Array.from(el.attributes)) {
        const directive = parseDirective(attr);
        if (directive) {
            directives.push(directive);
        }
    }

    // Check for x-data
    const xData = directives.find((d) => d.name === 'data');
    let data = parentData;

    if (xData) {
        let componentData: AlpineComponent;

        if (xData.expression.trim() === '' || xData.expression === '{}') {
            componentData = {};
        } else {
            // Check if it's a registered component
            const componentFactory = components.get(xData.expression.trim());
            if (componentFactory) {
                componentData = componentFactory();
            } else {
                componentData = evaluateExpression(xData.expression, { ...parentData, $store: (name: string) => stores.get(name)?.() }) || {};
            }
        }

        data = createReactiveProxy({ ...parentData, ...componentData });
    }

    // Create context
    const context = createContext(el, data);

    // Process directives (in order of priority)
    const directiveOrder = ['data', 'ref', 'cloak', 'init', 'bind', 'on', 'model', 'text', 'html', 'show', 'if', 'for', 'effect', 'transition', 'teleport'];

    const sortedDirectives = [...directives].sort((a, b) => {
        const aIndex = directiveOrder.indexOf(a.name);
        const bIndex = directiveOrder.indexOf(b.name);
        return (aIndex === -1 ? 100 : aIndex) - (bIndex === -1 ? 100 : bIndex);
    });

    for (const directive of sortedDirectives) {
        const handler = directiveHandlers[directive.name] || customDirectives.get(directive.name);
        if (handler) {
            handler(el, directive, context, (cleanup) => addCleanup(el, cleanup));
        }
    }

    // Initialize children (unless x-if or x-for)
    if (!directives.some((d) => d.name === 'if' || d.name === 'for')) {
        for (const child of Array.from(el.children)) {
            initializeElement(child as HTMLElement, data);
        }
    }

    // Call init if present
    if (data.init && typeof data.init === 'function') {
        data.init();
    }
}

function destroyElement(el: HTMLElement): void {
    // Run cleanups
    runCleanups(el);

    // Get data
    const context = elementContexts.get(el);
    if (context && context.$data.destroy && typeof context.$data.destroy === 'function') {
        context.$data.destroy();
    }

    // Destroy children
    for (const child of Array.from(el.children)) {
        destroyElement(child as HTMLElement);
    }

    elementContexts.delete(el);
}

// ============================================================================
// MAIN CLASS
// ============================================================================

export class PhilAlpine {
    private static started = false;
    private static observer: MutationObserver | null = null;

    /**
     * Register a component factory
     */
    static data(name: string, factory: () => AlpineComponent): void {
        components.set(name, factory);
    }

    /**
     * Register or access a global store
     */
    static store<T>(name: string, value?: T): Signal<T> | T {
        if (arguments.length === 1) {
            const store = stores.get(name);
            if (!store) {
                throw new Error(`[PhilAlpine] Store "${name}" not found`);
            }
            return store();
        }

        const store = signal(value as T);
        stores.set(name, store);
        return store;
    }

    /**
     * Register a custom directive
     */
    static directive(name: string, handler: DirectiveHandler): void {
        customDirectives.set(name, handler);
    }

    /**
     * Register a magic property
     */
    static magic(name: string, callback: (el: HTMLElement, context: AlpineContext) => any): void {
        // Magics are handled through the context object
        // This is a simplified implementation
        console.log(`[PhilAlpine] Registered magic: $${name}`);
    }

    /**
     * Register a plugin
     */
    static plugin(plugin: AlpinePlugin): void {
        plugins.push(plugin);
        if (PhilAlpine.started) {
            plugin(PhilAlpine);
        }
    }

    /**
     * Start Alpine
     */
    static start(): void {
        if (PhilAlpine.started) return;
        PhilAlpine.started = true;

        // Run plugins
        plugins.forEach((plugin) => plugin(PhilAlpine));

        // Initialize existing elements
        document.querySelectorAll('[x-data]').forEach((el) => {
            initializeElement(el as HTMLElement);
        });

        // Watch for new elements
        PhilAlpine.observer = new MutationObserver((mutations) => {
            for (const mutation of mutations) {
                // Handle added nodes
                for (const node of Array.from(mutation.addedNodes)) {
                    if (node instanceof HTMLElement) {
                        if (node.hasAttribute('x-data')) {
                            initializeElement(node);
                        } else {
                            node.querySelectorAll('[x-data]').forEach((el) => {
                                initializeElement(el as HTMLElement);
                            });
                        }
                    }
                }

                // Handle removed nodes
                for (const node of Array.from(mutation.removedNodes)) {
                    if (node instanceof HTMLElement) {
                        destroyElement(node);
                    }
                }
            }
        });

        PhilAlpine.observer.observe(document.body, {
            childList: true,
            subtree: true,
        });
    }

    /**
     * Stop Alpine and cleanup
     */
    static stop(): void {
        if (!PhilAlpine.started) return;

        // Stop observing
        PhilAlpine.observer?.disconnect();
        PhilAlpine.observer = null;

        // Cleanup all elements
        document.querySelectorAll('[x-data]').forEach((el) => {
            destroyElement(el as HTMLElement);
        });

        PhilAlpine.started = false;
    }

    /**
     * Initialize a specific element
     */
    static initTree(el: HTMLElement): void {
        if (el.hasAttribute('x-data')) {
            initializeElement(el);
        } else {
            el.querySelectorAll('[x-data]').forEach((child) => {
                initializeElement(child as HTMLElement);
            });
        }
    }

    /**
     * Destroy a specific element
     */
    static destroyTree(el: HTMLElement): void {
        destroyElement(el);
    }

    /**
     * Evaluate an expression in context
     */
    static evaluate<T>(el: HTMLElement, expression: string): T {
        const context = elementContexts.get(el);
        if (!context) {
            throw new Error('[PhilAlpine] Element not initialized');
        }
        return evaluateExpression(expression, context.$data) as T;
    }

    /**
     * Get element data
     */
    static $data<T>(el: HTMLElement): T {
        const context = elementContexts.get(el);
        if (!context) {
            throw new Error('[PhilAlpine] Element not initialized');
        }
        return context.$data as T;
    }

    /**
     * Bind a reactive value
     */
    static bind(el: HTMLElement, name: string, value: () => any): void {
        effect(() => {
            const val = value();
            if (val === false || val === null || val === undefined) {
                el.removeAttribute(name);
            } else if (val === true) {
                el.setAttribute(name, '');
            } else {
                el.setAttribute(name, String(val));
            }
        });
    }

    /**
     * Reactive effect
     */
    static effect(callback: () => void): () => void {
        return effect(callback);
    }

    /**
     * Batch updates
     */
    static batch(callback: () => void): void {
        batch(callback);
    }

    /**
     * Create a reactive signal
     */
    static reactive<T>(value: T): Signal<T> {
        return signal(value);
    }

    /**
     * Get version
     */
    static get version(): string {
        return '1.0.0';
    }
}

// ============================================================================
// UTILITIES
// ============================================================================

/**
 * x-cloak CSS
 */
export const cloakStyle = `
[x-cloak] { display: none !important; }
`;

/**
 * Add cloak style to document
 */
export function addCloakStyle(): void {
    if (typeof document === 'undefined') return;

    const style = document.createElement('style');
    style.textContent = cloakStyle;
    document.head.appendChild(style);
}

/**
 * Create an Alpine component
 */
export function defineComponent<T extends AlpineComponent>(
    component: () => T
): () => T {
    return component;
}

/**
 * Create a store with typed access
 */
export function defineStore<T>(
    name: string,
    initialValue: T
): { get: () => T; set: (value: T) => void; subscribe: (cb: (value: T) => void) => () => void } {
    const store = signal(initialValue);
    stores.set(name, store);

    return {
        get: () => store(),
        set: (value: T) => store.set(value),
        subscribe: (cb: (value: T) => void) => {
            return effect(() => cb(store()));
        },
    };
}

/**
 * Create a plugin
 */
export function definePlugin(install: AlpinePlugin): AlpinePlugin {
    return install;
}

// ============================================================================
// AUTO-START
// ============================================================================

if (typeof window !== 'undefined') {
    // Expose globally
    (window as any).Alpine = PhilAlpine;
    (window as any).PhilAlpine = PhilAlpine;

    // Add cloak style
    addCloakStyle();

    // Auto-start on DOMContentLoaded
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            PhilAlpine.start();
        });
    } else {
        // Already loaded
        PhilAlpine.start();
    }
}

// ============================================================================
// EXPORTS
// ============================================================================

export {
    PhilAlpine,
    signal,
    computed,
    effect,
    batch,
    defineComponent,
    defineStore,
    definePlugin,
    addCloakStyle,
    cloakStyle,
    type Signal,
    type AlpineContext,
    type AlpineDirective,
    type DirectiveHandler,
    type TransitionConfig,
};

export default PhilAlpine;
