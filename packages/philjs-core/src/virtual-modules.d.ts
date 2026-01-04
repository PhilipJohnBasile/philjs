/**
 * @fileoverview Virtual modules plugin for Vite
 * Provides virtual modules like virtual:philjs-routes, virtual:philjs-content, etc.
 */
interface Plugin {
    name: string;
    configResolved?: (config: {
        root: string;
    }) => void;
    resolveId?: (source: string, importer?: string) => string | null | undefined | void;
    load?: (id: string) => string | null | undefined | Promise<string | null | undefined>;
    handleHotUpdate?: (context: {
        file: string;
        server: {
            moduleGraph: {
                getModuleById: (id: string) => any;
            };
        };
    }) => any[] | void | Promise<any[] | void>;
}
/**
 * Virtual module configuration
 */
export interface VirtualModuleConfig {
    /** Routes directory */
    routesDir?: string;
    /** Content directory */
    contentDir?: string;
    /** Plugins directory */
    pluginsDir?: string;
    /** App configuration */
    appConfig?: Record<string, any>;
    /** Base path */
    basePath?: string;
}
/**
 * Route metadata
 */
export interface RouteMetadata {
    /** Route path */
    path: string;
    /** File path */
    filePath: string;
    /** Has loader */
    hasLoader?: boolean;
    /** Has action */
    hasAction?: boolean;
    /** Route metadata */
    meta?: Record<string, any>;
}
/**
 * Create virtual modules plugin for Vite
 */
export declare function virtualModulesPlugin(config?: VirtualModuleConfig): Plugin;
/**
 * Generate TypeScript declarations for virtual modules
 */
export declare function generateVirtualModuleTypes(): string;
/**
 * Write TypeScript declarations to file
 */
export declare function writeVirtualModuleTypes(outPath: string): Promise<void>;
export {};
//# sourceMappingURL=virtual-modules.d.ts.map