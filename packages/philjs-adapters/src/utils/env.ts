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

import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

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
export function loadEnvFile(filePath: string): Record<string, string> | null {
  const resolvedPath = join(process.cwd(), filePath);

  if (!existsSync(resolvedPath)) {
    return null;
  }

  try {
    const content = readFileSync(resolvedPath, 'utf-8');
    const env: Record<string, string> = {};

    for (const line of content.split('\n')) {
      // Skip empty lines and comments
      const trimmedLine = line.trim();
      if (!trimmedLine || trimmedLine.startsWith('#')) {
        continue;
      }

      // Parse key=value
      const equalsIndex = trimmedLine.indexOf('=');
      if (equalsIndex === -1) {
        continue;
      }

      const key = trimmedLine.slice(0, equalsIndex).trim();
      let value = trimmedLine.slice(equalsIndex + 1).trim();

      // Remove quotes
      if ((value.startsWith('"') && value.endsWith('"')) ||
          (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1);
      }

      // Handle escape sequences
      value = value
        .replace(/\\n/g, '\n')
        .replace(/\\r/g, '\r')
        .replace(/\\t/g, '\t')
        .replace(/\\\\/g, '\\');

      env[key] = value;
    }

    return env;
  } catch (error) {
    console.warn(`Failed to load env file: ${filePath}`, error);
    return null;
  }
}

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
export function loadEnvironment(options: {
  /** Base directory */
  cwd?: string;
  /** Environment mode */
  mode?: string;
  /** Additional env files to load */
  envFiles?: string[];
} = {}): LoadedEnv {
  const { cwd = process.cwd(), mode = process.env['NODE_ENV'] || 'development', envFiles = [] } = options;

  const variables: Record<string, string> = {};
  const errors: string[] = [];
  const sources: string[] = [];

  // Load base .env file
  const baseEnv = loadEnvFile(join(cwd, '.env'));
  if (baseEnv) {
    Object.assign(variables, baseEnv);
    sources.push('.env');
  }

  // Load mode-specific .env file
  const modeEnv = loadEnvFile(join(cwd, `.env.${mode}`));
  if (modeEnv) {
    Object.assign(variables, modeEnv);
    sources.push(`.env.${mode}`);
  }

  // Load .env.local
  const localEnv = loadEnvFile(join(cwd, '.env.local'));
  if (localEnv) {
    Object.assign(variables, localEnv);
    sources.push('.env.local');
  }

  // Load additional env files
  for (const envFile of envFiles) {
    const additionalEnv = loadEnvFile(join(cwd, envFile));
    if (additionalEnv) {
      Object.assign(variables, additionalEnv);
      sources.push(envFile);
    }
  }

  // Process environment takes priority
  for (const [key, value] of Object.entries(process.env)) {
    if (value !== undefined) {
      variables[key] = value;
    }
  }

  return {
    variables,
    errors,
    source: sources.length > 0 ? sources.join(', ') : 'process.env',
  };
}

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
export function validateEnv(config: EnvConfig): {
  valid: boolean;
  env: Record<string, string>;
  errors: string[];
} {
  const { variables, prefix = '', allowExtra = true } = config;
  const errors: string[] = [];
  const env: Record<string, string> = {};

  // Load environment
  const loaded = loadEnvironment({ envFiles: config.envFile ? [config.envFile] : [] });

  for (const def of variables) {
    const fullName = prefix ? `${prefix}${def.name}` : def.name;
    let value = loaded.variables[fullName];

    // Apply default
    if (value === undefined && def.default !== undefined) {
      value = def.default;
    }

    // Check required
    if (value === undefined && def.required) {
      errors.push(`Missing required environment variable: ${fullName}`);
      continue;
    }

    if (value === undefined) {
      continue;
    }

    // Validate pattern
    if (def.pattern && !def.pattern.test(value)) {
      errors.push(`Environment variable ${fullName} does not match pattern ${def.pattern}`);
    }

    // Validate enum
    if (def.enum && !def.enum.includes(value)) {
      errors.push(`Environment variable ${fullName} must be one of: ${def.enum.join(', ')}`);
    }

    // Apply transform
    if (def.transform) {
      try {
        const transformed = def.transform(value);
        env[def.name] = String(transformed);
      } catch (error) {
        errors.push(`Failed to transform environment variable ${fullName}: ${error}`);
      }
    } else {
      env[def.name] = value;
    }
  }

  return {
    valid: errors.length === 0,
    env,
    errors,
  };
}

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
export function injectEnvVariables(
  code: string,
  env: Record<string, string>,
  options: {
    /** Use import.meta.env instead of process.env */
    importMeta?: boolean;
    /** Only inject specified variables */
    allowList?: string[];
    /** Exclude specified variables */
    denyList?: string[];
  } = {}
): string {
  const { importMeta = false, allowList, denyList = [] } = options;

  let result = code;

  for (const [key, value] of Object.entries(env)) {
    // Check allow/deny lists
    if (allowList && !allowList.includes(key)) {
      continue;
    }
    if (denyList.includes(key)) {
      continue;
    }

    const envAccessor = importMeta
      ? `import.meta.env.${key}`
      : `process.env.${key}`;

    // Replace direct access
    const directPattern = new RegExp(
      `(${importMeta ? 'import\\.meta\\.env' : 'process\\.env'})\\.${key}\\b`,
      'g'
    );
    result = result.replace(directPattern, JSON.stringify(value));

    // Replace bracket access
    const bracketPattern = new RegExp(
      `(${importMeta ? 'import\\.meta\\.env' : 'process\\.env'})\\[['"]${key}['"]\\]`,
      'g'
    );
    result = result.replace(bracketPattern, JSON.stringify(value));
  }

  return result;
}

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
export function generateEnvTypes(definitions: EnvDefinition[]): string {
  const lines: string[] = [
    '// Auto-generated environment type definitions',
    '// Do not edit manually',
    '',
    'declare namespace NodeJS {',
    '  interface ProcessEnv {',
  ];

  for (const def of definitions) {
    if (def.description) {
      lines.push(`    /** ${def.description} */`);
    }
    if (def.secret) {
      lines.push('    /** @secret */');
    }

    const type = def.enum
      ? def.enum.map(v => `'${v}'`).join(' | ')
      : 'string';

    const optional = def.required ? '' : '?';
    lines.push(`    ${def.name}${optional}: ${type};`);
  }

  lines.push('  }', '}', '', 'export {};');

  return lines.join('\n');
}

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
export function createMemorySecretsManager(): SecretsManager {
  const secrets = new Map<string, string>();

  return {
    async get(name: string): Promise<string | null> {
      return secrets.get(name) || null;
    },

    async set(name: string, value: string): Promise<void> {
      secrets.set(name, value);
    },

    async delete(name: string): Promise<void> {
      secrets.delete(name);
    },

    async list(): Promise<string[]> {
      return Array.from(secrets.keys());
    },
  };
}

/**
 * Create an environment secrets manager (reads from env vars)
 */
export function createEnvSecretsManager(prefix = 'SECRET_'): SecretsManager {
  return {
    async get(name: string): Promise<string | null> {
      return process.env[`${prefix}${name}`] || null;
    },

    async set(name: string, value: string): Promise<void> {
      process.env[`${prefix}${name}`] = value;
    },

    async delete(name: string): Promise<void> {
      delete process.env[`${prefix}${name}`];
    },

    async list(): Promise<string[]> {
      return Object.keys(process.env)
        .filter(key => key.startsWith(prefix))
        .map(key => key.slice(prefix.length));
    },
  };
}

/**
 * Get environment variable with type coercion
 */
export function getEnv<T = string>(
  name: string,
  options: {
    default?: T;
    required?: boolean;
    type?: 'string' | 'number' | 'boolean' | 'json';
  } = {}
): T {
  const { default: defaultValue, required = false, type = 'string' } = options;

  const value = process.env[name];

  if (value === undefined) {
    if (required) {
      throw new Error(`Missing required environment variable: ${name}`);
    }
    return defaultValue as T;
  }

  switch (type) {
    case 'number': {
      const num = Number(value);
      if (isNaN(num)) {
        throw new Error(`Environment variable ${name} is not a valid number`);
      }
      return num as T;
    }
    case 'boolean': {
      return (value.toLowerCase() === 'true' || value === '1') as T;
    }
    case 'json': {
      try {
        return JSON.parse(value) as T;
      } catch {
        throw new Error(`Environment variable ${name} is not valid JSON`);
      }
    }
    default:
      return value as T;
  }
}

/**
 * Check if running in production
 */
export function isProduction(): boolean {
  return process.env['NODE_ENV'] === 'production';
}

/**
 * Check if running in development
 */
export function isDevelopment(): boolean {
  return process.env['NODE_ENV'] !== 'production';
}

/**
 * Get the current environment mode
 */
export function getMode(): string {
  return process.env['NODE_ENV'] || 'development';
}

/**
 * Platform-specific environment helpers
 */
export const platformEnv = {
  /**
   * Check if running on Vercel
   */
  isVercel(): boolean {
    return !!process.env['VERCEL'];
  },

  /**
   * Check if running on Netlify
   */
  isNetlify(): boolean {
    return !!process.env['NETLIFY'];
  },

  /**
   * Check if running on Cloudflare
   */
  isCloudflare(): boolean {
    return !!(process.env['CF_PAGES'] || process.env['CLOUDFLARE_WORKERS']);
  },

  /**
   * Check if running on AWS Lambda
   */
  isAWSLambda(): boolean {
    return !!(process.env['AWS_LAMBDA_FUNCTION_NAME'] || process.env['AWS_EXECUTION_ENV']);
  },

  /**
   * Check if running on Deno Deploy
   */
  isDenoDeply(): boolean {
    return !!(globalThis as any).Deno?.env?.get('DENO_DEPLOYMENT_ID');
  },

  /**
   * Check if running on Railway
   */
  isRailway(): boolean {
    return !!process.env['RAILWAY_ENVIRONMENT'];
  },

  /**
   * Check if running on Render
   */
  isRender(): boolean {
    return !!process.env['RENDER'];
  },

  /**
   * Check if running on Fly.io
   */
  isFlyio(): boolean {
    return !!process.env['FLY_APP_NAME'];
  },

  /**
   * Get the current platform name
   */
  getPlatform(): string {
    if (this.isVercel()) return 'vercel';
    if (this.isNetlify()) return 'netlify';
    if (this.isCloudflare()) return 'cloudflare';
    if (this.isAWSLambda()) return 'aws-lambda';
    if (this.isDenoDeply()) return 'deno-deploy';
    if (this.isRailway()) return 'railway';
    if (this.isRender()) return 'render';
    if (this.isFlyio()) return 'flyio';
    return 'unknown';
  },
};

export default {
  loadEnvFile,
  loadEnvironment,
  validateEnv,
  injectEnvVariables,
  generateEnvTypes,
  createMemorySecretsManager,
  createEnvSecretsManager,
  getEnv,
  isProduction,
  isDevelopment,
  getMode,
  platformEnv,
};
