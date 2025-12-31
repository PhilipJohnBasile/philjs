/**
 * PhilJS Meta - Configuration
 *
 * Configuration system with:
 * - philjs.config.ts support
 * - Environment variables
 * - Build options
 */
import * as fs from 'fs';
import * as path from 'path';
/**
 * Default configuration
 */
export const defaultConfig = {
    pagesDir: 'pages',
    publicDir: 'public',
    srcDir: 'src',
    basePath: '',
    trailingSlash: false,
    strict: true,
    env: {},
    build: {
        outDir: '.philjs',
        minify: true,
        sourcemap: false,
        splitting: true,
        treeShaking: true,
    },
    server: {
        port: 3000,
        host: 'localhost',
        compress: true,
        timeout: 30000,
    },
    ssr: {
        enabled: true,
        streaming: false,
        timeout: 10000,
        hydration: 'full',
    },
    ssg: {
        enabled: false,
        fallback: true,
        revalidate: false,
    },
    images: {
        deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
        imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
        formats: ['image/webp'],
        minimumCacheTTL: 60,
    },
};
/**
 * Config file names to look for
 */
const CONFIG_FILES = [
    'philjs.config.ts',
    'philjs.config.js',
    'philjs.config.mjs',
    'philjs.config.cjs',
];
/**
 * Load configuration from file
 */
export async function loadConfig(options = {}) {
    const { root = process.cwd(), configFile, env = process.env['NODE_ENV'] } = options;
    let config = { ...defaultConfig };
    // Find config file
    let configPath = null;
    if (configFile) {
        configPath = path.resolve(root, configFile);
        if (!fs.existsSync(configPath)) {
            throw new Error(`Config file not found: ${configPath}`);
        }
    }
    else {
        for (const fileName of CONFIG_FILES) {
            const filePath = path.join(root, fileName);
            if (fs.existsSync(filePath)) {
                configPath = filePath;
                break;
            }
        }
    }
    // Load config if found
    if (configPath) {
        try {
            // Read file content
            const content = fs.readFileSync(configPath, 'utf-8');
            // For TypeScript files, we need to transpile
            if (configPath.endsWith('.ts')) {
                // In a real implementation, you would use esbuild or ts-node here
                // For now, we'll try to import it directly (requires ts-node or similar)
                try {
                    const imported = await import(configPath);
                    const loadedConfig = imported.default || imported;
                    config = mergeConfig(config, typeof loadedConfig === 'function' ? loadedConfig({ env }) : loadedConfig);
                }
                catch {
                    // Fallback: try to parse as JS object
                    console.warn('Could not import TypeScript config, using defaults');
                }
            }
            else {
                // JavaScript config
                const imported = await import(configPath);
                const loadedConfig = imported.default || imported;
                config = mergeConfig(config, typeof loadedConfig === 'function' ? loadedConfig({ env }) : loadedConfig);
            }
        }
        catch (error) {
            console.warn(`Error loading config from ${configPath}:`, error);
        }
    }
    // Apply environment overrides
    config = applyEnvOverrides(config);
    return config;
}
/**
 * Merge configurations deeply
 */
function mergeConfig(base, override) {
    const result = { ...base };
    for (const key of Object.keys(override)) {
        const value = override[key];
        if (value === undefined)
            continue;
        if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
            result[key] = {
                ...(base[key] || {}),
                ...value,
            };
        }
        else {
            result[key] = value;
        }
    }
    return result;
}
/**
 * Apply environment variable overrides
 */
function applyEnvOverrides(config) {
    const result = { ...config };
    // Server port
    if (process.env['PORT']) {
        result.server = { ...result.server, port: parseInt(process.env['PORT'], 10) };
    }
    // Server host
    if (process.env['HOST']) {
        result.server = { ...result.server, host: process.env['HOST'] };
    }
    // Base path
    if (process.env['BASE_PATH']) {
        result.basePath = process.env['BASE_PATH'];
    }
    // Collect public environment variables
    const publicEnv = {};
    for (const [key, value] of Object.entries(process.env)) {
        if (key.startsWith('PHILJS_PUBLIC_') && value) {
            publicEnv[key] = value;
        }
    }
    if (Object.keys(publicEnv).length > 0) {
        result.env = { ...result.env, ...publicEnv };
    }
    return result;
}
/**
 * Define configuration (for type safety in config files)
 */
export function defineConfig(config) {
    return config;
}
/**
 * Validate configuration
 */
export function validateConfig(config) {
    const errors = [];
    // Validate pagesDir exists
    if (config.pagesDir) {
        const pagesPath = path.resolve(config.pagesDir);
        if (!fs.existsSync(pagesPath)) {
            errors.push(`Pages directory not found: ${pagesPath}`);
        }
    }
    // Validate port
    if (config.server?.port) {
        if (config.server.port < 0 || config.server.port > 65535) {
            errors.push(`Invalid port: ${config.server.port}`);
        }
    }
    // Validate i18n
    if (config.i18n) {
        if (!config.i18n.locales || config.i18n.locales.length === 0) {
            errors.push('i18n.locales must contain at least one locale');
        }
        if (!config.i18n.defaultLocale) {
            errors.push('i18n.defaultLocale is required when i18n is enabled');
        }
        else if (!config.i18n.locales?.includes(config.i18n.defaultLocale)) {
            errors.push('i18n.defaultLocale must be in i18n.locales');
        }
    }
    // Validate images
    if (config.images?.remotePatterns) {
        for (const pattern of config.images.remotePatterns) {
            if (!pattern.hostname) {
                errors.push('Image remote pattern must have a hostname');
            }
        }
    }
    return {
        valid: errors.length === 0,
        errors,
    };
}
/**
 * Get environment-specific configuration
 */
export function getEnvConfig(config, env) {
    const result = { ...config };
    if (env === 'development') {
        // Development overrides
        result.build = {
            ...result.build,
            minify: false,
            sourcemap: true,
        };
    }
    else if (env === 'production') {
        // Production overrides
        result.build = {
            ...result.build,
            minify: true,
            sourcemap: false,
        };
    }
    else if (env === 'test') {
        // Test overrides
        result.build = {
            ...result.build,
            minify: false,
            sourcemap: 'inline',
        };
    }
    return result;
}
//# sourceMappingURL=index.js.map