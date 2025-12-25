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
 * PhilJS configuration
 */
export interface PhilJSConfig {
  /** Application name */
  name?: string;

  /** Pages directory (relative to root) */
  pagesDir?: string;

  /** Public assets directory */
  publicDir?: string;

  /** Source directory */
  srcDir?: string;

  /** Base path for all routes */
  basePath?: string;

  /** Trailing slash behavior */
  trailingSlash?: boolean;

  /** Enable strict mode */
  strict?: boolean;

  /** Environment variables to expose to client */
  env?: Record<string, string>;

  /** Build configuration */
  build?: BuildConfig;

  /** Server configuration */
  server?: ServerConfig;

  /** SSR configuration */
  ssr?: SSRConfig;

  /** SSG configuration */
  ssg?: SSGConfig;

  /** Image optimization */
  images?: ImagesConfig;

  /** Internationalization */
  i18n?: I18nConfig;

  /** Headers configuration */
  headers?: HeadersConfig[];

  /** Redirects configuration */
  redirects?: RedirectConfig[];

  /** Rewrites configuration */
  rewrites?: RewriteConfig[];

  /** Experimental features */
  experimental?: ExperimentalConfig;

  /** Custom webpack/esbuild configuration */
  bundler?: BundlerConfig;
}

/**
 * Build configuration
 */
export interface BuildConfig {
  /** Output directory */
  outDir?: string;

  /** Enable minification */
  minify?: boolean;

  /** Generate source maps */
  sourcemap?: boolean | 'inline' | 'hidden';

  /** Target browsers/node versions */
  target?: string | string[];

  /** CSS modules configuration */
  cssModules?: boolean | CSSModulesConfig;

  /** Define global constants */
  define?: Record<string, string>;

  /** External dependencies */
  external?: string[];

  /** Bundle splitting */
  splitting?: boolean;

  /** Tree shaking */
  treeShaking?: boolean;

  /** Analyze bundle */
  analyze?: boolean;
}

/**
 * CSS Modules configuration
 */
export interface CSSModulesConfig {
  /** Scope behavior */
  scopeBehaviour?: 'global' | 'local';

  /** Generate scoped name pattern */
  generateScopedName?: string | ((name: string, filename: string, css: string) => string);

  /** Hash prefix */
  hashPrefix?: string;
}

/**
 * Server configuration
 */
export interface ServerConfig {
  /** Server port */
  port?: number;

  /** Server host */
  host?: string;

  /** Enable HTTPS */
  https?: boolean | HTTPSConfig;

  /** Compression */
  compress?: boolean;

  /** CORS configuration */
  cors?: boolean | CORSConfig;

  /** Rate limiting */
  rateLimit?: RateLimitConfig;

  /** Request body size limit */
  bodyLimit?: string;

  /** Request timeout in ms */
  timeout?: number;
}

/**
 * HTTPS configuration
 */
export interface HTTPSConfig {
  key: string;
  cert: string;
  ca?: string;
}

/**
 * CORS configuration
 */
export interface CORSConfig {
  origin?: string | string[] | boolean;
  methods?: string[];
  allowedHeaders?: string[];
  exposedHeaders?: string[];
  credentials?: boolean;
  maxAge?: number;
}

/**
 * Rate limit configuration
 */
export interface RateLimitConfig {
  windowMs?: number;
  max?: number;
  message?: string;
  statusCode?: number;
  keyGenerator?: (req: Request) => string;
}

/**
 * SSR configuration
 */
export interface SSRConfig {
  /** Enable SSR */
  enabled?: boolean;

  /** Stream SSR responses */
  streaming?: boolean;

  /** Timeout for SSR in ms */
  timeout?: number;

  /** External packages for SSR */
  external?: string[];

  /** Hydration mode */
  hydration?: 'full' | 'partial' | 'progressive';
}

/**
 * SSG configuration
 */
export interface SSGConfig {
  /** Enable static generation */
  enabled?: boolean;

  /** Paths to pre-render */
  paths?: string[] | (() => string[] | Promise<string[]>);

  /** Fallback behavior */
  fallback?: boolean | 'blocking';

  /** Revalidation interval in seconds */
  revalidate?: number | false;

  /** Export directory */
  exportDir?: string;
}

/**
 * Images configuration
 */
export interface ImagesConfig {
  /** Remote patterns for allowed external images */
  remotePatterns?: ImageRemotePattern[];

  /** Allowed domains */
  domains?: string[];

  /** Device sizes for responsive images */
  deviceSizes?: number[];

  /** Image sizes for next/image */
  imageSizes?: number[];

  /** Loader for images */
  loader?: 'default' | 'imgix' | 'cloudinary' | 'akamai' | 'custom';

  /** Path prefix for images */
  path?: string;

  /** Formats to generate */
  formats?: ('image/avif' | 'image/webp')[];

  /** Minimum cache TTL */
  minimumCacheTTL?: number;

  /** Disable static images */
  disableStaticImages?: boolean;

  /** Dangerously allow SVG */
  dangerouslyAllowSVG?: boolean;
}

/**
 * Image remote pattern
 */
export interface ImageRemotePattern {
  protocol?: 'http' | 'https';
  hostname: string;
  port?: string;
  pathname?: string;
}

/**
 * I18n configuration
 */
export interface I18nConfig {
  /** Supported locales */
  locales: string[];

  /** Default locale */
  defaultLocale: string;

  /** Locale detection */
  localeDetection?: boolean;

  /** Locale domains for domain-based routing */
  domains?: LocaleDomain[];
}

/**
 * Locale domain
 */
export interface LocaleDomain {
  domain: string;
  defaultLocale: string;
  locales?: string[];
  http?: boolean;
}

/**
 * Headers configuration
 */
export interface HeadersConfig {
  /** URL pattern */
  source: string;

  /** Headers to add */
  headers: { key: string; value: string }[];
}

/**
 * Redirect configuration
 */
export interface RedirectConfig {
  /** Source URL pattern */
  source: string;

  /** Destination URL */
  destination: string;

  /** Redirect status code */
  statusCode?: 301 | 302 | 303 | 307 | 308;

  /** Permanent redirect (301 vs 302) */
  permanent?: boolean;

  /** Base path handling */
  basePath?: false;

  /** Locale handling */
  locale?: false;

  /** Has conditions */
  has?: RouteCondition[];

  /** Missing conditions */
  missing?: RouteCondition[];
}

/**
 * Rewrite configuration
 */
export interface RewriteConfig {
  /** Source URL pattern */
  source: string;

  /** Destination URL */
  destination: string;

  /** Base path handling */
  basePath?: false;

  /** Locale handling */
  locale?: false;

  /** Has conditions */
  has?: RouteCondition[];

  /** Missing conditions */
  missing?: RouteCondition[];
}

/**
 * Route condition
 */
export interface RouteCondition {
  type: 'header' | 'cookie' | 'query' | 'host';
  key: string;
  value?: string;
}

/**
 * Experimental features
 */
export interface ExperimentalConfig {
  /** Enable React Server Components */
  serverComponents?: boolean;

  /** Enable React Suspense boundaries */
  suspense?: boolean;

  /** Enable incremental adoption */
  incrementalAdoption?: boolean;

  /** Enable streaming */
  streaming?: boolean;

  /** Enable partial prerendering */
  partialPrerendering?: boolean;

  /** Enable optimistic updates */
  optimisticUpdates?: boolean;
}

/**
 * Bundler configuration
 */
export interface BundlerConfig {
  /** esbuild options */
  esbuild?: Record<string, unknown>;

  /** Custom plugins */
  plugins?: unknown[];

  /** Alias mappings */
  alias?: Record<string, string>;

  /** Module resolution */
  resolve?: {
    extensions?: string[];
    mainFields?: string[];
    conditions?: string[];
  };
}

/**
 * Default configuration
 */
export const defaultConfig: PhilJSConfig = {
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
 * Load configuration options
 */
export interface LoadConfigOptions {
  /** Project root directory */
  root?: string;

  /** Config file path (overrides auto-detection) */
  configFile?: string;

  /** Environment (development, production, test) */
  env?: string;
}

/**
 * Load configuration from file
 */
export async function loadConfig(options: LoadConfigOptions = {}): Promise<PhilJSConfig> {
  const { root = process.cwd(), configFile, env = process.env.NODE_ENV } = options;

  let config: PhilJSConfig = { ...defaultConfig };

  // Find config file
  let configPath: string | null = null;

  if (configFile) {
    configPath = path.resolve(root, configFile);
    if (!fs.existsSync(configPath)) {
      throw new Error(`Config file not found: ${configPath}`);
    }
  } else {
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
        } catch {
          // Fallback: try to parse as JS object
          console.warn('Could not import TypeScript config, using defaults');
        }
      } else {
        // JavaScript config
        const imported = await import(configPath);
        const loadedConfig = imported.default || imported;
        config = mergeConfig(config, typeof loadedConfig === 'function' ? loadedConfig({ env }) : loadedConfig);
      }
    } catch (error) {
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
function mergeConfig(base: PhilJSConfig, override: Partial<PhilJSConfig>): PhilJSConfig {
  const result = { ...base };

  for (const key of Object.keys(override) as (keyof PhilJSConfig)[]) {
    const value = override[key];

    if (value === undefined) continue;

    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      result[key] = {
        ...(base[key] as object || {}),
        ...value,
      } as never;
    } else {
      result[key] = value as never;
    }
  }

  return result;
}

/**
 * Apply environment variable overrides
 */
function applyEnvOverrides(config: PhilJSConfig): PhilJSConfig {
  const result = { ...config };

  // Server port
  if (process.env.PORT) {
    result.server = { ...result.server, port: parseInt(process.env.PORT, 10) };
  }

  // Server host
  if (process.env.HOST) {
    result.server = { ...result.server, host: process.env.HOST };
  }

  // Base path
  if (process.env.BASE_PATH) {
    result.basePath = process.env.BASE_PATH;
  }

  // Collect public environment variables
  const publicEnv: Record<string, string> = {};
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
export function defineConfig(config: PhilJSConfig | ((env: { env?: string }) => PhilJSConfig)): PhilJSConfig | ((env: { env?: string }) => PhilJSConfig) {
  return config;
}

/**
 * Validate configuration
 */
export function validateConfig(config: PhilJSConfig): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

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
    } else if (!config.i18n.locales?.includes(config.i18n.defaultLocale)) {
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
export function getEnvConfig(config: PhilJSConfig, env: 'development' | 'production' | 'test'): PhilJSConfig {
  const result = { ...config };

  if (env === 'development') {
    // Development overrides
    result.build = {
      ...result.build,
      minify: false,
      sourcemap: true,
    };
  } else if (env === 'production') {
    // Production overrides
    result.build = {
      ...result.build,
      minify: true,
      sourcemap: false,
    };
  } else if (env === 'test') {
    // Test overrides
    result.build = {
      ...result.build,
      minify: false,
      sourcemap: 'inline',
    };
  }

  return result;
}
