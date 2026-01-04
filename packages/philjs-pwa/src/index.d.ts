/**
 * @philjs/pwa - Zero-Config PWA Generation
 *
 * Automatic Progressive Web App generation.
 * NO OTHER FRAMEWORK provides zero-config PWA with all features.
 *
 * Features:
 * - Automatic service worker generation
 * - Web app manifest generation
 * - Install prompt handling
 * - Push notifications
 * - Background sync
 * - Periodic sync
 * - Share target API
 * - File handling API
 * - App shortcuts
 * - Badging API
 */
export interface PWAConfig {
    name: string;
    shortName?: string;
    description?: string;
    startUrl?: string;
    display?: 'fullscreen' | 'standalone' | 'minimal-ui' | 'browser';
    orientation?: 'any' | 'portrait' | 'landscape';
    themeColor?: string;
    backgroundColor?: string;
    icons?: PWAIcon[];
    screenshots?: PWAScreenshot[];
    shortcuts?: PWAShortcut[];
    categories?: string[];
    shareTarget?: PWAShareTarget;
    fileHandlers?: PWAFileHandler[];
    cacheStrategies?: CacheStrategy[];
    offlinePages?: string[];
    skipWaiting?: boolean;
    clientsClaim?: boolean;
}
export interface PWAIcon {
    src: string;
    sizes: string;
    type?: string;
    purpose?: 'any' | 'maskable' | 'monochrome';
}
export interface PWAScreenshot {
    src: string;
    sizes: string;
    type?: string;
    form_factor?: 'narrow' | 'wide';
    label?: string;
}
export interface PWAShortcut {
    name: string;
    shortName?: string;
    description?: string;
    url: string;
    icons?: PWAIcon[];
}
export interface PWAShareTarget {
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
}
export interface PWAFileHandler {
    action: string;
    accept: Record<string, string[]>;
    icons?: PWAIcon[];
    launchType?: 'single-client' | 'multiple-clients';
}
export interface CacheStrategy {
    urlPattern: string | RegExp;
    strategy: 'cache-first' | 'network-first' | 'stale-while-revalidate' | 'cache-only' | 'network-only';
    cacheName?: string;
    maxAge?: number;
    maxEntries?: number;
}
export interface InstallPromptEvent extends Event {
    prompt(): Promise<void>;
    userChoice: Promise<{
        outcome: 'accepted' | 'dismissed';
    }>;
}
export interface NotificationOptions {
    title: string;
    body?: string;
    icon?: string;
    badge?: string;
    tag?: string;
    renotify?: boolean;
    requireInteraction?: boolean;
    silent?: boolean;
    data?: any;
    actions?: Array<{
        action: string;
        title: string;
        icon?: string;
    }>;
}
export interface PWAState {
    installed: boolean;
    installable: boolean;
    updateAvailable: boolean;
    online: boolean;
    pushEnabled: boolean;
}
export declare class ManifestGenerator {
    private config;
    constructor(config: PWAConfig);
    generate(): Record<string, any>;
    private generateDefaultIcons;
    toJSON(): string;
    inject(): void;
    private addIOSMeta;
}
export declare class ServiceWorkerGenerator {
    private config;
    constructor(config: PWAConfig);
    generate(): string;
    register(): Promise<ServiceWorkerRegistration | null>;
}
export declare class PWAManager {
    private config;
    private manifestGenerator;
    private swGenerator;
    private installPrompt;
    private registration;
    private listeners;
    private state;
    constructor(config: PWAConfig);
    private setupEventListeners;
    init(): Promise<void>;
    install(): Promise<boolean>;
    update(): Promise<void>;
    requestNotificationPermission(): Promise<boolean>;
    subscribeToPush(vapidPublicKey: string): Promise<PushSubscription | null>;
    showNotification(options: NotificationOptions): Promise<void>;
    setBadge(count?: number): Promise<void>;
    registerBackgroundSync(tag: string): Promise<boolean>;
    registerPeriodicSync(tag: string, minInterval: number): Promise<boolean>;
    getState(): PWAState;
    on(event: string, callback: (...args: any[]) => void): () => void;
    private emit;
    private urlBase64ToUint8Array;
}
/**
 * Hook for PWA functionality
 */
export declare function usePWA(config: PWAConfig): {
    state: PWAState;
    install: () => Promise<boolean>;
    update: () => Promise<void>;
    showNotification: (options: NotificationOptions) => Promise<void>;
    setBadge: (count?: number) => Promise<void>;
    requestNotificationPermission: () => Promise<boolean>;
    subscribeToPush: (vapidKey: string) => Promise<PushSubscription | null>;
};
/**
 * Hook for install prompt
 */
export declare function useInstallPrompt(): {
    canInstall: boolean;
    isInstalled: boolean;
    install: () => Promise<boolean>;
};
/**
 * Hook for online status
 */
export declare function useOnlineStatus(): boolean;
export declare function pwaPlugin(config: PWAConfig): any;
declare const _default: {
    ManifestGenerator: typeof ManifestGenerator;
    ServiceWorkerGenerator: typeof ServiceWorkerGenerator;
    PWAManager: typeof PWAManager;
    pwaPlugin: typeof pwaPlugin;
    usePWA: typeof usePWA;
    useInstallPrompt: typeof useInstallPrompt;
    useOnlineStatus: typeof useOnlineStatus;
};
export default _default;
//# sourceMappingURL=index.d.ts.map