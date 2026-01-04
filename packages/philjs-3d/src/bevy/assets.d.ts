/**
 * @file Bevy Asset Management
 * @description Asset loading and caching for Bevy WASM integration
 */
import type { AssetHandle, AssetMetadata, BevyAssetType } from './types.js';
/**
 * Load a single asset for Bevy
 *
 * @param path - Asset path (relative to public/assets or absolute URL)
 * @param options - Load options
 * @returns Asset handle
 *
 * @example
 * ```ts
 * const texture = await loadBevyAsset('/assets/player.png');
 * if (texture.isLoaded()) {
 *   console.log('Texture loaded:', texture.asset);
 * }
 * ```
 */
export declare function loadBevyAsset<T = unknown>(path: string, options?: {
    type?: BevyAssetType;
    priority?: 'high' | 'normal' | 'low';
    cache?: boolean;
}): AssetHandle<T>;
/**
 * Preload multiple assets
 *
 * @param paths - Asset paths to preload
 * @param options - Preload options
 * @returns Promise resolving when all assets are loaded
 *
 * @example
 * ```ts
 * await preloadAssets([
 *   '/assets/player.png',
 *   '/assets/enemy.png',
 *   '/assets/background.mp3',
 *   '/assets/level.gltf',
 * ]);
 * console.log('All assets loaded!');
 * ```
 */
export declare function preloadAssets(paths: string[], options?: {
    onProgress?: (loaded: number, total: number) => void;
    onError?: (path: string, error: Error) => void;
    continueOnError?: boolean;
}): Promise<Map<string, AssetHandle<unknown>>>;
/**
 * Preload assets with priority ordering
 *
 * @param assets - Assets with priorities
 * @returns Promise resolving when all assets are loaded
 *
 * @example
 * ```ts
 * await preloadAssetsWithPriority([
 *   { path: '/assets/ui.png', priority: 'high' },
 *   { path: '/assets/background.png', priority: 'low' },
 *   { path: '/assets/player.gltf', priority: 'high' },
 * ]);
 * ```
 */
export declare function preloadAssetsWithPriority(assets: Array<{
    path: string;
    priority: 'high' | 'normal' | 'low';
}>): Promise<void>;
/**
 * Get cached asset
 *
 * @param path - Asset path
 * @returns Cached asset handle or undefined
 *
 * @example
 * ```ts
 * const cached = getCachedAsset('/assets/player.png');
 * if (cached?.isLoaded()) {
 *   useTexture(cached.asset);
 * }
 * ```
 */
export declare function getCachedAsset<T = unknown>(path: string): AssetHandle<T> | undefined;
/**
 * Check if asset is cached
 *
 * @param path - Asset path
 * @returns Whether the asset is cached
 */
export declare function isAssetCached(path: string): boolean;
/**
 * Check if asset is loaded
 *
 * @param path - Asset path
 * @returns Whether the asset is loaded
 */
export declare function isAssetLoaded(path: string): boolean;
/**
 * Get asset metadata
 *
 * @param path - Asset path
 * @returns Asset metadata or undefined
 */
export declare function getAssetMetadata(path: string): AssetMetadata | undefined;
/**
 * Clear a specific asset from cache
 *
 * @param path - Asset path to clear
 */
export declare function clearAsset(path: string): void;
/**
 * Clear all cached assets
 */
export declare function clearAssetCache(): void;
/**
 * Get total size of cached assets
 *
 * @returns Total size in bytes
 */
export declare function getCacheSize(): number;
/**
 * Get number of cached assets
 *
 * @returns Number of cached assets
 */
export declare function getCacheCount(): number;
/**
 * Get all cached asset paths
 *
 * @returns Array of cached asset paths
 */
export declare function getCachedAssetPaths(): string[];
/**
 * Watch an asset for changes (development mode)
 *
 * @param path - Asset path to watch
 * @param callback - Callback when asset changes
 * @returns Unsubscribe function
 *
 * @example
 * ```ts
 * const unwatch = watchAsset('/assets/player.png', (asset) => {
 *   console.log('Asset updated:', asset);
 *   refreshTexture(asset);
 * });
 * ```
 */
export declare function watchAsset<T = unknown>(path: string, callback: (asset: T) => void): () => void;
/**
 * Asset bundle definition
 */
export interface AssetBundle {
    name: string;
    assets: string[];
    loaded: boolean;
    handles: Map<string, AssetHandle<unknown>>;
}
/**
 * Define an asset bundle
 *
 * @param name - Bundle name
 * @param assets - Asset paths in the bundle
 * @returns Bundle definition
 *
 * @example
 * ```ts
 * defineAssetBundle('level1', [
 *   '/assets/level1/tileset.png',
 *   '/assets/level1/music.mp3',
 *   '/assets/level1/enemies.gltf',
 * ]);
 * ```
 */
export declare function defineAssetBundle(name: string, assets: string[]): AssetBundle;
/**
 * Load an asset bundle
 *
 * @param name - Bundle name
 * @param onProgress - Progress callback
 * @returns Promise resolving when bundle is loaded
 *
 * @example
 * ```ts
 * await loadAssetBundle('level1', (loaded, total) => {
 *   updateLoadingBar(loaded / total);
 * });
 * ```
 */
export declare function loadAssetBundle(name: string, onProgress?: (loaded: number, total: number) => void): Promise<AssetBundle>;
/**
 * Unload an asset bundle
 *
 * @param name - Bundle name
 */
export declare function unloadAssetBundle(name: string): void;
/**
 * Get bundle by name
 *
 * @param name - Bundle name
 * @returns Bundle or undefined
 */
export declare function getAssetBundle(name: string): AssetBundle | undefined;
/**
 * Check if bundle is loaded
 *
 * @param name - Bundle name
 * @returns Whether the bundle is loaded
 */
export declare function isBundleLoaded(name: string): boolean;
/**
 * Stream a large asset with progress
 *
 * @param path - Asset path
 * @param onProgress - Progress callback (0-1)
 * @returns Promise resolving to the asset
 *
 * @example
 * ```ts
 * const data = await streamAsset('/assets/large-level.glb', (progress) => {
 *   updateLoadingProgress(progress * 100);
 * });
 * ```
 */
export declare function streamAsset<T = ArrayBuffer>(path: string, onProgress: (progress: number) => void): Promise<T>;
//# sourceMappingURL=assets.d.ts.map