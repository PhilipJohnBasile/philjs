/**
 * JSX runtime for PhilJS.
 * Supports both server-side rendering and client-side hydration.
 */
export type JSXElement = {
    type: string | Function;
    props: Record<string, any>;
    key?: string | number;
};
export type VNode = JSXElement | string | number | boolean | null | undefined;
/**
 * JSX factory function (used by TypeScript/Babel transforms).
 * @param type - Element type (string for HTML elements, function for components)
 * @param props - Element properties
 * @param key - Optional key for lists
 */
export declare function jsx(type: string | Function, props: Record<string, any>, key?: string | number): JSXElement;
/**
 * JSX factory for elements with static children (optimization hint).
 */
export declare const jsxs: typeof jsx;
/**
 * JSX factory for development mode (includes source location info).
 */
export declare const jsxDEV: typeof jsx;
/**
 * Fragment component for grouping children without a wrapper.
 */
export declare function Fragment(props: {
    children?: any;
}): JSXElement;
/**
 * Check if a value is a JSX element.
 */
export declare function isJSXElement(value: any): value is JSXElement;
/**
 * Create element (alternative API, React-compatible).
 */
export declare function createElement(type: string | Function, props: Record<string, any> | null, ...children: any[]): JSXElement;
declare global {
    namespace JSX {
        type Element = JSXElement;
        interface IntrinsicAttributes {
            key?: string | number;
        }
        interface ElementChildrenAttribute {
            children?: unknown;
        }
        interface IntrinsicElements {
            [elemName: string]: Record<string, any>;
        }
    }
}
//# sourceMappingURL=jsx-runtime.d.ts.map