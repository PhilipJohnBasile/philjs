/**
 * PhilJS CDN Bundle
 *
 * Single-file bundle for Alpine.js-style usage.
 * No build step required - just include via CDN.
 *
 * @example
 * ```html
 * <script src="https://unpkg.com/@philjs/cdn"></script>
 * <script>
 *   const { signal, effect, html, render } = PhilJS;
 *
 *   const count = signal(0);
 *
 *   effect(() => console.log('Count:', count()));
 *
 *   render(
 *     html`<button onclick=${() => count.set(count() + 1)}>
 *       Clicked ${count} times
 *     </button>`,
 *     document.body
 *   );
 * </script>
 * ```
 *
 * @example
 * ```html
 * <!-- Using x-data style inline reactivity -->
 * <div x-data="{ count: 0 }">
 *   <button @click="count++">Clicked <span x-text="count"></span> times</button>
 * </div>
 * <script src="https://unpkg.com/@philjs/cdn"></script>
 * <script>PhilJS.init();</script>
 * ```
 */
type Cleanup = () => void;
/**
 * Create a reactive signal
 */
export declare function signal<T>(initialValue: T): Signal<T>;
export interface Signal<T> {
    (): T;
    set: (value: T | ((prev: T) => T)) => void;
    update: (fn: (prev: T) => T) => void;
    peek: () => T;
}
/**
 * Create a computed/memo value
 */
export declare function memo<T>(fn: () => T): () => T;
/**
 * Create a side effect
 */
export declare function effect(fn: () => void | Cleanup): Cleanup;
/**
 * Batch multiple updates
 */
export declare function batch<T>(fn: () => T): T;
/**
 * Run without tracking
 */
export declare function untrack<T>(fn: () => T): T;
interface TemplateResult {
    strings: TemplateStringsArray;
    values: unknown[];
    __brand: 'template';
}
/**
 * Tagged template for HTML
 */
export declare function html(strings: TemplateStringsArray, ...values: unknown[]): TemplateResult;
/**
 * Render template to element
 */
export declare function render(result: TemplateResult | string, container: Element | string): void;
/**
 * Initialize PhilJS on the document
 */
export declare function init(root?: Element): void;
/**
 * Create a store with actions
 */
export declare function createStore<T extends Record<string, any>>(initialState: T): T & {
    $subscribe: (fn: () => void) => () => void;
};
/**
 * Wait for next tick
 */
export declare function nextTick(): Promise<void>;
/**
 * Lifecycle hooks
 */
export declare function onMount(fn: () => void | (() => void)): void;
declare const PhilJS: {
    signal: typeof signal;
    memo: typeof memo;
    effect: typeof effect;
    batch: typeof batch;
    untrack: typeof untrack;
    html: typeof html;
    render: typeof render;
    init: typeof init;
    createStore: typeof createStore;
    nextTick: typeof nextTick;
    onMount: typeof onMount;
    version: string;
};
export default PhilJS;
export { PhilJS };
//# sourceMappingURL=index.d.ts.map