/**
 * SuperJSON integration for philjs-ssr
 * Enables automatic serialization/deserialization of complex types in loaders and SSR.
 */
import { serialize, deserialize, stringify, parse, } from '@philjs/core/superjson';
/**
 * Serialize loader data for SSR.
 */
export function serializeLoaderData(data, options) {
    const { customTypes = [], serializeOptions = {}, } = options || {};
    return serialize(data, {
        ...serializeOptions,
        customTypes,
    });
}
/**
 * Deserialize loader data on the client.
 */
export function deserializeLoaderData(data, options) {
    // If data doesn't look like a SuperJSON result, return as-is
    if (!data ||
        typeof data !== 'object' ||
        !('json' in data)) {
        return data;
    }
    const { customTypes = [], deserializeOptions = {}, } = options || {};
    return deserialize(data, {
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
export function wrapLoaderWithSuperJSON(loader, options) {
    const { enabled = true } = options || {};
    return async (ctx) => {
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
export function wrapActionWithSuperJSON(action, options) {
    const { enabled = true } = options || {};
    return async (ctx) => {
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
export function generateHydrationScript(id, data, options) {
    const { globalName = '__LOADER_DATA__', includeScriptTag = true, async = false, } = options || {};
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
export function generateHydrationRestoreScript(options) {
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
export function extractHydrationData(id, options) {
    if (typeof window === 'undefined') {
        return null;
    }
    const { globalName = '__LOADER_DATA__' } = options || {};
    const data = window[globalName]?.[id];
    if (!data) {
        return null;
    }
    return deserializeLoaderData(data, options);
}
// ============================================================================
// SSR Response Helpers
// ============================================================================
/**
 * Inject loader data into HTML response.
 */
export function injectLoaderData(html, loaderData, options) {
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
export function createLoaderDataSerializer(options) {
    const loaderData = {};
    return {
        /**
         * Add loader data to be serialized.
         */
        add(id, data) {
            loaderData[id] = serializeLoaderData(data, options);
        },
        /**
         * Get all loader data.
         */
        getAll() {
            return { ...loaderData };
        },
        /**
         * Generate HTML script tags for all loader data.
         */
        toHTML(htmlOptions) {
            let scripts = '';
            for (const [id, data] of Object.entries(loaderData)) {
                const scriptOptions = {};
                if (htmlOptions?.globalName) {
                    scriptOptions.globalName = htmlOptions.globalName;
                }
                scripts += generateHydrationScript(id, data, scriptOptions);
            }
            const restoreOptions = {};
            if (htmlOptions?.globalName) {
                restoreOptions.globalName = htmlOptions.globalName;
            }
            scripts += generateHydrationRestoreScript(restoreOptions);
            return scripts;
        },
        /**
         * Inject into HTML.
         */
        inject(html, htmlOptions) {
            return injectLoaderData(html, loaderData, htmlOptions);
        },
        /**
         * Clear all loader data.
         */
        clear() {
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
export function createStreamingLoaderSerializer(options) {
    return {
        /**
         * Serialize loader data as a stream chunk.
         */
        serializeChunk(id, data) {
            const serialized = serializeLoaderData(data, options);
            return generateHydrationScript(id, serialized, {
                globalName: options?.deserializeOptions?.['globalName'] || '__LOADER_DATA__',
            });
        },
        /**
         * Create a boundary marker for streaming.
         */
        createBoundary(id) {
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
export function createLoaderDataAccessor(options) {
    const cache = new Map();
    return {
        /**
         * Get loader data by ID.
         */
        get(id) {
            // Check cache first
            if (cache.has(id)) {
                return cache.get(id);
            }
            // Extract from window
            const data = extractHydrationData(id, options);
            if (data !== null) {
                cache.set(id, data);
            }
            return data;
        },
        /**
         * Set loader data (for client-side navigation).
         */
        set(id, data) {
            cache.set(id, data);
        },
        /**
         * Clear cache.
         */
        clear() {
            cache.clear();
        },
        /**
         * Clear specific loader data.
         */
        delete(id) {
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
export function superJSONLoader(loader, options) {
    const wrapped = loader;
    wrapped[SUPERJSON_LOADER] = options || { enabled: true };
    return wrapped;
}
/**
 * Mark an action as using SuperJSON.
 */
export function superJSONAction(action, options) {
    const wrapped = action;
    wrapped[SUPERJSON_LOADER] = options || { enabled: true };
    return wrapped;
}
/**
 * Check if a loader has SuperJSON enabled.
 */
export function hasSuperJSONLoader(loader) {
    return SUPERJSON_LOADER in loader;
}
/**
 * Get SuperJSON options from a loader.
 */
export function getSuperJSONLoaderOptions(loader) {
    if (!hasSuperJSONLoader(loader)) {
        return null;
    }
    return loader[SUPERJSON_LOADER];
}
//# sourceMappingURL=superjson.js.map