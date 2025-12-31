/**
 * PhilJS Tiny Core - Under 5KB gzipped
 *
 * Minimal reactive runtime with:
 * - Fine-grained signals
 * - Computed values
 * - Effects
 * - Basic JSX support
 *
 * This is the smallest possible PhilJS bundle for
 * size-constrained environments.
 *
 * @packageDocumentation
 */
export type Getter<T> = () => T;
export type Setter<T> = (v: T | ((prev: T) => T)) => void;
export interface TinySignal<T> extends Getter<T> {
    set: Setter<T>;
}
export type Cleanup = void | (() => void);
export type EffectFn = () => Cleanup;
/**
 * Create a reactive signal
 */
export declare function signal<T>(value: T): TinySignal<T>;
/**
 * Create a computed value
 */
export declare function computed<T>(fn: () => T): Getter<T>;
/**
 * Create an effect
 */
export declare function effect(fn: EffectFn): () => void;
/**
 * Batch multiple updates
 */
export declare function batch<T>(fn: () => T): T;
/**
 * Run without tracking
 */
export declare function untrack<T>(fn: () => T): T;
export interface TinyElement {
    type: string | ((props: any) => TinyElement | TinyElement[]);
    props: Record<string, unknown>;
    children: (TinyElement | string | number | null | undefined | (() => unknown))[];
}
/**
 * Create a JSX element
 */
export declare function h(type: string | ((props: any) => TinyElement | TinyElement[]), props: Record<string, unknown> | null, ...children: (TinyElement | string | number | null | undefined | (() => unknown))[]): TinyElement;
/**
 * Fragment
 */
export declare const Fragment: ({ children }: {
    children: TinyElement[];
}) => TinyElement[];
export declare const jsx: typeof h;
export declare const jsxs: typeof h;
export declare const jsxDEV: typeof h;
/**
 * Render a TinyElement to a DOM node
 */
export declare function render(element: TinyElement | string | number | null | undefined, container: Element): () => void;
/**
 * Reactive show/hide
 */
export declare function Show<T>(props: {
    when: Getter<T | null | undefined | false>;
    fallback?: TinyElement;
    children: TinyElement | ((value: T) => TinyElement);
}): TinyElement;
/**
 * Reactive list rendering
 */
export declare function For<T>(props: {
    each: Getter<T[]>;
    fallback?: TinyElement;
    children: (item: T, index: Getter<number>) => TinyElement;
}): TinyElement;
/**
 * Create a store (object with reactive properties)
 */
export declare function store<T extends object>(initial: T): T;
declare const _default: {
    signal: typeof signal;
    computed: typeof computed;
    effect: typeof effect;
    batch: typeof batch;
    untrack: typeof untrack;
    h: typeof h;
    jsx: typeof h;
    jsxs: typeof h;
    jsxDEV: typeof h;
    Fragment: ({ children }: {
        children: TinyElement[];
    }) => TinyElement[];
    render: typeof render;
    Show: typeof Show;
    For: typeof For;
    store: typeof store;
};
export default _default;
//# sourceMappingURL=tiny.d.ts.map