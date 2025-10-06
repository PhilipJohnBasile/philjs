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
export function jsx(
  type: string | Function,
  props: Record<string, any>,
  key?: string | number
): JSXElement {
  const { children, ...rest } = props || {};
  return {
    type,
    props: {
      ...rest,
      children: children !== undefined ? normalizeChildren(children) : undefined,
    },
    key,
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
export function Fragment(props: { children?: any }): JSXElement {
  return {
    type: Fragment,
    props: { children: normalizeChildren(props.children) },
  };
}

/**
 * Normalize children to always be an array.
 */
function normalizeChildren(children: any): any[] {
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
export function isJSXElement(value: any): value is JSXElement {
  return value && typeof value === "object" && "type" in value && "props" in value;
}

/**
 * Create element (alternative API, React-compatible).
 */
export function createElement(
  type: string | Function,
  props: Record<string, any> | null,
  ...children: any[]
): JSXElement {
  return jsx(type, { ...props, children }, props?.key);
}
