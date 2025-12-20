/**
 * Islands architecture for selective hydration with multi-framework support.
 */

// ============================================================================
// Legacy Island API (backwards compatible)
// ============================================================================

export { registerIsland, loadIsland, initIslands, Island } from "./island-loader.js";
export type { IslandModule, IslandManifest } from "./island-loader.js";

/**
 * Mount islands marked with the [island] attribute.
 * Loads component chunks on visibility or interaction.
 * @param {HTMLElement} root - Root element to search for islands
 */
export function mountIslands(root = document.body) {
  const islands = root.querySelectorAll("[island]");

  islands.forEach((el) => {
    const componentName = el.getAttribute("island") ?? "anonymous";

    const hydrate = () => {
      if (el.hasAttribute("data-hydrated")) return;
      el.setAttribute("data-hydrated", "true");
      el.dispatchEvent(
        new CustomEvent("phil:island-hydrated", {
          bubbles: false,
          detail: { name: componentName, element: el }
        })
      );
    };

    if (!("IntersectionObserver" in window)) {
      hydrate();
      return;
    }

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          hydrate();
          observer.disconnect();
        }
      });
    });

    observer.observe(el);
  });
}

/**
 * Hydrate a specific island immediately.
 * @param {HTMLElement} element - Island element to hydrate
 */
export function hydrateIsland(element: HTMLElement): void {
  const componentName = element.getAttribute("island");
  if (componentName) {
    if (!element.hasAttribute("data-hydrated")) {
      element.setAttribute("data-hydrated", "true");
      element.dispatchEvent(
        new CustomEvent("phil:island-hydrated", {
          bubbles: false,
          detail: { name: componentName, element }
        })
      );
    }
  }
}

// ============================================================================
// Multi-Framework Islands (New API)
// ============================================================================

export {
  Island as MultiFrameworkIsland,
  hydrateMultiFrameworkIsland,
  hydrateAllMultiFrameworkIslands,
  unmountIsland,
  getIsland,
  getAllIslands,
  registerIslandComponent,
  initMultiFrameworkIslands
} from "./multi-framework.js";

// ============================================================================
// Framework Adapters
// ============================================================================

export {
  // Adapter registry
  getAdapter,
  detectFramework,
  registerAdapter,
  isFrameworkSupported,
  getSupportedFrameworks,
  FRAMEWORK_ADAPTERS,

  // Individual adapters
  reactAdapter,
  vueAdapter,
  svelteAdapter,
  preactAdapter,
  solidAdapter,

  // Adapter utilities
  createReactIsland,
  createVueIsland,
  updateSvelteProps,
  getSvelteInstance,
  createSvelteStoreBridge,
  createPreactIsland,
  createPreactSignal,
  createSolidIsland,
  createSolidStore,
  createSolidResource,
  createSolidContext
} from "./adapters/index.js";

export type {
  FrameworkAdapter,
  HydrationStrategy,
  IslandProps,
  IslandMetadata,
  HydrationOptions,
  IslandRegistration,
  MultiFrameworkIslandConfig,
  ReactComponent,
  ReactModule,
  VueComponent,
  VueModule,
  SvelteComponent,
  SvelteModule,
  PreactComponent,
  PreactModule,
  SolidComponent,
  SolidModule
} from "./adapters/index.js";

// ============================================================================
// Framework Bridge (Inter-Framework Communication)
// ============================================================================

export {
  createSharedState,
  getSharedState,
  removeSharedState,
  eventBus,
  PropsNormalizer,
  createIslandBridge,
  frameworkHooks,
  debug as bridgeDebug
} from "./framework-bridge.js";

// ============================================================================
// Vite Plugin
// ============================================================================

export {
  viteMultiFramework,
  detectIslandComponents,
  createFrameworkOptimizations
} from "./vite-multi-framework.js";

export type {
  ViteMultiFrameworkOptions
} from "./vite-multi-framework.js";
