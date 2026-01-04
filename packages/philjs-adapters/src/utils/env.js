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
 * Load environment variables from a file
 *
 * @example
 * ```typescript
 * const env = loadEnvFile('.env.production');
 * console.log(env.DATABASE_URL);
 * ```
 */
export function loadEnvFile(filePath) {
    const resolvedPath = join(process.cwd(), filePath);
    if (!existsSync(resolvedPath)) {
        return null;
    }
    try {
        const content = readFileSync(resolvedPath, 'utf-8');
        const env = {};
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
    }
    catch (error) {
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
export function loadEnvironment(options = {}) {
    const { cwd = process.cwd(), mode = process.env['NODE_ENV'] || 'development', envFiles = [] } = options;
    const variables = {};
    const errors = [];
    const sources = [];
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
export function validateEnv(config) {
    const { variables, prefix = '', allowExtra = true } = config;
    const errors = [];
    const env = {};
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
            }
            catch (error) {
                errors.push(`Failed to transform environment variable ${fullName}: ${error}`);
            }
        }
        else {
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
export function injectEnvVariables(code, env, options = {}) {
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
        const directPattern = new RegExp(`(${importMeta ? 'import\\.meta\\.env' : 'process\\.env'})\\.${key}\\b`, 'g');
        result = result.replace(directPattern, JSON.stringify(value));
        // Replace bracket access
        const bracketPattern = new RegExp(`(${importMeta ? 'import\\.meta\\.env' : 'process\\.env'})\\[['"]${key}['"]\\]`, 'g');
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
export function generateEnvTypes(definitions) {
    const lines = [
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
 * Create an in-memory secrets manager (for development)
 */
export function createMemorySecretsManager() {
    const secrets = new Map();
    return {
        async get(name) {
            return secrets.get(name) || null;
        },
        async set(name, value) {
            secrets.set(name, value);
        },
        async delete(name) {
            secrets.delete(name);
        },
        async list() {
            return Array.from(secrets.keys());
        },
    };
}
/**
 * Create an environment secrets manager (reads from env vars)
 */
export function createEnvSecretsManager(prefix = 'SECRET_') {
    return {
        async get(name) {
            return process.env[`${prefix}${name}`] || null;
        },
        async set(name, value) {
            process.env[`${prefix}${name}`] = value;
        },
        async delete(name) {
            delete process.env[`${prefix}${name}`];
        },
        async list() {
            return Object.keys(process.env)
                .filter(key => key.startsWith(prefix))
                .map(key => key.slice(prefix.length));
        },
    };
}
/**
 * Get environment variable with type coercion
 */
export function getEnv(name, options = {}) {
    const { default: defaultValue, required = false, type = 'string' } = options;
    const value = process.env[name];
    if (value === undefined) {
        if (required) {
            throw new Error(`Missing required environment variable: ${name}`);
        }
        return defaultValue;
    }
    switch (type) {
        case 'number': {
            const num = Number(value);
            if (isNaN(num)) {
                throw new Error(`Environment variable ${name} is not a valid number`);
            }
            return num;
        }
        case 'boolean': {
            return (value.toLowerCase() === 'true' || value === '1');
        }
        case 'json': {
            try {
                return JSON.parse(value);
            }
            catch {
                throw new Error(`Environment variable ${name} is not valid JSON`);
            }
        }
        default:
            return value;
    }
}
/**
 * Check if running in production
 */
export function isProduction() {
    return process.env['NODE_ENV'] === 'production';
}
/**
 * Check if running in development
 */
export function isDevelopment() {
    return process.env['NODE_ENV'] !== 'production';
}
/**
 * Get the current environment mode
 */
export function getMode() {
    return process.env['NODE_ENV'] || 'development';
}
/**
 * Platform-specific environment helpers
 */
export const platformEnv = {
    /**
     * Check if running on Vercel
     */
    isVercel() {
        return !!process.env['VERCEL'];
    },
    /**
     * Check if running on Netlify
     */
    isNetlify() {
        return !!process.env['NETLIFY'];
    },
    /**
     * Check if running on Cloudflare
     */
    isCloudflare() {
        return !!(process.env['CF_PAGES'] || process.env['CLOUDFLARE_WORKERS']);
    },
    /**
     * Check if running on AWS Lambda
     */
    isAWSLambda() {
        return !!(process.env['AWS_LAMBDA_FUNCTION_NAME'] || process.env['AWS_EXECUTION_ENV']);
    },
    /**
     * Check if running on Deno Deploy
     */
    isDenoDeply() {
        return !!globalThis.Deno?.env?.get('DENO_DEPLOYMENT_ID');
    },
    /**
     * Check if running on Railway
     */
    isRailway() {
        return !!process.env['RAILWAY_ENVIRONMENT'];
    },
    /**
     * Check if running on Render
     */
    isRender() {
        return !!process.env['RENDER'];
    },
    /**
     * Check if running on Fly.io
     */
    isFlyio() {
        return !!process.env['FLY_APP_NAME'];
    },
    /**
     * Get the current platform name
     */
    getPlatform() {
        if (this.isVercel())
            return 'vercel';
        if (this.isNetlify())
            return 'netlify';
        if (this.isCloudflare())
            return 'cloudflare';
        if (this.isAWSLambda())
            return 'aws-lambda';
        if (this.isDenoDeply())
            return 'deno-deploy';
        if (this.isRailway())
            return 'railway';
        if (this.isRender())
            return 'render';
        if (this.isFlyio())
            return 'flyio';
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
//# sourceMappingURL=env.js.map