/**
 * UI Addon PhilJS Plugin Template
 */

import type { Plugin, PluginContext } from "@philjs/core/plugin-system";

export interface {{PLUGIN_NAME}}Config {
  enabled?: boolean;
  theme?: {
    colors?: Record<string, string>;
    spacing?: Record<string, string>;
  };
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

      // Setup theme
      if (config.theme) {
        ctx.logger.debug("Configuring theme");
        // Apply theme configuration
      }

      ctx.logger.success("{{PLUGIN_NAME}} setup complete!");
    },

    hooks: {
      async init(ctx) {
        ctx.logger.info("{{PLUGIN_NAME}} initialized");
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
