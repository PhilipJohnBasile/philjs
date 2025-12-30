/**
 * @file Bevy Asset Management
 * @description Asset loading and caching for Bevy WASM integration
 */

import type {
  AssetHandle,
  AssetMetadata,
  AssetState,
  BevyAssetType,
} from './types.js';
import { getBevy, onBevyEvent } from './hooks.js';

// ============================================================================
// Asset Cache
// ============================================================================

/** Asset cache */
const assetCache = new Map<string, AssetHandle<unknown>>();

/** Asset metadata cache */
const metadataCache = new Map<string, AssetMetadata>();

/** Pending asset loads */
const pendingLoads = new Map<string, Promise<unknown>>();

/** Asset load listeners */
const loadListeners = new Map<string, Set<(asset: unknown) => void>>();

/** Error listeners */
const errorListeners = new Map<string, Set<(error: Error) => void>>();

// ============================================================================
// Asset Type Detection
// ============================================================================

/**
 * Detect asset type from file extension
 */
function detectAssetType(path: string): BevyAssetType {
  const ext = path.split('.').pop()?.toLowerCase() || '';

  const typeMap: Record<string, BevyAssetType> = {
    // Textures
    png: 'texture',
    jpg: 'texture',
    jpeg: 'texture',
    webp: 'texture',
    bmp: 'texture',
    tga: 'texture',
    dds: 'texture',
    ktx2: 'texture',
    basis: 'texture',

    // Audio
    mp3: 'audio',
    wav: 'audio',
    ogg: 'audio',
    flac: 'audio',

    // Meshes
    gltf: 'mesh',
    glb: 'mesh',
    obj: 'mesh',
    fbx: 'mesh',

    // Fonts
    ttf: 'font',
    otf: 'font',
    woff: 'font',
    woff2: 'font',

    // Scenes
    ron: 'scene',
    scene: 'scene',

    // Shaders
    wgsl: 'shader',
    vert: 'shader',
    frag: 'shader',
    glsl: 'shader',

    // Materials
    material: 'material',
    mat: 'material',

    // Animations
    anim: 'animation',
    animation: 'animation',
  };

  return typeMap[ext] || 'binary';
}

// ============================================================================
// Asset Loading
// ============================================================================

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
export function loadBevyAsset<T = unknown>(
  path: string,
  options: {
    type?: BevyAssetType;
    priority?: 'high' | 'normal' | 'low';
    cache?: boolean;
  } = {}
): AssetHandle<T> {
  const { type = detectAssetType(path), cache = true } = options;

  // Check cache first
  if (cache && assetCache.has(path)) {
    return assetCache.get(path) as AssetHandle<T>;
  }

  // Create handle - use type assertion to satisfy exactOptionalPropertyTypes
  // since we're initializing with undefined values that will be set later
  const handle: AssetHandle<T> & {
    asset?: T;
    error?: Error;
  } = {
    path,
    type,
    state: 'pending' as const,
    isLoaded() {
      return this.state === 'loaded';
    },
    async wait(): Promise<T> {
      if (this.state === 'loaded') {
        return this.asset!;
      }
      if (this.state === 'error') {
        throw this.error;
      }

      return new Promise<T>((resolve, reject) => {
        const onLoad = (asset: unknown) => {
          resolve(asset as T);
          removeListeners();
        };
        const onError = (error: Error) => {
          reject(error);
          removeListeners();
        };
        const removeListeners = () => {
          loadListeners.get(path)?.delete(onLoad);
          errorListeners.get(path)?.delete(onError);
        };

        if (!loadListeners.has(path)) {
          loadListeners.set(path, new Set());
        }
        loadListeners.get(path)!.add(onLoad);

        if (!errorListeners.has(path)) {
          errorListeners.set(path, new Set());
        }
        errorListeners.get(path)!.add(onError);
      });
    },
  };

  // Cache the handle
  if (cache) {
    assetCache.set(path, handle);
  }

  // Start loading
  loadAsset(path, type, handle);

  return handle;
}

/**
 * Internal asset loading function
 */
async function loadAsset<T>(
  path: string,
  type: BevyAssetType,
  handle: AssetHandle<T>
): Promise<void> {
  // Check for pending load
  if (pendingLoads.has(path)) {
    try {
      const result = await pendingLoads.get(path);
      handle.asset = result as T;
      handle.state = 'loaded';
      notifyLoadListeners(path, result);
    } catch (error) {
      handle.error = error instanceof Error ? error : new Error(String(error));
      handle.state = 'error';
      notifyErrorListeners(path, handle.error);
    }
    return;
  }

  handle.state = 'loading';

  const loadPromise = (async () => {
    const response = await fetch(path);
    if (!response.ok) {
      throw new Error(`Failed to load asset: ${path} (${response.status})`);
    }

    // Store metadata - conditionally add lastModified to avoid exactOptionalPropertyTypes issue
    const lastModifiedHeader = response.headers.get('last-modified');
    const metadata: AssetMetadata = {
      path,
      type,
      size: parseInt(response.headers.get('content-length') || '0', 10),
      ...(lastModifiedHeader ? { lastModified: new Date(lastModifiedHeader).getTime() } : {}),
    };
    metadataCache.set(path, metadata);

    // Load based on type
    switch (type) {
      case 'texture':
        return loadTexture(response, path);
      case 'audio':
        return loadAudio(response);
      case 'mesh':
        return loadMesh(response, path);
      case 'font':
        return loadFont(response, path);
      case 'scene':
      case 'shader':
      case 'material':
        return response.text();
      case 'animation':
        return response.json();
      case 'binary':
      default:
        return response.arrayBuffer();
    }
  })();

  pendingLoads.set(path, loadPromise);

  try {
    const result = await loadPromise;
    handle.asset = result as T;
    handle.state = 'loaded';
    notifyLoadListeners(path, result);

    // Notify Bevy event listeners
    onBevyEvent('asset-loaded', () => {}); // Trigger internal tracking
  } catch (error) {
    handle.error = error instanceof Error ? error : new Error(String(error));
    handle.state = 'error';
    notifyErrorListeners(path, handle.error);
  } finally {
    pendingLoads.delete(path);
  }
}

/**
 * Load texture asset
 */
async function loadTexture(response: Response, path: string): Promise<ImageBitmap> {
  const blob = await response.blob();
  return createImageBitmap(blob);
}

/**
 * Load audio asset
 */
async function loadAudio(response: Response): Promise<AudioBuffer> {
  const arrayBuffer = await response.arrayBuffer();
  const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
  return audioContext.decodeAudioData(arrayBuffer);
}

/**
 * Load mesh asset (GLTF/GLB)
 */
async function loadMesh(response: Response, path: string): Promise<unknown> {
  const ext = path.split('.').pop()?.toLowerCase();
  if (ext === 'glb') {
    return response.arrayBuffer();
  }
  // For GLTF, return parsed JSON
  return response.json();
}

/**
 * Load font asset
 */
async function loadFont(response: Response, path: string): Promise<FontFace> {
  const arrayBuffer = await response.arrayBuffer();
  const fontName = path.split('/').pop()?.split('.')[0] || 'CustomFont';
  const font = new FontFace(fontName, arrayBuffer);
  await font.load();
  document.fonts.add(font);
  return font;
}

/**
 * Notify load listeners
 */
function notifyLoadListeners(path: string, asset: unknown): void {
  const listeners = loadListeners.get(path);
  if (listeners) {
    for (const listener of listeners) {
      listener(asset);
    }
    loadListeners.delete(path);
  }
}

/**
 * Notify error listeners
 */
function notifyErrorListeners(path: string, error: Error): void {
  const listeners = errorListeners.get(path);
  if (listeners) {
    for (const listener of listeners) {
      listener(error);
    }
    errorListeners.delete(path);
  }
}

// ============================================================================
// Preloading
// ============================================================================

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
export async function preloadAssets(
  paths: string[],
  options: {
    onProgress?: (loaded: number, total: number) => void;
    onError?: (path: string, error: Error) => void;
    continueOnError?: boolean;
  } = {}
): Promise<Map<string, AssetHandle<unknown>>> {
  const { onProgress, onError, continueOnError = true } = options;
  const results = new Map<string, AssetHandle<unknown>>();
  let loaded = 0;

  const loadPromises = paths.map(async (path) => {
    try {
      const handle = loadBevyAsset(path);
      await handle.wait();
      results.set(path, handle);
      loaded++;
      onProgress?.(loaded, paths.length);
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      onError?.(path, err);
      if (!continueOnError) {
        throw err;
      }
      results.set(path, {
        path,
        type: detectAssetType(path),
        state: 'error',
        error: err,
        isLoaded: () => false,
        wait: () => Promise.reject(err),
      });
    }
  });

  await Promise.all(loadPromises);
  return results;
}

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
export async function preloadAssetsWithPriority(
  assets: Array<{ path: string; priority: 'high' | 'normal' | 'low' }>
): Promise<void> {
  // Sort by priority
  const sorted = [...assets].sort((a, b) => {
    const priorityOrder = { high: 0, normal: 1, low: 2 };
    return priorityOrder[a.priority] - priorityOrder[b.priority];
  });

  // Group by priority
  const highPriority = sorted.filter((a) => a.priority === 'high');
  const normalPriority = sorted.filter((a) => a.priority === 'normal');
  const lowPriority = sorted.filter((a) => a.priority === 'low');

  // Load in order
  await preloadAssets(highPriority.map((a) => a.path));
  await preloadAssets(normalPriority.map((a) => a.path));
  await preloadAssets(lowPriority.map((a) => a.path));
}

// ============================================================================
// Cache Management
// ============================================================================

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
export function getCachedAsset<T = unknown>(path: string): AssetHandle<T> | undefined {
  return assetCache.get(path) as AssetHandle<T> | undefined;
}

/**
 * Check if asset is cached
 *
 * @param path - Asset path
 * @returns Whether the asset is cached
 */
export function isAssetCached(path: string): boolean {
  return assetCache.has(path);
}

/**
 * Check if asset is loaded
 *
 * @param path - Asset path
 * @returns Whether the asset is loaded
 */
export function isAssetLoaded(path: string): boolean {
  const cached = assetCache.get(path);
  return cached?.state === 'loaded';
}

/**
 * Get asset metadata
 *
 * @param path - Asset path
 * @returns Asset metadata or undefined
 */
export function getAssetMetadata(path: string): AssetMetadata | undefined {
  return metadataCache.get(path);
}

/**
 * Clear a specific asset from cache
 *
 * @param path - Asset path to clear
 */
export function clearAsset(path: string): void {
  assetCache.delete(path);
  metadataCache.delete(path);
}

/**
 * Clear all cached assets
 */
export function clearAssetCache(): void {
  assetCache.clear();
  metadataCache.clear();
  pendingLoads.clear();
  loadListeners.clear();
  errorListeners.clear();
}

/**
 * Get total size of cached assets
 *
 * @returns Total size in bytes
 */
export function getCacheSize(): number {
  let total = 0;
  for (const metadata of metadataCache.values()) {
    total += metadata.size || 0;
  }
  return total;
}

/**
 * Get number of cached assets
 *
 * @returns Number of cached assets
 */
export function getCacheCount(): number {
  return assetCache.size;
}

/**
 * Get all cached asset paths
 *
 * @returns Array of cached asset paths
 */
export function getCachedAssetPaths(): string[] {
  return Array.from(assetCache.keys());
}

// ============================================================================
// Asset Watching
// ============================================================================

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
export function watchAsset<T = unknown>(
  path: string,
  callback: (asset: T) => void
): () => void {
  // In development, we could use WebSocket to receive file change notifications
  // For now, we'll use polling as a fallback
  let lastModified: number | undefined;
  let intervalId: ReturnType<typeof setInterval> | null = null;

  const checkForChanges = async () => {
    try {
      const response = await fetch(path, { method: 'HEAD' });
      const modified = response.headers.get('last-modified');
      const currentModified = modified ? new Date(modified).getTime() : undefined;

      if (lastModified !== undefined && currentModified !== lastModified) {
        // Asset changed, reload it
        clearAsset(path);
        const handle = loadBevyAsset<T>(path);
        const asset = await handle.wait();
        callback(asset);
      }

      lastModified = currentModified;
    } catch (error) {
      console.warn(`Failed to check asset for changes: ${path}`, error);
    }
  };

  // Check immediately
  checkForChanges();

  // Then poll every 2 seconds in development
  if (process.env['NODE_ENV'] === 'development') {
    intervalId = setInterval(checkForChanges, 2000);
  }

  return () => {
    if (intervalId !== null) {
      clearInterval(intervalId);
    }
  };
}

// ============================================================================
// Asset Bundles
// ============================================================================

/**
 * Asset bundle definition
 */
export interface AssetBundle {
  name: string;
  assets: string[];
  loaded: boolean;
  handles: Map<string, AssetHandle<unknown>>;
}

/** Registered asset bundles */
const bundles = new Map<string, AssetBundle>();

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
export function defineAssetBundle(name: string, assets: string[]): AssetBundle {
  const bundle: AssetBundle = {
    name,
    assets,
    loaded: false,
    handles: new Map(),
  };
  bundles.set(name, bundle);
  return bundle;
}

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
export async function loadAssetBundle(
  name: string,
  onProgress?: (loaded: number, total: number) => void
): Promise<AssetBundle> {
  const bundle = bundles.get(name);
  if (!bundle) {
    throw new Error(`Asset bundle not found: ${name}`);
  }

  if (bundle.loaded) {
    return bundle;
  }

  const results = await preloadAssets(bundle.assets, onProgress ? { onProgress } : {});
  bundle.handles = results;
  bundle.loaded = true;

  return bundle;
}

/**
 * Unload an asset bundle
 *
 * @param name - Bundle name
 */
export function unloadAssetBundle(name: string): void {
  const bundle = bundles.get(name);
  if (!bundle) return;

  for (const path of bundle.assets) {
    clearAsset(path);
  }

  bundle.loaded = false;
  bundle.handles.clear();
}

/**
 * Get bundle by name
 *
 * @param name - Bundle name
 * @returns Bundle or undefined
 */
export function getAssetBundle(name: string): AssetBundle | undefined {
  return bundles.get(name);
}

/**
 * Check if bundle is loaded
 *
 * @param name - Bundle name
 * @returns Whether the bundle is loaded
 */
export function isBundleLoaded(name: string): boolean {
  return bundles.get(name)?.loaded || false;
}

// ============================================================================
// Streaming Assets
// ============================================================================

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
export async function streamAsset<T = ArrayBuffer>(
  path: string,
  onProgress: (progress: number) => void
): Promise<T> {
  const response = await fetch(path);
  if (!response.ok) {
    throw new Error(`Failed to stream asset: ${path}`);
  }

  const contentLength = parseInt(response.headers.get('content-length') || '0', 10);
  const reader = response.body?.getReader();

  if (!reader) {
    throw new Error('ReadableStream not supported');
  }

  const chunks: Uint8Array[] = [];
  let receivedLength = 0;

  while (true) {
    const { done, value } = await reader.read();

    if (done) break;

    chunks.push(value);
    receivedLength += value.length;

    if (contentLength > 0) {
      onProgress(receivedLength / contentLength);
    }
  }

  // Combine chunks
  const result = new Uint8Array(receivedLength);
  let position = 0;
  for (const chunk of chunks) {
    result.set(chunk, position);
    position += chunk.length;
  }

  return result.buffer as T;
}
