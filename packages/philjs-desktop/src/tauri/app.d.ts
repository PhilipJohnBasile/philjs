/**
 * Desktop App Creation
 */
import type { DesktopAppOptions, TauriConfig, TauriPlugin } from './types.js';
/**
 * Create a PhilJS desktop application
 * @param options - App creation options
 */
export declare function createDesktopApp<Props = Record<string, unknown>>(options: DesktopAppOptions<Props>): Promise<void>;
/**
 * Register a before close handler
 */
export declare function onBeforeClose(handler: () => boolean | Promise<boolean>): () => void;
/**
 * Check if app is initialized
 */
export declare function isAppInitialized(): boolean;
/**
 * Get loaded plugins
 */
export declare function getLoadedPlugins(): TauriPlugin[];
/**
 * Create default Tauri configuration
 */
export declare function createDefaultConfig(overrides?: Partial<TauriConfig>): TauriConfig;
/**
 * Get app version
 */
export declare function getAppVersion(): Promise<string>;
/**
 * Get app name
 */
export declare function getAppName(): Promise<string>;
/**
 * Get Tauri version
 */
export declare function getTauriVersion(): Promise<string>;
//# sourceMappingURL=app.d.ts.map