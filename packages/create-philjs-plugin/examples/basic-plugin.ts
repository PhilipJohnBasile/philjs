/**
 * Example: Basic PhilJS Plugin
 *
 * This example shows how to create a simple plugin with lifecycle hooks
 */

import type { Plugin, PluginContext } from "philjs-core/plugin-system";

export interface HelloWorldConfig {
  enabled?: boolean;
  message?: string;
}

export function createHelloWorldPlugin(
  config: HelloWorldConfig = {}
): Plugin {
  return {
    meta: {
      name: "philjs-plugin-hello-world",
      version: "1.0.0",
      description: "A simple hello world plugin",
      author: "PhilJS Team",
      license: "MIT",
      philjs: "^2.0.0",
    },

    async setup(pluginConfig: HelloWorldConfig, ctx: PluginContext) {
      ctx.logger.info("Setting up HelloWorld plugin...");

      const { enabled = true, message = "Hello, World!" } = pluginConfig;

      if (!enabled) {
        ctx.logger.warn("Plugin is disabled");
        return;
      }

      // Store configuration in context
      (ctx as any).helloWorld = { message };

      ctx.logger.success("HelloWorld plugin setup complete!");
    },

    hooks: {
      async init(ctx) {
        const message = (ctx as any).helloWorld?.message || "Hello, World!";
        ctx.logger.info(message);
      },

      async buildStart(ctx, buildConfig) {
        ctx.logger.debug("Starting build...");
      },

      async buildEnd(ctx, result) {
        if (result.success) {
          ctx.logger.success("Build completed successfully!");
        } else {
          ctx.logger.error("Build failed");
        }
      },
    },
  };
}

export default createHelloWorldPlugin();
