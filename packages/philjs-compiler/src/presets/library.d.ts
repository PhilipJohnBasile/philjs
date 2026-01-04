/**
 * Library Build Preset
 * Optimized configuration for building reusable libraries
 *
 * Features:
 * - Multiple output formats (ESM, CJS, UMD)
 * - TypeScript declaration generation
 * - Minimal bundling (preserve tree-shaking)
 * - External dependencies
 * - Source map generation
 * - Size optimization
 */
import type { CompilerConfig } from '../types.js';
import type { UserConfig } from 'vite';
export interface LibraryPresetOptions {
    /**
     * Library name (for UMD builds)
     */
    name?: string;
    /**
     * Entry point
     */
    entry?: string;
    /**
     * Output formats
     * @default ['es', 'cjs']
     */
    formats?: Array<'es' | 'cjs' | 'umd' | 'iife'>;
    /**
     * External dependencies (not bundled)
     * @default ['react', 'react-dom', '@philjs/core']
     */
    external?: string[];
    /**
     * Generate TypeScript declarations
     * @default true
     */
    dts?: boolean;
    /**
     * Enable source maps
     * @default true
     */
    sourceMaps?: boolean;
    /**
     * Minify output
     * @default true
     */
    minify?: boolean;
    /**
     * Target environment
     * @default 'es2020'
     */
    target?: string | string[];
    /**
     * Preserve modules (don't bundle)
     * @default true
     */
    preserveModules?: boolean;
    /**
     * Side effects (for package.json)
     * @default false
     */
    sideEffects?: boolean | string[];
}
/**
 * Default library configuration
 */
export declare const defaultLibraryConfig: Required<Omit<LibraryPresetOptions, 'name' | 'entry'>>;
/**
 * Create library preset for PhilJS compiler
 */
export declare function createLibraryPreset(options?: LibraryPresetOptions): CompilerConfig;
/**
 * Create Vite configuration for library builds
 */
export declare function createLibraryViteConfig(options: LibraryPresetOptions): Partial<UserConfig>;
/**
 * Generate package.json fields for library
 */
export declare function generatePackageJsonFields(options: LibraryPresetOptions): Record<string, any>;
/**
 * Validate library build output
 */
export interface LibraryValidation {
    passed: boolean;
    errors: string[];
    warnings: string[];
    stats: {
        formats: string[];
        size: Record<string, number>;
        gzipSize: Record<string, number>;
        exports: string[];
    };
}
export declare function validateLibraryBuild(distPath: string, options: LibraryPresetOptions): Promise<LibraryValidation>;
/**
 * Library build reporter
 */
export declare function printLibraryBuildReport(validation: LibraryValidation): void;
export default createLibraryPreset;
//# sourceMappingURL=library.d.ts.map