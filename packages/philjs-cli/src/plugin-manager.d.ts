/**
 * PhilJS CLI Plugin Manager
 * Handles plugin installation, removal, discovery, and configuration
 */
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
 * Plugin manager class
 */
export declare class CLIPluginManager {
    private config;
    private projectRoot;
    private configPath;
    constructor(projectRoot?: string, config?: Partial<PluginManagerConfig>);
    /**
     * Install a plugin
     */
    install(pluginName: string, options?: {
        dev?: boolean;
        version?: string;
    }): Promise<void>;
    /**
     * Remove a plugin
     */
    remove(pluginName: string): Promise<void>;
    /**
     * List installed plugins
     */
    list(): Promise<InstalledPlugin[]>;
    /**
     * Search for plugins in the registry
     */
    search(query: string, options?: {
        limit?: number;
        tags?: string[];
    }): Promise<PluginRegistryEntry[]>;
    /**
     * Get plugin info from registry
     */
    info(pluginName: string): Promise<PluginRegistryEntry | null>;
    /**
     * Enable a plugin
     */
    enable(pluginName: string): Promise<void>;
    /**
     * Disable a plugin
     */
    disable(pluginName: string): Promise<void>;
    /**
     * Update plugin configuration
     */
    configure(pluginName: string, config: Record<string, any>): Promise<void>;
    /**
     * Update all plugins
     */
    updateAll(): Promise<void>;
    /**
     * Verify plugin integrity
     */
    verify(pluginName: string): Promise<boolean>;
    /**
     * Load a plugin module
     */
    private loadPlugin;
    /**
     * Check if plugin is installed
     */
    private isInstalled;
    /**
     * Detect package manager
     */
    private detectPackageManager;
    /**
     * Get install command args for package manager (array-based to prevent injection)
     */
    private getInstallArgs;
    /**
     * Get uninstall command args for package manager (array-based to prevent injection)
     */
    private getUninstallArgs;
    /**
     * Get update command args for package manager (array-based to prevent injection)
     */
    private getUpdateArgs;
    /**
     * Load plugins configuration
     */
    private loadConfig;
    /**
     * Save plugins configuration
     */
    private saveConfig;
    /**
     * Add plugin to configuration
     */
    private addToConfig;
    /**
     * Remove plugin from configuration
     */
    private removeFromConfig;
    /**
     * Create setup context for plugin
     */
    private createSetupContext;
    /**
     * Read package.json
     */
    private readPackageJson;
    /**
     * Write package.json
     */
    private writePackageJson;
    /**
     * Check version compatibility
     */
    private checkVersionCompatibility;
    /**
     * Show next steps after installation
     */
    private showNextSteps;
}
/**
 * Format plugin list for display
 */
export declare function formatPluginList(plugins: InstalledPlugin[]): string;
/**
 * Format search results for display
 */
export declare function formatSearchResults(results: PluginRegistryEntry[]): string;
//# sourceMappingURL=plugin-manager.d.ts.map