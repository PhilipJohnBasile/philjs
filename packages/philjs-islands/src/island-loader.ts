/**
 * Island component loader with automatic code splitting and performance optimizations.
 */

// These would normally come from philjs-core package
// For build purposes, using relative imports
export type VNode = any;
const hydrate = (vnode: VNode, container: HTMLElement) => {
  // Placeholder - actual implementation in philjs-core
  console.log("Hydrating island", container);
};

export type IslandModule = {
  default: (props: any) => VNode;
};

export type IslandManifest = {
  [key: string]: {
    /** Import path for the island component */
    import: string;
    /** Props to pass to the component */
    props?: Record<string, any>;
    /** Hydration trigger: visible, idle, immediate, interaction, or media */
    trigger?: "visible" | "idle" | "immediate" | "interaction" | "media";
    /** Media query for media trigger */
    media?: string;
    /** Priority (0-10, higher = sooner) */
    priority?: number;
    /** Intersection observer options for visible trigger */
    observerOptions?: IntersectionObserverInit;
  };
};

/**
 * Registry of island loaders.
 */
const islandLoaders = new Map<string, () => Promise<IslandModule>>();

/**
 * Cache for loaded modules to prevent duplicate loads
 */
const moduleCache = new Map<string, Promise<IslandModule>>();

/**
 * Track hydrated islands to prevent duplicate hydration
 */
const hydratedIslands = new WeakSet<Element>();

/**
 * Priority queue for deferred hydration
 */
interface PriorityQueueItem {
  element: Element;
  manifest: IslandManifest;
  priority: number;
  callback: () => void;
}

const hydrationQueue: PriorityQueueItem[] = [];

/**
 * Register an island component loader.
 */
export function registerIsland(name: string, loader: () => Promise<IslandModule>): void {
  islandLoaders.set(name, loader);
}

/**
 * Load and hydrate an island component with performance optimizations.
 */
export async function loadIsland(
  element: Element,
  manifest: IslandManifest
): Promise<void> {
  // Skip if already hydrated
  if (hydratedIslands.has(element)) {
    return;
  }

  const islandName = element.getAttribute("island");
  if (!islandName) return;

  const config = manifest[islandName];
  if (!config) {
    console.warn(`Island "${islandName}" not found in manifest`);
    return;
  }

  // Get loader for this island
  const loader = islandLoaders.get(islandName);
  if (!loader) {
    console.warn(`No loader registered for island "${islandName}"`);
    return;
  }

  // Mark as being hydrated to prevent race conditions
  hydratedIslands.add(element);

  // Performance mark start
  const perfMark = `island-load-${islandName}`;
  if (performance?.mark) {
    performance.mark(`${perfMark}-start`);
  }

  try {
    // Use module cache to prevent duplicate loads
    let modulePromise = moduleCache.get(islandName);
    if (!modulePromise) {
      modulePromise = loader();
      moduleCache.set(islandName, modulePromise);
    }

    // Load the component module
    const module = await modulePromise;
    const Component = module.default;

    if (!Component) {
      console.error(`Island "${islandName}" has no default export`);
      hydratedIslands.delete(element);
      return;
    }

    // Extract props from data attributes
    const props = extractPropsFromElement(element, config.props);

    // Create component instance
    const vnode = Component(props);

    // Hydrate the existing DOM
    hydrate(vnode, element as HTMLElement);

    // Mark as hydrated
    element.setAttribute("data-hydrated", "true");

    // Performance mark end
    if (performance?.mark && performance?.measure) {
      performance.mark(`${perfMark}-end`);
      try {
        performance.measure(perfMark, `${perfMark}-start`, `${perfMark}-end`);
      } catch {
        // Ignore measurement errors
      }
    }

    // Dispatch event
    element.dispatchEvent(
      new CustomEvent("phil:island-loaded", {
        bubbles: true,
        detail: { name: islandName, element },
      })
    );
  } catch (error) {
    console.error(`Failed to load island "${islandName}":`, error);
    element.setAttribute("data-hydration-error", "true");
    hydratedIslands.delete(element);
  }
}

/**
 * Extract props from element's data attributes.
 */
function extractPropsFromElement(
  element: Element,
  defaultProps?: Record<string, any>
): Record<string, any> {
  const props: Record<string, any> = { ...defaultProps };

  // Get props from data-props attribute (JSON)
  const propsAttr = element.getAttribute("data-props");
  if (propsAttr) {
    try {
      Object.assign(props, JSON.parse(propsAttr));
    } catch (e) {
      console.warn("Failed to parse data-props:", e);
    }
  }

  // Get individual data-prop-* attributes
  for (const attr of element.attributes) {
    if (attr.name.startsWith("data-prop-")) {
      const propName = attr.name.slice(10).replace(/-([a-z])/g, (_, c) => c.toUpperCase());
      props[propName] = parseValue(attr.value);
    }
  }

  return props;
}

/**
 * Parse a string value to its proper type.
 */
function parseValue(value: string): any {
  if (value === "true") return true;
  if (value === "false") return false;
  if (value === "null") return null;
  if (value === "undefined") return undefined;
  if (/^-?\d+$/.test(value)) return parseInt(value, 10);
  if (/^-?\d+\.\d+$/.test(value)) return parseFloat(value);
  if (value.startsWith("{") || value.startsWith("[")) {
    try {
      return JSON.parse(value);
    } catch {
      return value;
    }
  }
  return value;
}

/**
 * Initialize islands with hydration strategies and priority queue.
 */
export function initIslands(manifest: IslandManifest): void {
  const islands = document.querySelectorAll("[island]");

  // Sort islands by priority for ordered hydration
  const islandArray = Array.from(islands);
  const prioritizedIslands = islandArray.map((element) => {
    const islandName = element.getAttribute("island");
    const config = islandName ? manifest[islandName] : null;
    const priority = config?.priority ?? 5;
    return { element, config, priority };
  });

  // Sort by priority (higher first)
  prioritizedIslands.sort((a, b) => b.priority - a.priority);

  prioritizedIslands.forEach(({ element, config }) => {
    const islandName = element.getAttribute("island");
    if (!islandName || !config) return;

    const trigger = config.trigger || "visible";
    const priority = config.priority ?? 5;

    switch (trigger) {
      case "immediate":
        // Load immediately with priority
        queueHydration(element, manifest, priority, () => {
          loadIsland(element, manifest);
        });
        break;

      case "idle":
        // Load when browser is idle
        if ("requestIdleCallback" in window) {
          requestIdleCallback(() => {
            queueHydration(element, manifest, priority, () => {
              loadIsland(element, manifest);
            });
          });
        } else {
          setTimeout(() => {
            queueHydration(element, manifest, priority, () => {
              loadIsland(element, manifest);
            });
          }, 0);
        }
        break;

      case "interaction":
        // Load on first interaction
        setupInteractionTrigger(element, manifest);
        break;

      case "media":
        // Load when media query matches
        setupMediaTrigger(element, manifest, config.media);
        break;

      case "visible":
      default:
        // Load when visible in viewport
        setupVisibilityTrigger(element, manifest, config.observerOptions);
        break;
    }
  });

  // Process the hydration queue
  processHydrationQueue();
}

/**
 * Queue an island for hydration with priority
 */
function queueHydration(
  element: Element,
  manifest: IslandManifest,
  priority: number,
  callback: () => void
): void {
  hydrationQueue.push({ element, manifest, priority, callback });
}

/**
 * Process the hydration queue in priority order
 */
function processHydrationQueue(): void {
  if (hydrationQueue.length === 0) return;

  // Sort by priority (higher first)
  hydrationQueue.sort((a, b) => b.priority - a.priority);

  // Process queue with requestIdleCallback or setTimeout
  const processNext = () => {
    if (hydrationQueue.length === 0) return;

    const item = hydrationQueue.shift();
    if (item) {
      item.callback();

      // Schedule next item
      if (hydrationQueue.length > 0) {
        if ("requestIdleCallback" in window) {
          requestIdleCallback(processNext);
        } else {
          setTimeout(processNext, 0);
        }
      }
    }
  };

  if ("requestIdleCallback" in window) {
    requestIdleCallback(processNext);
  } else {
    setTimeout(processNext, 0);
  }
}

/**
 * Setup visibility-based trigger with IntersectionObserver
 */
function setupVisibilityTrigger(
  element: Element,
  manifest: IslandManifest,
  options?: IntersectionObserverInit
): void {
  if ("IntersectionObserver" in window) {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            loadIsland(entry.target, manifest);
            observer.unobserve(entry.target);
          }
        });
      },
      options || { rootMargin: "50px" } // Prefetch 50px before visible
    );
    observer.observe(element);
  } else {
    // Fallback for browsers without IntersectionObserver
    loadIsland(element, manifest);
  }
}

/**
 * Setup interaction-based trigger
 */
function setupInteractionTrigger(element: Element, manifest: IslandManifest): void {
  const events = ["click", "mouseenter", "touchstart", "focusin"];
  const loadOnInteraction = () => {
    loadIsland(element, manifest);
    // Remove all event listeners after first interaction
    events.forEach((event) => {
      element.removeEventListener(event, loadOnInteraction);
    });
  };

  events.forEach((event) => {
    element.addEventListener(event, loadOnInteraction, { once: true, passive: true });
  });
}

/**
 * Setup media query-based trigger
 */
function setupMediaTrigger(element: Element, manifest: IslandManifest, mediaQuery?: string): void {
  if (!mediaQuery) {
    console.warn("Media trigger requires a media query");
    loadIsland(element, manifest);
    return;
  }

  if ("matchMedia" in window) {
    const mql = window.matchMedia(mediaQuery);

    const checkMedia = () => {
      if (mql.matches) {
        loadIsland(element, manifest);
        // Remove listener after loading
        if (mql.removeEventListener) {
          mql.removeEventListener("change", checkMedia);
        }
      }
    };

    // Check immediately
    checkMedia();

    // Listen for changes
    if (mql.addEventListener) {
      mql.addEventListener("change", checkMedia);
    }
  } else {
    // Fallback if matchMedia not supported
    loadIsland(element, manifest);
  }
}

/**
 * Create an island wrapper component for SSR.
 */
export function Island(props: {
  name: string;
  trigger?: "visible" | "idle" | "immediate" | "interaction" | "media";
  media?: string;
  priority?: number;
  props?: Record<string, any>;
  children: VNode;
  observerOptions?: IntersectionObserverInit;
}): VNode {
  const {
    name,
    trigger = "visible",
    media,
    priority = 5,
    props: componentProps,
    children,
    observerOptions,
  } = props;

  // Serialize props as data attributes
  const dataAttrs: Record<string, string> = {
    island: name,
    "data-trigger": trigger,
    "data-priority": String(priority),
  };

  if (componentProps) {
    dataAttrs["data-props"] = JSON.stringify(componentProps);
  }

  if (media) {
    dataAttrs["data-media"] = media;
  }

  if (observerOptions) {
    dataAttrs["data-observer-options"] = JSON.stringify(observerOptions);
  }

  // Return wrapped children with island attributes
  return {
    type: "div",
    props: {
      ...dataAttrs,
      children,
    },
  } as VNode;
}

/**
 * Preload an island module without hydrating
 */
export function preloadIsland(name: string): Promise<IslandModule> | undefined {
  const loader = islandLoaders.get(name);
  if (!loader) {
    console.warn(`No loader registered for island "${name}"`);
    return undefined;
  }

  // Check cache first
  let modulePromise = moduleCache.get(name);
  if (!modulePromise) {
    modulePromise = loader();
    moduleCache.set(name, modulePromise);
  }

  return modulePromise;
}

/**
 * Prefetch islands that are likely to be needed
 */
export function prefetchIslands(names: string[]): void {
  if ("requestIdleCallback" in window) {
    requestIdleCallback(() => {
      names.forEach((name) => preloadIsland(name));
    });
  } else {
    setTimeout(() => {
      names.forEach((name) => preloadIsland(name));
    }, 0);
  }
}

/**
 * Clear the module cache (useful for hot module replacement)
 */
export function clearModuleCache(): void {
  moduleCache.clear();
}

/**
 * Get performance metrics for island loading
 */
export function getIslandMetrics(): {
  loadedIslands: number;
  cachedModules: number;
  measurements: PerformanceMeasure[];
} {
  const measurements = performance?.getEntriesByType?.("measure").filter((m) =>
    m.name.startsWith("island-load-")
  ) as PerformanceMeasure[] || [];

  return {
    loadedIslands: hydratedIslands ? 0 : 0, // WeakSet doesn't have size
    cachedModules: moduleCache.size,
    measurements,
  };
}

/**
 * Cleanup performance marks for a specific island
 */
export function cleanupIslandMetrics(name: string): void {
  const perfMark = `island-load-${name}`;
  if (performance?.clearMarks) {
    performance.clearMarks(`${perfMark}-start`);
    performance.clearMarks(`${perfMark}-end`);
  }
  if (performance?.clearMeasures) {
    performance.clearMeasures(perfMark);
  }
}