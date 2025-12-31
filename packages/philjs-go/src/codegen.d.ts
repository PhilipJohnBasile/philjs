/**
 * Go Code Generator for PhilJS
 *
 * Generates Go server code from PhilJS routes and server functions.
 */
export interface CodegenOptions {
    /**
     * Source directory with server functions
     */
    srcDir: string;
    /**
     * Output directory for generated Go code
     */
    outDir: string;
    /**
     * Go module name
     */
    module: string;
    /**
     * Generate router code
     * @default true
     */
    router?: boolean;
    /**
     * Generate handler stubs
     * @default true
     */
    handlers?: boolean;
    /**
     * Generate types from TypeScript
     * @default true
     */
    types?: boolean;
    /**
     * Database driver to use
     * @default "postgres"
     */
    dbDriver?: 'postgres' | 'mysql' | 'sqlite';
    /**
     * Generate middleware
     * @default true
     */
    middleware?: boolean;
    /**
     * Generate database helpers
     * @default true
     */
    database?: boolean;
}
/**
 * Generate Go server code from PhilJS configuration
 */
export declare function generateGoCode(options: CodegenOptions): Promise<void>;
/**
 * Watch for changes and regenerate code
 */
export declare function watchAndGenerate(options: CodegenOptions): Promise<void>;
//# sourceMappingURL=codegen.d.ts.map