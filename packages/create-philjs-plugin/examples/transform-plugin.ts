/**
 * Example: Code Transform Plugin
 *
 * This example shows how to create a plugin that transforms code
 */

import type { Plugin, PluginContext } from "philjs-core/plugin-system";

export interface CodeTransformConfig {
  enabled?: boolean;
  replacements?: Record<string, string>;
  include?: string[];
  exclude?: string[];
}

export function createCodeTransformPlugin(
  config: CodeTransformConfig = {}
): Plugin {
  return {
    meta: {
      name: "philjs-plugin-code-transform",
      version: "1.0.0",
      description: "Code transformation plugin for PhilJS",
      author: "PhilJS Team",
      license: "MIT",
      philjs: "^2.0.0",
    },

    async setup(pluginConfig: CodeTransformConfig, ctx: PluginContext) {
      ctx.logger.info("Setting up CodeTransform plugin...");

      const { enabled = true } = pluginConfig;

      if (!enabled) {
        ctx.logger.warn("Plugin is disabled");
        return;
      }

      ctx.logger.success("CodeTransform plugin setup complete!");
    },

    hooks: {
      async init(ctx) {
        ctx.logger.info("CodeTransform plugin initialized");
      },

      async transform(ctx, code, id) {
        const {
          replacements = {},
          include = ['.ts', '.tsx', '.js', '.jsx'],
          exclude = ['node_modules'],
        } = config;

        // Check if file should be transformed
        const shouldInclude = include.some(pattern => id.includes(pattern));
        const shouldExclude = exclude.some(pattern => id.includes(pattern));

        if (!shouldInclude || shouldExclude) {
          return null;
        }

        let transformedCode = code;
        let hasChanges = false;

        // Apply replacements
        for (const [search, replace] of Object.entries(replacements)) {
          const regex = new RegExp(search, 'g');
          if (regex.test(transformedCode)) {
            transformedCode = transformedCode.replace(regex, replace);
            hasChanges = true;
          }
        }

        if (hasChanges) {
          ctx.logger.debug(`Transformed: ${id}`);
          return {
            code: transformedCode,
            map: null, // Add source map support if needed
          };
        }

        return null;
      },

      async buildStart(ctx, buildConfig) {
        ctx.logger.debug("Build starting with code transformations");
      },

      async buildEnd(ctx, result) {
        if (result.success) {
          ctx.logger.success("Build completed with transformations");
        }
      },
    },
  };
}

export default createCodeTransformPlugin();

// Example usage in philjs.config.ts:
// import codeTransform from 'philjs-plugin-code-transform';
//
// export default defineConfig({
//   plugins: [
//     codeTransform({
//       replacements: {
//         '__API_URL__': 'https://api.example.com',
//         '__VERSION__': '1.0.0',
//       },
//     }),
//   ],
// });
