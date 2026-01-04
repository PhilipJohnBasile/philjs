/**
 * JSX runtime for PhilJS.
 * Supports both server-side rendering and client-side hydration.
 */
/**
 * JSX factory function (used by TypeScript/Babel transforms).
 * @param type - Element type (string for HTML elements, function for components)
 * @param props - Element properties
 * @param key - Optional key for lists
 */
export function jsx(type, props, key) {
    const { children, ...rest } = props || {};
    return {
        type,
        props: {
            ...rest,
            ...(children !== undefined && { children: normalizeChildren(children) }),
        },
        ...(key !== undefined && { key }),
    };
}
/**
 * JSX factory for elements with static children (optimization hint).
 */
export const jsxs = jsx;
/**
 * JSX factory for development mode (includes source location info).
 */
export const jsxDEV = jsx;
/**
 * Fragment component for grouping children without a wrapper.
 */
export function Fragment(props) {
    return {
        type: Fragment,
        props: { children: normalizeChildren(props.children) },
    };
}
/**
 * Normalize children to always be an array.
 */
function normalizeChildren(children) {
    if (Array.isArray(children)) {
        return children.flat(Infinity).filter((child) => child != null && child !== false);
    }
    if (children == null || children === false) {
        return [];
    }
    return [children];
}
/**
 * Check if a value is a JSX element.
 */
export function isJSXElement(value) {
    return value && typeof value === "object" && "type" in value && "props" in value;
}
/**
 * Create element (alternative API, React-compatible).
 */
export function createElement(type, props, ...children) {
    return jsx(type, { ...props, children }, props?.['key']);
}
//# sourceMappingURL=jsx-runtime.js.map