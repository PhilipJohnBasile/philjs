/**
 * PhilJS Plugin Registry
 *
 * Directory of official and community plugins.
 */
export interface PluginInfo {
    name: string;
    version: string;
    description: string;
    author: string;
    repository?: string;
    homepage?: string;
    keywords: string[];
    downloads: number;
    stars: number;
    category: PluginCategory;
    official: boolean;
    verified: boolean;
}
export type PluginCategory = 'analytics' | 'auth' | 'cms' | 'database' | 'deployment' | 'devtools' | 'forms' | 'i18n' | 'monitoring' | 'payments' | 'seo' | 'styling' | 'testing' | 'ui' | 'utilities' | 'other';
/**
 * Plugin Registry class
 */
export declare class PluginRegistry {
    private plugins;
    private baseUrl;
    constructor(baseUrl?: string);
    /**
     * Get all plugins
     */
    getAll(): PluginInfo[];
    /**
     * Get plugin by name
     */
    get(name: string): PluginInfo | undefined;
    /**
     * Search plugins
     */
    search(query: string): PluginInfo[];
    /**
     * Get plugins by category
     */
    getByCategory(category: PluginCategory): PluginInfo[];
    /**
     * Get official plugins
     */
    getOfficial(): PluginInfo[];
    /**
     * Get verified plugins
     */
    getVerified(): PluginInfo[];
    /**
     * Fetch latest plugin info from registry
     */
    fetch(name: string): Promise<PluginInfo | null>;
    /**
     * Refresh registry from remote
     */
    refresh(): Promise<void>;
}
/**
 * Fetch plugin info
 */
export declare function fetchPluginInfo(name: string): Promise<PluginInfo | null>;
/**
 * Search plugins
 */
export declare function searchPlugins(query: string): PluginInfo[];
/**
 * Get plugins by category
 */
export declare function getPluginsByCategory(category: PluginCategory): PluginInfo[];
/**
 * Get all plugin categories
 */
export declare function getPluginCategories(): PluginCategory[];
export default PluginRegistry;
//# sourceMappingURL=registry.d.ts.map