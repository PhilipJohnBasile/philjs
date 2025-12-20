/**
 * Template engine utilities for generating plugin files
 */

export interface TemplateContext {
  // Plugin info
  pluginName: string;
  pascalName: string;
  camelName: string;
  kebabName: string;
  description: string;
  author: string;
  license: string;

  // Features
  typescript: boolean;
  testing: boolean;
  features: string[];

  // Template type
  type: 'basic' | 'vite' | 'transform' | 'ui-addon' | 'api' | 'database' | 'auth';
}

/**
 * Convert string to PascalCase
 */
export function toPascalCase(str: string): string {
  return str
    .split(/[-_\s]/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join("");
}

/**
 * Convert string to camelCase
 */
export function toCamelCase(str: string): string {
  const pascal = toPascalCase(str);
  return pascal.charAt(0).toLowerCase() + pascal.slice(1);
}

/**
 * Convert string to kebab-case
 */
export function toKebabCase(str: string): string {
  return str
    .replace(/([a-z])([A-Z])/g, "$1-$2")
    .replace(/[\s_]+/g, "-")
    .toLowerCase();
}

/**
 * Create template context from plugin name
 */
export function createContext(
  pluginName: string,
  options: Partial<TemplateContext> = {}
): TemplateContext {
  // Remove philjs-plugin- prefix if present for naming
  const baseName = pluginName.replace(/^philjs-plugin-/, "");

  return {
    pluginName,
    pascalName: toPascalCase(baseName),
    camelName: toCamelCase(baseName),
    kebabName: toKebabCase(baseName),
    description: options.description || `A PhilJS plugin`,
    author: options.author || "",
    license: options.license || "MIT",
    typescript: options.typescript !== false,
    testing: options.testing !== false,
    features: options.features || [],
    type: options.type || "basic",
  };
}

/**
 * Generate file comment header
 */
export function fileHeader(context: TemplateContext, filename: string): string {
  return `/**
 * ${context.pluginName}${filename ? ` - ${filename}` : ""}
 * ${context.description}
 *
 * @author ${context.author}
 * @license ${context.license}
 */
`;
}

/**
 * Generate import statements based on features
 */
export function generateImports(features: string[], typescript: boolean): string {
  const imports: string[] = [
    `import type { Plugin, PluginContext } from "philjs-core/plugin-system";`,
  ];

  if (features.includes("vite") || features.includes("virtual-modules") || features.includes("hmr")) {
    imports.push(`import type { Plugin as VitePlugin } from "vite";`);
  }

  if (features.includes("ast")) {
    imports.push(`import * as babel from "@babel/core";`);
    imports.push(`import * as t from "@babel/types";`);
  }

  if (features.includes("sourcemaps")) {
    imports.push(`import { SourceMapGenerator } from "source-map";`);
  }

  if (features.includes("react")) {
    imports.push(`import * as React from "react";`);
  }

  return imports.join("\n");
}

/**
 * Template for plugin configuration interface
 */
export function generateConfigInterface(context: TemplateContext): string {
  const { pascalName, features } = context;

  let configFields = `  /** Enable the plugin */\n  enabled?: boolean;\n`;

  // Add feature-specific config options
  if (features.includes("config")) {
    configFields += `  /** Plugin-specific configuration */\n  config?: Record<string, any>;\n`;
  }

  if (features.includes("virtual-modules")) {
    configFields += `  /** Virtual module definitions */\n  virtualModules?: Record<string, string>;\n`;
  }

  if (features.includes("ast")) {
    configFields += `  /** Babel parser options */\n  parserOptions?: babel.ParserOptions;\n`;
  }

  if (features.includes("theme")) {
    configFields += `  /** Theme configuration */\n  theme?: {\n    colors?: Record<string, string>;\n    spacing?: Record<string, string>;\n  };\n`;
  }

  return `/**
 * ${pascalName} plugin configuration
 */
export interface ${pascalName}Config {
${configFields}}`;
}

/**
 * Template for plugin factory function
 */
export function generatePluginFactory(context: TemplateContext): string {
  const { pascalName, camelName, pluginName, description, author, license, type, features } = context;

  let setupBody = `    ctx.logger.info("Setting up ${pascalName}...");

    // Initialize plugin
    const config = pluginConfig || { enabled: true };

    if (!config.enabled) {
      ctx.logger.warn("Plugin is disabled");
      return;
    }`;

  // Add feature-specific setup
  if (features.includes("virtual-modules")) {
    setupBody += `\n\n    // Register virtual modules\n    if (config.virtualModules) {\n      Object.entries(config.virtualModules).forEach(([id, code]) => {\n        ctx.logger.debug(\`Registering virtual module: \${id}\`);\n      });\n    }`;
  }

  if (features.includes("middleware")) {
    setupBody += `\n\n    // Register server middleware\n    ctx.logger.debug("Registering server middleware");`;
  }

  setupBody += `\n\n    ctx.logger.success("${pascalName} setup complete!");`;

  return `/**
 * Create ${camelName} plugin
 */
export function create${pascalName}Plugin(
  pluginConfig: ${pascalName}Config = {}
): Plugin {
  return {
    meta: {
      name: "${pluginName}",
      version: "1.0.0",
      description: "${description}",
      author: "${author}",
      license: "${license}",
      philjs: "^2.0.0",
    },

    ${type === 'vite' || features.includes('vite') ? generateVitePlugin(context) : ''}

    ${features.includes('config') ? `configSchema: ${generateConfigSchema(context)},\n\n    ` : ''}

    async setup(config: ${pascalName}Config, ctx: PluginContext) {
${setupBody}
    },

    hooks: ${generateHooks(context)},
  };
}

/**
 * Default export
 */
export default create${pascalName}Plugin();`;
}

/**
 * Generate Vite plugin integration
 */
function generateVitePlugin(context: TemplateContext): string {
  const { pascalName, pluginName, features } = context;

  let transformHook = "";
  if (features.includes("ast") || features.includes("transform")) {
    transformHook = `
      transform(code, id) {
        // Transform code here
        if (!/\\.(tsx?|jsx?)$/.test(id)) return null;

        // Your transformation logic
        return {
          code,
          map: null,
        };
      },`;
  }

  let resolveIdHook = "";
  if (features.includes("virtual-modules")) {
    resolveIdHook = `
      resolveId(id) {
        if (id.startsWith('virtual:${pluginName}')) {
          return id;
        }
        return null;
      },

      load(id) {
        if (id.startsWith('virtual:${pluginName}')) {
          // Return virtual module code
          return \`export default {};\`;
        }
        return null;
      },`;
  }

  let hmrHook = "";
  if (features.includes("hmr")) {
    hmrHook = `
      handleHotUpdate({ file, server }) {
        // Custom HMR logic
        if (file.endsWith('.custom')) {
          server.ws.send({
            type: 'custom',
            event: '${pluginName}-update',
          });
        }
      },`;
  }

  return `vitePlugin(config: ${pascalName}Config) {
      const plugin: VitePlugin = {
        name: "${pluginName}",

        config() {
          // Modify Vite configuration
          return {};
        },${transformHook}${resolveIdHook}${hmrHook}
      };

      return plugin;
    },

    `;
}

/**
 * Generate config schema
 */
function generateConfigSchema(context: TemplateContext): string {
  return `{
      type: "object",
      properties: {
        enabled: {
          type: "boolean",
          description: "Enable the plugin",
          default: true,
        },
      },
    }`;
}

/**
 * Generate plugin hooks
 */
function generateHooks(context: TemplateContext): string {
  const { pascalName, features } = context;

  let hooks = `{
      async init(ctx) {
        ctx.logger.info("${pascalName} initialized");
      },`;

  if (features.includes("ast") || features.includes("transform") || features.includes("types")) {
    hooks += `

      async transform(ctx, code, id) {
        // Transform code here
        return null;
      },`;
  }

  hooks += `

      async buildStart(ctx, buildConfig) {
        ctx.logger.debug("Build starting...");
      },

      async buildEnd(ctx, result) {
        if (result.success) {
          ctx.logger.success("Build completed successfully");
        } else {
          ctx.logger.error("Build failed");
        }
      },`;

  if (features.includes("ssr")) {
    hooks += `

      async ssr(ctx, options) {
        ctx.logger.debug("SSR rendering...");
      },`;
  }

  hooks += `
    }`;

  return hooks;
}

/**
 * Generate test file content
 */
export function generateTestTemplate(context: TemplateContext): string {
  const { pluginName, pascalName } = context;

  return `import { describe, it, expect, beforeEach } from 'vitest';
import { createTester } from 'create-philjs-plugin';
import plugin, { create${pascalName}Plugin } from '../index.js';

describe('${pluginName}', () => {
  let tester: ReturnType<typeof createTester>;

  beforeEach(() => {
    tester = createTester(plugin);
  });

  describe('Plugin Metadata', () => {
    it('should have correct metadata', () => {
      expect(plugin.meta.name).toBe('${pluginName}');
      expect(plugin.meta.version).toBe('1.0.0');
      expect(plugin.meta.philjs).toBe('^2.0.0');
    });

    it('should have required fields', () => {
      expect(plugin.meta.description).toBeDefined();
      expect(plugin.meta.license).toBeDefined();
    });
  });

  describe('Plugin Setup', () => {
    it('should setup successfully with default config', async () => {
      await tester.testSetup({});
      // Add assertions based on your plugin's setup logic
    });

    it('should setup with custom config', async () => {
      await tester.testSetup({
        enabled: true,
      });
      // Add assertions
    });

    it('should handle disabled plugin', async () => {
      await tester.testSetup({
        enabled: false,
      });
      // Add assertions
    });
  });

  describe('Plugin Hooks', () => {
    it('should execute init hook', async () => {
      await tester.testHook('init');
      // Add assertions
    });

    it('should execute buildStart hook', async () => {
      const buildConfig = {
        entry: 'src/index.ts',
        outDir: 'dist',
        minify: true,
        sourcemap: true,
        target: 'es2020',
        format: 'esm' as const,
        splitting: false,
      };

      await tester.testHook('buildStart', {}, buildConfig);
      // Add assertions
    });

    it('should execute buildEnd hook', async () => {
      const result = {
        success: true,
        files: [],
        duration: 100,
      };

      await tester.testHook('buildEnd', {}, result);
      // Add assertions
    });
  });

  describe('Plugin Factory', () => {
    it('should create plugin with custom config', () => {
      const customPlugin = create${pascalName}Plugin({
        enabled: true,
      });

      expect(customPlugin.meta.name).toBe('${pluginName}');
    });
  });
});
`;
}

/**
 * Generate README template
 */
export function generateReadmeTemplate(context: TemplateContext): string {
  const { pluginName, pascalName, description, author, license, features } = context;

  let featuresSection = "";
  if (features.length > 0) {
    featuresSection = `\n## Features\n\n${features.map(f => `- ${f.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}`).join('\n')}\n`;
  }

  let apiSection = `\n## API\n\n### \`create${pascalName}Plugin(config?)\`\n\nCreates a new instance of the plugin.\n\n**Parameters:**\n\n- \`config\` (optional): Plugin configuration object\n  - \`enabled\`: Enable/disable the plugin (default: \`true\`)`;

  if (features.includes('virtual-modules')) {
    apiSection += `\n  - \`virtualModules\`: Virtual module definitions`;
  }

  if (features.includes('theme')) {
    apiSection += `\n  - \`theme\`: Theme configuration`;
  }

  return `# ${pluginName}

${description}
${featuresSection}
## Installation

\`\`\`bash
# Using PhilJS CLI
philjs plugin add ${pluginName}

# Or with npm/yarn/pnpm
npm install ${pluginName}
yarn add ${pluginName}
pnpm add ${pluginName}
\`\`\`

## Usage

\`\`\`typescript
import { defineConfig } from 'philjs-core';
import ${pascalName.replace(/Plugin$/, '')}Plugin from '${pluginName}';

export default defineConfig({
  plugins: [
    ${pascalName.replace(/Plugin$/, '')}Plugin({
      enabled: true,
      // Add your configuration here
    }),
  ],
});
\`\`\`
${apiSection}

## Configuration

| Option | Type | Description | Default |
|--------|------|-------------|---------|
| \`enabled\` | \`boolean\` | Enable the plugin | \`true\` |

## Development

\`\`\`bash
# Install dependencies
npm install

# Build the plugin
npm run build

# Run tests
npm test

# Watch mode for development
npm run dev
\`\`\`

## Testing

\`\`\`bash
# Run tests once
npm test

# Watch mode
npm run test:watch

# Coverage
npm run test:coverage
\`\`\`

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

${license}${author ? `\n\n## Author\n\n${author}` : ''}

## Changelog

### 1.0.0

- Initial release
`;
}

/**
 * Generate package.json template
 */
export function generatePackageJsonTemplate(context: TemplateContext): Record<string, any> {
  const { pluginName, description, author, license, testing } = context;

  return {
    name: pluginName,
    version: "1.0.0",
    description,
    author,
    license,
    type: "module",
    main: "./dist/index.js",
    types: "./dist/index.d.ts",
    exports: {
      ".": {
        types: "./dist/index.d.ts",
        import: "./dist/index.js",
      },
    },
    files: ["dist", "README.md"],
    scripts: {
      build: "tsc",
      dev: "tsc --watch",
      test: testing ? "vitest run" : "echo 'No tests'",
      "test:watch": testing ? "vitest" : "echo 'No tests'",
      "test:coverage": testing ? "vitest run --coverage" : "echo 'No tests'",
      prepublishOnly: "npm run build",
    },
    keywords: ["philjs", "plugin", ...pluginName.split("-").filter(k => k !== "philjs" && k !== "plugin")],
    peerDependencies: {
      "philjs-core": "^2.0.0",
    },
    devDependencies: {
      "philjs-core": "^2.0.0",
      typescript: "^5.9.3",
      "@types/node": "^20.11.0",
      ...(testing && {
        vitest: "^1.0.0",
        "create-philjs-plugin": "^1.0.0",
      }),
    },
  };
}

/**
 * Generate tsconfig.json template
 */
export function generateTSConfigTemplate(): Record<string, any> {
  return {
    compilerOptions: {
      target: "ES2020",
      module: "ESNext",
      lib: ["ES2020", "DOM"],
      declaration: true,
      declarationMap: true,
      sourceMap: true,
      outDir: "./dist",
      rootDir: "./src",
      strict: true,
      esModuleInterop: true,
      skipLibCheck: true,
      moduleResolution: "bundler",
      resolveJsonModule: true,
      allowSyntheticDefaultImports: true,
      forceConsistentCasingInFileNames: true,
    },
    include: ["src/**/*"],
    exclude: ["node_modules", "dist", "**/*.test.ts", "**/*.spec.ts"],
  };
}

/**
 * Generate vitest config template
 */
export function generateVitestConfigTemplate(): string {
  return `import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'dist/',
        '**/*.test.ts',
        '**/*.spec.ts',
      ],
    },
  },
});
`;
}

/**
 * Generate .gitignore template
 */
export function generateGitignoreTemplate(): string {
  return `# Dependencies
node_modules/
.pnp
.pnp.js

# Build output
dist/
*.tsbuildinfo

# Logs
logs
*.log
npm-debug.log*
yarn-debug.log*
yarn-error.log*
pnpm-debug.log*

# Testing
coverage/
.nyc_output

# Environment
.env
.env.local
.env.*.local

# Editor
.vscode/
.idea/
*.swp
*.swo
*~

# OS
.DS_Store
Thumbs.db

# Misc
*.cache
.temp
.tmp
`;
}
