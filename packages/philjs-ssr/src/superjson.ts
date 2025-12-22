/**
 * SuperJSON integration for philjs-ssr
 * Enables automatic serialization/deserialization of complex types in loaders and SSR.
 */

import {
  serialize,
  deserialize,
  stringify,
  parse,
  type SuperJSONResult,
  type SerializeOptions,
  type DeserializeOptions,
  type CustomTypeHandler,
} from 'philjs-core/superjson';

import type { Loader, Action, LoaderCtx, ActionCtx } from './types.js';

// ============================================================================
// SSR Serialization
// ============================================================================

/**
 * Options for SSR SuperJSON integration.
 */
export interface SSRSuperJSONOptions {
  /** Enable SuperJSON serialization (default: true) */
  enabled?: boolean;
  /** Custom type handlers */
  customTypes?: CustomTypeHandler[];
  /** Serialization options */
  serializeOptions?: Omit<SerializeOptions, 'customTypes'>;
  /** Deserialization options */
  deserializeOptions?: Omit<DeserializeOptions, 'customTypes'>;
}

/**
 * Serialize loader data for SSR.
 */
export function serializeLoaderData<T>(
  data: T,
  options?: SSRSuperJSONOptions
): SuperJSONResult {
  const {
    customTypes = [],
    serializeOptions = {},
  } = options || {};

  return serialize(data, {
    ...serializeOptions,
    customTypes,
  });
}

/**
 * Deserialize loader data on the client.
 */
export function deserializeLoaderData<T>(
  data: SuperJSONResult | unknown,
  options?: SSRSuperJSONOptions
): T {
  // If data doesn't look like a SuperJSON result, return as-is
  if (
    !data ||
    typeof data !== 'object' ||
    !('json' in data)
  ) {
    return data as T;
  }

  const {
    customTypes = [],
    deserializeOptions = {},
  } = options || {};

  return deserialize<T>(data as SuperJSONResult, {
    ...deserializeOptions,
    customTypes,
  });
}

// ============================================================================
// Loader Wrapping
// ============================================================================

/**
 * Wrap a loader to automatically serialize its output.
 */
export function wrapLoaderWithSuperJSON<T>(
  loader: Loader<T>,
  options?: SSRSuperJSONOptions
): Loader<SuperJSONResult> {
  const { enabled = true } = options || {};

  return async (ctx: LoaderCtx): Promise<SuperJSONResult> => {
    const data = await loader(ctx);

    if (!enabled) {
      return { json: data };
    }

    return serializeLoaderData(data, options);
  };
}

/**
 * Wrap an action to automatically serialize its output.
 */
export function wrapActionWithSuperJSON<T>(
  action: Action<T>,
  options?: SSRSuperJSONOptions
): Action<SuperJSONResult> {
  const { enabled = true } = options || {};

  return async (ctx: ActionCtx): Promise<SuperJSONResult> => {
    const data = await action(ctx);

    if (!enabled) {
      return { json: data };
    }

    return serializeLoaderData(data, options);
  };
}

// ============================================================================
// Hydration Script Generation
// ============================================================================

/**
 * Generate a script tag to inject serialized data into the page.
 */
export function generateHydrationScript(
  id: string,
  data: SuperJSONResult,
  options?: {
    /** Variable name in window object (default: '__LOADER_DATA__') */
    globalName?: string;
    /** Include script tag wrapper (default: true) */
    includeScriptTag?: boolean;
    /** Make script async (default: false) */
    async?: boolean;
  }
): string {
  const {
    globalName = '__LOADER_DATA__',
    includeScriptTag = true,
    async = false,
  } = options || {};

  const serialized = JSON.stringify(data);
  const script = `window.${globalName} = window.${globalName} || {}; window.${globalName}["${id}"] = ${serialized};`;

  if (!includeScriptTag) {
    return script;
  }

  const asyncAttr = async ? ' async' : '';
  return `<script type="application/json" id="__superjson_${id}"${asyncAttr}>${serialized}</script>`;
}

/**
 * Generate inline script to restore data on the client.
 */
export function generateHydrationRestoreScript(
  options?: {
    /** Variable name in window object (default: '__LOADER_DATA__') */
    globalName?: string;
  }
): string {
  const { globalName = '__LOADER_DATA__' } = options || {};

  return `
<script>
  (function() {
    if (!window.${globalName}) window.${globalName} = {};

    // Find all SuperJSON script tags
    const scripts = document.querySelectorAll('script[type="application/json"][id^="__superjson_"]');

    scripts.forEach(function(script) {
      try {
        const id = script.id.replace('__superjson_', '');
        const data = JSON.parse(script.textContent || '{}');
        window.${globalName}[id] = data;
      } catch (e) {
        console.error('Failed to parse SuperJSON data:', e);
      }
    });
  })();
</script>
  `.trim();
}

/**
 * Extract hydration data from the page.
 */
export function extractHydrationData<T>(
  id: string,
  options?: SSRSuperJSONOptions & {
    /** Variable name in window object (default: '__LOADER_DATA__') */
    globalName?: string;
  }
): T | null {
  if (typeof window === 'undefined') {
    return null;
  }

  const { globalName = '__LOADER_DATA__' } = options || {};
  const data = (window as any)[globalName]?.[id];

  if (!data) {
    return null;
  }

  return deserializeLoaderData<T>(data, options);
}

// ============================================================================
// SSR Response Helpers
// ============================================================================

/**
 * Inject loader data into HTML response.
 */
export function injectLoaderData(
  html: string,
  loaderData: Record<string, SuperJSONResult>,
  options?: {
    /** Where to inject (default: before </head>) */
    position?: 'head' | 'body-start' | 'body-end';
    /** Variable name in window object (default: '__LOADER_DATA__') */
    globalName?: string;
  }
): string {
  const { position = 'head', globalName = '__LOADER_DATA__' } = options || {};

  let scripts = '';

  // Generate script tags for each loader
  for (const [id, data] of Object.entries(loaderData)) {
    scripts += generateHydrationScript(id, data, { globalName });
  }

  // Add restore script
  scripts += generateHydrationRestoreScript({ globalName });

  // Inject into HTML
  switch (position) {
    case 'head':
      return html.replace('</head>', `${scripts}</head>`);
    case 'body-start':
      return html.replace('<body>', `<body>${scripts}`);
    case 'body-end':
      return html.replace('</body>', `${scripts}</body>`);
    default:
      return html.replace('</head>', `${scripts}</head>`);
  }
}

/**
 * Create a loader data serializer for SSR.
 */
export function createLoaderDataSerializer(options?: SSRSuperJSONOptions) {
  const loaderData: Record<string, SuperJSONResult> = {};

  return {
    /**
     * Add loader data to be serialized.
     */
    add<T>(id: string, data: T): void {
      loaderData[id] = serializeLoaderData(data, options);
    },

    /**
     * Get all loader data.
     */
    getAll(): Record<string, SuperJSONResult> {
      return { ...loaderData };
    },

    /**
     * Generate HTML script tags for all loader data.
     */
    toHTML(htmlOptions?: Parameters<typeof injectLoaderData>[2]): string {
      let scripts = '';
      for (const [id, data] of Object.entries(loaderData)) {
        scripts += generateHydrationScript(id, data, {
          globalName: htmlOptions?.globalName,
        });
      }
      scripts += generateHydrationRestoreScript({
        globalName: htmlOptions?.globalName,
      });
      return scripts;
    },

    /**
     * Inject into HTML.
     */
    inject(html: string, htmlOptions?: Parameters<typeof injectLoaderData>[2]): string {
      return injectLoaderData(html, loaderData, htmlOptions);
    },

    /**
     * Clear all loader data.
     */
    clear(): void {
      Object.keys(loaderData).forEach(key => {
        delete loaderData[key];
      });
    },
  };
}

// ============================================================================
// Streaming SSR Support
// ============================================================================

/**
 * Create a streaming loader data serializer.
 */
export function createStreamingLoaderSerializer(options?: SSRSuperJSONOptions) {
  return {
    /**
     * Serialize loader data as a stream chunk.
     */
    serializeChunk<T>(id: string, data: T): string {
      const serialized = serializeLoaderData(data, options);
      return generateHydrationScript(id, serialized, {
        globalName: (options?.deserializeOptions as any)?.['globalName'] || '__LOADER_DATA__',
      });
    },

    /**
     * Create a boundary marker for streaming.
     */
    createBoundary(id: string): {
      start: string;
      end: string;
    } {
      return {
        start: `<!--superjson-start:${id}-->`,
        end: `<!--superjson-end:${id}-->`,
      };
    },
  };
}

// ============================================================================
// Client-Side Helpers
// ============================================================================

/**
 * Create a client-side loader data accessor.
 */
export function createLoaderDataAccessor(options?: SSRSuperJSONOptions) {
  const cache = new Map<string, unknown>();

  return {
    /**
     * Get loader data by ID.
     */
    get<T>(id: string): T | null {
      // Check cache first
      if (cache.has(id)) {
        return cache.get(id) as T;
      }

      // Extract from window
      const data = extractHydrationData<T>(id, options);

      if (data !== null) {
        cache.set(id, data);
      }

      return data;
    },

    /**
     * Set loader data (for client-side navigation).
     */
    set<T>(id: string, data: T): void {
      cache.set(id, data);
    },

    /**
     * Clear cache.
     */
    clear(): void {
      cache.clear();
    },

    /**
     * Clear specific loader data.
     */
    delete(id: string): void {
      cache.delete(id);
    },
  };
}

// ============================================================================
// Route-Level Configuration
// ============================================================================

/**
 * Symbol to mark loaders with SuperJSON enabled.
 */
export const SUPERJSON_LOADER = Symbol('superjson-loader');

/**
 * Mark a loader as using SuperJSON.
 */
export function superJSONLoader<T>(
  loader: Loader<T>,
  options?: SSRSuperJSONOptions
): Loader<T> & { [SUPERJSON_LOADER]: SSRSuperJSONOptions } {
  const wrapped = loader as Loader<T> & { [SUPERJSON_LOADER]: SSRSuperJSONOptions };
  wrapped[SUPERJSON_LOADER] = options || { enabled: true };
  return wrapped;
}

/**
 * Mark an action as using SuperJSON.
 */
export function superJSONAction<T>(
  action: Action<T>,
  options?: SSRSuperJSONOptions
): Action<T> & { [SUPERJSON_LOADER]: SSRSuperJSONOptions } {
  const wrapped = action as Action<T> & { [SUPERJSON_LOADER]: SSRSuperJSONOptions };
  wrapped[SUPERJSON_LOADER] = options || { enabled: true };
  return wrapped;
}

/**
 * Check if a loader has SuperJSON enabled.
 */
export function hasSuperJSONLoader(
  loader: Loader<unknown>
): loader is Loader<unknown> & { [SUPERJSON_LOADER]: SSRSuperJSONOptions } {
  return SUPERJSON_LOADER in loader;
}

/**
 * Get SuperJSON options from a loader.
 */
export function getSuperJSONLoaderOptions(
  loader: Loader<unknown>
): SSRSuperJSONOptions | null {
  if (!hasSuperJSONLoader(loader)) {
    return null;
  }
  return loader[SUPERJSON_LOADER];
}
