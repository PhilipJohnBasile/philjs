/**
 * PhilJS Alpine Compatibility
 *
 * Full Alpine.js-compatible directive system using PhilJS signals.
 */
import { directive, type DirectiveContext } from './directives.js';
export interface AlpineContext extends DirectiveContext {
    $nextTick: (callback: () => void) => Promise<void>;
    $watch: <T>(getter: () => T, callback: (value: T, oldValue: T) => void) => () => void;
    $store: <T>(name: string) => T | undefined;
}
/**
 * Create an Alpine-compatible context
 */
export declare function createAlpineContext(el: HTMLElement, data: Record<string, any>): AlpineContext;
/**
 * Define a global store
 */
export declare function store<T extends Record<string, any>>(name: string, initialValue: T): T;
/**
 * Get a global store
 */
export declare function getStore<T>(name: string): T | undefined;
/**
 * Define a reusable component
 */
export declare function data(name: string, factory: () => Record<string, any>): void;
/**
 * Get a component definition
 */
export declare function getData(name: string): (() => Record<string, any>) | undefined;
/**
 * Define reusable attribute bindings
 */
export declare function bind(name: string, bindings: Record<string, any>): void;
/**
 * Initialize Alpine.js compatibility
 */
export declare function initAlpine(root?: HTMLElement): void;
export declare const Alpine: {
    data: typeof data;
    store: typeof store;
    bind: typeof bind;
    start: typeof initAlpine;
    directive: typeof directive;
};
export default Alpine;
//# sourceMappingURL=alpine.d.ts.map