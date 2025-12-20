/**
 * PhilJS CLI Plugin Manager
 * Handles plugin installation, removal, discovery, and configuration
 */

import * as fs from "fs/promises";
import * as path from "path";
import { execSync } from "child_process";
import * as pc from "picocolors";
import type { Plugin, PluginMetadata } from "philjs-core/plugin-system";

/**
 * Plugin registry entry
 */
export interface PluginRegistryEntry {
  name: string;
  version: string;
  description: string;
  author: string;
  homepage?: string;
  repository?: string;
  downloads: number;
  rating: number;
  tags: string[];
  philjs: string;
  verified: boolean;
  createdAt: string;
  updatedAt: string;
}

/**
 * Installed plugin info
 */
export interface InstalledPlugin {
  name: string;
  version: string;
  enabled: boolean;
  config?: Record<string, any>;
}

/**
 * Plugin manager configuration
 */
export interface PluginManagerConfig {
  registry: string;
  cacheDir: string;
  pluginsDir: string;
}

/**
 * Default configuration
 */
const DEFAULT_CONFIG: PluginManagerConfig = {
  registry: "https://plugins.philjs.dev/api",
  cacheDir: ".philjs/cache/plugins",
  pluginsDir: "node_modules",
};

/**
 * Plugin manager class
 */
export class CLIPluginManager {
  private config: PluginManagerConfig;
  private projectRoot: string;
  private configPath: string;

  constructor(projectRoot: string = process.cwd(), config?: Partial<PluginManagerConfig>) {
    this.projectRoot = projectRoot;
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.configPath = path.join(projectRoot, ".philjs", "plugins.json");
  }

  /**
   * Install a plugin
   */
  async install(pluginName: string, options: { dev?: boolean; version?: string } = {}): Promise<void> {
    console.log(pc.cyan(`\nInstalling plugin: ${pc.bold(pluginName)}...\n`));

    try {
      // Determine package manager
      const packageManager = await this.detectPackageManager();

      // Build install command
      const version = options.version || "latest";
      const packageSpec = version === "latest" ? pluginName : `${pluginName}@${version}`;
      const devFlag = options.dev ? "-D" : "";

      // Install package
      const installCmd = this.getInstallCommand(packageManager, packageSpec, devFlag);
      console.log(pc.dim(`Running: ${installCmd}`));

      execSync(installCmd, {
        cwd: this.projectRoot,
        stdio: "inherit",
      });

      // Load plugin metadata
      const plugin = await this.loadPlugin(pluginName);

      // Save to plugins config
      await this.addToConfig(pluginName, {
        name: pluginName,
        version: plugin.meta.version,
        enabled: true,
        config: {},
      });

      // Run plugin setup if available
      if (plugin.setup) {
        console.log(pc.cyan("\nRunning plugin setup..."));
        // Create a minimal context for setup
        const ctx = await this.createSetupContext(plugin);
        await plugin.setup({}, ctx);
      }

      console.log(pc.green(`\nPlugin ${pc.bold(pluginName)} installed successfully!`));

      // Show next steps
      this.showNextSteps(plugin);
    } catch (error) {
      console.error(pc.red(`\nFailed to install plugin: ${error instanceof Error ? error.message : String(error)}`));
      throw error;
    }
  }

  /**
   * Remove a plugin
   */
  async remove(pluginName: string): Promise<void> {
    console.log(pc.cyan(`\nRemoving plugin: ${pc.bold(pluginName)}...\n`));

    try {
      // Check if plugin is installed
      const installed = await this.isInstalled(pluginName);
      if (!installed) {
        console.log(pc.yellow(`Plugin ${pluginName} is not installed.`));
        return;
      }

      // Determine package manager
      const packageManager = await this.detectPackageManager();

      // Uninstall package
      const uninstallCmd = this.getUninstallCommand(packageManager, pluginName);
      console.log(pc.dim(`Running: ${uninstallCmd}`));

      execSync(uninstallCmd, {
        cwd: this.projectRoot,
        stdio: "inherit",
      });

      // Remove from config
      await this.removeFromConfig(pluginName);

      console.log(pc.green(`\nPlugin ${pc.bold(pluginName)} removed successfully!`));
    } catch (error) {
      console.error(pc.red(`\nFailed to remove plugin: ${error instanceof Error ? error.message : String(error)}`));
      throw error;
    }
  }

  /**
   * List installed plugins
   */
  async list(): Promise<InstalledPlugin[]> {
    const config = await this.loadConfig();
    return config.plugins || [];
  }

  /**
   * Search for plugins in the registry
   */
  async search(query: string, options: { limit?: number; tags?: string[] } = {}): Promise<PluginRegistryEntry[]> {
    console.log(pc.cyan(`\nSearching for plugins: ${pc.bold(query)}...\n`));

    try {
      const params = new URLSearchParams({
        q: query,
        limit: String(options.limit || 20),
        ...(options.tags && { tags: options.tags.join(",") }),
      });

      const response = await fetch(`${this.config.registry}/search?${params}`);

      if (!response.ok) {
        throw new Error(`Registry request failed: ${response.statusText}`);
      }

      const results = await response.json() as PluginRegistryEntry[];

      return results;
    } catch (error) {
      console.error(pc.red(`Search failed: ${error instanceof Error ? error.message : String(error)}`));
      return [];
    }
  }

  /**
   * Get plugin info from registry
   */
  async info(pluginName: string): Promise<PluginRegistryEntry | null> {
    try {
      const response = await fetch(`${this.config.registry}/plugins/${pluginName}`);

      if (!response.ok) {
        return null;
      }

      return await response.json();
    } catch (error) {
      console.error(pc.red(`Failed to fetch plugin info: ${error instanceof Error ? error.message : String(error)}`));
      return null;
    }
  }

  /**
   * Enable a plugin
   */
  async enable(pluginName: string): Promise<void> {
    const config = await this.loadConfig();
    const plugin = config.plugins?.find((p) => p.name === pluginName);

    if (!plugin) {
      throw new Error(`Plugin ${pluginName} is not installed`);
    }

    plugin.enabled = true;
    await this.saveConfig(config);

    console.log(pc.green(`Plugin ${pc.bold(pluginName)} enabled`));
  }

  /**
   * Disable a plugin
   */
  async disable(pluginName: string): Promise<void> {
    const config = await this.loadConfig();
    const plugin = config.plugins?.find((p) => p.name === pluginName);

    if (!plugin) {
      throw new Error(`Plugin ${pluginName} is not installed`);
    }

    plugin.enabled = false;
    await this.saveConfig(config);

    console.log(pc.yellow(`Plugin ${pc.bold(pluginName)} disabled`));
  }

  /**
   * Update plugin configuration
   */
  async configure(pluginName: string, config: Record<string, any>): Promise<void> {
    const pluginsConfig = await this.loadConfig();
    const plugin = pluginsConfig.plugins?.find((p) => p.name === pluginName);

    if (!plugin) {
      throw new Error(`Plugin ${pluginName} is not installed`);
    }

    plugin.config = { ...plugin.config, ...config };
    await this.saveConfig(pluginsConfig);

    console.log(pc.green(`Plugin ${pc.bold(pluginName)} configured`));
  }

  /**
   * Update all plugins
   */
  async updateAll(): Promise<void> {
    console.log(pc.cyan("\nUpdating all plugins...\n"));

    const plugins = await this.list();
    const packageManager = await this.detectPackageManager();

    for (const plugin of plugins) {
      try {
        console.log(pc.dim(`Updating ${plugin.name}...`));

        const updateCmd = this.getUpdateCommand(packageManager, plugin.name);
        execSync(updateCmd, {
          cwd: this.projectRoot,
          stdio: "pipe",
        });

        // Update version in config
        const newPlugin = await this.loadPlugin(plugin.name);
        plugin.version = newPlugin.meta.version;
      } catch (error) {
        console.error(pc.red(`Failed to update ${plugin.name}`));
      }
    }

    await this.saveConfig({ plugins });
    console.log(pc.green("\nAll plugins updated!"));
  }

  /**
   * Verify plugin integrity
   */
  async verify(pluginName: string): Promise<boolean> {
    try {
      const plugin = await this.loadPlugin(pluginName);

      // Check if plugin has required metadata
      if (!plugin.meta?.name || !plugin.meta?.version) {
        console.error(pc.red(`Plugin ${pluginName} is missing required metadata`));
        return false;
      }

      // Check if plugin is compatible with current PhilJS version
      if (plugin.meta.philjs) {
        const isCompatible = await this.checkVersionCompatibility(plugin.meta.philjs);
        if (!isCompatible) {
          console.error(pc.red(`Plugin ${pluginName} is not compatible with current PhilJS version`));
          return false;
        }
      }

      console.log(pc.green(`Plugin ${pluginName} verified successfully`));
      return true;
    } catch (error) {
      console.error(pc.red(`Verification failed: ${error instanceof Error ? error.message : String(error)}`));
      return false;
    }
  }

  /**
   * Load a plugin module
   */
  private async loadPlugin(pluginName: string): Promise<Plugin> {
    try {
      // Try to resolve and import the plugin
      const pluginPath = require.resolve(pluginName, {
        paths: [this.projectRoot],
      });

      const module = await import(pluginPath);

      // Plugin can export default or named export
      const plugin = module.default || module.plugin || module;

      if (!plugin || typeof plugin !== "object") {
        throw new Error(`Invalid plugin export from ${pluginName}`);
      }

      return plugin as Plugin;
    } catch (error) {
      throw new Error(`Failed to load plugin ${pluginName}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Check if plugin is installed
   */
  private async isInstalled(pluginName: string): Promise<boolean> {
    try {
      require.resolve(pluginName, {
        paths: [this.projectRoot],
      });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Detect package manager
   */
  private async detectPackageManager(): Promise<"npm" | "pnpm" | "yarn" | "bun"> {
    // Check for lock files
    const lockFiles = {
      "pnpm-lock.yaml": "pnpm" as const,
      "yarn.lock": "yarn" as const,
      "bun.lockb": "bun" as const,
      "package-lock.json": "npm" as const,
    };

    for (const [file, pm] of Object.entries(lockFiles)) {
      try {
        await fs.access(path.join(this.projectRoot, file));
        return pm;
      } catch {
        // Continue checking
      }
    }

    // Default to npm
    return "npm";
  }

  /**
   * Get install command for package manager
   */
  private getInstallCommand(pm: string, packageSpec: string, devFlag: string): string {
    const commands = {
      npm: `npm install ${devFlag} ${packageSpec}`,
      pnpm: `pnpm add ${devFlag} ${packageSpec}`,
      yarn: `yarn add ${devFlag} ${packageSpec}`,
      bun: `bun add ${devFlag} ${packageSpec}`,
    };
    return commands[pm as keyof typeof commands] || commands.npm;
  }

  /**
   * Get uninstall command for package manager
   */
  private getUninstallCommand(pm: string, packageName: string): string {
    const commands = {
      npm: `npm uninstall ${packageName}`,
      pnpm: `pnpm remove ${packageName}`,
      yarn: `yarn remove ${packageName}`,
      bun: `bun remove ${packageName}`,
    };
    return commands[pm as keyof typeof commands] || commands.npm;
  }

  /**
   * Get update command for package manager
   */
  private getUpdateCommand(pm: string, packageName: string): string {
    const commands = {
      npm: `npm update ${packageName}`,
      pnpm: `pnpm update ${packageName}`,
      yarn: `yarn upgrade ${packageName}`,
      bun: `bun update ${packageName}`,
    };
    return commands[pm as keyof typeof commands] || commands.npm;
  }

  /**
   * Load plugins configuration
   */
  private async loadConfig(): Promise<{ plugins: InstalledPlugin[] }> {
    try {
      const content = await fs.readFile(this.configPath, "utf-8");
      return JSON.parse(content);
    } catch {
      return { plugins: [] };
    }
  }

  /**
   * Save plugins configuration
   */
  private async saveConfig(config: { plugins: InstalledPlugin[] }): Promise<void> {
    const dir = path.dirname(this.configPath);
    await fs.mkdir(dir, { recursive: true });
    await fs.writeFile(this.configPath, JSON.stringify(config, null, 2));
  }

  /**
   * Add plugin to configuration
   */
  private async addToConfig(pluginName: string, plugin: InstalledPlugin): Promise<void> {
    const config = await this.loadConfig();

    // Remove existing entry if present
    config.plugins = config.plugins.filter((p) => p.name !== pluginName);

    // Add new entry
    config.plugins.push(plugin);

    await this.saveConfig(config);
  }

  /**
   * Remove plugin from configuration
   */
  private async removeFromConfig(pluginName: string): Promise<void> {
    const config = await this.loadConfig();
    config.plugins = config.plugins.filter((p) => p.name !== pluginName);
    await this.saveConfig(config);
  }

  /**
   * Create setup context for plugin
   */
  private async createSetupContext(plugin: Plugin): Promise<any> {
    const packageJson = await this.readPackageJson();

    return {
      version: packageJson.dependencies?.["philjs-core"] || "2.0.0",
      root: this.projectRoot,
      mode: "development" as const,
      config: {},
      logger: {
        info: (msg: string) => console.log(pc.blue(`[${plugin.meta.name}]`), msg),
        warn: (msg: string) => console.log(pc.yellow(`[${plugin.meta.name}]`), msg),
        error: (msg: string) => console.log(pc.red(`[${plugin.meta.name}]`), msg),
        debug: (msg: string) => console.log(pc.dim(`[${plugin.meta.name}]`), msg),
        success: (msg: string) => console.log(pc.green(`[${plugin.meta.name}]`), msg),
      },
      fs: {
        readFile: (p: string) => fs.readFile(path.resolve(this.projectRoot, p), "utf-8"),
        writeFile: (p: string, content: string) => fs.writeFile(path.resolve(this.projectRoot, p), content),
        exists: async (p: string) => {
          try {
            await fs.access(path.resolve(this.projectRoot, p));
            return true;
          } catch {
            return false;
          }
        },
        mkdir: (p: string, opts?: { recursive?: boolean }) => fs.mkdir(path.resolve(this.projectRoot, p), opts),
        readdir: (p: string) => fs.readdir(path.resolve(this.projectRoot, p)),
        copy: async (src: string, dest: string) => {
          await fs.copyFile(
            path.resolve(this.projectRoot, src),
            path.resolve(this.projectRoot, dest)
          );
        },
        remove: (p: string) => fs.rm(path.resolve(this.projectRoot, p), { recursive: true, force: true }),
      },
      utils: {
        resolve: (...paths: string[]) => path.resolve(this.projectRoot, ...paths),
        exec: async (cmd: string, opts?: { cwd?: string }) => {
          const result = execSync(cmd, {
            cwd: opts?.cwd || this.projectRoot,
            encoding: "utf-8",
          });
          return { stdout: result, stderr: "" };
        },
        getPackageManager: () => this.detectPackageManager(),
        installPackages: async (packages: string[], dev?: boolean) => {
          const pm = await this.detectPackageManager();
          const devFlag = dev ? "-D" : "";
          const cmd = this.getInstallCommand(pm, packages.join(" "), devFlag);
          execSync(cmd, { cwd: this.projectRoot, stdio: "inherit" });
        },
        readPackageJson: () => this.readPackageJson(),
        writePackageJson: (pkg: Record<string, any>) => this.writePackageJson(pkg),
      },
    };
  }

  /**
   * Read package.json
   */
  private async readPackageJson(): Promise<Record<string, any>> {
    const pkgPath = path.join(this.projectRoot, "package.json");
    const content = await fs.readFile(pkgPath, "utf-8");
    return JSON.parse(content);
  }

  /**
   * Write package.json
   */
  private async writePackageJson(pkg: Record<string, any>): Promise<void> {
    const pkgPath = path.join(this.projectRoot, "package.json");
    await fs.writeFile(pkgPath, JSON.stringify(pkg, null, 2));
  }

  /**
   * Check version compatibility
   */
  private async checkVersionCompatibility(requiredVersion: string): Promise<boolean> {
    // Simple version check - can be enhanced with semver library
    // For now, just check if it's a wildcard or matches major version
    if (requiredVersion === "*" || requiredVersion.includes("*")) {
      return true;
    }

    const packageJson = await this.readPackageJson();
    const currentVersion = packageJson.dependencies?.["philjs-core"] || "2.0.0";

    // Extract major version
    const required = parseInt(requiredVersion.split(".")[0]);
    const current = parseInt(currentVersion.split(".")[0]);

    return required === current;
  }

  /**
   * Show next steps after installation
   */
  private showNextSteps(plugin: Plugin): void {
    console.log(pc.dim("\nNext steps:"));
    console.log(pc.dim(`1. Configure the plugin in ${pc.bold(".philjs/plugins.json")}`));
    console.log(pc.dim(`2. Enable the plugin with ${pc.bold(`philjs plugin enable ${plugin.meta.name}`)}`));

    if (plugin.meta.homepage) {
      console.log(pc.dim(`3. View documentation: ${pc.underline(plugin.meta.homepage)}`));
    }
  }
}

/**
 * Format plugin list for display
 */
export function formatPluginList(plugins: InstalledPlugin[]): string {
  if (plugins.length === 0) {
    return pc.yellow("No plugins installed");
  }

  const lines = plugins.map((plugin) => {
    const status = plugin.enabled ? pc.green("✓ enabled") : pc.dim("○ disabled");
    return `  ${status} ${pc.bold(plugin.name)}${pc.dim(`@${plugin.version}`)}`;
  });

  return lines.join("\n");
}

/**
 * Format search results for display
 */
export function formatSearchResults(results: PluginRegistryEntry[]): string {
  if (results.length === 0) {
    return pc.yellow("No plugins found");
  }

  const lines = results.map((plugin) => {
    const verified = plugin.verified ? pc.green("✓") : "";
    const rating = "★".repeat(Math.round(plugin.rating));
    const downloads = plugin.downloads > 1000
      ? `${(plugin.downloads / 1000).toFixed(1)}k`
      : String(plugin.downloads);

    return [
      `\n${pc.bold(plugin.name)} ${verified}`,
      pc.dim(`  ${plugin.description}`),
      pc.dim(`  ${rating} • ${downloads} downloads • ${plugin.version}`),
      plugin.tags.length > 0 ? pc.dim(`  Tags: ${plugin.tags.join(", ")}`) : "",
    ].filter(Boolean).join("\n");
  });

  return lines.join("\n");
}
