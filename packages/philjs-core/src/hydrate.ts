/**
 * Client-side hydration runtime.
 * Attaches event handlers and initializes reactivity on server-rendered HTML.
 */

import type { JSXElement, VNode } from "./jsx-runtime.js";
import { Fragment, isJSXElement } from "./jsx-runtime.js";
import { effect } from "./signals.js";

type HydrationContext = {
  /** Current DOM node being hydrated */
  currentNode: Node | null;
  /** Parent element for text nodes */
  parentElement: Element | null;
};

/**
 * Hydrate a server-rendered DOM tree with interactivity.
 * @param vnode - The JSX element to hydrate
 * @param container - The DOM container that was server-rendered
 */
export function hydrate(vnode: VNode, container: Element): void {
  const ctx: HydrationContext = {
    currentNode: container.firstChild,
    parentElement: container,
  };

  hydrateNode(vnode, ctx);
}

/**
 * Hydrate a single node.
 */
function hydrateNode(vnode: VNode, ctx: HydrationContext): void {
  if (vnode == null || vnode === false || vnode === true) {
    return;
  }

  // Text nodes and numbers
  if (typeof vnode === "string" || typeof vnode === "number") {
    // Skip to next sibling (text already rendered)
    if (ctx.currentNode) {
      ctx.currentNode = ctx.currentNode.nextSibling;
    }
    return;
  }

  // Arrays
  if (Array.isArray(vnode)) {
    vnode.forEach((child) => hydrateNode(child, ctx));
    return;
  }

  if (!isJSXElement(vnode)) {
    return;
  }

  const { type, props } = vnode;

  // Handle Fragment
  if (type === Fragment) {
    hydrateNode(props.children, ctx);
    return;
  }

  // Handle function components
  if (typeof type === "function") {
    const result = type(props);
    hydrateNode(result, ctx);
    return;
  }

  // Handle HTML elements
  if (typeof type === "string") {
    const element = ctx.currentNode as Element;

    if (!element || element.nodeName.toLowerCase() !== type.toLowerCase()) {
      console.warn(`Hydration mismatch: expected ${type}, got ${element?.nodeName}`);
      return;
    }

    // Attach event handlers
    attachEventHandlers(element, props);

    // Hydrate children
    if (props.children) {
      const childCtx: HydrationContext = {
        currentNode: element.firstChild,
        parentElement: element,
      };
      hydrateNode(props.children, childCtx);
    }

    // Move to next sibling
    ctx.currentNode = element.nextSibling;
  }
}

/**
 * Attach event handlers and reactive attributes to a DOM element.
 */
function attachEventHandlers(element: Element, props: Record<string, any>): void {
  for (const [key, value] of Object.entries(props)) {
    if (key === "children") continue;

    if (key.startsWith("on") && typeof value === "function") {
      const eventName = key.slice(2).toLowerCase();
      element.addEventListener(eventName, value);
    } else if (key === "style") {
      // Handle reactive style
      if (typeof value === "function") {
        const update = () => {
          const styleValue = value();
          if (typeof styleValue === "object") {
            Object.assign((element as HTMLElement).style, styleValue);
          } else if (typeof styleValue === "string") {
            (element as HTMLElement).setAttribute("style", styleValue);
          }
        };
        update();
        if (typeof value.subscribe === "function") {
          value.subscribe(update);
        }
      }
    } else if (key === "class" || key === "className") {
      // Handle reactive class
      if (typeof value === "function") {
        const update = () => {
          const className = value();
          element.className = className || "";
        };
        update();
        if (typeof value.subscribe === "function") {
          value.subscribe(update);
        }
      }
    } else if (typeof value === "function") {
      // Handle any other reactive attribute
      const update = () => {
        const attrValue = value();
        if (attrValue == null || attrValue === false) {
          element.removeAttribute(key);
        } else if (attrValue === true) {
          element.setAttribute(key, "");
        } else {
          element.setAttribute(key, String(attrValue));
        }
      };
      update();
      if (typeof value.subscribe === "function") {
        value.subscribe(update);
      }
    }
  }
}

/**
 * Create a client-side element (for client-only components).
 */
export function render(vnode: VNode, container: Element): void {
  // Clear container
  container.innerHTML = "";

  // Create and append new elements
  const result = createDOMElement(vnode);
  if (result) {
    if (result instanceof DocumentFragment) {
      container.appendChild(result);
    } else {
      container.appendChild(result);
    }
  }
}

/**
 * Create a DOM element from a VNode.
 */
function createDOMElement(vnode: VNode): Node | null {
  if (vnode == null || vnode === false || vnode === true) {
    return null;
  }

  if (typeof vnode === "string") {
    return document.createTextNode(vnode);
  }

  if (typeof vnode === "number") {
    return document.createTextNode(String(vnode));
  }

  if (Array.isArray(vnode)) {
    const fragment = document.createDocumentFragment();
    vnode.forEach((child) => {
      const node = createDOMElement(child);
      if (node) fragment.appendChild(node);
    });
    return fragment;
  }

  if (!isJSXElement(vnode)) {
    return null;
  }

  const { type, props } = vnode;

  // Handle Fragment
  if (type === Fragment) {
    return createDOMElement(props.children);
  }

  // Handle function components
  if (typeof type === "function") {
    const result = type(props);
    return createDOMElement(result);
  }

  // Handle functions as reactive values (signals/computations)
  if (typeof vnode === "function") {
    return createDynamicNode(vnode as () => any);
  }

  // Handle HTML elements
  if (typeof type === "string") {
    const element = document.createElement(type);

    // Set attributes and event handlers
    for (const [key, value] of Object.entries(props)) {
      if (key === "children") continue;

      if (key.startsWith("on") && typeof value === "function") {
        const eventName = key.slice(2).toLowerCase();
        element.addEventListener(eventName, value);
      } else if (key === "className") {
        if (typeof value === "function") {
          // Reactive className
          const update = () => {
            element.className = value() || "";
          };
          update();
          if (typeof value.subscribe === "function") {
            value.subscribe(update);
          }
        } else {
          element.className = value;
        }
      } else if (key === "class") {
        if (typeof value === "function") {
          // Reactive class
          const update = () => {
            element.className = value() || "";
          };
          update();
          if (typeof value.subscribe === "function") {
            value.subscribe(update);
          }
        } else {
          element.className = value;
        }
      } else if (key === "htmlFor") {
        (element as any).htmlFor = value;
      } else if (key === "style") {
        if (typeof value === "function") {
          // Reactive style
          const update = () => {
            const styleValue = value();
            if (typeof styleValue === "object") {
              Object.assign(element.style, styleValue);
            } else if (typeof styleValue === "string") {
              element.setAttribute("style", styleValue);
            }
          };
          update();
          if (typeof value.subscribe === "function") {
            value.subscribe(update);
          }
        } else if (typeof value === "object") {
          Object.assign(element.style, value);
        } else if (typeof value === "string") {
          element.setAttribute("style", value);
        }
      } else if (typeof value === "function") {
        // Reactive attribute
        const update = () => {
          const attrValue = value();
          if (attrValue == null || attrValue === false) {
            element.removeAttribute(key);
          } else if (attrValue === true) {
            element.setAttribute(key, "");
          } else {
            element.setAttribute(key, String(attrValue));
          }
        };
        update();
        if (typeof value.subscribe === "function") {
          value.subscribe(update);
        }
      } else if (typeof value === "boolean") {
        if (value) element.setAttribute(key, "");
      } else if (value != null && !key.startsWith("__")) {
        element.setAttribute(key, String(value));
      }
    }

    // Append children
    if (props.children) {
      const children = Array.isArray(props.children) ? props.children : [props.children];
      children.forEach((child: any) => {
        // Handle functions (signals/computations) as children
        if (typeof child === "function") {
          const dynamic = createDynamicNode(child);
          element.appendChild(dynamic);
          return;
        }

        const childNode = createDOMElement(child);
        if (childNode) element.appendChild(childNode);
      });
    }

    return element;
  }

  return null;
}

/**
 * Create a reactive DOM range that updates when the accessor changes.
 */
function createDynamicNode(accessor: (() => any) & { subscribe?: (fn: () => void) => void | (() => void) }): Node {
  const fragment = document.createDocumentFragment();
  const startMarker = document.createComment("philjs:dynamic-start");
  const endMarker = document.createComment("philjs:dynamic-end");
  fragment.appendChild(startMarker);
  fragment.appendChild(endMarker);

  let currentNodes: Node[] = [];

  const clearCurrent = () => {
    currentNodes.forEach((node) => {
      // Call nested disposal hooks if present
      if (node instanceof Comment && (node as any).__philjs_dispose) {
        (node as any).__philjs_dispose();
      }
      if (node.parentNode) {
        node.parentNode.removeChild(node);
      }
    });
    currentNodes = [];
  };

  const update = () => {
    const parent = startMarker.parentNode;
    if (!parent) return;

    clearCurrent();

    const value = accessor();
    const nextNodes = normalizeToNodes(value);
    nextNodes.forEach((node) => {
      parent.insertBefore(node, endMarker);
    });
    currentNodes = nextNodes;
  };

  update();

  if (typeof accessor.subscribe === "function") {
    const dispose = accessor.subscribe(update);
    if (typeof dispose === "function") {
      (endMarker as any).__philjs_dispose = dispose;
    }
  } else {
    const dispose = effect(() => {
      update();
    });
    (endMarker as any).__philjs_dispose = dispose;
  }

  return fragment;
}

/**
 * Normalize dynamic values (strings, numbers, JSX, arrays) into DOM nodes.
 */
function normalizeToNodes(value: any): Node[] {
  if (value == null || value === false) {
    return [];
  }

  if (Array.isArray(value)) {
    const nodes: Node[] = [];
    value.forEach((child) => {
      nodes.push(...normalizeToNodes(child));
    });
    return nodes;
  }

  if (value instanceof DocumentFragment) {
    return Array.from(value.childNodes);
  }

  if (value instanceof Node) {
    return [value];
  }

  if (typeof value === "function") {
    return normalizeToNodes(value());
  }

  if (isJSXElement(value)) {
    const node = createDOMElement(value);
    if (!node) return [];
    if (node instanceof DocumentFragment) {
      return Array.from(node.childNodes);
    }
    return [node];
  }

  return [document.createTextNode(String(value))];
}
