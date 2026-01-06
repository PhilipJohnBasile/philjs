/**
 * Vite Plugin for WASM loading in PhilJS
 *
 * Provides seamless WASM module loading, optimization, and HMR support.
 */
/**
 * Vite plugin for WASM loading and optimization
 *
 * @example
 * ```ts
 * // vite.config.ts
 * import { viteWasmPlugin } from 'philjs-wasm/vite';
 *
 * export default defineConfig({
 *   plugins: [
 *     viteWasmPlugin({
 *       wasmDir: 'src/wasm',
 *       generateTypes: true,
 *       optimize: {
 *         wasmOpt: true,
 *         level: 'Os'
 *       }
 *     })
 *   ]
 * });
 * ```
 */
export function viteWasmPlugin(options = {}) {
    const { wasmDir = 'src/wasm', include = ['**/*.wasm'], exclude = ['node_modules/**'], streaming = true, cache = true, generateTypes = true, optimize = {}, hmr = true, debug = false } = options;
    let config;
    const wasmModules = new Map();
    let wasmCounter = 0;
    const log = (...args) => {
        if (debug) {
        }
    };
    return {
        name: 'vite-philjs-wasm',
        enforce: 'pre',
        configResolved(resolvedConfig) {
            config = resolvedConfig;
            log('Plugin initialized');
            log('WASM directory:', wasmDir);
            log('Mode:', config.mode);
        },
        /**
         * Handle .wasm file imports
         */
        async resolveId(source, importer) {
            // Handle .wasm imports
            if (source.endsWith('.wasm')) {
                log('Resolving WASM import:', source, 'from', importer);
                return null; // Let Vite handle resolution
            }
            // Handle ?wasm query for inline WASM
            if (source.includes('?wasm')) {
                const wasmPath = source.replace('?wasm', '');
                log('Resolving inline WASM:', wasmPath);
                return `\0virtual:wasm:${wasmPath}`;
            }
            return null;
        },
        /**
         * Load WASM modules with proper handling
         */
        async load(id) {
            // Handle virtual WASM modules
            if (id.startsWith('\0virtual:wasm:')) {
                const wasmPath = id.replace('\0virtual:wasm:', '');
                log('Loading virtual WASM module:', wasmPath);
                // Generate inline loading code
                return generateWasmLoader(wasmPath, { streaming, cache });
            }
            return null;
        },
        /**
         * Transform WASM imports
         */
        async transform(code, id) {
            // Skip non-JS/TS files
            if (!/\.(js|ts|tsx|jsx|mjs)$/.test(id)) {
                return null;
            }
            // Check for WASM imports
            const wasmImportRegex = /import\s+(\w+|\{[^}]+\})\s+from\s+['"]([^'"]+\.wasm)['"]/g;
            const wasmFetchRegex = /fetch\(['"]([^'"]+\.wasm)['"]\)/g;
            let hasWasmImport = wasmImportRegex.test(code);
            wasmImportRegex.lastIndex = 0; // Reset regex
            if (!hasWasmImport && !wasmFetchRegex.test(code)) {
                return null;
            }
            log('Transforming file with WASM imports:', id);
            let transformed = code;
            let hasChanges = false;
            // Transform ES imports of .wasm files
            transformed = transformed.replace(wasmImportRegex, (match, imports, wasmPath) => {
                hasChanges = true;
                const moduleId = `wasm_${++wasmCounter}`;
                wasmModules.set(moduleId, {
                    id: moduleId,
                    path: wasmPath,
                    exports: [],
                    size: 0,
                    optimized: false
                });
                // Generate async import with philjs-wasm loader
                return `
const ${moduleId}_promise = (async () => {
  const { loadWasm } = await import('philjs-wasm');
  return loadWasm('${wasmPath}', { cache: ${cache}, streaming: ${streaming} });
})();
const ${imports.includes('{') ? imports : `{ default: ${imports} }`} = await ${moduleId}_promise;
`.trim();
            });
            if (hasChanges) {
                // Add HMR support in development
                if (config.mode === 'development' && hmr) {
                    transformed += `
// HMR support for WASM modules
if (import.meta.hot) {
  import.meta.hot.accept(() => {
  });
}
`;
                }
                return {
                    code: transformed,
                    map: null
                };
            }
            return null;
        },
        /**
         * Configure build for WASM optimization
         */
        config(config, { command }) {
            return {
                build: {
                    ...config.build,
                    // Ensure WASM files are handled correctly
                    assetsInlineLimit: config.build?.assetsInlineLimit ?? 0,
                    rollupOptions: {
                        ...config.build?.rollupOptions,
                        // Handle WASM files as external assets
                        external: [
                            ...(Array.isArray(config.build?.rollupOptions?.external)
                                ? config.build.rollupOptions.external
                                : []),
                        ]
                    }
                },
                optimizeDeps: {
                    ...config.optimizeDeps,
                    // Exclude WASM files from dependency optimization
                    exclude: [
                        ...(config.optimizeDeps?.exclude || []),
                        '**/*.wasm'
                    ]
                }
            };
        },
        /**
         * Generate type definitions for WASM exports
         */
        async generateBundle(options, bundle) {
            if (!generateTypes)
                return;
            // Generate .d.ts files for discovered WASM modules
            if (wasmModules.size > 0 && debug) {
                log('Generating type definitions for', wasmModules.size, 'WASM modules');
                const typeDefinitions = generateWasmTypeDefinitions(wasmModules);
                this.emitFile({
                    type: 'asset',
                    fileName: 'wasm-types.d.ts',
                    source: typeDefinitions
                });
            }
        },
        /**
         * Log build summary
         */
        closeBundle() {
            if (wasmModules.size > 0) {
                console.log(`  WASM Modules: ${wasmModules.size}`);
                if (debug) {
                    wasmModules.forEach((info, id) => {
                        console.log(`    - ${id}: ${info.path}`);
                    });
                }
            }
        }
    };
}
/**
 * Generate WASM loader code
 */
function generateWasmLoader(wasmPath, options) {
    const { streaming, cache } = options;
    return `
import { loadWasm } from 'philjs-wasm';

let cachedModule = null;

export async function init() {
  if (cachedModule && ${cache}) {
    return cachedModule;
  }

  cachedModule = await loadWasm('${wasmPath}', {
    streaming: ${streaming},
    cache: ${cache}
  });

  return cachedModule;
}

export const module = init();
export default module;
`;
}
/**
 * Generate TypeScript type definitions for WASM modules
 */
function generateWasmTypeDefinitions(modules) {
    const lines = [
        '// Auto-generated WASM type definitions',
        '// Generated by philjs-wasm Vite plugin',
        '',
        'declare module "*.wasm" {',
        '  import type { WasmModule } from "philjs-wasm";',
        '  const wasmModule: Promise<WasmModule>;',
        '  export default wasmModule;',
        '}',
        '',
        'declare module "*?wasm" {',
        '  import type { WasmModule } from "philjs-wasm";',
        '  export function init(): Promise<WasmModule>;',
        '  export const module: Promise<WasmModule>;',
        '  export default module;',
        '}',
        ''
    ];
    // Add specific module declarations if we have export info
    for (const [id, info] of modules) {
        if (info.exports.length > 0) {
            lines.push(`// Module: ${info.path}`);
            lines.push(`declare module "${info.path}" {`);
            lines.push('  import type { WasmModule } from "philjs-wasm";');
            for (const exp of info.exports) {
                lines.push(`  export function ${exp}(...args: any[]): any;`);
            }
            lines.push('  const wasmModule: Promise<WasmModule>;');
            lines.push('  export default wasmModule;');
            lines.push('}');
            lines.push('');
        }
    }
    return lines.join('\n');
}
/**
 * Helper to detect WASM imports in source code
 */
export function detectWasmImports(code) {
    const imports = [];
    const lines = code.split('\n');
    lines.forEach((line, index) => {
        // Check for ES imports
        const importMatch = line.match(/import\s+.+\s+from\s+['"]([^'"]+\.wasm)['"]/);
        if (importMatch && importMatch[1] !== undefined) {
            imports.push({
                type: 'import',
                path: importMatch[1],
                line: index + 1
            });
        }
        // Check for fetch calls
        const fetchMatch = line.match(/fetch\(['"]([^'"]+\.wasm)['"]\)/);
        if (fetchMatch && fetchMatch[1] !== undefined) {
            imports.push({
                type: 'fetch',
                path: fetchMatch[1],
                line: index + 1
            });
        }
    });
    return imports;
}
/**
 * Create optimized WASM config for Vite
 */
export function createWasmConfig(options = {}) {
    return {
        plugins: [viteWasmPlugin(options)],
        build: {
            target: 'esnext',
            // Ensure top-level await works for WASM loading
            modulePreload: {
                polyfill: false
            }
        },
        optimizeDeps: {
            exclude: ['**/*.wasm']
        }
    };
}
export default viteWasmPlugin;
//# sourceMappingURL=vite-plugin.js.map