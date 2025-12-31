/**
 * Vite Compatibility
 * Maintain Vite dev server compatibility during Rspack migration
 */
/**
 * PhilJS Vite plugin for development
 * Provides fast HMR and signal-aware dev experience
 */
export function philJSVite(options = {}) {
    const { signals = true, jsx = true, autoMemo = false, signalHMR = true, } = options;
    return {
        name: 'philjs-vite',
        enforce: 'pre',
        config(config, { command }) {
            const isServe = command === 'serve';
            const baseConfig = (config && typeof config === 'object') ? config : {};
            return {
                ...baseConfig,
                esbuild: {
                    jsx: jsx ? 'automatic' : undefined,
                    jsxImportSource: jsx ? '@philjs/core' : undefined,
                },
                optimizeDeps: {
                    include: ['@philjs/core', '@philjs/router'],
                    esbuildOptions: {
                        jsx: 'automatic',
                        jsxImportSource: '@philjs/core',
                    },
                },
                define: {
                    __DEV__: isServe ? 'true' : 'false',
                    __SIGNAL_HMR__: signalHMR && isServe ? 'true' : 'false',
                },
            };
        },
        transform(code, id) {
            // Skip node_modules
            if (id.includes('node_modules'))
                return null;
            // Only process TS/JS/TSX/JSX files
            if (!/\.[jt]sx?$/.test(id))
                return null;
            // Signal HMR injection
            if (signalHMR && code.includes('@philjs/core')) {
                // Add HMR boundary for signal-containing modules
                if (code.includes('signal(') || code.includes('memo(') || code.includes('effect(')) {
                    return {
                        code: code + `
if (import.meta.hot) {
  import.meta.hot.accept();
}
`,
                        map: null,
                    };
                }
            }
            return null;
        },
        configureServer(server) {
            // Add middleware for development features
            // This could include signal state inspection, etc.
        },
    };
}
/**
 * Rspack-Vite compatibility plugin
 * Allows using Vite for dev and Rspack for production
 */
export function rspackViteCompat() {
    return {
        name: 'rspack-vite-compat',
        config(config, { command }) {
            if (command === 'serve') {
                // Use Vite for development
                return config;
            }
            // For build, we'd typically use Rspack directly
            // This plugin just ensures compatibility
            return config;
        },
        configResolved(resolvedConfig) {
            // Log which build system is being used
            console.log(`[PhilJS] Using ${resolvedConfig.command === 'serve' ? 'Vite' : 'Rspack'} build`);
        },
    };
}
// ============================================================================
// Virtual Module Store
// ============================================================================
/**
 * Store for virtual modules created by Vite plugins
 */
class VirtualModuleStore {
    modules = new Map();
    prefix = '\0virtual:';
    /**
     * Add a virtual module
     */
    add(id, code, map) {
        const normalizedId = this.normalizeId(id);
        this.modules.set(normalizedId, { id: normalizedId, code, map });
    }
    /**
     * Get a virtual module
     */
    get(id) {
        return this.modules.get(this.normalizeId(id));
    }
    /**
     * Check if a module is virtual
     */
    isVirtual(id) {
        const normalizedId = this.normalizeId(id);
        return this.modules.has(normalizedId) || id.startsWith(this.prefix) || id.startsWith('virtual:');
    }
    /**
     * Normalize virtual module ID
     */
    normalizeId(id) {
        if (id.startsWith(this.prefix)) {
            return id;
        }
        if (id.startsWith('virtual:')) {
            return this.prefix + id.slice(8);
        }
        return id;
    }
    /**
     * Get all virtual modules
     */
    getAll() {
        return new Map(this.modules);
    }
    /**
     * Clear all virtual modules
     */
    clear() {
        this.modules.clear();
    }
}
/**
 * Create HMR translation layer between Vite and Rspack
 */
function createHMRTranslationCode() {
    return `
// HMR Translation Layer: Vite -> Rspack
if (typeof __webpack_module__ !== 'undefined' && __webpack_module__.hot) {
  // Create Vite-compatible import.meta.hot API
  if (!import.meta.hot) {
    const rspackHot = __webpack_module__.hot;
    const hmrData = {};

    Object.defineProperty(import.meta, 'hot', {
      value: {
        // Accept self-updates
        accept(deps, callback) {
          if (typeof deps === 'function' || deps === undefined) {
            rspackHot.accept(deps);
          } else {
            rspackHot.accept(deps, callback);
          }
        },

        // Decline updates
        decline() {
          rspackHot.decline();
        },

        // Dispose handler
        dispose(callback) {
          rspackHot.dispose(callback);
        },

        // Prune handler (Vite-specific, map to dispose)
        prune(callback) {
          rspackHot.dispose(callback);
        },

        // Invalidate module
        invalidate() {
          rspackHot.invalidate();
        },

        // Data persistence between updates
        get data() {
          return rspackHot.data || hmrData;
        },

        // Send custom events (Vite-specific)
        send(event, data) {
          if (typeof __webpack_dev_server_client__ !== 'undefined') {
            __webpack_dev_server_client__.sendMessage(JSON.stringify({ type: event, data }));
          }
        },

        // Event listeners (Vite-specific)
        on(event, callback) {
          if (event === 'vite:beforeUpdate') {
            rspackHot.addStatusHandler((status) => {
              if (status === 'prepare') callback({ type: 'update', updates: [] });
            });
          } else if (event === 'vite:afterUpdate') {
            rspackHot.addStatusHandler((status) => {
              if (status === 'idle') callback({ type: 'update', updates: [] });
            });
          }
        },

        // Environment check
        get env() {
          return { MODE: process.env.NODE_ENV || 'development' };
        }
      },
      configurable: true,
      enumerable: true
    });
  }
}
`;
}
/**
 * Process CSS module for Rspack compatibility
 */
function processCSSModule(css, filename) {
    const exports = {};
    const classNameRegex = /\.([a-zA-Z_][a-zA-Z0-9_-]*)/g;
    let match;
    // Extract class names and generate hashed versions
    const processedClasses = new Map();
    while ((match = classNameRegex.exec(css)) !== null) {
        const originalClass = match[1];
        if (originalClass && !processedClasses.has(originalClass)) {
            // Generate a deterministic hash based on filename and class name
            const hash = generateCSSModuleHash(filename, originalClass);
            const hashedClass = `${originalClass}_${hash}`;
            processedClasses.set(originalClass, hashedClass);
            exports[originalClass] = hashedClass;
        }
    }
    // Replace class names in CSS
    let processedCSS = css;
    processedClasses.forEach((hashedClass, originalClass) => {
        processedCSS = processedCSS.replace(new RegExp(`\\.${originalClass}(?=[^a-zA-Z0-9_-])`, 'g'), `.${hashedClass}`);
    });
    return { css: processedCSS, exports };
}
/**
 * Generate a hash for CSS module class names
 */
function generateCSSModuleHash(filename, className) {
    const str = `${filename}:${className}`;
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash).toString(36).slice(0, 5);
}
/**
 * Asset type mapping
 */
const ASSET_TYPES = {
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.webp': 'image/webp',
    '.avif': 'image/avif',
    '.ico': 'image/x-icon',
    '.woff': 'font/woff',
    '.woff2': 'font/woff2',
    '.eot': 'application/vnd.ms-fontobject',
    '.ttf': 'font/ttf',
    '.otf': 'font/otf',
    '.mp4': 'video/mp4',
    '.webm': 'video/webm',
    '.ogg': 'video/ogg',
    '.mp3': 'audio/mpeg',
    '.wav': 'audio/wav',
    '.pdf': 'application/pdf',
    '.json': 'application/json',
    '.wasm': 'application/wasm',
};
/**
 * Check if a path is an asset
 */
function isAsset(path) {
    const ext = getExtension(path);
    return ext in ASSET_TYPES;
}
/**
 * Get file extension
 */
function getExtension(path) {
    const lastDot = path.lastIndexOf('.');
    return lastDot >= 0 ? path.slice(lastDot).toLowerCase() : '';
}
/**
 * Get asset MIME type
 */
function getAssetType(path) {
    const ext = getExtension(path);
    return ASSET_TYPES[ext] || 'application/octet-stream';
}
// ============================================================================
// Source Implementation
// ============================================================================
/**
 * Raw source implementation for Rspack assets
 */
class RawSource {
    content;
    constructor(content) {
        this.content = content;
    }
    source() {
        return this.content;
    }
    size() {
        if (typeof this.content === 'string') {
            return Buffer.byteLength(this.content, 'utf8');
        }
        return this.content.length;
    }
    map() {
        return null;
    }
    sourceAndMap() {
        return { source: this.content, map: null };
    }
}
/**
 * Source map source implementation
 */
class SourceMapSource {
    content;
    sourceMap;
    constructor(content, sourceMap) {
        this.content = content;
        this.sourceMap = sourceMap;
    }
    source() {
        return this.content;
    }
    size() {
        return Buffer.byteLength(this.content, 'utf8');
    }
    map() {
        return this.sourceMap;
    }
    sourceAndMap() {
        return { source: this.content, map: this.sourceMap };
    }
}
// ============================================================================
// Vite Plugin Adapter
// ============================================================================
/**
 * Adapt a Vite plugin to work with Rspack
 *
 * This adapter translates Vite plugin hooks to Rspack equivalents:
 * - buildStart -> compiler beforeCompile hook
 * - transform -> custom loader with transform logic
 * - resolveId -> resolver plugin via normalModuleFactory
 * - load -> custom loader with read logic
 * - buildEnd -> compiler done hook
 * - generateBundle -> compiler emit hook
 *
 * @param vitePlugin - The Vite plugin to adapt
 * @param options - Adapter configuration options
 * @returns An adapted Rspack plugin with associated loaders
 */
export function adaptVitePlugin(vitePlugin, options = {}) {
    const { hmr = true, virtualModules = true, cssModules = true, assets = true, transformFilter = () => true, resolveFilter = () => true, } = options;
    const pluginName = `rspack-adapted-${vitePlugin.name}`;
    const virtualStore = new VirtualModuleStore();
    const loaders = [];
    // Track build state
    let buildStartCalled = false;
    /**
     * Create the main Rspack plugin
     */
    const rspackPlugin = {
        name: pluginName,
        apply(compiler) {
            // ======================================================================
            // buildStart -> beforeCompile hook
            // ======================================================================
            if (vitePlugin.buildStart) {
                compiler.hooks.beforeCompile.tapPromise(pluginName, async () => {
                    if (!buildStartCalled) {
                        buildStartCalled = true;
                        await Promise.resolve(vitePlugin.buildStart?.(compiler.options));
                    }
                });
            }
            // ======================================================================
            // resolveId -> normalModuleFactory resolve hook
            // ======================================================================
            if (vitePlugin.resolveId) {
                compiler.hooks.normalModuleFactory.tap(pluginName, (factory) => {
                    factory.hooks.beforeResolve.tapPromise(pluginName, async (resolveData) => {
                        if (!resolveFilter(resolveData.request)) {
                            return;
                        }
                        const importer = resolveData.contextInfo.issuer || undefined;
                        const result = await Promise.resolve(vitePlugin.resolveId?.(resolveData.request, importer));
                        if (result) {
                            // Handle string result
                            if (typeof result === 'string') {
                                // Check if this creates a virtual module
                                if (result.startsWith('\0') || result.startsWith('virtual:')) {
                                    if (virtualModules) {
                                        resolveData.request = virtualStore.normalizeId(result);
                                    }
                                }
                                else {
                                    resolveData.request = result;
                                }
                            }
                            // Handle object result with id and external flag
                            else if (typeof result === 'object' && result !== null) {
                                if (result.external) {
                                    // Mark as external - skip bundling
                                    resolveData.request = result.id;
                                }
                                else {
                                    resolveData.request = result.id;
                                }
                            }
                        }
                    });
                });
            }
            // ======================================================================
            // generateBundle -> emit hook
            // ======================================================================
            if (vitePlugin.generateBundle) {
                compiler.hooks.emit.tapPromise(pluginName, async (compilation) => {
                    // Convert Rspack assets to Vite bundle format
                    const bundle = {};
                    Object.entries(compilation.assets).forEach(([filename, asset]) => {
                        const source = asset.source.source();
                        const isJS = filename.endsWith('.js') || filename.endsWith('.mjs');
                        const isCSS = filename.endsWith('.css');
                        bundle[filename] = {
                            type: isJS ? 'chunk' : 'asset',
                            fileName: filename,
                            source: typeof source === 'string' ? source : source.toString('utf8'),
                            code: isJS ? (typeof source === 'string' ? source : source.toString('utf8')) : undefined,
                            isEntry: false,
                            isDynamicEntry: false,
                            facadeModuleId: null,
                            exports: [],
                            modules: {},
                            imports: [],
                            dynamicImports: [],
                        };
                        if (isCSS) {
                            const bundleEntry = bundle[filename];
                            bundleEntry['type'] = 'asset';
                        }
                    });
                    // Call Vite's generateBundle
                    const outputOptions = {
                        dir: compiler.options.output?.path,
                        format: 'es',
                    };
                    await Promise.resolve(vitePlugin.generateBundle?.(outputOptions, bundle));
                    // Apply any modifications back to Rspack compilation
                    Object.entries(bundle).forEach(([filename, chunkOrAsset]) => {
                        const item = chunkOrAsset;
                        const existingAsset = compilation.getAsset(filename);
                        const newSource = item['source'] ?? item['code'];
                        if (newSource && existingAsset) {
                            const sourceContent = new RawSource(newSource);
                            compilation.updateAsset(filename, sourceContent);
                        }
                        else if (newSource && !existingAsset) {
                            // New asset added by plugin
                            compilation.emitAsset(filename, new RawSource(newSource));
                        }
                    });
                });
            }
            // ======================================================================
            // buildEnd -> done hook
            // ======================================================================
            if (vitePlugin.buildEnd) {
                compiler.hooks.done.tapPromise(pluginName, async (stats) => {
                    const error = stats.hasErrors() ? new Error('Build failed') : undefined;
                    await Promise.resolve(vitePlugin.buildEnd?.(error));
                });
            }
            // ======================================================================
            // closeBundle -> afterEmit hook
            // ======================================================================
            if (vitePlugin.closeBundle) {
                compiler.hooks.afterEmit.tapPromise(pluginName, async () => {
                    await Promise.resolve(vitePlugin.closeBundle?.());
                });
            }
        },
    };
    // ========================================================================
    // Create loader for transform and load hooks
    // ========================================================================
    if (vitePlugin.transform || vitePlugin.load) {
        // Create a custom loader function that will be registered
        const viteAdapterLoader = createViteAdapterLoader(vitePlugin, virtualStore, { transformFilter, cssModules, assets, hmr });
        // Register the loader as a module rule
        loaders.push({
            test: /\.[jt]sx?$|\.css$|\.json$/,
            exclude: /node_modules/,
            use: [{
                    loader: `${pluginName}-loader`,
                    options: {
                        vitePlugin,
                        virtualStore,
                        transformFilter,
                        cssModules,
                        assets,
                        hmr,
                        loaderFn: viteAdapterLoader,
                    },
                }],
        });
        // Add rule for virtual modules
        if (virtualModules) {
            loaders.push({
                test: /^\0|^virtual:/,
                use: [{
                        loader: `${pluginName}-virtual-loader`,
                        options: {
                            virtualStore,
                            loaderFn: createVirtualModuleLoader(virtualStore),
                        },
                    }],
            });
        }
    }
    return { plugin: rspackPlugin, loaders };
}
/**
 * Create a loader function for Vite transform/load hooks
 */
function createViteAdapterLoader(vitePlugin, virtualStore, options) {
    return async function viteAdapterLoader(source) {
        const id = this.resourcePath + this.resourceQuery;
        const callback = this.async();
        try {
            let code = source;
            let map = undefined;
            // Check if this is a virtual module
            if (virtualStore.isVirtual(id)) {
                const virtualModule = virtualStore.get(id);
                if (virtualModule) {
                    code = virtualModule.code;
                    map = virtualModule.map;
                }
            }
            // Call Vite's load hook if available
            else if (vitePlugin.load) {
                const loadResult = await Promise.resolve(vitePlugin.load(id));
                if (loadResult !== null && loadResult !== undefined) {
                    code = loadResult;
                }
            }
            // Call Vite's transform hook if available and filter passes
            if (vitePlugin.transform && options.transformFilter(id)) {
                const transformResult = await Promise.resolve(vitePlugin.transform(code, id));
                if (transformResult !== null && transformResult !== undefined) {
                    if (typeof transformResult === 'string') {
                        code = transformResult;
                    }
                    else {
                        code = transformResult.code;
                        map = transformResult.map;
                    }
                }
            }
            // Handle CSS modules
            if (options.cssModules && id.endsWith('.module.css')) {
                const cssResult = processCSSModule(code, this.resourcePath);
                // Emit the processed CSS
                this.emitFile(this.resourcePath.replace(/\.module\.css$/, '.css'), cssResult.css);
                // Return JS module with exports
                code = `export default ${JSON.stringify(cssResult.exports)};`;
            }
            // Add HMR support if enabled
            if (options.hmr && this.hot && /\.[jt]sx?$/.test(id)) {
                code = createHMRTranslationCode() + '\n' + code;
            }
            // Handle assets
            if (options.assets && isAsset(id)) {
                const mimeType = getAssetType(id);
                const filename = this.resourcePath.split(/[/\\]/).pop() || 'asset';
                this.emitFile(filename, source);
                // Include mime type as a comment for debugging
                code = `// Asset type: ${mimeType}\nexport default __webpack_public_path__ + ${JSON.stringify(filename)};`;
            }
            // Return transformed code
            if (map) {
                callback(null, code, map);
            }
            else {
                callback(null, code);
            }
        }
        catch (error) {
            callback(error instanceof Error ? error : new Error(String(error)));
        }
        return source; // Return type satisfaction, actual return via callback
    };
}
/**
 * Create a loader for virtual modules
 */
function createVirtualModuleLoader(virtualStore) {
    return function virtualModuleLoader(_source) {
        const id = this.resourcePath;
        const virtualModule = virtualStore.get(id);
        if (virtualModule) {
            if (virtualModule.map) {
                this.callback(null, virtualModule.code, virtualModule.map);
            }
            else {
                this.callback(null, virtualModule.code);
            }
            return virtualModule.code;
        }
        // Return empty module if not found
        this.callback(null, 'export default {};');
        return 'export default {};';
    };
}
// ============================================================================
// Batch Adapter
// ============================================================================
/**
 * Adapt multiple Vite plugins to Rspack
 */
export function adaptVitePlugins(vitePlugins, options = {}) {
    return vitePlugins.map((plugin) => adaptVitePlugin(plugin, options));
}
/**
 * Merge multiple adapted plugins into a single configuration
 */
export function mergeAdaptedPlugins(adaptedPlugins) {
    const plugins = [];
    const rules = [];
    for (const adapted of adaptedPlugins) {
        plugins.push(adapted.plugin);
        rules.push(...adapted.loaders);
    }
    return { plugins, rules };
}
// ============================================================================
// Compatibility Utilities
// ============================================================================
/**
 * Check if a Vite plugin is compatible with Rspack adaptation
 */
export function isVitePluginCompatible(plugin) {
    const warnings = [];
    const unsupportedHooks = [];
    // Check for unsupported hooks
    if (plugin.configureServer) {
        unsupportedHooks.push('configureServer');
        warnings.push(`Plugin "${plugin.name}" uses configureServer which requires Vite dev server. ` +
            'This hook will not work with Rspack.');
    }
    if (plugin.handleHotUpdate) {
        warnings.push(`Plugin "${plugin.name}" uses handleHotUpdate. HMR behavior may differ in Rspack.`);
    }
    if (plugin.transformIndexHtml) {
        unsupportedHooks.push('transformIndexHtml');
        warnings.push(`Plugin "${plugin.name}" uses transformIndexHtml. Use html-webpack-plugin instead.`);
    }
    if (plugin.config) {
        warnings.push(`Plugin "${plugin.name}" uses config hook. Vite config will not be applied in Rspack.`);
    }
    if (plugin.configResolved) {
        warnings.push(`Plugin "${plugin.name}" uses configResolved hook. Vite config will not be available.`);
    }
    return {
        compatible: unsupportedHooks.length === 0,
        warnings,
        unsupportedHooks,
    };
}
/**
 * Create a compatibility report for a set of Vite plugins
 */
export function createCompatibilityReport(plugins) {
    const compatible = [];
    const partiallyCompatible = [];
    const incompatible = [];
    const reportLines = ['Vite Plugin Compatibility Report', '='.repeat(40), ''];
    for (const plugin of plugins) {
        const result = isVitePluginCompatible(plugin);
        if (result.compatible && result.warnings.length === 0) {
            compatible.push(plugin);
            reportLines.push(`[OK] ${plugin.name}`);
        }
        else if (result.compatible) {
            partiallyCompatible.push(plugin);
            reportLines.push(`[WARN] ${plugin.name}`);
            result.warnings.forEach((w) => reportLines.push(`  - ${w}`));
        }
        else {
            incompatible.push(plugin);
            reportLines.push(`[FAIL] ${plugin.name}`);
            reportLines.push(`  Unsupported hooks: ${result.unsupportedHooks.join(', ')}`);
            result.warnings.forEach((w) => reportLines.push(`  - ${w}`));
        }
        reportLines.push('');
    }
    reportLines.push('-'.repeat(40));
    reportLines.push(`Summary: ${compatible.length} compatible, ${partiallyCompatible.length} partial, ${incompatible.length} incompatible`);
    return {
        compatible,
        partiallyCompatible,
        incompatible,
        report: reportLines.join('\n'),
    };
}
/**
 * Create a shared dev server configuration
 */
export function createDevServerConfig(options = {}) {
    return {
        port: options.port ?? 3000,
        host: options.host ?? 'localhost',
        open: options.open ?? false,
        https: options.https ?? false,
        proxy: options.proxy ?? undefined,
        cors: options.cors ?? true,
    };
}
/**
 * Convert shared config to Vite format
 */
export function toViteServerConfig(config) {
    return {
        port: config.port,
        host: config.host,
        open: config.open,
        https: config.https,
        proxy: config.proxy,
        cors: config.cors,
    };
}
/**
 * Convert shared config to Rspack format
 */
export function toRspackDevServerConfig(config) {
    return {
        port: config.port,
        host: typeof config.host === 'boolean' ? '0.0.0.0' : config.host,
        open: config.open,
        https: config.https,
        proxy: config.proxy,
        headers: config.cors ? { 'Access-Control-Allow-Origin': '*' } : undefined,
    };
}
//# sourceMappingURL=compatibility.js.map