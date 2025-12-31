/**
 * Create PhilJS Plugin - Plugin SDK
 * Tools and utilities for building PhilJS plugins
 */

// Plugin types - defined locally to avoid circular dependency issues
export interface PluginLogger {
  info: (message: string, ...args: any[]) => void;
  warn: (message: string, ...args: any[]) => void;
  error: (message: string, ...args: any[]) => void;
  debug: (message: string, ...args: any[]) => void;
  success: (message: string, ...args: any[]) => void;
}

export interface PluginFileSystem {
  readFile: (path: string) => Promise<string>;
  writeFile: (path: string, content: string) => Promise<void>;
  exists: (path: string) => Promise<boolean>;
  mkdir: (path: string, options?: { recursive?: boolean }) => Promise<void>;
  readdir: (path: string) => Promise<string[]>;
  copy: (src: string, dest: string) => Promise<void>;
  remove: (path: string) => Promise<void>;
}

export interface PluginUtils {
  resolve: (...paths: string[]) => string;
  exec: (command: string) => Promise<{ stdout: string; stderr: string }>;
  getPackageManager: () => Promise<"npm" | "pnpm" | "yarn" | "bun">;
  installPackages: (packages: string[], dev?: boolean) => Promise<void>;
  readPackageJson: () => Promise<Record<string, any>>;
  writePackageJson: (pkg: Record<string, any>) => Promise<void>;
}

export interface PluginContext {
  version: string;
  root: string;
  mode: "development" | "production" | "test";
  config: Record<string, any>;
  logger: PluginLogger;
  fs: PluginFileSystem;
  utils: PluginUtils;
}

export interface PluginHooks {
  init?: (ctx: PluginContext) => Promise<void> | void;
  buildStart?: (ctx: PluginContext, config: any) => Promise<void> | void;
  transform?: (ctx: PluginContext, code: string, id: string) => Promise<{ code: string; map?: any } | null> | { code: string; map?: any } | null;
  buildEnd?: (ctx: PluginContext, result: any) => Promise<void> | void;
  devServerStart?: (ctx: PluginContext, server: any) => Promise<void> | void;
  fileChange?: (ctx: PluginContext, file: string) => Promise<void> | void;
  serveStart?: (ctx: PluginContext) => Promise<void> | void;
  testStart?: (ctx: PluginContext) => Promise<void> | void;
  deployStart?: (ctx: PluginContext, target: string) => Promise<void> | void;
  cleanup?: (ctx: PluginContext) => Promise<void> | void;
}

export interface PluginMetadata {
  name: string;
  version: string;
  description?: string;
  author?: string;
  license?: string;
  keywords?: string[];
  repository?: string | { type: string; url: string };
  homepage?: string;
  philjs?: string;
}

export interface PluginConfigSchema {
  type?: "object";
  properties?: Record<string, {
    type?: string;
    description?: string;
    default?: any;
    enum?: any[];
    required?: boolean;
  }>;
  required?: string[];
}

export interface Plugin {
  meta: PluginMetadata;
  configSchema?: PluginConfigSchema | undefined;
  setup?: ((config: any, ctx: PluginContext) => Promise<void> | void) | undefined;
  hooks?: PluginHooks;
  vitePlugin?: ((config: any) => any) | undefined;
}

// Export generator
export { createPlugin, type PluginOptions } from './generator.js';

// Export template utilities
export * from './template-engine.js';

/**
 * Plugin builder for easier plugin creation
 */
export class PluginBuilder {
  private plugin: Partial<Plugin> = {
    meta: {
      name: "",
      version: "0.1.0",
      description: "",
      philjs: "^0.1.0",
    },
    hooks: {},
  };

  /**
   * Set plugin metadata
   */
  meta(meta: Partial<Plugin["meta"]>): this {
    this.plugin.meta = { ...this.plugin.meta!, ...meta };
    return this;
  }

  /**
   * Add lifecycle hook
   */
  hook<K extends keyof PluginHooks>(
    hookName: K,
    handler: PluginHooks[K]
  ): this {
    this.plugin.hooks = this.plugin.hooks || {};
    this.plugin.hooks[hookName] = handler;
    return this;
  }

  /**
   * Add setup function
   */
  setup(handler: Plugin["setup"]): this {
    this.plugin.setup = handler;
    return this;
  }

  /**
   * Add Vite plugin integration
   */
  vitePlugin(handler: Plugin["vitePlugin"]): this {
    this.plugin.vitePlugin = handler;
    return this;
  }

  /**
   * Add config schema
   */
  configSchema(schema: Plugin["configSchema"]): this {
    this.plugin.configSchema = schema;
    return this;
  }

  /**
   * Build the plugin
   */
  build(): Plugin {
    if (!this.plugin.meta?.name) {
      throw new Error("Plugin name is required");
    }

    return this.plugin as Plugin;
  }
}

/**
 * Create a plugin builder
 */
export function createBuilder(): PluginBuilder {
  return new PluginBuilder();
}

/**
 * Plugin testing utilities
 */
export class PluginTester {
  private plugin: Plugin;
  private mockContext: PluginContext;
  private files: Map<string, string>;

  constructor(plugin: Plugin) {
    this.plugin = plugin;
    this.files = new Map<string, string>();
    this.mockContext = this.createMockContext();
  }

  /**
   * Create mock plugin context
   */
  private createMockContext(): PluginContext {
    const logs: { level: string; message: string; args: any[] }[] = [];
    const files = this.files;

    return {
      version: "0.1.0",
      root: "/mock/project",
      mode: "development",
      config: {},
      logger: {
        info: (msg, ...args) => logs.push({ level: "info", message: msg, args }),
        warn: (msg, ...args) => logs.push({ level: "warn", message: msg, args }),
        error: (msg, ...args) => logs.push({ level: "error", message: msg, args }),
        debug: (msg, ...args) => logs.push({ level: "debug", message: msg, args }),
        success: (msg, ...args) => logs.push({ level: "success", message: msg, args }),
      },
      fs: {
        readFile: async (path) => files.get(path) || "",
        writeFile: async (path, content) => { files.set(path, content); },
        exists: async (path) => files.has(path),
        mkdir: async () => {},
        readdir: async () => [],
        copy: async () => {},
        remove: async (path) => { files.delete(path); },
      },
      utils: {
        resolve: (...paths) => paths.join("/"),
        exec: async () => ({ stdout: "", stderr: "" }),
        getPackageManager: async () => "npm" as const,
        installPackages: async () => {},
        readPackageJson: async () => ({ name: "test", version: "0.1.0" }),
        writePackageJson: async () => {},
      },
    };
  }

  /**
   * Test plugin setup
   */
  async testSetup(config: any = {}): Promise<void> {
    if (this.plugin.setup) {
      await this.plugin.setup(config, this.mockContext);
    }
  }

  /**
   * Test plugin hooks
   */
  async testHook<K extends keyof PluginHooks>(
    hookName: K,
    ...args: Parameters<NonNullable<PluginHooks[K]>>
  ): Promise<any> {
    const hook = this.plugin.hooks?.[hookName];
    if (!hook) {
      throw new Error(`Hook "${String(hookName)}" not found`);
    }

    // @ts-ignore
    return await hook(this.mockContext, ...args.slice(1));
  }

  /**
   * Get mock context for assertions
   */
  getContext(): PluginContext {
    return this.mockContext;
  }

  /**
   * Set mock file
   */
  setFile(path: string, content: string): void {
    this.files.set(path, content);
  }

  /**
   * Get mock file
   */
  async getFile(path: string): Promise<string | undefined> {
    return await this.mockContext.fs.readFile(path);
  }
}

/**
 * Create plugin tester
 */
export function createTester(plugin: Plugin): PluginTester {
  return new PluginTester(plugin);
}

/**
 * Plugin validation utilities
 */
export const pluginValidator = {
  /**
   * Validate plugin structure
   */
  validate(plugin: Plugin): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Check required fields
    if (!plugin.meta?.name) {
      errors.push("Plugin must have a name");
    }

    if (!plugin.meta?.version) {
      errors.push("Plugin must have a version");
    }

    // Validate version format
    if (plugin.meta?.version && !/^\d+\.\d+\.\d+/.test(plugin.meta.version)) {
      errors.push("Version must be valid semver");
    }

    // Check for at least one hook or setup
    if (!plugin.setup && (!plugin.hooks || Object.keys(plugin.hooks).length === 0)) {
      errors.push("Plugin must have at least a setup function or lifecycle hooks");
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  },

  /**
   * Validate config against schema
   */
  validateConfig(config: any, schema: Plugin["configSchema"]): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!schema) return { valid: true, errors };

    // Simple validation (can be enhanced with JSON schema validator)
    if (schema.required) {
      for (const field of schema.required) {
        if (!(field in config)) {
          errors.push(`Required field "${field}" is missing`);
        }
      }
    }

    if (schema.properties) {
      for (const [key, prop] of Object.entries(schema.properties)) {
        if (key in config) {
          const value = config[key];
          const propSchema = prop as any;

          // Type checking
          if (propSchema.type) {
            const actualType = Array.isArray(value) ? "array" : typeof value;
            if (actualType !== propSchema.type) {
              errors.push(`Field "${key}" should be ${propSchema.type}, got ${actualType}`);
            }
          }

          // Enum validation
          if (propSchema.enum && !propSchema.enum.includes(value)) {
            errors.push(`Field "${key}" must be one of: ${propSchema.enum.join(", ")}`);
          }
        }
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  },
};

/**
 * Plugin publishing utilities
 */
export const pluginPublisher = {
  /**
   * Generate package.json for plugin
   */
  generatePackageJson(plugin: Plugin): Record<string, any> {
    return {
      name: plugin.meta.name,
      version: plugin.meta.version,
      description: plugin.meta.description,
      author: plugin.meta.author,
      license: plugin.meta.license || "MIT",
      keywords: ["philjs", "plugin", ...(plugin.meta.keywords || [])],
      repository: plugin.meta.repository,
      homepage: plugin.meta.homepage,
      type: "module",
      main: "./dist/index.js",
      types: "./dist/index.d.ts",
      exports: {
        ".": {
          types: "./dist/index.d.ts",
          import: "./dist/index.js",
        },
      },
      files: ["dist"],
      peerDependencies: {
        "@philjs/core": plugin.meta.philjs || "^0.1.0",
      },
      scripts: {
        build: "tsc",
        test: "vitest run",
        prepublishOnly: "npm run build && npm test",
      },
    };
  },

  /**
   * Generate README.md for plugin
   */
  generateReadme(plugin: Plugin): string {
    return `# ${plugin.meta.name}

${plugin.meta.description}

## Installation

\`\`\`bash
# Using PhilJS CLI
philjs plugin add ${plugin.meta.name}

# Or with npm
npm install ${plugin.meta.name}
\`\`\`

## Usage

\`\`\`typescript
import { defineConfig } from '@philjs/core';
import ${plugin.meta.name.replace(/^philjs-plugin-/, "")}Plugin from '${plugin.meta.name}';

export default defineConfig({
  plugins: [
    ${plugin.meta.name.replace(/^philjs-plugin-/, "")}Plugin({
      // Configuration options
    }),
  ],
});
\`\`\`

## Configuration

${plugin.configSchema ? this.generateConfigDocs(plugin.configSchema) : "No configuration options available."}

## License

${plugin.meta.license || "MIT"}

## Author

${plugin.meta.author || ""}
`;
  },

  /**
   * Generate configuration documentation
   */
  generateConfigDocs(schema: NonNullable<Plugin["configSchema"]>): string {
    if (!schema.properties) return "No options";

    let docs = "| Option | Type | Description | Default |\n";
    docs += "|--------|------|-------------|----------|\n";

    for (const [key, prop] of Object.entries(schema.properties)) {
      const p = prop as any;
      docs += `| \`${key}\` | ${p.type || "any"} | ${p.description || "-"} | ${JSON.stringify(p.default) || "-"} |\n`;
    }

    return docs;
  },

  /**
   * Generate tsconfig.json
   */
  generateTSConfig(): Record<string, any> {
    return {
      compilerOptions: {
        target: "ES2020",
        module: "ESNext",
        lib: ["ES2020", "DOM"],
        declaration: true,
        declarationMap: true,
        outDir: "./dist",
        rootDir: "./src",
        strict: true,
        esModuleInterop: true,
        skipLibCheck: true,
        moduleResolution: "node",
      },
      include: ["src/**/*"],
      exclude: ["node_modules", "dist"],
    };
  },
};

/**
 * Plugin development helpers
 */
export const pluginHelpers = {
  /**
   * Create a logger that prefixes messages
   */
  createLogger(pluginName: string) {
    const prefix = `[${pluginName}]`;

    return {
      info: (msg: string, ...args: any[]) => console.log(prefix, msg, ...args),
      warn: (msg: string, ...args: any[]) => console.warn(prefix, msg, ...args),
      error: (msg: string, ...args: any[]) => console.error(prefix, msg, ...args),
      debug: (msg: string, ...args: any[]) => console.debug(prefix, msg, ...args),
      success: (msg: string, ...args: any[]) => console.log(prefix, "✓", msg, ...args),
    };
  },

  /**
   * Async retry utility
   */
  async retry<T>(
    fn: () => Promise<T>,
    options: { retries?: number; delay?: number } = {}
  ): Promise<T> {
    const { retries = 3, delay = 1000 } = options;

    for (let i = 0; i < retries; i++) {
      try {
        return await fn();
      } catch (error) {
        if (i === retries - 1) throw error;
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }

    throw new Error("Max retries exceeded");
  },

  /**
   * Debounce utility
   */
  debounce<T extends (...args: any[]) => any>(
    fn: T,
    delay: number
  ): (...args: Parameters<T>) => void {
    let timeoutId: NodeJS.Timeout;

    return (...args: Parameters<T>) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => fn(...args), delay);
    };
  },
};

// Types are already exported at the top of this file
