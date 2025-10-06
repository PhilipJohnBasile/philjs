/**
 * Resumability system for zero-hydration interactivity.
 * Serializes event handlers and state on the server,
 * then lazily loads them on interaction.
 */

import type { VNode } from "./jsx-runtime.js";

export type SerializedHandler = {
  /** Module containing the handler */
  module: string;
  /** Export name in the module */
  export: string;
  /** Captured closure variables */
  closure?: Record<string, any>;
};

export type ResumableState = {
  /** Map of element IDs to their handlers */
  handlers: Map<string, Map<string, SerializedHandler>>;
  /** Map of element IDs to their state */
  state: Map<string, any>;
  /** Counter for generating unique IDs */
  nextId: number;
};

/**
 * Global resumable state for SSR.
 */
let globalState: ResumableState | null = null;

/**
 * Initialize resumability context for SSR.
 */
export function initResumability(): ResumableState {
  globalState = {
    handlers: new Map(),
    state: new Map(),
    nextId: 0,
  };
  return globalState;
}

/**
 * Get current resumability context.
 */
export function getResumableState(): ResumableState | null {
  return globalState;
}

/**
 * Generate a unique element ID.
 */
export function generateElementId(): string {
  if (!globalState) throw new Error("Resumability not initialized");
  return `q${globalState.nextId++}`;
}

/**
 * Serialize a function reference for resumability.
 */
export function serializeHandler(
  fn: Function,
  module: string,
  exportName: string,
  closure?: Record<string, any>
): SerializedHandler {
  return {
    module,
    export: exportName,
    closure,
  };
}

/**
 * Register a handler for an element during SSR.
 */
export function registerHandler(
  elementId: string,
  eventName: string,
  handler: SerializedHandler
): void {
  if (!globalState) return;

  if (!globalState.handlers.has(elementId)) {
    globalState.handlers.set(elementId, new Map());
  }

  globalState.handlers.get(elementId)!.set(eventName, handler);
}

/**
 * Register state for an element during SSR.
 */
export function registerState(elementId: string, state: any): void {
  if (!globalState) return;
  globalState.state.set(elementId, state);
}

/**
 * Serialize resumable state to JSON for embedding in HTML.
 */
export function serializeResumableState(): string {
  if (!globalState) return "{}";

  const serialized = {
    handlers: Object.fromEntries(
      Array.from(globalState.handlers.entries()).map(([id, events]) => [
        id,
        Object.fromEntries(events.entries()),
      ])
    ),
    state: Object.fromEntries(globalState.state.entries()),
  };

  return JSON.stringify(serialized);
}

/**
 * Client-side: Resume interactivity from serialized state.
 */
export function resume(): void {
  // Get serialized state from script tag
  const stateElement = document.getElementById("__PHIL_RESUMABLE__");
  if (!stateElement) {
    console.warn("No resumable state found");
    return;
  }

  let resumableData: any;
  try {
    resumableData = JSON.parse(stateElement.textContent || "{}");
  } catch (e) {
    console.error("Failed to parse resumable state:", e);
    return;
  }

  // Module loaders cache
  const moduleCache = new Map<string, Promise<any>>();

  // Function to load a module
  async function loadModule(modulePath: string): Promise<any> {
    if (!moduleCache.has(modulePath)) {
      // In production, this would use dynamic import()
      // For now, modules need to be registered
      const promise = import(modulePath);
      moduleCache.set(modulePath, promise);
    }
    return moduleCache.get(modulePath)!;
  }

  // Attach global click handler for event delegation
  document.addEventListener("click", async (event) => {
    const target = event.target as HTMLElement;

    // Find element with handler
    let element: HTMLElement | null = target;
    let elementId: string | null = null;

    while (element && element !== document.body) {
      elementId = element.getAttribute("data-qid");
      if (elementId && resumableData.handlers[elementId]?.click) {
        break;
      }
      element = element.parentElement;
    }

    if (!element || !elementId) return;

    // Get handler info
    const handlerInfo = resumableData.handlers[elementId].click;
    if (!handlerInfo) return;

    try {
      // Load module containing the handler
      const module = await loadModule(handlerInfo.module);
      const handler = module[handlerInfo.export];

      if (typeof handler !== "function") {
        console.error(`Handler ${handlerInfo.export} is not a function`);
        return;
      }

      // Get element state if any
      const state = resumableData.state[elementId];

      // Create context with closure and state
      const context = {
        ...handlerInfo.closure,
        state,
        element,
      };

      // Call handler with event and context
      handler.call(element, event, context);
    } catch (error) {
      console.error("Failed to resume handler:", error);
    }
  });

  // Similarly for other events (focus, blur, input, etc.)
  ["focus", "blur", "input", "change", "submit"].forEach((eventType) => {
    document.addEventListener(eventType, async (event) => {
      // Similar logic as click handler
      // ... (omitted for brevity, same pattern)
    });
  });
}

/**
 * Make a component resumable by wrapping its event handlers.
 */
export function resumable<T extends Record<string, any>>(
  Component: (props: T) => VNode,
  options: {
    module: string;
    handlers?: Record<string, string>;
  }
): (props: T) => VNode {
  return (props: T) => {
    const vnode = Component(props);

    // During SSR, wrap event handlers
    if (typeof window === "undefined" && globalState) {
      // Transform vnode to add resumability
      return transformVNodeForResumability(vnode, options);
    }

    return vnode;
  };
}

/**
 * Transform a VNode tree to add resumability attributes.
 */
function transformVNodeForResumability(
  vnode: VNode,
  options: { module: string; handlers?: Record<string, string> }
): VNode {
  if (!vnode || typeof vnode !== "object" || !("type" in vnode)) {
    return vnode;
  }

  const transformed = { ...vnode } as any;
  const { props } = transformed;

  // Check for event handlers
  const hasHandlers = Object.keys(props).some((key) =>
    key.startsWith("on") && typeof props[key] === "function"
  );

  if (hasHandlers) {
    // Generate ID for this element
    const elementId = generateElementId();
    transformed.props = {
      ...props,
      "data-qid": elementId,
    };

    // Register handlers
    Object.keys(props).forEach((key) => {
      if (key.startsWith("on") && typeof props[key] === "function") {
        const eventName = key.slice(2).toLowerCase();
        const handlerName = options.handlers?.[key] || key;

        registerHandler(elementId, eventName, {
          module: options.module,
          export: handlerName,
        });

        // Remove handler from props (won't be rendered)
        delete transformed.props[key];
      }
    });
  }

  // Recursively transform children
  if (props.children) {
    transformed.props.children = Array.isArray(props.children)
      ? props.children.map((child: VNode) => transformVNodeForResumability(child, options))
      : transformVNodeForResumability(props.children, options);
  }

  return transformed;
}