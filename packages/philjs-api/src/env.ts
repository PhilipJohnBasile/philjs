/**
 * PhilJS Environment Variables
 *
 * Type-safe environment variable handling.
 */

/**
 * Get an environment variable (returns undefined if not set)
 */
export function getEnv(key: string): string | undefined {
  if (typeof process !== 'undefined' && process.env) {
    return process.env[key];
  }
  return undefined;
}

/**
 * Get a public environment variable (PHILJS_PUBLIC_ prefix)
 */
export function getPublicEnv(key: string): string | undefined {
  const publicKey = key.startsWith('PHILJS_PUBLIC_') ? key : `PHILJS_PUBLIC_${key}`;
  return getEnv(publicKey);
}

/**
 * Require an environment variable (throws if not set)
 */
export function requireEnv(key: string, message?: string): string {
  const value = getEnv(key);
  if (!value) {
    throw new Error(message || `Required environment variable "${key}" is not set`);
  }
  return value;
}

/**
 * Get environment variable with default
 */
export function getEnvOrDefault(key: string, defaultValue: string): string {
  return getEnv(key) ?? defaultValue;
}

/**
 * Get boolean environment variable
 */
export function getEnvBoolean(key: string, defaultValue = false): boolean {
  const value = getEnv(key);
  if (value === undefined) return defaultValue;
  return value === 'true' || value === '1' || value === 'yes';
}

/**
 * Get numeric environment variable
 */
export function getEnvNumber(key: string, defaultValue?: number): number | undefined {
  const value = getEnv(key);
  if (value === undefined) return defaultValue;
  const num = Number(value);
  return isNaN(num) ? defaultValue : num;
}

/**
 * Check if running in development
 */
export function isDevelopment(): boolean {
  return getEnv('NODE_ENV') === 'development';
}

/**
 * Check if running in production
 */
export function isProduction(): boolean {
  return getEnv('NODE_ENV') === 'production';
}

/**
 * Check if running in test
 */
export function isTest(): boolean {
  return getEnv('NODE_ENV') === 'test';
}
