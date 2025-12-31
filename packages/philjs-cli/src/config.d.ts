/**
 * PhilJS CLI - Configuration
 *
 * Load and merge configuration from philjs.config.ts
 */
export interface GeneratorConfig {
    path: string;
    style?: 'css-modules' | 'tailwind' | 'styled' | 'none';
    tests?: boolean;
    typescript?: boolean;
}
export interface PhilJSConfig {
    generators?: {
        component?: GeneratorConfig;
        page?: GeneratorConfig;
        api?: GeneratorConfig;
        model?: GeneratorConfig;
        hook?: GeneratorConfig;
        context?: GeneratorConfig;
        store?: GeneratorConfig;
        route?: GeneratorConfig;
    };
    dev?: {
        port?: number;
        host?: string;
        open?: boolean;
    };
    build?: {
        outDir?: string;
        ssg?: boolean;
        sourcemap?: boolean;
    };
    database?: {
        provider?: 'prisma' | 'drizzle';
        schema?: string;
    };
}
/**
 * Load configuration from philjs.config.ts or philjs.config.js
 */
export declare function loadConfig(cwd?: string): Promise<PhilJSConfig>;
/**
 * Get generator config with defaults
 */
export declare function getGeneratorConfig(config: PhilJSConfig, generator: keyof NonNullable<PhilJSConfig['generators']>): GeneratorConfig;
/**
 * Define config helper for type safety
 */
export declare function defineConfig(config: PhilJSConfig): PhilJSConfig;
//# sourceMappingURL=config.d.ts.map