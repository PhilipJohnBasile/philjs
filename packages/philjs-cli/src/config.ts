/**
 * PhilJS CLI - Configuration
 *
 * Load and merge configuration from philjs.config.ts
 */

import * as fs from 'fs/promises';
import * as path from 'path';

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

const defaultConfig: PhilJSConfig = {
  generators: {
    component: {
      path: 'src/components',
      style: 'css-modules',
      tests: true,
      typescript: true,
    },
    page: {
      path: 'src/pages',
      tests: true,
      typescript: true,
    },
    api: {
      path: 'src/api',
      tests: true,
      typescript: true,
    },
    model: {
      path: 'prisma/schema.prisma',
      typescript: true,
    },
    hook: {
      path: 'src/hooks',
      tests: true,
      typescript: true,
    },
    context: {
      path: 'src/contexts',
      tests: true,
      typescript: true,
    },
    store: {
      path: 'src/stores',
      tests: true,
      typescript: true,
    },
    route: {
      path: 'src/routes',
      tests: true,
      typescript: true,
    },
  },
  database: {
    provider: 'prisma',
    schema: 'prisma/schema.prisma',
  },
};

/**
 * Load configuration from philjs.config.ts or philjs.config.js
 */
export async function loadConfig(cwd: string = process.cwd()): Promise<PhilJSConfig> {
  const configFiles = [
    'philjs.config.ts',
    'philjs.config.js',
    'philjs.config.mjs',
  ];

  for (const configFile of configFiles) {
    const configPath = path.join(cwd, configFile);
    try {
      await fs.access(configPath);
      // Try to import the config
      try {
        const configModule = await import(`file://${configPath}`);
        return mergeConfig(defaultConfig, configModule.default || configModule);
      } catch {
        // If import fails, return default config
        return defaultConfig;
      }
    } catch {
      // File doesn't exist, continue to next
    }
  }

  return defaultConfig;
}

/**
 * Deep merge configuration objects
 */
function mergeConfig(base: PhilJSConfig, override: Partial<PhilJSConfig>): PhilJSConfig {
  const result = { ...base };

  if (override.generators) {
    result.generators = {
      ...base.generators,
      ...override.generators,
    };

    // Deep merge each generator config
    for (const key of Object.keys(override.generators) as (keyof typeof override.generators)[]) {
      if (override.generators[key] && base.generators?.[key]) {
        result.generators[key] = {
          ...base.generators[key],
          ...override.generators[key],
        };
      }
    }
  }

  if (override.dev) {
    result.dev = { ...base.dev, ...override.dev };
  }

  if (override.build) {
    result.build = { ...base.build, ...override.build };
  }

  if (override.database) {
    result.database = { ...base.database, ...override.database };
  }

  return result;
}

/**
 * Get generator config with defaults
 */
export function getGeneratorConfig(
  config: PhilJSConfig,
  generator: keyof NonNullable<PhilJSConfig['generators']>
): GeneratorConfig {
  return config.generators?.[generator] || defaultConfig.generators![generator]!;
}

/**
 * Define config helper for type safety
 */
export function defineConfig(config: PhilJSConfig): PhilJSConfig {
  return config;
}
