/**
 * Vite Compatibility
 * Maintain Vite dev server compatibility during Rspack migration
 */
/**
 * Vite plugin type (simplified)
 */
export interface VitePlugin {
    name: string;
    enforce?: 'pre' | 'post';
    apply?: 'build' | 'serve' | ((config: unknown, env: {
        command: string;
    }) => boolean);
    config?: (config: unknown, env: {
        command: string;
        mode: string;
    }) => unknown;
    configResolved?: (config: unknown) => void;
    configureServer?: (server: unknown) => void;
    transformIndexHtml?: (html: string) => string | Promise<string>;
    transform?: (code: string, id: string) => string | {
        code: string;
        map?: unknown;
    } | null | undefined | Promise<string | {
        code: string;
        map?: unknown;
    } | null | undefined>;
    load?: (id: string) => string | null | undefined | Promise<string | null | undefined>;
    resolveId?: (source: string, importer?: string) => string | null | undefined | {
        id: string;
        external?: boolean;
    } | Promise<string | null | undefined | {
        id: string;
        external?: boolean;
    }>;
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
    sourceAndMap?(options?: unknown): {
        source: string | Buffer;
        map: unknown;
    };
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
    loc?: {
        start: {
            line: number;
            column: number;
        };
        end: {
            line: number;
            column: number;
        };
    };
    stack?: string;
}
/**
 * Compilation warning
 */
export interface CompilationWarning {
    message: string;
    module?: Module;
    loc?: {
        start: {
            line: number;
            column: number;
        };
        end: {
            line: number;
            column: number;
        };
    };
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
    errors: Array<{
        message: string;
        moduleId?: string;
    }>;
    warnings: Array<{
        message: string;
        moduleId?: string;
    }>;
    assets: Array<{
        name: string;
        size: number;
    }>;
    modules: Array<{
        id: string;
        name: string;
        size: number;
    }>;
    chunks: Array<{
        id: string | number;
        names: string[];
        files: string[];
    }>;
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
    resolve(context: Record<string, unknown>, path: string, request: string, resolveContext: Record<string, unknown>, callback: (err: Error | null, result?: string) => void): void;
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
export declare function philJSVite(options?: PhilJSViteOptions): VitePlugin;
/**
 * Rspack-Vite compatibility plugin
 * Allows using Vite for dev and Rspack for production
 */
export declare function rspackViteCompat(): VitePlugin;
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
 * CSS module processing result
 */
export interface CSSModuleResult {
    css: string;
    exports: Record<string, string>;
    map?: unknown;
}
/**
 * Asset reference
 */
export interface AssetReference {
    url: string;
    filename: string;
    type: string;
}
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
export declare function adaptVitePlugin(vitePlugin: VitePlugin, options?: AdapterOptions): AdaptedRspackPlugin;
/**
 * Adapt multiple Vite plugins to Rspack
 */
export declare function adaptVitePlugins(vitePlugins: VitePlugin[], options?: AdapterOptions): AdaptedRspackPlugin[];
/**
 * Merge multiple adapted plugins into a single configuration
 */
export declare function mergeAdaptedPlugins(adaptedPlugins: AdaptedRspackPlugin[]): {
    plugins: RspackPlugin[];
    rules: RspackModuleRule[];
};
/**
 * Check if a Vite plugin is compatible with Rspack adaptation
 */
export declare function isVitePluginCompatible(plugin: VitePlugin): {
    compatible: boolean;
    warnings: string[];
    unsupportedHooks: string[];
};
/**
 * Create a compatibility report for a set of Vite plugins
 */
export declare function createCompatibilityReport(plugins: VitePlugin[]): {
    compatible: VitePlugin[];
    partiallyCompatible: VitePlugin[];
    incompatible: VitePlugin[];
    report: string;
};
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
export declare function createDevServerConfig(options?: Partial<DevServerConfig>): DevServerConfig;
/**
 * Convert shared config to Vite format
 */
export declare function toViteServerConfig(config: DevServerConfig): unknown;
/**
 * Convert shared config to Rspack format
 */
export declare function toRspackDevServerConfig(config: DevServerConfig): unknown;
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
export declare function viteAdapter(options?: ViteAdapterOptions): Record<string, unknown>;
export declare function createViteCompatibleConfig(options?: ViteAdapterOptions): Record<string, unknown>;
export declare function convertRspackToVite(rspackConfig: Partial<RspackConfiguration>): Record<string, unknown>;
export interface RspackLoaderMappingResult {
    needsPlugin: boolean;
    pluginName?: string;
    nativeSupport?: boolean;
}
export declare function mapRspackPluginToVite(plugin: unknown): VitePlugin | null;
export declare function mapRspackLoaderToVite(loader: RspackModuleRule): RspackLoaderMappingResult;
export declare function mapRspackOptionsToVite(options: {
    target?: string | string[];
    devtool?: string | false;
    externals?: unknown;
}): Record<string, unknown>;
//# sourceMappingURL=compatibility.d.ts.map