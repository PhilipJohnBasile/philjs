/**
 * Server-side rendering: JSX → HTML string.
 */

import type { JSXElement, VNode } from "./jsx-runtime.js";
import { Fragment, isJSXElement } from "./jsx-runtime.js";

const VOID_ELEMENTS = new Set([
  "area", "base", "br", "col", "embed", "hr", "img", "input",
  "link", "meta", "param", "source", "track", "wbr",
]);

const BOOLEAN_ATTRS = new Set([
  "checked", "selected", "disabled", "readonly", "multiple",
  "ismap", "defer", "declare", "noresize", "nowrap",
  "compact", "autoplay", "controls", "loop", "muted",
]);

/**
 * Render a JSX element to an HTML string.
 */
export function renderToString(vnode: VNode): string {
  if (vnode == null || vnode === false || vnode === true) {
    return "";
  }

  if (typeof vnode === "string") {
    return escapeHtml(vnode);
  }

  if (typeof vnode === "number") {
    return String(vnode);
  }

  if (Array.isArray(vnode)) {
    return vnode.map(renderToString).join("");
  }

  if (!isJSXElement(vnode)) {
    return "";
  }

  const { type, props } = vnode;

  // Handle Fragment
  if (type === Fragment) {
    return renderToString(props.children);
  }

  // Handle function components
  if (typeof type === "function") {
    const result = type(props);
    return renderToString(result);
  }

  // Handle HTML elements
  if (typeof type === "string") {
    return renderElement(type, props);
  }

  return "";
}

/**
 * Render an HTML element with props and children.
 */
function renderElement(tag: string, props: Record<string, any>): string {
  const { children, ...attrs } = props;
  const attrsString = renderAttrs(attrs);
  const openTag = attrsString ? `<${tag} ${attrsString}>` : `<${tag}>`;

  // Void elements don't have children or closing tags
  if (VOID_ELEMENTS.has(tag)) {
    return openTag;
  }

  const childrenString = renderToString(children);
  return `${openTag}${childrenString}</${tag}>`;
}

/**
 * Render element attributes to a string.
 */
function renderAttrs(attrs: Record<string, any>): string {
  return Object.entries(attrs)
    .filter(([key, value]) => {
      // Skip null, undefined, false
      if (value == null || value === false) return false;
      // Skip functions (event handlers - will be handled by resumability)
      if (typeof value === "function") return false;
      // Skip internal props
      if (key.startsWith("__")) return false;
      return true;
    })
    .map(([key, value]) => {
      // Convert React-style names to HTML
      const attrName = key === "className" ? "class" : key === "htmlFor" ? "for" : key;

      // Boolean attributes
      if (BOOLEAN_ATTRS.has(attrName)) {
        return value ? attrName : "";
      }

      // Style object to CSS string
      if (attrName === "style" && typeof value === "object") {
        const styleString = Object.entries(value)
          .map(([prop, val]) => {
            const cssProp = prop.replace(/[A-Z]/g, (m) => `-${m.toLowerCase()}`);
            return `${cssProp}:${val}`;
          })
          .join(";");
        return `style="${escapeAttr(styleString)}"`;
      }

      // Regular attributes
      return `${attrName}="${escapeAttr(String(value))}"`;
    })
    .filter(Boolean)
    .join(" ");
}

/**
 * Escape HTML special characters.
 */
function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/**
 * Escape attribute values.
 */
function escapeAttr(str: string): string {
  return str.replace(/&/g, "&amp;").replace(/"/g, "&quot;");
}

/**
 * Render to a readable stream (for streaming SSR).
 *
 * Note: Currently yields the complete string. Future enhancement could add
 * Suspense-aware streaming for progressive rendering of async boundaries.
 */
export async function* renderToStream(vnode: VNode): AsyncGenerator<string> {
  // Yield complete string (simple streaming)
  // Future: Could implement progressive streaming with Suspense boundaries
  yield renderToString(vnode);
}
