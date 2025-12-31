/**
 * Transform PhilJS Plugin Template
 */

import type { Plugin, PluginContext } from "@philjs/core/plugin-system";

export interface {{PLUGIN_NAME}}Config {
  enabled?: boolean;
  include?: string[];
  exclude?: string[];
}

export function create{{PLUGIN_NAME}}Plugin(
  pluginConfig: {{PLUGIN_NAME}}Config = {}
): Plugin {
  return {
    meta: {
      name: "{{PACKAGE_NAME}}",
      version: "0.1.0",
      description: "{{DESCRIPTION}}",
      author: "{{AUTHOR}}",
      license: "{{LICENSE}}",
      philjs: "^0.1.0",
    },

    async setup(config: {{PLUGIN_NAME}}Config, ctx: PluginContext) {
      ctx.logger.info("Setting up {{PLUGIN_NAME}}...");

      if (!config.enabled) {
        ctx.logger.warn("Plugin is disabled");
        return;
      }

      ctx.logger.success("{{PLUGIN_NAME}} setup complete!");
    },

    hooks: {
      async init(ctx) {
        ctx.logger.info("{{PLUGIN_NAME}} initialized");
      },

      async transform(ctx, code, id) {
        const { include, exclude } = pluginConfig;

        // Check if file should be transformed
        if (include && !include.some(pattern => id.includes(pattern))) {
          return null;
        }

        if (exclude && exclude.some(pattern => id.includes(pattern))) {
          return null;
        }

        // Transform code here
        // Example: Simple string replacement
        if (code.includes('__REPLACE_ME__')) {
          return {
            code: code.replace(/__REPLACE_ME__/g, 'REPLACED'),
            map: null,
          };
        }

        return null;
      },

      async buildStart(ctx, buildConfig) {
        ctx.logger.debug("Build starting...");
      },

      async buildEnd(ctx, result) {
        if (result.success) {
          ctx.logger.success("Build completed successfully");
        }
      },
    },
  };
}

export default create{{PLUGIN_NAME}}Plugin();
