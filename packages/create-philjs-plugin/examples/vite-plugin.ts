/**
 * Example: Vite Plugin Integration
 *
 * This example shows how to create a plugin that integrates with Vite
 */

import type { Plugin, PluginContext } from "@philjs/core/plugin-system";
import type { Plugin as VitePlugin } from "vite";

export interface VirtualModulesConfig {
  enabled?: boolean;
  modules?: Record<string, string>;
}

export function createVirtualModulesPlugin(
  config: VirtualModulesConfig = {}
): Plugin {
  return {
    meta: {
      name: "philjs-plugin-virtual-modules",
      version: "0.1.0",
      description: "Virtual modules plugin for PhilJS",
      author: "PhilJS Team",
      license: "MIT",
      philjs: "^0.1.0",
    },

    vitePlugin(pluginConfig: VirtualModulesConfig) {
      const modules = pluginConfig.modules || {};
      const prefix = 'virtual:my-plugin/';

      const plugin: VitePlugin = {
        name: "philjs-plugin-virtual-modules",

        resolveId(id) {
          if (id.startsWith(prefix)) {
            return id;
          }
          return null;
        },

        load(id) {
          if (id.startsWith(prefix)) {
            const moduleName = id.slice(prefix.length);
            const code = modules[moduleName];

            if (code) {
              return code;
            }

            return `export default {};`;
          }
          return null;
        },

        handleHotUpdate({ file, server }) {
          // Custom HMR logic for virtual modules
          if (file.endsWith('.virtual')) {
            server.ws.send({
              type: 'custom',
              event: 'virtual-module-update',
            });
          }
        },
      };

      return plugin;
    },

    async setup(pluginConfig: VirtualModulesConfig, ctx: PluginContext) {
      ctx.logger.info("Setting up VirtualModules plugin...");

      const { enabled = true, modules = {} } = pluginConfig;

      if (!enabled) {
        ctx.logger.warn("Plugin is disabled");
        return;
      }

      // Log registered modules
      const moduleNames = Object.keys(modules);
      if (moduleNames.length > 0) {
        ctx.logger.info(`Registering ${moduleNames.length} virtual modules`);
        moduleNames.forEach(name => {
          ctx.logger.debug(`  - virtual:my-plugin/${name}`);
        });
      }

      ctx.logger.success("VirtualModules plugin setup complete!");
    },

    hooks: {
      async init(ctx) {
        ctx.logger.info("VirtualModules plugin initialized");
      },
    },
  };
}

export default createVirtualModulesPlugin();

// Example usage:
// import myModule from 'virtual:my-plugin/config';
