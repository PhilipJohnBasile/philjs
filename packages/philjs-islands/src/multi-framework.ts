/**
 * Multi-Framework Island Component
 * Astro-style component that can render any framework in an island
 */

import {
  getAdapter,
  detectFramework,
  type FrameworkAdapter,
  type HydrationStrategy,
  type IslandProps,
  type HydrationOptions,
  type MultiFrameworkIslandConfig
} from './adapters/index.js';

/**
 * Island registry to track all islands on the page
 */
const islandRegistry = new Map<string, IslandInstance>();

/**
 * Island instance tracking
 */
interface IslandInstance {
  id: string;
  element: HTMLElement;
  framework: string;
  component: any;
  props: IslandProps;
  adapter: FrameworkAdapter;
  hydrated: boolean;
  strategy: HydrationStrategy;
}

/**
 * Multi-framework Island component for SSR
 * This is the main component used in PhilJS templates
 *
 * @example
 * ```tsx
 * <Island framework="react" component={Counter} props={{ initial: 0 }} hydration={{ strategy: 'visible' }}>
 *   <Counter initial={0} />
 * </Island>
 * ```
 */
export function Island(config: MultiFrameworkIslandConfig): string {
  const {
    framework,
    component,
    props = {},
    hydration = {},
    children,
    fallback,
    loading
  } = config;

  // Generate unique island ID
  const id = generateIslandId();

  // Get framework adapter
  let adapter: FrameworkAdapter | undefined;

  if (framework === 'auto') {
    adapter = detectFramework(component);
    if (!adapter) {
      console.error('[PhilJS Islands] Failed to auto-detect framework for component:', component);
      return `<!-- Island ${id}: Framework detection failed -->`;
    }
  } else {
    adapter = getAdapter(framework);
    if (!adapter) {
      console.error(`[PhilJS Islands] Unsupported framework: ${framework}`);
      return `<!-- Island ${id}: Unsupported framework ${framework} -->`;
    }
  }

  // Serialize props for client-side hydration
  const serializedProps = adapter.serializeProps(props);

  // Build data attributes
  const strategy = hydration.strategy || 'visible';
  const dataAttrs = [
    `data-island="${id}"`,
    `data-framework="${adapter.name}"`,
    `data-component="${component.name || 'Anonymous'}"`,
    `data-strategy="${strategy}"`,
    `data-props="${escapeHtml(serializedProps)}"`,
    hydration.priority ? `data-priority="${hydration.priority}"` : '',
    hydration.media ? `data-media="${hydration.media}"` : '',
    hydration.timeout ? `data-timeout="${hydration.timeout}"` : '',
    hydration.rootMargin ? `data-root-margin="${hydration.rootMargin}"` : '',
    hydration.threshold ? `data-threshold="${hydration.threshold}"` : '',
    hydration.events ? `data-events="${hydration.events.join(',')}"` : ''
  ].filter(Boolean).join(' ');

  // Render the island container
  // In production, this would be server-rendered with actual content
  return `<div ${dataAttrs} data-server-rendered="true">
    ${children || '<!-- Island content will be hydrated -->'}
  </div>`;
}

/**
 * Client-side island hydration
 * Hydrates a single island element
 */
export async function hydrateMultiFrameworkIsland(element: HTMLElement): Promise<void> {
  const id = element.getAttribute('data-island');
  const frameworkName = element.getAttribute('data-framework');
  const componentName = element.getAttribute('data-component');
  const strategy = element.getAttribute('data-strategy') as HydrationStrategy || 'visible';
  const serializedProps = element.getAttribute('data-props') || '{}';

  if (!id || !frameworkName) {
    console.warn('[PhilJS Islands] Island missing required attributes');
    return;
  }

  // Check if already hydrated
  if (islandRegistry.has(id)) {
    return;
  }

  // Get framework adapter
  const adapter = getAdapter(frameworkName);
  if (!adapter) {
    console.error(`[PhilJS Islands] Unsupported framework: ${frameworkName}`);
    return;
  }

  try {
    // Deserialize props
    const props = adapter.deserializeProps(serializedProps);

    // Get component from registry or global
    const component = await loadIslandComponent(frameworkName, componentName || '');

    if (!component) {
      console.error(`[PhilJS Islands] Component not found: ${componentName}`);
      return;
    }

    // Hydrate the component
    await adapter.hydrate(element, component, props, strategy);

    // Register island instance
    islandRegistry.set(id, {
      id,
      element,
      framework: frameworkName,
      component,
      props,
      adapter,
      hydrated: true,
      strategy
    });

    console.log(`[PhilJS Islands] Hydrated ${frameworkName} island: ${componentName}`);
  } catch (error) {
    console.error(`[PhilJS Islands] Failed to hydrate island ${id}:`, error);
  }
}

/**
 * Hydrate all islands on the page based on their strategies
 */
export function hydrateAllMultiFrameworkIslands(root: HTMLElement = document.body): void {
  const islands = root.querySelectorAll<HTMLElement>('[data-island]');

  islands.forEach(island => {
    const strategy = island.getAttribute('data-strategy') as HydrationStrategy || 'visible';
    const priority = parseInt(island.getAttribute('data-priority') || '0', 10);

    switch (strategy) {
      case 'immediate':
        hydrateMultiFrameworkIsland(island);
        break;

      case 'visible':
        hydrateOnVisible(island);
        break;

      case 'idle':
        hydrateOnIdle(island);
        break;

      case 'interaction':
        hydrateOnInteraction(island);
        break;

      case 'media':
        hydrateOnMedia(island);
        break;

      case 'manual':
        // Don't hydrate automatically
        break;

      default:
        console.warn(`[PhilJS Islands] Unknown hydration strategy: ${strategy}`);
        hydrateMultiFrameworkIsland(island);
    }
  });
}

/**
 * Hydrate island when it becomes visible
 */
function hydrateOnVisible(element: HTMLElement): void {
  const rootMargin = element.getAttribute('data-root-margin') || '0px';
  const threshold = parseFloat(element.getAttribute('data-threshold') || '0');

  if (!('IntersectionObserver' in window)) {
    // Fallback: hydrate immediately if IntersectionObserver not supported
    hydrateMultiFrameworkIsland(element);
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          hydrateMultiFrameworkIsland(element);
          observer.disconnect();
        }
      });
    },
    { rootMargin, threshold }
  );

  observer.observe(element);
}

/**
 * Hydrate island when browser is idle
 */
function hydrateOnIdle(element: HTMLElement): void {
  const timeout = parseInt(element.getAttribute('data-timeout') || '2000', 10);

  if ('requestIdleCallback' in window) {
    requestIdleCallback(() => {
      hydrateMultiFrameworkIsland(element);
    }, { timeout });
  } else {
    // Fallback: use setTimeout
    setTimeout(() => {
      hydrateMultiFrameworkIsland(element);
    }, timeout);
  }
}

/**
 * Hydrate island on user interaction
 */
function hydrateOnInteraction(element: HTMLElement): void {
  const eventsAttr = element.getAttribute('data-events');
  const events = eventsAttr ? eventsAttr.split(',') : ['click', 'touchstart', 'mouseenter'];

  const hydrate = () => {
    hydrateMultiFrameworkIsland(element);
    // Remove event listeners after hydration
    events.forEach(event => {
      element.removeEventListener(event, hydrate);
    });
  };

  // Add event listeners
  events.forEach(event => {
    element.addEventListener(event, hydrate, { once: true, passive: true });
  });
}

/**
 * Hydrate island based on media query
 */
function hydrateOnMedia(element: HTMLElement): void {
  const mediaQuery = element.getAttribute('data-media');

  if (!mediaQuery) {
    console.warn('[PhilJS Islands] Media strategy requires data-media attribute');
    hydrateMultiFrameworkIsland(element);
    return;
  }

  if (!window.matchMedia) {
    // Fallback: hydrate immediately if matchMedia not supported
    hydrateMultiFrameworkIsland(element);
    return;
  }

  const mql = window.matchMedia(mediaQuery);

  const checkMedia = () => {
    if (mql.matches) {
      hydrateMultiFrameworkIsland(element);
      mql.removeEventListener('change', checkMedia);
    }
  };

  // Check immediately
  if (mql.matches) {
    hydrateMultiFrameworkIsland(element);
  } else {
    // Listen for changes
    mql.addEventListener('change', checkMedia);
  }
}

/**
 * Unmount an island
 */
export async function unmountIsland(id: string): Promise<void> {
  const instance = islandRegistry.get(id);
  if (!instance) {
    console.warn(`[PhilJS Islands] Island not found: ${id}`);
    return;
  }

  try {
    await instance.adapter.unmount(instance.element);
    islandRegistry.delete(id);
    console.log(`[PhilJS Islands] Unmounted island: ${id}`);
  } catch (error) {
    console.error(`[PhilJS Islands] Failed to unmount island ${id}:`, error);
  }
}

/**
 * Get island instance by ID
 */
export function getIsland(id: string): IslandInstance | undefined {
  return islandRegistry.get(id);
}

/**
 * Get all island instances
 */
export function getAllIslands(): IslandInstance[] {
  return Array.from(islandRegistry.values());
}

/**
 * Component loader registry
 */
const componentLoaders = new Map<string, Map<string, () => Promise<any>>>();

/**
 * Register a component loader for a framework
 */
export function registerIslandComponent(
  framework: string,
  componentName: string,
  loader: () => Promise<any>
): void {
  if (!componentLoaders.has(framework)) {
    componentLoaders.set(framework, new Map());
  }

  componentLoaders.get(framework)!.set(componentName, loader);
}

/**
 * Load a component for an island
 */
async function loadIslandComponent(framework: string, componentName: string): Promise<any> {
  const frameworkLoaders = componentLoaders.get(framework);
  if (!frameworkLoaders) {
    console.error(`[PhilJS Islands] No component loaders registered for framework: ${framework}`);
    return null;
  }

  const loader = frameworkLoaders.get(componentName);
  if (!loader) {
    console.error(`[PhilJS Islands] Component loader not found: ${framework}/${componentName}`);
    return null;
  }

  try {
    const module = await loader();
    return module.default || module;
  } catch (error) {
    console.error(`[PhilJS Islands] Failed to load component ${framework}/${componentName}:`, error);
    return null;
  }
}

/**
 * Generate unique island ID
 */
let islandCounter = 0;
function generateIslandId(): string {
  return `island-${Date.now()}-${++islandCounter}`;
}

/**
 * Escape HTML for safe attribute values
 */
function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Initialize multi-framework islands on page load
 */
export function initMultiFrameworkIslands(root?: HTMLElement): void {
  if (typeof window === 'undefined') {
    return; // Server-side, skip initialization
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      hydrateAllMultiFrameworkIslands(root);
    });
  } else {
    hydrateAllMultiFrameworkIslands(root);
  }
}

// Auto-initialize if script is loaded
if (typeof window !== 'undefined' && typeof document !== 'undefined') {
  initMultiFrameworkIslands();
}
