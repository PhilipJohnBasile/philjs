/**
 * Types for the PhilJS optimizer
 */
export interface Symbol {
    /** Unique symbol identifier */
    id: string;
    /** Symbol name */
    name: string;
    /** File path where the symbol is defined */
    filePath: string;
    /** Start position in the file */
    start: number;
    /** End position in the file */
    end: number;
    /** Symbol type */
    type: SymbolType;
    /** Dependencies on other symbols */
    dependencies: string[];
    /** Hash of the symbol content */
    hash: string;
    /** Whether this symbol is lazy */
    isLazy: boolean;
    /** Metadata */
    meta?: Record<string, unknown>;
}
export type SymbolType = 'function' | 'component' | 'handler' | 'loader' | 'action' | 'store' | 'resource';
export interface DependencyGraph {
    /** Map of symbol ID to symbol */
    symbols: Map<string, Symbol>;
    /** Map of symbol ID to dependent symbol IDs */
    dependents: Map<string, Set<string>>;
    /** Map of symbol ID to dependency symbol IDs */
    dependencies: Map<string, Set<string>>;
}
export interface ChunkManifest {
    /** Map of symbol ID to chunk file path */
    symbols: Record<string, string>;
    /** Map of chunk file path to symbol IDs */
    chunks: Record<string, string[]>;
    /** Import map for runtime loading */
    imports: Record<string, string>;
}
export interface OptimizerOptions {
    /** Root directory for the project */
    rootDir: string;
    /** Output directory for chunks */
    outDir?: string;
    /** Whether to enable lazy loading */
    lazy?: boolean;
    /** Minimum chunk size in bytes */
    minChunkSize?: number;
    /** Maximum chunk size in bytes */
    maxChunkSize?: number;
    /** Whether to preserve source maps */
    sourcemap?: boolean;
    /** Custom symbol extraction patterns */
    patterns?: SymbolPattern[];
    /** Whether to enable debug logging */
    debug?: boolean;
}
export interface SymbolPattern {
    /** Pattern name */
    name: string;
    /** Function to test if a node matches */
    test: (node: unknown) => boolean;
    /** Function to extract symbol from node */
    extract: (node: unknown, context: ExtractionContext) => Symbol | null;
}
export interface ExtractionContext {
    /** Current file path */
    filePath: string;
    /** Source code */
    source: string;
    /** AST */
    ast: unknown;
    /** Options */
    options: OptimizerOptions;
}
export interface TransformResult {
    /** Transformed code */
    code: string;
    /** Source map */
    map?: unknown;
    /** Extracted symbols */
    symbols: Symbol[];
    /** Dependencies */
    dependencies: string[];
}
export interface BundleStrategy {
    /** Strategy name */
    name: string;
    /** Function to group symbols into chunks */
    bundle: (graph: DependencyGraph, options: OptimizerOptions) => Map<string, Symbol[]>;
}
export interface LazyHandler {
    /** Handler ID */
    id: string;
    /** Handler function */
    handler: (...args: unknown[]) => unknown;
    /** Symbol ID */
    symbolId: string;
    /** Whether the handler has been loaded */
    loaded: boolean;
}
export interface RuntimeConfig {
    /** Base URL for loading chunks */
    baseUrl?: string;
    /** Manifest of symbols and chunks */
    manifest: ChunkManifest;
    /** Whether to prefetch chunks */
    prefetch?: boolean;
    /** Custom loader function */
    loader?: ((symbolId: string) => Promise<unknown>) | undefined;
}
//# sourceMappingURL=types.d.ts.map