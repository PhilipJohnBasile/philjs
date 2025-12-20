/**
 * Vite PhilJS Plugin Template
 */

import type { Plugin, PluginContext } from "philjs-core/plugin-system";
import type { Plugin as VitePlugin } from "vite";

export interface {{PLUGIN_NAME}}Config {
  enabled?: boolean;
  virtualModules?: Record<string, string>;
}

export function create{{PLUGIN_NAME}}Plugin(
  pluginConfig: {{PLUGIN_NAME}}Config = {}
): Plugin {
  return {
    meta: {
      name: "{{PACKAGE_NAME}}",
      version: "1.0.0",
      description: "{{DESCRIPTION}}",
      author: "{{AUTHOR}}",
      license: "{{LICENSE}}",
      philjs: "^2.0.0",
    },

    vitePlugin(config: {{PLUGIN_NAME}}Config) {
      const plugin: VitePlugin = {
        name: "{{PACKAGE_NAME}}",

        config() {
          return {
            // Modify Vite config
          };
        },

        resolveId(id) {
          if (id.startsWith('virtual:{{PACKAGE_NAME}}')) {
            return id;
          }
          return null;
        },

        load(id) {
          if (id.startsWith('virtual:{{PACKAGE_NAME}}')) {
            return config.virtualModules?.[id] || `export default {};`;
          }
          return null;
        },

        transform(code, id) {
          // Transform code
          return null;
        },

        handleHotUpdate({ file, server }) {
          // Custom HMR logic
        },
      };

      return plugin;
    },

    async setup(config: {{PLUGIN_NAME}}Config, ctx: PluginContext) {
      ctx.logger.info("Setting up {{PLUGIN_NAME}}...");

      if (!config.enabled) {
        ctx.logger.warn("Plugin is disabled");
        return;
      }

      // Register virtual modules
      if (config.virtualModules) {
        Object.entries(config.virtualModules).forEach(([id, code]) => {
          ctx.logger.debug(`Registering virtual module: ${id}`);
        });
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
