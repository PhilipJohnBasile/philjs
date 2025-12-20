/**
 * Type definitions for framework adapters
 */

/**
 * Hydration strategy determines when and how an island should be hydrated
 */
export type HydrationStrategy =
  | 'immediate'    // Hydrate immediately on page load
  | 'visible'      // Hydrate when island becomes visible (IntersectionObserver)
  | 'idle'         // Hydrate when browser is idle (requestIdleCallback)
  | 'interaction'  // Hydrate on user interaction (click, focus, etc.)
  | 'media'        // Hydrate based on media query
  | 'manual';      // Hydrate manually via API call

/**
 * Island props that can be passed to components
 */
export type IslandProps = Record<string, any>;

/**
 * Framework adapter interface
 * Each framework must implement this interface to support island hydration
 */
export interface FrameworkAdapter {
  /**
   * Framework name (e.g., 'react', 'vue', 'svelte')
   */
  name: string;

  /**
   * Detect if a component belongs to this framework
   * @param component - Component to test
   * @returns True if component is compatible with this framework
   */
  detect(component: any): boolean;

  /**
   * Hydrate a component into the DOM
   * @param element - DOM element to hydrate into
   * @param component - Framework component to hydrate
   * @param props - Component props
   * @param strategy - Hydration strategy
   */
  hydrate(
    element: HTMLElement,
    component: any,
    props: IslandProps,
    strategy: HydrationStrategy
  ): Promise<void>;

  /**
   * Unmount a component from the DOM
   * @param element - DOM element containing the component
   */
  unmount(element: HTMLElement): Promise<void>;

  /**
   * Serialize component props for SSR
   * @param props - Props to serialize
   * @returns Serialized props string
   */
  serializeProps(props: Record<string, any>): string;

  /**
   * Deserialize component props from SSR
   * @param serialized - Serialized props string
   * @returns Deserialized props object
   */
  deserializeProps(serialized: string): Record<string, any>;

  /**
   * Get list of required peer dependencies for this framework
   * @returns Array of package names
   */
  getPeerDependencies(): string[];
}

/**
 * Island component metadata
 */
export interface IslandMetadata {
  /**
   * Unique island ID
   */
  id: string;

  /**
   * Framework name
   */
  framework: string;

  /**
   * Component name or path
   */
  component: string;

  /**
   * Hydration strategy
   */
  strategy: HydrationStrategy;

  /**
   * Component props
   */
  props: IslandProps;

  /**
   * Whether island is hydrated
   */
  hydrated: boolean;

  /**
   * Media query for 'media' strategy
   */
  media?: string;

  /**
   * Priority for hydration (higher = earlier)
   */
  priority?: number;
}

/**
 * Island hydration options
 */
export interface HydrationOptions {
  /**
   * Hydration strategy
   */
  strategy?: HydrationStrategy;

  /**
   * Media query for 'media' strategy
   */
  media?: string;

  /**
   * Timeout for 'idle' strategy (ms)
   */
  timeout?: number;

  /**
   * Root margin for 'visible' strategy (IntersectionObserver)
   */
  rootMargin?: string;

  /**
   * Threshold for 'visible' strategy (IntersectionObserver)
   */
  threshold?: number | number[];

  /**
   * Events that trigger 'interaction' strategy
   */
  events?: string[];

  /**
   * Priority for hydration
   */
  priority?: number;
}

/**
 * Island registration entry
 */
export interface IslandRegistration {
  /**
   * Component loader function
   */
  loader: () => Promise<any>;

  /**
   * Framework adapter
   */
  adapter: FrameworkAdapter;

  /**
   * Default hydration options
   */
  options?: HydrationOptions;
}

/**
 * Multi-framework island configuration
 */
export interface MultiFrameworkIslandConfig {
  /**
   * Framework to use for this island
   */
  framework: 'react' | 'vue' | 'svelte' | 'preact' | 'solid' | 'auto';

  /**
   * Component to render
   */
  component: any;

  /**
   * Component props
   */
  props?: IslandProps;

  /**
   * Hydration options
   */
  hydration?: HydrationOptions;

  /**
   * Children (for wrapper components)
   */
  children?: any;

  /**
   * Error fallback
   */
  fallback?: (error: Error) => any;

  /**
   * Loading fallback
   */
  loading?: any;
}
