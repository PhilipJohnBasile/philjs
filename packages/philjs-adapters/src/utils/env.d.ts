/**
 * PhilJS Adapters - Environment Utilities
 *
 * Provides utilities for handling environment variables and secrets:
 * - Environment variable injection
 * - Secrets management
 * - Platform-specific env loading
 * - Validation and type safety
 *
 * @module philjs-adapters/utils/env
 */
/**
 * Environment variable definition
 */
export interface EnvDefinition {
    /** Variable name */
    name: string;
    /** Is required */
    required?: boolean;
    /** Default value */
    default?: string;
    /** Description */
    description?: string;
    /** Is secret (should not be logged) */
    secret?: boolean;
    /** Validation regex */
    pattern?: RegExp;
    /** Allowed values */
    enum?: string[];
    /** Transform function */
    transform?: (value: string) => unknown;
}
/**
 * Environment configuration
 */
export interface EnvConfig {
    /** Variable definitions */
    variables: EnvDefinition[];
    /** Prefix for all variables */
    prefix?: string;
    /** Allow extra variables */
    allowExtra?: boolean;
    /** Environment file path */
    envFile?: string;
}
/**
 * Loaded environment
 */
export interface LoadedEnv {
    /** All environment variables */
    variables: Record<string, string>;
    /** Validation errors */
    errors: string[];
    /** Source of the environment (file, process, etc.) */
    source: string;
}
/**
 * Load environment variables from a file
 *
 * @example
 * ```typescript
 * const env = loadEnvFile('.env.production');
 * console.log(env.DATABASE_URL);
 * ```
 */
export declare function loadEnvFile(filePath: string): Record<string, string> | null;
/**
 * Load environment from multiple sources with priority
 *
 * Priority (highest to lowest):
 * 1. Process environment variables
 * 2. .env.local
 * 3. .env.{NODE_ENV}
 * 4. .env
 *
 * @example
 * ```typescript
 * const env = loadEnvironment();
 * ```
 */
export declare function loadEnvironment(options?: {
    /** Base directory */
    cwd?: string;
    /** Environment mode */
    mode?: string;
    /** Additional env files to load */
    envFiles?: string[];
}): LoadedEnv;
/**
 * Validate environment variables against a schema
 *
 * @example
 * ```typescript
 * const result = validateEnv({
 *   variables: [
 *     { name: 'DATABASE_URL', required: true },
 *     { name: 'PORT', default: '3000' },
 *   ],
 * });
 * ```
 */
export declare function validateEnv(config: EnvConfig): {
    valid: boolean;
    env: Record<string, string>;
    errors: string[];
};
/**
 * Inject environment variables into code
 *
 * @example
 * ```typescript
 * const code = injectEnvVariables(sourceCode, {
 *   'process.env.API_URL': 'https://api.example.com',
 * });
 * ```
 */
export declare function injectEnvVariables(code: string, env: Record<string, string>, options?: {
    /** Use import.meta.env instead of process.env */
    importMeta?: boolean;
    /** Only inject specified variables */
    allowList?: string[];
    /** Exclude specified variables */
    denyList?: string[];
}): string;
/**
 * Generate environment type definitions
 *
 * @example
 * ```typescript
 * const types = generateEnvTypes([
 *   { name: 'DATABASE_URL', required: true },
 *   { name: 'PORT', default: '3000' },
 * ]);
 * ```
 */
export declare function generateEnvTypes(definitions: EnvDefinition[]): string;
/**
 * Secrets manager interface
 */
export interface SecretsManager {
    /** Get a secret value */
    get(name: string): Promise<string | null>;
    /** Set a secret value */
    set(name: string, value: string): Promise<void>;
    /** Delete a secret */
    delete(name: string): Promise<void>;
    /** List all secret names */
    list(): Promise<string[]>;
}
/**
 * Create an in-memory secrets manager (for development)
 */
export declare function createMemorySecretsManager(): SecretsManager;
/**
 * Create an environment secrets manager (reads from env vars)
 */
export declare function createEnvSecretsManager(prefix?: string): SecretsManager;
/**
 * Get environment variable with type coercion
 */
export declare function getEnv<T = string>(name: string, options?: {
    default?: T;
    required?: boolean;
    type?: 'string' | 'number' | 'boolean' | 'json';
}): T;
/**
 * Check if running in production
 */
export declare function isProduction(): boolean;
/**
 * Check if running in development
 */
export declare function isDevelopment(): boolean;
/**
 * Get the current environment mode
 */
export declare function getMode(): string;
/**
 * Platform-specific environment helpers
 */
export declare const platformEnv: {
    /**
     * Check if running on Vercel
     */
    isVercel(): boolean;
    /**
     * Check if running on Netlify
     */
    isNetlify(): boolean;
    /**
     * Check if running on Cloudflare
     */
    isCloudflare(): boolean;
    /**
     * Check if running on AWS Lambda
     */
    isAWSLambda(): boolean;
    /**
     * Check if running on Deno Deploy
     */
    isDenoDeply(): boolean;
    /**
     * Check if running on Railway
     */
    isRailway(): boolean;
    /**
     * Check if running on Render
     */
    isRender(): boolean;
    /**
     * Check if running on Fly.io
     */
    isFlyio(): boolean;
    /**
     * Get the current platform name
     */
    getPlatform(): string;
};
declare const _default: {
    loadEnvFile: typeof loadEnvFile;
    loadEnvironment: typeof loadEnvironment;
    validateEnv: typeof validateEnv;
    injectEnvVariables: typeof injectEnvVariables;
    generateEnvTypes: typeof generateEnvTypes;
    createMemorySecretsManager: typeof createMemorySecretsManager;
    createEnvSecretsManager: typeof createEnvSecretsManager;
    getEnv: typeof getEnv;
    isProduction: typeof isProduction;
    isDevelopment: typeof isDevelopment;
    getMode: typeof getMode;
    platformEnv: {
        /**
         * Check if running on Vercel
         */
        isVercel(): boolean;
        /**
         * Check if running on Netlify
         */
        isNetlify(): boolean;
        /**
         * Check if running on Cloudflare
         */
        isCloudflare(): boolean;
        /**
         * Check if running on AWS Lambda
         */
        isAWSLambda(): boolean;
        /**
         * Check if running on Deno Deploy
         */
        isDenoDeply(): boolean;
        /**
         * Check if running on Railway
         */
        isRailway(): boolean;
        /**
         * Check if running on Render
         */
        isRender(): boolean;
        /**
         * Check if running on Fly.io
         */
        isFlyio(): boolean;
        /**
         * Get the current platform name
         */
        getPlatform(): string;
    };
};
export default _default;
//# sourceMappingURL=env.d.ts.map