/**
 * Vite Compatibility
 * Maintain Vite dev server compatibility during Rspack migration
 */

// ============================================================================
// Vite Plugin Types
// ============================================================================

/**
 * Vite plugin type (simplified)
 */
export interface VitePlugin {
  name: string;
  enforce?: 'pre' | 'post';
  apply?: 'build' | 'serve' | ((config: unknown, env: { command: string }) => boolean);
  config?: (config: unknown, env: { command: string; mode: string }) => unknown;
  configResolved?: (config: unknown) => void;
  configureServer?: (server: unknown) => void;
  transformIndexHtml?: (html: string) => string | Promise<string>;
  transform?: (
    code: string,
    id: string
  ) => string | { code: string; map?: unknown } | null | undefined | Promise<string | { code: string; map?: unknown } | null | undefined>;
  load?: (id: string) => string | null | undefined | Promise<string | null | undefined>;
  resolveId?: (
    source: string,
    importer?: string
  ) => string | null | undefined | { id: string; external?: boolean } | Promise<string | null | undefined | { id: string; external?: boolean }>;
  buildStart?: (options: unknown) => void | Promise<void>;
  buildEnd?: (error?: Error) => void | Promise<void>;
  generateBundle?: (options: unknown, bundle: Record<string, unknown>) => void | Promise<void>;
  closeBundle?: () => void | Promise<void>;
  handleHotUpdate?: (ctx: ViteHotContext) => void | ModuleNode[] | Promise<void | ModuleNode[]>;
}

/**
 * Vite HMR context
 */
export interface ViteHotContext {
  file: string;
  timestamp: number;
  modules: ModuleNode[];
  read: () => Promise<string>;
  server: unknown;
}

/**
 * Vite module node
 */
export interface ModuleNode {
  id: string | null;
  file: string | null;
  importers: Set<ModuleNode>;
  importedModules: Set<ModuleNode>;
  acceptedHmrDeps: Set<ModuleNode>;
  url: string;
  type: 'js' | 'css';
}

// ============================================================================
// Rspack Plugin Types
// ============================================================================

/**
 * Rspack compiler interface
 */
export interface RspackCompiler {
  hooks: RspackCompilerHooks;
  options: RspackCompilerOptions;
  context: string;
  inputFileSystem: FileSystem;
  outputFileSystem: FileSystem;
}

/**
 * Rspack compiler hooks
 */
export interface RspackCompilerHooks {
  beforeCompile: AsyncHook<[CompilationParams]>;
  compile: SyncHook<[CompilationParams]>;
  thisCompilation: SyncHook<[RspackCompilation, CompilationParams]>;
  compilation: SyncHook<[RspackCompilation, CompilationParams]>;
  make: AsyncHook<[RspackCompilation]>;
  afterCompile: AsyncHook<[RspackCompilation]>;
  emit: AsyncHook<[RspackCompilation]>;
  afterEmit: AsyncHook<[RspackCompilation]>;
  done: AsyncHook<[Stats]>;
  failed: SyncHook<[Error]>;
  invalid: SyncHook<[string | null, number]>;
  watchRun: AsyncHook<[RspackCompiler]>;
  watchClose: SyncHook<[]>;
  normalModuleFactory: SyncHook<[NormalModuleFactory]>;
}

/**
 * Rspack compiler options
 */
export interface RspackCompilerOptions {
  mode?: 'development' | 'production' | 'none';
  context?: string;
  entry?: unknown;
  output?: {
    path?: string;
    filename?: string;
    publicPath?: string;
  };
  resolve?: {
    extensions?: string[];
    alias?: Record<string, string>;
  };
  module?: {
    rules?: RspackModuleRule[];
  };
}

/**
 * Rspack module rule
 */
export interface RspackModuleRule {
  test?: RegExp | string;
  include?: RegExp | string | Array<RegExp | string>;
  exclude?: RegExp | string | Array<RegExp | string>;
  use?: RspackLoaderConfig | RspackLoaderConfig[];
  type?: string;
  resourceQuery?: RegExp | string;
}

/**
 * Rspack loader configuration
 */
export interface RspackLoaderConfig {
  loader: string;
  options?: Record<string, unknown>;
}

/**
 * Rspack compilation
 */
export interface RspackCompilation {
  hooks: CompilationHooks;
  assets: Record<string, Asset>;
  modules: Set<Module>;
  chunks: Set<Chunk>;
  emitAsset: (filename: string, source: Source) => void;
  deleteAsset: (filename: string) => void;
  getAsset: (filename: string) => Asset | undefined;
  updateAsset: (filename: string, newSource: Source | ((source: Source) => Source)) => void;
  errors: CompilationError[];
  warnings: CompilationWarning[];
  getPath: (filename: string, data?: PathData) => string;
  inputFileSystem: FileSystem;
  resolverFactory: ResolverFactory;
}

/**
 * Compilation hooks
 */
export interface CompilationHooks {
  buildModule: SyncHook<[Module]>;
  succeedModule: SyncHook<[Module]>;
  failedModule: SyncHook<[Module, Error]>;
  processAssets: AsyncHook<[Record<string, Asset>]>;
  afterProcessAssets: SyncHook<[Record<string, Asset>]>;
  optimizeModules: SyncHook<[Module[]]>;
  afterOptimizeModules: SyncHook<[Module[]]>;
  optimizeChunks: SyncHook<[Chunk[]]>;
  afterOptimizeChunks: SyncHook<[Chunk[]]>;
}

/**
 * Compilation parameters
 */
export interface CompilationParams {
  normalModuleFactory: NormalModuleFactory;
  contextModuleFactory: unknown;
}

/**
 * Normal module factory
 */
export interface NormalModuleFactory {
  hooks: NormalModuleFactoryHooks;
}

/**
 * Normal module factory hooks
 */
export interface NormalModuleFactoryHooks {
  beforeResolve: AsyncHook<[ResolveData]>;
  afterResolve: AsyncHook<[ResolveData]>;
  resolve: AsyncHook<[ResolveData]>;
  createModule: AsyncHook<[CreateModuleData, ResolveData]>;
}

/**
 * Resolve data
 */
export interface ResolveData {
  request: string;
  context: string;
  contextInfo: {
    issuer: string;
    compiler: string;
  };
  resolveOptions: Record<string, unknown>;
  dependencies: unknown[];
  createData?: {
    resource?: string;
    loaders?: RspackLoaderConfig[];
  };
}

/**
 * Create module data
 */
export interface CreateModuleData {
  resource: string;
  loaders: RspackLoaderConfig[];
  resourceResolveData: unknown;
}

/**
 * Module
 */
export interface Module {
  identifier(): string;
  request: string;
  resource?: string;
  rawRequest?: string;
  loaders?: RspackLoaderConfig[];
}

/**
 * Chunk
 */
export interface Chunk {
  id: string | number | null;
  name: string | null;
  files: Set<string>;
  runtime: Set<string>;
}

/**
 * Asset
 */
export interface Asset {
  source: Source;
  info: AssetInfo;
}

/**
 * Asset info
 */
export interface AssetInfo {
  immutable?: boolean;
  minimized?: boolean;
  development?: boolean;
  hotModuleReplacement?: boolean;
  sourceFilename?: string;
  contenthash?: string;
}

/**
 * Source
 */
export interface Source {
  source(): string | Buffer;
  size(): number;
  map?(options?: unknown): unknown;
  sourceAndMap?(options?: unknown): { source: string | Buffer; map: unknown };
  updateHash?(hash: unknown): void;
}

/**
 * Path data
 */
export interface PathData {
  filename?: string;
  chunk?: Chunk;
  hash?: string;
  contentHash?: string;
}

/**
 * Compilation error
 */
export interface CompilationError {
  message: string;
  module?: Module;
  loc?: { start: { line: number; column: number }; end: { line: number; column: number } };
  stack?: string;
}

/**
 * Compilation warning
 */
export interface CompilationWarning {
  message: string;
  module?: Module;
  loc?: { start: { line: number; column: number }; end: { line: number; column: number } };
}

/**
 * Stats
 */
export interface Stats {
  hasErrors(): boolean;
  hasWarnings(): boolean;
  toJson(options?: unknown): StatsJson;
  toString(options?: unknown): string;
}

/**
 * Stats JSON
 */
export interface StatsJson {
  errors: Array<{ message: string; moduleId?: string }>;
  warnings: Array<{ message: string; moduleId?: string }>;
  assets: Array<{ name: string; size: number }>;
  modules: Array<{ id: string; name: string; size: number }>;
  chunks: Array<{ id: string | number; names: string[]; files: string[] }>;
  time: number;
  builtAt: number;
  hash: string;
}

/**
 * File system interface
 */
export interface FileSystem {
  readFile(path: string, callback: (err: Error | null, data?: Buffer) => void): void;
  readFile(path: string, encoding: string, callback: (err: Error | null, data?: string) => void): void;
  stat(path: string, callback: (err: Error | null, stats?: FileStats) => void): void;
  readdir(path: string, callback: (err: Error | null, files?: string[]) => void): void;
}

/**
 * File stats
 */
export interface FileStats {
  isFile(): boolean;
  isDirectory(): boolean;
  mtime: Date;
  size: number;
}

/**
 * Resolver factory
 */
export interface ResolverFactory {
  get(type: string, options?: Record<string, unknown>): Resolver;
}

/**
 * Resolver
 */
export interface Resolver {
  resolve(
    context: Record<string, unknown>,
    path: string,
    request: string,
    resolveContext: Record<string, unknown>,
    callback: (err: Error | null, result?: string) => void
  ): void;
}

/**
 * Sync hook
 */
export interface SyncHook<T extends unknown[]> {
  tap(name: string, fn: (...args: T) => void): void;
  call(...args: T): void;
}

/**
 * Async hook
 */
export interface AsyncHook<T extends unknown[]> {
  tapAsync(name: string, fn: (...args: [...T, (err?: Error | null) => void]) => void): void;
  tapPromise(name: string, fn: (...args: T) => Promise<void>): void;
  tap(name: string, fn: (...args: T) => void): void;
  promise(...args: T): Promise<void>;
  callAsync(...args: [...T, (err?: Error | null) => void]): void;
}

// ============================================================================
// Rspack Plugin Interface
// ============================================================================

/**
 * Rspack plugin interface
 */
export interface RspackPlugin {
  name: string;
  apply(compiler: RspackCompiler): void;
}

/**
 * Rspack loader context
 */
export interface RspackLoaderContext {
  resourcePath: string;
  resourceQuery: string;
  context: string;
  rootContext: string;
  request: string;
  query: string | Record<string, unknown>;
  data: Record<string, unknown>;
  cacheable(flag?: boolean): void;
  callback(err: Error | null, content?: string | Buffer, sourceMap?: unknown, additionalData?: unknown): void;
  async(): (err: Error | null, content?: string | Buffer, sourceMap?: unknown, additionalData?: unknown) => void;
  emitFile(name: string, content: string | Buffer, sourceMap?: unknown): void;
  emitWarning(warning: Error | string): void;
  emitError(error: Error | string): void;
  addDependency(file: string): void;
  addContextDependency(context: string): void;
  addMissingDependency(file: string): void;
  getDependencies(): string[];
  getContextDependencies(): string[];
  getMissingDependencies(): string[];
  resolve(context: string, request: string, callback: (err: Error | null, result?: string) => void): void;
  getOptions<T = Record<string, unknown>>(): T;
  getResolve(options?: Record<string, unknown>): (context: string, request: string) => Promise<string>;
  _compiler: RspackCompiler;
  _compilation: RspackCompilation;
  hot?: boolean;
  mode: 'development' | 'production' | 'none';
}

// ============================================================================
// Adapted Plugin Types
// ============================================================================

/**
 * Virtual module entry
 */
export interface VirtualModule {
  id: string;
  code: string;
  map?: unknown;
}

/**
 * Transform result
 */
export interface TransformResult {
  code: string;
  map?: unknown;
}

/**
 * Adapter options
 */
export interface AdapterOptions {
  /** Enable HMR support */
  hmr?: boolean;
  /** Enable virtual modules */
  virtualModules?: boolean;
  /** Enable CSS modules handling */
  cssModules?: boolean;
  /** Enable asset handling */
  assets?: boolean;
  /** Custom transform filter */
  transformFilter?: (id: string) => boolean;
  /** Custom resolve filter */
  resolveFilter?: (source: string) => boolean;
}

/**
 * Adapted Rspack plugin result
 */
export interface AdaptedRspackPlugin {
  plugin: RspackPlugin;
  loaders: RspackModuleRule[];
}

/**
 * PhilJS Vite plugin options
 */
export interface PhilJSViteOptions {
  /** Enable signal optimization */
  signals?: boolean;
  /** Enable JSX transform */
  jsx?: boolean;
  /** Enable auto-memoization */
  autoMemo?: boolean;
  /** Enable HMR for signals */
  signalHMR?: boolean;
}

/**
 * PhilJS Vite plugin for development
 * Provides fast HMR and signal-aware dev experience
 */
export function philJSVite(options: PhilJSViteOptions = {}): VitePlugin {
  const {
    signals = true,
    jsx = true,
    autoMemo = false,
    signalHMR = true,
  } = options;

  return {
    name: 'philjs-vite',
    enforce: 'pre',

    config(config, { command }) {
      const isServe = command === 'serve';
      const baseConfig = (config && typeof config === 'object') ? config as Record<string, unknown> : {};

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
      if (id.includes('node_modules')) return null;

      // Only process TS/JS/TSX/JSX files
      if (!/\.[jt]sx?$/.test(id)) return null;

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
export function rspackViteCompat(): VitePlugin {
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
      console.log(`[PhilJS] Using ${(resolvedConfig as { command?: string }).command === 'serve' ? 'Vite' : 'Rspack'} build`);
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
  private modules: Map<string, VirtualModule> = new Map();
  private prefix = '\0virtual:';

  /**
   * Add a virtual module
   */
  add(id: string, code: string, map?: unknown): void {
    const normalizedId = this.normalizeId(id);
    this.modules.set(normalizedId, { id: normalizedId, code, map });
  }

  /**
   * Get a virtual module
   */
  get(id: string): VirtualModule | undefined {
    return this.modules.get(this.normalizeId(id));
  }

  /**
   * Check if a module is virtual
   */
  isVirtual(id: string): boolean {
    const normalizedId = this.normalizeId(id);
    return this.modules.has(normalizedId) || id.startsWith(this.prefix) || id.startsWith('virtual:');
  }

  /**
   * Normalize virtual module ID
   */
  normalizeId(id: string): string {
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
  getAll(): Map<string, VirtualModule> {
    return new Map(this.modules);
  }

  /**
   * Clear all virtual modules
   */
  clear(): void {
    this.modules.clear();
  }
}

// ============================================================================
// HMR API Translation
// ============================================================================

/**
 * Rspack HMR runtime API
 */
export interface RspackHMRApi {
  accept(callback?: (outdatedModules: string[]) => void): void;
  accept(dependencies: string | string[], callback?: (outdatedDependencies: unknown[]) => void): void;
  decline(): void;
  dispose(callback: (data: Record<string, unknown>) => void): void;
  invalidate(): void;
  addStatusHandler(callback: (status: string) => void): void;
  removeStatusHandler(callback: (status: string) => void): void;
  status(): string;
  data: Record<string, unknown>;
}

/**
 * Create HMR translation layer between Vite and Rspack
 */
function createHMRTranslationCode(): string {
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

// ============================================================================
// CSS Modules Handler
// ============================================================================

/**
 * CSS module processing result
 */
export interface CSSModuleResult {
  css: string;
  exports: Record<string, string>;
  map?: unknown;
}

/**
 * Process CSS module for Rspack compatibility
 */
function processCSSModule(css: string, filename: string): CSSModuleResult {
  const exports: Record<string, string> = {};
  const classNameRegex = /\.([a-zA-Z_][a-zA-Z0-9_-]*)/g;
  let match: RegExpExecArray | null;

  // Extract class names and generate hashed versions
  const processedClasses = new Map<string, string>();
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
    processedCSS = processedCSS.replace(
      new RegExp(`\\.${originalClass}(?=[^a-zA-Z0-9_-])`, 'g'),
      `.${hashedClass}`
    );
  });

  return { css: processedCSS, exports };
}

/**
 * Generate a hash for CSS module class names
 */
function generateCSSModuleHash(filename: string, className: string): string {
  const str = `${filename}:${className}`;
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash).toString(36).slice(0, 5);
}

// ============================================================================
// Asset Handler
// ============================================================================

/**
 * Asset reference
 */
export interface AssetReference {
  url: string;
  filename: string;
  type: string;
}

/**
 * Asset type mapping
 */
const ASSET_TYPES: Record<string, string> = {
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
function isAsset(path: string): boolean {
  const ext = getExtension(path);
  return ext in ASSET_TYPES;
}

/**
 * Get file extension
 */
function getExtension(path: string): string {
  const lastDot = path.lastIndexOf('.');
  return lastDot >= 0 ? path.slice(lastDot).toLowerCase() : '';
}

/**
 * Get asset MIME type
 */
function getAssetType(path: string): string {
  const ext = getExtension(path);
  return ASSET_TYPES[ext] || 'application/octet-stream';
}

// ============================================================================
// Source Implementation
// ============================================================================

/**
 * Raw source implementation for Rspack assets
 */
class RawSource implements Source {
  private content: string | Buffer;

  constructor(content: string | Buffer) {
    this.content = content;
  }

  source(): string | Buffer {
    return this.content;
  }

  size(): number {
    if (typeof this.content === 'string') {
      return Buffer.byteLength(this.content, 'utf8');
    }
    return this.content.length;
  }

  map(): unknown {
    return null;
  }

  sourceAndMap(): { source: string | Buffer; map: unknown } {
    return { source: this.content, map: null };
  }
}

/**
 * Source map source implementation
 */
class SourceMapSource implements Source {
  private content: string;
  private sourceMap: unknown;

  constructor(content: string, sourceMap: unknown) {
    this.content = content;
    this.sourceMap = sourceMap;
  }

  source(): string {
    return this.content;
  }

  size(): number {
    return Buffer.byteLength(this.content, 'utf8');
  }

  map(): unknown {
    return this.sourceMap;
  }

  sourceAndMap(): { source: string; map: unknown } {
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
export function adaptVitePlugin(
  vitePlugin: VitePlugin,
  options: AdapterOptions = {}
): AdaptedRspackPlugin {
  const {
    hmr = true,
    virtualModules = true,
    cssModules = true,
    assets = true,
    transformFilter = () => true,
    resolveFilter = () => true,
  } = options;

  const pluginName = `rspack-adapted-${vitePlugin.name}`;
  const virtualStore = new VirtualModuleStore();
  const loaders: RspackModuleRule[] = [];

  // Track build state
  let buildStartCalled = false;

  /**
   * Create the main Rspack plugin
   */
  const rspackPlugin: RspackPlugin = {
    name: pluginName,

    apply(compiler: RspackCompiler): void {
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
        compiler.hooks.normalModuleFactory.tap(pluginName, (factory: NormalModuleFactory) => {
          factory.hooks.beforeResolve.tapPromise(pluginName, async (resolveData: ResolveData) => {
            if (!resolveFilter(resolveData.request)) {
              return;
            }

            const importer = resolveData.contextInfo.issuer || undefined;
            const result = await Promise.resolve(
              vitePlugin.resolveId?.(resolveData.request, importer)
            );

            if (result) {
              // Handle string result
              if (typeof result === 'string') {
                // Check if this creates a virtual module
                if (result.startsWith('\0') || result.startsWith('virtual:')) {
                  if (virtualModules) {
                    resolveData.request = virtualStore.normalizeId(result);
                  }
                } else {
                  resolveData.request = result;
                }
              }
              // Handle object result with id and external flag
              else if (typeof result === 'object' && result !== null) {
                if (result.external) {
                  // Mark as external - skip bundling
                  resolveData.request = result.id;
                } else {
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
        compiler.hooks.emit.tapPromise(pluginName, async (compilation: RspackCompilation) => {
          // Convert Rspack assets to Vite bundle format
          const bundle: Record<string, unknown> = {};

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
              const bundleEntry = bundle[filename] as Record<string, unknown>;
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
            const item = chunkOrAsset as Record<string, unknown>;
            const existingAsset = compilation.getAsset(filename);
            const newSource = (item['source'] as string | undefined) ?? (item['code'] as string | undefined);

            if (newSource && existingAsset) {
              const sourceContent = new RawSource(newSource);
              compilation.updateAsset(filename, sourceContent);
            } else if (newSource && !existingAsset) {
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
        compiler.hooks.done.tapPromise(pluginName, async (stats: Stats) => {
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
    const viteAdapterLoader = createViteAdapterLoader(
      vitePlugin,
      virtualStore,
      { transformFilter, cssModules, assets, hmr }
    );

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
function createViteAdapterLoader(
  vitePlugin: VitePlugin,
  virtualStore: VirtualModuleStore,
  options: {
    transformFilter: (id: string) => boolean;
    cssModules: boolean;
    assets: boolean;
    hmr: boolean;
  }
): (this: RspackLoaderContext, source: string) => Promise<string> {
  return async function viteAdapterLoader(
    this: RspackLoaderContext,
    source: string
  ): Promise<string> {
    const id = this.resourcePath + this.resourceQuery;
    const callback = this.async();

    try {
      let code = source;
      let map: unknown = undefined;

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
          } else {
            code = transformResult.code;
            map = transformResult.map;
          }
        }
      }

      // Handle CSS modules
      if (options.cssModules && id.endsWith('.module.css')) {
        const cssResult = processCSSModule(code, this.resourcePath);
        // Emit the processed CSS
        this.emitFile(
          this.resourcePath.replace(/\.module\.css$/, '.css'),
          cssResult.css
        );
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
      } else {
        callback(null, code);
      }
    } catch (error) {
      callback(error instanceof Error ? error : new Error(String(error)));
    }

    return source; // Return type satisfaction, actual return via callback
  };
}

/**
 * Create a loader for virtual modules
 */
function createVirtualModuleLoader(
  virtualStore: VirtualModuleStore
): (this: RspackLoaderContext, source: string) => string {
  return function virtualModuleLoader(
    this: RspackLoaderContext,
    _source: string
  ): string {
    const id = this.resourcePath;
    const virtualModule = virtualStore.get(id);

    if (virtualModule) {
      if (virtualModule.map) {
        this.callback(null, virtualModule.code, virtualModule.map);
      } else {
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
export function adaptVitePlugins(
  vitePlugins: VitePlugin[],
  options: AdapterOptions = {}
): AdaptedRspackPlugin[] {
  return vitePlugins.map((plugin) => adaptVitePlugin(plugin, options));
}

/**
 * Merge multiple adapted plugins into a single configuration
 */
export function mergeAdaptedPlugins(
  adaptedPlugins: AdaptedRspackPlugin[]
): { plugins: RspackPlugin[]; rules: RspackModuleRule[] } {
  const plugins: RspackPlugin[] = [];
  const rules: RspackModuleRule[] = [];

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
export function isVitePluginCompatible(plugin: VitePlugin): {
  compatible: boolean;
  warnings: string[];
  unsupportedHooks: string[];
} {
  const warnings: string[] = [];
  const unsupportedHooks: string[] = [];

  // Check for unsupported hooks
  if (plugin.configureServer) {
    unsupportedHooks.push('configureServer');
    warnings.push(
      `Plugin "${plugin.name}" uses configureServer which requires Vite dev server. ` +
      'This hook will not work with Rspack.'
    );
  }

  if (plugin.handleHotUpdate) {
    warnings.push(
      `Plugin "${plugin.name}" uses handleHotUpdate. HMR behavior may differ in Rspack.`
    );
  }

  if (plugin.transformIndexHtml) {
    unsupportedHooks.push('transformIndexHtml');
    warnings.push(
      `Plugin "${plugin.name}" uses transformIndexHtml. Use html-webpack-plugin instead.`
    );
  }

  if (plugin.config) {
    warnings.push(
      `Plugin "${plugin.name}" uses config hook. Vite config will not be applied in Rspack.`
    );
  }

  if (plugin.configResolved) {
    warnings.push(
      `Plugin "${plugin.name}" uses configResolved hook. Vite config will not be available.`
    );
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
export function createCompatibilityReport(plugins: VitePlugin[]): {
  compatible: VitePlugin[];
  partiallyCompatible: VitePlugin[];
  incompatible: VitePlugin[];
  report: string;
} {
  const compatible: VitePlugin[] = [];
  const partiallyCompatible: VitePlugin[] = [];
  const incompatible: VitePlugin[] = [];
  const reportLines: string[] = ['Vite Plugin Compatibility Report', '='.repeat(40), ''];

  for (const plugin of plugins) {
    const result = isVitePluginCompatible(plugin);

    if (result.compatible && result.warnings.length === 0) {
      compatible.push(plugin);
      reportLines.push(`[OK] ${plugin.name}`);
    } else if (result.compatible) {
      partiallyCompatible.push(plugin);
      reportLines.push(`[WARN] ${plugin.name}`);
      result.warnings.forEach((w) => reportLines.push(`  - ${w}`));
    } else {
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
 * Development server configuration shared between Vite and Rspack
 */
export interface DevServerConfig {
  port: number;
  host: string | boolean;
  open: boolean;
  https: boolean;
  proxy: Record<string, {
    target: string;
    changeOrigin?: boolean;
    rewrite?: (path: string) => string;
  }> | undefined;
  cors: boolean;
}

/**
 * Create a shared dev server configuration
 */
export function createDevServerConfig(options: Partial<DevServerConfig> = {}): DevServerConfig {
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
export function toViteServerConfig(config: DevServerConfig): unknown {
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
export function toRspackDevServerConfig(config: DevServerConfig): unknown {     
  return {
    port: config.port,
    host: typeof config.host === 'boolean' ? '0.0.0.0' : config.host,
    open: config.open,
    https: config.https,
    proxy: config.proxy,
    headers: config.cors ? { 'Access-Control-Allow-Origin': '*' } : undefined,  
  };
}

// ============================================================================
// Vite Adapter Utilities
// ============================================================================

export interface ViteAdapterOptions {
  mode?: 'development' | 'production';
  minify?: boolean;
  sourcemap?: boolean | 'inline' | 'hidden';
  build?: {
    outDir?: string;
    minify?: boolean | 'esbuild' | 'terser';
    sourcemap?: boolean | 'inline' | 'hidden';
    assetsInlineLimit?: number;
    target?: string;
    lib?: {
      entry?: string;
      name?: string;
      formats?: string[];
    };
    rollupOptions?: {
      external?: string[];
      output?: {
        globals?: Record<string, string>;
      };
    };
  };
  server?: {
    port?: number;
    hot?: boolean;
    hmr?: boolean | Record<string, unknown>;
    proxy?: Record<string, string>;
  };
  resolve?: {
    alias?: Record<string, string>;
  };
  css?: {
    modules?: {
      localsConvention?: string;
    };
  };
  esbuild?: {
    target?: string;
    jsx?: string;
  };
  plugins?: VitePlugin[];
  philjs?: boolean;
}

export function viteAdapter(options: ViteAdapterOptions = {}): Record<string, unknown> {
  const mode = options.mode ?? 'development';
  const build = { ...(options.build ?? {}) };
  const server = { ...(options.server ?? {}) };

  if (options.minify !== undefined && build.minify === undefined) {
    build.minify = options.minify;
  }

  if (options.sourcemap !== undefined && build.sourcemap === undefined) {
    build.sourcemap = options.sourcemap;
  }

  if (mode === 'production' && build.minify === undefined) {
    build.minify = true;
  }

  if (mode === 'development' && server.hmr === undefined) {
    server.hmr = server.hot ?? true;
  }

  return {
    mode,
    ...options,
    build,
    server: Object.keys(server).length ? server : options.server,
  };
}

export function createViteCompatibleConfig(
  options: ViteAdapterOptions = {}
): Record<string, unknown> {
  const base = viteAdapter(options);
  const plugins = [...(options.plugins ?? [])];

  if (options.philjs) {
    plugins.unshift(philJSVite());
  }

  return {
    ...base,
    plugins,
    resolve: options.resolve ? { ...options.resolve } : undefined,
    css: options.css ? { ...options.css } : undefined,
    esbuild: options.esbuild ? { ...options.esbuild } : undefined,
  };
}

export function convertRspackToVite(
  rspackConfig: Partial<RspackConfiguration>
): Record<string, unknown> {
  const mapped = mapRspackOptionsToVite(rspackConfig);
  const build = { ...(mapped.build ?? {}) } as Record<string, unknown>;

  if (rspackConfig.output?.path) {
    build['outDir'] = rspackConfig.output.path;
  }

  if (rspackConfig.optimization?.minimize !== undefined) {
    build['minify'] = rspackConfig.optimization.minimize;
  }

  const viteConfig: Record<string, unknown> = {
    ...mapped,
    build,
  };

  if (rspackConfig.output?.publicPath) {
    viteConfig['base'] = rspackConfig.output.publicPath;
  }

  if (rspackConfig.resolve?.alias) {
    viteConfig['resolve'] = { alias: rspackConfig.resolve.alias };
  }

  if (rspackConfig.devServer) {
    viteConfig['server'] = {
      port: rspackConfig.devServer.port,
      proxy: rspackConfig.devServer.proxy,
    };
  }

  if (rspackConfig.plugins) {
    const plugins: VitePlugin[] = [];
    for (const plugin of rspackConfig.plugins ?? []) {
      const mappedPlugin = mapRspackPluginToVite(plugin);
      if (mappedPlugin) {
        plugins.push(mappedPlugin);
      }
    }
    viteConfig['plugins'] = plugins;
  }

  return viteConfig;
}

export interface RspackLoaderMappingResult {
  needsPlugin: boolean;
  pluginName?: string;
  nativeSupport?: boolean;
}

export function mapRspackPluginToVite(plugin: unknown): VitePlugin | null {
  if (!plugin || typeof plugin !== 'object') return null;
  const name = (plugin as { constructor?: { name?: string } }).constructor?.name;

  if (name === 'HtmlRspackPlugin' || name === 'HtmlWebpackPlugin') {
    return {
      name: 'vite:html',
      transformIndexHtml: (html) => html,
    };
  }

  if (name === 'DefinePlugin') {
    const definitions = (plugin as { definitions?: Record<string, string> }).definitions ?? {};
    return {
      name: 'vite:define',
      config: () => ({ define: definitions }),
    };
  }

  return null;
}

export function mapRspackLoaderToVite(loader: RspackModuleRule): RspackLoaderMappingResult {
  const uses = normalizeLoaderUse(loader.use);
  const loaderNames = uses.map((item) => item.loader);

  if (loaderNames.includes('@svgr/webpack')) {
    return { needsPlugin: true, pluginName: 'vite-plugin-svgr' };
  }

  if (loaderNames.some((name) => name.includes('css-loader')) || /css/.test(String(loader.test))) {
    return { needsPlugin: false, nativeSupport: true };
  }

  if (loaderNames.some((name) => name.includes('ts-loader')) || /tsx?/.test(String(loader.test))) {
    return { needsPlugin: false, nativeSupport: true };
  }

  if (typeof loader.type === 'string' && loader.type.startsWith('asset')) {
    return { needsPlugin: false, nativeSupport: true };
  }

  return { needsPlugin: false };
}

export function mapRspackOptionsToVite(options: {
  target?: string | string[];
  devtool?: string | false;
  externals?: unknown;
}): Record<string, unknown> {
  const build: Record<string, unknown> = {};

  if (options.target) {
    build['target'] = Array.isArray(options.target) ? options.target[0] : options.target;
  }

  if (options.devtool) {
    if (options.devtool === 'inline-source-map') {
      build['sourcemap'] = 'inline';
    } else if (options.devtool === 'hidden-source-map') {
      build['sourcemap'] = 'hidden';
    } else {
      build['sourcemap'] = true;
    }
  } else if (options.devtool === false) {
    build['sourcemap'] = false;
  }

  if (Array.isArray(options.externals)) {
    build['rollupOptions'] = {
      external: options.externals,
    };
  }

  return { build };
}

function normalizeLoaderUse(use?: RspackModuleRule['use']): Array<{ loader: string }> {
  if (!use) return [];
  const entries = Array.isArray(use) ? use : [use];
  return entries.map((entry) => {
    if (typeof entry === 'string') {
      return { loader: entry };
    }
    return { loader: entry.loader };
  });
}
