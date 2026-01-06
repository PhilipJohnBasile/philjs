/**
 * PhilJS CLI Plugin Commands
 * Commands for managing PhilJS plugins
 */

import { Command } from "commander";
import prompts from "prompts";
import * as pc from "picocolors";
import {
  CLIPluginManager,
  formatPluginList,
  formatSearchResults,
} from "../plugin-manager.js";

/**
 * Register plugin commands
 */
export function registerPluginCommands(program: Command): void {
  const plugin = program
    .command("plugin")
    .description("Manage PhilJS plugins");

  // Add plugin command
  plugin
    .command("add [plugin-name]")
    .description("Install a plugin")
    .option("-D, --dev", "Install as dev dependency", false)
    .option("-v, --version <version>", "Specific version to install")
    .action(async (pluginName: string | undefined, options: { dev: boolean; version?: string }) => {
      const manager = new CLIPluginManager();

      // Interactive mode if no plugin name provided
      if (!pluginName) {
        const response = await prompts([
          {
            type: "text",
            name: "search",
            message: "Search for a plugin:",
          },
        ]);

        if (!response['search']) {
          return;
        }

        // Search for plugins
        const results = await manager.search(response['search']);

        if (results.length === 0) {
          console.log(pc.yellow(`No plugins found for "${response['search']}"`));
          return;
        }

        // Select plugin
        const selected = await prompts([
          {
            type: "select",
            name: "plugin",
            message: "Select a plugin to install:",
            choices: results.map((p) => ({
              title: `${p.name} - ${p.description}`,
              value: p.name,
            })),
          },
        ]);

        if (!selected['plugin']) {
          return;
        }

        pluginName = selected['plugin'];
      }

      try {
        const installOptions: { dev?: boolean; version?: string } = {
          dev: options.dev,
        };
        if (options.version) {
          installOptions.version = options.version;
        }
        await manager.install(pluginName as string, installOptions);
      } catch (error) {
        process.exit(1);
      }
    });

  // Remove plugin command
  const removeCmd = plugin.command("remove <plugin-name>");
  removeCmd.alias("rm");
  removeCmd
    .description("Remove a plugin")
    .action(async (pluginName: string) => {
      const manager = new CLIPluginManager();

      // Confirm removal
      const response = await prompts([
        {
          type: "confirm",
          name: "confirm",
          message: `Are you sure you want to remove ${pc.bold(pluginName)}?`,
          initial: false,
        },
      ]);

      if (!response['confirm']) {
        return;
      }

      try {
        await manager.remove(pluginName);
      } catch (error) {
        process.exit(1);
      }
    });

  // List plugins command
  const listCmd = plugin.command("list");
  listCmd.alias("ls");
  listCmd
    .description("List installed plugins")
    .action(async () => {
      const manager = new CLIPluginManager();

      try {
        const plugins = await manager.list();

      } catch (error) {
        console.error(pc.red(`Failed to list plugins: ${error instanceof Error ? error.message : String(error)}`));
        process.exit(1);
      }
    });

  // Search plugins command
  plugin
    .command("search <query>")
    .description("Search for plugins in the registry")
    .option("-l, --limit <number>", "Limit number of results", "20")
    .option("-t, --tags <tags>", "Filter by tags (comma-separated)")
    .action(async (query: string, options: { limit: string; tags?: string }) => {
      const manager = new CLIPluginManager();

      try {
        const searchOptions: { limit: number; tags?: string[] } = {
          limit: parseInt(options.limit),
        };
        if (options.tags) {
          searchOptions.tags = options.tags.split(",");
        }
        const results = await manager.search(query, searchOptions);

        console.log(pc.cyan(`\nSearch results for "${query}":`));
      } catch (error) {
        console.error(pc.red(`Search failed: ${error instanceof Error ? error.message : String(error)}`));
        process.exit(1);
      }
    });

  // Info command
  plugin
    .command("info <plugin-name>")
    .description("Show plugin information")
    .action(async (pluginName: string) => {
      const manager = new CLIPluginManager();

      try {
        const info = await manager.info(pluginName);

        if (!info) {
          console.log(pc.yellow(`Plugin ${pluginName} not found in registry`));
          return;
        }

        console.log(pc.cyan(`\n${pc.bold(info.name)} ${info.verified ? pc.green("✓") : ""}`));
        console.log(pc.bold("Description:"), info.description);
        console.log(pc.bold("Downloads:"), info.downloads.toLocaleString());
        console.log(pc.bold("Rating:"), "★".repeat(Math.round(info.rating)));

        if (info.homepage) {
          console.log(pc.bold("Homepage:"), pc.underline(info.homepage));
        }

        if (info.repository) {
          console.log(pc.bold("Repository:"), pc.underline(info.repository));
        }

        if (info.tags.length > 0) {
          console.log(pc.bold("Tags:"), info.tags.join(", "));
        }

        console.log(pc.bold("Updated:"), new Date(info.updatedAt).toLocaleDateString());
      } catch (error) {
        console.error(pc.red(`Failed to get plugin info: ${error instanceof Error ? error.message : String(error)}`));
        process.exit(1);
      }
    });

  // Enable plugin command
  plugin
    .command("enable <plugin-name>")
    .description("Enable a plugin")
    .action(async (pluginName: string) => {
      const manager = new CLIPluginManager();

      try {
        await manager.enable(pluginName);
      } catch (error) {
        console.error(pc.red(`Failed to enable plugin: ${error instanceof Error ? error.message : String(error)}`));
        process.exit(1);
      }
    });

  // Disable plugin command
  plugin
    .command("disable <plugin-name>")
    .description("Disable a plugin")
    .action(async (pluginName: string) => {
      const manager = new CLIPluginManager();

      try {
        await manager.disable(pluginName);
      } catch (error) {
        console.error(pc.red(`Failed to disable plugin: ${error instanceof Error ? error.message : String(error)}`));
        process.exit(1);
      }
    });

  // Configure plugin command
  plugin
    .command("config <plugin-name>")
    .description("Configure a plugin")
    .action(async (pluginName: string) => {
      const manager = new CLIPluginManager();

      try {
        // Get current config
        const plugins = await manager.list();
        const plugin = plugins.find((p) => p.name === pluginName);

        if (!plugin) {
          console.log(pc.yellow(`Plugin ${pluginName} is not installed`));
          return;
        }

        console.log(pc.cyan(`\nCurrent configuration for ${pc.bold(pluginName)}:\n`));
        console.log(JSON.stringify(plugin.config || {}, null, 2));

        // Interactive config editor
        const response = await prompts([
          {
            type: "confirm",
            name: "edit",
            message: "Edit configuration?",
            initial: true,
          },
        ]);

        if (!response['edit']) {
          return;
        }

        const newConfig = await prompts([
          {
            type: "text",
            name: "json",
            message: "Enter new configuration (JSON):",
            initial: JSON.stringify(plugin.config || {}, null, 2),
            validate: (value) => {
              try {
                JSON.parse(value);
                return true;
              } catch {
                return "Invalid JSON";
              }
            },
          },
        ]);

        if (newConfig['json']) {
          const parsed = JSON.parse(newConfig['json']);
          await manager.configure(pluginName, parsed);
        }
      } catch (error) {
        console.error(pc.red(`Failed to configure plugin: ${error instanceof Error ? error.message : String(error)}`));
        process.exit(1);
      }
    });

  // Update plugins command
  plugin
    .command("update")
    .description("Update all plugins")
    .action(async () => {
      const manager = new CLIPluginManager();

      try {
        await manager.updateAll();
      } catch (error) {
        console.error(pc.red(`Failed to update plugins: ${error instanceof Error ? error.message : String(error)}`));
        process.exit(1);
      }
    });

  // Verify plugin command
  plugin
    .command("verify <plugin-name>")
    .description("Verify plugin integrity and compatibility")
    .action(async (pluginName: string) => {
      const manager = new CLIPluginManager();

      try {
        const verified = await manager.verify(pluginName);
        process.exit(verified ? 0 : 1);
      } catch (error) {
        console.error(pc.red(`Verification failed: ${error instanceof Error ? error.message : String(error)}`));
        process.exit(1);
      }
    });

  // Interactive plugin setup
  plugin
    .command("setup")
    .description("Interactive plugin setup wizard")
    .action(async () => {
      console.log(pc.cyan("\nPhilJS Plugin Setup Wizard\n"));

      const response = await prompts([
        {
          type: "select",
          name: "category",
          message: "What type of plugin are you looking for?",
          choices: [
            { title: "Styling & Design", value: "styling" },
            { title: "Analytics & Monitoring", value: "analytics" },
            { title: "SEO & Marketing", value: "seo" },
            { title: "Development Tools", value: "devtools" },
            { title: "Performance", value: "performance" },
            { title: "Authentication", value: "auth" },
            { title: "Database & Storage", value: "database" },
            { title: "All Plugins", value: "all" },
          ],
        },
      ]);

      if (!response['category']) {
        return;
      }

      const manager = new CLIPluginManager();

      // Search by category
      const setupSearchOptions: { limit: number; tags?: string[] } = { limit: 50 };
      if (response['category'] !== "all") {
        setupSearchOptions.tags = [response['category']];
      }
      const results = await manager.search("", setupSearchOptions);

      if (results.length === 0) {
        console.log(pc.yellow("No plugins found in this category"));
        return;
      }

      // Select plugins to install
      const selected = await prompts([
        {
          type: "multiselect",
          name: "plugins",
          message: "Select plugins to install (space to select, enter to confirm):",
          choices: results.map((p) => ({
            title: `${p.name} - ${p.description}`,
            value: p.name,
            selected: false,
          })),
        },
      ]);

      if (!selected['plugins'] || selected['plugins'].length === 0) {
        return;
      }

      // Install selected plugins
      for (const pluginName of selected['plugins']) {
        try {
          await manager.install(pluginName);
        } catch (error) {
          console.error(pc.red(`Failed to install ${pluginName}`));
        }
      }

    });
}
