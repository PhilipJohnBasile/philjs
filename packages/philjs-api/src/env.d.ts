/**
 * PhilJS Environment Variables
 *
 * Type-safe environment variable handling.
 */
/**
 * Get an environment variable (returns undefined if not set)
 */
export declare function getEnv(key: string): string | undefined;
/**
 * Get a public environment variable (PHILJS_PUBLIC_ prefix)
 */
export declare function getPublicEnv(key: string): string | undefined;
/**
 * Require an environment variable (throws if not set)
 */
export declare function requireEnv(key: string, message?: string): string;
/**
 * Get environment variable with default
 */
export declare function getEnvOrDefault(key: string, defaultValue: string): string;
/**
 * Get boolean environment variable
 */
export declare function getEnvBoolean(key: string, defaultValue?: boolean): boolean;
/**
 * Get numeric environment variable
 */
export declare function getEnvNumber(key: string, defaultValue?: number): number | undefined;
/**
 * Check if running in development
 */
export declare function isDevelopment(): boolean;
/**
 * Check if running in production
 */
export declare function isProduction(): boolean;
/**
 * Check if running in test
 */
export declare function isTest(): boolean;
//# sourceMappingURL=env.d.ts.map