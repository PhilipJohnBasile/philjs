#!/usr/bin/env node
/**
 * PhilJS Meta - CLI
 *
 * Command-line interface for the meta-framework with:
 * - dev - development server
 * - build - production build
 * - start - production server
 * - generate - static generation
 */
/**
 * CLI options
 */
export interface CLIOptions {
    /** Project root directory */
    root?: string;
    /** Port for dev/start server */
    port?: number;
    /** Host for dev/start server */
    host?: string;
    /** Enable verbose logging */
    verbose?: boolean;
    /** Config file path */
    config?: string;
}
/**
 * Development server options
 */
export interface DevServerOptions extends CLIOptions {
    /** Enable hot module replacement */
    hmr?: boolean;
    /** Open browser on start */
    open?: boolean;
    /** HTTPS options */
    https?: boolean | {
        key: string;
        cert: string;
    };
}
/**
 * Build options from CLI
 */
export interface BuildCLIOptions extends CLIOptions {
    /** Enable minification */
    minify?: boolean;
    /** Generate source maps */
    sourcemap?: boolean;
    /** Analyze bundle */
    analyze?: boolean;
}
/**
 * Start server options
 */
export interface StartServerOptions extends CLIOptions {
    /** Enable clustering */
    cluster?: boolean;
    /** Number of workers */
    workers?: number;
}
/**
 * Generate options
 */
export interface GenerateOptions extends CLIOptions {
    /** Routes to generate (glob patterns) */
    routes?: string[];
    /** Output directory */
    outDir?: string;
    /** Fallback page */
    fallback?: boolean;
}
/**
 * Development server
 */
export declare function dev(options?: DevServerOptions): Promise<void>;
/**
 * Production build
 */
export declare function build(options?: BuildCLIOptions): Promise<void>;
/**
 * Production server
 */
export declare function start(options?: StartServerOptions): Promise<void>;
/**
 * Static generation
 */
export declare function generate(options?: GenerateOptions): Promise<void>;
/**
 * CLI entry point
 */
export declare function run(args?: string[]): Promise<void>;
//# sourceMappingURL=index.d.ts.map