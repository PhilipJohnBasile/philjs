/**
 * @fileoverview TypeScript declarations for PhilJS virtual modules
 * These modules are generated at build-time by the Vite plugin
 */

/**
 * Virtual module: philjs-routes
 * Provides access to all application routes
 */
declare module 'virtual:philjs-routes' {
  /**
   * Route metadata interface
   */
  export interface RouteMetadata {
    /** Route path pattern (e.g., '/users/:id') */
    path: string;
    /** Source file path */
    filePath: string;
    /** Route component */
    component?: any;
    /** Data loader function */
    loader?: (...args: any[]) => any | Promise<any>;
    /** Action handler function */
    action?: (...args: any[]) => any | Promise<any>;
    /** Route metadata */
    meta?: Record<string, any>;
  }

  /**
   * Route match result
   */
  export interface RouteMatch {
    /** Matched route */
    route: RouteMetadata;
    /** Extracted parameters */
    params: Record<string, string>;
  }

  /**
   * All registered routes
   */
  export const routes: RouteMetadata[];

  /**
   * Get route by exact path
   * @param path - Route path
   * @returns Route metadata or undefined
   */
  export function getRoute(path: string): RouteMetadata | undefined;

  /**
   * Match a pathname against registered routes
   * @param pathname - URL pathname to match
   * @returns Match result or null
   */
  export function matchRoute(pathname: string): RouteMatch | null;
}

/**
 * Virtual module: philjs-content
 * Provides access to content collections
 */
declare module 'virtual:philjs-content' {
  /**
   * Content item interface
   */
  export interface ContentItem {
    /** File path relative to content directory */
    path: string;
    /** Collection name (first directory segment) */
    collection: string;
    /** Lazy loader function */
    load: () => Promise<any>;
  }

  /**
   * All content items
   */
  export const content: ContentItem[];

  /**
   * Get all items in a collection
   * @param name - Collection name
   * @returns Array of content items
   */
  export function getCollection(name: string): ContentItem[];

  /**
   * Load specific content by path
   * @param path - Content file path
   * @returns Loaded module
   */
  export function loadContent(path: string): Promise<any>;
}

/**
 * Virtual module: philjs-config
 * Provides application configuration
 */
declare module 'virtual:philjs-config' {
  /**
   * Application configuration object
   */
  export const config: Record<string, any>;

  /**
   * Application base path
   */
  export const basePath: string;

  /**
   * Default export (same as config)
   */
  const defaultConfig: Record<string, any>;
  export default defaultConfig;
}

/**
 * Virtual module: philjs-plugins
 * Provides access to registered plugins
 */
declare module 'virtual:philjs-plugins' {
  /**
   * Plugin interface
   */
  export interface Plugin {
    /** Plugin name */
    name: string;
    /** Plugin module */
    module: any;
  }

  /**
   * All registered plugins
   */
  export const plugins: Plugin[];

  /**
   * Initialize all plugins with context
   * @param context - Application context
   */
  export function initializePlugins(context: any): Promise<void>;
}

/**
 * Augment ImportMeta with glob function
 */
interface ImportMeta {
  /**
   * Vite's import.meta.glob function
   * Dynamically imports modules matching a glob pattern
   */
  glob<T = any>(
    pattern: string | string[],
    options?: {
      /** Load modules eagerly */
      eager?: boolean;
      /** Import as 'raw' string or 'url' */
      as?: 'raw' | 'url';
    }
  ): Record<string, T | (() => Promise<T>)>;

  /**
   * Vite's import.meta.globEager function (deprecated, use glob with eager: true)
   */
  globEager<T = any>(pattern: string | string[]): Record<string, T>;
}

/**
 * Augment global types for PhilJS virtual modules
 */
declare global {
  namespace PhilJS {
    /**
     * Route configuration
     */
    interface Route {
      path: string;
      component?: any;
      loader?: (...args: any[]) => any;
      action?: (...args: any[]) => any;
      meta?: Record<string, any>;
    }

    /**
     * Content with frontmatter
     */
    interface ContentWithFrontmatter<F = any> {
      frontmatter: F;
      default: any;
    }

    /**
     * Plugin definition
     */
    interface Plugin<T = any> {
      name: string;
      setup: (context: T) => void | Promise<void>;
    }

    /**
     * Application configuration
     */
    interface AppConfig {
      siteName?: string;
      version?: string;
      features?: Record<string, boolean>;
      [key: string]: any;
    }
  }
}

export {};
