/**
 * Type definitions for PWA plugin
 */
export type CacheStrategy = 'cache-first' | 'network-first' | 'cache-only' | 'network-only' | 'stale-while-revalidate';
export interface CacheRule {
    pattern: RegExp | string;
    strategy: CacheStrategy;
    cacheName?: string;
    maxAge?: number;
    maxEntries?: number;
    networkTimeout?: number;
}
export interface ServiceWorkerConfig {
    /**
     * Service worker file name
     */
    fileName?: string;
    /**
     * Cache name prefix
     */
    cachePrefix?: string;
    /**
     * Cache version
     */
    cacheVersion?: string;
    /**
     * Files to precache
     */
    precache?: string[];
    /**
     * Runtime caching rules
     */
    runtimeCaching?: CacheRule[];
    /**
     * Whether to skip waiting on install
     */
    skipWaiting?: boolean;
    /**
     * Whether to claim clients on activate
     */
    clientsClaim?: boolean;
    /**
     * Whether to enable navigation preload
     */
    navigationPreload?: boolean;
    /**
     * Offline fallback page
     */
    offlineFallback?: string;
    /**
     * Background sync options
     */
    backgroundSync?: {
        enabled: boolean;
        queueName?: string;
    };
}
export interface ManifestIcon {
    src: string;
    sizes: string;
    type?: string;
    purpose?: 'any' | 'maskable' | 'monochrome';
}
export interface ManifestScreenshot {
    src: string;
    sizes: string;
    type?: string;
    form_factor?: 'narrow' | 'wide';
    label?: string;
}
export interface WebAppManifest {
    name: string;
    short_name?: string;
    description?: string;
    start_url: string;
    display?: 'fullscreen' | 'standalone' | 'minimal-ui' | 'browser';
    orientation?: 'any' | 'natural' | 'landscape' | 'portrait';
    theme_color?: string;
    background_color?: string;
    scope?: string;
    icons?: ManifestIcon[];
    screenshots?: ManifestScreenshot[];
    categories?: string[];
    share_target?: {
        action: string;
        method?: 'GET' | 'POST';
        enctype?: string;
        params: {
            title?: string;
            text?: string;
            url?: string;
            files?: Array<{
                name: string;
                accept: string[];
            }>;
        };
    };
    shortcuts?: Array<{
        name: string;
        short_name?: string;
        description?: string;
        url: string;
        icons?: ManifestIcon[];
    }>;
    prefer_related_applications?: boolean;
    related_applications?: Array<{
        platform: string;
        url: string;
        id?: string;
    }>;
}
export interface InstallPromptEvent extends Event {
    prompt: () => Promise<void>;
    userChoice: Promise<{
        outcome: 'accepted' | 'dismissed';
    }>;
}
export interface SyncEvent extends Event {
    tag: string;
    lastChance: boolean;
    waitUntil(promise: Promise<any>): void;
}
export interface BackgroundSyncOptions {
    tag: string;
    minInterval?: number;
}
export interface UpdateCheckResult {
    hasUpdate: boolean;
    version?: string;
    releaseNotes?: string;
}
export interface PWAConfig {
    serviceWorker?: ServiceWorkerConfig;
    manifest?: WebAppManifest;
    installPrompt?: {
        enabled: boolean;
        deferredPrompt?: boolean;
        customUI?: boolean;
    };
    updateNotifications?: {
        enabled: boolean;
        checkInterval?: number;
        autoReload?: boolean;
    };
    offlineSupport?: {
        enabled: boolean;
        offlinePage?: string;
        offlineMessage?: string;
    };
}
//# sourceMappingURL=types.d.ts.map