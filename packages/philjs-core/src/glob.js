/**
 * @fileoverview Glob utilities for PhilJS applications (Astro-style)
 * Provides type-safe glob imports and content loading
 */
export function glob(pattern, options = {}) {
    // This is a build-time helper - actual implementation is replaced by Vite
    if (typeof import.meta.glob === 'undefined') {
        throw new Error('import.meta.glob is not available. Are you using Vite?');
    }
    const patterns = Array.isArray(pattern) ? pattern : [pattern];
    // Vite's import.meta.glob will be used at build time
    // This is just a runtime fallback
    console.warn('glob() should be used at build time with Vite');
    return {};
}
/**
 * Import all files matching a glob pattern eagerly
 */
export async function importGlob(pattern, options = {}) {
    const modules = glob(pattern, { ...options, eager: false });
    const result = {};
    await Promise.all(Object.entries(modules).map(async ([path, importer]) => {
        result[path] = await importer();
    }));
    return result;
}
/**
 * Map glob results with a transform function
 */
export function mapGlob(globResult, mapper) {
    const result = {};
    for (const [path, value] of Object.entries(globResult)) {
        if (typeof value === 'function') {
            // Lazy import
            result[path] = async () => {
                const loaded = await value();
                return mapper(loaded, path);
            };
        }
        else {
            // Eager import
            result[path] = mapper(value, path);
        }
    }
    return result;
}
/**
 * Filter glob results
 */
export function filterGlob(globResult, predicate) {
    const result = {};
    for (const [path, value] of Object.entries(globResult)) {
        if (typeof value === 'function') {
            // Lazy import - can't filter without loading
            result[path] = async () => {
                const loaded = await value();
                if (predicate(loaded, path)) {
                    return loaded;
                }
                throw new Error(`Filtered out: ${path}`);
            };
        }
        else {
            // Eager import
            if (predicate(value, path)) {
                result[path] = value;
            }
        }
    }
    return result;
}
/**
 * Parse glob path into components
 */
export function parseGlobPath(path) {
    const segments = path.split('/').filter(Boolean);
    const filename = segments[segments.length - 1] || '';
    const extensionMatch = filename.match(/\.([^.]+)$/);
    const extension = extensionMatch?.[1] ?? '';
    const name = filename.replace(/\.[^.]+$/, '');
    const directory = segments.slice(0, -1).join('/');
    return {
        path,
        name,
        extension,
        directory,
        segments,
    };
}
/**
 * Load content from glob pattern
 */
export async function loadContent(pattern, options = {}) {
    const modules = await importGlob(pattern, options);
    return Object.entries(modules).map(([path, module]) => ({
        path,
        pathInfo: parseGlobPath(path),
        module,
    }));
}
/**
 * Sort content items
 */
export function sortContent(items, compareFn) {
    // ES2023+: toSorted() for non-mutating sort
    return items.toSorted(compareFn);
}
/**
 * Group content items by a key
 */
export function groupContent(items, keyFn) {
    const groups = {};
    for (const item of items) {
        const key = keyFn(item);
        if (!groups[key]) {
            groups[key] = [];
        }
        groups[key].push(item);
    }
    return groups;
}
/**
 * Auto-register modules from glob pattern
 */
export async function autoRegister(options) {
    const { pattern, getKey, transform, globOptions = {} } = options;
    const content = await loadContent(pattern, globOptions);
    const registry = {};
    for (const item of content) {
        const key = getKey
            ? getKey(item.path, item.module)
            : item.pathInfo.name;
        const value = transform
            ? transform(item.module, item.path)
            : item.module;
        registry[key] = value;
    }
    return registry;
}
/**
 * Load routes from glob pattern
 */
export async function loadRoutes(pattern = './routes/**/*.{js,jsx,ts,tsx}') {
    return autoRegister({
        pattern,
        getKey: (path) => {
            // Convert file path to route path
            // e.g., ./routes/users/[id].tsx -> /users/:id
            return filePathToRoute(path);
        },
    });
}
/**
 * Convert file path to route path
 */
export function filePathToRoute(filePath) {
    let route = filePath
        // Remove ./routes/ prefix and file extension
        .replace(/^\.\/routes\//, '/')
        .replace(/\.(js|jsx|ts|tsx)$/, '')
        // Handle index files
        .replace(/\/index$/, '/')
        // Handle [param] -> :param
        .replace(/\[([^\]]+)\]/g, ':$1')
        // Handle [...param] -> *param (catch-all)
        .replace(/\[\.\.\.([^\]]+)\]/g, '*$1');
    // Ensure leading slash
    if (!route.startsWith('/')) {
        route = `/${route}`;
    }
    // Remove trailing slash (except for root)
    if (route !== '/' && route.endsWith('/')) {
        route = route.slice(0, -1);
    }
    return route;
}
/**
 * Load content with frontmatter (markdown, MDX, etc.)
 */
export async function loadContentWithFrontmatter(pattern) {
    const items = await loadContent(pattern);
    return items.map(item => ({
        frontmatter: item.module.frontmatter || {},
        content: item.module.default || item.module,
        path: item.path,
    }));
}
/**
 * Filter content by frontmatter
 */
export function filterByFrontmatter(items, predicate) {
    return items.filter(item => predicate(item.frontmatter));
}
/**
 * Sort content by frontmatter field
 */
export function sortByFrontmatter(items, field, order = 'asc') {
    // ES2023+: toSorted() for non-mutating sort
    return items.toSorted((a, b) => {
        const aVal = a.frontmatter[field];
        const bVal = b.frontmatter[field];
        if (aVal === bVal)
            return 0;
        const comparison = aVal < bVal ? -1 : 1;
        return order === 'asc' ? comparison : -comparison;
    });
}
/**
 * Load plugins from glob pattern
 */
export async function loadPlugins(pattern = './plugins/**/*.{js,ts}') {
    const items = await loadContent(pattern);
    return items.map(item => {
        const plugin = 'default' in item.module ? item.module.default : item.module;
        return plugin;
    });
}
/**
 * Initialize plugins
 */
export async function initializePlugins(plugins, context) {
    for (const plugin of plugins) {
        await plugin.setup(context);
    }
}
/**
 * Create a content collection from glob pattern
 */
export function createCollection(name, pattern) {
    let cache = null;
    const loadAll = async () => {
        if (!cache) {
            cache = await loadContent(pattern);
        }
        return cache;
    };
    return {
        name,
        all: loadAll,
        find: async (predicate) => {
            const items = await loadAll();
            return items.find(predicate);
        },
        filter: async (predicate) => {
            const items = await loadAll();
            return items.filter(predicate);
        },
    };
}
// Export utilities
export const globUtils = {
    glob,
    importGlob,
    mapGlob,
    filterGlob,
    parseGlobPath,
    loadContent,
    sortContent,
    groupContent,
    autoRegister,
    loadRoutes,
    filePathToRoute,
    loadContentWithFrontmatter,
    filterByFrontmatter,
    sortByFrontmatter,
    loadPlugins,
    initializePlugins,
    createCollection,
};
//# sourceMappingURL=glob.js.map