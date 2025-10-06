/**
 * Client-side hydration runtime.
 * Attaches event handlers and initializes reactivity on server-rendered HTML.
 */

import type { JSXElement, VNode } from "./jsx-runtime.js";
import { Fragment, isJSXElement } from "./jsx-runtime.js";

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
 * Attach event handlers to a DOM element.
 */
function attachEventHandlers(element: Element, props: Record<string, any>): void {
  for (const [key, value] of Object.entries(props)) {
    if (key.startsWith("on") && typeof value === "function") {
      const eventName = key.slice(2).toLowerCase();
      element.addEventListener(eventName, value);
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
    const textNode = document.createTextNode("");

    // Subscribe to signal changes if it has a subscribe method
    const update = () => {
      const value = (vnode as any)();
      textNode.textContent = value == null ? "" : String(value);
    };

    // Initial update
    update();

    // Subscribe to changes if it's a signal
    if (typeof (vnode as any).subscribe === "function") {
      (vnode as any).subscribe(update);
    }

    return textNode;
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
        element.className = value;
      } else if (key === "htmlFor") {
        (element as any).htmlFor = value;
      } else if (key === "style" && typeof value === "object") {
        Object.assign(element.style, value);
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
          const textNode = document.createTextNode("");

          const update = () => {
            const value = child();
            textNode.textContent = value == null ? "" : String(value);
          };

          update();

          if (typeof child.subscribe === "function") {
            child.subscribe(update);
          }

          element.appendChild(textNode);
        } else {
          const childNode = createDOMElement(child);
          if (childNode) element.appendChild(childNode);
        }
      });
    }

    return element;
  }

  return null;
}
